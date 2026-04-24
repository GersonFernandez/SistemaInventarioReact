import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { categoryService } from '../../services'
import { LoadingScreen, EmptyState, ConfirmDialog, StatusBadge } from '../../components/ui/Shared'
import { useAuth } from '../../context/AuthContext.jsx'

const EMPTY_FORM = { name: '', is_active: true }

export default function Categories() {
  const { hasRole } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const canEdit = hasRole('admin', 'operador')

  async function load() {
    setLoading(true)
    try {
      const { data } = await categoryService.list({ ordering: 'name', page_size: 1000 })
      setCategories(data.results || data)
    } catch {
      toast.error('No fue posible cargar categorías')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((c) => c.name?.toLowerCase().includes(term))
  }, [categories, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(category) {
    setEditing(category)
    setForm({ name: category.name || '', is_active: Boolean(category.is_active) })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const { data } = await categoryService.update(editing.id, form)
        setCategories((prev) => prev.map((item) => (item.id === editing.id ? data : item)))
        toast.success('Categoría actualizada')
      } else {
        const { data } = await categoryService.create(form)
        setCategories((prev) => [data, ...prev])
        toast.success('Categoría creada')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al guardar categoría')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await categoryService.remove(deleteId)
      setCategories((prev) => prev.filter((item) => item.id !== deleteId))
      toast.success('Categoría eliminada')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'No se pudo eliminar la categoría')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Mantenimiento de categorías para el catálogo.</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}>➕ Nueva Categoría</button>}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>🔄 Recargar</button>
        </div>
      </div>

      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Sin categorías"
          description="Crea categorías para facilitar la clasificación de productos."
          action={canEdit ? <button className="btn-primary mt-2" onClick={openCreate}>Crear categoría</button> : null}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Productos</th>
                <th>Estado</th>
                {canEdit && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((category) => (
                <tr key={category.id}>
                  <td className="font-medium text-slate-200">{category.name}</td>
                  <td className="text-slate-400">{category.product_count || 0}</td>
                  <td><StatusBadge active={category.is_active} /></td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm" onClick={() => openEdit(category)}>✏️ Editar</button>
                        <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => setDeleteId(category.id)}>🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="space-y-4">
                  <div>
                    <label className="label">Nombre *</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Periféricos"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      className="input"
                      value={String(form.is_active)}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
                    >
                      <option value="true">Activa</option>
                      <option value="false">Inactiva</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? '⏳ Guardando...' : '💾 Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar categoría"
        message="¿Eliminar esta categoría? Si tiene productos asociados, el sistema no permitirá eliminarla."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  )
}
