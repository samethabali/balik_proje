// frontend/src/components/AdminPanels.jsx
import React, { useState, useEffect } from 'react';
import { createBoat, updateBoat, deleteBoat, createEquipment, updateEquipment, deleteEquipment, createActivity, updateActivity, deleteActivity, fetchZones, fetchEquipmentTypes } from '../api/api';
import toast from 'react-hot-toast';

const AdminPanels = ({
  type, // 'boat', 'equipment', 'activity'
  item, // existing item for edit mode (null for create)
  onClose,
  onSuccess
}) => {
  const [zones, setZones] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [boatForm, setBoatForm] = useState({
    name: '',
    capacity: '',
    price_per_hour: '',
    status: 'available'
  });

  const [equipmentForm, setEquipmentForm] = useState({
    brand: '',
    model: '',
    type_id: '',
    price_per_hour: ''
  });

  const [activityForm, setActivityForm] = useState({
    zone_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  // Load zones for activity form
  useEffect(() => {
    if (type === 'activity') {
      fetchZones()
        .then(data => {
          if (data.features) {
            setZones(data.features.map(f => ({ zone_id: f.properties.id, name: f.properties.name })));
          }
        })
        .catch(err => {
          console.error('Zones yüklenemedi:', err);
          toast.error('Bölgeler yüklenemedi.');
        });

    }
  }, [type]);

  // Load equipment types for equipment form
  useEffect(() => {
    if (type === 'equipment') {
      fetchEquipmentTypes()
        .then(data => {
          setEquipmentTypes(data);
          // Eğer type_id yoksa, ilk type'ı varsayılan olarak seç
          if (!equipmentForm.type_id && data.length > 0) {
            setEquipmentForm(prev => ({ ...prev, type_id: data[0].type_id.toString() }));
          }
        })
        .catch(err => {
          console.error('Equipment types yüklenemedi:', err);
          toast.error('Ekipman tipleri yüklenemedi.');
        });
    }
  }, [type]);

  // Load item data if editing
  useEffect(() => {
    if (item) {
      if (type === 'boat') {
        setBoatForm({
          name: item.name || '',
          capacity: item.capacity || '',
          price_per_hour: item.price_per_hour || '',
          status: item.status || 'available'
        });
      } else if (type === 'equipment') {
        setEquipmentForm({
          brand: item.brand || '',
          model: item.model || '',
          type_id: item.type_id || '',
          price_per_hour: item.price_per_hour || ''
        });
      } else if (type === 'activity') {
        const startDate = item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '';
        const endDate = item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '';
        setActivityForm({
          zone_id: item.zone_id || '',
          title: item.title || '',
          description: item.description || '',
          start_date: startDate,
          end_date: endDate
        });
      }
    }
  }, [item, type]);

  const handleBoatSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        name: boatForm.name,
        capacity: parseInt(boatForm.capacity),
        price_per_hour: parseFloat(boatForm.price_per_hour),
        status: boatForm.status
      };

      if (item) {
        await updateBoat(item.boat_id, data);
        toast.success('Tekne güncellendi.');
      } else {
        await createBoat(data);
        toast.success('Tekne oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const m = err.message || 'İşlem başarısız';
      setError(m);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        brand: equipmentForm.brand,
        model: equipmentForm.model,
        type_id: equipmentForm.type_id ? parseInt(equipmentForm.type_id) : null,
        price_per_hour: parseFloat(equipmentForm.price_per_hour)
      };

      if (item) {
        await updateEquipment(item.equipment_id, data);
        toast.success('Ekipman güncellendi.');
      } else {
        await createEquipment(data);
        toast.success('Ekipman oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const m = err.message || 'İşlem başarısız';
      setError(m);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        zone_id: parseInt(activityForm.zone_id),
        title: activityForm.title,
        description: activityForm.description || null,
        start_date: new Date(activityForm.start_date).toISOString(),
        end_date: new Date(activityForm.end_date).toISOString()
      };

      if (item) {
        await updateActivity(item.activity_id, data);
        toast.success('Etkinlik güncellendi.');
      } else {
        await createActivity(data);
        toast.success('Etkinlik oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const m = err.message || 'İşlem başarısız';
      setError(m);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const panelStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  };

  const contentStyle = {
    backgroundColor: '#020817',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '500px',
    width: '100%',
    color: 'white',
    display: 'flex',
    flexDirection: 'column'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    background: '#111',
    border: '1px solid #333',
    color: 'white',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '10px 20px',
    background: '#00ffff',
    color: '#00111f',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '10px',
    fontSize: '0.9rem'
  };

  const closeButtonStyle = {
    ...buttonStyle,
    background: '#dc2626',
    color: 'white'
  };

  return (
    <div style={panelStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...contentStyle, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={{ color: '#00ffff', margin: 0 }}>
            {item ? 'Düzenle' : 'Yeni Ekle'} - {type === 'boat' ? 'Tekne' : type === 'equipment' ? 'Ekipman' : 'Etkinlik'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#fca5a5', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {type === 'boat' && (
            <form onSubmit={handleBoatSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Tekne Adı</label>
              <input
                type="text"
                value={boatForm.name}
                onChange={(e) => setBoatForm({ ...boatForm, name: e.target.value })}
                required
                style={inputStyle}
                placeholder="Örn: Hızlı Tekne 1"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Kapasite</label>
              <input
                type="number"
                value={boatForm.capacity}
                onChange={(e) => setBoatForm({ ...boatForm, capacity: e.target.value })}
                required
                min="1"
                style={inputStyle}
                placeholder="Örn: 4"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Saatlik Fiyat (₺)</label>
              <input
                type="number"
                value={boatForm.price_per_hour}
                onChange={(e) => setBoatForm({ ...boatForm, price_per_hour: e.target.value })}
                required
                min="0"
                step="0.01"
                style={inputStyle}
                placeholder="Örn: 150"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Durum</label>
              <select
                value={boatForm.status}
                onChange={(e) => setBoatForm({ ...boatForm, status: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="available">Müsait (Available)</option>
                <option value="rented">Kiralık (Rented)</option>
                <option value="maintenance">Bakımda (Maintenance)</option>
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" onClick={onClose} style={closeButtonStyle} disabled={loading}>
                  İptal
                </button>
                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          )}

          {type === 'equipment' && (
            <form onSubmit={handleEquipmentSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Marka</label>
              <input
                type="text"
                value={equipmentForm.brand}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                required
                style={inputStyle}
                placeholder="Örn: Shimano"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Model</label>
              <input
                type="text"
                value={equipmentForm.model}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                required
                style={inputStyle}
                placeholder="Örn: Stradic 5000"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Tip *</label>
              <select
                value={equipmentForm.type_id || ''}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, type_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Tip Seçin</option>
                {equipmentTypes.map(type => (
                  <option key={type.type_id} value={type.type_id}>{type.name}</option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Saatlik Fiyat (₺)</label>
              <input
                type="number"
                value={equipmentForm.price_per_hour}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, price_per_hour: e.target.value })}
                required
                min="0"
                step="0.01"
                style={inputStyle}
                placeholder="Örn: 25"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" onClick={onClose} style={closeButtonStyle} disabled={loading}>
                  İptal
                </button>
                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          )}

          {type === 'activity' && (
            <form onSubmit={handleActivitySubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Bölge</label>
              <select
                value={activityForm.zone_id}
                onChange={(e) => setActivityForm({ ...activityForm, zone_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Bölge Seçin</option>
                {zones.map(zone => (
                  <option key={zone.zone_id} value={zone.zone_id}>{zone.name}</option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Başlık</label>
              <input
                type="text"
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                required
                style={inputStyle}
                placeholder="Örn: Balık Avı Turnuvası"
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Açıklama (Opsiyonel)</label>
              <textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Etkinlik açıklaması..."
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Başlangıç Tarihi</label>
              <input
                type="datetime-local"
                value={activityForm.start_date}
                onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })}
                required
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Bitiş Tarihi</label>
              <input
                type="datetime-local"
                value={activityForm.end_date}
                onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })}
                required
                style={inputStyle}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" onClick={onClose} style={closeButtonStyle} disabled={loading}>
                  İptal
                </button>
                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanels;

