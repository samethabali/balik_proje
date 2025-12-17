// backend/controllers/usersController.js
const usersService = require('../services/usersService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.getUserInfo = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);

    if (Number.isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }

    try {
        const userInfo = await usersService.getUserInfo(userIdNum);
        res.json(userInfo);
    } catch (err) {
        return res.status(404).json({ error: err.message });
    }
});

// Kullanıcı istatistiklerini getir (Sorgu 1)
exports.getUserStats = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);

    if (Number.isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }

    try {
        const stats = await usersService.getUserStats(userIdNum);
        res.json(stats);
    } catch (err) {
        return res.status(404).json({ error: err.message });
    }
});

// Tüm kullanıcıların istatistiklerini getir (Sorgu 1 - Admin)
exports.getAllUsersStats = asyncWrapper(async (req, res) => {
    const stats = await usersService.getAllUsersStats();
    res.json(stats);
});

// Aktif kullanıcıları getir (Sorgu 6)
exports.getActiveUsers = asyncWrapper(async (req, res) => {
    const users = await usersService.getActiveUsers();
    res.json(users);
});

