import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const UsersTab = ({ activeUsers }) => {
  if (activeUsers.length === 0) {
    return <p className={styles.emptyMessage}>Aktif kullanıcı bulunamadı.</p>;
  }

  return (
    <div className={styles.scrollableList}>
      <h3 className={styles.tabTitle}>👥 Aktif Kullanıcılar ({activeUsers.length})</h3>
      <div className={styles.listContainer}>
        {activeUsers.map((user) => (
          <Card key={user.user_id} className={styles.userCard}>
            <div className={styles.userName}>{user.full_name}</div>
            <div className={styles.userEmail}>{user.email}</div>
            <div className={styles.userRole}>Rol: {user.role_name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UsersTab;

