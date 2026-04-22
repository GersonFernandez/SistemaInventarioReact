import { Link, useLocation, Navigate } from 'react-router-dom'

export default function CheckoutSuccess() {
  const location = useLocation()
  const order = location.state?.order || null
  const product = location.state?.product || null

  if (!order) {
    return <Navigate to="/portal/catalog" replace />
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Pago exitoso</h1>
          <p className="text-slate-500 mt-2">
            Tu pedido fue registrado correctamente y está listo para procesamiento.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-slate-500">Número de pedido</p>
              <p className="font-semibold text-slate-800 mt-1">{order.order_number}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-slate-500">Método de pago</p>
              <p className="font-semibold text-slate-800 mt-1">Tarjeta terminación {order.card_last4}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-slate-500">Estado</p>
              <p className="font-semibold text-emerald-600 mt-1">Pagado</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-slate-500">Total</p>
              <p className="font-semibold text-slate-800 mt-1">${Number(order.total_amount || 0).toFixed(2)}</p>
            </div>
          </div>

          {product && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Producto</p>
              <p className="font-medium text-slate-800 mt-1">{product.name}</p>
              <p className="text-sm text-slate-500">SKU: {product.sku}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/portal/catalog" className="btn-portal rounded-xl px-5 py-2.5 text-center">
              Seguir comprando
            </Link>
            {product?.id && (
              <Link to={`/portal/catalog/${product.id}`} className="btn border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-5 py-2.5 text-center">
                Ver producto
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}