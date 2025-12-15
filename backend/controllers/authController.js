const authService = require('../services/authService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.register = asyncWrapper(async (req, res) => {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'full_name, email, password zorunlu' });
    }

    const result = await authService.register({ full_name, email, password, phone });
    res.status(201).json(result);
});

exports.login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email ve password zorunlu' });
    }

    const result = await authService.login({ email, password });
    res.json(result);
});

exports.me = asyncWrapper(async (req, res) => {
    // authMiddleware req.user set ediyor
    const user = await authService.me(req.user.user_id);
    res.json(user);
});
