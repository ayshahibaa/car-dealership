import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../common/StatusMessage.jsx';

/** Wrap a route's element: redirects to /login (preserving where you were headed) if not signed in. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

/** Wrap a route's element: requires sign-in AND the ADMIN role. Shown, not silently redirected, so a logged-in non-admin understands why. */
export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState title="Admins only">This page is restricted to admin accounts.</EmptyState>
      </div>
    );
  }
  return children;
}
