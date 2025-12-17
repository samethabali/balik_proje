import React, { useState } from 'react';
import { fetchCompletedRentals } from '../../../api/api';
import toast from 'react-hot-toast';
import BasePanel from '../BasePanel';
import RentalFilters from './RentalFilters';
import RentalList from './RentalList';
import styles from './styles.module.css';

const RentalHistoryPanel = ({ onClose }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userName: '',
    startDate: '',
    endDate: '',
    rentalType: 'all'
  });

  const handleFilter = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchCompletedRentals({
        userName: filters.userName || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        rentalType: filters.rentalType
      });
      setRentals(data);
      if (!data || data.length === 0) {
        toast('Sonuç bulunamadı. Filtreleri değiştirip tekrar deneyin.');
      } else {
        toast.success(`${data.length} kayıt bulundu.`);
      }
    } catch (err) {
      const m = err.message || 'Kiralamalar yüklenemedi';
      setError(m);
      setRentals([]);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BasePanel
      isOpen={true}
      onClose={onClose}
      title="📊 Geçmiş Kiralamalar"
      maxWidth="800px"
    >
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <RentalFilters
        filters={filters}
        setFilters={setFilters}
        onFilter={handleFilter}
        onClose={onClose}
        loading={loading}
      />

      <div className={`${styles.scrollableContent} rental-history-scroll`}>
        <RentalList rentals={rentals} loading={loading} />
      </div>
    </BasePanel>
  );
};

export default RentalHistoryPanel;

