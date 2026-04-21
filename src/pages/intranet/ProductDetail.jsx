import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { productService, receptionService } from '../../services'
import { LoadingScreen, StatusBadge } from '../../components/ui/Shared'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [receptions, setReceptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, recRes] = await Promise.all([
          productService.get(id),
          receptionService.list({ product: id }),
        ])
        setProduct(prodRes.data)
        setReceptions(recRes.data?.results || recRes.data || [])
      } catch {
        // Demo fallback
        setProduct(DEMO_PRODUCT)
        setReceptions(DEMO_RECEPTIONS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <LoadingScreen />
  if (!product) return <div className="text-center text-slate-400 py-16">Producto no encontrado.</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/intranet/products" className="text-slate-400 hover:text-slate-200 text-sm">← Productos</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Product card */}
        <div className="lg:col-span-1 card">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" className="w-full aspect-square object-cover rounded-xl mb-4 border border-slate-700" />
          ) : (
            <div className="w-full aspect-square bg-slate-700 rounded-xl mb-4 flex items-center justify-center text-6xl">📦</div>
          )}
          <h1 className="text-xl font-bold text-slate-100 mb-1">{product.name}</h1>
          <p className="text-sm text-slate-500 mb-3">{product.category}</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">SKU</span>
              <code className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 text-xs">{product.sku}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Precio</span>
              <span className="font-semibold text-emerald-400">${Number(product.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Stock actual</span>
              <span className={`font-bold ${product.stock <= 5 ? 'text-red-400' : 'text-slate-100'}`}>{product.stock} uds</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estado</span>
              <StatusBadge active={product.is_active} />
            </div>
          </div>
          {product.description && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Descripción</p>
              <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Link to="/intranet/products" state={{ editId: product.id }} className="btn-outline flex-1 justify-center">✏️ Editar</Link>
            <Link to="/intranet/reception" state={{ productId: product.id }} className="btn-success flex-1 justify-center">📥 Recepción</Link>
          </div>
        </div>

        {/* Reception log */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-slate-200 mb-4">Historial de Recepciones (Trazabilidad)</h2>
          {receptions.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">Sin recepciones registradas para este producto.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Cantidad</th><th>Proveedor</th><th>Lote</th><th>Operador</th><th>Notas</th></tr>
                </thead>
                <tbody>
                  {receptions.map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.received_at).toLocaleDateString('es-MX')}</td>
                      <td><span className="text-emerald-400 font-semibold">+{r.quantity}</span></td>
                      <td>{r.supplier_name || '—'}</td>
                      <td><code className="text-xs bg-slate-700 px-1 py-0.5 rounded">{r.batch || '—'}</code></td>
                      <td className="text-slate-400">{r.operator || '—'}</td>
                      <td className="text-slate-500 text-xs max-w-[150px] truncate">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DEMO_PRODUCT = { id: 1, name: 'Monitor LG 27" 4K', sku: 'MON-001', stock: 15, price: 349.99, category: 'Electrónica', is_active: true, image_url: null, description: 'Monitor 4K UHD de 27 pulgadas con panel IPS y HDR10.' }
const DEMO_RECEPTIONS = [
  { id: 1, received_at: '2025-04-10T10:30:00Z', quantity: 20, supplier_name: 'TechDistrib SA', batch: 'LOT-2025-04', operator: 'operador1', notes: 'Entrega sin novedad' },
  { id: 2, received_at: '2025-03-15T09:00:00Z', quantity: 30, supplier_name: 'TechDistrib SA', batch: 'LOT-2025-03', operator: 'operador2', notes: null },
]
