import React, { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchUpcomingActivitiesByZone, fetchZoneStats } from '../../api/api';

// Icon definitions
export const fishIcon = new L.DivIcon({
  className: 'sonar-blip',
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
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

export const boatIcon = new L.DivIcon({
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

export const createActivityBadgeIcon = (count) => {
  return new L.DivIcon({
    className: 'activity-badge-icon',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Animated ripple background -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.15) 100%);
          border-radius: 10px;
          animation: ripple-wave 2.8s ease-in-out infinite;
        "></div>
        
        <!-- Main badge container -->
        <div style="
          position: relative;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(8, 145, 178, 0.25) 100%);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(6, 182, 212, 0.4);
          border-radius: 10px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          box-shadow: 
            0 4px 16px rgba(6, 182, 212, 0.15),
            0 0 1px rgba(6, 182, 212, 0.3) inset,
            0 0 0 0.5px rgba(255, 255, 255, 0.1) inset;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <!-- Water droplet accent -->
          <div style="
            position: absolute;
            top: -5px;
            width: 6px;
            height: 6px;
            background: rgba(6, 182, 212, 0.5);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            animation: float-drop 2s ease-in-out infinite;
          "></div>
          
          <!-- Counter display -->
          <span style="
            font-weight: 800;
            font-size: 13px;
            color: rgba(6, 182, 212, 0.9);
            text-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
            line-height: 1;
            letter-spacing: -0.5px;
          ">${count}</span>
          
          <!-- Icon/Label -->
          <span style="
            font-size: 7px;
            color: rgba(6, 182, 212, 0.6);
            font-weight: 700;
            margin-top: 0px;
            letter-spacing: 0.3px;
          ">AKTİF</span>
        </div>
      </div>
      <style>
        @keyframes ripple-wave {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        
        @keyframes float-drop {
          0%, 100% {
            transform: rotate(-45deg) translateY(0);
            opacity: 0.4;
          }
          50% {
            transform: rotate(-45deg) translateY(-4px);
            opacity: 0.8;
          }
        }
        
        .activity-badge-icon:hover > div:nth-child(2) {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.5) 0%, rgba(8, 145, 178, 0.4) 100%);
          border-color: rgba(6, 182, 212, 0.6);
          box-shadow: 
            0 6px 20px rgba(6, 182, 212, 0.25),
            0 0 2px rgba(6, 182, 212, 0.5) inset,
            0 0 0 0.5px rgba(255, 255, 255, 0.15) inset;
          transform: translateY(-2px);
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Hotspot Marker Component
export const HotspotMarker = ({ feature }) => {
  const { id, species_name, intensity, last_seen, depth } = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  
  return (
    <Marker position={[lat, lng]} icon={fishIcon}>
      <Popup>
        <strong>{species_name}</strong><br />
        Yoğunluk: {intensity}/10<br />
        Derinlik: {depth}m
      </Popup>
    </Marker>
  );
};

// Boat Marker Component
export const BoatMarker = ({ boat }) => {
  if (!boat.geometry) return null;
  const [lng, lat] = boat.geometry.coordinates;
  
  return (
    <Marker position={[lat, lng]} icon={boatIcon}>
      <Popup>
        <strong>🛶 {boat.name}</strong><br />
        Durum: {boat.status}
      </Popup>
    </Marker>
  );
};

// Activity Badge Marker Component
// Activity Badge Marker Component
const ActivityBadgePopupContent = ({ zoneId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        console.log('Fetching activities for zoneId:', zoneId);
        const upcomingActivities = await fetchUpcomingActivitiesByZone(zoneId);
        console.log('Fetched activities:', upcomingActivities);
        
        const now = new Date();
        
        // Filter for active and future activities only (not past)
        const activeAndFutureActivities = Array.isArray(upcomingActivities)
          ? upcomingActivities.filter(activity => {
              const endDate = new Date(activity.end_date);
              return endDate > now;
            })
          : [];

        console.log('Active and future activities:', activeAndFutureActivities);
        setActivities(activeAndFutureActivities);
        setLoading(false);
      } catch (err) {
        console.error('Etkinlikler yüklenemedi:', err, err.stack);
        setError(err.message);
        setLoading(false);
      }
    };

    loadActivities();
  }, [zoneId]);

  if (loading) {
    return <div style={{ padding: '10px', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ padding: '10px', color: '#dc2626', textAlign: 'center' }}>Hata: {error}</div>;
  }

  if (activities.length === 0) {
    return <div style={{ padding: '10px', color: '#888', textAlign: 'center' }}>Aktif veya gelecek etkinlik bulunmuyor.</div>;
  }

  return (
    <div style={{ minWidth: '280px', maxWidth: '380px' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#f59e0b', fontSize: '14px' }}>
        📅 Aktif & Gelecek Etkinlikler ({activities.length})
      </h4>
      <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
        {activities.map((activity) => {
          const now = new Date();
          const startDate = new Date(activity.start_date);
          const endDate = new Date(activity.end_date);
          const isActive = startDate <= now && endDate > now;
          const statusBadge = isActive 
            ? { bg: '#10b981', text: '🟢 Aktif' }
            : { bg: '#3b82f6', text: '🔵 Gelecek' };

          const formattedStart = startDate.toLocaleString('tr-TR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={activity.activity_id}
              style={{
                background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="activity-badge-item"
              onClick={() => console.log('Activity clicked:', activity.activity_id)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <strong style={{
                  color: isActive ? '#10b981' : '#3b82f6',
                  fontSize: '12px'
                }}>
                  {activity.title || 'Etkinlik'}
                </strong>
                <span style={{
                  background: statusBadge.bg,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {statusBadge.text}
                </span>
              </div>
              {activity.description && (
                <div style={{
                  color: '#ccc',
                  fontSize: '11px',
                  marginBottom: '6px'
                }}>
                  {activity.description.substring(0, 80)}{activity.description.length > 80 ? '...' : ''}
                </div>
              )}
              <div style={{
                fontSize: '10px',
                color: '#aaa'
              }}>
                🕐 {formattedStart}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ActivityBadgeMarker = ({ zoneId, position, activityCount }) => {
  return (
    <Marker
      position={position}
      icon={createActivityBadgeIcon(activityCount)}
    >
      <Popup>
        <ActivityBadgePopupContent zoneId={zoneId} />
      </Popup>
    </Marker>
  );
};

// Zone Popup Handler Component
// Bu bileşen artık MapMarkers.jsx dosyasında değildir
// Popup işlemi GameMap/index.jsx dosyasındaki onEachFeature callback'inde gerçekleştirilmektedir

