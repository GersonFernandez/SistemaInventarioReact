import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { catalogService, orderService } from '../../services'

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  references: '',
  cardHolder: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
}

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productFromState = location.state?.product || null
  const productId = searchParams.get('product') || productFromState?.id || null

  const [product, setProduct] = useState(productFromState)
  const [loadingProduct, setLoadingProduct] = useState(!productFromState)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!productId || productFromState?.id === Number(productId)) {
      setLoadingProduct(false)
      return
    }

    let mounted = true
    async function loadProduct() {
      setLoadingProduct(true)
      try {
        const { data } = await catalogService.get(productId)
        if (mounted) setProduct(data)
      } catch {
        if (mounted) {
          toast.error('No se pudo cargar el producto para el pago')
          navigate('/portal/catalog', { replace: true })
        }
      } finally {
        if (mounted) setLoadingProduct(false)
      }
    }

    loadProduct()
    return () => { mounted = false }
  }, [productId, productFromState, navigate])

  const total = useMemo(() => Number(product?.price || 0).toFixed(2), [product])

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    const formatted = digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits
    setForm(prev => ({ ...prev, expiry: formatted }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!product) {
      toast.error('No hay producto para procesar el pago')
      return
    }

    const required = [
      form.fullName, form.phone, form.street, form.city, form.state, form.zipCode,
      form.cardHolder, form.cardNumber, form.expiry, form.cvv,
    ]
    if (required.some(value => !String(value).trim())) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    if (form.cardNumber.replace(/\s+/g, '').length < 13) {
      toast.error('Número de tarjeta inválido')
      return
    }

    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      toast.error('Vencimiento inválido. Usa MM/AA')
      return
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      toast.error('CVV inválido')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        product: product.id,
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim(),
        references: form.references.trim(),
        card_holder: form.cardHolder.trim(),
        card_number: form.cardNumber.replace(/\s+/g, ''),
        expiry: form.expiry.trim(),
        cvv: form.cvv.trim(),
      }

      const { data } = await orderService.create(payload)
      const orderNumber = data?.order_number ? ` (${data.order_number})` : ''
      toast.success(`Pago aprobado. Pedido registrado${orderNumber}.`)
      navigate('/portal/checkout/success', {
        state: {
          order: data,
          product,
        },
      })
    } catch (err) {
      const backendError = err?.response?.data
      const message = typeof backendError === 'string'
        ? backendError
        : backendError?.detail || Object.values(backendError || {})?.[0]?.[0] || 'No se pudo procesar el pago.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-3">No hay producto seleccionado</h1>
        <p className="text-slate-500 mb-6">Selecciona un producto del catálogo para continuar con el pago.</p>
        <Link to="/portal/catalog" className="btn-portal rounded-lg px-5 py-2.5">Ir al catálogo</Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Pago</h1>
          <p className="text-slate-500 mt-1">Completa tu dirección y realiza el pago con tarjeta de crédito.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-slate-800 mb-4">Dirección de entrega</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="input-light" placeholder="Nombre completo *" value={form.fullName} onChange={e => updateField('fullName', e.target.value)} />
                <input className="input-light" placeholder="Teléfono *" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                <input className="input-light md:col-span-2" placeholder="Calle y número *" value={form.street} onChange={e => updateField('street', e.target.value)} />
                <input className="input-light" placeholder="Ciudad *" value={form.city} onChange={e => updateField('city', e.target.value)} />
                <input className="input-light" placeholder="Estado/Provincia *" value={form.state} onChange={e => updateField('state', e.target.value)} />
                <input className="input-light" placeholder="Código postal *" value={form.zipCode} onChange={e => updateField('zipCode', e.target.value)} />
                <input className="input-light md:col-span-2" placeholder="Referencias (opcional)" value={form.references} onChange={e => updateField('references', e.target.value)} />
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-slate-800 mb-4">Método de pago</h2>
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 font-medium">
                Método seleccionado: Tarjeta de crédito
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="input-light md:col-span-2" placeholder="Titular de la tarjeta *" value={form.cardHolder} onChange={e => updateField('cardHolder', e.target.value)} />
                <input className="input-light md:col-span-2" placeholder="Número de tarjeta *" value={form.cardNumber} onChange={e => updateField('cardNumber', e.target.value)} />
                <input
                  className="input-light"
                  placeholder="Vencimiento MM/AA *"
                  value={form.expiry}
                  maxLength={5}
                  inputMode="numeric"
                  onChange={e => updateExpiry(e.target.value)}
                />
                <input className="input-light" placeholder="CVV *" value={form.cvv} onChange={e => updateField('cvv', e.target.value)} />
              </div>
            </div>
          </section>

          <aside className="bg-white border border-slate-200 rounded-2xl p-6 h-fit sticky top-20">
            <h3 className="font-semibold text-slate-800 mb-4">Resumen</h3>
            <div className="flex items-start gap-3 mb-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">📦</div>
              )}
              <div>
                <p className="font-medium text-slate-800 leading-tight">{product.name}</p>
                <p className="text-sm text-slate-500">SKU: {product.sku}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">Subtotal</span><span>${total}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Envío</span><span>$0.00</span></div>
              <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-slate-200"><span>Total</span><span>${total}</span></div>
            </div>

            <button type="submit" disabled={submitting} className="btn-portal w-full rounded-xl py-2.5 mt-5 disabled:opacity-70">
              {submitting ? 'Procesando pago...' : 'Pagar con tarjeta de crédito'}
            </button>

            <Link to={`/portal/catalog/${product.id}`} className="block text-center text-sm text-slate-500 hover:text-slate-700 mt-3">
              Volver al producto
            </Link>
          </aside>
        </form>
      </div>
    </div>
  )
}