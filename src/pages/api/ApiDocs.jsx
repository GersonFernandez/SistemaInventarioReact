import { useState } from 'react'

const ENDPOINTS = [
  {
    group: 'Autenticación',
    color: 'blue',
    items: [
      {
        method: 'POST', path: '/api/v1/auth/login', summary: 'Iniciar sesión',
        description: 'Devuelve un par de tokens JWT (access + refresh) para el usuario autenticado.',
        body: { email: 'usuario@empresa.com', password: 'contraseña' },
        response: { access: 'eyJ0eXAiOiJKV1Qi...', refresh: 'eyJ0eXAiOiJKV1Qi...', user: { id: 1, name: 'Admin', role: 'admin', scope: 'internal' } },
      },
      {
        method: 'POST', path: '/api/v1/auth/refresh', summary: 'Renovar token',
        description: 'Obtiene un nuevo access token usando el refresh token.',
        body: { refresh: 'eyJ0eXAiOiJKV1Qi...' },
        response: { access: 'eyJ0eXAiOiJKV1Qi...' },
      },
      {
        method: 'POST', path: '/api/v1/auth/register', summary: 'Registrar usuario público',
        description: 'Crea una nueva cuenta de usuario con acceso solo de consulta.',
        body: { name: 'Juan Pérez', email: 'juan@email.com', password: 'password123', scope: 'public' },
        response: { id: 5, name: 'Juan Pérez', email: 'juan@email.com', scope: 'public' },
      },
      {
        method: 'GET', path: '/api/v1/auth/me', summary: 'Perfil actual',
        auth: true,
        description: 'Devuelve la información del usuario autenticado.',
        response: { id: 1, name: 'Admin Principal', email: 'admin@empresa.com', role: 'admin', scope: 'internal' },
      },
    ],
  },
  {
    group: 'Productos',
    color: 'green',
    items: [
      {
        method: 'GET', path: '/api/v1/products', summary: 'Listar productos',
        auth: true,
        description: 'Retorna una lista paginada de productos. Soporta filtros por categoría, búsqueda, y ordenamiento.',
        params: { page: 1, page_size: 10, search: '(opcional)', category: '(opcional)', ordering: 'name|-name|price|-price', is_active: 'true|false' },
        response: { count: 148, next: '/api/v1/products?page=2', previous: null, results: [{ id: 1, name: 'Monitor LG 27"', sku: 'MON-001', price: '349.99', stock: 15, category: 'Electrónica', is_active: true, image_url: null }] },
      },
      {
        method: 'GET', path: '/api/v1/products/{id}', summary: 'Detalle de producto',
        auth: true,
        description: 'Retorna la información completa de un producto específico.',
        response: { id: 1, name: 'Monitor LG 27"', sku: 'MON-001', price: '349.99', stock: 15, category: 'Electrónica', description: 'Monitor IPS 4K UHD', is_active: true, image_url: 'https://storage.example.com/products/mon-001.jpg', created_at: '2025-01-10T08:00:00Z' },
      },
      {
        method: 'POST', path: '/api/v1/products', summary: 'Crear producto',
        auth: true, roles: ['admin', 'operador'],
        description: 'Crea un nuevo producto. Requiere rol admin u operador.',
        body: { name: 'Nuevo Producto', sku: 'SKU-001', price: 99.99, stock: 0, category: 'Electrónica', description: 'Descripción...' },
        response: { id: 50, name: 'Nuevo Producto', sku: 'SKU-001', price: '99.99', stock: 0, is_active: true },
      },
      {
        method: 'PUT', path: '/api/v1/products/{id}', summary: 'Actualizar producto',
        auth: true, roles: ['admin', 'operador'],
        description: 'Actualiza todos los campos de un producto existente.',
        body: { name: 'Nombre actualizado', price: 109.99 },
        response: { id: 50, name: 'Nombre actualizado', price: '109.99' },
      },
      {
        method: 'DELETE', path: '/api/v1/products/{id}', summary: 'Eliminar producto',
        auth: true, roles: ['admin'],
        description: 'Elimina un producto. Solo accesible para administradores.',
        response: null,
      },
      {
        method: 'POST', path: '/api/v1/products/{id}/image', summary: 'Subir imagen',
        auth: true, roles: ['admin', 'operador'],
        description: 'Sube una imagen al almacenamiento (S3/Azure Blob). Tipo: multipart/form-data. Formatos: JPG, PNG, WebP. Máx: 5 MB.',
        body: '{ image: <archivo_binario> }',
        response: { image_url: 'https://storage.example.com/products/abc123.jpg' },
      },
    ],
  },
  {
    group: 'Proveedores',
    color: 'purple',
    items: [
      {
        method: 'GET', path: '/api/v1/suppliers', summary: 'Listar proveedores', auth: true,
        description: 'Lista todos los proveedores con soporte de búsqueda y paginación.',
        params: { page: 1, search: '(opcional)', is_active: 'true|false' },
        response: { count: 34, results: [{ id: 1, name: 'TechDistrib SA', rfc: 'TDI123ABC', email: 'ventas@tech.mx', is_active: true }] },
      },
      {
        method: 'POST', path: '/api/v1/suppliers', summary: 'Crear proveedor', auth: true, roles: ['admin', 'operador'],
        description: 'Crea un nuevo proveedor con validación de RFC y email.',
        body: { name: 'Proveedor XYZ', rfc: 'PXY123456ABC', email: 'contacto@proveedor.com', phone: '+52551234567' },
        response: { id: 10, name: 'Proveedor XYZ', is_active: true },
      },
    ],
  },
  {
    group: 'Recepciones (Stock)',
    color: 'emerald',
    items: [
      {
        method: 'GET', path: '/api/v1/receptions', summary: 'Log de recepciones', auth: true,
        description: 'Lista el historial completo de entradas de inventario con opción de filtrar por producto.',
        params: { page: 1, product: '(id, opcional)', page_size: 15 },
        response: { count: 89, results: [{ id: 1, product_name: 'Monitor LG', quantity: 20, received_at: '2025-04-20T10:30:00Z', batch: 'LOT-001', operator: 'operador1' }] },
      },
      {
        method: 'POST', path: '/api/v1/receptions', summary: 'Registrar entrada', auth: true, roles: ['admin', 'operador'],
        description: 'Registra una recepción de mercancía. El stock del producto se incrementa automáticamente. Se guarda trazabilidad completa (operador, lote, proveedor, fecha).',
        body: { product_id: 1, supplier_id: 2, quantity: 50, batch: 'LOT-2025-04', notes: 'Entrega conforme' },
        response: { id: 30, product_name: 'Monitor LG', quantity: 50, received_at: '2025-04-20T11:00:00Z', new_stock: 65 },
      },
    ],
  },
  {
    group: 'Usuarios',
    color: 'orange',
    items: [
      {
        method: 'GET', path: '/api/v1/users', summary: 'Listar usuarios', auth: true, roles: ['admin'],
        description: 'Lista todos los usuarios del sistema. Solo administradores.',
        params: { scope: 'internal|public', is_active: 'true|false', search: '(opcional)' },
        response: { count: 12, results: [{ id: 1, name: 'Admin', email: 'admin@empresa.com', role: 'admin', scope: 'internal', is_active: true }] },
      },
      {
        method: 'PATCH', path: '/api/v1/users/{id}/status', summary: 'Bloquear / Desbloquear', auth: true, roles: ['admin'],
        description: 'Cambia el estado activo/bloqueado de un usuario.',
        body: { is_active: false },
        response: { id: 5, is_active: false },
      },
    ],
  },
]

