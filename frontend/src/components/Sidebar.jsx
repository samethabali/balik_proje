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
} from '../api/api';

const TABS = {
  INFO: 'info',
  BOAT: 'boat',
  EQUIP: 'equip',
  FORUM: 'forum',
  ACCOUNT: 'account',
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

  // BOAT tab aktif olduğunda müsait tekneleri yükle (AYNEN KORUNDU)
  useEffect(() => {
    if (activeTab !== TABS.BOAT) return;

    const loadBoats = async () => {
      setBoatsLoading(true);
      setBoatsError(null);
      try {
        const data = await fetchAvailableBoats();
        setAvailableBoats(data);
      } catch (err) {
        console.error(err);
        setBoatsError('Tekneler yüklenirken bir hata oluştu.');
      } finally {
        setBoatsLoading(false);
      }
    };

    loadBoats();
  }, [activeTab]);

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

  // INFO TAB (AYNEN KORUNDU)
  const renderInfoTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    </div>
  );

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

  const renderAccountTab = () => (
    <div style={{ marginTop: '10px' }}>
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>👤 Hesap</h3>
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Buraya Giriş / Kayıt formu gelecek.</p>
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