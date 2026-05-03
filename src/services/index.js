import api from './api'

// ─── Products ───────────────────────────────────────────────────────────────

export const productService = {
  list:   (params) => api.get('/products', { params }),
  get:    (id)     => api.get(`/products/${id}`),
  create: (data)   => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  remove: (id)     => api.delete(`/products/${id}`),

  /** Upload product image – multipart/form-data */
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post(`/products/${id}/image`, form)
  },
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const supplierService = {
  list:   (params)    => api.get('/suppliers', { params }),
  get:    (id)        => api.get(`/suppliers/${id}`),
  create: (data)      => api.post('/suppliers', data),
  update: (id, data)  => api.put(`/suppliers/${id}`, data),
  remove: (id)        => api.delete(`/suppliers/${id}`),
}

export const categoryService = {
  list:   (params)    => api.get('/categories', { params }),
  get:    (id)        => api.get(`/categories/${id}`),
  create: (data)      => api.post('/categories', data),
  update: (id, data)  => api.put(`/categories/${id}`, data),
  remove: (id)        => api.delete(`/categories/${id}`),
}

// ─── Stock Reception ─────────────────────────────────────────────────────────

export const receptionService = {
  list:   (params) => api.get('/receptions', { params }),
  get:    (id)     => api.get(`/receptions/${id}`),
  create: (data)   => api.post('/receptions', data), // increments stock
}

// ─── Users (internal admin) ──────────────────────────────────────────────────

export const userService = {
  list:   (params)   => api.get('/users', { params }),
  get:    (id)       => api.get(`/users/${id}`),
  create: (data)     => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  remove: (id)       => api.delete(`/users/${id}`),
  setActive: (id, active) => api.patch(`/users/${id}/status`, { is_active: active }),
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  login:    (credentials) => api.post('/auth/login', credentials),
  refresh:  (refresh)     => api.post('/auth/refresh', { refresh }),
  logout:   (refresh)     => api.post('/auth/logout', { refresh }),
  register: (payload)     => api.post('/auth/register', payload),
  me:       ()            => api.get('/auth/me'),
}

// ─── Public Catalog (Portal) ─────────────────────────────────────────────────

export const catalogService = {
  list: (params) => api.get('/products', { params }),
  get:  (id)     => api.get(`/products/${id}`),
}

// ─── Orders (Portal Checkout) ───────────────────────────────────────────────

export const orderService = {
  create: (data) => api.post('/orders', data),
}
