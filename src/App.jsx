import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AppLayout from './components/layout/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CarDetailsPage from './pages/CarDetailsPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import SellCarPage from './pages/SellCarPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { CompareProvider } from './context/CompareContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RequireAdmin, RequireAuth } from './components/auth/RouteGuards.jsx';

/**
 * Route map. Every page renders inside AppLayout (navbar + footer).
 *   /             HomePage
 *   /cars         InventoryPage
 *   /cars/:id     CarDetailsPage (id = car UUID or stock number)
 *   /favorites    FavoritesPage
 *   /compare      ComparePage (ids come from CompareContext, mirrored to ?ids=)
 *   /cart         CartPage (adding/removing needs no login; sending requests does)
 *   /orders       OrdersPage (your own purchase requests — RequireAuth)
 *   /orders/:id   OrderDetailPage (one request's receipt/confirmation — RequireAuth)
 *   /sell         SellCarPage (any logged-in user — RequireAuth; listing is pending until an admin approves it)
 *   /login        LoginPage
 *   /register     RegisterPage
 *   /admin/login  AdminLoginPage (same backend login, but verifies the ADMIN role)
 *   /admin        AdminDashboardPage (ADMIN role only — RequireAdmin)
 *   anything else NotFoundPage
 */
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/cars', element: <InventoryPage /> },
      { path: '/cars/:id', element: <CarDetailsPage /> },
      { path: '/favorites', element: <FavoritesPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: '/orders/:id', element: <RequireAuth><OrderDetailPage /></RequireAuth> },
      { path: '/sell', element: <RequireAuth><SellCarPage /></RequireAuth> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/admin', element: <RequireAdmin><AdminDashboardPage /></RequireAdmin> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <CompareProvider>
            <RouterProvider router={router} />
          </CompareProvider>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
