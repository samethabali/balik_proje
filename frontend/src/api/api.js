// frontend/src/api/api.js

const BASE_URL = 'http://localhost:3000/api';

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