import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function IntranetLogin() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/intranet/dashboard'

  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [code2FA, setCode2FA] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Completa todos los campos'); return }
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Bienvenido, ${user.name}`)
      navigate(from, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) toast.error('Credenciales incorrectas')
      else if (status === 403) toast.error('Cuenta bloqueada. Contacta al administrador.')
      else toast.error('Error de conexión. Verifica que el servidor esté activo.')
    } finally {
      setLoading(false)
    }
  }

  // Demo login helper (DEV only – remove in production)
  function demoLogin(role) {
    const demos = {
      admin: { email: 'admin@empresa.com', password: 'admin1234' },
      operador: { email: 'operador@empresa.com', password: 'operador1234' },
    }
    setForm(demos[role])
  }

  return (
    <div className="intranet-root min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="card shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-blue-900/50">SI</div>
            <h1 className="text-2xl font-bold text-slate-100">SistemaInventario</h1>
            <p className="text-slate-400 text-sm mt-1">Acceso a la Intranet · Solo personal autorizado</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Correo electrónico</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.com"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Iniciando sesión...</span>
              ) : '🔐 Iniciar Sesión'}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              🔒 Conexión segura · JWT + cookies HttpOnly · Sesión cifrada
            </p>
          </div>

          {/* Demo helpers */}
          <div className="mt-6 border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-500 text-center mb-3">Demo rápido (desarrollo)</p>
            <div className="flex gap-2">
              <button onClick={() => demoLogin('admin')} className="btn-outline flex-1 text-xs py-1.5">⚡ Admin</button>
              <button onClick={() => demoLogin('operador')} className="btn-outline flex-1 text-xs py-1.5">👤 Operador</button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/portal" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Ir al Portal de Ventas público
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
