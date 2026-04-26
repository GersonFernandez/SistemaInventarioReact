import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogService, categoryService } from '../../services'

const CATEGORIES = ['Todas']
const SORT_OPTIONS = [
  { value: 'name', label: 'Nombre A–Z' },
  { value: '-name', label: 'Nombre Z–A' },
  { value: 'price', label: 'Precio ↑' },
  { value: '-price', label: 'Precio ↓' },
  { value: '-created_at', label: 'Más recientes' },
]

function ProductCard({ product }) {
  return (
    <Link
      to={`/portal/catalog/${product.id}`}
      className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={e => e.target.classList.add('loaded')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        {product.category && (
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{product.category}</span>
        )}
        <h3 className="font-semibold text-slate-800 mt-1 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
          {product.stock > 0 ? (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-1 rounded-full">En stock</span>
          ) : (
            <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-1 rounded-full">Agotado</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState(CATEGORIES)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotal]    = useState(1)
  const [totalCount, setCount]    = useState(0)

  const search   = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const ordering = searchParams.get('ordering') || '-created_at'
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, page_size: 12, is_active: true }
      if (search) params.search = search
      if (category && category !== 'Todas') params.category = category
      if (ordering) params.ordering = ordering
      if (minPrice) params.price__gte = minPrice
      if (maxPrice) params.price__lte = maxPrice
      const { data } = await catalogService.list(params)
      const results = data.results || data
      setProducts(results)
      setCount(data.count || results.length)
      setTotal(Math.ceil((data.count || results.length) / 12))
    } catch {
      setProducts(DEMO_PRODUCTS)
      setCount(DEMO_PRODUCTS.length)
      setTotal(1)
    } finally {
      setLoading(false)
    }
  }, [search, category, ordering, minPrice, maxPrice])

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await categoryService.list({ page_size: 1000, is_active: true, ordering: 'name' })
      const results = data.results || data
      const dynamicCategories = results.map(item => item.name).filter(Boolean)
      setCategories(['Todas', ...dynamicCategories])
    } catch {
      setCategories(CATEGORIES)
    }
  }, [])

  useEffect(() => { setPage(1) }, [search, category, ordering, minPrice, maxPrice])
  useEffect(() => { load(page) }, [page, load])
  useEffect(() => { loadCategories() }, [loadCategories])

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Catálogo de Productos</h1>
          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl">
            <input
              className="input-light flex-1"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setParam('search', e.target.value)}
            />
            <button className="btn-portal rounded-lg px-5">🔍</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
              <h2 className="font-bold text-slate-800 mb-4">Filtros</h2>

              {/* Categories */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Categoría</h3>
                <div className="space-y-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setParam('category', cat === 'Todas' ? '' : cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        (cat === 'Todas' && !category) || category === cat
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Rango de precio</h3>
                <div className="flex gap-2">
                  <input className="input-light text-center" placeholder="Mín" type="number" value={minPrice} onChange={e => setParam('min_price', e.target.value)} />
                  <span className="text-slate-400 flex items-center">–</span>
                  <input className="input-light text-center" placeholder="Máx" type="number" value={maxPrice} onChange={e => setParam('max_price', e.target.value)} />
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Ordenar por</h3>
                <select className="input-light" value={ordering} onChange={e => setParam('ordering', e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Clear */}
              <button
                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-800 underline"
                onClick={() => setSearchParams({})}
              >Limpiar filtros</button>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {loading ? 'Cargando...' : `${totalCount} producto${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Sin resultados</h3>
                <p className="text-slate-500">Intenta ajustar los filtros o busca otro término.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-40 hover:bg-slate-100" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
                <button className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-40 hover:bg-slate-100" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO_PRODUCTS = [
  { id: 1, name: 'Monitor LG 27" 4K UHD', category: 'Electrónica', price: 349.99, stock: 15, description: 'Panel IPS, HDR10, 99% sRGB', image_url: null },
  { id: 2, name: 'Teclado Mecánico ASUS ROG', category: 'Periféricos', price: 89.99, stock: 8, description: 'Switches Cherry MX Red, RGB', image_url: null },
  { id: 3, name: 'SSD Samsung 1TB NVMe', category: 'Almacenamiento', price: 99.00, stock: 28, description: 'PCIe 4.0, 7000 MB/s lectura', image_url: null },
  { id: 4, name: 'Cable HDMI 2.1 2m', category: 'Cables', price: 12.50, stock: 120, description: '8K@60Hz, 48Gbps', image_url: null },
  { id: 5, name: 'Mouse Logitech MX Master 3', category: 'Periféricos', price: 59.99, stock: 0, description: 'Multidispositivo, Bluetooth', image_url: null },
  { id: 6, name: 'Audífonos Sony WH-1000XM5', category: 'Accesorios', price: 279.99, stock: 12, description: 'Cancelación de ruido líder', image_url: null },
  { id: 7, name: 'Hub USB-C 7 en 1', category: 'Accesorios', price: 34.99, stock: 45, description: 'HDMI 4K, USB 3.0 x3, SD', image_url: null },
  { id: 8, name: 'Webcam Logitech C920', category: 'Periféricos', price: 69.99, stock: 30, description: 'Full HD 1080p, AutoFocus', image_url: null },
]
