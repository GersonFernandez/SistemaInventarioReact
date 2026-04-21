import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { authService } from '../services'
import { exchangeOAuthCodeForToken, revokeOAuthToken } from '../services/oauth'

const AuthContext = createContext(null)

/**
 * Decode JWT payload (no verification – verification is server-side).
 * Never trust client-decoded data for authorization decisions.
 */
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return true
  return payload.exp * 1000 < Date.now()
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)   // { id, name, email, role, scope }
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser  = localStorage.getItem('user')
    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    } else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    // POST /api/v1/auth/login  →  { access, refresh, user }
    const { data } = await api.post('/auth/login', credentials)
    const { access, refresh, user: userData } = data
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('auth_provider', 'jwt')
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`
    setToken(access)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (payload) => {
    // POST /api/v1/auth/register
    const { data } = await api.post('/auth/register', payload)
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    const authProvider = localStorage.getItem('auth_provider') || 'jwt'

    if (refreshToken) {
      try {
        if (authProvider === 'oauth') {
          await revokeOAuthToken(refreshToken, 'refresh_token')
        } else {
          await authService.logout(refreshToken)
        }
      } catch {
        // Best-effort revocation; local session is always cleared.
      }
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_provider')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const loginWithOAuth = useCallback(async (code, verifier) => {
    const data = await exchangeOAuthCodeForToken(code, verifier)
    const { access, refresh, user: userData } = data
    localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    else localStorage.removeItem('refresh_token')
    localStorage.setItem('auth_provider', 'oauth')
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`
    setToken(access)
    setUser(userData)
    return userData
  }, [])

  /** Check if current user has a given role or one from a list */
  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role)
  }, [user])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, loginWithOAuth, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
