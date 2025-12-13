// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import Forum from './Forum';
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
  fetchMyActiveBoatRentals,
  fetchMyPosts,
  fetchZoneActivities,
} from '../api/api';

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
};

const Sidebar = ({ selectedZone, currentUser }) => {
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
  const [myActiveRentals, setMyActiveRentals] = useState({ boats: [], equipment: [] });
  const [myPosts, setMyPosts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  
  // Login form state'leri
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 🔹 Etkinlikler için state'ler
  const [activities, setActivities] = useState({ past: [], current: [], upcoming: [] });
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // BOAT tab aktif olduğunda müsait tekneleri VE benim aktif kiralamamı yükle
  useEffect(() => {
    if (activeTab !== TABS.BOAT) return;

    const loadBoatsData = async () => {
      setBoatsLoading(true);
      setBoatsError(null);
      try {
        // 1. Müsait Tekneleri Çek
        const availableData = await fetchAvailableBoats();
        setAvailableBoats(availableData);
        const userId = currentUser?.user_id || 1; 

        const myRentals = await fetchMyActiveBoatRentals(userId);
        
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
  }, [activeTab, currentUser]); // currentUser değişirse de tetiklensin

  // EQUIP tab aktif olduğunda müsait ekipmanları VE kiraladıklarımı yükle (GÜNCELLENDİ)
  useEffect(() => {
    if (activeTab !== TABS.EQUIP) return;

    const loadEquipmentData = async () => {
      setEquipmentLoading(true);
      setEquipmentError(null);
      try {
        // 1. Müsait Olanları Çek
        const availData = await fetchAvailableEquipment();
        setAvailableEquipment(availData);

        // 2. Benim Kiraladıklarımı Çek
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
      loadAccountData();
    } else {
      setIsLoggedIn(false);
      setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
    }
  }, [activeTab, currentUser]);

  // Bölge seçildiğinde veya INFO tab aktif olduğunda etkinlikleri yükle
  useEffect(() => {
    if (activeTab !== TABS.INFO || !selectedZone) {
      setActivities({ past: [], current: [], upcoming: [] });
      return;
    }

    const loadActivities = async () => {
      const zoneId = selectedZone.zone_id || selectedZone.id;
      if (!zoneId) return;

      setActivitiesLoading(true);
      try {
        const data = await fetchZoneActivities(zoneId);
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
      const [userData, boatRentals, equipmentRentals, posts] = await Promise.all([
        fetchUserInfo(currentUser.user_id).catch(() => null),
        fetchMyActiveBoatRentals(currentUser.user_id).catch(() => []),
        fetchMyActiveEquipment().catch(() => []),
        fetchMyPosts(currentUser.user_id).catch(() => []),
      ]);
      
      setUserInfo(userData);
      setMyActiveRentals({ boats: boatRentals || [], equipment: equipmentRentals || [] });
      setMyPosts(posts || []);
    } catch (err) {
      console.error('Account verileri yüklenemedi:', err);
    } finally {
      setAccountLoading(false);
    }
  };

  // Login handler (şimdilik basit, sonra API'ye bağlanacak)
  const handleLogin = async (e) => {
    e.preventDefault();
    // TODO: API çağrısı yapılacak
    // Şimdilik demo için currentUser varsa giriş yapılmış sayılır
    if (currentUser && currentUser.user_id) {
      setIsLoggedIn(true);
      setAccountSubtab(ACCOUNT_SUBTABS.PROFILE);
      loadAccountData();
    } else {
      alert('Giriş yapılamadı. Demo modunda user_id: 1 kullanılıyor.');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setMyActiveRentals({ boats: [], equipment: [] });
    setMyPosts([]);
    setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
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
      const rental = await createBoatRental(boatId, 60);
      setActiveRental(rental);
      setActionMessage(`Tekne kiralandı! (ID: ${rental.rental_id})`);
      setAvailableBoats(await fetchAvailableBoats());
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
        {selectedZone && (
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ color: '#00ffff', marginTop: 0, marginBottom: '10px', fontSize: '1rem' }}>
              📅 Bölge Etkinlikleri
            </h3>
            
            {activitiesLoading ? (
              <p style={{ fontSize: '0.85rem', color: '#888' }}>Etkinlikler yükleniyor…</p>
            ) : !hasActivities ? (
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Bu bölgede henüz etkinlik bulunmuyor.</p>
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
                          }}
                        >
                          <strong style={{ color: '#22c55e' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#ccc', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#aaa' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
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
                          }}
                        >
                          <strong style={{ color: '#3b82f6' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#ccc', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#aaa' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
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
                          }}
                        >
                          <strong style={{ color: '#888' }}>{activity.title}</strong>
                          {activity.description && (
                            <p style={{ margin: '4px 0', color: '#666', fontSize: '0.8rem' }}>
                              {activity.description}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#666' }}>
                            {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // BOAT TAB (AYNEN KORUNDU)
  const renderBoatTab = () => (
    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>🛶 Tekne Kiralama</h3>
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Demo modunda, giriş yapmadan tekne kiralayabilirsiniz.</p>

      {boatsLoading && <p style={{ fontSize: '0.85rem', color: '#888' }}>Tekneler yükleniyor…</p>}
      {boatsError && <p style={{ fontSize: '0.85rem', color: '#f97373' }}>{boatsError}</p>}

      {!boatsLoading && !boatsError && availableBoats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableBoats.map((boat) => (
            <div key={boat.boat_id} style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff33', borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div>
                <strong>{boat.name}</strong><br />
                Kapasite: {boat.capacity} kişi - {boat.price_per_hour} ₺/saat
              </div>
              <button style={{ padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.8rem' }} disabled={!!activeRental} onClick={() => handleRentBoat(boat.boat_id)}>
                Kirala
              </button>
            </div>
          ))}
        </div>
      )}

      {activeRental && (
        <div style={{ marginTop: 8, padding: 10, borderRadius: 6, border: '1px solid #22c55e55', background: 'rgba(34, 197, 94, 0.08)', fontSize: '0.85rem' }}>
          <strong>Aktif Kiralamanız:</strong><br />
          Kiralama ID: {activeRental.rental_id}<br />
          <button style={{ marginTop: 8, width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#22c55e', color: '#00111f', fontWeight: 'bold' }} onClick={handleCompleteRental}>
            Kiralamayı Bitir
          </button>
        </div>
      )}
      {actionMessage && <p style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: 4 }}>{actionMessage}</p>}
    </div>
  );

  // EQUIP TAB (TAMAMEN YENİLENDİ AMA TASARIM AYNI)
  const renderEquipTab = () => (
    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>🎣 Ekipman Kiralama</h3>
      
      {equipmentLoading && <p style={{ fontSize: '0.85rem', color: '#888' }}>Yükleniyor…</p>}
      {equipmentError && <p style={{ fontSize: '0.85rem', color: '#f97373' }}>{equipmentError}</p>}
      {equipmentActionMessage && <p style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{equipmentActionMessage}</p>}

      {/* 1. BÖLÜM: ELİMDEKİLER (Sepetim) */}
      {myRentals.length > 0 && (
        <div style={{ borderBottom: '1px solid #333', paddingBottom: 15 }}>
          
          {/* Başlık ve Butonu Yan Yana Koyduk */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <h4 style={{ color: '#22c55e', margin: 0, fontSize: '0.9rem' }}>✅ Elimdekiler ({myRentals.length})</h4>
            <button 
              onClick={handleReturnAll}
              style={{ background:'#dc2626', color:'white', border:'none', borderRadius:4, padding:'4px 8px', fontSize:'0.7rem', cursor:'pointer', fontWeight:'bold' }}
            >
              Hepsini İade Et
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* ... map döngüsü aynı kalacak ... */}
            {myRentals.map((rental) => (
              <div key={rental.equipment_rental_id} style={{ 
                background: 'rgba(34, 197, 94, 0.1)', // Yeşil arka plan
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                borderRadius: 6, padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' 
              }}>
                <div>
                  <strong>{rental.type_name || 'Ekipman'}</strong><br/>
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
        <h4 style={{ color: '#ccc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>🛒 Müsait Ekipmanlar</h4>
        
        {!equipmentLoading && availableEquipment.length === 0 && (
           <p style={{ fontSize: '0.85rem', color: '#666' }}>Müsait ekipman yok.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableEquipment.map((equipment) => (
            <div key={equipment.equipment_id} style={{ 
              background: 'rgba(0, 255, 255, 0.05)', // Senin orijinal mavi arka planın
              border: '1px solid #00ffff33', 
              borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' 
            }}>
              <div>
                <strong>{equipment.brand} {equipment.model}</strong>
                {equipment.type_name && <><br />Tip: {equipment.type_name}</>}
                <br />{equipment.price_per_hour} ₺/saat
              </div>
              <button
                style={{ padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.8rem' }}
                onClick={() => handleRentEquipment(equipment.equipment_id)}
              >
                Kirala
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              Giriş Yap
            </button>
          </form>
          <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
            Hesabınız yok mu? <a href="#" style={{ color: '#00ffff' }}>Kayıt Ol</a>
          </p>
        </div>
      );
    }

    // Giriş yapılmışsa alt tab'ler
    return (
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
        {/* Alt Tab Butonları */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #123', paddingBottom: '4px', marginBottom: '10px' }}>
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
        </div>

        {/* Alt Tab İçerikleri */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {accountLoading ? (
            <p style={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</p>
          ) : (
            <>
              {accountSubtab === ACCOUNT_SUBTABS.PROFILE && renderProfileSubtab()}
              {accountSubtab === ACCOUNT_SUBTABS.RENTALS && renderRentalsSubtab()}
              {accountSubtab === ACCOUNT_SUBTABS.POSTS && renderPostsSubtab()}
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
                      Başlangıç: {new Date(rental.start_at).toLocaleString('tr-TR')}
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
                      Başlangıç: {new Date(rental.start_at).toLocaleString('tr-TR')} | {rental.price_per_hour} ₺/saat
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
  const renderPostsSubtab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 style={{ color: '#00ffff', margin: 0 }}>📝 Paylaştığım Postlar</h4>
      {myPosts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myPosts.map((post) => (
            <div
              key={post.post_id}
              style={{
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid #00ffff33',
                borderRadius: 6,
                padding: 10,
              }}
            >
              <h5 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '0.9rem' }}>{post.title}</h5>
              <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '4px 0' }}>{post.content}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {post.zone_name ? `📍 ${post.zone_name}` : '🌐 Genel'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {new Date(post.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888', textAlign: 'center' }}>Henüz post paylaşmadınız.</p>
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
    <div style={{ width: '340px', background: '#020817', color: 'white', padding: '14px 16px', borderLeft: '2px solid #00ffff', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.5)', height: '100%' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #123', paddingBottom: '4px' }}>
        <button style={tabButtonStyle(TABS.INFO)} onClick={() => setActiveTab(TABS.INFO)}>Bilgi</button>
        <button style={tabButtonStyle(TABS.BOAT)} onClick={() => setActiveTab(TABS.BOAT)}>Tekne</button>
        <button style={tabButtonStyle(TABS.EQUIP)} onClick={() => setActiveTab(TABS.EQUIP)}>Ekipman</button>
        <button style={tabButtonStyle(TABS.FORUM)} onClick={() => setActiveTab(TABS.FORUM)}>Forum</button>
        <button style={tabButtonStyle(TABS.ACCOUNT)} onClick={() => setActiveTab(TABS.ACCOUNT)}>Giriş</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Sidebar;