import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Mock stats (replace with real API calls in production)
const MOCK_STATS = [
  { label: 'Productos', value: 148, icon: '📦', color: 'bg-blue-600/20 text-blue-400', trend: '+12 este mes' },
  { label: 'Proveedores', value: 34, icon: '🏭', color: 'bg-purple-600/20 text-purple-400', trend: '+2 este mes' },
  { label: 'Recepciones hoy', value: 7, icon: '📥', color: 'bg-emerald-600/20 text-emerald-400', trend: '3 pendientes' },
  { label: 'Usuarios activos', value: 12, icon: '👥', color: 'bg-orange-600/20 text-orange-400', trend: '2 bloqueados' },
]

const RECENT_ACTIVITY = [
  { time: '10:32', type: 'Recepción', desc: 'Se recibieron 50 unidades de "Monitor LG 27"', user: 'operador1' },
  { time: '09:15', type: 'Producto',  desc: 'Nuevo producto agregado: "Teclado Mecánico ASUS"', user: 'admin' },
  { time: '08:47', type: 'Proveedor', desc: 'Proveedor "TechDistrib SA" actualizado', user: 'admin' },
  { time: 'Ayer',  type: 'Usuario',   desc: 'Usuario "juan.perez" bloqueado por inactividad', user: 'admin' },
  { time: 'Ayer',  type: 'Recepción', desc: 'Se recibieron 120 unidades de "Cable HDMI 2m"', user: 'operador2' },
]

const TYPE_COLORS = {
  Recepción: 'badge-green',
  Producto:  'badge-blue',
  Proveedor: 'badge-yellow',
  Usuario:   'badge-red',
}

export default function Dashboard() {
  const { user, hasRole } = useAuth()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bienvenido, {user?.name}. Aquí tienes el resumen del sistema.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/intranet/reception" className="btn-success">
            <span>📥</span> Nueva Recepción
          </Link>
          {hasRole('admin', 'operador') && (
            <Link to="/intranet/products" className="btn-primary">
              <span>➕</span> Agregar Producto
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {MOCK_STATS.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-sm font-medium text-slate-300">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Actividad Reciente</h2>
            <Link to="/intranet/reception" className="text-xs text-blue-400 hover:text-blue-300">Ver todo →</Link>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
                <span className={`badge ${TYPE_COLORS[act.type] || 'badge-gray'} mt-0.5 flex-shrink-0`}>{act.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{act.desc}</p>
                  <p className="text-xs text-slate-500 mt-0.5">por {act.user}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="font-semibold text-slate-200 mb-4">Accesos Rápidos</h2>
          <div className="space-y-2">
            <Link to="/intranet/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl">📦</span>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Gestión de Productos</p>
                <p className="text-xs text-slate-500">CRUD + imágenes</p>
              </div>
            </Link>
            <Link to="/intranet/suppliers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl">🏭</span>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Proveedores</p>
                <p className="text-xs text-slate-500">Gestión completa</p>
              </div>
            </Link>
            <Link to="/intranet/reception" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl">📥</span>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Recepción de Mercancía</p>
                <p className="text-xs text-slate-500">Log de entradas</p>
              </div>
            </Link>
            {hasRole('admin') && (
              <Link to="/intranet/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Usuarios</p>
                  <p className="text-xs text-slate-500">Roles y permisos</p>
                </div>
              </Link>
            )}
            <a href="/portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl">🌐</span>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Portal de Ventas</p>
                <p className="text-xs text-slate-500">Vista pública</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
