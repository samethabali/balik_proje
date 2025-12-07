// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import Forum from './Forum'; // <--- Forum bileşenini import ettik
import {
  fetchAvailableBoats,
  createBoatRental,
  completeBoatRental,
} from '../api/api';

const TABS = {
  INFO: 'info',
  BOAT: 'boat',
  EQUIP: 'equip',
  FORUM: 'forum',
  ACCOUNT: 'account',
};

// Reis buraya dikkat: selectedZone ve currentUser propslarını ekledim
const Sidebar = ({ selectedZone, currentUser }) => {
  const [activeTab, setActiveTab] = useState(TABS.INFO);

  // 🔹 Tekne sekmesi için state'ler
  const [availableBoats, setAvailableBoats] = useState([]);
  const [boatsLoading, setBoatsLoading] = useState(false);
  const [boatsError, setBoatsError] = useState(null);
  const [activeRental, setActiveRental] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // BOAT tab aktif olduğunda müsait tekneleri yükle
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

  const handleRentBoat = async (boatId) => {
    try {
      setActionMessage('');
      const rental = await createBoatRental(boatId, 60); // 60 dakika demo
      setActiveRental(rental);
      setActionMessage(
        `Tekneniz göle açıldı! (Kiralama ID: ${rental.rental_id})`
      );

      // Müsait tekne listesini güncelle
      const data = await fetchAvailableBoats();
      setAvailableBoats(data);
    } catch (err) {
      console.error(err);
      setActionMessage(err.message || 'Tekne kiralanırken bir hata oluştu.');
    }
  };

  const handleCompleteRental = async () => {
    if (!activeRental) return;

    try {
      setActionMessage('');
      await completeBoatRental(activeRental.rental_id);
      setActionMessage('Kiralama tamamlandı, tekne iskeleye döndü.');
      setActiveRental(null);

      const data = await fetchAvailableBoats();
      setAvailableBoats(data);
    } catch (err) {
      console.error(err);
      setActionMessage(
        err.message || 'Kiralama tamamlanırken bir hata oluştu.'
      );
    }
  };

  // --- TAB RENDER FONKSİYONLARI ---

  const renderInfoTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h2
        style={{
          color: '#00ffff',
          marginTop: 0,
          textShadow: '0 0 10px #00ffff',
        }}
      >
        Van Gölü Balıkçılık İşletmesi
      </h2>

      <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6 }}>
        {selectedZone 
          ? `Şu an "${selectedZone.name}" bölgesini inceliyorsunuz. Bu bölgedeki avlanma kurallarına dikkat ediniz.`
          : "Türkiye'nin en büyük sodalı gölü olan Van Gölü üzerinde güvenli ve kontrollü balıkçılık deneyimi sunuyoruz."
        }
      </p>

      <div
        style={{
          background: 'rgba(0, 255, 255, 0.08)',
          borderRadius: 6,
          padding: 10,
          border: '1px solid #00ffff33',
          fontSize: '0.85rem',
        }}
      >
        <strong>Seçili Bölge:</strong> {selectedZone ? selectedZone.name : "Tüm Göl"} <br />
        <strong>Konum:</strong> Van Gölü / Gevaş Merkezi<br />
        <strong>Hizmetler:</strong> Tekne kiralama, ekipman kiralama, rehberli turlar.
      </div>
    </div>
  );

  const renderBoatTab = () => (
    <div
      style={{
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>🛶 Tekne Kiralama</h3>
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
        Demo modunda, giriş yapmadan tekne kiralayabilirsiniz.
      </p>

      {boatsLoading && (
        <p style={{ fontSize: '0.85rem', color: '#888' }}>Tekneler yükleniyor…</p>
      )}

      {boatsError && (
        <p style={{ fontSize: '0.85rem', color: '#f97373' }}>{boatsError}</p>
      )}

      {!boatsLoading && !boatsError && availableBoats.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: '#ccc' }}>
          Şu an tüm tekneler gölde. Müsait tekne yok gibi görünüyor.
        </p>
      )}

      {!boatsLoading && !boatsError && availableBoats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableBoats.map((boat) => (
            <div
              key={boat.boat_id}
              style={{
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid #00ffff33',
                borderRadius: 6,
                padding: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <strong>{boat.name}</strong>
                <br />
                Kapasite: {boat.capacity} kişi - {boat.price_per_hour} ₺/saat
              </div>
              <button
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#00ffff',
                  color: '#00111f',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}
                disabled={!!activeRental}
                onClick={() => handleRentBoat(boat.boat_id)}
              >
                Kirala
              </button>
            </div>
          ))}
        </div>
      )}

      {activeRental && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 6,
            border: '1px solid #22c55e55',
            background: 'rgba(34, 197, 94, 0.08)',
            fontSize: '0.85rem',
          }}
        >
          <strong>Aktif Kiralamanız:</strong>
          <br />
          Kiralama ID: {activeRental.rental_id}
          <br />
          <button
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: '#22c55e',
              color: '#00111f',
              fontWeight: 'bold',
            }}
            onClick={handleCompleteRental}
          >
            Kiralamayı Bitir
          </button>
        </div>
      )}

      {actionMessage && (
        <p style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: 4 }}>
          {actionMessage}
        </p>
      )}
    </div>
  );

  const renderEquipTab = () => (
    <div style={{ marginTop: '10px' }}>
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>🎣 Ekipman Kiralama</h3>
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
        Olta, ağ, can yeleği ve diğer ekipmanları buradan kiralayabileceksiniz.
      </p>
    </div>
  );

  // 🔹 İŞTE FORUM BURADA DEVREYE GİRİYOR
  const renderForumTab = () => (
    <div style={{ marginTop: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
       {/* Forum bileşenine propsları aktarıyoruz */}
       <Forum 
          selectedZone={selectedZone} 
          currentUser={currentUser} 
       />
    </div>
  );

  const renderAccountTab = () => (
    <div style={{ marginTop: '10px' }}>
      <h3 style={{ color: '#00ffff', marginTop: 0 }}>👤 Hesap</h3>
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
        Buraya Giriş / Kayıt formu gelecek.
      </p>
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
    flex: 1,
    padding: '8px 6px',
    fontSize: '0.8rem',
    border: 'none',
    cursor: 'pointer',
    background: activeTab === tab ? '#00ffff' : 'transparent',
    color: activeTab === tab ? '#00111f' : '#9aa4b1',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    borderBottom: activeTab === tab ? '2px solid #00ffff' : '1px solid #123',
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
        width: '340px',
        background: '#020817',
        color: 'white',
        padding: '14px 16px',
        borderLeft: '2px solid #00ffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-5px 0 15px rgba(0,0,0,0.5)',
        height: '100%', // Yüksekliği fulledik ki forum scroll olsun
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          borderBottom: '1px solid #123',
          paddingBottom: '4px',
        }}
      >
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