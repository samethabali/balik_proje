// frontend/src/components/RentalHistoryPanel.jsx
import React, { useState } from 'react';
import { fetchCompletedRentals } from '../api/api';
import toast from 'react-hot-toast';

const RentalHistoryPanel = ({ onClose }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userName: '',
    startDate: '',
    endDate: '',
    rentalType: 'all'
  });

  const handleFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchCompletedRentals({
        userName: filters.userName || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        rentalType: filters.rentalType
      });
      setRentals(data);
      if (!data || data.length === 0) {
        toast('Sonuç bulunamadı. Filtreleri değiştirip tekrar deneyin.');
      } else {
        toast.success(`${data.length} kayıt bulundu.`);
      }

    } catch (err) {
      const m = err.message || 'Kiralamalar yüklenemedi';
      setError(m);
      setRentals([]);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const panelStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  };

  const contentStyle = {
    backgroundColor: '#020817',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    color: 'white'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    background: '#111',
    border: '1px solid #333',
    color: 'white',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '10px 20px',
    background: '#00ffff',
    color: '#00111f',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  };

  const closeButtonStyle = {
    ...buttonStyle,
    background: '#dc2626',
    color: 'white'
  };

  return (
    <div style={panelStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={{ color: '#00ffff', margin: 0 }}>📊 Geçmiş Kiralamalar</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#fca5a5', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleFilter} style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Kullanıcı Adı</label>
              <input
                type="text"
                value={filters.userName}
                onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                style={inputStyle}
                placeholder="Kullanıcı adı ile filtrele..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Kiralama Tipi</label>
              <select
                value={filters.rentalType}
                onChange={(e) => setFilters({ ...filters, rentalType: e.target.value })}
                style={inputStyle}
              >
                <option value="all">Tümü</option>
                <option value="boat">Tekne</option>
                <option value="equipment">Ekipman</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Başlangıç Tarihi</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Bitiş Tarihi</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={closeButtonStyle} disabled={loading}>
              Kapat
            </button>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Filtrele'}
            </button>
          </div>
        </form>

        <div className="rental-history-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && rentals.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Yükleniyor...</p>
          ) : rentals.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Kiralama bulunamadı. Filtreleri değiştirip tekrar deneyin.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rentals.map((rental) => (
                <div
                  key={`${rental.rental_type}-${rental.rental_id}`}
                  style={{
                    background: 'rgba(0, 255, 255, 0.05)',
                    border: '1px solid #00ffff33',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <strong style={{ color: '#00ffff' }}>{rental.item_name}</strong>
                        <span style={{
                          background: rental.rental_type === 'boat' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: rental.rental_type === 'boat' ? '#60a5fa' : '#4ade80',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {rental.rental_type === 'boat' ? '🛶 Tekne' : '🎣 Ekipman'}
                        </span>
                      </div>
                      <p style={{ color: '#ccc', margin: '4px 0', fontSize: '0.8rem' }}>
                        👤 {rental.user_name} ({rental.user_email})
                      </p>
                      <p style={{ color: '#aaa', margin: '4px 0', fontSize: '0.75rem' }}>
                        📅 Başlangıç: {new Date(rental.start_at).toLocaleString('tr-TR')}
                      </p>
                      <p style={{ color: '#aaa', margin: '4px 0', fontSize: '0.75rem' }}>
                        📅 Bitiş: {new Date(rental.end_at).toLocaleString('tr-TR')}
                      </p>
                      <p style={{ color: '#aaa', margin: '4px 0', fontSize: '0.75rem' }}>
                        ⏱️ Süre: {rental.duration_hours} saat
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {rental.total_price.toFixed(2)} ₺
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalHistoryPanel;

