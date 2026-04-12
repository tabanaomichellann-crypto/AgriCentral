import axios from 'axios';

const viteApiUrl = (() => {
  try {
    return import.meta.env.VITE_API_URL;
  } catch {
    return undefined;
  }
})();

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || viteApiUrl || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getLivestock = () => API.get('/livestock');
export const getLivestockById = (id) => API.get(`/livestock/${id}`);
export const createLivestock = (payload) => API.post('/livestock', payload);
export const updateLivestock = (id, payload) => API.put(`/livestock/${id}`, payload);
export const deleteLivestock = (id) => API.delete(`/livestock/${id}`);

export const getLivestockRequests = () => API.get('/livestock-requests');
export const getMyLivestockRequests = () => API.get('/livestock-requests/my');
export const createLivestockRequest = (data) => API.post('/livestock-requests', data);
export const governorLivestockDecision = (requestId, data) => API.patch(`/livestock-requests/${requestId}/governor-decision`, data);
export const headLivestockDecision = (requestId, data) => API.patch(`/livestock-requests/${requestId}/head-decision`, data);

export const getImageUrl = (imageId) =>
  imageId
    ? `${process.env.REACT_APP_API_BASE_URL || viteApiUrl || 'http://localhost:5000/api'}/images/${imageId}`
    : null;
