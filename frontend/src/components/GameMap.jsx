// frontend/src/components/GameMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Kendi yazdığımız modüller
import { isPointInsidePolygon } from '../utils/geometry';
import { fetchZones, fetchHotspots, fetchActiveBoats } from '../api/api';

// --- İKON TANIMLARI ---
// Balık ikonu (SVG)
// --- YENİ SONAR İKONU (SVG DEĞİL, CSS IŞIK EFEKTİ) ---
const fishIcon = new L.DivIcon({
  className: 'sonar-blip', // CSS sınıfı (aşağıda stil eklemeye gerek yok, inline yazdık)
  html: `
    <div style="
      width: 24px; 
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 255, 255, 1) 0%, rgba(0, 255, 255, 0.4) 40%, rgba(0, 255, 255, 0) 70%);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 4px; height: 4px; background: #fff; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24], // Boyutu biraz küçülttük, daha kibar dursun
  iconAnchor: [12, 12], // Tam ortalamak için yarısı
  popupAnchor: [0, -12]
});

// Tekne ikonu (SVG)
const boatIcon = new L.DivIcon({
  className: 'custom-boat-icon',
  html: `
    <div style="
      width: 36px; 
      height: 36px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      filter: drop-shadow(0 0 8px rgba(255, 165, 0, 0.8));
    ">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l2.18-7.65-2.23-.73V4c0-1.1-.9-2-2-2h-3V1h-2v1H8V1H6v1H3c-1.1 0-2 .9-2 2v6.62l-2.23.73L3.95 19zM6 6h12v6.97L12 12.6 6 12.97V6z" fill="#ffa500"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// --- YARDIMCI BİLEŞEN: Harita Boşluğuna Tıklama ---
// Bu bileşen harita zeminine tıklanınca seçimi sıfırlar.
function MapBackgroundClick({ onDeselect }) {
  useMapEvents({
    click: (e) => {
      // Sadece harita zeminine tıklandığında çalışır
      onDeselect();
    },
  });
  return null;
}

// --- ANA BİLEŞEN ---
const GameMap = ({ onZoneSelect }) => { // <--- Prop olarak onZoneSelect alıyoruz
  const [lakeData, setLakeData] = useState(null);
  const [hotspots, setHotspots] = useState([]);      
  const [fishPos, setFishPos] = useState([38.60, 42.90]); 
  const lakePolygonRef = useRef(null);
  const [boats, setBoats] = useState([]);       

  // 🔹 1) ZONE VERİSİNİ YÜKLE
  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await fetchZones();
        setLakeData(data);
        // Göl poligonunu bulma mantığı (Demo balık için)
        const lakeFeature = data.features.find(f => f.properties.type === 'lake' || (f.properties.name && f.properties.name.includes('Van')));
        if (lakeFeature) {
          if (lakeFeature.geometry.type === 'Polygon') {
            lakePolygonRef.current = lakeFeature.geometry.coordinates[0];
          } else if (lakeFeature.geometry.type === 'MultiPolygon') {
            lakePolygonRef.current = lakeFeature.geometry.coordinates[0][0];
          }
        }
      } catch (err) { console.error('Zones hatası:', err); }
    };
    loadZones();
  }, []);

  // 🔹 2) HOTSPOT & BOAT VERİLERİ (Senin kodların aynen duruyor)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const hData = await fetchHotspots();
        const bData = await fetchActiveBoats();
        if (isMounted) {
          setHotspots(hData.features || []);
          setBoats(bData || []);
        }
      } catch (err) { console.error('Veri hatası:', err); }
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // 🔹 3) DEMO BALIK HAREKETİ (Senin kodların aynen duruyor)
  useEffect(() => {
    if (!lakeData || !lakePolygonRef.current) return;
    const interval = setInterval(() => {
      let movementLat = (Math.random() - 0.5) * 0.01;
      let movementLng = (Math.random() - 0.5) * 0.01;
      let newLat = fishPos[0] + movementLat;
      let newLng = fishPos[1] + movementLng;
      let candidate = [newLat, newLng];
      if (isPointInsidePolygon(candidate, lakePolygonRef.current)) {
        setFishPos(candidate);
      } else {
        setFishPos([fishPos[0] - movementLat, fishPos[1] - movementLng]);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [lakeData, fishPos]);

  // --- STİL AYARLARI ---
  const getStyle = (feature) => {
    // Tıklanınca belli olsun diye stil mantığı eklenebilir ama şimdilik senin stilin kalsın
    const type = feature.properties.type || 'unknown';
    if (type === 'lake' || (feature.properties.name && feature.properties.name.includes('Van'))) {
      return { color: '#00ffff', fillColor: '#001133', weight: 2, fillOpacity: 0.3 };
    }
    return { color: '#ffaa00', fillColor: '#ffaa00', weight: 2, fillOpacity: 0.5 };
  };

  // --- KRİTİK NOKTA: TIKLAMA MANTIĞI BURADA ---
  const onEachFeature = (feature, layer) => {
    const name = feature.properties.name || 'Bölge';
    
    // Popup içeriği
    layer.bindPopup(`
      <strong>${name}</strong><br/>
      <span style="font-size:11px; color:#aaa;">Bölge ID: ${feature.properties.zone_id}</span>
    `);

    // Event Listener (Tıklama Olayı)
    layer.on({
      click: (e) => {
        // 1. Haritanın "arkaplan" tıklamasını engelle (Yoksa hem seçer hem iptal eder)
        L.DomEvent.stopPropagation(e);
        
        // 2. App.jsx'e seçilen bölgeyi gönder
        console.log("Seçilen Bölge:", feature.properties);
        onZoneSelect(feature.properties);
      }
    });
  };

  return (
    <MapContainer
      center={[38.60, 42.90]}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {/* Harita boşluğuna tıklayınca seçimi kaldırır */}
      <MapBackgroundClick onDeselect={() => onZoneSelect(null)} />

      {/* Bölge Katmanı */}
      {lakeData && (
        <GeoJSON 
          data={lakeData} 
          style={getStyle} 
          onEachFeature={onEachFeature} // Tıklama mantığı buraya bağlandı
        />
      )}

      {/* Hotspotlar */}
      {hotspots.map((feature) => {
        const { id, species_name, intensity, last_seen, depth } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        return (
          <Marker key={`hotspot-${id}`} position={[lat, lng]} icon={fishIcon}>
            <Popup>
              <strong>{species_name}</strong><br />Yoğunluk: {intensity}/10<br />Derinlik: {depth}m
            </Popup>
          </Marker>
        );
      })}

      {/* Tekneler */}
      {boats.map((boat) => {
        if (!boat.geometry) return null;
        const [lng, lat] = boat.geometry.coordinates;
        return (
          <Marker key={`boat-${boat.boat_id}`} position={[lat, lng]} icon={boatIcon}>
            <Popup><strong>🛶 {boat.name}</strong><br />Durum: {boat.status}</Popup>
          </Marker>
        );
      })}

      {/* Demo Balık */}
      <Marker position={fishPos} icon={fishIcon}><Popup>Demo Balık</Popup></Marker>
    </MapContainer>
  );
};

export default GameMap;