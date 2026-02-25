import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
  timeout: 15000,
})

// Response interceptor – normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove stale token and reload to trigger redirect
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Project helpers ───────────────────────────────────────────────────────

export const projectsApi = {
  list:         (params)        => api.get('/projects', { params }),
  get:          (id)            => api.get(`/projects/${id}`),
  create:       (data)          => api.post('/projects', data),
  update:       (id, data)      => api.put(`/projects/${id}`, data),
  remove:       (id)            => api.delete(`/projects/${id}`),
  addMember:    (id, email)     => api.post(`/projects/${id}/members`, { email }),
  removeMember: (id, memberId)  => api.delete(`/projects/${id}/members/${memberId}`),
}

// ─── Task helpers ──────────────────────────────────────────────────────────

export const tasksApi = {
  list:         (projectId, params)       => api.get(`/projects/${projectId}/tasks`, { params }),
  kanban:       (projectId)               => api.get(`/projects/${projectId}/tasks/kanban`),
  get:          (id)                      => api.get(`/tasks/${id}`),
  create:       (projectId, data)         => api.post(`/projects/${projectId}/tasks`, data),
  update:       (id, data)                => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status, position)    => api.patch(`/tasks/${id}/status`, { status, position }),
  remove:       (id)                      => api.delete(`/tasks/${id}`),
}

// ─── User helpers ──────────────────────────────────────────────────────────

export const usersApi = {
  me:     ()         => api.get('/users/me'),
  update: (data)     => api.put('/users/me', data),
  search: (q, limit) => api.get('/users/search', { params: { q, limit } }),
}