const METHOD_STYLES = {
  GET: 'bg-blue-100 text-blue-700 border border-blue-200',
  POST: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  PUT: 'bg-amber-100 text-amber-700 border border-amber-200',
  PATCH: 'bg-purple-100 text-purple-700 border border-purple-200',
  DELETE: 'bg-red-100 text-red-700 border border-red-200',
}

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-emerald-50 border-emerald-200',
  purple: 'bg-purple-50 border-purple-200',
  emerald: 'bg-teal-50 border-teal-200',
  orange: 'bg-orange-50 border-orange-200',
}

function EndpointCard({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-3">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wider ${METHOD_STYLES[item.method]}`}>{item.method}</span>
        <code className="text-sm font-mono text-slate-700 flex-1">{item.path}</code>
        <span className="text-sm text-slate-500 hidden sm:block">{item.summary}</span>
        {item.auth && <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500">🔐 JWT</span>}
        {item.roles && <span className="text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-600">{item.roles.join(', ')}</span>}
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
          <p className="text-sm text-slate-600">{item.description}</p>
          {item.params && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Query Params</p>
              <pre className="bg-slate-800 text-green-300 text-xs p-3 rounded-lg overflow-x-auto">{JSON.stringify(item.params, null, 2)}</pre>
            </div>
          )}
          {item.body && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Body</p>
              <pre className="bg-slate-800 text-blue-300 text-xs p-3 rounded-lg overflow-x-auto">
                {typeof item.body === 'string' ? item.body : JSON.stringify(item.body, null, 2)}
              </pre>
            </div>
          )}
          {item.response !== undefined && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Response {item.response === null ? '204 No Content' : '200 OK'}
              </p>
              {item.response !== null && (
                <pre className="bg-slate-800 text-emerald-300 text-xs p-3 rounded-lg overflow-x-auto">{JSON.stringify(item.response, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium">v1</span>
            <span className="text-slate-400 text-sm">REST API · JSON · JWT Auth</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">API Documentation</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Documentación completa de la API del Sistema de Inventario. Base URL: <code className="bg-slate-700 px-2 py-0.5 rounded text-blue-300">/api/v1</code>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">🔐 OAuth2 / JWT</span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">⏱️ Rate Limiting: 100 req/min</span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">📄 JSON Responses</span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">🔄 Versionado: /api/v1/</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Auth header guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-blue-800 mb-3">🔐 Autenticación</h2>
          <p className="text-sm text-blue-700 mb-3">Incluye el token en el header de cada solicitud protegida:</p>
          <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded-lg overflow-x-auto">Authorization: Bearer {'<access_token>'}</pre>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-blue-700">
            <div className="bg-white border border-blue-100 rounded-lg p-3">
              <p className="font-semibold mb-1">API Key (externo)</p>
              <code className="text-xs">X-API-Key: {'<key>'}</code>
            </div>
            <div className="bg-white border border-blue-100 rounded-lg p-3">
              <p className="font-semibold mb-1">Bearer JWT</p>
              <code className="text-xs">Authorization: Bearer ...</code>
            </div>
            <div className="bg-white border border-blue-100 rounded-lg p-3">
              <p className="font-semibold mb-1">OAuth2 (portal)</p>
              <code className="text-xs">scope: public / internal</code>
            </div>
          </div>
        </div>

        {/* HTTP codes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-slate-800 mb-4">Códigos de respuesta HTTP</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              { code: '200', label: 'OK', desc: 'Éxito', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { code: '201', label: 'Created', desc: 'Recurso creado', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { code: '204', label: 'No Content', desc: 'Eliminado', cls: 'text-slate-600 bg-slate-50 border-slate-200' },
              { code: '400', label: 'Bad Request', desc: 'Datos inválidos', cls: 'text-orange-600 bg-orange-50 border-orange-200' },
              { code: '401', label: 'Unauthorized', desc: 'Sin token', cls: 'text-red-600 bg-red-50 border-red-200' },
              { code: '403', label: 'Forbidden', desc: 'Sin permisos', cls: 'text-red-600 bg-red-50 border-red-200' },
              { code: '404', label: 'Not Found', desc: 'No existe', cls: 'text-slate-600 bg-slate-50 border-slate-200' },
              { code: '429', label: 'Rate Limited', desc: '100 req/min excedido', cls: 'text-purple-600 bg-purple-50 border-purple-200' },
            ].map(h => (
              <div key={h.code} className={`border rounded-lg p-3 ${h.cls}`}>
                <p className="font-bold text-lg">{h.code}</p>
                <p className="font-medium text-xs">{h.label}</p>
                <p className="text-xs opacity-75">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rate limiting */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-amber-800 mb-2">⏱️ Rate Limiting</h2>
          <p className="text-sm text-amber-700">
            Máximo <strong>100 solicitudes por minuto</strong> por IP/token. Las respuestas incluyen los headers:
          </p>
          <pre className="bg-slate-900 text-yellow-300 text-xs p-3 rounded-lg mt-3 overflow-x-auto">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1714000860`}
          </pre>
        </div>

        {/* Error format */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-slate-800 mb-3">Formato de errores JSON</h2>
          <pre className="bg-slate-900 text-red-300 text-xs p-4 rounded-lg overflow-x-auto">{JSON.stringify({ detail: 'Descripción del error', code: 'error_code', field_errors: { email: ['Este campo es requerido.'], price: ['Debe ser un número positivo.'] } }, null, 2)}</pre>
        </div>

        {/* Endpoints */}
        {ENDPOINTS.map(group => (
          <section key={group.group} className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className={`w-2 h-6 rounded-full ${group.color === 'blue' ? 'bg-blue-500' : group.color === 'green' ? 'bg-emerald-500' : group.color === 'purple' ? 'bg-purple-500' : group.color === 'orange' ? 'bg-orange-500' : 'bg-teal-500'}`}></span>
              {group.group}
            </h2>
            {group.items.map((item, i) => <EndpointCard key={i} item={item} />)}
          </section>
        ))}

        {/* OpenAPI hint */}
        <div className="bg-slate-800 text-white rounded-2xl p-6 text-center">
          <h2 className="font-bold text-lg mb-2">📋 OpenAPI / Swagger</h2>
          <p className="text-slate-300 text-sm mb-4">
            La especificación completa OpenAPI 3.0 (generada automáticamente por Django REST Framework) está disponible en:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <code className="bg-slate-700 px-4 py-2 rounded-lg text-blue-300 text-sm">/api/schema/</code>
            <code className="bg-slate-700 px-4 py-2 rounded-lg text-blue-300 text-sm">/api/schema/swagger-ui/</code>
            <code className="bg-slate-700 px-4 py-2 rounded-lg text-blue-300 text-sm">/api/schema/redoc/</code>
          </div>
        </div>
      </div>
    </div>
  )
}
