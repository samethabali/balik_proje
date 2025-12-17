import React from 'react';
import ActivityItem from './ActivityItem';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const ActivityList = ({ 
  activities, 
  loading, 
  selectedZone, 
  currentUser,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return <LoadingSpinner text="Etkinlikler yükleniyor…" />;
  }

  const hasActivities = activities.past.length > 0 || activities.current.length > 0 || activities.upcoming.length > 0;

  if (!hasActivities) {
    return (
      <p className={styles.emptyMessage}>
        {selectedZone ? 'Bu bölgede henüz etkinlik bulunmuyor.' : 'Henüz etkinlik bulunmuyor.'}
      </p>
    );
  }

  return (
    <div className={styles.activityList}>
      {/* Güncel Etkinlikler */}
      {activities.current.length > 0 && (
        <div className={styles.activitySection}>
          <h4 className={styles.sectionTitle}>🟢 Güncel Etkinlikler</h4>
          <div className={styles.activityItems}>
            {activities.current.map((activity) => (
              <ActivityItem
                key={activity.activity_id}
                activity={activity}
                variant="current"
                selectedZone={selectedZone}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gelecek Etkinlikler */}
      {activities.upcoming.length > 0 && (
        <div className={styles.activitySection}>
          <h4 className={styles.sectionTitle}>🔵 Gelecek Etkinlikler</h4>
          <div className={styles.activityItems}>
            {activities.upcoming.map((activity) => (
              <ActivityItem
                key={activity.activity_id}
                activity={activity}
                variant="upcoming"
                selectedZone={selectedZone}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Geçmiş Etkinlikler */}
      {activities.past.length > 0 && (
        <div className={styles.activitySection}>
          <h4 className={styles.sectionTitle}>⚪ Geçmiş Etkinlikler</h4>
          <div className={styles.activityItems}>
            {activities.past.map((activity) => (
              <ActivityItem
                key={activity.activity_id}
                activity={activity}
                variant="past"
                selectedZone={selectedZone}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;

