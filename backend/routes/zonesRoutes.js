const express = require('express');
const router = express.Router();
const { getZones } = require('../controllers/zonesController');

router.get('/', getZones);

module.exports = router;
