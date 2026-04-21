import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function PortalRegister() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed]   = useState(false)

  function validate() {
    if (!form.name.trim())  { toast.error('El nombre es requerido'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Email inválido'); return false }
    if (form.password.length < 8) { toast.error('La contraseña debe tener mínimo 8 caracteres'); return false }
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return false }
    if (!agreed) { toast.error('Debes aceptar los términos'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, scope: 'public' })
      toast.success('¡Cuenta creada! Inicia sesión para continuar.')
      navigate('/portal/login')
    } catch (err) {
      const detail = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Error al registrar'
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^a-zA-Z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']

  return (
    <div className="portal-root min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="card-portal shadow-xl rounded-2xl">
          <div className="text-center mb-8">
            <Link to="/portal" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">SI</div>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Crear cuenta</h1>
            <p className="text-slate-500 text-sm mt-1">Acceso gratuito al catálogo de productos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label-light">Nombre completo *</label>
              <input className="input-light" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Pérez García" required autoComplete="name" />
            </div>
            <div>
              <label className="label-light">Correo electrónico *</label>
              <input className="input-light" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label-light">Contraseña *</label>
              <input className="input-light" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColors[pwStrength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{strengthLabels[pwStrength]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="label-light">Confirmar contraseña *</label>
              <input
                className={`input-light ${form.confirm && form.confirm !== form.password ? 'border-red-400 focus:ring-red-500' : ''}`}
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repite la contraseña"
                required
                autoComplete="new-password"
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span className="text-sm text-slate-600">
                Acepto los <a href="#" className="text-blue-600 hover:underline" onClick={e => e.preventDefault()}>Términos de Uso</a> y la <a href="#" className="text-blue-600 hover:underline" onClick={e => e.preventDefault()}>Política de Privacidad</a>
              </span>
            </label>

            <button type="submit" className="btn-portal w-full justify-center py-2.5 text-base rounded-xl" disabled={loading || !agreed}>
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Creando cuenta...</span> : 'Crear cuenta gratis'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 text-center">🔒 Tu información está protegida · Acceso solo de consulta</p>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            ¿Ya tienes cuenta? <Link to="/portal/login" className="text-blue-600 font-medium hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
