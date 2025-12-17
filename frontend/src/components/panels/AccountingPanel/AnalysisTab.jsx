import React, { useState, useEffect } from 'react';
import { fetchRevenueAnalysis } from '../../../api/api';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const AnalysisTab = () => {
  const currentDate = new Date();
  const [analysisSubTab, setAnalysisSubTab] = useState('all');
  const [analysisYear, setAnalysisYear] = useState(currentDate.getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState(currentDate.getMonth() + 1);
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [revenueAnalysis, setRevenueAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Yıl seçenekleri
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

  const loadRevenueAnalysis = async () => {
    setLoading(true);
    try {
      const params = useDateFilter ? { year: analysisYear, month: analysisMonth } : {};
      const data = await fetchRevenueAnalysis(params);
      setRevenueAnalysis(data);
    } catch (err) {
      console.error('Gelir analizi yüklenemedi:', err);
      setRevenueAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!useDateFilter) {
      loadRevenueAnalysis();
    }
  }, []);

  useEffect(() => {
    if (useDateFilter) {
      loadRevenueAnalysis();
    }
  }, [analysisYear, analysisMonth, useDateFilter]);

  const handleDateFilterChange = (checked) => {
    setUseDateFilter(checked);
    if (checked) {
      loadRevenueAnalysis();
    }
  };

  // Filtreleme mantığı
  let filteredData = revenueAnalysis || [];
  if (analysisSubTab === 'boat') {
    filteredData = filteredData.filter(item => item.rental_type === 'Boat');
  } else if (analysisSubTab === 'equipment') {
    filteredData = filteredData.filter(item => item.rental_type === 'Equipment');
  }

  // Toplam hesapla
  const totalRevenue = filteredData.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
  const totalRentals = filteredData.reduce((sum, item) => sum + parseInt(item.rental_count || 0, 10), 0);

  const getSubTabColor = () => {
    if (analysisSubTab === 'boat') return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.5)', text: '#60a5fa' };
    if (analysisSubTab === 'equipment') return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.5)', text: '#4ade80' };
    return { bg: 'rgba(0, 255, 255, 0.1)', border: '#00ffff', text: '#00ffff' };
  };

  const subTabColor = getSubTabColor();

  return (
    <>
      {/* Tarih Filtresi */}
      <div className={styles.dateFilterSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={useDateFilter}
            onChange={(e) => handleDateFilterChange(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Tarih filtresi kullan</span>
        </label>
        {useDateFilter && (
          <div className={styles.dateGrid}>
            <Select
              label="Yıl"
              value={analysisYear}
              onChange={(e) => setAnalysisYear(parseInt(e.target.value, 10))}
              onBlur={loadRevenueAnalysis}
              options={years.map(year => ({ value: year, label: year.toString() }))}
            />
            <Select
              label="Ay"
              value={analysisMonth}
              onChange={(e) => setAnalysisMonth(parseInt(e.target.value, 10))}
              onBlur={loadRevenueAnalysis}
              options={months}
            />
          </div>
        )}
      </div>

      {/* Analysis Sub Tab Butonları */}
      <div className={styles.subTabButtons}>
        <Button
          variant={analysisSubTab === 'all' ? 'primary' : 'secondary'}
          onClick={() => setAnalysisSubTab('all')}
          className={styles.subTabButton}
        >
          Tümü
        </Button>
        <Button
          variant={analysisSubTab === 'boat' ? 'primary' : 'secondary'}
          onClick={() => setAnalysisSubTab('boat')}
          className={styles.subTabButton}
          style={analysisSubTab === 'boat' ? { background: '#60a5fa' } : {}}
        >
          🛶 Tekne
        </Button>
        <Button
          variant={analysisSubTab === 'equipment' ? 'primary' : 'secondary'}
          onClick={() => setAnalysisSubTab('equipment')}
          className={styles.subTabButton}
          style={analysisSubTab === 'equipment' ? { background: '#4ade80' } : {}}
        >
          🎣 Ekipman
        </Button>
      </div>

      <div className={`${styles.scrollableContent} accounting-panel-scroll`}>
        {loading && !revenueAnalysis ? (
          <LoadingSpinner text="Yükleniyor..." />
        ) : filteredData.length === 0 ? (
          <p className={styles.emptyMessage}>
            {analysisSubTab === 'boat' ? 'Tekne' : analysisSubTab === 'equipment' ? 'Ekipman' : ''} gelir analizi verisi bulunamadı.
          </p>
        ) : (
          <div className={styles.analysisContent}>
            {/* Özet Bilgi */}
            <Card
              className={styles.summaryCard}
              style={{
                background: subTabColor.bg,
                border: `2px solid ${subTabColor.border}`
              }}
            >
              <h3 className={styles.summaryTitle} style={{ color: subTabColor.text }}>
                {analysisSubTab === 'boat' ? '🛶 Tekne' : analysisSubTab === 'equipment' ? '🎣 Ekipman' : '💰'} Toplam
              </h3>
              <div className={styles.summaryAmount} style={{ color: subTabColor.text }}>
                {totalRevenue.toFixed(2)} ₺
              </div>
              <p className={styles.summaryText}>
                Toplam {totalRentals} kiralama
              </p>
            </Card>

            {/* Detaylı Liste */}
            {filteredData.map((item, index) => (
              <Card
                key={index}
                variant={item.rental_type === 'Boat' ? 'boat' : 'equipment'}
              >
                <div className={styles.analysisItemHeader}>
                  <div>
                    <h4 className={styles.analysisItemTitle}>
                      {item.rental_type === 'Boat' ? '🛶' : '🎣'} {item.item_name}
                    </h4>
                    <p className={styles.analysisItemId}>ID: {item.item_id}</p>
                  </div>
                  <div className={styles.analysisItemRevenue}>
                    {parseFloat(item.total_revenue || 0).toFixed(2)} ₺
                  </div>
                </div>
                <div className={styles.analysisItemGrid}>
                  <div>
                    <span className={styles.analysisLabel}>Kiralama Sayısı: </span>
                    <span className={styles.analysisValue}>{item.rental_count || 0}</span>
                  </div>
                  <div>
                    <span className={styles.analysisLabel}>Ort. Süre: </span>
                    <span className={styles.analysisValue}>
                      {item.avg_rental_hours ? parseFloat(item.avg_rental_hours).toFixed(1) : '0'} saat
                    </span>
                  </div>
                  <div>
                    <span className={styles.analysisLabel}>Ort. Ödeme: </span>
                    <span className={styles.analysisValue}>
                      {item.avg_payment ? parseFloat(item.avg_payment).toFixed(2) : '0'} ₺
                    </span>
                  </div>
                  <div>
                    <span className={styles.analysisLabel}>Toplam Gelir: </span>
                    <span className={styles.analysisValue}>
                      {parseFloat(item.total_revenue || 0).toFixed(2)} ₺
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AnalysisTab;

