import React, { useState, useEffect } from 'react';
import SidebarTabs from './SidebarTabs';
import InfoTab from './tabs/InfoTab';
import BoatTab from './tabs/BoatTab';
import EquipTab from './tabs/EquipTab';
import ForumTab from './tabs/ForumTab';
import AccountTab from './tabs/AccountTab';
import AdminPanels from '../AdminPanels';
import {
  fetchAvailableBoats,
  createBoatRental,
  completeBoatRental,
  fetchAvailableEquipment,
  createEquipmentRental,
  completeEquipmentRental,
  fetchMyActiveEquipment,
  returnAllEquipment,
  fetchUserInfo,
  fetchUserStats,
  fetchUserForumStats,
  fetchMyActiveBoatRentals,
  fetchMyPosts,
  fetchZoneActivities,
  fetchUpcomingActivitiesByZone,
  fetchAllActivities,
  deleteBoat,
  deleteEquipment,
  deleteActivity,
  fetchAllRentals,
} from '../../api/api';
import { isAdmin } from '../../utils/admin';
import toast from 'react-hot-toast';
import styles from './styles.module.css';

const TABS = {
  INFO: 'info',
  BOAT: 'boat',
  EQUIP: 'equip',
  FORUM: 'forum',
  ACCOUNT: 'account',
};

