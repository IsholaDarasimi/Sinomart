import * as React from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import { QueryClientProvider } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'

import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/context/AuthProvider'
import { ToastProvider } from '@/components/ui/toast'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import {
  RequireAuth,
  RequireAdmin,
} from '@/components/layout/RouteGuards'

// -----------------------------------------------------------------------------------
// Route-level code splitting
// -----------------------------------------------------------------------------------

const HomePage = React.lazy(() =>
  import('@/pages/HomePage').then((module) => ({
    default: module.HomePage,
  })),
)

const ShopPage = React.lazy(() =>
  import('@/pages/ShopPage').then((module) => ({
    default: module.ShopPage,
  })),
)

const ProductPage = React.lazy(() =>
  import('@/pages/ProductPage').then((module) => ({
    default: module.ProductPage,
  })),
)

const CartPage = React.lazy(() =>
  import('@/pages/CartPage').then((module) => ({
    default: module.CartPage,
  })),
)

const SearchPage = React.lazy(() =>
  import('@/pages/SearchPage').then((module) => ({
    default: module.SearchPage,
  })),
)

const CheckoutPage = React.lazy(() =>
  import('@/pages/checkout/CheckoutPage').then((module) => ({
    default: module.CheckoutPage,
  })),
)

const CheckoutCallbackPage = React.lazy(() =>
  import('@/pages/checkout/CheckoutCallbackPage').then((module) => ({
    default: module.CheckoutCallbackPage,
  })),
)

const OrderSuccessPage = React.lazy(() =>
  import('@/pages/OrderSuccessPage').then((module) => ({
    default: module.OrderSuccessPage,
  })),
)

// -----------------------------------------------------------------------------------
// Authentication pages
// -----------------------------------------------------------------------------------

const LoginPage = React.lazy(() =>
  import('@/pages/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

const SignupPage = React.lazy(() =>
  import('@/pages/auth/SignupPage').then((module) => ({
    default: module.SignupPage,
  })),
)

const PasswordPages = React.lazy(() =>
  import('@/pages/auth/PasswordPages').then((module) => ({
    default: function PasswordPages() {
      const pathname = window.location.pathname

      if (pathname === '/reset-password') {
        return <module.ResetPasswordPage />
      }

      return <module.ForgotPasswordPage />
    },
  })),
)

// -----------------------------------------------------------------------------------
// Account pages
// -----------------------------------------------------------------------------------

const AccountLayout = React.lazy(() =>
  import('@/pages/account/AccountLayout').then((module) => ({
    default: module.AccountLayout,
  })),
)

const ProfilePage = React.lazy(() =>
  import('@/pages/account/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)

const OrdersPages = React.lazy(() =>
  import('@/pages/account/OrdersPages').then((module) => ({
    default: function OrdersPages() {
      const pathname = window.location.pathname

      if (
        pathname.includes('/account/orders/') &&
        pathname !== '/account/orders/'
      ) {
        return <module.OrderDetailPage />
      }

      return <module.OrdersListPage />
    },
  })),
)

const SavedProductsPage = React.lazy(() =>
  import('@/pages/account/SavedProductsPage').then((module) => ({
    default: module.SavedProductsPage,
  })),
)

const AddressesPage = React.lazy(() =>
  import('@/pages/account/AddressesPage').then((module) => ({
    default: module.AddressesPage,
  })),
)

const InboxPage = React.lazy(() =>
  import('@/pages/account/InboxPage').then((module) => ({
    default: module.InboxPage,
  })),
)

const SecurityPage = React.lazy(() =>
  import('@/pages/account/SecurityPage').then((module) => ({
    default: module.SecurityPage,
  })),
)

const MyReviewsPage = React.lazy(() =>
  import('@/pages/account/MyReviewsPage').then((module) => ({
    default: module.MyReviewsPage,
  })),
)

// -----------------------------------------------------------------------------------
// Admin pages
// -----------------------------------------------------------------------------------

const AdminOverviewPage = React.lazy(() =>
  import('@/pages/admin/AdminOverviewPage').then((module) => ({
    default: module.AdminOverviewPage,
  })),
)

const AdminProductsPage = React.lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((module) => ({
    default: module.AdminProductsPage,
  })),
)

const AdminProductEditPage = React.lazy(() =>
  import('@/pages/admin/AdminProductEditPage').then((module) => ({
    default: module.AdminProductEditPage,
  })),
)

const AdminImportsPage = React.lazy(() =>
  import('@/pages/admin/AdminImportsPage').then((module) => ({
    default: module.AdminImportsPage,
  })),
)

const AdminOrdersPage = React.lazy(() =>
  import('@/pages/admin/AdminOrdersPage').then((module) => ({
    default: module.AdminOrdersPage,
  })),
)

const AdminOrderDetailPage = React.lazy(() =>
  import('@/pages/admin/AdminOrderDetailPage').then((module) => ({
    default: module.AdminOrderDetailPage,
  })),
)

const AdminCustomersPage = React.lazy(() =>
  import('@/pages/admin/AdminCustomersPage').then((module) => ({
    default: module.AdminCustomersPage,
  })),
)

const AdminReviewsPage = React.lazy(() =>
  import('@/pages/admin/AdminReviewsPage').then((module) => ({
    default: module.AdminReviewsPage,
  })),
)

const AdminCouponsPage = React.lazy(() =>
  import('@/pages/admin/AdminCouponsPage').then((module) => ({
    default: module.AdminCouponsPage,
  })),
)

const AdminCampaignsPage = React.lazy(() =>
  import('@/pages/admin/AdminCampaignsPage').then((module) => ({
    default: module.AdminCampaignsPage,
  })),
)

const AdminBannersPage = React.lazy(() =>
  import('@/pages/admin/AdminBannersPage').then((module) => ({
    default: module.AdminBannersPage,
  })),
)

const AdminSettingsPage = React.lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((module) => ({
    default: module.AdminSettingsPage,
  })),
)

const NotFoundPage = React.lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
)

// -----------------------------------------------------------------------------------
// Scroll restoration
// -----------------------------------------------------------------------------------

function ScrollToTop() {
  const { pathname } = useLocation()

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// -----------------------------------------------------------------------------------
// Sinomart branded loader
// -----------------------------------------------------------------------------------

function SinomartCartOrbit() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute h-24 w-24 rounded-full bg-brand-500/10 blur-2xl"
      />

      <div
        aria-hidden="true"
        className="absolute h-24 w-24 rounded-full border border-brand-500/15"
      />

      <div
        aria-hidden="true"
        className="absolute h-24 w-24 animate-[spin_1.8s_linear_infinite] rounded-full border border-transparent border-t-brand-500 border-r-brand-400"
      >
        <span className="absolute -right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(34,197,94,0.55)]" />
      </div>

      <div
        aria-hidden="true"
        className="absolute h-16 w-16 animate-pulse rounded-full bg-brand-500/5"
      />

      <ShoppingCart
        aria-hidden="true"
        className="relative z-10 h-8 w-8 animate-pulse text-brand-500"
        strokeWidth={2.2}
      />
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-white"
      role="status"
      aria-label="Loading Sinomart"
    >
      <SinomartCartOrbit />
    </div>
  )
}

