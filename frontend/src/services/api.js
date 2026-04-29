import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('civiclens_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — only auto-redirect if NOT on a login page
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/admin/login';
      if (!isLoginPage) {
        localStorage.removeItem('civiclens_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin-login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) =>
    API.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => API.put('/auth/change-password', data),
  deleteAccount: () => API.delete('/auth/account'),
};

// Issues
export const issueAPI = {
  getAll: (params) => API.get('/issues', { params }),
  getOne: (id) => API.get(`/issues/${id}`),
  getStats: () => API.get('/issues/stats'),
  getMyIssues: (params) => API.get('/issues/my-issues', { params }),
  create: (data) => API.post('/issues', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/issues/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  upvote: (id) => API.post(`/issues/${id}/upvote`),
};

// Admin
export const adminAPI = {
  getIssues: (params) => API.get('/admin/issues', { params }),
  getIssue: (id) => API.get(`/admin/issues/${id}`),
  updateIssue: (id, data) => API.put(`/admin/issues/${id}`, data),
  deleteIssue: (id) => API.delete(`/admin/issues/${id}`),
  getUsers: () => API.get('/admin/users'),
  // Superadmin: admin account management
  getAdmins: () => API.get('/admin/admins'),
  createAdmin: (data) => API.post('/admin/admins', data),
  updateAdmin: (id, data) => API.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => API.delete(`/admin/admins/${id}`),
};

// Alerts
export const alertAPI = {
  getAll: () => API.get('/alerts'),
  add: (data) => API.post('/alerts', data),
  toggle: (id) => API.put(`/alerts/${id}/toggle`),
  remove: (id) => API.delete(`/alerts/${id}`),
  updatePreferences: (data) => API.put('/alerts/preferences', data),
};

// Upload — local file storage (no Cloudinary needed)
export const uploadAPI = {
  avatar: (data) =>
    API.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default API;
