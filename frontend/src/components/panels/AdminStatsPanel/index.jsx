import React, { useState, useEffect } from 'react';
import { fetchActiveUsers, fetchAllUsersStats, fetchAllUsersForumStats, fetchAllZonesStats, fetchPopularZonesAnalysis } from '../../../api/api';
import BasePanel from '../BasePanel';
import { TabContainer, TabButtons, TabContent } from '../../ui/Tab';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import UsersTab from './UsersTab';
import SpendingTab from './SpendingTab';
import ForumTab from './ForumTab';
import ZonesTab from './ZonesTab';
import PopularTab from './PopularTab';
import styles from './styles.module.css';

const AdminStatsPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [activeUsers, setActiveUsers] = useState([]);
  const [allUsersStats, setAllUsersStats] = useState([]);
  const [allUsersForumStats, setAllUsersForumStats] = useState([]);
  const [allZonesStats, setAllZonesStats] = useState([]);
  const [popularZonesAnalysis, setPopularZonesAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'users', label: '👥 Kullanıcılar' },
    { id: 'spending', label: '💰 Harcamalar' },
    { id: 'forum', label: '💬 Forum' },
    { id: 'zones', label: '📍 Bölgeler' },
    { id: 'popular', label: '🔥 Popüler' }
  ];

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [users, userStats, forumStats, zonesStats, popularZones] = await Promise.all([
        fetchActiveUsers().catch((err) => {
          console.error('Aktif kullanıcılar yüklenemedi:', err);
          return [];
        }),
        fetchAllUsersStats().catch((err) => {
          console.error('Kullanıcı istatistikleri yüklenemedi:', err);
          return [];
        }),
        fetchAllUsersForumStats().catch((err) => {
          console.error('Forum istatistikleri yüklenemedi:', err);
          return [];
        }),
        fetchAllZonesStats().catch((err) => {
          console.error('Bölge istatistikleri yüklenemedi:', err);
          return [];
        }),
        fetchPopularZonesAnalysis().catch((err) => {
          console.error('Popüler bölgeler analizi yüklenemedi:', err);
          return [];
        }),
      ]);
      setActiveUsers(users);
      setAllUsersStats(userStats);
      setAllUsersForumStats(forumStats);
      setAllZonesStats(zonesStats);
      setPopularZonesAnalysis(popularZones);
    } catch (err) {
      console.error('Admin istatistikleri yüklenirken genel hata:', err);
      setError(err.message || 'İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BasePanel
      isOpen={true}
      onClose={onClose}
      title="📊 Sistem İstatistikleri"
      maxWidth="800px"
    >
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <TabContainer>
        <TabButtons
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <TabContent>
          {loading ? (
            <LoadingSpinner text="Yükleniyor..." />
          ) : (
            <>
              {activeTab === 'users' && <UsersTab activeUsers={activeUsers} />}
              {activeTab === 'spending' && <SpendingTab allUsersStats={allUsersStats} />}
              {activeTab === 'forum' && <ForumTab allUsersForumStats={allUsersForumStats} />}
              {activeTab === 'zones' && <ZonesTab allZonesStats={allZonesStats} />}
              {activeTab === 'popular' && <PopularTab popularZonesAnalysis={popularZonesAnalysis} loading={loading} />}
            </>
          )}
        </TabContent>
      </TabContainer>

      <div className={styles.panelFooter}>
        <Button variant="danger" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </BasePanel>
  );
};

export default AdminStatsPanel;

