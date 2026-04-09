import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const loginUser = (data) => api.post('/auth/login', data);

// User Management (Admin only)
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Coordinator
export const getFarmers        = ()           => api.get('/farmers');
export const createFarmer      = (data)       => api.post('/farmers', data);
export const deleteFarmer      = (id)         => api.delete(`/farmers/${id}`);

export const getAssociations   = ()           => api.get('/associations');
export const createAssociation = (data)       => api.post('/associations', data);
export const deleteAssociation = (id)         => api.delete(`/associations/${id}`);

export const getMembers        = (assocId)    => api.get(`/associations/${assocId}/members`);
export const addMember         = (assocId, data) => api.post(`/associations/${assocId}/members`, data);
export const removeMember      = (assocId, memberId) => api.delete(`/associations/${assocId}/members/${memberId}`);

export const getFARUsers       = ()           => api.get('/far-users');

// Equipment
export const getEquipment    = (type)   => api.get(`/equipment?type=${type}`);
export const createEquipment = (data)   => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id)     => api.delete(`/equipment/${id}`);