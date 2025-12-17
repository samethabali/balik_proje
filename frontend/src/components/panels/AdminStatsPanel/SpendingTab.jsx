import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const SpendingTab = ({ allUsersStats }) => {
  if (allUsersStats.length === 0) {
    return <p className={styles.emptyMessage}>İstatistik bulunamadı.</p>;
  }

  return (
    <div className={styles.scrollableList}>
      <h3 className={styles.tabTitle}>💰 Kullanıcı Harcama İstatistikleri</h3>
      <div className={styles.listContainer}>
        {allUsersStats.map((stat) => (
          <Card key={stat.user_id} className={styles.spendingCard}>
            <div className={styles.statName}>{stat.full_name}</div>
            <div className={styles.statDetails}>
              Tekne: {stat.boat_rental_count || 0} | Ekipman: {stat.equipment_rental_count || 0}
            </div>
            <div className={styles.statTotal}>
              Toplam: {parseFloat(stat.total_spent || 0).toFixed(2)} ₺
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SpendingTab;

