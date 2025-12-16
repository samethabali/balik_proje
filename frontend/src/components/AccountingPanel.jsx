// frontend/src/components/AccountingPanel.jsx
import React, { useState, useEffect } from 'react';
import { fetchMonthlyRevenue } from '../api/api';

const AccountingPanel = ({ onClose }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Yıl seçenekleri: son 2 yıl + mevcut yıl
  const years = [];
  for (let i = currentDate.getFullYear() - 2; i <= currentDate.getFullYear(); i++) {
    years.push(i);
  }

  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' }
  ];

  const loadRevenue = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchMonthlyRevenue({ year: selectedYear, month: selectedMonth });
      setRevenue(data);
    } catch (err) {
      setError(err.message || 'Kazanç bilgileri yüklenemedi');
      setRevenue(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, []);

  const handleShow = (e) => {
    e.preventDefault();
    loadRevenue();
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
    maxWidth: '600px',
    width: '100%',
    color: 'white',
    display: 'flex',
    flexDirection: 'column'
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
          <h2 style={{ color: '#00ffff', margin: 0 }}>💰 Muhasebe</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#fca5a5', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleShow} style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Yıl</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                style={inputStyle}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Ay</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                style={inputStyle}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={closeButtonStyle} disabled={loading}>
              Kapat
            </button>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Göster'}
            </button>
          </div>
        </form>

        <div className="accounting-panel-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && !revenue ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Yükleniyor...</p>
          ) : revenue ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tekne Kazancı */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#60a5fa', margin: '0 0 10px 0', fontSize: '1rem' }}>🛶 Tekne Kiralama</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#ccc', margin: '4px 0', fontSize: '0.85rem' }}>Toplam Kiralama: {revenue.boats.count}</p>
                  </div>
                  <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {revenue.boats.total_revenue.toFixed(2)} ₺
                  </div>
                </div>
              </div>

              {/* Ekipman Kazancı */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#4ade80', margin: '0 0 10px 0', fontSize: '1rem' }}>🎣 Ekipman Kiralama</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#ccc', margin: '4px 0', fontSize: '0.85rem' }}>Toplam Kiralama: {revenue.equipment.count}</p>
                  </div>
                  <div style={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {revenue.equipment.total_revenue.toFixed(2)} ₺
                  </div>
                </div>
              </div>

              {/* Genel Toplam */}
              <div style={{
                background: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid #00ffff',
                borderRadius: '8px',
                padding: '25px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#00ffff', margin: '0 0 15px 0', fontSize: '1.1rem' }}>💰 Genel Toplam</h3>
                <div style={{ color: '#00ffff', fontSize: '2rem', fontWeight: 'bold' }}>
                  {revenue.total_revenue.toFixed(2)} ₺
                </div>
                <p style={{ color: '#aaa', margin: '10px 0 0 0', fontSize: '0.85rem' }}>
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Veri bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingPanel;

