import React from 'react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import styles from './styles.module.css';

const RentalFilters = ({ filters, setFilters, onFilter, onClose, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.filterForm}>
      <div className={styles.filterGrid}>
        <Input
          label="Kullanıcı Adı"
          type="text"
          value={filters.userName}
          onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
          placeholder="Kullanıcı adı ile filtrele..."
        />
        <Select
          label="Kiralama Tipi"
          value={filters.rentalType}
          onChange={(e) => setFilters({ ...filters, rentalType: e.target.value })}
          options={[
            { value: 'all', label: 'Tümü' },
            { value: 'boat', label: 'Tekne' },
            { value: 'equipment', label: 'Ekipman' }
          ]}
        />
      </div>
      <div className={styles.filterGrid}>
        <Input
          label="Başlangıç Tarihi"
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <Input
          label="Bitiş Tarihi"
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>
      <div className={styles.filterActions}>
        <Button type="button" variant="danger" onClick={onClose} disabled={loading}>
          Kapat
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Filtrele'}
        </Button>
      </div>
    </form>
  );
};

export default RentalFilters;

