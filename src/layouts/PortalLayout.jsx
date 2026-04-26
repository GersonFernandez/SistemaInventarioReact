import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function PortalLayout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/portal')
    setMenuOpen(false)
  }

  return (
    <div className="portal-root flex flex-col min-h-screen">

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
              <span className="font-bold text-slate-800 text-lg">Tienda</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/portal" end className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`
              }>Inicio</NavLink>
              <NavLink to="/portal/catalog" className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`
              }>Catálogo</NavLink>
            </nav>

            {/* Auth controls */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700">{user?.name}</span>
                  <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 transition-colors">
                    Salir
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/portal/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Iniciar sesión</Link>
                  <Link to="/portal/register" className="btn-portal text-sm px-4 py-2 rounded-lg">Registrarse</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
              <Link to="/portal" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMenuOpen(false)}>Inicio</Link>
              <Link to="/portal/catalog" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMenuOpen(false)}>Catálogo</Link>
              {isAuthenticated ? (
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Cerrar sesión</button>
              ) : (
                <>
                  <Link to="/portal/login" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
                  <Link to="/portal/register" className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg" onClick={() => setMenuOpen(false)}>Registrarse</Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">TiendaInventario</h3>
            <p className="text-sm">Portal de consulta de productos. Explora nuestro catálogo completo.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Navegación</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/portal" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/portal/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Sistema</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="/api-docs" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">API Docs</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Intranet</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-700 text-center text-xs">
          © {new Date().getFullYear()} SistemaInventario. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
