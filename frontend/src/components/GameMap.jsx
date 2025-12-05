// frontend/src/components/GameMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// Kendi yazdığımız modülleri çağırıyoruz
import { isPointInsidePolygon } from '../utils/geometry';
import { fetchZones } from '../api/api';

// İkon
const fishIcon = new L.DivIcon({
  className: 'custom-fish-icon',
  html: `<div style="width:14px; height:14px; border-radius:50%; background:#00ffff; box-shadow:0 0 12px #00ffff;"></div>`
});

// Props olarak "onZoneSelect" alıyoruz ki App.js'e haber verebilelim
const GameMap = ({ onZoneSelect }) => {
  const [lakeData, setLakeData] = useState(null);
  const [fishPos, setFishPos] = useState([38.60, 42.90]);
  const lakePolygonRef = useRef(null);

  // Veri Çekme
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchZones();
        setLakeData(data);

        const lakeFeature = data.features.find(
          f => f.properties.type === "lake" || f.properties.name.includes("Van")
        );

        if (lakeFeature) {
          if (lakeFeature.geometry.type === "Polygon") {
             lakePolygonRef.current = lakeFeature.geometry.coordinates[0];
          } else if (lakeFeature.geometry.type === "MultiPolygon") {
             lakePolygonRef.current = lakeFeature.geometry.coordinates[0][0];
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Balık Hareketi
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

  // Stiller
  const getStyle = (feature) => {
    const type = feature.properties.type || 'unknown';
    if (type === "lake" || feature.properties.name.includes("Van")) {
      return { color: "#00ffff", fillColor: "#001133", weight: 2, fillOpacity: 0.3 };
    }
    return { color: "#ffaa00", fillColor: "#ffaa00", weight: 2, fillOpacity: 0.5 };
  };

  const onEachFeature = (feature, layer) => {
    // Tıklanınca üst bileşene (App.jsx) haber ver
    layer.on("click", () => {
      onZoneSelect(feature.properties);
    });
  };

  return (
    <MapContainer center={[38.60, 42.90]} zoom={9} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {lakeData && <GeoJSON data={lakeData} style={getStyle} onEachFeature={onEachFeature} />}
      <Marker position={fishPos} icon={fishIcon}>
        <Popup>Hareketli Balık Sürüsü</Popup>
      </Marker>
    </MapContainer>
  );
};

export default GameMap;