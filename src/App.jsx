import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth, RedirectIfAuth } from './components/guards/RouteGuards'

// Intranet
import IntranetLayout   from './layouts/IntranetLayout'
import Dashboard        from './pages/intranet/Dashboard'
import Products         from './pages/intranet/Products'
import ProductDetail    from './pages/intranet/ProductDetail'
import Suppliers        from './pages/intranet/Suppliers'
import Categories       from './pages/intranet/Categories'
import Reception        from './pages/intranet/Reception'
import Users            from './pages/intranet/Users'
import IntranetLogin    from './pages/intranet/IntranetLogin'

// Portal
import PortalLayout     from './layouts/PortalLayout'
import PortalHome       from './pages/portal/PortalHome'
import Catalog          from './pages/portal/Catalog'
import ProductPublic    from './pages/portal/ProductPublic'
import Checkout         from './pages/portal/Checkout'
import CheckoutSuccess  from './pages/portal/CheckoutSuccess'
import PortalLogin      from './pages/portal/PortalLogin'
import PortalRegister   from './pages/portal/PortalRegister'
import PortalOAuthCallback from './pages/portal/PortalOAuthCallback'

// API Docs
import ApiDocs          from './pages/api/ApiDocs'

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/portal" replace />} />

      {/* ─── Intranet Login ─────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <RedirectIfAuth to="/intranet/dashboard">
            <IntranetLogin />
          </RedirectIfAuth>
        }
      />

      {/* ─── Intranet (authenticated, internal roles) ──────────── */}
      <Route
        path="/intranet"
        element={
          <RequireAuth roles={['admin','operator']} >
            <IntranetLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="products"   element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers"  element={<Suppliers />} />
        <Route path="reception"  element={<Reception />} />
        <Route
          path="users"
          element={
            <RequireAuth roles={['admin']}>
              <Users />
            </RequireAuth>
          }
        />
      </Route>

      {/* ─── Portal public auth ─────────────────────────────────── */}
      <Route path="/portal/login"    element={<PortalLogin />} />
      <Route path="/portal/register" element={<PortalRegister />} />
      <Route path="/portal/oauth/callback" element={<PortalOAuthCallback />} />

      {/* ─── Portal (public read-only catalog) ─────────────────── */}
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<PortalHome />} />
        <Route path="catalog"      element={<Catalog />} />
        <Route path="catalog/:id"  element={<ProductPublic />} />
        <Route path="checkout"     element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
      </Route>

      {/* ─── API Documentation ──────────────────────────────────── */}
      <Route path="/api-docs" element={<ApiDocs />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
