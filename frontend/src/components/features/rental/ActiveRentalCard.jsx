import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import styles from './styles.module.css';

const ActiveRentalCard = ({ 
  rental, 
  type, // 'boat' or 'equipment'
  onReturn,
  calculateCurrentCost 
}) => {
  const currentCost = calculateCurrentCost 
    ? calculateCurrentCost(rental, rental.price_per_hour || 0)
    : 0;

  const rentalName = type === 'boat' 
    ? (rental.boat_name || 'Tekne')
    : (rental.equipment_name || 'Ekipman');

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(dateValue).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={styles.activeRentalCard}>
      <div className={styles.activeRentalHeader}>
        <div>
          <strong className={styles.activeRentalName}>{rentalName}</strong>
          {type === 'equipment' && rental.brand && rental.model && (
            <p className={styles.activeRentalSpecs}>
              {rental.brand} {rental.model}
            </p>
          )}
          <p className={styles.activeRentalTime}>
            Başlangıç: {formatTime(rental.start_at)}
          </p>
          <p className={styles.activeRentalPrice}>
            {rental.price_per_hour} ₺/saat
          </p>
        </div>
        <div className={styles.activeRentalCost}>
          {currentCost.toFixed(2)} ₺
        </div>
      </div>
      {onReturn && (
        <Button
          variant="success"
          onClick={onReturn}
          className={styles.returnButton}
        >
          {type === 'boat' ? 'Kiralamayı Bitir' : 'İade Et'}
        </Button>
      )}
    </Card>
  );
};

export default ActiveRentalCard;

