// frontend/src/components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ zoneDetails }) => {
  return (
    <div
      style={{
        width: "320px",
        background: "#0a1929",
        color: "white",
        padding: "20px",
        borderLeft: "2px solid #00ffff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-5px 0 15px rgba(0,0,0,0.5)"
      }}
    >
      {zoneDetails ? (
        <>
          <h2 style={{ color: "#00ffff", marginTop: 0, textShadow: "0 0 10px #00ffff" }}>
            {zoneDetails.name}
          </h2>
          <div style={{ background: "rgba(0, 255, 255, 0.1)", padding: "10px", borderRadius: "5px", border: "1px solid #00ffff" }}>
            <p style={{ color: "#eee", lineHeight: "1.6", margin: 0 }}>
              {zoneDetails.description || zoneDetails.notes || "Açıklama yok."}
            </p>
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #333' }}>
            <span style={{ color: '#00ffff', fontSize: '0.8rem' }}>BÖLGE TİPİ:</span>
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold' }}>
               {zoneDetails.type ? zoneDetails.type.toUpperCase() : 'BİLİNMİYOR'}
            </span>
          </div>
        </>
      ) : (
        <div style={{ color: "#888", textAlign: "center", marginTop: "50%" }}>
          <p>📡 <br/>Veri bekleniyor...<br/><br/>Haritadan bir bölge seçin.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;