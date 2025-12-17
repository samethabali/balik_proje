// Zone styling logic

export const getZoneStyle = (feature) => {
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

