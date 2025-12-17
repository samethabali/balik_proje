import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const EquipmentRentalList = ({ 
  equipment, 
  loading, 
  error, 
  isAdmin, 
  hasToken,
  onRent, 
  onEdit, 
  onDelete 
}) => {
  if (loading) {
    return <LoadingSpinner text="Yükleniyor…" />;
  }

  if (error) {
    return <p className={styles.errorMessage}>{error}</p>;
  }

  if (equipment.length === 0) {
    return <p className={styles.emptyMessage}>Müsait ekipman yok.</p>;
  }

  return (
    <div className={styles.rentalList}>
      {equipment.map((item) => (
        <Card key={item.equipment_id} className={styles.rentalCard}>
          <div className={styles.rentalInfo}>
            <div className={styles.rentalDetails}>
              <strong className={styles.rentalName}>
                {item.brand} {item.model}
              </strong>
              {item.type_name && (
                <p className={styles.rentalSpecs}>Tip: {item.type_name}</p>
              )}
              <p className={styles.rentalSpecs}>{item.price_per_hour} ₺/saat</p>
            </div>
            <div className={styles.rentalActions}>
              {isAdmin ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => onEdit(item)}
                    className={styles.actionButton}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onDelete(item.equipment_id)}
                    className={styles.actionButton}
                  >
                    Sil
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => onRent(item.equipment_id)}
                  disabled={!hasToken}
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

export default EquipmentRentalList;

