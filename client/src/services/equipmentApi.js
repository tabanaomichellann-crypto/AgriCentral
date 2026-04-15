// services/equipmentApi.js
// All equipment-related API calls. Import and merge into your existing services/api.js

import axios from 'axios';
import { getApiBaseUrl } from './baseUrl';

const API = axios.create({ baseURL: getApiBaseUrl() });

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getEquipment = () => API.get('/equipment');
export const getEquipmentById = (id) => API.get(`/equipment/${id}`);
export const createEquipment = (payload) => API.post('/equipment', payload);
export const updateEquipment = (id, payload) => API.put(`/equipment/${id}`, payload);
export const deleteEquipment = (id) => API.delete(`/equipment/${id}`);

export const getEquipmentRequests = () => API.get('/equipment-requests');
export const getMyEquipmentRequests = () => API.get('/equipment-requests/my');
export const createEquipmentRequest = (data) => API.post('/equipment-requests', data);
export const governorDecision = (requestId, data) =>
  API.patch(`/equipment-requests/${requestId}/governor-decision`, data);
export const headDecision = (requestId, data) =>
  API.patch(`/equipment-requests/${requestId}/head-decision`, data);

export const getConditionLogs = () => API.get('/equipment-condition-logs');
export const createConditionLog = (data) =>
  API.post('/equipment-condition-logs', data);
export const validateConditionLog = (logId) =>
  API.patch(`/equipment-condition-logs/${logId}/validate`);

export const getImageUrl = (imageId) =>
  imageId
    ? `${getApiBaseUrl()}/images/${imageId}`
    : null;
