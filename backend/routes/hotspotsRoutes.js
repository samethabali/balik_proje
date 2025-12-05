const express = require("express");
const router = express.Router();
const controller = require("../controllers/hotspotsController");

router.get("/", controller.getHotspots);
router.post("/", controller.createHotspot);
router.put("/:id", controller.updateHotspot);
router.delete("/:id", controller.deleteHotspot);

module.exports = router;
