// frontend/src/components/GameMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Kendi yazdığımız modüller
import { isPointInsidePolygon } from '../utils/geometry';
import { fetchZones, fetchHotspots, fetchActiveBoats, fetchZoneStats, fetchAllZonesStats, fetchUpcomingActivitiesByZone } from '../api/api';

import toast from 'react-hot-toast';


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

// Etkinlik badge ikonu - Modern tasarım
const createActivityBadgeIcon = (count) => {
  return new L.DivIcon({
    className: 'activity-badge-icon',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Glow efekti -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0) 70%);
          border-radius: 50%;
          animation: pulse-glow 2s ease-in-out infinite;
        "></div>
        
        <!-- Ana badge -->
        <div style="
          position: relative;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          border: 3px solid #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(245, 158, 11, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: translateZ(0);
          transition: all 0.3s ease;
        ">
          <!-- Etkinlik ikonu (kalendar) -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 2px;">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" fill="white" opacity="0.9"/>
          </svg>
          <!-- Sayı -->
          <span style="
            font-weight: 900;
            font-size: 11px;
            color: white;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
            line-height: 1;
            margin-top: -2px;
          ">${count}</span>
        </div>
      </div>
      <style>
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        .activity-badge-icon:hover div:last-child {
          transform: scale(1.15);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.6),
            0 0 30px rgba(245, 158, 11, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

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

// --- ETKİNLİK BADGE MARKER BİLEŞENİ ---
// Badge'e tıklandığında gelecek etkinlikleri gösterir
function ActivityBadgeMarker({ zoneId, position, activityCount }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current?.leafletElement;
    if (!marker) return;

    // İlk popup içeriği
    const loadingContent = '<div style="text-align: center; padding: 10px;">Yükleniyor...</div>';
    marker.bindPopup(loadingContent);

    // Popup açıldığında etkinlikleri yükle
    const handlePopupOpen = async () => {
      try {
        const upcomingActivities = await fetchUpcomingActivitiesByZone(zoneId);
        // Sadece gelecek etkinlikleri filtrele (start_date > NOW)
        const futureActivities = upcomingActivities.filter(activity => {
          const startDate = new Date(activity.start_date);
          return startDate > new Date();
        });

        let content = '';
        if (futureActivities.length === 0) {
          content = '<div style="text-align: center; padding: 10px; color: #888;">Gelecek etkinlik bulunmuyor.</div>';
        } else {
          content = `
            <div style="min-width: 250px; max-width: 350px;">
              <h4 style="margin: 0 0 10px 0; color: #f59e0b; font-size: 14px;">📅 Gelecek Etkinlikler (${futureActivities.length})</h4>
              <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
          `;

          futureActivities.forEach((activity) => {
            const startDate = new Date(activity.start_date);
            const endDate = new Date(activity.end_date);
            const formattedStart = startDate.toLocaleString('tr-TR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const formattedEnd = endDate.toLocaleString('tr-TR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            content += `
              <div style="
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
              ">
                <div style="font-weight: bold; color: #f59e0b; margin-bottom: 6px; font-size: 13px;">
                  ${activity.title || 'Etkinlik'}
                </div>
                ${activity.description ? `
                  <div style="color: #ccc; font-size: 11px; margin-bottom: 6px;">
                    ${activity.description.substring(0, 100)}${activity.description.length > 100 ? '...' : ''}
                  </div>
                ` : ''}
                <div style="font-size: 11px; color: #aaa;">
                  <div>🕐 Başlangıç: ${formattedStart}</div>
                  <div>🕐 Bitiş: ${formattedEnd}</div>
                  ${activity.zone_name ? `<div>📍 Bölge: ${activity.zone_name}</div>` : ''}
                </div>
              </div>
            `;
          });

          content += `
              </div>
            </div>
          `;
        }

        marker.setPopupContent(content);
      } catch (err) {
        console.error('Etkinlikler yüklenemedi:', err);
        marker.setPopupContent('<div style="text-align: center; padding: 10px; color: #dc2626;">Etkinlikler yüklenirken hata oluştu.</div>');
      }
    };

    marker.on('popupopen', handlePopupOpen);

    return () => {
      marker.off('popupopen', handlePopupOpen);
    };
  }, [zoneId]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={createActivityBadgeIcon(activityCount)}
    >
      <Popup />
    </Marker>
  );
}

// --- ANA BİLEŞEN ---
const GameMap = ({ onZoneSelect }) => { // <--- Prop olarak onZoneSelect alıyoruz
  const [lakeData, setLakeData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [fishPos, setFishPos] = useState([38.60, 42.90]);
  const lakePolygonRef = useRef(null);
  const [boats, setBoats] = useState([]);
  const [zoneActivityMarkers, setZoneActivityMarkers] = useState([]);
  const lastErrorToastAtRef = useRef(0); // ✅ DOĞRU YER

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
      } catch (err) {
        console.error('Zones hatası:', err);
        toast.error('Harita bölgeleri yüklenemedi.');
      }
    };
    loadZones();
  }, []);

  // 🔹 BÖLGE ETKİNLİK MARKER'LARINI YÜKLE
  useEffect(() => {
    if (!lakeData) return;

    const loadActivityMarkers = async () => {
      try {
        const allZonesStats = await fetchAllZonesStats();
        const statsMap = new Map();
        allZonesStats.forEach(stat => {
          statsMap.set(stat.zone_id, stat);
        });

        // Her bölge için etkinlik sayısı > 0 ise marker oluştur
        const markers = [];
        lakeData.features.forEach(feature => {
          const zoneId = feature.properties.zone_id || feature.properties.id;
          if (!zoneId) return;

          const stats = statsMap.get(parseInt(zoneId));
          const activityCount = stats?.activity_count || 0;

          if (activityCount > 0) {
            // Polygon centroid hesapla
            // GeoJSON formatı: [lng, lat], Leaflet formatı: [lat, lng]
            let center = null;
            if (feature.geometry.type === 'Polygon') {
              const coords = feature.geometry.coordinates[0];
              let sumLng = 0, sumLat = 0;
              coords.forEach(coord => {
                sumLng += coord[0]; // GeoJSON: lng
                sumLat += coord[1]; // GeoJSON: lat
              });
              // Leaflet için [lat, lng] formatına çevir
              center = [sumLat / coords.length, sumLng / coords.length];
            } else if (feature.geometry.type === 'MultiPolygon') {
              const coords = feature.geometry.coordinates[0][0];
              let sumLng = 0, sumLat = 0;
              coords.forEach(coord => {
                sumLng += coord[0]; // GeoJSON: lng
                sumLat += coord[1]; // GeoJSON: lat
              });
              // Leaflet için [lat, lng] formatına çevir
              center = [sumLat / coords.length, sumLng / coords.length];
            }

            if (center) {
              markers.push({
                zoneId: parseInt(zoneId),
                position: center,
                activityCount: activityCount
              });
            }
          }
        });

        setZoneActivityMarkers(markers);
      } catch (err) {
        console.error('Bölge etkinlik marker\'ları yüklenemedi:', err);
      }
    };

    loadActivityMarkers();
  }, [lakeData]);

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
      } catch (err) {
        console.error('Veri hatası:', err);
        const now = Date.now();
        if (now - lastErrorToastAtRef.current > 30000) { // 30 sn
          toast.error('Harita verileri güncellenemedi (hotspot/tekne).');
          lastErrorToastAtRef.current = now;
        }
      }
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
    const type = feature.properties.type || 'unknown';
    const name = (feature.properties.name || '').toLowerCase();
    const description = (feature.properties.description || '').toLowerCase();
    const notes = (feature.properties.notes || '').toLowerCase();

    // Göl için özel stil
    if (type === 'lake' || name.includes('van') || name.includes('göl')) {
      return { color: '#00ffff', fillColor: '#001133', weight: 2, fillOpacity: 0.3 };
    }

    // Bölge tipine göre renk ataması
    const searchText = `${name} ${description} ${notes}`;

    // Ormanlık / Ağaçlık bölgeler - Yeşil tonları
    if (searchText.includes('orman') || searchText.includes('ağaç') || searchText.includes('forest') ||
      searchText.includes('tree') || searchText.includes('wood')) {
      return {
        color: '#22c55e',
        fillColor: '#16a34a',
        weight: 2,
        fillOpacity: 0.4,
        stroke: true
      };
    }

    // Sazlık / Bataklık / Reed bölgeler - Sarı/Turuncu tonları
    if (searchText.includes('sazlık') || searchText.includes('saz') || searchText.includes('reed') ||
      searchText.includes('bataklık') || searchText.includes('marsh') || searchText.includes('swamp')) {
      return {
        color: '#f59e0b',
        fillColor: '#eab308',
        weight: 2,
        fillOpacity: 0.5,
        stroke: true
      };
    }

    // Kıyı / Sahil bölgeleri - Mavi tonları
    if (searchText.includes('kıyı') || searchText.includes('sahil') || searchText.includes('shore') ||
      searchText.includes('coast') || searchText.includes('beach')) {
      return {
        color: '#3b82f6',
        fillColor: '#2563eb',
        weight: 2,
        fillOpacity: 0.4,
        stroke: true
      };
    }

    // Kayalık / Taşlık bölgeler - Gri tonları
    if (searchText.includes('kaya') || searchText.includes('taş') || searchText.includes('rock') ||
      searchText.includes('stone') || searchText.includes('cliff')) {
      return {
        color: '#6b7280',
        fillColor: '#4b5563',
        weight: 2,
        fillOpacity: 0.4,
        stroke: true
      };
    }

    // Çayır / Otlak bölgeler - Açık yeşil tonları
    if (searchText.includes('çayır') || searchText.includes('otlak') || searchText.includes('meadow') ||
      searchText.includes('grass') || searchText.includes('pasture')) {
      return {
        color: '#84cc16',
        fillColor: '#65a30d',
        weight: 2,
        fillOpacity: 0.4,
        stroke: true
      };
    }

    // Ada / Adacık bölgeler - Mor tonları
    if (searchText.includes('ada') || searchText.includes('island') || searchText.includes('isle')) {
      return {
        color: '#a855f7',
        fillColor: '#9333ea',
        weight: 2,
        fillOpacity: 0.4,
        stroke: true
      };
    }

    // Varsayılan renk (turuncu) - Bilinmeyen bölgeler
    return {
      color: '#ffaa00',
      fillColor: '#ffaa00',
      weight: 2,
      fillOpacity: 0.5,
      stroke: true
    };
  };

  // --- KRİTİK NOKTA: TIKLAMA MANTIĞI BURADA ---
  const onEachFeature = (feature, layer) => {
    const name = feature.properties.name || 'Bölge';
    const zoneId = feature.properties.zone_id || feature.properties.id;

    // İlk popup içeriği (loading state)
    const loadingContent = `
      <strong>${name}</strong><br/>
      <span style="font-size:11px; color:#aaa;">Bölge ID: ${zoneId}</span><br/>
      <span style="font-size:11px; color:#888;">İstatistikler yükleniyor...</span>
    `;

    layer.bindPopup(loadingContent);

    // Popup açıldığında istatistikleri yükle
    layer.on('popupopen', async () => {
      if (!zoneId) return;

      try {
        const stats = await fetchZoneStats(zoneId);
        const statsContent = `
          <div style="min-width: 200px;">
            <strong>${name}</strong><br/>
            <span style="font-size:11px; color:#aaa;">Bölge ID: ${zoneId}</span>
            <hr style="margin: 8px 0; border-color: #333;">
            <div style="font-size:11px; line-height: 1.6;">
              <div><strong>📅 Aktivite Sayısı:</strong> ${stats.activity_count || 0}</div>
              <div><strong>💬 Post Sayısı:</strong> ${stats.post_count || 0}</div>
              ${stats.avg_activity_duration_hours ?
            `<div><strong>⏱️ Ort. Aktivite Süresi:</strong> ${parseFloat(stats.avg_activity_duration_hours).toFixed(1)} saat</div>` : ''}
              ${stats.earliest_activity ?
            `<div><strong>📆 İlk Aktivite:</strong> ${new Date(stats.earliest_activity).toLocaleDateString('tr-TR')}</div>` : ''}
              ${stats.latest_activity ?
            `<div><strong>📆 Son Aktivite:</strong> ${new Date(stats.latest_activity).toLocaleDateString('tr-TR')}</div>` : ''}
            </div>
          </div>
        `;
        layer.setPopupContent(statsContent);
      } catch (err) {
        console.error('Bölge istatistikleri yüklenemedi:', err);
        const errorContent = `
          <strong>${name}</strong><br/>
          <span style="font-size:11px; color:#aaa;">Bölge ID: ${zoneId}</span><br/>
          <span style="font-size:11px; color:#dc2626;">İstatistikler yüklenemedi</span>
        `;
        layer.setPopupContent(errorContent);
      }
    });

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

      {/* Bölge Etkinlik Badge'leri */}
      {zoneActivityMarkers.map((marker) => (
        <ActivityBadgeMarker
          key={`activity-${marker.zoneId}`}
          zoneId={marker.zoneId}
          position={marker.position}
          activityCount={marker.activityCount}
        />
      ))}
    </MapContainer>
  );
};

export default GameMap;