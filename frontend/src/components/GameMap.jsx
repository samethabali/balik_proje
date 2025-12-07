// frontend/src/components/GameMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Kendi yazdığımız modüller
import { isPointInsidePolygon } from '../utils/geometry';
import { fetchZones, fetchHotspots } from '../api/api';
import { fetchActiveBoats } from '../api/api';


// Balık iconu (hotspotlar için de bunu kullanacağız)
const fishIcon = new L.DivIcon({
  className: 'custom-fish-icon',
  html: `<div style="width:14px; height:14px; border-radius:50%; background:#00ffff; box-shadow:0 0 12px #00ffff;"></div>`
});

const boatIcon = new L.DivIcon({
  className: 'custom-boat-icon',
  html: `<div style="width:16px; height:16px; border-radius:50%; background:#ffa500; box-shadow:0 0 14px #ffa500;"></div>`
});


const GameMap = () => {
  const [lakeData, setLakeData] = useState(null);
  const [hotspots, setHotspots] = useState([]);      // 🔹 YENİ: hotspot listesi
  const [fishPos, setFishPos] = useState([38.60, 42.90]); // demo hareketli balık (istersen sonra kaldırırız)
  const lakePolygonRef = useRef(null);
  const [boats, setBoats] = useState([]);       // 🔹 yeni


  // 🔹 1) ZONE VERİSİNİ YÜKLE
  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await fetchZones();
        setLakeData(data);

        const lakeFeature = data.features.find(
          f =>
            f.properties.type === 'lake' ||
            (f.properties.name && f.properties.name.includes('Van'))
        );

        if (lakeFeature) {
          if (lakeFeature.geometry.type === 'Polygon') {
            lakePolygonRef.current = lakeFeature.geometry.coordinates[0];
          } else if (lakeFeature.geometry.type === 'MultiPolygon') {
            lakePolygonRef.current = lakeFeature.geometry.coordinates[0][0];
          }
        }
      } catch (err) {
        console.error('Zones yüklenirken hata:', err);
      }
    };

    loadZones();
  }, []);

  // 🔹 2) HOTSPOT VERİSİNİ YÜKLE & PERİYODİK GÜNCELLE
  useEffect(() => {
    let isMounted = true;

    const loadHotspots = async () => {
      try {
        const data = await fetchHotspots(); // FeatureCollection bekliyoruz
        if (isMounted) {
          setHotspots(data.features || []);
        }
      } catch (err) {
        console.error('Hotspots yüklenirken hata:', err);
      }
    };

    // İlk yükleme
    loadHotspots();

    // Her 5 saniyede bir tekrar çek
    const interval = setInterval(loadHotspots, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 🔹 3) DEMO: Hareketli tek balık (istersen sonra kaldırırız)
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

  // 🔹 3) TEKNELERİN ANLIK KONUMUNU YÜKLE & PERİYODİK GÜNCELLE
  useEffect(() => {
    let isMounted = true;

    const loadBoats = async () => {
      try {
        const data = await fetchActiveBoats();
        if (isMounted) {
          setBoats(data || []);
        }
      } catch (err) {
        console.error('Boats yüklenirken hata:', err);
      }
    };

    // İlk yükleme
    loadBoats();

    // Her 5 saniyede bir tekrar çek
    const interval = setInterval(loadBoats, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Stiller
  const getStyle = (feature) => {
    const type = feature.properties.type || 'unknown';
    if (type === 'lake' || (feature.properties.name && feature.properties.name.includes('Van'))) {
      return { color: '#00ffff', fillColor: '#001133', weight: 2, fillOpacity: 0.3 };
    }
    return { color: '#ffaa00', fillColor: '#ffaa00', weight: 2, fillOpacity: 0.5 };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.name || 'Bölge';
    const desc = feature.properties.description || feature.properties.notes || '';
    const type = feature.properties.type || 'unknown';

    const html = `
    <strong>${name}</strong><br/>
    ${desc ? `${desc}<br/>` : ''}
    <span style="font-size:11px; color:#aaa;">Tür: ${type}</span>
  `;

    layer.bindPopup(html);
  };

  return (
    <MapContainer
      center={[38.60, 42.90]}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {/* Göl ve bölgeler */}
      {lakeData && (
        <GeoJSON data={lakeData} style={getStyle} onEachFeature={onEachFeature} />
      )}


      {/* 🔹 HOTSPOT MARKER'LARI */}
      {hotspots.map((feature) => {
        const { id, species_name, intensity, last_seen, depth } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;

        return (
          <Marker key={`hotspot-${id}`} position={[lat, lng]} icon={fishIcon}>
            <Popup>
              <strong>{species_name}</strong>
              <br />
              Yoğunluk: {intensity} / 10
              <br />
              Derinlik: {depth} m
              <br />
              Son görülme: {new Date(last_seen).toLocaleString('tr-TR')}
            </Popup>
          </Marker>
        );
      })}

      {/* 🔹 TEKNE MARKER'LARI */}
      {boats.map((boat) => {
        if (!boat.geometry) return null;
        const [lng, lat] = boat.geometry.coordinates;

        return (
          <Marker
            key={`boat-${boat.boat_id}`}
            position={[lat, lng]}
            icon={boatIcon}
          >
            <Popup>
              <strong>🛶 {boat.name}</strong>
              <br />
              Kapasite: {boat.capacity} kişi
              <br />
              Kiralama ID: {boat.rental_id}
            </Popup>
          </Marker>
        );
      })}


      {/* Demo hareketli balık (istersen sonra kaldırırız) */}
      <Marker position={fishPos} icon={fishIcon}>
        <Popup>Hareketli Balık Sürüsü (Demo)</Popup>
      </Marker>
    </MapContainer>
  );
};

export default GameMap;
