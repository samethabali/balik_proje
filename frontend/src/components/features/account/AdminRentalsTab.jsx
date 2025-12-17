import React from 'react';
import { closeRental, fetchAllRentals } from '../../../api/api';
import toast from 'react-hot-toast';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ConfirmModal from '../../modals/ConfirmModal';
import styles from './styles.module.css';

const AdminRentalsTab = ({ allRentals, loading, onRefresh }) => {
  const [confirmModal, setConfirmModal] = React.useState({ open: false, rentalId: null, rentalType: null });

  const formatTimeTR = (dateString) => {
    if (!dateString) return '';
    const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(dateValue).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCloseRental = async (rentalId, rentalType) => {
    try {
      await closeRental(rentalId, rentalType);
      onRefresh?.();
      toast.success('Kiralama kapatıldı');
    } catch (err) {
      toast.error(err.message || 'Hata oluştu');
    }
  };

  const openConfirmModal = (rentalId, rentalType) => {
    setConfirmModal({ open: true, rentalId, rentalType });
  };

  const handleConfirm = () => {
    if (confirmModal.rentalId && confirmModal.rentalType) {
      handleCloseRental(confirmModal.rentalId, confirmModal.rentalType);
    }
    setConfirmModal({ open: false, rentalId: null, rentalType: null });
  };

  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  return (
    <>
      <div className={styles.adminRentalsContainer}>
        <h4 className={styles.sectionTitle}>🔧 Tüm Aktif Kiralamalar</h4>

        {/* Tekne Kiralamaları */}
        {allRentals?.boats?.length > 0 && (
          <div>
            <h5 className={styles.subsectionTitle}>Tekneler</h5>
            <div className={styles.rentalsList}>
              {allRentals.boats.map((rental) => (
                <Card key={rental.rental_id} className={styles.rentalCard}>
                  <div className={styles.rentalHeader}>
                    <div className={styles.rentalInfo}>
                      <strong className={styles.rentalName}>{rental.item_name}</strong>
                      <p className={styles.rentalUser}>
                        Kullanıcı: {rental.user_name} ({rental.user_email})
                      </p>
                      <p className={styles.rentalTime}>
                        Başlangıç: {formatTimeTR(rental.start_at)}
                      </p>
                      <p className={styles.rentalPrice}>
                        {rental.price_per_hour} ₺/saat
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => openConfirmModal(rental.rental_id, 'boat')}
                      className={styles.closeButton}
                    >
                      Kapat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ekipman Kiralamaları */}
        {allRentals?.equipment?.length > 0 && (
          <div>
            <h5 className={styles.subsectionTitle}>Ekipmanlar</h5>
            <div className={styles.rentalsList}>
              {allRentals.equipment.map((rental) => (
                <Card key={rental.rental_id} className={styles.rentalCard}>
                  <div className={styles.rentalHeader}>
                    <div className={styles.rentalInfo}>
                      <strong className={styles.rentalName}>{rental.item_name}</strong>
                      <p className={styles.rentalUser}>
                        Kullanıcı: {rental.user_name} ({rental.user_email})
                      </p>
                      <p className={styles.rentalTime}>
                        Başlangıç: {formatTimeTR(rental.start_at)}
                      </p>
                      <p className={styles.rentalPrice}>
                        {rental.price_per_hour} ₺/saat
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => openConfirmModal(rental.rental_id, 'equipment')}
                      className={styles.closeButton}
                    >
                      Kapat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {allRentals?.boats?.length === 0 && allRentals?.equipment?.length === 0 && (
          <p className={styles.emptyMessage}>Aktif kiralama bulunmuyor.</p>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, rentalId: null, rentalType: null })}
        onConfirm={handleConfirm}
        title="Kiralama Kapat"
        message="Bu kiralamayı kapatmak istediğinize emin misiniz?"
        confirmText="Kapat"
        cancelText="İptal"
        variant="danger"
      />
    </>
  );
};

export default AdminRentalsTab;

