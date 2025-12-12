// backend/services/rentalsService.js
const pool = require('../config/db');

// Şimdilik sabit bir iskele noktası (Van Gölü orta civarı)
const DOCK_LON = 42.90;
const DOCK_LAT = 38.60;

// 🔹 Tekne kiralama başlat
exports.createBoatRental = async ({ boatId, durationMinutes = 60 }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1) Tekneyi kilitle ve uygun mu kontrol et
        const boatRes = await client.query(
            `SELECT boat_id, status, current_geom FROM boats WHERE boat_id = $1 FOR UPDATE;`,
            [boatId]
        );

        if (boatRes.rowCount === 0) throw new Error('Boat not found');
        const boat = boatRes.rows[0];

        if (boat.status !== 'available') throw new Error('Boat is not available');

        // 2) current_geom boşsa iskeleye koy
        if (!boat.current_geom) {
            await client.query(
                `UPDATE boats SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE boat_id = $3;`,
                [DOCK_LON, DOCK_LAT, boatId]
            );
        }

        const safeDuration = typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) ? durationMinutes : 60;

        // 3) Kiralama kaydı oluştur (user_id = 1 demo)
        const rentalRes = await client.query(
            `INSERT INTO rentals (user_id, boat_id, start_at, end_at, status)
             VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::interval, 'ongoing')
             RETURNING rental_id, user_id, boat_id, start_at, end_at, status;`,
            [1, boatId, safeDuration]
        );

        const rental = rentalRes.rows[0];

        // 4) Teknenin durumunu rented yap
        await client.query(`UPDATE boats SET status = 'rented' WHERE boat_id = $1;`, [boatId]);

        await client.query('COMMIT');
        return rental;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Kiralamayı bitir, tekneyi iskeleye döndür ve FİYAT HESAPLA
exports.completeBoatRental = async (rentalId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1) Kiralamayı bitir ve süreyi al
        const rentalRes = await client.query(
            `UPDATE rentals
             SET status = 'completed', end_at = NOW()
             WHERE rental_id = $1 AND status = 'ongoing'
             RETURNING rental_id, boat_id, start_at, end_at, 
             EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId]
        );

        if (rentalRes.rowCount === 0) throw new Error('Devam eden kiralama bulunamadı');

        const rental = rentalRes.rows[0];
        const durationHours = Math.ceil(rental.duration_seconds / 3600); // Yukarı yuvarla

        // 2) Teknenin saatlik ücretini öğren
        const boatRes = await client.query('SELECT price_per_hour FROM boats WHERE boat_id = $1', [rental.boat_id]);
        const pricePerHour = boatRes.rows[0]?.price_per_hour || 50; 
        
        const totalPrice = durationHours * pricePerHour;

        // 3) Tekneyi iskeleye çek ve available yap
        await client.query(
            `UPDATE boats SET status = 'available', current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE boat_id = $3;`,
            [DOCK_LON, DOCK_LAT, rental.boat_id]
        );

        await client.query('COMMIT');
        return { ...rental, total_price: totalPrice, duration_hours: durationHours };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Ekipman kiralama başlat (BU FONKSİYON EKSİKTİ!)
exports.createEquipmentRental = async ({ equipmentId, durationMinutes = 60 }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1) Ekipmanı kilitle ve uygun mu kontrol et
        const equipmentRes = await client.query(
            `SELECT equipment_id, status FROM equipments WHERE equipment_id = $1 FOR UPDATE;`,
            [equipmentId]
        );

        if (equipmentRes.rowCount === 0) throw new Error('Equipment not found');
        const equipment = equipmentRes.rows[0];

        if (equipment.status !== 'available') throw new Error('Equipment is not available');

        // 2) Devam eden bir kiralama var mı kontrol et (Aynı ekipman için)
        const ongoingRental = await client.query(
            `SELECT equipment_rental_id FROM equipment_rentals WHERE equipment_id = $1 AND status = 'ongoing';`,
            [equipmentId]
        );

        if (ongoingRental.rowCount > 0) throw new Error('Equipment is already rented');

        const safeDuration = typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) ? durationMinutes : 60;

        // 3) Kiralama kaydı oluştur (user_id = 1 demo)
        const rentalRes = await client.query(
            `INSERT INTO equipment_rentals (user_id, equipment_id, start_at, end_at, status)
             VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::interval, 'ongoing')
             RETURNING equipment_rental_id, user_id, equipment_id, start_at, end_at, status;`,
            [1, equipmentId, safeDuration]
        );

        const rental = rentalRes.rows[0];

        // 4) Ekipmanın durumunu rented yap
        await client.query(`UPDATE equipments SET status = 'rented' WHERE equipment_id = $1;`, [equipmentId]);

        await client.query('COMMIT');
        return rental;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Ekipman kiralamayı bitir ve FİYAT HESAPLA
exports.completeEquipmentRental = async (rentalId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1) Kiralamayı bitir
        const rentalRes = await client.query(
            `UPDATE equipment_rentals
             SET status = 'completed', end_at = NOW()
             WHERE equipment_rental_id = $1 AND status = 'ongoing'
             RETURNING equipment_rental_id, equipment_id, start_at, end_at,
             EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId]
        );

        if (rentalRes.rowCount === 0) throw new Error('Devam eden kiralama bulunamadı');

        const rental = rentalRes.rows[0];
        const durationHours = Math.ceil(rental.duration_seconds / 3600); // 1 sn bile olsa 1 saat sayar

        // 2) Ekipmanın saatlik ücretini öğren
        const equipRes = await client.query('SELECT price_per_hour FROM equipments WHERE equipment_id = $1', [rental.equipment_id]);
        
        // parseFloat ile garantiye alıyoruz
        const pricePerHour = parseFloat(equipRes.rows[0]?.price_per_hour || 10);
        
        const totalPrice = durationHours * pricePerHour;

        console.log(`--- TEKLİ İADE ---`);
        console.log(`Süre: ${rental.duration_seconds} sn -> ${durationHours} saat`);
        console.log(`Birim: ${pricePerHour} ₺ -> Toplam: ${totalPrice} ₺`);

        // 3) Ekipmanı available yap
        await client.query(`UPDATE equipments SET status = 'available' WHERE equipment_id = $1`, [rental.equipment_id]);

        await client.query('COMMIT');
        return { ...rental, total_price: totalPrice, duration_hours: durationHours };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Kullanıcının aktif ekipman kiralamalarını getir
