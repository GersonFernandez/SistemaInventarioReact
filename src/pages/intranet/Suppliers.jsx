import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supplierService } from '../../services'
import { LoadingScreen, EmptyState, ConfirmDialog, Pagination, StatusBadge } from '../../components/ui/Shared'
import { useAuth } from '../../context/AuthContext.jsx'

const EMPTY_FORM = { name: '', rfc: '', email: '', phone: '', address: '', contact_name: '', is_active: true }

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function validatePhone(phone) { return /^[\d\s\-\+\(\)]{7,15}$/.test(phone) }

export default function Suppliers() {
  const { hasRole } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)

  const canEdit = hasRole('admin', 'operador')

  async function load(pg = 1) {
    setLoading(true)
    try {
      const { data } = await supplierService.list({ page: pg, search, page_size: 10 })
      setSuppliers(data.results || data)
      setTotalPages(Math.ceil((data.count || (data.results || data).length) / 10))
    } catch {
      setSuppliers(DEMO_SUPPLIERS)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(s)  { setEditing(s); setForm({ ...s }); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }

  function validate() {
    if (!form.name.trim()) { toast.error('Nombre requerido'); return false }
    if (form.email && !validateEmail(form.email)) { toast.error('Email inválido'); return false }
    if (form.phone && !validatePhone(form.phone)) { toast.error('Teléfono inválido'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        const { data } = await supplierService.update(editing.id, form)
        setSuppliers(prev => prev.map(s => s.id === editing.id ? data : s))
        toast.success('Proveedor actualizado')
      } else {
        const { data } = await supplierService.create(form)
        setSuppliers(prev => [data, ...prev])
        toast.success('Proveedor creado')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await supplierService.remove(deleteId)
      setSuppliers(prev => prev.filter(s => s.id !== deleteId))
      toast.success('Proveedor eliminado')
    } catch {
      toast.error('No se puede eliminar: tiene productos asociados')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rfc?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores y contactos</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}>➕ Nuevo Proveedor</button>}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input flex-1" placeholder="Buscar por nombre, email o RFC..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <button className="btn-secondary" onClick={() => load(1)}>🔍 Buscar</button>
        </div>
      </div>

      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState icon="🏭" title="No hay proveedores" description="Agrega tu primer proveedor." action={canEdit && <button className="btn-primary mt-2" onClick={openCreate}>Agregar proveedor</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>RFC</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>Estado</th>{canEdit && <th>Acciones</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="font-medium text-slate-200">{s.name}</td>
                  <td><code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{s.rfc || '—'}</code></td>
                  <td className="text-slate-400">{s.contact_name || '—'}</td>
                  <td><a href={`mailto:${s.email}`} className="text-blue-400 hover:underline text-sm">{s.email || '—'}</a></td>
                  <td className="text-slate-400">{s.phone || '—'}</td>
                  <td><StatusBadge active={s.is_active} /></td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm" onClick={() => openEdit(s)}>✏️ Editar</button>
                        <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => setDeleteId(s.id)}>🗑️</button>
                      </div>
                    </td>
                  )}
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
              <h3 className="text-lg font-semibold">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nombre de empresa *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Distribuidora XYZ SA de CV" />
                  </div>
                  <div>
                    <label className="label">RFC</label>
                    <input className="input" value={form.rfc} onChange={e => setForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))} placeholder="RFC123456ABC" maxLength={13} />
                  </div>
                  <div>
                    <label className="label">Nombre de contacto</label>
                    <input className="input" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+52 55 1234 5678" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Dirección</label>
                    <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle, Número, Ciudad, CP" />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select className="input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? '⏳ Guardando...' : editing ? '💾 Actualizar' : '➕ Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={Boolean(deleteId)} title="Eliminar proveedor" message="¿Eliminar este proveedor? Asegúrate de que no tenga productos activos asociados." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} danger />
    </div>
  )
}

const DEMO_SUPPLIERS = [
  { id: 1, name: 'TechDistrib SA de CV', rfc: 'TDI123456ABC', email: 'ventas@techdistrib.mx', phone: '+52 55 1234 5678', contact_name: 'Ing. Carlos Ruiz', address: 'Av. Insurgentes 123, CDMX', is_active: true },
  { id: 2, name: 'Importadora Global SRL', rfc: 'IGS987654XYZ', email: 'compras@iglobal.com', phone: '+52 33 9876 5432', contact_name: 'Lic. Ana Torres', address: 'Blvd. Puerta de Hierro 45, GDL', is_active: true },
  { id: 3, name: 'Electronik Parts MX', rfc: 'EPM555666HHH', email: 'info@eparts.mx', phone: '+52 81 5555 6666', contact_name: 'Jorge Méndez', address: 'Parque Industrial Norte 7, MTY', is_active: false },
]
