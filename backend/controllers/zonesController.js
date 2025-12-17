const zonesService = require('../services/zonesService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.getZones = asyncWrapper(async (req, res) => {
  const data = await zonesService.getGeoJsonZones();
  res.json(data);
});

// Bölge istatistiklerini getir (Sorgu 2)
exports.getZoneStats = asyncWrapper(async (req, res) => {
  const { zoneId } = req.params;
  const zoneIdNum = parseInt(zoneId, 10);

  if (Number.isNaN(zoneIdNum)) {
    return res.status(400).json({ error: 'Geçersiz bölge ID' });
  }

  try {
    const stats = await zonesService.getZoneStats(zoneIdNum);
    res.json(stats);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

// Tüm bölgelerin istatistiklerini getir (Sorgu 2)
exports.getAllZonesStats = asyncWrapper(async (req, res) => {
  const stats = await zonesService.getAllZonesStats();
  res.json(stats);
});
