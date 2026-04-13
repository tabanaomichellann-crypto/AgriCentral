import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
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

api.interceptors.response.use(
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

// Auth
export const loginUser = (data) => api.post('/auth/login', data);

// User Management (Admin only)
export const getUsers         = ()       => api.get('/users');
export const getUserStats     = ()       => api.get('/users/stats');
export const createUser       = (data)   => api.post('/users', data);
export const updateUser       = (id, data) => api.put(`/users/${id}`, data);
export const updateUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
export const resetUserPassword= (id, password) => api.patch(`/users/${id}/reset-password`, { newPassword: password });
export const deleteUser       = (id)     => api.delete(`/users/${id}`);

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

// Equipment
export const getEquipment    = ()       => api.get('/equipment');
export const createEquipment = (data)   => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id)     => api.delete(`/equipment/${id}`);

// Crops
export const getCrops        = ()       => api.get('/crops');
export const seedCrops       = ()       => api.post('/seed-crops');
export const createCrop      = (data)   => api.post('/crops', data);
export const updateCrop      = (id, data) => api.put(`/crops/${id}`, data);
export const deleteCrop      = (id)     => api.delete(`/crops/${id}`);

// Farmer-Crop Relationships
export const getFarmerCrops         = ()       => api.get('/farmer-crops');
export const getFarmersByCrop       = (cropId) => api.get(`/farmer-crops/crop/${cropId}`);
export const getCropsByFarmer       = (farmerId) => api.get(`/farmer-crops/farmer/${farmerId}`);
export const assignCropToFarmer     = (data)   => api.post('/farmer-crops', data);
export const updateFarmerCrop       = (id, data) => api.put(`/farmer-crops/${id}`, data);
export const removeCropFromFarmer   = (id)     => api.delete(`/farmer-crops/${id}`);

// Crop Damage Monitoring
export const getCropDamages         = ()       => api.get('/crop-damages');
export const getCropDamageStats     = ()       => api.get('/crop-damages/stats');
export const getDamagesByFarmer     = (farmerId) => api.get(`/crop-damages/farmer/${farmerId}`);
export const getDamagesByCrop       = (cropId) => api.get(`/crop-damages/crop/${cropId}`);
export const getDamagesByStatus     = (status) => api.get(`/crop-damages/status/${status}`);
export const reportCropDamage       = (data)   => api.post('/crop-damages', data);
export const updateCropDamage       = (id, data) => api.put(`/crop-damages/${id}`, data);
export const deleteCropDamage       = (id)     => api.delete(`/crop-damages/${id}`);