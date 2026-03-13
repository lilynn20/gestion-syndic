import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
};

// Propriétaires
export const proprietaireService = {
  getAll: (params) => api.get('/proprietaires', { params }),
  getOne: (id) => api.get(`/proprietaires/${id}`),
  create: (data) => api.post('/proprietaires', data),
  update: (id, data) => api.put(`/proprietaires/${id}`, data),
  delete: (id) => api.delete(`/proprietaires/${id}`),
  getPaiements: (id) => api.get(`/proprietaires/${id}/paiements`),
};

// Biens
export const bienService = {
  getAll: (params) => api.get('/biens', { params }),
  getOne: (id) => api.get(`/biens/${id}`),
  create: (data) => api.post('/biens', data),
  update: (id, data) => api.put(`/biens/${id}`, data),
  delete: (id) => api.delete(`/biens/${id}`),
  getPaiements: (id, params) => api.get(`/biens/${id}/paiements`, { params }),
  getStatutPaiements: (id, params) => api.get(`/biens/${id}/statut-paiements`, { params }),
};

// Paiements
export const paiementService = {
  getAll: (params) => api.get('/paiements', { params }),
  getOne: (id) => api.get(`/paiements/${id}`),
  create: (data) => api.post('/paiements', data),
  createMultiple: (data) => api.post('/paiements/multiple', data),
  update: (id, data) => api.put(`/paiements/${id}`, data),
  delete: (id) => api.delete(`/paiements/${id}`),
  getStatistiques: (params) => api.get('/paiements-statistiques', { params }),
  exportExcel: (params) => api.get('/paiements-export', { params, responseType: 'blob' }),
};

// Frais
export const fraisService = {
  getAll: (params) => api.get('/frais', { params }),
  getOne: (id) => api.get(`/frais/${id}`),
  create: (data) => api.post('/frais', data),
  update: (id, data) => api.put(`/frais/${id}`, data),
  delete: (id) => api.delete(`/frais/${id}`),
  getUnpaidGlobal: (bienId) => api.get('/frais-global-unpaid', { params: { bien_id: bienId } }),
  getUnpaidForBien: (bienId) => api.get('/frais-unpaid-for-bien', { params: { bien_id: bienId } }),
  exportExcel: () => api.get('/frais-export', { responseType: 'blob' }),
};

// Dépenses
export const depenseService = {
  getAll: (params) => api.get('/depenses', { params }),
  getOne: (id) => api.get(`/depenses/${id}`),
  create: (data) => api.post('/depenses', data),
  update: (id, data) => api.put(`/depenses/${id}`, data),
  delete: (id) => api.delete(`/depenses/${id}`),
  getStatistiques: (params) => api.get('/depenses-statistiques', { params }),
  getCategories: () => api.get('/depenses-categories'),
  exportExcel: (params) => api.get('/depenses-export', { params, responseType: 'blob' }),
};

// Reçus
export const recuService = {
  getAll: (params) => api.get('/recus', { params }),
  getOne: (id) => api.get(`/recus/${id}`),
  download: (id) => api.get(`/recus/${id}/download`, { responseType: 'blob' }),
  regenerate: (paiementId) => api.post(`/recus/regenerate/${paiementId}`),
};

// Dashboard
export const dashboardService = {
  getStats: (params) => api.get('/dashboard', { params }),
  getTableauPaiements: (params) => api.get('/dashboard/tableau-paiements', { params }),
  getEvolution: (params) => api.get('/dashboard/evolution', { params }),
};

// Notifications
export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  generateOverdue: () => api.post('/notifications/generate-overdue'),
};

// Search
export const searchService = {
  search: (query) => api.get('/search', { params: { q: query } }),
};

// Settings
export const settingsService = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  get: (key) => api.get(`/settings/${key}`),
};

export default api;
