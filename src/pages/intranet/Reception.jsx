import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { receptionService, productService, supplierService } from '../../services'
import { LoadingScreen, EmptyState, Pagination } from '../../components/ui/Shared'

const EMPTY_FORM = { product_id: '', supplier_id: '', quantity: '', batch: '', notes: '' }

export default function Reception() {
  const [receptions, setReceptions] = useState([])
  const [products, setProducts]     = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterProd, setFilterProd] = useState('')

  async function load(pg = 1) {
    setLoading(true)
    try {
      const [recRes, prodRes, supRes] = await Promise.all([
        receptionService.list({ page: pg, page_size: 15, product: filterProd || undefined }),
        productService.list({ page: 1, page_size: 100 }),
        supplierService.list({ page: 1, page_size: 100 }),
      ])
      setReceptions(recRes.data?.results || recRes.data || [])
      setTotalPages(Math.ceil((recRes.data?.count || (recRes.data?.results || recRes.data || []).length) / 15))
      setProducts(prodRes.data?.results || prodRes.data || [])
      setSuppliers(supRes.data?.results || supRes.data || [])
    } catch {
      setReceptions(DEMO_RECEPTIONS)
      setProducts(DEMO_PRODUCTS)
      setSuppliers(DEMO_SUPPLIERS)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page, filterProd])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.product_id) { toast.error('Selecciona un producto'); return }
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0) { toast.error('Cantidad debe ser mayor a 0'); return }
    setSaving(true)
    try {
      const { data } = await receptionService.create({
        ...form,
        quantity: qty,
        product_id: parseInt(form.product_id),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
      })
      setReceptions(prev => [data, ...prev])
      toast.success(`✅ Se registraron ${qty} unidades en inventario`)
      setForm(EMPTY_FORM)
      setShowModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al registrar recepción')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recepción de Mercancía</h1>
          <p className="page-subtitle">Registro de entradas al inventario con trazabilidad completa</p>
        </div>
        <button className="btn-success" onClick={() => setShowModal(true)}>📥 Nueva Recepción</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-400">{receptions.length}</p>
          <p className="text-sm text-slate-400 mt-1">Recepciones totales</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-400">
            {receptions.reduce((s, r) => s + (r.quantity || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400 mt-1">Unidades recibidas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-400">
            {receptions.filter(r => new Date(r.received_at).toDateString() === new Date().toDateString()).length}
          </p>
          <p className="text-sm text-slate-400 mt-1">Recepciones hoy</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input flex-1" value={filterProd} onChange={e => { setFilterProd(e.target.value); setPage(1) }}>
            <option value="">Todos los productos</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => { setFilterProd(''); setPage(1) }}>🔄 Limpiar</button>
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingScreen /> : receptions.length === 0 ? (
        <EmptyState icon="📥" title="Sin recepciones" description="Registra la primera entrada de inventario." action={<button className="btn-success mt-2" onClick={() => setShowModal(true)}>Nueva Recepción</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Proveedor</th><th>Lote</th><th>Operador</th><th>Notas</th></tr>
            </thead>
            <tbody>
              {receptions.map(r => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{new Date(r.received_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="font-medium text-slate-200">{r.product_name || `Producto #${r.product_id}`}</td>
                  <td><span className="text-emerald-400 font-bold">+{r.quantity}</span></td>
                  <td className="text-slate-400">{r.supplier_name || '—'}</td>
                  <td><code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{r.batch || '—'}</code></td>
                  <td className="text-slate-400">{r.operator || r.created_by || '—'}</td>
                  <td className="text-slate-500 text-xs max-w-[180px] truncate">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* New Reception Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">📥 Nueva Recepción</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-sm text-blue-300 mb-2">
                  ℹ️ Al confirmar, el stock del producto se incrementará automáticamente y quedará registrado en el log de entradas.
                </div>
                <div>
                  <label className="label">Producto *</label>
                  <select className="input" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} required>
                    <option value="">Seleccionar producto...</option>
                    {products.filter(p => p.is_active).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) — Stock: {p.stock}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Cantidad recibida *</label>
                  <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="0" />
                </div>
                <div>
                  <label className="label">Proveedor</label>
                  <select className="input" value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                    <option value="">Sin proveedor especificado</option>
                    {suppliers.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Número de lote / factura</label>
                  <input className="input" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="LOT-2025-001 / FAC-12345" />
                </div>
                <div>
                  <label className="label">Notas adicionales</label>
                  <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones de la recepción..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-success" disabled={saving}>{saving ? '⏳ Registrando...' : '📥 Registrar Entrada'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const DEMO_RECEPTIONS = [
  { id: 1, received_at: '2025-04-20T10:32:00Z', product_name: 'Monitor LG 27" 4K', quantity: 20, supplier_name: 'TechDistrib SA', batch: 'LOT-2025-04-A', operator: 'operador1', notes: 'Entrega conforme a OC-001' },
  { id: 2, received_at: '2025-04-20T09:15:00Z', product_name: 'Cable HDMI 2m', quantity: 200, supplier_name: 'Importadora Global', batch: 'LOT-2025-04-B', operator: 'operador2', notes: null },
  { id: 3, received_at: '2025-04-19T16:00:00Z', product_name: 'SSD Samsung 1TB', quantity: 50, supplier_name: 'TechDistrib SA', batch: 'LOT-2025-03-Z', operator: 'admin', notes: 'Pedido urgente' },
]
const DEMO_PRODUCTS = [{ id: 1, name: 'Monitor LG 27"', sku: 'MON-001', stock: 15, is_active: true }, { id: 2, name: 'SSD Samsung 1TB', sku: 'SSD-005', stock: 28, is_active: true }]
const DEMO_SUPPLIERS = [{ id: 1, name: 'TechDistrib SA', is_active: true }, { id: 2, name: 'Importadora Global', is_active: true }]
