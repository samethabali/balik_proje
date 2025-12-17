import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const ZonesTab = ({ allZonesStats }) => {
  if (allZonesStats.length === 0) {
    return <p className={styles.emptyMessage}>Bölge istatistiği bulunamadı.</p>;
  }

  return (
    <div className={styles.scrollableList}>
      <h3 className={styles.tabTitle}>📍 Bölge İstatistikleri</h3>
      <div className={styles.listContainer}>
        {allZonesStats.map((stat) => (
          <Card key={stat.zone_id} className={styles.zonesCard}>
            <div className={styles.statName}>{stat.zone_name}</div>
            <div className={styles.statDetails}>
              Aktivite: {stat.activity_count || 0} | Post: {stat.post_count || 0}
            </div>
            {stat.avg_activity_duration_hours && (
              <div className={styles.statDetails}>
                Ort. Süre: {parseFloat(stat.avg_activity_duration_hours).toFixed(1)} saat
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ZonesTab;

