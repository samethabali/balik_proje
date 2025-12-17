// frontend/src/components/AccountingPanel.jsx
import React, { useState, useEffect } from 'react';
import { fetchMonthlyRevenue, fetchRevenueAnalysis } from '../api/api';
import toast from 'react-hot-toast';

const AccountingPanel = ({ onClose }) => {
  const currentDate = new Date();
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' veya 'analysis'
  const [analysisSubTab, setAnalysisSubTab] = useState('all'); // 'all', 'boat', 'equipment'
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [analysisYear, setAnalysisYear] = useState(currentDate.getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState(currentDate.getMonth() + 1);
  const [useDateFilter, setUseDateFilter] = useState(false); // Tarih filtresi kullanılsın mı?
  const [revenue, setRevenue] = useState(null);
  const [revenueAnalysis, setRevenueAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
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
      if (notify) toast.success('Muhasebe verileri güncellendi.');

    } catch (err) {
      const m = err.message || 'Kazanç bilgileri yüklenemedi';
      setError(m);
      setRevenue(null);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      loadRevenue();
    } else if (activeTab === 'analysis') {
      // Tarih filtresi kullanılmıyorsa tüm verileri yükle
      if (!useDateFilter) {
        loadRevenueAnalysis();
      }
    }
  }, [activeTab]);

  // Tarih filtresi veya yıl/ay değiştiğinde analizi yeniden yükle
  useEffect(() => {
    if (activeTab === 'analysis' && useDateFilter) {
      loadRevenueAnalysis();
    }
  }, [analysisYear, analysisMonth, useDateFilter]);

  // Analysis tab değiştiğinde subtab'ı sıfırla
  useEffect(() => {
    if (activeTab === 'analysis') {
      setAnalysisSubTab('all');
    }
  }, [activeTab]);

  const loadRevenueAnalysis = async () => {
    setAnalysisLoading(true);
    setError('');

    try {
      const params = useDateFilter ? { year: analysisYear, month: analysisMonth } : {};
      const data = await fetchRevenueAnalysis(params);
      setRevenueAnalysis(data);
    } catch (err) {
      setError(err.message || 'Gelir analizi yüklenemedi');
      setRevenueAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleShow = (e) => {
    e.preventDefault();
    loadRevenue({ notify: true });
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
    maxHeight: '90vh',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
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

        {/* Tab Butonları */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              ...buttonStyle,
              background: activeTab === 'monthly' ? '#00ffff' : '#333',
              color: activeTab === 'monthly' ? '#00111f' : '#fff',
              flex: 1
            }}
          >
            Aylık Kazanç
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            style={{
              ...buttonStyle,
              background: activeTab === 'analysis' ? '#00ffff' : '#333',
              color: activeTab === 'analysis' ? '#00111f' : '#fff',
              flex: 1
            }}
          >
            Gelir Analizi
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#fca5a5', flexShrink: 0 }}>
            {error}
          </div>
        )}

        {activeTab === 'monthly' && (
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
        )}

        <div
          className="accounting-panel-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            maxHeight: 'calc(90vh - 280px)',
            paddingRight: '12px',
            marginRight: '-12px',
            marginTop: '10px'
          }}
        >
          {activeTab === 'monthly' ? (
            <>
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
            </>
          ) : (
            <>
              {/* Tarih Filtresi */}
              <div style={{ marginBottom: '15px', flexShrink: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useDateFilter}
                    onChange={(e) => {
                      setUseDateFilter(e.target.checked);
                      if (e.target.checked) {
                        loadRevenueAnalysis();
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Tarih filtresi kullan</span>
                </label>
                {useDateFilter && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.85rem' }}>Yıl</label>
                      <select
                        value={analysisYear}
                        onChange={(e) => {
                          setAnalysisYear(parseInt(e.target.value, 10));
                        }}
                        onBlur={loadRevenueAnalysis}
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
                        value={analysisMonth}
                        onChange={(e) => {
                          setAnalysisMonth(parseInt(e.target.value, 10));
                        }}
                        onBlur={loadRevenueAnalysis}
                        style={inputStyle}
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Sub Tab Butonları */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexShrink: 0 }}>
                <button
                  onClick={() => setAnalysisSubTab('all')}
                  style={{
                    ...buttonStyle,
                    padding: '8px 16px',
                    background: analysisSubTab === 'all' ? '#00ffff' : '#333',
                    color: analysisSubTab === 'all' ? '#00111f' : '#fff',
                    flex: 1,
                    fontSize: '0.85rem'
                  }}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setAnalysisSubTab('boat')}
                  style={{
                    ...buttonStyle,
                    padding: '8px 16px',
                    background: analysisSubTab === 'boat' ? '#60a5fa' : '#333',
                    color: analysisSubTab === 'boat' ? '#00111f' : '#fff',
                    flex: 1,
                    fontSize: '0.85rem'
                  }}
                >
                  🛶 Tekne
                </button>
                <button
                  onClick={() => setAnalysisSubTab('equipment')}
                  style={{
                    ...buttonStyle,
                    padding: '8px 16px',
                    background: analysisSubTab === 'equipment' ? '#4ade80' : '#333',
                    color: analysisSubTab === 'equipment' ? '#00111f' : '#fff',
                    flex: 1,
                    fontSize: '0.85rem'
                  }}
                >
                  🎣 Ekipman
                </button>
              </div>

              {analysisLoading && !revenueAnalysis ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Yükleniyor...</p>
              ) : revenueAnalysis && revenueAnalysis.length > 0 ? (
                (() => {
                  // Filtreleme mantığı
                  let filteredData = revenueAnalysis;
                  if (analysisSubTab === 'boat') {
                    filteredData = revenueAnalysis.filter(item => item.rental_type === 'Boat');
                  } else if (analysisSubTab === 'equipment') {
                    filteredData = revenueAnalysis.filter(item => item.rental_type === 'Equipment');
                  }

                  if (filteredData.length === 0) {
                    return (
                      <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        {analysisSubTab === 'boat' ? 'Tekne' : analysisSubTab === 'equipment' ? 'Ekipman' : ''} gelir analizi verisi bulunamadı.
                      </p>
                    );
                  }

                  // Toplam hesapla
                  const totalRevenue = filteredData.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
                  const totalRentals = filteredData.reduce((sum, item) => sum + parseInt(item.rental_count || 0, 10), 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {/* Özet Bilgi */}
                      <div style={{
                        background: analysisSubTab === 'boat'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : analysisSubTab === 'equipment'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(0, 255, 255, 0.1)',
                        border: `2px solid ${analysisSubTab === 'boat'
                          ? 'rgba(59, 130, 246, 0.5)'
                          : analysisSubTab === 'equipment'
                            ? 'rgba(34, 197, 94, 0.5)'
                            : '#00ffff'}`,
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                      }}>
                        <h3 style={{
                          color: analysisSubTab === 'boat'
                            ? '#60a5fa'
                            : analysisSubTab === 'equipment'
                              ? '#4ade80'
                              : '#00ffff',
                          margin: '0 0 10px 0',
                          fontSize: '1rem'
                        }}>
                          {analysisSubTab === 'boat' ? '🛶 Tekne' : analysisSubTab === 'equipment' ? '🎣 Ekipman' : '💰'} Toplam
                        </h3>
                        <div style={{
                          color: analysisSubTab === 'boat'
                            ? '#60a5fa'
                            : analysisSubTab === 'equipment'
                              ? '#4ade80'
                              : '#00ffff',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          marginBottom: '5px'
                        }}>
                          {totalRevenue.toFixed(2)} ₺
                        </div>
                        <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                          Toplam {totalRentals} kiralama
                        </p>
                      </div>

                      {/* Detaylı Liste */}
                      {filteredData.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            background: item.rental_type === 'Boat'
                              ? 'rgba(59, 130, 246, 0.1)'
                              : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${item.rental_type === 'Boat'
                              ? 'rgba(59, 130, 246, 0.3)'
                              : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: '8px',
                            padding: '15px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <h4 style={{
                                color: item.rental_type === 'Boat' ? '#60a5fa' : '#4ade80',
                                margin: '0 0 5px 0',
                                fontSize: '0.95rem'
                              }}>
                                {item.rental_type === 'Boat' ? '🛶' : '🎣'} {item.item_name}
                              </h4>
                              <p style={{ color: '#aaa', margin: '2px 0', fontSize: '0.8rem' }}>
                                ID: {item.item_id}
                              </p>
                            </div>
                            <div style={{
                              color: item.rental_type === 'Boat' ? '#60a5fa' : '#4ade80',
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              textAlign: 'right'
                            }}>
                              {parseFloat(item.total_revenue || 0).toFixed(2)} ₺
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: '#ccc' }}>Kiralama Sayısı: </span>
                              <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.rental_count || 0}</span>
                            </div>
                            <div>
                              <span style={{ color: '#ccc' }}>Ort. Süre: </span>
                              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                {item.avg_rental_hours ? parseFloat(item.avg_rental_hours).toFixed(1) : '0'} saat
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#ccc' }}>Ort. Ödeme: </span>
                              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                {item.avg_payment ? parseFloat(item.avg_payment).toFixed(2) : '0'} ₺
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#ccc' }}>Toplam Gelir: </span>
                              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                {parseFloat(item.total_revenue || 0).toFixed(2)} ₺
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Gelir analizi verisi bulunamadı.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingPanel;

