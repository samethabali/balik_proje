// frontend/src/api/api.js

// 1. TEK BİR ANA ADRES TANIMLIYORUZ
const BASE_URL = 'http://localhost:3000/api';

// --- HARİTA VE TEKNE FONKSİYONLARI (Zaten Çalışanlar) ---

export const fetchZones = async () => {
  const response = await fetch(`${BASE_URL}/zones`);
  if (!response.ok) throw new Error('Bölgeler çekilemedi');
  return response.json();
};

export const fetchHotspots = async () => {
  const response = await fetch(`${BASE_URL}/hotspots`);
  if (!response.ok) throw new Error('Hotspots çekilemedi');
  return response.json();
};

export const fetchActiveBoats = async () => {
  const response = await fetch(`${BASE_URL}/boats/active`);
  if (!response.ok) throw new Error('Aktif tekneler çekilemedi');
  return response.json();
};

export const fetchAvailableBoats = async () => {
  const response = await fetch(`${BASE_URL}/boats/available`);
  if (!response.ok) throw new Error('Müsait tekneler çekilemedi');
  return response.json();
};

export const createBoatRental = async (boatId, durationMinutes = 60) => {
  const response = await fetch(`${BASE_URL}/rentals/boat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boatId, durationMinutes }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Tekne kiralanamadı');
  }
  return response.json();
};

export const completeBoatRental = async (rentalId) => {
  const response = await fetch(`${BASE_URL}/rentals/${rentalId}/complete`, {
    method: 'POST',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Kiralama tamamlanamadı');
  }
  return response.json();
};

// --- FORUM FONKSİYONLARI (DÜZELTİLEN KISIM) ---
// Hata: Eski kodda 'request' fonksiyonu ve 'API_BASE' değişkeni yoktu.
// Düzeltme: Hepsini 'fetch' ve 'BASE_URL' yapısına çevirdim.

// 1. Tüm postları getir
export const fetchAllPosts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/forum/posts`);
    if (!response.ok) return []; 
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Forum postları çekilemedi:", error);
    return [];
  }
};

// 2. Belirli bir bölgenin postlarını getir
export const fetchZonePosts = async (zoneId) => {
  try {
    const response = await fetch(`${BASE_URL}/forum/zone/${zoneId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Zone ${zoneId} postları çekilemedi:`, error);
    return [];
  }
};

// 3. Yeni post oluştur
export const createPost = async (postData) => {
  const response = await fetch(`${BASE_URL}/forum/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  
  if (!response.ok) throw new Error('Post atılamadı');
  return response.json();
};

// 4. Yorumları getir
export const fetchComments = async (postId) => {
  const response = await fetch(`${BASE_URL}/forum/posts/${postId}/comments`);
  if (!response.ok) throw new Error('Yorumlar alınamadı');
  return response.json();
};