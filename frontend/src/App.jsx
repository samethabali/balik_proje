// frontend/src/App.jsx
import React, { useState } from 'react';
import GameMap from './components/GameMap';
import Sidebar from './components/SideBar';
import './styles/index.css'; // Varsa global stiller

function App() {
  // Seçilen bölge bilgisini burada tutuyoruz
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      
      {/* Harita Alanı (Sol Taraf) */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Haritaya "Biri tıklarsa bana haber ver" diyoruz (onZoneSelect) */}
        <GameMap onZoneSelect={(zone) => setSelectedZone(zone)} />
      </div>

      {/* Bilgi Paneli (Sağ Taraf) */}
      {/* Seçilen bölgeyi Sidebar'a gönderiyoruz */}
      <Sidebar zoneDetails={selectedZone} />
      
    </div>
  );
}

export default App;