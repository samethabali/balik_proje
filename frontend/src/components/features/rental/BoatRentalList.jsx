import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const BoatRentalList = ({ 
  boats, 
  loading, 
  error, 
  isAdmin, 
  hasToken, 
  activeRental,
  onRent, 
  onEdit, 
  onDelete 
}) => {
  if (loading) {
    return <LoadingSpinner text="Tekneler yükleniyor…" />;
  }

  if (error) {
    return <p className={styles.errorMessage}>{error}</p>;
  }

  if (boats.length === 0) {
    return <p className={styles.emptyMessage}>Müsait tekne yok.</p>;
  }

  return (
    <div className={styles.rentalList}>
      {boats.map((boat) => (
        <Card key={boat.boat_id} className={styles.rentalCard}>
          <div className={styles.rentalInfo}>
            <div className={styles.rentalDetails}>
              <strong className={styles.rentalName}>{boat.name}</strong>
              <p className={styles.rentalSpecs}>
                Kapasite: {boat.capacity} kişi - {boat.price_per_hour} ₺/saat
              </p>
            </div>
            <div className={styles.rentalActions}>
              {isAdmin ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => onEdit(boat)}
                    className={styles.actionButton}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onDelete(boat.boat_id)}
                    className={styles.actionButton}
                  >
                    Sil
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => onRent(boat.boat_id)}
                  disabled={!hasToken || !!activeRental}
                  className={styles.rentButton}
                >
                  Kirala
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BoatRentalList;

