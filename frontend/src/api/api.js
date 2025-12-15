// frontend/src/api/api.js

// 1. TEK BİR ANA ADRES TANIMLIYORUZ
const BASE_URL = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Kiralama tamamlanamadı');
  }
  return response.json();
};

// --- EKİPMAN KİRALAMA FONKSİYONLARI ---

export const fetchAvailableEquipment = async () => {
  const response = await fetch(`${BASE_URL}/equipments/available`);
  if (!response.ok) throw new Error('Müsait ekipmanlar çekilemedi');
  return response.json();
};

export const createEquipmentRental = async (equipmentId, durationMinutes = 60) => {
  const response = await fetch(`${BASE_URL}/rentals/equipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ equipmentId, durationMinutes }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Ekipman kiralanamadı');
  }
  return response.json();
};

export const completeEquipmentRental = async (rentalId) => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/${rentalId}/complete`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Kiralama tamamlanamadı');
  }
  return response.json();
};

export const returnAllEquipment = async () => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/return-all`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Toplu iade işlemi başarısız');
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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(postData), // user_id yok!
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

// 5. Yorum Yap
export const createComment = async (postId, content) => {
  const response = await fetch(`${BASE_URL}/forum/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }), // user_id yok!
  });

  if (!response.ok) throw new Error('Yorum yapılamadı');
  return response.json();
};

export const fetchMyActiveEquipment = async () => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/my-active`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Kiralamalarım çekilemedi');
  return response.json();
};

// --- KULLANICI VE HESAP FONKSİYONLARI ---

// Kullanıcı bilgilerini getir
export const fetchUserInfo = async (userId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: { ...authHeaders() },
  });

  if (!response.ok) throw new Error('Kullanıcı bilgileri alınamadı');
  return response.json();
};

// Kullanıcının aktif tekne kiralamalarını getir, burası aklımda
export const fetchMyActiveBoatRentals = async () => {
  const response = await fetch(`${BASE_URL}/rentals/boat/my-active`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Tekne kiralamaları alınamadı');
  return response.json();
};

// Kullanıcının kendi postlarını getir
export const fetchMyPosts = async () => {
  const response = await fetch(`${BASE_URL}/forum/posts/my-posts`, {
    headers: { ...authHeaders() },
  });

  if (!response.ok) throw new Error('Postlar alınamadı');
  return response.json();
};

// --- ETKİNLİKLER FONKSİYONLARI ---

// Bölgeye göre etkinlikleri getir
export const fetchZoneActivities = async (zoneId) => {
  try {
    const response = await fetch(`${BASE_URL}/activities/zone/${zoneId}`);
    if (!response.ok) return { past: [], current: [], upcoming: [] };
    return response.json();
  } catch (error) {
    console.warn(`Zone ${zoneId} etkinlikleri çekilemedi:`, error);
    return { past: [], current: [], upcoming: [] };
  }
};

// auth ve login işlemleri için.
export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(data?.error || 'Giriş başarısız');
  return data; // { user, token }
};

export const registerUser = async (full_name, email, password, phone) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password, phone }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Kayıt başarısız');
  return data; // { user, token }
};

export const fetchMe = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Me alınamadı');
  return data; // user
};
