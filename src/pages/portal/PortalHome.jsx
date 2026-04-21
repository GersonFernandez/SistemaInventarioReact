import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '📦', title: 'Catálogo Completo', desc: 'Explora todos nuestros productos con fotos, descripciones y precios actualizados.' },
  { icon: '🔍', title: 'Búsqueda Avanzada', desc: 'Filtra por categoría, rango de precio, disponibilidad y más.' },
  { icon: '⚡', title: 'Información en Tiempo Real', desc: 'Stock y precios sincronizados directamente con nuestro sistema de inventario.' },
  { icon: '📱', title: 'Diseño Responsivo', desc: 'Accede desde cualquier dispositivo: móvil, tablet o computadora.' },
]

const FEATURED_CATS = [
  { name: 'Electrónica', icon: '💻', color: 'from-blue-600 to-blue-800' },
  { name: 'Periféricos', icon: '⌨️', color: 'from-purple-600 to-purple-800' },
  { name: 'Almacenamiento', icon: '💾', color: 'from-emerald-600 to-emerald-800' },
  { name: 'Cables', icon: '🔌', color: 'from-orange-600 to-orange-800' },
]

export default function PortalHome() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-blue-600/20 border border-blue-600/40 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Portal de Consulta de Productos
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Encuentra lo que<br />
            <span className="text-blue-400">necesitas</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Explora nuestro catálogo completo de productos con información detallada, imágenes y disponibilidad en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/portal/catalog" className="btn-portal text-base px-8 py-3 rounded-xl">
              🛍️ Ver Catálogo
            </Link>
            <Link to="/portal/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 btn text-base px-8 py-3 rounded-xl">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-10">Explora por categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURED_CATS.map(cat => (
              <Link
                key={cat.name}
                to={`/portal/catalog?category=${encodeURIComponent(cat.name)}`}
                className={`bg-gradient-to-br ${cat.color} rounded-2xl p-8 text-center text-white hover:scale-105 transition-transform duration-300 shadow-lg`}
              >
                <div className="text-5xl mb-3">{cat.icon}</div>
                <p className="font-semibold text-lg">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-4">¿Por qué elegirnos?</h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">Tecnología al servicio de tu experiencia de consulta.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card-portal text-center hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para explorar?</h2>
          <p className="text-blue-100 mb-8">Crea tu cuenta gratuita y accede a todo nuestro catálogo.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/portal/register" className="bg-white text-blue-600 font-semibold btn text-base px-8 py-3 rounded-xl hover:bg-blue-50">
              Crear cuenta
            </Link>
            <Link to="/portal/catalog" className="bg-blue-700 hover:bg-blue-800 text-white btn text-base px-8 py-3 rounded-xl">
              Ver catálogo sin registro
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
