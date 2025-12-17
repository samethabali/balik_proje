import React from 'react';
import { isAdmin } from '../../../utils/admin';
import EquipmentRentalList from '../../features/rental/EquipmentRentalList';
import ActiveRentalCard from '../../features/rental/ActiveRentalCard';
import Button from '../../ui/Button';
import styles from '../styles.module.css';

const EquipTab = ({ 
  availableEquipment,
  myRentals,
  equipmentLoading,
  equipmentError,
  hasToken,
  currentUser,
  onRent,
  onReturn,
  onReturnAll,
  onEdit,
  onDelete,
  onAdd
}) => {
  const admin = isAdmin(currentUser);

  const calculateCurrentCost = (rental, pricePerHour) => {
    if (!rental || !rental.start_at || !pricePerHour) return 0;
    const startTime = new Date(rental.start_at);
    const now = new Date();
    const durationSeconds = (now - startTime) / 1000;
    const durationHours = Math.ceil(durationSeconds / 3600);
    return durationHours * parseFloat(pricePerHour);
  };

  return (
    <div className={`${styles.equipTab} equip-tab-scroll`}>
      <h3 className={styles.tabTitle}>🎣 Ekipman Kiralama</h3>

      {admin && (
        <Button
          variant="success"
          onClick={() => onAdd()}
          className={styles.addButton}
        >
          ➕ Ekipman Ekle
        </Button>
      )}

      {/* Elimdekiler (Sepetim) - Sadece normal kullanıcılar için */}
      {!admin && hasToken && myRentals.length > 0 && (
        <div className={styles.myRentalsSection}>
          <div className={styles.myRentalsHeader}>
            <h4 className={styles.myRentalsTitle}>✅ Elimdekiler ({myRentals.length})</h4>
            <Button
              variant="danger"
              onClick={onReturnAll}
              className={styles.returnAllButton}
            >
              Hepsini İade Et
            </Button>
          </div>

          <div className={styles.myRentalsList}>
            {myRentals.map((rental) => (
              <div key={rental.equipment_rental_id} className={styles.myRentalItem}>
                <div>
                  <strong className={styles.myRentalName}>{rental.equipment_name}</strong>
                  <span className={styles.myRentalPrice}>
                    {rental.price_per_hour} ₺/saat
                  </span>
                </div>
                <Button
                  variant="success"
                  onClick={() => onReturn(rental.equipment_rental_id)}
                  className={styles.returnButton}
                >
                  İade Et
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Müsait Ekipmanlar */}
      <div>
        {!hasToken && !admin && (
          <p className={styles.loginPrompt}>
            Ekipman kiralamak için giriş yapmalısınız.
          </p>
        )}
        <h4 className={styles.sectionSubtitle}>🛒 Müsait Ekipmanlar</h4>

        <EquipmentRentalList
          equipment={availableEquipment}
          loading={equipmentLoading}
          error={equipmentError}
          isAdmin={admin}
          hasToken={hasToken}
          onRent={onRent}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default EquipTab;

