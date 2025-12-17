import React, { useState, useEffect } from 'react';
import { createEquipment, updateEquipment, fetchEquipmentTypes } from '../../api/api';
import toast from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from './styles.module.css';

const EquipmentForm = ({ item, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    type_id: '',
    price_per_hour: ''
  });

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const data = await fetchEquipmentTypes();
        setEquipmentTypes(data);
        if (!item && data.length > 0) {
          setFormData(prev => ({ ...prev, type_id: data[0].type_id.toString() }));
        }
      } catch (err) {
        console.error('Equipment types yüklenemedi:', err);
        toast.error('Ekipman tipleri yüklenemedi.');
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypes();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        brand: item.brand || '',
        model: item.model || '',
        type_id: item.type_id || '',
        price_per_hour: item.price_per_hour || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        brand: formData.brand,
        model: formData.model,
        type_id: formData.type_id ? parseInt(formData.type_id) : null,
        price_per_hour: parseFloat(formData.price_per_hour)
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

  if (loadingTypes) {
    return <LoadingSpinner text="Ekipman tipleri yükleniyor..." />;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <Input
        label="Marka"
        type="text"
        value={formData.brand}
        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        required
        placeholder="Örn: Shimano"
      />

      <Input
        label="Model"
        type="text"
        value={formData.model}
        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
        required
        placeholder="Örn: Stradic 5000"
      />

      <Select
        label="Tip"
        value={formData.type_id}
        onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
        required
        placeholder="Tip Seçin"
        options={equipmentTypes.map(type => ({ value: type.type_id, label: type.name }))}
      />

      <Input
        label="Saatlik Fiyat (₺)"
        type="number"
        value={formData.price_per_hour}
        onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
        required
        min="0"
        step="0.01"
        placeholder="Örn: 25"
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

export default EquipmentForm;

