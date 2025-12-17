import React, { useState, useEffect } from 'react';
import { createBoat, updateBoat } from '../../api/api';
import toast from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import styles from './styles.module.css';

const BoatForm = ({ item, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    price_per_hour: '',
    status: 'available'
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        capacity: item.capacity || '',
        price_per_hour: item.price_per_hour || '',
        status: item.status || 'available'
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        price_per_hour: parseFloat(formData.price_per_hour),
        status: formData.status
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

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <Input
        label="Tekne Adı"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="Örn: Hızlı Tekne 1"
      />

      <Input
        label="Kapasite"
        type="number"
        value={formData.capacity}
        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
        required
        min="1"
        placeholder="Örn: 4"
      />

      <Input
        label="Saatlik Fiyat (₺)"
        type="number"
        value={formData.price_per_hour}
        onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
        required
        min="0"
        step="0.01"
        placeholder="Örn: 150"
      />

      <Select
        label="Durum"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        required
        options={[
          { value: 'available', label: 'Müsait (Available)' },
          { value: 'rented', label: 'Kiralık (Rented)' },
          { value: 'maintenance', label: 'Bakımda (Maintenance)' }
        ]}
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

export default BoatForm;

