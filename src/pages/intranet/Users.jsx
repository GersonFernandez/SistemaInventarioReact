import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { userService } from '../../services'
import { LoadingScreen, EmptyState, ConfirmDialog, Pagination, StatusBadge } from '../../components/ui/Shared'

const EMPTY_FORM = { name: '', email: '', role: 'operador', scope: 'internal', is_active: true, password: '' }
const ROLES = ['admin', 'operador', 'viewer']

export default function Users() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotal]  = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [scopeFilter, setScopeFilter] = useState('all')

  async function load(pg = 1) {
    setLoading(true)
    try {
      const params = { page: pg, search, page_size: 10 }
      if (scopeFilter !== 'all') params.scope = scopeFilter
      const { data } = await userService.list(params)
      setUsers(data.results || data)
      setTotal(Math.ceil((data.count || (data.results || data).length) / 10))
    } catch {
      setUsers(DEMO_USERS)
      setTotal(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page, scopeFilter])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(u)  { setEditing(u); setForm({ ...u, password: '' }); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nombre requerido'); return }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Email inválido'); return }
    if (!editing && form.password.length < 8) { toast.error('Contraseña mínima 8 caracteres'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editing && !payload.password) delete payload.password
      if (editing) {
        const { data } = await userService.update(editing.id, payload)
        setUsers(prev => prev.map(u => u.id === editing.id ? data : u))
        toast.success('Usuario actualizado')
      } else {
        const { data } = await userService.create(payload)
        setUsers(prev => [data, ...prev])
        toast.success('Usuario creado')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al guardar usuario')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u) {
    try {
      await userService.setActive(u.id, !u.is_active)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
      toast.success(u.is_active ? 'Usuario bloqueado' : 'Usuario desbloqueado')
    } catch {
      toast.error('No se pudo cambiar el estado')
    }
  }

  async function confirmDelete() {
    try {
      await userService.remove(deleteId)
      setUsers(prev => prev.filter(u => u.id !== deleteId))
      toast.success('Usuario eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Administración de usuarios internos y públicos con roles y permisos</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>➕ Nuevo Usuario</button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input flex-1" placeholder="Buscar por nombre o email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <select className="input w-auto" value={scopeFilter} onChange={e => { setScopeFilter(e.target.value); setPage(1) }}>
            <option value="all">Todos los tipos</option>
            <option value="internal">Internos</option>
            <option value="public">Públicos</option>
          </select>
          <button className="btn-secondary" onClick={() => load(1)}>🔍 Buscar</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total', value: users.length, cls: 'badge-blue' },
          { label: 'Activos', value: users.filter(u => u.is_active).length, cls: 'badge-green' },
          { label: 'Bloqueados', value: users.filter(u => !u.is_active).length, cls: 'badge-red' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, cls: 'badge-yellow' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No hay usuarios" description="Crea el primer usuario del sistema." action={<button className="btn-primary mt-2" onClick={openCreate}>Crear usuario</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200">{u.name}</span>
                    </div>
                  </td>
                  <td><span className="text-blue-400 text-sm">{u.email}</span></td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'operador' ? 'badge-green' : 'badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.scope === 'internal' ? 'badge-yellow' : 'badge-gray'}`}>
                      {u.scope === 'internal' ? 'Interno' : 'Público'}
                    </span>
                  </td>
                  <td><StatusBadge active={u.is_active} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm" onClick={() => openEdit(u)}>✏️</button>
                      <button
                        className={`text-sm ${u.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Bloquear' : 'Desbloquear'}
                      >{u.is_active ? '🔒' : '🔓'}</button>
                      <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => setDeleteId(u.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nombre completo *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Juan Pérez García" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Email *</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="usuario@empresa.com" />
                  </div>
                  <div>
                    <label className="label">Rol</label>
                    <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tipo de acceso</label>
                    <select className="input" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}>
                      <option value="internal">Interno</option>
                      <option value="public">Público (solo lectura)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required={!editing}
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select className="input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                      <option value="true">Activo</option>
                      <option value="false">Bloqueado</option>
                    </select>
                  </div>
                </div>
                {form.scope === 'internal' && (
                  <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-sm text-amber-300 mt-2">
                    ⚠️ Los usuarios internos deben usar autenticación fuerte. Se recomienda activar 2FA desde el panel de administración del backend.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? '⏳ Guardando...' : editing ? '💾 Actualizar' : '➕ Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={Boolean(deleteId)} title="Eliminar usuario" message="¿Eliminar permanentemente este usuario? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} danger />
    </div>
  )
}

const DEMO_USERS = [
  { id: 1, name: 'Admin Principal', email: 'admin@empresa.com', role: 'admin', scope: 'internal', is_active: true },
  { id: 2, name: 'Operador Almacén', email: 'operador@empresa.com', role: 'operador', scope: 'internal', is_active: true },
  { id: 3, name: 'Vista Solo Lectura', email: 'viewer@empresa.com', role: 'viewer', scope: 'internal', is_active: true },
  { id: 4, name: 'Cliente Juan Pérez', email: 'juan@gmail.com', role: 'viewer', scope: 'public', is_active: true },
  { id: 5, name: 'Usuario Bloqueado', email: 'blocked@gmail.com', role: 'viewer', scope: 'public', is_active: false },
]
