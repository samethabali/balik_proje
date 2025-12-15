const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Yetkisiz: Token yok' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { user_id, email, full_name, role_id }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Yetkisiz: Token geçersiz' });
    }
};
