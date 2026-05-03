import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const OAUTH_TOKEN_URL = import.meta.env.VITE_OAUTH_TOKEN_URL || '/api/v1/oauth/token/'
const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || ''

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
})

// --- Request interceptor: attach token and set Content-Type if not FormData ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    // Set JSON content type only when body is NOT FormData (multipart handles its own boundary)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => Promise.reject(error)
)

// --- Response interceptor: handle 401 / token refresh ---
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      const authProvider = localStorage.getItem('auth_provider') || 'jwt'
      if (!refreshToken) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        let newAccess
        if (authProvider === 'oauth') {
          const formData = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: OAUTH_CLIENT_ID,
          })
          const { data } = await axios.post(OAUTH_TOKEN_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          newAccess = data.access_token
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
        } else {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh: refreshToken,
          })
          newAccess = data.access
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh)
          }
        }
        localStorage.setItem('access_token', newAccess)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
