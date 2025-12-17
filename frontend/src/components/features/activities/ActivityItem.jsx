import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { isAdmin } from '../../../utils/admin';
import styles from './styles.module.css';

const ActivityItem = ({ 
  activity, 
  variant = 'current', // 'current', 'upcoming', 'past'
  selectedZone,
  currentUser,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const variantStyles = {
    current: {
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      titleColor: '#22c55e'
    },
    upcoming: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      titleColor: '#3b82f6'
    },
    past: {
      background: 'rgba(136, 136, 136, 0.1)',
      border: '1px solid rgba(136, 136, 136, 0.3)',
      titleColor: '#888',
      opacity: 0.7
    }
  };

  const style = variantStyles[variant] || variantStyles.current;

  return (
    <Card 
      className={styles.activityItem}
      style={{
        background: style.background,
        border: style.border,
        opacity: variant === 'past' ? 0.7 : 1
      }}
    >
      <strong className={styles.activityTitle} style={{ color: style.titleColor }}>
        {activity.title}
      </strong>
      {activity.description && (
        <p className={styles.activityDescription}>{activity.description}</p>
      )}
      {!selectedZone && activity.zone_name && (
        <p className={styles.activityZone}>📍 {activity.zone_name}</p>
      )}
      <p className={styles.activityDate}>
        {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
      </p>
      {isAdmin(currentUser) && (
        <div className={styles.activityActions}>
          <Button
            variant="primary"
            onClick={() => onEdit(activity)}
            className={styles.actionButton}
          >
            Düzenle
          </Button>
          <Button
            variant="danger"
            onClick={() => onDelete(activity.activity_id)}
            className={styles.actionButton}
          >
            Sil
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ActivityItem;

