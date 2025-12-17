// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import Forum from './Forum';
import AdminPanels from './AdminPanels';
import RentalHistoryPanel from './RentalHistoryPanel';
import AccountingPanel from './AccountingPanel';
import AdminStatsPanel from './AdminStatsPanel';
import { loginUser, registerUser, fetchMe } from '../api/api';
import { isAdmin } from '../utils/admin';

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
  closeRental,
} from '../api/api';

// Tarihleri Türkiye Saatine Çeviren Fonksiyon
const formatTimeTR = (dateString) => {
  if (!dateString) return '';
  const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(dateValue).toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const TABS = {
  INFO: 'info',
  BOAT: 'boat',
  EQUIP: 'equip',
  FORUM: 'forum',
  ACCOUNT: 'account',
};

// Account tab için alt tab'ler
const ACCOUNT_SUBTABS = {
  LOGIN: 'login',
  PROFILE: 'profile',
  RENTALS: 'rentals',
  POSTS: 'posts',
  ADMIN_RENTALS: 'admin_rentals', // Admin için
  ADMIN_STATS: 'admin_stats', // Admin istatistikleri için
};

const Sidebar = ({ selectedZone, currentUser, onLoginSuccess, onLogout }) => {
  const [activeTab, setActiveTab] = useState(TABS.INFO);

  // 🔹 Tekne sekmesi için state'ler (AYNEN KORUNDU)
  const [availableBoats, setAvailableBoats] = useState([]);
  const [boatsLoading, setBoatsLoading] = useState(false);
  const [boatsError, setBoatsError] = useState(null);
  const [activeRental, setActiveRental] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // 🔹 Ekipman sekmesi için state'ler (GÜNCELLENDİ)
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [myRentals, setMyRentals] = useState([]); // <--- ARTIK LİSTE TUTUYORUZ
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState(null);
  const [equipmentActionMessage, setEquipmentActionMessage] = useState('');

  // 🔹 Account tab için state'ler
  const [accountSubtab, setAccountSubtab] = useState(ACCOUNT_SUBTABS.LOGIN);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Şimdilik currentUser'dan kontrol edilecek
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userForumStats, setUserForumStats] = useState(null);
  const [myActiveRentals, setMyActiveRentals] = useState({ boats: [], equipment: [] });
  const [myPosts, setMyPosts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);

  // Login form state'leri
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 🔹 Etkinlikler için state'ler
  const [activities, setActivities] = useState({ past: [], current: [], upcoming: [] });
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const hasToken = !!localStorage.getItem('token');

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  // 🔹 Admin panel state'leri
  const [adminPanel, setAdminPanel] = useState({ open: false, type: null, item: null });
  const [allRentals, setAllRentals] = useState({ boats: [], equipment: [] });
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalHistoryPanelOpen, setRentalHistoryPanelOpen] = useState(false);
  const [accountingPanelOpen, setAccountingPanelOpen] = useState(false);
  const [adminStatsPanelOpen, setAdminStatsPanelOpen] = useState(false);



  // BOAT tab aktif olduğunda müsait tekneleri VE benim aktif kiralamamı yükle
  useEffect(() => {
    if (activeTab !== TABS.BOAT) return;

    const hasToken = !!localStorage.getItem('token'); // en net kontrol

    const loadBoatsData = async () => {
      setBoatsLoading(true);
      setBoatsError(null);

      try {
        // 1) Her durumda tekneleri listele (public)
        const availableData = await fetchAvailableBoats();
        setAvailableBoats(availableData);

        // 2) Login yoksa my-active çağırma
        const token = localStorage.getItem('token');
        if (!token) {
          setActiveRental(null);
          return;
        }

        // 3) Login varsa aktif kiralamayı çek
        const myRentals = await fetchMyActiveBoatRentals();

        if (myRentals && myRentals.length > 0) setActiveRental(myRentals[0]);
        else setActiveRental(null);

      } catch (err) {
        console.error(err);
        setBoatsError('Tekne verileri alınırken hata oluştu.');
      } finally {
        setBoatsLoading(false);
      }
    };



    loadBoatsData();
  }, [activeTab, currentUser]); // currentUser değişirse de tetiklensin

  // EQUIP tab aktif olduğunda müsait ekipmanları VE kiraladıklarımı yükle (GÜNCELLENDİ)
  useEffect(() => {
    if (activeTab !== TABS.EQUIP) return;

    const hasToken = !!localStorage.getItem('token');

    const loadEquipmentData = async () => {
      setEquipmentLoading(true);
      setEquipmentError(null);

      try {
        // 1) Her durumda ekipmanları listele (public)
        const availData = await fetchAvailableEquipment();
        setAvailableEquipment(availData);

        // 2) Login yoksa "Sepetim" kısmını boş göster
        const token = localStorage.getItem('token');
        if (!token) {
          setMyRentals([]);
          return;
        }

        // 3) Login varsa kiraladıklarımı çek
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

  // Account tab aktif olduğunda verileri yükle
  useEffect(() => {
    if (activeTab !== TABS.ACCOUNT) return;

    // currentUser varsa giriş yapılmış sayılır (şimdilik)
    if (currentUser && currentUser.user_id) {
      setIsLoggedIn(true);

      // Refresh sonrası LOGIN'de kalmışsa veya ilk girişse subtab aç
      setAccountSubtab((prev) => {
        if (prev === ACCOUNT_SUBTABS.LOGIN) {
          return isAdmin(currentUser) ? ACCOUNT_SUBTABS.PROFILE : ACCOUNT_SUBTABS.RENTALS;
        }
        // Admin ise ve RENTALS'taysa PROFILE'a yönlendir
        if (isAdmin(currentUser) && prev === ACCOUNT_SUBTABS.RENTALS) {
          return ACCOUNT_SUBTABS.PROFILE;
        }
        return prev;
      });

      loadAccountData();
    } else {
      setIsLoggedIn(false);
      setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
    }
  }, [activeTab, currentUser]);

  // Admin rentals subtab aktif olduğunda tüm kiralamaları yükle
  useEffect(() => {
    if (activeTab !== TABS.ACCOUNT || accountSubtab !== ACCOUNT_SUBTABS.ADMIN_RENTALS) return;
    if (!isAdmin(currentUser)) return;

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

    loadAllRentals();
  }, [activeTab, accountSubtab, currentUser]);


  // Bölge seçildiğinde veya INFO tab aktif olduğunda etkinlikleri yükle
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
          // Bölge seçiliyse o bölgenin etkinliklerini yükle
          const zoneId = selectedZone.zone_id || selectedZone.id;
          if (zoneId) {
            // Gelecek aktiviteleri ayrı bir sorgu ile çek
            const upcomingData = await fetchUpcomingActivitiesByZone(zoneId).catch(() => []);
            // Tüm aktiviteleri de çek (geçmiş ve güncel için)
            const allData = await fetchZoneActivities(zoneId).catch(() => ({ past: [], current: [], upcoming: [] }));
            // Gelecek aktiviteleri güncelle
            data = {
              ...allData,
              upcoming: Array.isArray(upcomingData) ? upcomingData : []
            };
          } else {
            data = { past: [], current: [], upcoming: [] };
          }
        } else {
          // Bölge seçili değilse tüm etkinlikleri yükle
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

  // Account verilerini yükle
  const loadAccountData = async () => {
    if (!currentUser || !currentUser.user_id) return;

    setAccountLoading(true);
    try {
      // Paralel olarak tüm verileri çek
      const [userData, stats, forumStats, boatRentals, equipmentRentals, posts] = await Promise.all([
        fetchUserInfo(currentUser.user_id).catch(() => null),
        fetchUserStats(currentUser.user_id).catch(() => null),
        fetchUserForumStats(currentUser.user_id).catch(() => null),
        fetchMyActiveBoatRentals().catch(() => []),
        fetchMyActiveEquipment().catch(() => []),
        fetchMyPosts().catch(() => []), //burası
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

  // Login handler (şimdilik basit, sonra API'ye bağlanacak)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;

      if (authMode === 'login') {
        result = await loginUser(loginEmail, loginPassword);
      } else {
        result = await registerUser(
          registerName,
          loginEmail,
          loginPassword,
          registerPhone
        );
      }

      // App.jsx’e haber ver
      onLoginSuccess?.(result.token, result.user);

      // UI state
      setIsLoggedIn(true);
      setAccountSubtab(ACCOUNT_SUBTABS.PROFILE);

      // Formları temizle
      setLoginEmail('');
      setLoginPassword('');
      setRegisterName('');
      setRegisterPhone('');
      setAuthMode('login');

    } catch (err) {
      alert(err.message || 'İşlem başarısız');
    }
  };



  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setMyActiveRentals({ boats: [], equipment: [] });
    setMyPosts([]);
    setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
    onLogout?.();
  };

  // Anlık maliyet hesaplama fonksiyonu
  const calculateCurrentCost = (rental, pricePerHour) => {
    if (!rental || !rental.start_at || !pricePerHour) return 0;
    const startTime = new Date(rental.start_at);
    const now = new Date();
    const durationSeconds = (now - startTime) / 1000;
    const durationHours = Math.ceil(durationSeconds / 3600);
    return durationHours * parseFloat(pricePerHour);
  };

  // TEKNE FONKSİYONLARI (AYNEN KORUNDU)
  const handleRentBoat = async (boatId) => {
    try {
      setActionMessage('');
      await createBoatRental(boatId, 60);
      
      // Tekne listesini güncelle
      setAvailableBoats(await fetchAvailableBoats());
      
      // Aktif kiralamayı çek (boat_name dahil tüm bilgilerle)
      const myRentals = await fetchMyActiveBoatRentals();
      if (myRentals && myRentals.length > 0) {
        setActiveRental(myRentals[0]);
        setActionMessage(`Tekne kiralandı! (${myRentals[0].boat_name})`);
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

      // ÜCRETİ GÖSTEREN KISIM
      const msg = `İade alındı. Süre: ${result.duration_hours} saat. Tutar: ${result.total_price} ₺`;
      alert(msg); // Ekrana popup çıkar
      setActionMessage(msg);

      setActiveRental(null);
      setAvailableBoats(await fetchAvailableBoats());
    } catch (err) {
      setActionMessage(err.message || 'Hata oluştu.');
    }
  };

  // EKİPMAN FONKSİYONLARI (GÜNCELLENDİ - ÇOKLU KİRALAMA)
  const handleRentEquipment = async (equipmentId) => {
    try {
      setEquipmentActionMessage('');
      // Kiralamayı yap
      await createEquipmentRental(equipmentId, 60);
      setEquipmentActionMessage('Ekipman sepete eklendi!');

      // Listeleri yenile
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

      // ÜCRETİ GÖSTEREN KISIM
      alert(`Ekipman iade edildi.\nSüre: ${result.duration_hours} saat\nToplam Tutar: ${result.total_price} ₺`);
      setEquipmentActionMessage(`İade Tamamlandı. Tutar: ${result.total_price} ₺`);

      // Listeleri yenile
      setAvailableEquipment(await fetchAvailableEquipment());
      setMyRentals(await fetchMyActiveEquipment());
    } catch (err) {
      setEquipmentActionMessage(err.message || 'İade hatası.');
    }
  };

  // TOPLU İADE FONKSİYONU
  const handleReturnAll = async () => {
    if (!window.confirm("Tüm ekipmanları iade etmek istediğinize emin misiniz?")) return;

    try {
      setEquipmentActionMessage('');
      const result = await returnAllEquipment(); // api.js'den import etmeyi unutma!

      if (result.count > 0) {
        alert(`TOPLU İADE BAŞARILI!\n\nİade Edilen Parça: ${result.count} adet\nToplam Tutar: ${result.total_price} ₺`);
        setEquipmentActionMessage(`Hepsi iade edildi. Tutar: ${result.total_price} ₺`);
      } else {
        alert("İade edilecek aktif ekipman yok.");
      }

      // Listeleri yenile
      setAvailableEquipment(await fetchAvailableEquipment());
      setMyRentals(await fetchMyActiveEquipment());
    } catch (err) {
      setEquipmentActionMessage(err.message || 'Toplu iade hatası.');
    }
  };

  // --- ADMIN HANDLER FONKSİYONLARI ---
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
      // Reload activities
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
      alert(err.message || 'Hata oluştu');
    }
  };

  const handleCloseRental = async (rentalId, rentalType) => {
    if (!window.confirm('Bu kiralamayı kapatmak istediğinize emin misiniz?')) return;
    try {
      await closeRental(rentalId, rentalType);
      setAllRentals(await fetchAllRentals());
      alert('Kiralama kapatıldı');
    } catch (err) {
      alert(err.message || 'Hata oluştu');
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

  // --- TAB RENDER FONKSİYONLARI ---

  // Tarih formatlama fonksiyonu
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

  // INFO TAB (ETKİNLİKLER EKLENDİ)
  const renderInfoTab = () => {
    const hasActivities = activities.past.length > 0 || activities.current.length > 0 || activities.upcoming.length > 0;

    return (
      <div className="info-tab-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto' }}>
        <h2 style={{ color: '#00ffff', marginTop: 0, textShadow: '0 0 10px #00ffff' }}>
          Van Gölü Balıkçılık İşletmesi
        </h2>
        <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {selectedZone
            ? `Şu an "${selectedZone.name}" bölgesini inceliyorsunuz. Bu bölgedeki avlanma kurallarına dikkat ediniz.`
            : "Türkiye'nin en büyük sodalı gölü olan Van Gölü üzerinde güvenli ve kontrollü balıkçılık deneyimi sunuyoruz."
          }
        </p>
        <div style={{ background: 'rgba(0, 255, 255, 0.08)', borderRadius: 6, padding: 10, border: '1px solid #00ffff33', fontSize: '0.85rem' }}>
          <strong>Seçili Bölge:</strong> {selectedZone ? selectedZone.name : "Tüm Göl"} <br />
          <strong>Konum:</strong> Van Gölü / Gevaş Merkezi<br />
          <strong>Hizmetler:</strong> Tekne kiralama, ekipman kiralama, rehberli turlar.
        </div>

        {/* ETKİNLİKLER BÖLÜMÜ */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#00ffff', marginTop: 0, marginBottom: 0, fontSize: '1rem' }}>
              📅 {selectedZone ? 'Bölge Etkinlikleri' : 'Tüm Etkinlikler'}
            </h3>
            {isAdmin(currentUser) && (
              <button
                onClick={() => setAdminPanel({ open: true, type: 'activity', item: null })}
                style={{
                  padding: '6px 10px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              >
                ➕ Etkinlik Ekle
              </button>
            )}
          </div>

          {activitiesLoading ? (
            <p style={{ fontSize: '0.85rem', color: '#888' }}>Etkinlikler yükleniyor…</p>
          ) : !hasActivities ? (
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              {selectedZone ? 'Bu bölgede henüz etkinlik bulunmuyor.' : 'Henüz etkinlik bulunmuyor.'}
            </p>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* GÜNCEL ETKİNLİKLER */}
                {activities.current.length > 0 && (
                  <div>
                    <h4 style={{ color: '#22c55e', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                      🟢 Güncel Etkinlikler
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activities.current.map((activity) => (
                        <div
                          key={activity.activity_id}
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 6,
                            padding: 10,
                            fontSize: '0.85rem',
                            position: 'relative'
                          }}
                        >
                          <strong style={{ color: '#22c55e' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#ccc', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          {!selectedZone && activity.zone_name && (
                            <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#00ffff' }}>
                              📍 {activity.zone_name}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#aaa' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
                          {isAdmin(currentUser) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button
                                onClick={() => setAdminPanel({ open: true, type: 'activity', item: activity })}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity.activity_id)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Sil
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GELECEK ETKİNLİKLER */}
                {activities.upcoming.length > 0 && (
                  <div>
                    <h4 style={{ color: '#3b82f6', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                      🔵 Gelecek Etkinlikler
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activities.upcoming.map((activity) => (
                        <div
                          key={activity.activity_id}
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 6,
                            padding: 10,
                            fontSize: '0.85rem',
                            position: 'relative'
                          }}
                        >
                          <strong style={{ color: '#3b82f6' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#ccc', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          {!selectedZone && activity.zone_name && (
                            <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#00ffff' }}>
                              📍 {activity.zone_name}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#aaa' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
                          {isAdmin(currentUser) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button
                                onClick={() => setAdminPanel({ open: true, type: 'activity', item: activity })}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity.activity_id)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Sil
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GEÇMİŞ ETKİNLİKLER */}
                {activities.past.length > 0 && (
                  <div>
                    <h4 style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                      ⚪ Geçmiş Etkinlikler
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activities.past.map((activity) => (
                        <div
                          key={activity.activity_id}
                          style={{
                            background: 'rgba(136, 136, 136, 0.1)',
                            border: '1px solid rgba(136, 136, 136, 0.3)',
                            borderRadius: 6,
                            padding: 10,
                            fontSize: '0.85rem',
                            opacity: 0.7,
                            position: 'relative'
                          }}
                        >
                          <strong style={{ color: '#888' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#666', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          {!selectedZone && activity.zone_name && (
                            <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#00ffff' }}>
                              📍 {activity.zone_name}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#666' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
                          {isAdmin(currentUser) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button
                                onClick={() => setAdminPanel({ open: true, type: 'activity', item: activity })}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity.activity_id)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                              >
                                Sil
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    );
  };

  // BOAT TAB (Admin özellikleri eklendi)
  const renderBoatTab = () => {
    const admin = isAdmin(currentUser);
    
    return (
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ color: '#00ffff', marginTop: 0 }}>🛶 Tekne Kiralama</h3>
        
        {/* Admin: Tekne Ekle Butonu */}
        {admin && (
          <button
            onClick={() => setAdminPanel({ open: true, type: 'boat', item: null })}
            style={{
              padding: '8px 12px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              marginBottom: '10px'
            }}
          >
            ➕ Tekne Ekle
          </button>
        )}

        {!hasToken && !admin && (
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '-4px' }}>
            Tekne kiralamak için giriş yapmalısınız.
          </p>
        )}
        <h4 style={{ color: '#ccc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>🛳️ Müsait Tekneler </h4>

        {boatsLoading && <p style={{ fontSize: '0.85rem', color: '#888' }}>Tekneler yükleniyor…</p>}
        {boatsError && <p style={{ fontSize: '0.85rem', color: '#f97373' }}>{boatsError}</p>}

        {!boatsLoading && !boatsError && availableBoats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableBoats.map((boat) => (
              <div key={boat.boat_id} style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff33', borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                  <strong>{boat.name}</strong><br />
                  Kapasite: {boat.capacity} kişi - {boat.price_per_hour} ₺/saat
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {admin ? (
                    <>
                      <button
                        onClick={() => setAdminPanel({ open: true, type: 'boat', item: boat })}
                        style={{ padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteBoat(boat.boat_id)}
                        style={{ padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                      >
                        Sil
                      </button>
                    </>
                  ) : (
                    <button
                      style={{ padding: '8px 10px', borderRadius: 6, border: 'none', cursor: hasToken ? 'pointer' : 'not-allowed', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.8rem', opacity: hasToken ? 1 : 0.5 }}
                      disabled={!hasToken || !!activeRental}
                      onClick={() => handleRentBoat(boat.boat_id)}
                    >
                      Kirala
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!admin && activeRental && (
          <div style={{ marginTop: 8, padding: 10, borderRadius: 6, border: '1px solid #22c55e55', background: 'rgba(34, 197, 94, 0.08)', fontSize: '0.85rem' }}>
            <strong>Aktif Kiralamanız:</strong><br />
            Tekne: {activeRental.boat_name || 'Yükleniyor...'}<br />
            <button style={{ marginTop: 8, width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#22c55e', color: '#00111f', fontWeight: 'bold' }} onClick={handleCompleteRental}>
              Kiralamayı Bitir
            </button>
          </div>
        )}
        {actionMessage && <p style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: 4 }}>{actionMessage}</p>}
      </div>
    );
  };

  // EQUIP TAB (Admin özellikleri eklendi)
  const renderEquipTab = () => {
    const admin = isAdmin(currentUser);
    
    return (
      <div className="equip-tab-scroll" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ color: '#00ffff', marginTop: 0 }}>🎣 Ekipman Kiralama</h3>

        {/* Admin: Ekipman Ekle Butonu */}
        {admin && (
          <button
            onClick={() => setAdminPanel({ open: true, type: 'equipment', item: null })}
            style={{
              padding: '8px 12px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              marginBottom: '10px'
            }}
          >
            ➕ Ekipman Ekle
          </button>
        )}

        {equipmentLoading && <p style={{ fontSize: '0.85rem', color: '#888' }}>Yükleniyor…</p>}
        {equipmentError && <p style={{ fontSize: '0.85rem', color: '#f97373' }}>{equipmentError}</p>}
        {equipmentActionMessage && <p style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{equipmentActionMessage}</p>}

        {/* 1. BÖLÜM: ELİMDEKİLER (Sepetim) - Sadece normal kullanıcılar için */}
        {!admin && hasToken && myRentals.length > 0 && (
          <div style={{ borderBottom: '1px solid #333', paddingBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ color: '#22c55e', margin: 0, fontSize: '0.9rem' }}>✅ Elimdekiler ({myRentals.length})</h4>
              <button
                onClick={handleReturnAll}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Hepsini İade Et
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myRentals.map((rental) => (
                <div key={rental.equipment_rental_id} style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 6, padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem'
                }}>
                  <div>
                    <strong>{rental.type_name || 'Ekipman'}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{rental.brand} {rental.model}</span>
                  </div>
                  <button
                    onClick={() => handleReturnEquipment(rental.equipment_rental_id)}
                    style={{ background: '#22c55e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    İade Et
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. BÖLÜM: MÜSAİT OLANLAR */}
        <div>
          {!hasToken && !admin && (
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '-4px' }}>
              Ekipman kiralamak için giriş yapmalısınız.
            </p>
          )}
          <h4 style={{ color: '#ccc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>🛒 Müsait Ekipmanlar</h4>

          {!equipmentLoading && availableEquipment.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Müsait ekipman yok.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableEquipment.map((equipment) => (
              <div key={equipment.equipment_id} style={{
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid #00ffff33',
                borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem'
              }}>
                <div style={{ flex: 1 }}>
                  <strong>{equipment.brand} {equipment.model}</strong>
                  {equipment.type_name && <><br />Tip: {equipment.type_name}</>}
                  <br />{equipment.price_per_hour} ₺/saat
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {admin ? (
                    <>
                      <button
                        onClick={() => setAdminPanel({ open: true, type: 'equipment', item: equipment })}
                        style={{ padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(equipment.equipment_id)}
                        style={{ padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                      >
                        Sil
                      </button>
                    </>
                  ) : (
                    <button
                      style={{ padding: '8px 10px', borderRadius: 6, border: 'none', cursor: hasToken ? 'pointer' : 'not-allowed', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.8rem', opacity: hasToken ? 1 : 0.5 }}
                      disabled={!hasToken}
                      onClick={() => handleRentEquipment(equipment.equipment_id)}
                    >
                      Kirala
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderForumTab = () => (
    <div style={{ marginTop: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Forum selectedZone={selectedZone} currentUser={currentUser} />
    </div>
  );

  // ACCOUNT TAB - YENİ
  const renderAccountTab = () => {
    // Giriş yapılmamışsa login ekranı
    if (!isLoggedIn || !currentUser) {
      return (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ color: '#00ffff', marginTop: 0 }}>🔐 Giriş Yap</h3>
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {authMode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  style={{ padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  placeholder="Telefon (opsiyonel)"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  style={{ padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                />
              </>
            )}
            <input
              type="email"
              placeholder="E-posta"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              style={{ padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              style={{ padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ padding: '10px', background: '#00ffff', color: '#00111f', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
          <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
            {authMode === 'login' ? (
              <>
                Hesabınız yok mu?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('register'); }} style={{ color: '#00ffff' }}>
                  Kayıt Ol
                </a>
              </>
            ) : (
              <>
                Zaten hesabınız var mı?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} style={{ color: '#00ffff' }}>
                  Giriş Yap
                </a>
              </>
            )}
          </p>
        </div>
      );
    }

    // Giriş yapılmışsa alt tab'ler
    return (
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
        {/* Alt Tab Butonları */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #123', paddingBottom: '4px', marginBottom: '10px' }}>
          {!isAdmin(currentUser) && (
            <button
              onClick={() => setAccountSubtab(ACCOUNT_SUBTABS.RENTALS)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                background: accountSubtab === ACCOUNT_SUBTABS.RENTALS ? '#00ffff' : 'transparent',
                color: accountSubtab === ACCOUNT_SUBTABS.RENTALS ? '#00111f' : '#9aa4b1',
                fontWeight: accountSubtab === ACCOUNT_SUBTABS.RENTALS ? 'bold' : 'normal',
              }}
            >
              Kiralamalarım
            </button>
          )}
          <button
            onClick={() => setAccountSubtab(ACCOUNT_SUBTABS.POSTS)}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              background: accountSubtab === ACCOUNT_SUBTABS.POSTS ? '#00ffff' : 'transparent',
              color: accountSubtab === ACCOUNT_SUBTABS.POSTS ? '#00111f' : '#9aa4b1',
              fontWeight: accountSubtab === ACCOUNT_SUBTABS.POSTS ? 'bold' : 'normal',
            }}
          >
            Postlarım
          </button>
          <button
            onClick={() => setAccountSubtab(ACCOUNT_SUBTABS.PROFILE)}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              background: accountSubtab === ACCOUNT_SUBTABS.PROFILE ? '#00ffff' : 'transparent',
              color: accountSubtab === ACCOUNT_SUBTABS.PROFILE ? '#00111f' : '#9aa4b1',
              fontWeight: accountSubtab === ACCOUNT_SUBTABS.PROFILE ? 'bold' : 'normal',
            }}
          >
            Profil
          </button>
          {isAdmin(currentUser) && (
            <>
              <button
                onClick={() => setAccountSubtab(ACCOUNT_SUBTABS.ADMIN_RENTALS)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: accountSubtab === ACCOUNT_SUBTABS.ADMIN_RENTALS ? '#00ffff' : 'transparent',
                  color: accountSubtab === ACCOUNT_SUBTABS.ADMIN_RENTALS ? '#00111f' : '#9aa4b1',
                  fontWeight: accountSubtab === ACCOUNT_SUBTABS.ADMIN_RENTALS ? 'bold' : 'normal',
                }}
              >
                Kiralamalar Yönetimi
              </button>
              <button
                onClick={() => setAdminStatsPanelOpen(true)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#00ffff',
                  color: '#00111f',
                  fontWeight: 'bold',
                }}
              >
                İstatistikler
              </button>
            </>
          )}
        </div>

        {/* Alt Tab İçerikleri */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {accountLoading ? (
            <p style={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</p>
          ) : (
            <>
              {accountSubtab === ACCOUNT_SUBTABS.PROFILE && renderProfileSubtab()}
              {accountSubtab === ACCOUNT_SUBTABS.RENTALS && !isAdmin(currentUser) && renderRentalsSubtab()}
              {accountSubtab === ACCOUNT_SUBTABS.POSTS && renderPostsSubtab()}
              {accountSubtab === ACCOUNT_SUBTABS.ADMIN_RENTALS && isAdmin(currentUser) && renderAdminRentalsSubtab()}
            </>
          )}
        </div>
      </div>
    );
  };

  // Profil Alt Tab
  const renderProfileSubtab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 style={{ color: '#00ffff', margin: 0 }}>👤 Kullanıcı Bilgileri</h4>
      {userInfo ? (
        <div style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff33', borderRadius: 6, padding: 12 }}>
          <p style={{ margin: '4px 0' }}><strong>Ad Soyad:</strong> {userInfo.full_name}</p>
          <p style={{ margin: '4px 0' }}><strong>E-posta:</strong> {userInfo.email || 'Belirtilmemiş'}</p>
          <p style={{ margin: '4px 0' }}><strong>Telefon:</strong> {userInfo.phone || 'Belirtilmemiş'}</p>
          <p style={{ margin: '4px 0' }}><strong>Kayıt Tarihi:</strong> {new Date(userInfo.created_at).toLocaleDateString('tr-TR')}</p>
        </div>
      ) : (
        <p style={{ color: '#888' }}>Kullanıcı bilgileri yüklenemedi.</p>
      )}

      {/* Kullanıcı İstatistikleri - Sadece admin olmayan kullanıcılar için */}
      {userStats && !isAdmin(currentUser) && (
        <>
          <h4 style={{ color: '#00ffff', margin: '15px 0 0 0' }}>📊 Kiralama İstatistikleri</h4>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 6, padding: 12 }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Tekne Kiralamaları:</strong> {userStats.boat_rental_count || 0}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Ekipman Kiralamaları:</strong> {userStats.equipment_rental_count || 0}
            </p>
            <p style={{ margin: '4px 0', color: '#60a5fa', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <strong>Toplam Harcama:</strong> {parseFloat(userStats.total_spent || 0).toFixed(2)} ₺
            </p>
          </div>
        </>
      )}

      {/* Forum İstatistikleri */}
      {userForumStats && (
        <>
          <h4 style={{ color: '#00ffff', margin: '15px 0 0 0' }}>💬 Forum İstatistikleri</h4>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 6, padding: 12 }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Post Sayısı:</strong> {userForumStats.post_count || 0}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Yorum Sayısı:</strong> {userForumStats.comment_count || 0}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Beğenilen Postlar:</strong> {userForumStats.liked_post_count || 0}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Toplam Fotoğraf:</strong> {userForumStats.total_photos || 0}
            </p>
          </div>
        </>
      )}

      <button
        onClick={handleLogout}
        style={{
          padding: '8px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '15px',
        }}
      >
        Çıkış Yap
      </button>
    </div>
  );

  // Kiralamalar Alt Tab
  const renderRentalsSubtab = () => {
    const totalBoatCost = myActiveRentals.boats.reduce((sum, rental) => {
      return sum + calculateCurrentCost(rental, rental.price_per_hour || 0);
    }, 0);

    const totalEquipmentCost = myActiveRentals.equipment.reduce((sum, rental) => {
      return sum + calculateCurrentCost(rental, rental.price_per_hour || 0);
    }, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h4 style={{ color: '#00ffff', margin: 0 }}>🛶 Aktif Kiralamalarım</h4>

        {/* Tekneler */}
        {myActiveRentals.boats.length > 0 && (
          <div>
            <h5 style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Tekneler</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myActiveRentals.boats.map((rental) => {
                const currentCost = calculateCurrentCost(rental, rental.price_per_hour || 0);
                return (
                  <div
                    key={rental.rental_id}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 6,
                      padding: 10,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{rental.boat_name || 'Tekne'}</strong>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{currentCost.toFixed(2)} ₺</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#ccc', margin: '4px 0' }}>
                      Başlangıç: {formatTimeTR(rental.start_at)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                      {rental.price_per_hour} ₺/saat
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ekipmanlar */}
        {myActiveRentals.equipment.length > 0 && (
          <div>
            <h5 style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Ekipmanlar</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myActiveRentals.equipment.map((rental) => {
                const currentCost = calculateCurrentCost(rental, rental.price_per_hour || 0);
                return (
                  <div
                    key={rental.equipment_rental_id}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 6,
                      padding: 10,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{rental.type_name || 'Ekipman'}</strong>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{currentCost.toFixed(2)} ₺</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#ccc', margin: '4px 0' }}>
                      {rental.brand} {rental.model}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                      Başlangıç: {formatTimeTR(rental.start_at)} | {rental.price_per_hour} ₺/saat
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toplam */}
        {(myActiveRentals.boats.length > 0 || myActiveRentals.equipment.length > 0) && (
          <div
            style={{
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid #00ffff',
              borderRadius: 6,
              padding: 12,
              marginTop: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#00ffff' }}>Toplam Anlık Maliyet:</strong>
              <strong style={{ color: '#00ffff', fontSize: '1.1rem' }}>
                {(totalBoatCost + totalEquipmentCost).toFixed(2)} ₺
              </strong>
            </div>
          </div>
        )}

        {myActiveRentals.boats.length === 0 && myActiveRentals.equipment.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center' }}>Aktif kiralamanız bulunmuyor.</p>
        )}
      </div>
    );
  };

  // Postlar Alt Tab
  // Sidebar.jsx içinde bu fonksiyonu bul ve değiştir:

  const renderPostsSubtab = () => {
    if (myPosts.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>Henüz hiç paylaşım yapmadınız.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Foruma gidip ilk gönderinizi paylaşın!</p>
        </div>
      );
    }

    return (
      <div className="sidebar-content-scroll" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
        {myPosts.map((post) => (
          <div key={post.post_id} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>{post.title}</h4>
              <span style={{ color: '#888', fontSize: '0.7rem' }}>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
              {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
            </p>
            
            {/* 🔥 YENİ EKLENEN: FOTOĞRAF GÖSTERİMİ (Sidebar İçin) */}
            {post.photos && post.photos.length > 0 && post.photos[0] && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={post.photos[0]} 
                  alt="Post Attachment" 
                  style={{ 
                    width: '100%', // Sidebar'a sığsın
                    maxHeight: '200px', // Çok uzamasın
                    objectFit: 'cover', // Kötü görünmesin, kırpsın
                    borderRadius: '4px', 
                    border: '1px solid #333'
                  }} 
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            {/* ---------------------------------------------------- */}

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa' }}>
              <span>{post.zone_name ? `📍 ${post.zone_name}` : '🌐 Genel'}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span>❤️ {post.like_count || 0}</span>
                {/* Yorum sayısı verisi henüz gelmiyor, gelirse eklenebilir */}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Admin Rentals Alt Tab
  const renderAdminRentalsSubtab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ color: '#00ffff', margin: 0 }}>🔧 Tüm Aktif Kiralamalar</h4>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <button
          onClick={() => setRentalHistoryPanelOpen(true)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          📊 Geçmiş Kiralamalar
        </button>
        <button
          onClick={() => setAccountingPanelOpen(true)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          💰 Muhasebe
        </button>
      </div>

      {rentalsLoading ? (
        <p style={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</p>
      ) : (
        <>
          {/* Tekne Kiralamaları */}
          {allRentals?.boats?.length > 0 && (
            <div>
              <h5 style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Tekneler</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allRentals.boats.map((rental) => (
                  <div
                    key={rental.rental_id}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 6,
                      padding: 10,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div>
                        <strong>{rental.item_name}</strong>
                        <p style={{ fontSize: '0.75rem', color: '#ccc', margin: '4px 0' }}>
                          Kullanıcı: {rental.user_name} ({rental.user_email})
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          Başlangıç: {formatTimeTR(rental.start_at)}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          {rental.price_per_hour} ₺/saat
                        </p>
                      </div>
                      <button
                        onClick={() => handleCloseRental(rental.rental_id, 'boat')}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          alignSelf: 'flex-start'
                        }}
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ekipman Kiralamaları */}
          {allRentals?.equipment?.length > 0 && (
            <div>
              <h5 style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Ekipmanlar</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allRentals.equipment.map((rental) => (
                  <div
                    key={rental.rental_id}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 6,
                      padding: 10,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div>
                        <strong>{rental.item_name}</strong>
                        <p style={{ fontSize: '0.75rem', color: '#ccc', margin: '4px 0' }}>
                          Kullanıcı: {rental.user_name} ({rental.user_email})
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          Başlangıç: {formatTimeTR(rental.start_at)}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          {rental.price_per_hour} ₺/saat
                        </p>
                      </div>
                      <button
                        onClick={() => handleCloseRental(rental.rental_id, 'equipment')}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          alignSelf: 'flex-start'
                        }}
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allRentals?.boats?.length === 0 && allRentals?.equipment?.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center' }}>Aktif kiralama bulunmuyor.</p>
          )}
        </>
      )}
    </div>
  );


  const renderActiveTab = () => {
    switch (activeTab) {
      case TABS.INFO: return renderInfoTab();
      case TABS.BOAT: return renderBoatTab();
      case TABS.EQUIP: return renderEquipTab();
      case TABS.FORUM: return renderForumTab();
      case TABS.ACCOUNT: return renderAccountTab();
      default: return renderInfoTab();
    }
  };

  const tabButtonStyle = (tab) => ({
    flex: 1, padding: '8px 6px', fontSize: '0.8rem', border: 'none', cursor: 'pointer',
    background: activeTab === tab ? '#00ffff' : 'transparent',
    color: activeTab === tab ? '#00111f' : '#9aa4b1',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    borderBottom: activeTab === tab ? '2px solid #00ffff' : '1px solid #123',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ width: '340px', background: '#020817', color: 'white', padding: '14px 16px', borderLeft: '2px solid #00ffff', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.5)', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #123', paddingBottom: '4px', flexShrink: 0 }}>
        <button style={tabButtonStyle(TABS.INFO)} onClick={() => setActiveTab(TABS.INFO)}>Bilgi</button>
        <button style={tabButtonStyle(TABS.BOAT)} onClick={() => setActiveTab(TABS.BOAT)}>Tekne</button>
        <button style={tabButtonStyle(TABS.EQUIP)} onClick={() => setActiveTab(TABS.EQUIP)}>Ekipman</button>
        <button style={tabButtonStyle(TABS.FORUM)} onClick={() => setActiveTab(TABS.FORUM)}>Forum</button>
        <button
          style={tabButtonStyle(TABS.ACCOUNT)}
          onClick={() => {
            setActiveTab(TABS.ACCOUNT);
            if (localStorage.getItem('token')) {
              setAccountSubtab(isAdmin(currentUser) ? ACCOUNT_SUBTABS.PROFILE : ACCOUNT_SUBTABS.RENTALS);
            } else {
              setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
            }
          }}
        >
          {currentUser ? 'Hesabım' : 'Giriş'}
        </button>
      </div>

      <div 
        className="sidebar-content-scroll"
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: activeTab === TABS.FORUM ? 'hidden' : 'auto', 
          overflowX: 'hidden', 
          minHeight: 0 
        }}>
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

      {/* Rental History Panel */}
      {rentalHistoryPanelOpen && (
        <RentalHistoryPanel
          onClose={() => setRentalHistoryPanelOpen(false)}
        />
      )}

      {/* Accounting Panel */}
      {accountingPanelOpen && (
        <AccountingPanel
          onClose={() => setAccountingPanelOpen(false)}
        />
      )}

      {/* Admin Stats Panel */}
      {adminStatsPanelOpen && (
        <AdminStatsPanel
          onClose={() => setAdminStatsPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;