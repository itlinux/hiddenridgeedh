import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hr_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  changePassword: (data: any) => api.put('/api/auth/change-password', data),
  setup2FA: () => api.post('/api/auth/2fa/setup'),
  enable2FA: (code: string) => api.post('/api/auth/2fa/enable', { code }),
  verify2FA: (temp_token: string, code: string) => api.post('/api/auth/2fa/verify', { temp_token, code }),
  disable2FA: (password: string) => api.post('/api/auth/2fa/disable', { password }),
};

// ─── Posts ────────────────────────────────────────────────────────────────────
export const postsApi = {
  list: (params?: any) => api.get('/api/posts/public', { params }),
  listAdmin: (params?: any) => api.get('/api/posts', { params }),
  get: (slug: string) => api.get(`/api/posts/${slug}`),
  create: (data: any) => api.post('/api/posts', data),
  update: (id: string, data: any) => api.put(`/api/posts/${id}`, data),
  delete: (id: string) => api.delete(`/api/posts/${id}`),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: any) => api.get('/api/events', { params }),
  get: (id: string) => api.get(`/api/events/${id}`),
  create: (data: any) => api.post('/api/events', data),
  update: (id: string, data: any) => api.put(`/api/events/${id}`, data),
  rsvp: (id: string) => api.post(`/api/events/${id}/rsvp`),
  delete: (id: string) => api.delete(`/api/events/${id}`),
};

// ─── Forum ────────────────────────────────────────────────────────────────────
export const forumApi = {
  listThreads: (params?: any) => api.get('/api/forum/threads', { params }),
  getThread: (id: string) => api.get(`/api/forum/threads/${id}`),
  createThread: (data: any) => api.post('/api/forum/threads', data),
  updateThread: (id: string, data: any) => api.put(`/api/forum/threads/${id}`, data),
  deleteThread: (id: string) => api.delete(`/api/forum/threads/${id}`),
  listReplies: (threadId: string, params?: any) => api.get(`/api/forum/threads/${threadId}/replies`, { params }),
  createReply: (threadId: string, data: any) => api.post(`/api/forum/threads/${threadId}/replies`, data),
  deleteReply: (id: string) => api.delete(`/api/forum/replies/${id}`),
};

// ─── Gallery ──────────────────────────────────────────────────────────────────
export const galleryApi = {
  list: (params?: any) => api.get('/api/gallery', { params }),
  upload: (formData: FormData) => api.post('/api/gallery/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/api/gallery/${id}`),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (data: any) => api.post('/api/newsletter/subscribe', data),
  listSubscribers: () => api.get('/api/newsletter/subscribers'),
  send: (data: any) => api.post('/api/newsletter/send', data),
  deleteSubscriber: (id: string) => api.delete(`/api/newsletter/subscribers/${id}`),
};

// ─── Members ──────────────────────────────────────────────────────────────────
export const membersApi = {
  list: (params?: any) => api.get('/api/members', { params }),
  pending: () => api.get('/api/members/pending'),
  get: (id: string) => api.get(`/api/members/${id}`),
  updateMe: (data: any) => api.put('/api/members/me', data),
  approve: (id: string) => api.put(`/api/members/${id}/approve`),
  updateRole: (id: string, data: any) => api.put(`/api/members/${id}/role`, data),
  deactivate: (id: string) => api.put(`/api/members/${id}/deactivate`),
  delete: (id: string) => api.delete(`/api/members/${id}`),
};
