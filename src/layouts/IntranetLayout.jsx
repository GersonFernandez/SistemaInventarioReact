import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/intranet/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/intranet/products',  icon: '📦', label: 'Productos' },
  { to: '/intranet/categories', icon: '🗂️', label: 'Categorías' },
  { to: '/intranet/suppliers', icon: '🏭', label: 'Proveedores' },
  { to: '/intranet/reception', icon: '📥', label: 'Recepción' },
]

const ADMIN_ITEMS = [
  { to: '/intranet/users', icon: '👥', label: 'Usuarios' },
]

export default function IntranetLayout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada correctamente')
    navigate('/login')
  }

  return (
    <div className="intranet-root flex h-screen overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-slate-800 border-r border-slate-700
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SI</div>
          <div>
            <p className="font-semibold text-slate-100 text-sm leading-tight">SistemaInventario</p>
            <p className="text-xs text-slate-500">Intranet</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Principal</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {hasRole('admin') && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-4">Administración</p>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="border-t border-slate-700 mt-4 pt-4">
            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item"
            >
              <span className="text-base">📋</span>
              API Docs
            </a>
            <a
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item"
            >
              <span className="text-base">🌐</span>
              Portal Ventas
            </a>
          </div>
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'operador'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-900/20"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-slate-800/80 backdrop-blur border-b border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-100 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div className="flex-1">
            {/* Breadcrumb or search can go here */}
          </div>

          {/* Role badge */}
          <span className={`badge ${user?.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
            {user?.role === 'admin' ? '⚡ Admin' : '👤 Operador'}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
