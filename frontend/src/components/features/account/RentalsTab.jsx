import React from 'react';
import Card from '../../ui/Card';
import ActiveRentalCard from '../rental/ActiveRentalCard';
import styles from './styles.module.css';

const RentalsTab = ({ myActiveRentals, calculateCurrentCost }) => {
  const totalBoatCost = myActiveRentals.boats.reduce((sum, rental) => {
    return sum + calculateCurrentCost(rental, rental.price_per_hour || 0);
  }, 0);

  const totalEquipmentCost = myActiveRentals.equipment.reduce((sum, rental) => {
    return sum + calculateCurrentCost(rental, rental.price_per_hour || 0);
  }, 0);

  const formatTimeTR = (dateString) => {
    if (!dateString) return '';
    const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(dateValue).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.rentalsContainer}>
      <h4 className={styles.sectionTitle}>🛶 Aktif Kiralamalarım</h4>

      {/* Tekneler */}
      {myActiveRentals.boats.length > 0 && (
        <div>
          <h5 className={styles.subsectionTitle}>Tekneler</h5>
          <div className={styles.rentalsList}>
            {myActiveRentals.boats.map((rental) => (
              <ActiveRentalCard
                key={rental.rental_id}
                rental={rental}
                type="boat"
                calculateCurrentCost={calculateCurrentCost}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ekipmanlar */}
      {myActiveRentals.equipment.length > 0 && (
        <div>
          <h5 className={styles.subsectionTitle}>Ekipmanlar</h5>
          <div className={styles.rentalsList}>
            {myActiveRentals.equipment.map((rental) => (
              <ActiveRentalCard
                key={rental.equipment_rental_id}
                rental={rental}
                type="equipment"
                calculateCurrentCost={calculateCurrentCost}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toplam */}
      {(myActiveRentals.boats.length > 0 || myActiveRentals.equipment.length > 0) && (
        <Card className={styles.totalCard}>
          <div className={styles.totalContent}>
            <strong className={styles.totalLabel}>Toplam Anlık Maliyet:</strong>
            <strong className={styles.totalAmount}>
              {(totalBoatCost + totalEquipmentCost).toFixed(2)} ₺
            </strong>
          </div>
        </Card>
      )}

      {myActiveRentals.boats.length === 0 && myActiveRentals.equipment.length === 0 && (
        <p className={styles.emptyMessage}>Aktif kiralamanız bulunmuyor.</p>
      )}
    </div>
  );
};

export default RentalsTab;

