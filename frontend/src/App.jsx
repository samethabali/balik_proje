import React, { useEffect, useState } from 'react';
import GameMap from './components/GameMap';
import Sidebar from './components/Sidebar';
import { fetchMe } from './api/api';
import './styles/index.css';
import toast from 'react-hot-toast';

function App() {
  const [selectedZone, setSelectedZone] = useState(null);

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const me = await fetchMe(token);
        setCurrentUser(me);
      } catch (e) {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }
    };
    load();
  }, [token]);

  const handleLoginSuccess = (newToken, user) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <GameMap onZoneSelect={(zone) => setSelectedZone(zone)} />
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

      <Sidebar
        selectedZone={selectedZone}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
