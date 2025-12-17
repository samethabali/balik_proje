const activitiesService = require('../services/activitiesService');
const asyncWrapper = require('../middleware/asyncWrapper');

// Bölgeye göre etkinlikleri getir
exports.getActivitiesByZone = asyncWrapper(async (req, res) => {
  const { zoneId } = req.params;
  
  if (!zoneId) {
    return res.status(400).json({ error: 'Zone ID gerekli' });
  }
  
  const data = await activitiesService.getActivitiesByZone(zoneId);
  res.json(data);
});

// Tüm etkinlikleri getir (opsiyonel)
exports.getAllActivities = asyncWrapper(async (req, res) => {
  const data = await activitiesService.getAllActivities();
  res.json(data);
});

// Admin: Yeni etkinlik oluştur
exports.createActivity = asyncWrapper(async (req, res) => {
  const { zone_id, title, description, start_date, end_date } = req.body;
  
  if (!zone_id || !title || !start_date || !end_date) {
    return res.status(400).json({ error: 'zone_id, title, start_date ve end_date zorunlu' });
  }
  
  const activity = await activitiesService.createActivity({ zone_id, title, description, start_date, end_date });
  res.status(201).json(activity);
});

// Admin: Etkinlik güncelle
exports.updateActivity = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { zone_id, title, description, start_date, end_date } = req.body;
  
  const activityId = parseInt(id, 10);
  if (Number.isNaN(activityId)) {
    return res.status(400).json({ error: 'Invalid activity id' });
  }
  
  const activity = await activitiesService.updateActivity({ activityId, zone_id, title, description, start_date, end_date });
  res.json(activity);
});

// Admin: Etkinlik sil
exports.deleteActivity = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  const activityId = parseInt(id, 10);
  if (Number.isNaN(activityId)) {
    return res.status(400).json({ error: 'Invalid activity id' });
  }
  
  const activity = await activitiesService.deleteActivity(activityId);
  res.json(activity);
});

// Bölgeye göre gelecek aktiviteleri getir (Sorgu 7)
exports.getUpcomingActivitiesByZone = asyncWrapper(async (req, res) => {
  const { zoneId } = req.params;
  const zoneIdNum = parseInt(zoneId, 10);

  if (Number.isNaN(zoneIdNum)) {
    return res.status(400).json({ error: 'Geçersiz bölge ID' });
  }

  const activities = await activitiesService.getUpcomingActivitiesByZone(zoneIdNum);
  res.json(activities);
});