const Sidebar = ({ selectedZone, currentUser, onLoginSuccess, onLogout }) => {
  const [activeTab, setActiveTab] = useState(TABS.INFO);

  // Boat tab state
  const [availableBoats, setAvailableBoats] = useState([]);
  const [boatsLoading, setBoatsLoading] = useState(false);
  const [boatsError, setBoatsError] = useState(null);
  const [activeRental, setActiveRental] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Equipment tab state
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState(null);
  const [equipmentActionMessage, setEquipmentActionMessage] = useState('');

  // Account tab state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userForumStats, setUserForumStats] = useState(null);
  const [myActiveRentals, setMyActiveRentals] = useState({ boats: [], equipment: [] });
  const [myPosts, setMyPosts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [allRentals, setAllRentals] = useState({ boats: [], equipment: [] });
  const [rentalsLoading, setRentalsLoading] = useState(false);

  // Activities state
  const [activities, setActivities] = useState({ past: [], current: [], upcoming: [] });
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Admin panel state
  const [adminPanel, setAdminPanel] = useState({ open: false, type: null, item: null });

  const hasToken = !!localStorage.getItem('token');

  // Load boats when BOAT tab is active
  useEffect(() => {
    if (activeTab !== TABS.BOAT) return;

    const loadBoatsData = async () => {
      setBoatsLoading(true);
      setBoatsError(null);

      try {
        const availableData = await fetchAvailableBoats();
        setAvailableBoats(availableData);

        const token = localStorage.getItem('token');
        if (!token) {
          setActiveRental(null);
          return;
        }

        const myRentals = await fetchMyActiveBoatRentals();
        if (myRentals && myRentals.length > 0) {
          setActiveRental(myRentals[0]);
        } else {
          setActiveRental(null);
        }
      } catch (err) {
        console.error(err);
        setBoatsError('Tekne verileri alınırken hata oluştu.');
      } finally {
        setBoatsLoading(false);
      }
    };

    loadBoatsData();
  }, [activeTab, currentUser]);

  // Load equipment when EQUIP tab is active
  useEffect(() => {
    if (activeTab !== TABS.EQUIP) return;

    const loadEquipmentData = async () => {
      setEquipmentLoading(true);
      setEquipmentError(null);

      try {
        const availData = await fetchAvailableEquipment();
        setAvailableEquipment(availData);

        const token = localStorage.getItem('token');
        if (!token) {
          setMyRentals([]);
          return;
        }

        const myData = await fetchMyActiveEquipment();
        setMyRentals(myData);
      } catch (err) {
        console.error(err);
        setEquipmentError('Ekipman verileri alınamadı.');
      } finally {
        setEquipmentLoading(false);
      }
    };

    loadEquipmentData();
  }, [activeTab]);

  // Load account data when ACCOUNT tab is active
  useEffect(() => {
    if (activeTab !== TABS.ACCOUNT) return;

    if (currentUser && currentUser.user_id) {
      setIsLoggedIn(true);
      loadAccountData();
    } else {
      setIsLoggedIn(false);
    }
  }, [activeTab, currentUser]);

  // Load activities when INFO tab is active
  useEffect(() => {
    if (activeTab !== TABS.INFO) {
      setActivities({ past: [], current: [], upcoming: [] });
      return;
    }

    const loadActivities = async () => {
      setActivitiesLoading(true);
      try {
        let data;
        if (selectedZone) {
          const zoneId = selectedZone.zone_id || selectedZone.id;
          if (zoneId) {
            const upcomingData = await fetchUpcomingActivitiesByZone(zoneId).catch(() => []);
            const allData = await fetchZoneActivities(zoneId).catch(() => ({ past: [], current: [], upcoming: [] }));
            data = {
              ...allData,
              upcoming: Array.isArray(upcomingData) ? upcomingData : []
            };
          } else {
            data = { past: [], current: [], upcoming: [] };
          }
        } else {
          data = await fetchAllActivities();
        }
        setActivities(data);
      } catch (err) {
        console.error('Etkinlikler yüklenemedi:', err);
        setActivities({ past: [], current: [], upcoming: [] });
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, [selectedZone, activeTab]);

  // Load account data
  const loadAccountData = async () => {
    if (!currentUser || !currentUser.user_id) return;

    setAccountLoading(true);
    try {
      const [userData, stats, forumStats, boatRentals, equipmentRentals, posts] = await Promise.all([
        fetchUserInfo(currentUser.user_id).catch(() => null),
        fetchUserStats(currentUser.user_id).catch(() => null),
        fetchUserForumStats(currentUser.user_id).catch(() => null),
        fetchMyActiveBoatRentals().catch(() => []),
        fetchMyActiveEquipment().catch(() => []),
        fetchMyPosts().catch(() => []),
      ]);

      setUserInfo(userData);
      setUserStats(stats);
      setUserForumStats(forumStats);
      setMyActiveRentals({ boats: boatRentals || [], equipment: equipmentRentals || [] });
      setMyPosts(posts || []);
    } catch (err) {
      console.error('Account verileri yüklenemedi:', err);
    } finally {
      setAccountLoading(false);
    }
  };

  // Load all rentals for admin
  const loadAllRentals = async () => {
    setRentalsLoading(true);
    try {
      const data = await fetchAllRentals();
      setAllRentals(data);
    } catch (err) {
      console.error('Kiralamalar yüklenemedi:', err);
      setAllRentals({ boats: [], equipment: [] });
    } finally {
      setRentalsLoading(false);
    }
  };

  // Calculate current cost helper
  const calculateCurrentCost = (rental, pricePerHour) => {
    if (!rental || !rental.start_at || !pricePerHour) return 0;
    const startTime = new Date(rental.start_at);
    const now = new Date();
    const durationSeconds = (now - startTime) / 1000;
    const durationHours = Math.ceil(durationSeconds / 3600);
    return durationHours * parseFloat(pricePerHour);
  };

  // Boat handlers
  const handleRentBoat = async (boatId) => {
    try {
      setActionMessage('');
      await createBoatRental(boatId, 60);
      setAvailableBoats(await fetchAvailableBoats());
      const myRentals = await fetchMyActiveBoatRentals();
      if (myRentals && myRentals.length > 0) {
        setActiveRental(myRentals[0]);
        toast.success(`Tekne kiralandı! (${myRentals[0].boat_name})`);
      } else {
        setActiveRental(null);
      }
    } catch (err) {
      setActionMessage(err.message || 'Hata oluştu.');
    }
  };

  const handleCompleteRental = async () => {
    if (!activeRental) return;
    try {
      setActionMessage('');
      const result = await completeBoatRental(activeRental.rental_id);
      const msg = `İade alındı. Süre: ${result.duration_hours} saat. Tutar: ${result.total_price} ₺`;
      toast.success(msg);
      setActiveRental(null);
      setAvailableBoats(await fetchAvailableBoats());
    } catch (err) {
      const m = err.message || 'Hata oluştu.';
      setActionMessage(m);
      toast.error(m);
    }
  };

  // Equipment handlers
  const handleRentEquipment = async (equipmentId) => {
    try {
      setEquipmentActionMessage('');
      await createEquipmentRental(equipmentId, 60);
      toast.success('Ekipman sepete eklendi!');
      setAvailableEquipment(await fetchAvailableEquipment());
      setMyRentals(await fetchMyActiveEquipment());
    } catch (err) {
      setEquipmentActionMessage(err.message || 'Kiralama hatası.');
    }
  };

  const handleReturnEquipment = async (rentalId) => {
    try {
      setEquipmentActionMessage('');
      const result = await completeEquipmentRental(rentalId);
      toast.success(`Ekipman iade edildi.\nSüre: ${result.duration_hours} saat\nToplam Tutar: ${result.total_price} ₺`);
      setAvailableEquipment(await fetchAvailableEquipment());
      setMyRentals(await fetchMyActiveEquipment());
    } catch (err) {
      setEquipmentActionMessage(err.message || 'İade hatası.');
    }
  };

  const handleReturnAll = async () => {
    try {
      setEquipmentActionMessage('');
      const result = await returnAllEquipment();
      if (result.count > 0) {
        toast.success(`Toplu İade Başarılı!\nToplam Tutar: ${result.total_price} ₺`);
      } else {
        toast.error("İade edilecek aktif ekipman yok.");
      }
      setAvailableEquipment(await fetchAvailableEquipment());
      setMyRentals(await fetchMyActiveEquipment());
    } catch (err) {
      setEquipmentActionMessage(err.message || 'Toplu iade hatası.');
    }
  };

  // Admin handlers
  const handleDeleteBoat = async (boatId) => {
    if (!window.confirm('Bu tekneyi bakıma almak istediğinize emin misiniz?')) return;
    try {
      await deleteBoat(boatId);
      setAvailableBoats(await fetchAvailableBoats());
      setActionMessage('Tekne bakıma alındı');
    } catch (err) {
      setActionMessage(err.message || 'Hata oluştu');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm('Bu ekipmanı bakıma almak istediğinize emin misiniz?')) return;
    try {
      await deleteEquipment(equipmentId);
      setAvailableEquipment(await fetchAvailableEquipment());
      setEquipmentActionMessage('Ekipman bakıma alındı');
    } catch (err) {
      setEquipmentActionMessage(err.message || 'Hata oluştu');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      await deleteActivity(activityId);
      if (selectedZone) {
        const zoneId = selectedZone.zone_id || selectedZone.id;
        if (zoneId) {
          const data = await fetchZoneActivities(zoneId);
          setActivities(data);
        }
      } else {
        const data = await fetchAllActivities();
        setActivities(data);
      }
    } catch (err) {
      toast.error(err.message || 'Hata oluştu');
    }
  };

  const refreshBoats = async () => {
    setAvailableBoats(await fetchAvailableBoats());
  };

  const refreshEquipment = async () => {
    setAvailableEquipment(await fetchAvailableEquipment());
  };

  const refreshActivities = async () => {
    if (selectedZone) {
      const zoneId = selectedZone.zone_id || selectedZone.id;
      if (zoneId) {
        const data = await fetchZoneActivities(zoneId);
        setActivities(data);
      }
    } else {
      const data = await fetchAllActivities();
      setActivities(data);
    }
  };

  const handleLoginSuccess = (token, user) => {
    setIsLoggedIn(true);
    onLoginSuccess?.(token, user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setMyActiveRentals({ boats: [], equipment: [] });
    setMyPosts([]);
    onLogout?.();
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case TABS.INFO:
        return (
          <InfoTab
            selectedZone={selectedZone}
            activities={activities}
            activitiesLoading={activitiesLoading}
            currentUser={currentUser}
            onAddActivity={() => setAdminPanel({ open: true, type: 'activity', item: null })}
            onEditActivity={(activity) => setAdminPanel({ open: true, type: 'activity', item: activity })}
            onDeleteActivity={handleDeleteActivity}
          />
        );
      case TABS.BOAT:
        return (
          <BoatTab
            availableBoats={availableBoats}
            boatsLoading={boatsLoading}
            boatsError={boatsError}
            activeRental={activeRental}
            hasToken={hasToken}
            currentUser={currentUser}
            onRent={handleRentBoat}
            onComplete={handleCompleteRental}
            onEdit={(boat) => setAdminPanel({ open: true, type: 'boat', item: boat })}
            onDelete={handleDeleteBoat}
            onAdd={() => setAdminPanel({ open: true, type: 'boat', item: null })}
          />
        );
      case TABS.EQUIP:
        return (
          <EquipTab
            availableEquipment={availableEquipment}
            myRentals={myRentals}
            equipmentLoading={equipmentLoading}
            equipmentError={equipmentError}
            hasToken={hasToken}
            currentUser={currentUser}
            onRent={handleRentEquipment}
            onReturn={handleReturnEquipment}
            onReturnAll={handleReturnAll}
            onEdit={(equipment) => setAdminPanel({ open: true, type: 'equipment', item: equipment })}
            onDelete={handleDeleteEquipment}
            onAdd={() => setAdminPanel({ open: true, type: 'equipment', item: null })}
          />
        );
      case TABS.FORUM:
        return <ForumTab selectedZone={selectedZone} currentUser={currentUser} />;
      case TABS.ACCOUNT:
        return (
          <AccountTab
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            userInfo={userInfo}
            userStats={userStats}
            userForumStats={userForumStats}
            myActiveRentals={myActiveRentals}
            myPosts={myPosts}
            accountLoading={accountLoading}
            allRentals={allRentals}
            rentalsLoading={rentalsLoading}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onRefreshRentals={loadAllRentals}
            calculateCurrentCost={calculateCurrentCost}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.sidebar}>
      <SidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
      />

      <div className={`${styles.sidebarContent} sidebar-content-scroll`}>
        {renderActiveTab()}
      </div>

      {/* Admin Panels */}
      {adminPanel.open && (
        <AdminPanels
          type={adminPanel.type}
          item={adminPanel.item}
          onClose={() => setAdminPanel({ open: false, type: null, item: null })}
          onSuccess={() => {
            if (adminPanel.type === 'boat') {
              refreshBoats();
            } else if (adminPanel.type === 'equipment') {
              refreshEquipment();
            } else if (adminPanel.type === 'activity') {
              refreshActivities();
            }
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;

