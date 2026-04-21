import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import { buildOAuthAuthorizationUrl } from '../../services/oauth'

export default function PortalLogin() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/portal/catalog'
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ ...form, scope: 'public' })
      toast.success('¡Bienvenido!')
      navigate(from, { replace: true })
    } catch (err) {
      const s = err?.response?.status
      if (s === 401) toast.error('Credenciales incorrectas')
      else if (s === 403) toast.error('Cuenta bloqueada. Contacta soporte.')
      else toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthLogin() {
    try {
      setOauthLoading(true)
      const url = await buildOAuthAuthorizationUrl()
      window.location.href = url
    } catch (err) {
      toast.error(err?.message || 'No se pudo iniciar OAuth2')
      setOauthLoading(false)
    }
  }

  return (
    <div className="portal-root min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-portal shadow-xl rounded-2xl">
          <div className="text-center mb-8">
            <Link to="/portal" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">SI</div>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Iniciar sesión</h1>
            <p className="text-slate-500 text-sm mt-1">Accede al catálogo completo de productos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label-light">Correo electrónico</label>
              <input className="input-light" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" required autoComplete="username" />
            </div>
            <div>
              <label className="label-light">Contraseña</label>
              <input className="input-light" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-portal w-full justify-center py-2.5 text-base rounded-xl" disabled={loading}>
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Entrando...</span> : 'Iniciar sesión'}
            </button>
          </form>

          {/* OAuth2 real (Authorization Code + PKCE) */}
          <div className="mt-4">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-xs text-slate-400">o continúa con</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>
            <div className="mt-3">
              <button
                type="button"
                disabled={oauthLoading}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                onClick={handleOAuthLogin}
              >
                {oauthLoading ? 'Redirigiendo...' : 'Iniciar con OAuth2 (PKCE)'}
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes cuenta? <Link to="/portal/register" className="text-blue-600 font-medium hover:underline">Regístrate gratis</Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-2">
            <Link to="/login" className="hover:text-slate-600">¿Eres personal interno? Acceso Intranet →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
