// frontend/src/api/api.js

const BASE_URL = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Yardımcı Fonksiyon: Hata Yakalama (En üstte tanımlı, her yerden erişilebilir)
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Bir hata oluştu');
  }
  return response.json();
};

// --- AUTH (KİMLİK DOĞRULAMA) ---
export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const registerUser = async (full_name, email, password, phone) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password, phone }),
  });
  return handleResponse(response);
};

export const fetchMe = async (token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : authHeaders();
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: headers,
  });
  return handleResponse(response);
};

export const fetchUserInfo = async (userId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// Kullanıcı istatistikleri
export const fetchUserStats = async (userId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}/stats`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// Tüm kullanıcı istatistikleri (Admin)
export const fetchAllUsersStats = async () => {
  const response = await fetch(`${BASE_URL}/users/stats/all`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// Aktif kullanıcılar listesi (Admin)
export const fetchActiveUsers = async () => {
  const response = await fetch(`${BASE_URL}/users/active`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// --- HARİTA VE BÖLGELER ---
export const fetchZones = async () => {
  const response = await fetch(`${BASE_URL}/zones`);
  return handleResponse(response);
};

// Bölge istatistikleri
export const fetchZoneStats = async (zoneId) => {
  const response = await fetch(`${BASE_URL}/zones/${zoneId}/stats`);
  return handleResponse(response);
};

// Tüm bölge istatistikleri
export const fetchAllZonesStats = async () => {
  const response = await fetch(`${BASE_URL}/zones/stats/all`);
  return handleResponse(response);
};

export const fetchHotspots = async () => {
  const response = await fetch(`${BASE_URL}/hotspots`);
  return handleResponse(response);
};

// --- TEKNELER (KULLANICI) ---
export const fetchActiveBoats = async () => {
  const response = await fetch(`${BASE_URL}/boats/active`);
  return handleResponse(response);
};

export const fetchAvailableBoats = async () => {
  const response = await fetch(`${BASE_URL}/boats/available`);
  return handleResponse(response);
};

// --- KİRALAMA İŞLEMLERİ ---
export const createBoatRental = async (boatId, durationMinutes = 60) => {
  const response = await fetch(`${BASE_URL}/rentals/boat`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ boatId, durationMinutes }),
  });
  return handleResponse(response);
};

export const completeBoatRental = async (rentalId) => {
  const response = await fetch(`${BASE_URL}/rentals/${rentalId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const fetchMyActiveBoatRentals = async () => {
  const response = await fetch(`${BASE_URL}/rentals/boat/my-active`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const createEquipmentRental = async (equipmentId, durationMinutes = 60) => {
  const response = await fetch(`${BASE_URL}/rentals/equipment`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ equipmentId, durationMinutes }),
  });
  return handleResponse(response);
};

export const completeEquipmentRental = async (rentalId) => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/${rentalId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const fetchMyActiveEquipment = async () => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/my-active`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const returnAllEquipment = async () => {
  const response = await fetch(`${BASE_URL}/rentals/equipment/return-all`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// --- EKİPMANLAR ---
export const fetchAvailableEquipment = async () => {
  const response = await fetch(`${BASE_URL}/equipments/available`);
  return handleResponse(response);
};

export const fetchEquipmentTypes = async () => {
  const response = await fetch(`${BASE_URL}/equipments/types`);
  return handleResponse(response);
};

// --- ADMIN İŞLEMLERİ ---
export const createBoat = async (data) => {
  const response = await fetch(`${BASE_URL}/boats`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateBoat = async (id, data) => {
  const response = await fetch(`${BASE_URL}/boats/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteBoat = async (id) => {
  const response = await fetch(`${BASE_URL}/boats/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const createEquipment = async (data) => {
  const response = await fetch(`${BASE_URL}/equipments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateEquipment = async (id, data) => {
  const response = await fetch(`${BASE_URL}/equipments/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteEquipment = async (id) => {
  const response = await fetch(`${BASE_URL}/equipments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const createActivity = async (data) => {
  const response = await fetch(`${BASE_URL}/activities`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateActivity = async (id, data) => {
  const response = await fetch(`${BASE_URL}/activities/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteActivity = async (id) => {
  const response = await fetch(`${BASE_URL}/activities/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// --- ADMIN RAPORLAMA ---
export const fetchAllRentals = async () => {
  const response = await fetch(`${BASE_URL}/rentals/admin/all`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const closeRental = async (rentalId, rentalType) => {
  const response = await fetch(`${BASE_URL}/rentals/admin/${rentalId}/close`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ rentalType }),
  });
  return handleResponse(response);
};

export const fetchCompletedRentals = async ({ userName, startDate, endDate, rentalType = 'all' }) => {
  const params = new URLSearchParams();
  if (userName) params.append('userName', userName);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (rentalType) params.append('rentalType', rentalType);

  const response = await fetch(`${BASE_URL}/rentals/admin/completed?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const fetchMonthlyRevenue = async ({ year, month }) => {
  const params = new URLSearchParams();
  params.append('year', year);
  params.append('month', month);

  const response = await fetch(`${BASE_URL}/rentals/admin/revenue?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// Gelir analizi (Admin)
export const fetchRevenueAnalysis = async ({ year, month } = {}) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  if (month) params.append('month', month);
  
  const url = `${BASE_URL}/rentals/admin/revenue-analysis${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// --- ETKİNLİKLER ---
export const fetchAllActivities = async () => {
  const response = await fetch(`${BASE_URL}/activities`);
  if (!response.ok) return { past: [], current: [], upcoming: [] };
  
  const activities = await response.json();
  const now = new Date();
  const past = [], current = [], upcoming = [];
  
  activities.forEach(activity => {
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);
    if (endDate < now) past.push(activity);
    else if (startDate <= now && endDate >= now) current.push(activity);
    else upcoming.push(activity);
  });
  
  return { past, current, upcoming };
};

export const fetchZoneActivities = async (zoneId) => {
  const response = await fetch(`${BASE_URL}/activities/zone/${zoneId}`);
  if (!response.ok) return { past: [], current: [], upcoming: [] };
  return handleResponse(response);
};

// Gelecek aktiviteler (bölgeye göre)
export const fetchUpcomingActivitiesByZone = async (zoneId) => {
  const response = await fetch(`${BASE_URL}/activities/zone/${zoneId}/upcoming`);
  if (!response.ok) return [];
  return handleResponse(response);
};

// --- FORUM ---
export const fetchAllPosts = async () => {
  const response = await fetch(`${BASE_URL}/forum/posts`, {
    headers: authHeaders() 
  });
  return handleResponse(response);
};

export const fetchZonePosts = async (zoneId) => {
  const response = await fetch(`${BASE_URL}/forum/zone/${zoneId}`, {
    headers: authHeaders()
  });

  return handleResponse(response);
};

export const fetchMyPosts = async () => {
  const response = await fetch(`${BASE_URL}/forum/posts/my-posts`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const createPost = async (data) => {
  const response = await fetch(`${BASE_URL}/forum/posts`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const fetchComments = async (postId) => {
  const response = await fetch(`${BASE_URL}/forum/posts/${postId}/comments`);
  return handleResponse(response);
};

export const createComment = async (postId, content) => {
  const response = await fetch(`${BASE_URL}/forum/posts/${postId}/comments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return handleResponse(response);
};

// 🔥 YENİ EKLENEN: Beğeni Fonksiyonu (handleResponse kullanarak)
export const togglePostLike = async (postId) => {
  const response = await fetch(`${BASE_URL}/forum/posts/${postId}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// Kullanıcı forum istatistikleri
export const fetchUserForumStats = async (userId) => {
  const response = await fetch(`${BASE_URL}/forum/user-stats/${userId}`);
  return handleResponse(response);
};

// Tüm kullanıcı forum istatistikleri (Admin)
export const fetchAllUsersForumStats = async () => {
  const response = await fetch(`${BASE_URL}/forum/user-stats/all`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
};