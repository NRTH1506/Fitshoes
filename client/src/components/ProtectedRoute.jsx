import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdminAccess = false }) {
  const { isLoggedIn, canAccessAdmin, isAuthReady } = useAuth();

  if (!isAuthReady) return null;

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (requireAdminAccess && !canAccessAdmin) return <Navigate to="/" replace />;

  return children;
}
