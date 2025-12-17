import React, { useState } from 'react';
import { fetchMonthlyRevenue } from '../../../api/api';
import toast from 'react-hot-toast';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const MonthlyTab = ({ onClose }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Yıl seçenekleri: son 2 yıl + mevcut yıl
  const years = [];
  for (let i = currentDate.getFullYear() - 2; i <= currentDate.getFullYear(); i++) {
    years.push(i);
  }

  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' }
  ];

  const loadRevenue = async ({ notify = false } = {}) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchMonthlyRevenue({ year: selectedYear, month: selectedMonth });
      setRevenue(data);
      if (notify) toast.success('Muhasebe verileri güncellendi.');
    } catch (err) {
      const m = err.message || 'Kazanç bilgileri yüklenemedi';
      setError(m);
      setRevenue(null);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRevenue();
  }, []);

  const handleShow = (e) => {
    e.preventDefault();
    loadRevenue({ notify: true });
  };

  return (
    <>
      <form onSubmit={handleShow} className={styles.monthlyForm}>
        <div className={styles.dateGrid}>
          <Select
            label="Yıl"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            options={years.map(year => ({ value: year, label: year.toString() }))}
          />
          <Select
            label="Ay"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            options={months}
          />
        </div>
        <div className={styles.formActions}>
          <Button type="button" variant="danger" onClick={onClose} disabled={loading}>
            Kapat
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Yükleniyor...' : 'Göster'}
          </Button>
        </div>
      </form>

      <div className={`${styles.scrollableContent} accounting-panel-scroll`}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {loading && !revenue ? (
          <LoadingSpinner text="Yükleniyor..." />
        ) : revenue ? (
          <div className={styles.revenueCards}>
            {/* Tekne Kazancı */}
            <Card variant="boat">
              <h3 className={styles.cardTitle}>🛶 Tekne Kiralama</h3>
              <div className={styles.cardContent}>
                <div>
                  <p className={styles.cardText}>Toplam Kiralama: {revenue.boats.count}</p>
                </div>
                <div className={styles.revenueAmount}>
                  {revenue.boats.total_revenue.toFixed(2)} ₺
                </div>
              </div>
            </Card>

            {/* Ekipman Kazancı */}
            <Card variant="equipment">
              <h3 className={styles.cardTitle}>🎣 Ekipman Kiralama</h3>
              <div className={styles.cardContent}>
                <div>
                  <p className={styles.cardText}>Toplam Kiralama: {revenue.equipment.count}</p>
                </div>
                <div className={styles.revenueAmount}>
                  {revenue.equipment.total_revenue.toFixed(2)} ₺
                </div>
              </div>
            </Card>

            {/* Genel Toplam */}
            <Card className={styles.totalCard}>
              <h3 className={styles.totalTitle}>💰 Genel Toplam</h3>
              <div className={styles.totalAmount}>
                {revenue.total_revenue.toFixed(2)} ₺
              </div>
              <p className={styles.totalDate}>
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </Card>
          </div>
        ) : (
          <p className={styles.emptyMessage}>Veri bulunamadı.</p>
        )}
      </div>
    </>
  );
};

export default MonthlyTab;

