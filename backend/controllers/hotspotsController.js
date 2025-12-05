const service = require("../services/hotspotsService");
const asyncWrapper = require("../middleware/asyncWrapper");

exports.getHotspots = asyncWrapper(async (req, res) => {
  res.json(await service.getHotspots());
});

exports.createHotspot = asyncWrapper(async (req, res) => {
  res.json(await service.createHotspot(req.body));
});

exports.updateHotspot = asyncWrapper(async (req, res) => {
  res.json(await service.updateHotspot(req.params.id, req.body));
});

exports.deleteHotspot = asyncWrapper(async (req, res) => {
  res.json(await service.deleteHotspot(req.params.id));
});