exports.getMyActiveEquipmentRentals = async (userId) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                er.equipment_rental_id,
                er.start_at,
                er.status,
                e.equipment_id,
                e.brand,
                e.model,
                et.name as type_name
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            LEFT JOIN equipment_types et ON e.type_id = et.type_id
            WHERE er.user_id = $1 
              AND er.status = 'ongoing'
            ORDER BY er.start_at DESC;
        `;
        const { rows } = await client.query(query, [userId]);
        return rows;
    } finally {
        client.release();
    }
};

// 🔹 Kullanıcının üzerindeki TÜM ekipmanları iade et
exports.returnAllMyEquipment = async (userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Kiralamaları ve fiyatları çek
        const findQuery = `
            SELECT 
                er.equipment_rental_id,
                er.equipment_id,
                er.start_at,
                NOW() as end_at,
                e.price_per_hour,
                e.brand,
                e.model
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            WHERE er.user_id = $1 AND er.status = 'ongoing'
            FOR UPDATE;
        `;
        const { rows: rentals } = await client.query(findQuery, [userId]);

        if (rentals.length === 0) {
            await client.query('ROLLBACK');
            return { count: 0, total_price: 0 };
        }

        let total_price = 0;
        const equipmentIds = [];

        console.log(`--- TOPLU İADE HESAPLAMASI (User: ${userId}) ---`);

        // 2. Döngüyle fiyat hesapla
        for (const rental of rentals) {
            // Süreyi saniye cinsinden bul
            const start = new Date(rental.start_at).getTime();
            const end = new Date(rental.end_at).getTime();
            const durationSeconds = (end - start) / 1000;
            
            // Saat hesapla (Yukarı yuvarla: 1 dk -> 1 saat)
            // Eğer dakika bazlı istersen burayı: Math.ceil(durationSeconds / 60) yapmalısın.
            const durationHours = Math.ceil(durationSeconds / 3600); 

            // Fiyatı Sayıya Çevir (ÖNEMLİ: String gelirse patlamasın)
            const unitPrice = parseFloat(rental.price_per_hour);
            const itemTotal = durationHours * unitPrice;

            // Debug Logu (Terminalde göreceksin)
            console.log(`Ürün: ${rental.brand} ${rental.model}`);
            console.log(`⏱️ Süre: ${durationSeconds.toFixed(0)} sn -> ${durationHours} saat sayıldı.`);
            console.log(`💰 Birim Fiyat: ${unitPrice} ₺ | Tutar: ${itemTotal} ₺`);
            console.log('--------------------------------');

            total_price += itemTotal;
            equipmentIds.push(rental.equipment_id);
        }

        console.log(`✅ GENEL TOPLAM: ${total_price} ₺`);

        // 3. Status Update (Rentals)
        await client.query(`
            UPDATE equipment_rentals 
            SET status = 'completed', end_at = NOW() 
            WHERE user_id = $1 AND status = 'ongoing'
        `, [userId]);

        // 4. Status Update (Equipments)
        await client.query(`
            UPDATE equipments 
            SET status = 'available' 
            WHERE equipment_id = ANY($1::int[])
        `, [equipmentIds]);

        await client.query('COMMIT');

        return {
            count: rentals.length,
            total_price: total_price
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};