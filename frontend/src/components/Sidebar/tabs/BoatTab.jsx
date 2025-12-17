import React from 'react';
import { isAdmin } from '../../../utils/admin';
import BoatRentalList from '../../features/rental/BoatRentalList';
import ActiveRentalCard from '../../features/rental/ActiveRentalCard';
import Button from '../../ui/Button';
import styles from '../styles.module.css';

const BoatTab = ({ 
  availableBoats,
  boatsLoading,
  boatsError,
  activeRental,
  hasToken,
  currentUser,
  onRent,
  onComplete,
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
    <div className={styles.boatTab}>
      <h3 className={styles.tabTitle}>🛶 Tekne Kiralama</h3>

      {admin && (
        <Button
          variant="success"
          onClick={() => onAdd()}
          className={styles.addButton}
        >
          ➕ Tekne Ekle
        </Button>
      )}

      {!hasToken && !admin && (
        <p className={styles.loginPrompt}>
          Tekne kiralamak için giriş yapmalısınız.
        </p>
      )}

      {!admin && activeRental && (
        <div className={styles.activeRentalSection}>
          <strong className={styles.activeRentalTitle}>Aktif Kiralamanız:</strong>
          <br />
          Tekne: {activeRental.boat_name || 'Yükleniyor...'}
          <br />
          <Button
            variant="success"
            onClick={onComplete}
            className={styles.completeButton}
          >
            Kiralamayı Bitir
          </Button>
        </div>
      )}

      <h4 className={styles.sectionSubtitle}>🛳️ Müsait Tekneler</h4>

      <BoatRentalList
        boats={availableBoats}
        loading={boatsLoading}
        error={boatsError}
        isAdmin={admin}
        hasToken={hasToken}
        activeRental={activeRental}
        onRent={onRent}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default BoatTab;

