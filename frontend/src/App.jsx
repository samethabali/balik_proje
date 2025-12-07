// frontend/src/App.jsx
import React, { useState } from 'react';
import GameMap from './components/GameMap';
import Sidebar from './components/Sidebar';
import './styles/index.css';

function App() {
  // Seçili bölgeyi burada tutuyoruz (Başlangıçta null = tüm göl)
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      
      {/* SOL TARAF: HARİTA */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Haritaya "Biri tıklarsa bana haber ver" diyoruz (onZoneSelect) */}
        <GameMap onZoneSelect={(zone) => setSelectedZone(zone)} />
        
        {/* (Opsiyonel) Sol üstte hangi bölgede olduğumuzu gösteren ufak bilgi */}
        {selectedZone && (
          <div style={{
            position: 'absolute', 
            top: '20px', 
            left: '60px', 
            zIndex: 1000, 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            color: '#00ffff', 
            padding: '10px', 
            borderRadius: '8px',
            border: '1px solid #00ffff',
            backdropFilter: 'blur(4px)'
          }}>
            📍 Seçili Bölge: <strong>{selectedZone.name}</strong>
          </div>
        )}
      </div>

      {/* SAĞ TARAF: SIDEBAR */}
      {/* Seçili bölge bilgisini Sidebar'a gönderiyoruz, o da Forum'a iletecek */}
      <Sidebar selectedZone={selectedZone} />
    </div>
  );
}

export default App;