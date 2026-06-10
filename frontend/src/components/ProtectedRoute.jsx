import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getDefaultPath(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPERVISOR') return '/supervisor';
  if (role === 'OFFICIAL') return '/official';
  return '/';
}

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDefaultPath(user.role)} replace />;
  return children;
}

