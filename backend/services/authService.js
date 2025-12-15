const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
    const payload = {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

exports.register = async ({ full_name, email, password, phone }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const exists = await client.query(
            `SELECT 1 FROM users WHERE email = $1`,
            [email]
        );
        if (exists.rowCount > 0) {
            throw new Error('Bu e-posta zaten kayıtlı');
        }

        const password_hash = await bcrypt.hash(password, 10);

        // role_id: varsayılan 1 varsayıyorum. Sende role tablosu var.
        const roleId = 1;

        const insert = await client.query(
            `INSERT INTO users (role_id, full_name, email, phone, status, password_hash)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING user_id, role_id, full_name, email, phone, created_at, status;`,
            [roleId, full_name, email, phone || null, password_hash]
        );

        const user = insert.rows[0];
        const token = signToken(user);

        await client.query('COMMIT');
        return { user, token };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.login = async ({ email, password }) => {
    const { rows } = await pool.query(
        `SELECT user_id, role_id, full_name, email, phone, created_at, status, password_hash
     FROM users
     WHERE email = $1`,
        [email]
    );

    if (rows.length === 0) throw new Error('E-posta veya şifre hatalı');

    const user = rows[0];
    if (!user.password_hash) throw new Error('Bu kullanıcıda şifre ayarlı değil');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('E-posta veya şifre hatalı');

    if (user.status !== 'active') throw new Error('Hesap pasif');

    const token = signToken(user);

    // password_hash dönmeyelim
    delete user.password_hash;

    return { user, token };
};

exports.me = async (userId) => {
    const { rows } = await pool.query(
        `SELECT user_id, role_id, full_name, email, phone, created_at, status
     FROM users
     WHERE user_id = $1`,
        [userId]
    );
    if (rows.length === 0) throw new Error('Kullanıcı bulunamadı');
    return rows[0];
};
