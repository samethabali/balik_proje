// backend/controllers/equipmentsController.js
const equipmentsService = require('../services/equipmentsService');
const asyncWrapper = require('../middleware/asyncWrapper');

exports.getAvailableEquipment = asyncWrapper(async (req, res) => {
    const equipment = await equipmentsService.getAvailableEquipment();
    res.json(equipment);
});

exports.getEquipmentTypes = asyncWrapper(async (req, res) => {
    const types = await equipmentsService.getEquipmentTypes();
    res.json(types);
});

// Admin: Yeni ekipman oluştur
exports.createEquipment = asyncWrapper(async (req, res) => {
    const { brand, model, type_id, price_per_hour } = req.body;
    
    if (!brand || !model || !price_per_hour) {
        return res.status(400).json({ error: 'brand, model ve price_per_hour zorunlu' });
    }
    
    // type_id opsiyonel ama veritabanında zorunlu, bu yüzden service katmanında varsayılan değer atanacak
    const equipment = await equipmentsService.createEquipment({ brand, model, type_id, price_per_hour });
    res.status(201).json(equipment);
});

// Admin: Ekipman güncelle
exports.updateEquipment = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { brand, model, type_id, price_per_hour } = req.body;
    
    const equipmentId = parseInt(id, 10);
    if (Number.isNaN(equipmentId)) {
        return res.status(400).json({ error: 'Invalid equipment id' });
    }
    
    const equipment = await equipmentsService.updateEquipment({ equipmentId, brand, model, type_id, price_per_hour });
    res.json(equipment);
});

// Admin: Ekipman sil (soft delete)
exports.deleteEquipment = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    const equipmentId = parseInt(id, 10);
    if (Number.isNaN(equipmentId)) {
        return res.status(400).json({ error: 'Invalid equipment id' });
    }
    
    const equipment = await equipmentsService.deleteEquipment(equipmentId);
    res.json(equipment);
});

