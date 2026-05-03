import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { categoryService, productService } from '../../services'
import { LoadingScreen, EmptyState, ConfirmDialog, Pagination, StatusBadge } from '../../components/ui/Shared'
import { useAuth } from '../../context/AuthContext.jsx'

const EMPTY_FORM = {
  name: '', sku: '', description: '', price: '', stock: '',
  category: '', supplier_id: '', is_active: true,
}

const MAX_IMAGE_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const NEW_CATEGORY_OPTION = '__new__'

function buildProductPayload(form) {
  return {
    name: (form.name || '').trim(),
    sku: (form.sku || '').trim(),
    description: form.description || '',
    price: parseFloat(form.price),
    stock: parseInt(form.stock, 10) || 0,
    category: (form.category || '').trim(),
    is_active: !!form.is_active,
  }
}

function getApiErrorMessage(err, fallback = 'Error al guardar producto') {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const firstKey = Object.keys(data)[0]
  if (!firstKey) return fallback
  const value = data[firstKey]
  if (Array.isArray(value) && value.length > 0) {
    return `${firstKey}: ${value[0]}`
  }
  if (typeof value === 'string') {
    return `${firstKey}: ${value}`
  }
  return fallback
}

export default function Products() {
  const { hasRole } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)
  const [imgFile, setImgFile]       = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const fileRef = useRef()

  const canEdit = hasRole('admin', 'operador')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const page = Math.max(Number(searchParams.get('page') || 1), 1)
  const modalCategoryOptions = Array.from(new Set([...(categories || []), form.category].filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))

  function setParam(key, value, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (resetPage && key !== 'page') {
      next.set('page', '1')
    }
    setSearchParams(next)
  }

  async function loadCategories() {
    try {
      const { data } = await categoryService.list({ page_size: 1000, ordering: 'name', is_active: true })
      const results = data.results || data
      const options = results
        .map(categoryItem => categoryItem.name?.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right))
      setCategories(options)
    } catch {
      const fallbackOptions = Array.from(new Set(
        DEMO_PRODUCTS
          .map(product => product.category?.trim())
          .filter(Boolean)
      )).sort((left, right) => left.localeCompare(right))
      setCategories(fallbackOptions)
    }
  }

  async function load(pg = 1) {
    setLoading(true)
    try {
      const params = { page: pg, search, page_size: 10 }
      if (category) params.category = category
      if (status) params.is_active = status === 'active'
      if (minPrice) params.price__gte = minPrice
      if (maxPrice) params.price__lte = maxPrice
      const { data } = await productService.list(params)
      setProducts(data.results || data)
      setTotalPages(Math.ceil((data.count || (data.results || data).length) / 10))
    } catch {
      // Use demo data when API is unavailable
      setProducts(DEMO_PRODUCTS)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { load(page) }, [page, search, category, status, minPrice, maxPrice])

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setIsCreatingCategory(false); setImgFile(null); setImgPreview(null); setShowModal(true)
  }
  function openEdit(p) {
    setEditing(p); setForm({ ...p }); setIsCreatingCategory(false); setImgPreview(p.image_url || null); setImgFile(null); setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setIsCreatingCategory(false); setImgFile(null); setImgPreview(null) }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP'); return
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Imagen demasiado grande (máx ${MAX_IMAGE_SIZE_MB} MB)`); return
    }
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    if (!form.sku.trim())  { toast.error('El SKU es requerido'); return }
    if (isCreatingCategory && !form.category.trim()) { toast.error('La categoría es requerida'); return }
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) { toast.error('Precio inválido'); return }
    setSaving(true)
    try {
      let saved
      const payload = buildProductPayload(form)
      if (editing) {
        const { data } = await productService.update(editing.id, payload)
        saved = data
        setProducts(prev => prev.map(p => p.id === editing.id ? saved : p))
        toast.success('Producto actualizado')
      } else {
        const { data } = await productService.create(payload)
        saved = data
        setProducts(prev => [saved, ...prev])
        toast.success('Producto creado')
      }
      // Upload image if selected
      if (imgFile && saved?.id) {
        await productService.uploadImage(saved.id, imgFile)
        toast.success('Imagen subida')
      }
      closeModal()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await productService.remove(deleteId)
      setProducts(prev => prev.filter(p => p.id !== deleteId))
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Gestión del catálogo de productos e inventario</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>➕ Nuevo Producto</button>
        )}
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setParam('search', e.target.value)}
          />
          <select
            className="input w-full lg:w-44"
            value={category}
            onChange={e => setParam('category', e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            className="input w-full lg:w-40"
            value={status}
            onChange={e => setParam('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <input
            className="input w-full lg:w-36"
            type="number"
            min="0"
            step="0.01"
            placeholder="Precio mín"
            value={minPrice}
            onChange={e => setParam('min_price', e.target.value)}
          />
          <input
            className="input w-full lg:w-36"
            type="number"
            min="0"
            step="0.01"
            placeholder="Precio máx"
            value={maxPrice}
            onChange={e => setParam('max_price', e.target.value)}
          />
          <button className="btn-secondary" onClick={() => setParam('page', '1', false)}>🔍 Buscar</button>
          <button
            className="btn-outline"
            onClick={() => setSearchParams({})}
          >Limpiar</button>
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState icon="📦" title="No hay productos" description="Comienza agregando el primer producto." action={canEdit && <button className="btn-primary mt-2" onClick={openCreate}>Agregar producto</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Imagen</th><th>Nombre</th><th>SKU</th><th>Stock</th><th>Precio</th><th>Estado</th>{canEdit && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" className="w-10 h-10 object-cover rounded-lg border border-slate-600" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-lg">📦</div>
                    )}
                  </td>
                  <td>
                    <Link to={`/intranet/products/${p.id}`} className="font-medium text-slate-200 hover:text-blue-400 transition-colors">{p.name}</Link>
                    {p.category && <p className="text-xs text-slate-500">{p.category}</p>}
                  </td>
                  <td><code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{p.sku}</code></td>
                  <td>
                    <span className={p.stock <= 5 ? 'text-red-400 font-semibold' : 'text-slate-300'}>{p.stock}</span>
                    {p.stock <= 5 && <span className="badge-red ml-2">Bajo</span>}
                  </td>
                  <td className="text-slate-300">${Number(p.price).toFixed(2)}</td>
                  <td><StatusBadge active={p.is_active} /></td>
                  {canEdit && (
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm" onClick={() => openEdit(p)}>✏️ Editar</button>
                        <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => setDeleteId(p.id)}>🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={nextPage => setParam('page', String(nextPage), false)} />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Image upload */}
                <div>
                  <label className="label">Imagen del producto</label>
                  <div
                    className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {imgPreview ? (
                      <img src={imgPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                    ) : (
                      <div className="text-slate-500">
                        <p className="text-4xl mb-2">🖼️</p>
                        <p className="text-sm">Haz clic para subir imagen</p>
                        <p className="text-xs mt-1">JPG, PNG, WebP · Máx {MAX_IMAGE_SIZE_MB} MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImgChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nombre del producto" />
                  </div>
                  <div>
                    <label className="label">SKU *</label>
                    <input className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} required placeholder="PRD-001" />
                  </div>
                  <div>
                    <label className="label">Precio *</label>
                    <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="label">Stock inicial</label>
                    <input className="input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Categoría</label>
                    <select
                      className="input"
                      value={isCreatingCategory ? NEW_CATEGORY_OPTION : (form.category || '')}
                      onChange={e => {
                        if (e.target.value === NEW_CATEGORY_OPTION) {
                          setIsCreatingCategory(true)
                          setForm(f => ({ ...f, category: '' }))
                          return
                        }
                        setIsCreatingCategory(false)
                        setForm(f => ({ ...f, category: e.target.value }))
                      }}
                    >
                      <option value="">Selecciona una categoría</option>
                      {modalCategoryOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value={NEW_CATEGORY_OPTION}>Nueva categoría...</option>
                    </select>
                    {isCreatingCategory && (
                      <input
                        className="input mt-2"
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="Escribe una nueva categoría"
                      />
                    )}
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select className="input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del producto..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? '⏳ Guardando...' : editing ? '💾 Actualizar' : '➕ Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  )
}

// Demo data for when API is not yet connected
const DEMO_PRODUCTS = [
  { id: 1, name: 'Monitor LG 27" 4K', sku: 'MON-001', stock: 15, price: 349.99, category: 'Electrónica', is_active: true, image_url: null },
  { id: 2, name: 'Teclado Mecánico ASUS', sku: 'TEC-002', stock: 3, price: 89.99, category: 'Periféricos', is_active: true, image_url: null },
  { id: 3, name: 'Cable HDMI 2m', sku: 'CAB-003', stock: 120, price: 12.50, category: 'Cables', is_active: true, image_url: null },
  { id: 4, name: 'Mouse Logitech MX', sku: 'MOU-004', stock: 0, price: 59.99, category: 'Periféricos', is_active: false, image_url: null },
  { id: 5, name: 'SSD Samsung 1TB', sku: 'SSD-005', stock: 28, price: 99.00, category: 'Almacenamiento', is_active: true, image_url: null },
]
