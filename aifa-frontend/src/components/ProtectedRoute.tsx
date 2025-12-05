import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingPage from './LoadingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { isAuthenticated, usuario, loading } = useAuth();

  if (loading) return <LoadingPage />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRoles.length > 0 && usuario && !requiredRoles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
