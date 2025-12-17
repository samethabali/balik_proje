import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const PopularTab = ({ popularZonesAnalysis, loading }) => {
  if (loading) {
    return <p className={styles.emptyMessage}>Yükleniyor...</p>;
  }

  if (popularZonesAnalysis.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Popüler bölge analizi bulunamadı.</p>
        <p className={styles.emptyHint}>
          Veritabanında aktivite, post, yorum veya beğeni olan bölge bulunmuyor olabilir.
          <br />
          Tarayıcı konsolunu (F12) kontrol edin.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.scrollableList}>
      <div className={styles.popularHeader}>
        <h3 className={styles.tabTitle}>🔥 Popüler Bölgeler Analizi</h3>
        <p className={styles.popularDescription}>
          Popülerlik Skoru: Aktivite (3 puan) + Post (2 puan) + Yorum (1.5 puan) + Beğeni (1 puan)
        </p>
      </div>
      <div className={styles.listContainer}>
        {popularZonesAnalysis.map((zone) => (
          <Card key={zone.zone_id} className={styles.popularCard}>
            <div className={styles.popularHeaderRow}>
              <div className={styles.statName}>{zone.zone_name}</div>
              <div className={styles.popularScore}>
                Skor: {parseFloat(zone.popularity_score || 0).toFixed(1)}
              </div>
            </div>
            <div className={styles.statDetails}>
              Aktivite: {zone.total_activities || 0} | Post: {zone.total_posts || 0} | Yorum: {zone.total_comments || 0} | Beğeni: {zone.total_likes || 0}
            </div>
            <div className={styles.statDetails}>
              Aktif Kullanıcı: {zone.active_users_count || 0} | Ort. Aktivite/Kullanıcı: {parseFloat(zone.avg_activities_per_user || 0).toFixed(2)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PopularTab;

