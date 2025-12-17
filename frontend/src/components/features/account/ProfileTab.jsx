import React from 'react';
import { isAdmin } from '../../../utils/admin';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import styles from './styles.module.css';

const ProfileTab = ({ userInfo, userStats, userForumStats, currentUser, onLogout, loading }) => {
  return (
    <div className={styles.profileContainer}>
      <h4 className={styles.sectionTitle}>👤 Kullanıcı Bilgileri</h4>
      {userInfo ? (
        <Card className={styles.infoCard}>
          <p className={styles.infoItem}><strong>Ad Soyad:</strong> {userInfo.full_name}</p>
          <p className={styles.infoItem}><strong>E-posta:</strong> {userInfo.email || 'Belirtilmemiş'}</p>
          <p className={styles.infoItem}><strong>Telefon:</strong> {userInfo.phone || 'Belirtilmemiş'}</p>
          <p className={styles.infoItem}><strong>Kayıt Tarihi:</strong> {new Date(userInfo.created_at).toLocaleDateString('tr-TR')}</p>
        </Card>
      ) : (
        <p className={styles.errorText}>Kullanıcı bilgileri yüklenemedi.</p>
      )}

      {/* Kullanıcı İstatistikleri - Sadece admin olmayan kullanıcılar için */}
      {userStats && !isAdmin(currentUser) && (
        <>
          <h4 className={styles.sectionTitle}>📊 Kiralama İstatistikleri</h4>
          <Card className={styles.statsCard}>
            <p className={styles.infoItem}>
              <strong>Tekne Kiralamaları:</strong> {userStats.boat_rental_count || 0}
            </p>
            <p className={styles.infoItem}>
              <strong>Ekipman Kiralamaları:</strong> {userStats.equipment_rental_count || 0}
            </p>
            <p className={styles.totalSpent}>
              <strong>Toplam Harcama:</strong> {parseFloat(userStats.total_spent || 0).toFixed(2)} ₺
            </p>
          </Card>
        </>
      )}

      {/* Forum İstatistikleri */}
      {userForumStats && (
        <Card className={styles.forumStatsCard}>
          <h4 className={styles.forumStatsTitle}>💬 Forum İstatistikleriniz</h4>
          {loading ? (
            <p className={styles.loadingText}>Yükleniyor...</p>
          ) : userForumStats ? (
            <div className={styles.forumStatsGrid}>
              <div>
                <span className={styles.statsLabel}>Post Sayısı: </span>
                <span className={styles.statsValue}>{userForumStats.post_count || 0}</span>
              </div>
              <div>
                <span className={styles.statsLabel}>Yorum Sayısı: </span>
                <span className={styles.statsValue}>{userForumStats.comment_count || 0}</span>
              </div>
              <div>
                <span className={styles.statsLabel}>Beğenilen Postlar: </span>
                <span className={styles.statsValue}>{userForumStats.liked_post_count || 0}</span>
              </div>
              <div>
                <span className={styles.statsLabel}>Toplam Fotoğraf: </span>
                <span className={styles.statsValue}>{userForumStats.total_photos || 0}</span>
              </div>
            </div>
          ) : (
            <p className={styles.errorText}>İstatistikler yüklenemedi.</p>
          )}
        </Card>
      )}

      <Button variant="danger" onClick={onLogout} className={styles.logoutButton}>
        Çıkış Yap
      </Button>
    </div>
  );
};

export default ProfileTab;

