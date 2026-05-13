// utils/api.js
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

/* ── Auth token injection ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Token ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

/* ── Response interceptor
     1. Auto-unwrap DRF pagination  → response.data is always a plain array
     2. 401 → redirect to login
── */
api.interceptors.response.use(
  (response) => {
    // Unwrap paginated responses: { count, next, previous, results: [...] }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'results' in response.data &&
      Array.isArray(response.data.results)
    ) {
      response.data = response.data.results
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/* ── Auth ── */
export const authAPI = {
  login:    (credentials) => api.post('/auth/login/',    credentials),
  register: (userData)    => api.post('/auth/register/', userData),
  logout:   ()            => api.post('/auth/logout/'),
}

/* ── Users ── */
export const userAPI = {
  getProfile:     ()     => api.get('/users/profile/'),
  updateProfile:  (data) => api.put('/users/profile/', data),
  changePassword: (data) => api.post('/users/change_password/', data),
}

/* ── Customers ── */
export const customerAPI = {
  getAll:       ()                           => api.get('/customers/'),
  getById:      (id)                         => api.get(`/customers/${id}/`),
  create:       (data)                       => api.post('/customers/', data),
  update:       (id, data)                   => api.put(`/customers/${id}/`, data),
  delete:       (id)                         => api.delete(`/customers/${id}/`),
  deposit:      (id, amount, description)    => api.post(`/customers/${id}/deposit/`,  { amount, description }),
  withdraw:     (id, amount, description)    => api.post(`/customers/${id}/withdraw/`, { amount, description }),
  getTransactions: (id)                      => api.get(`/customers/${id}/transactions/`),
}

/* ── Transactions ── */
export const transactionAPI = {
  getAll: () => api.get('/transactions/'),
}

/* ── Settings ── */
export const settingsAPI = {
  getSettings:    ()     => api.get('/settings/account_settings/'),
  updateSettings: (data) => api.put('/settings/account_settings/', data),
}

export default api