// backend/services/rentalsService.js
const pool = require('../config/db');

// Şimdilik sabit bir iskele noktası (Van Gölü orta civarı)
const DOCK_LON = 42.90;
const DOCK_LAT = 38.60;

// 🔹 Fiyat Hesaplama Fonksiyonu (Ortak)
const calculatePrice = (durationSeconds, pricePerHour) => {
    const durationHours = Math.ceil(durationSeconds / 3600);
    const totalPrice = durationHours * pricePerHour;
    return { durationHours, totalPrice };
};

// ========================================
// 🚤 TEKNE KİRALAMA FONKSİYONLARI
// ========================================

// 🔹 Tekne kiralama başlat
exports.createBoatRental = async ({ userId, boatId, durationMinutes = 60 }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Tekneyi kilitle ve kontrol et
        const boatRes = await client.query(
            `SELECT boat_id, status, current_geom, price_per_hour FROM boats WHERE boat_id = $1 FOR UPDATE;`,
            [boatId]
        );
        if (boatRes.rowCount === 0) {
            throw new Error('Tekne bulunamadı');
        }

        const boat = boatRes.rows[0];
        if (boat.status !== 'available') {
            throw new Error('Tekne müsait değil');
        }

        // 2. Eğer current_geom yoksa iskeleye yerleştir
        if (!boat.current_geom) {
            await client.query(
                `UPDATE boats
                 SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
                 WHERE boat_id = $3;`,
                [DOCK_LON, DOCK_LAT, boatId]
            );
        }

        // 3. Süreyi güvenli hale getir
        const safeDuration = typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) 
            ? durationMinutes 
            : 60;

        // 4. Kiralama kaydı oluştur
        const rentalRes = await client.query(
            `INSERT INTO rentals (user_id, boat_id, start_at, end_at, status)
             VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::interval, 'ongoing')
             RETURNING rental_id, user_id, boat_id, start_at, end_at, status;`,
            [userId, boatId, safeDuration]
        );

        // 5. Tekneyi kirala
        await client.query(
            `UPDATE boats SET status = 'rented' WHERE boat_id = $1;`, 
            [boatId]
        );

        await client.query('COMMIT');
        
        const rental = rentalRes.rows[0];
        return {
            ...rental,
            boat_name: boat.name || `Tekne #${boatId}`,
            price_per_hour: parseFloat(boat.price_per_hour)
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Tekne kiralamayı bitir ve ÖDEME KAYDET
exports.completeBoatRental = async ({ userId, rentalId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Kiralamayı bitir ve süreyi al
        const rentalRes = await client.query(
            `UPDATE rentals 
             SET status = 'completed', end_at = NOW()
             WHERE rental_id = $1 AND user_id = $2 AND status = 'ongoing'
             RETURNING rental_id, boat_id, start_at, end_at, 
                       EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId, userId]
        );

        if (rentalRes.rowCount === 0) {
            throw new Error('Kiralama bulunamadı veya size ait değil');
        }

        const rental = rentalRes.rows[0];

        // 2. Tekne fiyatını al ve hesapla
        const boatRes = await client.query(
            'SELECT price_per_hour, name FROM boats WHERE boat_id = $1', 
            [rental.boat_id]
        );
        const boat = boatRes.rows[0];
        const pricePerHour = parseFloat(boat?.price_per_hour || 50);
        
        const { durationHours, totalPrice } = calculatePrice(rental.duration_seconds, pricePerHour);

        // 3. Tekneyi müsait yap ve iskeleye çek
        await client.query(
            `UPDATE boats 
             SET status = 'available', 
                 current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) 
             WHERE boat_id = $3;`,
            [DOCK_LON, DOCK_LAT, rental.boat_id]
        );

        // 4. ✅ ÖDEMEYİ KAYDET (PAYMENTS TABLOSUNA)
        await client.query(
            `INSERT INTO payments (rental_id, amount, method, paid_at)
             VALUES ($1, $2, 'card', NOW())`,
            [rentalId, totalPrice]
        );

        await client.query('COMMIT');
        
        return { 
            ...rental,
            boat_name: boat?.name || `Tekne #${rental.boat_id}`,
            total_price: totalPrice, 
            duration_hours: durationHours, 
            duration_str: `${durationHours} saat` 
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Kullanıcının aktif tekne kiralamalarını getir
exports.getMyActiveBoatRentals = async (userId) => {
    const result = await pool.query(
        `SELECT 
            r.rental_id,
            r.boat_id,
            r.start_at,
            r.end_at,
            r.status,
            b.name as boat_name,
            b.price_per_hour,
            EXTRACT(EPOCH FROM (GREATEST(r.end_at, NOW()) - r.start_at)) as duration_seconds,
            CASE 
                WHEN NOW() > r.end_at THEN 'expired'
                ELSE 'active'
            END as rental_status
         FROM rentals r
         JOIN boats b ON r.boat_id = b.boat_id
         WHERE r.user_id = $1 AND r.status = 'ongoing'
         ORDER BY r.start_at DESC;`,
        [userId]
    );

    return result.rows.map(row => {
        const pricePerHour = parseFloat(row.price_per_hour || 50);
        const { durationHours, totalPrice } = calculatePrice(row.duration_seconds, pricePerHour);
        
        return {
            ...row,
            duration_hours: durationHours,
            estimated_price: totalPrice,
            price_per_hour: pricePerHour
        };
    });
};

// ========================================
// 🎣 EKİPMAN KİRALAMA FONKSİYONLARI
// ========================================

// 🔹 Ekipman kiralama başlat
exports.createEquipmentRental = async ({ userId, equipmentId, durationMinutes = 60 }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Ekipmanı kilitle ve kontrol et
        const equipmentRes = await client.query(
            `SELECT equipment_id, status, brand, model, price_per_hour 
             FROM equipments 
             WHERE equipment_id = $1 FOR UPDATE;`,
            [equipmentId]
        );

        if (equipmentRes.rowCount === 0) {
            throw new Error('Ekipman bulunamadı');
        }

        const equipment = equipmentRes.rows[0];
        if (equipment.status !== 'available') {
            throw new Error('Ekipman müsait değil');
        }

        // 2. Devam eden kiralama var mı kontrol et
        const ongoingRental = await client.query(
            `SELECT equipment_rental_id FROM equipment_rentals 
             WHERE equipment_id = $1 AND status = 'ongoing';`,
            [equipmentId]
        );

        if (ongoingRental.rowCount > 0) {
            throw new Error('Ekipman zaten kiralanmış');
        }

        // 3. Süreyi güvenli hale getir
        const safeDuration = typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) 
            ? durationMinutes 
            : 60;

        // 4. Kiralama kaydı oluştur
        const rentalRes = await client.query(
            `INSERT INTO equipment_rentals (user_id, equipment_id, start_at, end_at, status)
             VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::interval, 'ongoing')
             RETURNING equipment_rental_id, user_id, equipment_id, start_at, end_at, status;`,
            [userId, equipmentId, safeDuration]
        );

        const rental = rentalRes.rows[0];

        // 5. Ekipmanı kirala
        await client.query(
            `UPDATE equipments SET status = 'rented' WHERE equipment_id = $1;`, 
            [equipmentId]
        );

        await client.query('COMMIT');
        
        return {
            ...rental,
            equipment_name: `${equipment.brand} ${equipment.model}`,
            price_per_hour: parseFloat(equipment.price_per_hour)
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Ekipman kiralamayı bitir ve ÖDEME KAYDET
exports.completeEquipmentRental = async ({ userId, rentalId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Kiralamayı bitir ve süreyi al
        const rentalRes = await client.query(
            `UPDATE equipment_rentals 
             SET status = 'completed', end_at = NOW()
             WHERE equipment_rental_id = $1 AND user_id = $2 AND status = 'ongoing'
             RETURNING equipment_rental_id, equipment_id, start_at, end_at, 
                       EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds;`,
            [rentalId, userId]
        );

        if (rentalRes.rowCount === 0) {
            throw new Error('Kiralama bulunamadı veya size ait değil');
        }

        const rental = rentalRes.rows[0];

        // 2. Ekipman fiyatını al ve hesapla
        const equipRes = await client.query(
            'SELECT price_per_hour, brand, model FROM equipments WHERE equipment_id = $1', 
            [rental.equipment_id]
        );
        const equipment = equipRes.rows[0];
        const pricePerHour = parseFloat(equipment?.price_per_hour || 10);
        
        const { durationHours, totalPrice } = calculatePrice(rental.duration_seconds, pricePerHour);

        // 3. Ekipmanı müsait yap
        await client.query(
            `UPDATE equipments SET status = 'available' WHERE equipment_id = $1`, 
            [rental.equipment_id]
        );

        // 4. ✅ ÖDEMEYİ KAYDET (PAYMENTS TABLOSUNA)
        await client.query(
            `INSERT INTO payments (equipment_rental_id, amount, method, paid_at)
             VALUES ($1, $2, 'cash', NOW())`,
            [rentalId, totalPrice]
        );

        await client.query('COMMIT');

        return { 
            ...rental,
            equipment_name: `${equipment.brand} ${equipment.model}`,
            total_price: totalPrice, 
            duration_hours: durationHours,
            duration_str: `${durationHours} saat` 
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 🔹 Kullanıcının aktif ekipman kiralamalarını getir
exports.getMyActiveEquipmentRentals = async (userId) => {
    const result = await pool.query(
        `SELECT 
            er.equipment_rental_id,
            er.equipment_id,
            er.start_at,
            er.end_at,
            er.status,
            CONCAT(e.brand, ' ', e.model) as equipment_name,
            e.price_per_hour,
            EXTRACT(EPOCH FROM (GREATEST(er.end_at, NOW()) - er.start_at)) as duration_seconds,
            CASE 
                WHEN NOW() > er.end_at THEN 'expired'
                ELSE 'active'
            END as rental_status
         FROM equipment_rentals er
         JOIN equipments e ON er.equipment_id = e.equipment_id
         WHERE er.user_id = $1 AND er.status = 'ongoing'
         ORDER BY er.start_at DESC;`,
        [userId]
    );

    return result.rows.map(row => {
        const pricePerHour = parseFloat(row.price_per_hour || 10);
        const { durationHours, totalPrice } = calculatePrice(row.duration_seconds, pricePerHour);
        
        return {
            ...row,
            duration_hours: durationHours,
            estimated_price: totalPrice,
            price_per_hour: pricePerHour
        };
    });
};

// 🔹 Kullanıcının TÜM ekipmanlarını iade et
exports.returnAllMyEquipment = async (userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Aktif ekipman kiralamalarını bul
        const rentalsRes = await client.query(
            `SELECT equipment_rental_id, equipment_id, start_at,
                    EXTRACT(EPOCH FROM (NOW() - start_at)) as duration_seconds
             FROM equipment_rentals
             WHERE user_id = $1 AND status = 'ongoing'
             FOR UPDATE;`,
            [userId]
        );

        if (rentalsRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return { message: 'İade edilecek ekipman bulunamadı', count: 0 };
        }

        const rentals = rentalsRes.rows;
        let totalAmount = 0;

        // 2. Her bir kiralama için işlem yap
        for (const rental of rentals) {
            // Fiyat hesapla
            const equipRes = await client.query(
                'SELECT price_per_hour FROM equipments WHERE equipment_id = $1',
                [rental.equipment_id]
            );
            const pricePerHour = parseFloat(equipRes.rows[0]?.price_per_hour || 10);
            const { totalPrice } = calculatePrice(rental.duration_seconds, pricePerHour);
            totalAmount += totalPrice;

            // Kiralamayı kapat
            await client.query(
                `UPDATE equipment_rentals 
                 SET status = 'completed', end_at = NOW()
                 WHERE equipment_rental_id = $1`,
                [rental.equipment_rental_id]
            );

            // Ekipmanı müsait yap
            await client.query(
                `UPDATE equipments SET status = 'available' WHERE equipment_id = $1`,
                [rental.equipment_id]
            );

            // Ödeme kaydet
            await client.query(
                `INSERT INTO payments (equipment_rental_id, amount, method, paid_at)
                 VALUES ($1, $2, 'cash', NOW())`,
                [rental.equipment_rental_id, totalPrice]
            );
        }

        await client.query('COMMIT');

        return {
            message: `${rentals.length} ekipman başarıyla iade edildi`,
            count: rentals.length,
            total_price: totalAmount
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ========================================
// 👑 ADMİN FONKSİYONLARI
// ========================================

// 🔹 Admin: Tüm aktif kiralamaları getir
exports.getAllActiveRentals = async () => {
    const client = await pool.connect();
    try {
        // Tekne kiralamalarını getir
        const boatRentalsQuery = `
            SELECT 
                r.rental_id,
                'boat' as rental_type,
                r.user_id,
                r.start_at,
                r.end_at,
                r.status,
                b.name as item_name,
                b.price_per_hour,
                u.full_name as user_name,
                u.email as user_email,
                EXTRACT(EPOCH FROM (GREATEST(r.end_at, NOW()) - r.start_at)) as duration_seconds,
                EXTRACT(EPOCH FROM (NOW() - r.start_at)) / 3600 AS hours_elapsed,
                CASE 
                    WHEN NOW() > r.end_at THEN 'expired'
                    ELSE 'active'
                END as rental_status
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status = 'ongoing'
            ORDER BY r.start_at ASC
        `;

        // Ekipman kiralamalarını getir
        const equipmentRentalsQuery = `
            SELECT 
                er.equipment_rental_id as rental_id,
                'equipment' as rental_type,
                er.user_id,
                er.start_at,
                er.end_at,
                er.status,
                CONCAT(e.brand, ' ', e.model) as item_name,
                e.price_per_hour,
                u.full_name as user_name,
                u.email as user_email,
                EXTRACT(EPOCH FROM (GREATEST(er.end_at, NOW()) - er.start_at)) as duration_seconds,
                EXTRACT(EPOCH FROM (NOW() - er.start_at)) / 3600 AS hours_elapsed,
                CASE 
                    WHEN NOW() > er.end_at THEN 'expired'
                    ELSE 'active'
                END as rental_status
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            JOIN users u ON er.user_id = u.user_id
            WHERE er.status = 'ongoing'
            ORDER BY er.start_at ASC
        `;

        const [boatResult, equipmentResult] = await Promise.all([
            client.query(boatRentalsQuery),
            client.query(equipmentRentalsQuery)
        ]);

        // 1. Tekneleri işle (Map)
        const boats = boatResult.rows.map(row => {
            const pricePerHour = parseFloat(row.price_per_hour || 0);
            const { durationHours, totalPrice } = calculatePrice(row.duration_seconds, pricePerHour);
            return {
                ...row,
                duration_hours: durationHours,
                estimated_price: totalPrice,
                price_per_hour: pricePerHour
            };
        });

        // 2. Ekipmanları işle (Map)
        const equipment = equipmentResult.rows.map(row => {
            const pricePerHour = parseFloat(row.price_per_hour || 0);
            const { durationHours, totalPrice } = calculatePrice(row.duration_seconds, pricePerHour);
            return {
                ...row,
                duration_hours: durationHours,
                estimated_price: totalPrice,
                price_per_hour: pricePerHour
            };
        });

        // 3. AYRI AYRI DÖNDÜR (Frontend bunu bekliyor)
        return {
            boats: boats,
            equipment: equipment
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
                throw new Error('Devam eden tekne kiralama bulunamadı');
            }

            const rental = rentalRes.rows[0];

            // Fiyat hesapla
            const boatRes = await client.query(
                'SELECT price_per_hour, name FROM boats WHERE boat_id = $1',
                [rental.boat_id]
            );
            const boat = boatRes.rows[0];
            const pricePerHour = parseFloat(boat?.price_per_hour || 50);
            const { durationHours, totalPrice } = calculatePrice(rental.duration_seconds, pricePerHour);

            // Tekneyi müsait yap ve iskeleye çek
            await client.query(
                `UPDATE boats 
                 SET status = 'available', 
                     current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)
                 WHERE boat_id = $3;`,
                [DOCK_LON, DOCK_LAT, rental.boat_id]
            );

            // Ödeme kaydet
            await client.query(
                `INSERT INTO payments (rental_id, amount, method, paid_at)
                 VALUES ($1, $2, 'cash', NOW())`,
                [rentalId, totalPrice]
            );

            await client.query('COMMIT');
            
            return { 
                ...rental, 
                boat_name: boat?.name,
                total_price: totalPrice, 
                duration_hours: durationHours, 
                rental_type: 'boat' 
            };

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
                throw new Error('Devam eden ekipman kiralama bulunamadı');
            }

            const rental = rentalRes.rows[0];

            // Fiyat hesapla
            const equipRes = await client.query(
                'SELECT price_per_hour, brand, model FROM equipments WHERE equipment_id = $1',
                [rental.equipment_id]
            );
            const equipment = equipRes.rows[0];
            const pricePerHour = parseFloat(equipment?.price_per_hour || 10);
            const { durationHours, totalPrice } = calculatePrice(rental.duration_seconds, pricePerHour);

            // Ekipmanı müsait yap
            await client.query(
                `UPDATE equipments SET status = 'available' WHERE equipment_id = $1`,
                [rental.equipment_id]
            );

            // Ödeme kaydet
            await client.query(
                `INSERT INTO payments (equipment_rental_id, amount, method, paid_at)
                 VALUES ($1, $2, 'cash', NOW())`,
                [rentalId, totalPrice]
            );

            await client.query('COMMIT');
            
            return { 
                ...rental,
                equipment_name: `${equipment.brand} ${equipment.model}`,
                total_price: totalPrice, 
                duration_hours: durationHours, 
                rental_type: 'equipment' 
            };
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
        // Tekne kiralamalarını getir
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
                u.full_name as user_name,
                u.email as user_email,
                p.amount as total_price,
                EXTRACT(EPOCH FROM (r.end_at - r.start_at)) / 3600 as duration_hours
            FROM rentals r
            JOIN boats b ON r.boat_id = b.boat_id
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN payments p ON p.rental_id = r.rental_id
            WHERE r.status = 'completed'
        `;
        
        // Ekipman kiralamalarını getir
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
                u.full_name as user_name,
                u.email as user_email,
                p.amount as total_price,
                EXTRACT(EPOCH FROM (er.end_at - er.start_at)) / 3600 as duration_hours
            FROM equipment_rentals er
            JOIN equipments e ON er.equipment_id = e.equipment_id
            JOIN users u ON er.user_id = u.user_id
            LEFT JOIN payments p ON p.equipment_rental_id = er.equipment_rental_id
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

        if (rentalType === 'all' || rentalType === 'boat') {
            queries.push(client.query(boatQuery, boatParams));
        }
        if (rentalType === 'all' || rentalType === 'equipment') {
            queries.push(client.query(equipmentQuery, equipmentParams));
        }

        const results = await Promise.all(queries);

        let allRentals = [];
        results.forEach(result => {
            allRentals = allRentals.concat(result.rows.map(row => ({
                ...row,
                duration_hours: Math.ceil(parseFloat(row.duration_hours) || 0),
                total_price: parseFloat(row.total_price || 0)
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

// 🔹 Admin: Aylık kazancı hesapla (PAYMENTS tablosundan)
exports.getMonthlyRevenue = async ({ year, month }) => {
    const client = await pool.connect();
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

        // Tekne Gelirleri (rental_id dolu olanlar)
        const boatRevenueQuery = `
            SELECT 
                COUNT(*) as count, 
                COALESCE(SUM(amount), 0) as total_revenue
            FROM payments 
            WHERE rental_id IS NOT NULL
              AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', $1::date)
        `;

        // Ekipman Gelirleri (equipment_rental_id dolu olanlar)
        const equipmentRevenueQuery = `
            SELECT 
                COUNT(*) as count, 
                COALESCE(SUM(amount), 0) as total_revenue
            FROM payments 
            WHERE equipment_rental_id IS NOT NULL
              AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', $1::date)
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
            year,
            month,
            boats,
            equipment,
            total_revenue: boats.total_revenue + equipment.total_revenue,
            total_rentals: boats.count + equipment.count
        };
    } finally {
        client.release();
    }
};

// Tekne ve Ekipman Gelir Analizi (Sorgu 5)
exports.getRevenueAnalysis = async ({ year, month } = {}) => {
    // Tarih filtresi için WHERE koşulları
    let dateFilter = '';
    const params = [];
    let paramIndex = 1;
    
    if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        dateFilter = `AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', $${paramIndex}::date)`;
        params.push(startDate);
        paramIndex++;
    }

    const query = `
        SELECT 
            'Boat' AS rental_type,
            b.boat_id AS item_id,
            b.name AS item_name,
            COUNT(r.rental_id) AS rental_count,
            AVG(EXTRACT(EPOCH FROM (r.end_at - r.start_at)) / 3600) AS avg_rental_hours,
            SUM(p.amount) AS total_revenue,
            AVG(p.amount) AS avg_payment
        FROM boats b
        LEFT JOIN rentals r ON b.boat_id = r.boat_id
        LEFT JOIN payments p ON r.rental_id = p.rental_id
        WHERE (r.rental_id IS NULL OR p.payment_id IS NOT NULL)
        ${dateFilter}
        GROUP BY b.boat_id, b.name
        HAVING COUNT(r.rental_id) > 0

        UNION ALL

        SELECT 
            'Equipment' AS rental_type,
            e.equipment_id AS item_id,
            CONCAT(et.name, ' - ', COALESCE(e.brand, ''), ' ', COALESCE(e.model, '')) AS item_name,
            COUNT(er.equipment_rental_id) AS rental_count,
            AVG(EXTRACT(EPOCH FROM (COALESCE(er.end_at, NOW()) - er.start_at)) / 3600) AS avg_rental_hours,
            SUM(p.amount) AS total_revenue,
            AVG(p.amount) AS avg_payment
        FROM equipments e
        JOIN equipment_types et ON e.type_id = et.type_id
        LEFT JOIN equipment_rentals er ON e.equipment_id = er.equipment_id
        LEFT JOIN payments p ON er.equipment_rental_id = p.equipment_rental_id
        WHERE (er.equipment_rental_id IS NULL OR p.payment_id IS NOT NULL)
        ${dateFilter}
        GROUP BY e.equipment_id, et.name, e.brand, e.model
        HAVING COUNT(er.equipment_rental_id) > 0

        ORDER BY total_revenue DESC NULLS LAST
    `;
    const { rows } = await pool.query(query, params.length > 0 ? params : null);
    return rows;
};