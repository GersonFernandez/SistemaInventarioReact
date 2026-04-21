import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { catalogService } from '../../services'

export default function ProductPublic() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await catalogService.get(id)
        setProduct(data)
      } catch {
        setProduct(DEMO)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-slate-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-24 text-slate-500">Producto no encontrado. <Link to="/portal/catalog" className="text-blue-600 hover:underline">Volver al catálogo</Link></div>
  )

  return (
    <div className="bg-white min-h-screen py-10 px-4">
      {/* SEO-friendly breadcrumb */}
      <nav className="max-w-5xl mx-auto mb-6 text-sm text-slate-500 flex items-center gap-2">
        <Link to="/portal" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link to="/portal/catalog" className="hover:text-blue-600">Catálogo</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/portal/catalog?category=${product.category}`} className="hover:text-blue-600">{product.category}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Product image */}
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full aspect-square object-cover rounded-2xl border border-slate-200 shadow-sm"
              onLoad={e => e.target.classList.add('loaded')}
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-8xl">
              📦
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category && (
            <Link
              to={`/portal/catalog?category=${product.category}`}
              className="inline-block text-sm font-medium text-blue-600 uppercase tracking-wider mb-2 hover:underline"
            >{product.category}</Link>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{product.name}</h1>
          <p className="text-slate-500 text-sm mb-4">SKU: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{product.sku}</code></p>

          <div className="text-4xl font-extrabold text-slate-900 mb-4">${Number(product.price).toFixed(2)}</div>

          {/* Stock status */}
          <div className="mb-6">
            {product.stock > 10 ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium">En stock ({product.stock} disponibles)</span>
              </div>
            ) : product.stock > 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-medium">Pocas unidades ({product.stock} restantes)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-medium">Agotado temporalmente</span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-slate-800 mb-2">Descripción</h2>
              <p className="text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              ℹ️ Este es un portal de <strong>consulta de catálogo</strong>. Para realizar pedidos, contacta directamente con nuestro equipo de ventas.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/portal/catalog" className="btn flex-1 justify-center border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl">
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO = { id: 1, name: 'Monitor LG 27" 4K UHD', sku: 'MON-001', category: 'Electrónica', price: 349.99, stock: 15, image_url: null, description: 'Monitor IPS 4K UHD de 27 pulgadas con panel de alta calidad, cobertura del 99% del espacio de color sRGB, HDR10 y soporte ajustable ergonómico.' }
