// backend/services/usersService.js
const pool = require('../config/db');

// Kullanıcı bilgilerini getir
exports.getUserInfo = async (userId) => {
    // Client yaratmaya gerek yok, direkt pool kullan
    const query = `
        SELECT user_id, full_name, email, phone, created_at
        FROM users WHERE user_id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);
    
    if (rows.length === 0) {
        throw new Error('Kullanıcı bulunamadı');
    }
    return rows[0];
};

// Kullanıcı istatistiklerini getir (Sorgu 1)
exports.getUserStats = async (userId) => {
    const query = `
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            COUNT(DISTINCT r.rental_id) AS boat_rental_count,
            COUNT(DISTINCT er.equipment_rental_id) AS equipment_rental_count,
            COALESCE(SUM(p.amount), 0) AS total_spent
        FROM users u
        LEFT JOIN rentals r ON u.user_id = r.user_id
        LEFT JOIN equipment_rentals er ON u.user_id = er.user_id
        LEFT JOIN payments p ON (p.rental_id = r.rental_id OR p.equipment_rental_id = er.equipment_rental_id)
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.full_name, u.email
    `;
    const { rows } = await pool.query(query, [userId]);
    if (rows.length === 0) {
        throw new Error('Kullanıcı bulunamadı');
    }
    return rows[0];
};

// Tüm kullanıcıların istatistiklerini getir (Sorgu 1 - Admin)
exports.getAllUsersStats = async () => {
    const query = `
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            COUNT(DISTINCT r.rental_id) AS boat_rental_count,
            COUNT(DISTINCT er.equipment_rental_id) AS equipment_rental_count,
            COALESCE(SUM(p.amount), 0) AS total_spent
        FROM users u
        LEFT JOIN rentals r ON u.user_id = r.user_id
        LEFT JOIN equipment_rentals er ON u.user_id = er.user_id
        LEFT JOIN payments p ON (p.rental_id = r.rental_id OR p.equipment_rental_id = er.equipment_rental_id)
        GROUP BY u.user_id, u.full_name, u.email
        HAVING 
            COUNT(DISTINCT r.rental_id) > 0 OR COUNT(DISTINCT er.equipment_rental_id) > 0
        ORDER BY total_spent DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

// Aktif kullanıcıları getir (Sorgu 6)
exports.getActiveUsers = async () => {
    const query = `
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            r.name AS role_name,
            u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.status = 'active'
        ORDER BY u.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

