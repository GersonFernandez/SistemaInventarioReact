import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Protects Intranet routes.
 * Redirects to /login if not authenticated.
 * Optionally restricts to specific roles.
 */
export function RequireAuth({ children, roles }) {
  const { isAuthenticated, hasRole, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="intranet-root flex items-center justify-center"><Spinner /></div>
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/intranet/dashboard" replace />

  return children
}

/**
 * Protects Portal routes – only registered public users.
 */
export function RequirePublicAuth({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!isAuthenticated || user?.scope !== 'public') {
    return <Navigate to="/portal/login" state={{ from: location }} replace />
  }
  return children
}

/**
 * Redirect already-authenticated users away from login pages.
 */
export function RedirectIfAuth({ children, to = '/intranet/dashboard' }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to={to} replace />
  return children
}

function Spinner() {
  return (
    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
  )
}
