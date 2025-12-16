// backend/middleware/adminMiddleware.js
// Admin kontrolü için middleware - role_id === 2 kontrolü yapar

module.exports = function adminMiddleware(req, res, next) {
    // authMiddleware'den sonra çalışmalı, req.user zaten set edilmiş olmalı
    if (!req.user) {
        return res.status(401).json({ error: 'Yetkisiz: Giriş yapmalısınız' });
    }

    // Admin kontrolü: role_id === 2
    if (req.user.role_id !== 2) {
        return res.status(403).json({ error: 'Yetkisiz: Admin yetkisi gerekli' });
    }

    next();
};

