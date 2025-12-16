// backend/services/rentalsService.js
const pool = require('../config/db');

// Şimdilik sabit bir iskele noktası (Van Gölü orta civarı)
const DOCK_LON = 42.90;
const DOCK_LAT = 38.60;

// 🔹 Tekne kiralama başlat
exports.createBoatRental = async ({ userId, boatId, durationMinutes = 60 }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const boatRes = await client.query(
            `SELECT boat_id, status, current_geom FROM boats WHERE boat_id = $1 FOR UPDATE;`,
            [boatId]
        );
        if (boatRes.rowCount === 0) throw new Error('Boat not found');

        const boat = boatRes.rows[0];
        if (boat.status !== 'available') throw new Error('Boat is not available');

        if (!boat.current_geom) {
            await client.query(
                `UPDATE boats
         SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
         WHERE boat_id = $3;`,
                [DOCK_LON, DOCK_LAT, boatId]
            );
        }

        const safeDuration =
            typeof durationMinutes === 'number' && Number.isFinite(durationMinutes)
                ? durationMinutes
                : 60;

        const rentalRes = await client.query(
            `INSERT INTO rentals (user_id, boat_id, start_at, end_at, status)
       VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::interval, 'ongoing')
       RETURNING rental_id, user_id, boat_id, start_at, end_at, status;`,
            [userId, boatId, safeDuration]
        );

        await client.query(`UPDATE boats SET status = 'rented' WHERE boat_id = $1;`, [boatId]);

        await client.query('COMMIT');
        return rentalRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// 🔹 Kiralamayı bitir, tekneyi iskeleye döndür ve FİYAT HESAPLA
exports.completeBoatRental = async ({ userId, rentalId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const rentalRes = await client.query(
            `UPDATE rentals
       SET status = 'completed', end_at = NOW()
       WHERE rental_id = $1 AND user_id = $2 AND status = 'ongoing'
       RETURNING rental_id, boat_id, start_at, end_at,
       EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId, userId]
        );

        if (rentalRes.rowCount === 0) {
            throw new Error('Devam eden kiralama bulunamadı (veya size ait değil).');
        }

        const rental = rentalRes.rows[0];
        const durationHours = Math.ceil(rental.duration_seconds / 3600);

        const boatRes = await client.query(
            'SELECT price_per_hour FROM boats WHERE boat_id = $1',
            [rental.boat_id]
        );
        const pricePerHour = parseFloat(boatRes.rows[0]?.price_per_hour || 50);
        const totalPrice = durationHours * pricePerHour;

        await client.query(
            `UPDATE boats
       SET status = 'available',
           current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
       WHERE boat_id = $3;`,
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
exports.createEquipmentRental = async ({ userId, equipmentId, durationMinutes = 60 }) => {
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
            [userId, equipmentId, safeDuration]
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
exports.completeEquipmentRental = async ({ userId, rentalId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const rentalRes = await client.query(
            `UPDATE equipment_rentals
       SET status = 'completed', end_at = NOW()
       WHERE equipment_rental_id = $1 AND user_id = $2 AND status = 'ongoing'
       RETURNING equipment_rental_id, equipment_id, start_at, end_at,
       EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId, userId]
        );

        if (rentalRes.rowCount === 0) {
            throw new Error('Devam eden kiralama bulunamadı (veya size ait değil).');
        }

        const rental = rentalRes.rows[0];
        const durationHours = Math.ceil(rental.duration_seconds / 3600);

        const equipRes = await client.query(
            'SELECT price_per_hour FROM equipments WHERE equipment_id = $1',
            [rental.equipment_id]
        );
        const pricePerHour = parseFloat(equipRes.rows[0]?.price_per_hour || 10);
        const totalPrice = durationHours * pricePerHour;

        await client.query(
            `UPDATE equipments SET status = 'available' WHERE equipment_id = $1`,
            [rental.equipment_id]
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


// 🔹 Kullanıcının aktif tekne kiralamalarını getir (maliyet bilgisiyle)
exports.getMyActiveBoatRentals = async (userId) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                r.rental_id,
                r.start_at,
                r.status,
                b.boat_id,
                b.name as boat_name,
                b.price_per_hour
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            WHERE r.user_id = $1 
              AND r.status = 'ongoing'
            ORDER BY r.start_at DESC;
        `;
        const { rows } = await client.query(query, [userId]);
        return rows;
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
                e.price_per_hour,
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

// 🔹 Admin: Tüm aktif kiralamaları getir (tekne + ekipman)
exports.getAllActiveRentals = async () => {
    const client = await pool.connect();
    try {
        // Tekne kiralamaları
        const boatRentalsQuery = `
            SELECT 
                r.rental_id,
                r.user_id,
                r.boat_id,
                r.start_at,
                r.status,
                'boat' as rental_type,
                b.name as item_name,
                b.price_per_hour,
                u.full_name as user_name,
                u.email as user_email
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status = 'ongoing'
            ORDER BY r.start_at DESC;
        `;

        // Ekipman kiralamaları
        const equipmentRentalsQuery = `
            SELECT 
                er.equipment_rental_id as rental_id,
                er.user_id,
                er.equipment_id as boat_id,
                er.start_at,
                er.status,
                'equipment' as rental_type,
                CONCAT(e.brand, ' ', e.model) as item_name,
                e.price_per_hour,
                u.full_name as user_name,
                u.email as user_email
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            JOIN users u ON er.user_id = u.user_id
            WHERE er.status = 'ongoing'
            ORDER BY er.start_at DESC;
        `;

        const [boatRentals, equipmentRentals] = await Promise.all([
            client.query(boatRentalsQuery),
            client.query(equipmentRentalsQuery)
        ]);

        return {
            boats: boatRentals.rows,
            equipment: equipmentRentals.rows
        };
    } finally {
        client.release();
    }
};

// 🔹 Admin: Herhangi bir kiralamayı kapat
exports.closeRental = async ({ rentalId, rentalType }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (rentalType === 'boat') {
            // Tekne kiralamasını kapat
            const rentalRes = await client.query(
                `UPDATE rentals
                 SET status = 'completed', end_at = NOW()
                 WHERE rental_id = $1 AND status = 'ongoing'
                 RETURNING rental_id, boat_id, start_at, end_at,
                 EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
                [rentalId]
            );

            if (rentalRes.rowCount === 0) {
                throw new Error('Devam eden tekne kiralama bulunamadı.');
            }

            const rental = rentalRes.rows[0];
            const durationHours = Math.ceil(rental.duration_seconds / 3600);

            const boatRes = await client.query(
                'SELECT price_per_hour FROM boats WHERE boat_id = $1',
                [rental.boat_id]
            );
            const pricePerHour = parseFloat(boatRes.rows[0]?.price_per_hour || 50);
            const totalPrice = durationHours * pricePerHour;

            await client.query(
                `UPDATE boats
                 SET status = 'available',
                     current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
                 WHERE boat_id = $3;`,
                [DOCK_LON, DOCK_LAT, rental.boat_id]
            );

            await client.query('COMMIT');
            return { ...rental, total_price: totalPrice, duration_hours: durationHours, rental_type: 'boat' };
        } else if (rentalType === 'equipment') {
            // Ekipman kiralamasını kapat
            const rentalRes = await client.query(
                `UPDATE equipment_rentals
                 SET status = 'completed', end_at = NOW()
                 WHERE equipment_rental_id = $1 AND status = 'ongoing'
                 RETURNING equipment_rental_id, equipment_id, start_at, end_at,
                 EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
                [rentalId]
            );

            if (rentalRes.rowCount === 0) {
                throw new Error('Devam eden ekipman kiralama bulunamadı.');
            }

            const rental = rentalRes.rows[0];
            const durationHours = Math.ceil(rental.duration_seconds / 3600);

            const equipRes = await client.query(
                'SELECT price_per_hour FROM equipments WHERE equipment_id = $1',
                [rental.equipment_id]
            );
            const pricePerHour = parseFloat(equipRes.rows[0]?.price_per_hour || 10);
            const totalPrice = durationHours * pricePerHour;

            await client.query(
                `UPDATE equipments SET status = 'available' WHERE equipment_id = $1`,
                [rental.equipment_id]
            );

            await client.query('COMMIT');
            return { ...rental, total_price: totalPrice, duration_hours: durationHours, rental_type: 'equipment' };
        } else {
            throw new Error('Geçersiz kiralama tipi');
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Admin: Geçmiş kiralamaları getir (filtreleme ile)
exports.getCompletedRentals = async ({ userName, startDate, endDate, rentalType = 'all' }) => {
    const client = await pool.connect();
    try {
        let boatQuery = `
            SELECT 
                r.rental_id,
                r.user_id,
                r.boat_id as item_id,
                r.start_at,
                r.end_at,
                r.status,
                'boat' as rental_type,
                b.name as item_name,
                b.price_per_hour,
                u.full_name as user_name,
                u.email as user_email,
                EXTRACT(EPOCH FROM (r.end_at - r.start_at)) / 3600 as duration_hours
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status = 'completed'
        `;
        
        let equipmentQuery = `
            SELECT 
                er.equipment_rental_id as rental_id,
                er.user_id,
                er.equipment_id as item_id,
                er.start_at,
                er.end_at,
                er.status,
                'equipment' as rental_type,
                CONCAT(e.brand, ' ', e.model) as item_name,
                e.price_per_hour,
                u.full_name as user_name,
                u.email as user_email,
                EXTRACT(EPOCH FROM (er.end_at - er.start_at)) / 3600 as duration_hours
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            JOIN users u ON er.user_id = u.user_id
            WHERE er.status = 'completed'
        `;

        const boatParams = [];
        const equipmentParams = [];
        let boatParamCount = 0;
        let equipmentParamCount = 0;

        // Kullanıcı adı filtresi
        if (userName && userName.trim()) {
            boatParamCount++;
            equipmentParamCount++;
            boatQuery += ` AND LOWER(u.full_name) LIKE LOWER($${boatParamCount})`;
            equipmentQuery += ` AND LOWER(u.full_name) LIKE LOWER($${equipmentParamCount})`;
            const userNamePattern = `%${userName.trim()}%`;
            boatParams.push(userNamePattern);
            equipmentParams.push(userNamePattern);
        }

        // Tarih filtreleri
        if (startDate) {
            boatParamCount++;
            equipmentParamCount++;
            boatQuery += ` AND r.start_at >= $${boatParamCount}`;
            equipmentQuery += ` AND er.start_at >= $${equipmentParamCount}`;
            boatParams.push(startDate);
            equipmentParams.push(startDate);
        }

        if (endDate) {
            boatParamCount++;
            equipmentParamCount++;
            boatQuery += ` AND r.end_at <= $${boatParamCount}`;
            equipmentQuery += ` AND er.end_at <= $${equipmentParamCount}`;
            boatParams.push(endDate);
            equipmentParams.push(endDate);
        }

        boatQuery += ` ORDER BY r.end_at DESC`;
        equipmentQuery += ` ORDER BY er.end_at DESC`;

        const queries = [];
        const params = [];

        if (rentalType === 'all' || rentalType === 'boat') {
            queries.push({ query: boatQuery, params: boatParams });
        }
        if (rentalType === 'all' || rentalType === 'equipment') {
            queries.push({ query: equipmentQuery, params: equipmentParams });
        }

        const results = await Promise.all(queries.map(q => client.query(q.query, q.params)));

        let allRentals = [];
        results.forEach(result => {
            allRentals = allRentals.concat(result.rows.map(row => ({
                ...row,
                duration_hours: Math.ceil(parseFloat(row.duration_hours) || 0),
                total_price: Math.ceil(parseFloat(row.duration_hours) || 0) * parseFloat(row.price_per_hour || 0)
            })));
        });

        // Tüm kiralamaları bitiş tarihine göre sırala
        allRentals.sort((a, b) => new Date(b.end_at) - new Date(a.end_at));

        return allRentals;
    } catch (err) {
        console.error('getCompletedRentals hatası:', err);
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Admin: Aylık kazancı hesapla
exports.getMonthlyRevenue = async ({ year, month }) => {
    const client = await pool.connect();
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Ayın son günü

        // Tekne kazancı
        const boatRevenueQuery = `
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(
                    CEIL(EXTRACT(EPOCH FROM (r.end_at - r.start_at)) / 3600) * b.price_per_hour
                ), 0) as total_revenue
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            WHERE r.status = 'completed'
                AND DATE_TRUNC('month', r.end_at) = DATE_TRUNC('month', $1::date)
        `;

        // Ekipman kazancı
        const equipmentRevenueQuery = `
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(
                    CEIL(EXTRACT(EPOCH FROM (er.end_at - er.start_at)) / 3600) * e.price_per_hour
                ), 0) as total_revenue
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            WHERE er.status = 'completed'
                AND DATE_TRUNC('month', er.end_at) = DATE_TRUNC('month', $1::date)
        `;

        const [boatResult, equipmentResult] = await Promise.all([
            client.query(boatRevenueQuery, [startDate]),
            client.query(equipmentRevenueQuery, [startDate])
        ]);

        const boats = {
            count: parseInt(boatResult.rows[0]?.count || 0),
            total_revenue: parseFloat(boatResult.rows[0]?.total_revenue || 0)
        };

        const equipment = {
            count: parseInt(equipmentResult.rows[0]?.count || 0),
            total_revenue: parseFloat(equipmentResult.rows[0]?.total_revenue || 0)
        };

        return {
            boats,
            equipment,
            total_revenue: boats.total_revenue + equipment.total_revenue
        };
    } catch (err) {
        console.error('getMonthlyRevenue hatası:', err);
        throw err;
    } finally {
        client.release();
    }
};