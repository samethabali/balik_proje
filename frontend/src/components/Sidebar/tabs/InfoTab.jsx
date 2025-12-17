import React from 'react';
import { isAdmin } from '../../../utils/admin';
import ActivityList from '../../features/activities/ActivityList';
import Button from '../../ui/Button';
import styles from '../styles.module.css';

const InfoTab = ({ 
  selectedZone, 
  activities, 
  activitiesLoading, 
  currentUser,
  onAddActivity,
  onEditActivity,
  onDeleteActivity
}) => {
  return (
    <div className={`${styles.infoTab} info-tab-scroll`}>
      <h2 className={styles.infoTitle}>
        Van Gölü Balıkçılık İşletmesi
      </h2>
      <p className={styles.infoDescription}>
        {selectedZone
          ? `Şu an "${selectedZone.name}" bölgesini inceliyorsunuz. Bu bölgedeki avlanma kurallarına dikkat ediniz.`
          : "Türkiye'nin en büyük sodalı gölü olan Van Gölü üzerinde güvenli ve kontrollü balıkçılık deneyimi sunuyoruz."
        }
      </p>
      <div className={styles.infoBox}>
        <strong>Seçili Bölge:</strong> {selectedZone ? selectedZone.name : "Tüm Göl"} <br />
        <strong>Konum:</strong> Van Gölü / Gevaş Merkezi<br />
        <strong>Hizmetler:</strong> Tekne kiralama, ekipman kiralama, rehberli turlar.
      </div>

      {/* Etkinlikler Bölümü */}
      <div className={styles.activitiesSection}>
        <div className={styles.activitiesHeader}>
          <h3 className={styles.activitiesTitle}>
            📅 {selectedZone ? 'Bölge Etkinlikleri' : 'Tüm Etkinlikler'}
          </h3>
          {isAdmin(currentUser) && (
            <Button
              variant="success"
              onClick={() => onAddActivity()}
              className={styles.addActivityButton}
            >
              ➕ Etkinlik Ekle
            </Button>
          )}
        </div>

        <ActivityList
          activities={activities}
          loading={activitiesLoading}
          selectedZone={selectedZone}
          currentUser={currentUser}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
        />
      </div>
    </div>
  );
};

export default InfoTab;

