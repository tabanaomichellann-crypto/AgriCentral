import axios from 'axios';

const PRIMARY_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const LOCAL_BASE_URL = 'http://localhost:5000/api';

const API = axios.create({ baseURL: PRIMARY_BASE_URL });
const LOCAL_API = axios.create({ baseURL: LOCAL_BASE_URL });

function attachInterceptors(client) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    response => response,
    (error) => {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

attachInterceptors(API);
attachInterceptors(LOCAL_API);

function shouldFallbackToLocal(error) {
  const status = error?.response?.status;
  const baseUrl = (API.defaults.baseURL || '').toLowerCase();
  return status === 404 && baseUrl.includes('onrender.com');
}

async function withLocalFallback(primaryRequest, localRequest) {
  try {
    return await primaryRequest();
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      return localRequest();
    }
    throw error;
  }
}

export const getLivestock = () =>
  withLocalFallback(
    () => API.get('/livestock'),
    () => LOCAL_API.get('/livestock')
  );

export const getLivestockById = (id) =>
  withLocalFallback(
    () => API.get(`/livestock/${id}`),
    () => LOCAL_API.get(`/livestock/${id}`)
  );

export const createLivestock = (payload) =>
  withLocalFallback(
    () => API.post('/livestock', payload),
    () => LOCAL_API.post('/livestock', payload)
  );

export const updateLivestock = (id, payload) =>
  withLocalFallback(
    () => API.put(`/livestock/${id}`, payload),
    () => LOCAL_API.put(`/livestock/${id}`, payload)
  );

export const deleteLivestock = (id) =>
  withLocalFallback(
    () => API.delete(`/livestock/${id}`),
    () => LOCAL_API.delete(`/livestock/${id}`)
  );

export const getLivestockRequests = () =>
  withLocalFallback(
    () => API.get('/livestock-requests'),
    () => LOCAL_API.get('/livestock-requests')
  );

export const getMyLivestockRequests = () =>
  withLocalFallback(
    () => API.get('/livestock-requests/my'),
    () => LOCAL_API.get('/livestock-requests/my')
  );

export const createLivestockRequest = (data) =>
  withLocalFallback(
    () => API.post('/livestock-requests', data),
    () => LOCAL_API.post('/livestock-requests', data)
  );

export const governorLivestockDecision = (requestId, data) =>
  withLocalFallback(
    () => API.patch(`/livestock-requests/${requestId}/governor-decision`, data),
    () => LOCAL_API.patch(`/livestock-requests/${requestId}/governor-decision`, data)
  );

export const headLivestockDecision = (requestId, data) =>
  withLocalFallback(
    () => API.patch(`/livestock-requests/${requestId}/head-decision`, data),
    () => LOCAL_API.patch(`/livestock-requests/${requestId}/head-decision`, data)
  );

export const getImageUrl = (imageId) =>
  imageId
    ? `${PRIMARY_BASE_URL}/images/${imageId}`
    : null;
