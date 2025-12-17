import React, { useState, useEffect } from 'react';
import { fetchMonthlyTrendAnalysis } from '../../../api/api';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const TrendTab = () => {
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTrendAnalysis = async () => {
      setLoading(true);
      try {
        const data = await fetchMonthlyTrendAnalysis();
        setTrendAnalysis(data);
      } catch (err) {
        console.error('Trend analizi yüklenemedi:', err);
        setTrendAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrendAnalysis();
  }, []);

  if (loading && !trendAnalysis) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  if (!trendAnalysis || trendAnalysis.length === 0) {
    return <p className={styles.emptyMessage}>Trend analizi verisi bulunamadı.</p>;
  }

  return (
    <div className={styles.trendList}>
      {trendAnalysis.map((month, index) => (
        <Card key={index} className={styles.trendCard}>
          <div className={styles.trendHeader}>
            <h3 className={styles.trendMonth}>{month.month_name}</h3>
            <div
              className={styles.trendBadge}
              style={{
                color:
                  month.trend === '📈 Artış'
                    ? '#22c55e'
                    : month.trend === '📉 Azalış'
                    ? '#ef4444'
                    : '#888'
              }}
            >
              {month.trend}
            </div>
          </div>

          <div className={styles.trendGrid}>
            <div>
              <span className={styles.trendLabel}>Tekne Kiralamaları: </span>
              <span className={styles.trendValue}>{month.boat_rentals || 0}</span>
            </div>
            <div>
              <span className={styles.trendLabel}>Ekipman Kiralamaları: </span>
              <span className={styles.trendValue}>{month.equipment_rentals || 0}</span>
            </div>
            <div>
              <span className={styles.trendLabel}>Toplam Kiralama: </span>
              <span className={styles.trendValue}>{month.total_rentals || 0}</span>
            </div>
            <div>
              <span className={styles.trendLabel}>Toplam Gelir: </span>
              <span className={styles.trendRevenue}>
                {parseFloat(month.total_revenue || 0).toFixed(2)} ₺
              </span>
            </div>
          </div>

          {month.revenue_change_percent !== null && (
            <div
              className={styles.trendChange}
              style={{
                color:
                  month.revenue_change_percent > 0
                    ? '#22c55e'
                    : month.revenue_change_percent < 0
                    ? '#ef4444'
                    : '#888'
              }}
            >
              Gelir Değişimi: {month.revenue_change_percent > 0 ? '+' : ''}
              {month.revenue_change_percent}%
            </div>
          )}

          {month.peak_day && (
            <div className={styles.peakDay}>
              En Yoğun Gün: {new Date(month.peak_day).toLocaleDateString('tr-TR')} (
              {month.peak_day_rentals} kiralama)
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default TrendTab;

