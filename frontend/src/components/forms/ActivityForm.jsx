import React, { useState, useEffect } from 'react';
import { createActivity, updateActivity, fetchZones } from '../../api/api';
import toast from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from './styles.module.css';

const ActivityForm = ({ item, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [formData, setFormData] = useState({
    zone_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await fetchZones();
        if (data.features) {
          setZones(data.features.map(f => ({ 
            zone_id: f.properties.id || f.properties.zone_id, 
            name: f.properties.name 
          })));
        }
      } catch (err) {
        console.error('Zones yüklenemedi:', err);
        toast.error('Bölgeler yüklenemedi.');
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    if (item) {
      const startDate = item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '';
      const endDate = item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '';
      setFormData({
        zone_id: item.zone_id || '',
        title: item.title || '',
        description: item.description || '',
        start_date: startDate,
        end_date: endDate
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        zone_id: parseInt(formData.zone_id),
        title: formData.title,
        description: formData.description || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
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

  if (loadingZones) {
    return <LoadingSpinner text="Bölgeler yükleniyor..." />;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <Select
        label="Bölge"
        value={formData.zone_id}
        onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
        required
        placeholder="Bölge Seçin"
        options={zones.map(zone => ({ value: zone.zone_id, label: zone.name }))}
      />

      <Input
        label="Başlık"
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        placeholder="Örn: Balık Avı Turnuvası"
      />

      <Textarea
        label="Açıklama (Opsiyonel)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Etkinlik açıklaması..."
        rows={4}
      />

      <Input
        label="Başlangıç Tarihi"
        type="datetime-local"
        value={formData.start_date}
        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        required
      />

      <Input
        label="Bitiş Tarihi"
        type="datetime-local"
        value={formData.end_date}
        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        required
      />

      <div className={styles.formActions}>
        <Button type="button" variant="danger" onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Oluştur')}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;

