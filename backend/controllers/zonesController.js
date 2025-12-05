const zonesService = require('../services/zonesService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.getZones = asyncWrapper(async (req, res) => {
  const data = await zonesService.getGeoJsonZones();
  res.json(data);
});
