import React from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const RentalList = ({ rentals, loading }) => {
  if (loading && rentals.length === 0) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  if (rentals.length === 0) {
    return <p className={styles.emptyMessage}>Kiralama bulunamadı. Filtreleri değiştirip tekrar deneyin.</p>;
  }

  return (
    <div className={styles.rentalList}>
      {rentals.map((rental) => (
        <Card key={`${rental.rental_type}-${rental.rental_id}`} className={styles.rentalCard}>
          <div className={styles.rentalHeader}>
            <div className={styles.rentalInfo}>
              <div className={styles.rentalTitleRow}>
                <strong className={styles.rentalName}>{rental.item_name}</strong>
                <Badge variant={rental.rental_type === 'boat' ? 'boat' : 'equipment'}>
                  {rental.rental_type === 'boat' ? '🛶 Tekne' : '🎣 Ekipman'}
                </Badge>
              </div>
              <p className={styles.rentalUser}>
                👤 {rental.user_name} ({rental.user_email})
              </p>
              <p className={styles.rentalDate}>
                📅 Başlangıç: {new Date(rental.start_at).toLocaleString('tr-TR')}
              </p>
              <p className={styles.rentalDate}>
                📅 Bitiş: {new Date(rental.end_at).toLocaleString('tr-TR')}
              </p>
              <p className={styles.rentalDate}>
                ⏱️ Süre: {rental.duration_hours} saat
              </p>
            </div>
            <div className={styles.rentalPrice}>
              {rental.total_price.toFixed(2)} ₺
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RentalList;