// -----------------------------------------------------------------------------------
// Route loading fallback
// -----------------------------------------------------------------------------------

function RouteLoadingFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center bg-white"
      role="status"
      aria-label="Loading page"
    >
      <SinomartCartOrbit />
    </div>
  )
}

// -----------------------------------------------------------------------------------
// Application content
// -----------------------------------------------------------------------------------

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <FullScreenLoader />
  }

  return (
    <>
      <ScrollToTop />

      <React.Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* ----------------------------------------------------------------------- */}
          {/* Authentication */}
          {/* These routes intentionally live OUTSIDE StorefrontLayout.              */}
          {/* ----------------------------------------------------------------------- */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/forgot-password"
            element={<PasswordPages />}
          />

          <Route
            path="/reset-password"
            element={<PasswordPages />}
          />

          {/* ----------------------------------------------------------------------- */}
          {/* Storefront */}
          {/* ----------------------------------------------------------------------- */}

          <Route element={<StorefrontLayout />}>
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/shop"
              element={<ShopPage />}
            />

            <Route
              path="/search"
              element={<SearchPage />}
            />

            <Route
              path="/product/:slug"
              element={<ProductPage />}
            />

            <Route
              path="/cart"
              element={<CartPage />}
            />

            <Route
              path="/checkout"
              element={<CheckoutPage />}
            />

            <Route
              path="/checkout/callback"
              element={<CheckoutCallbackPage />}
            />

            <Route
              path="/order-success/:orderNumber"
              element={<OrderSuccessPage />}
            />

            {/* --------------------------------------------------------------------- */}
            {/* Account */}
            {/* --------------------------------------------------------------------- */}

            <Route element={<RequireAuth />}>
              <Route
                path="/account"
                element={<AccountLayout />}
              >
                <Route
                  index
                  element={<ProfilePage />}
                />

                <Route
                  path="orders"
                  element={<OrdersPages />}
                />

                <Route
                  path="orders/:orderNumber"
                  element={<OrdersPages />}
                />

                <Route
                  path="saved"
                  element={<SavedProductsPage />}
                />

                <Route
                  path="addresses"
                  element={<AddressesPage />}
                />

                <Route
                  path="inbox"
                  element={<InboxPage />}
                />

                <Route
                  path="security"
                  element={<SecurityPage />}
                />

                <Route
                  path="reviews"
                  element={<MyReviewsPage />}
                />
              </Route>
            </Route>

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Route>

          {/* ----------------------------------------------------------------------- */}
          {/* Admin */}
          {/* ----------------------------------------------------------------------- */}

          <Route element={<RequireAdmin />}>
            <Route
              path="/admin"
              element={<AdminLayout />}
            >
              <Route
                index
                element={<AdminOverviewPage />}
              />

              <Route
                path="products"
                element={<AdminProductsPage />}
              />

              <Route
                path="products/:productId"
                element={<AdminProductEditPage />}
              />

              <Route
                path="imports"
                element={<AdminImportsPage />}
              />

              <Route
                path="orders"
                element={<AdminOrdersPage />}
              />

              <Route
                path="orders/:orderId"
                element={<AdminOrderDetailPage />}
              />

              <Route
                path="customers"
                element={<AdminCustomersPage />}
              />

              <Route
                path="reviews"
                element={<AdminReviewsPage />}
              />

              <Route
                path="coupons"
                element={<AdminCouponsPage />}
              />

              <Route
                path="campaigns"
                element={<AdminCampaignsPage />}
              />

              <Route
                path="banners"
                element={<AdminBannersPage />}
              />

              <Route
                path="settings"
                element={<AdminSettingsPage />}
              />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </>
  )
}

// -----------------------------------------------------------------------------------
// App
// -----------------------------------------------------------------------------------

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}