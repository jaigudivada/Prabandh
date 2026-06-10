import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import LoadingOverlay from './components/LoadingOverlay';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Role-specific pages
import UserDashboard from './pages/UserDashboard';
import IssueForm from './pages/IssueForm';
import IssueDetail from './pages/IssueDetail';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import IssuesList from './pages/IssuesList';

// Role-specific dashboards
import OfficialDashboard from './pages/OfficialDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WebsiteReports from './pages/WebsiteReports';

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'SUPERVISOR') return <Navigate to="/supervisor" replace />;
  if (role === 'OFFICIAL') return <Navigate to="/official" replace />;
  return <Navigate to="/" replace />;
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay message="Initializing portal…" />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <RoleBasedRedirect /> : <Login />} />
          <Route path="/register" element={user ? <RoleBasedRedirect /> : <Register />} />

          {/* Protected routes wrapped in Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* User routes */}
            <Route path="/" element={<ProtectedRoute roles={['USER']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/issues/new" element={<ProtectedRoute roles={['USER', 'SUPERVISOR']}><IssueForm /></ProtectedRoute>} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Official routes */}
            <Route path="/official" element={<ProtectedRoute roles={['OFFICIAL']}><OfficialDashboard /></ProtectedRoute>} />
            <Route path="/official/reports" element={<ProtectedRoute roles={['OFFICIAL']}><Reports /></ProtectedRoute>} />
            <Route path="/official/issues" element={<ProtectedRoute roles={['OFFICIAL']}><IssuesList /></ProtectedRoute>} />
            <Route path="/official/issues/:id" element={<IssueDetail />} />
            <Route path="/official/profile" element={<Profile />} />
            <Route path="/official/settings" element={<Settings />} />

            {/* Supervisor routes */}
            <Route path="/supervisor" element={<ProtectedRoute roles={['SUPERVISOR']}><SupervisorDashboard /></ProtectedRoute>} />
            <Route path="/supervisor/reports" element={<ProtectedRoute roles={['SUPERVISOR']}><Reports /></ProtectedRoute>} />
            <Route path="/supervisor/issues" element={<ProtectedRoute roles={['SUPERVISOR']}><IssuesList /></ProtectedRoute>} />
            <Route path="/supervisor/issues/:id" element={<IssueDetail />} />
            <Route path="/supervisor/profile" element={<Profile />} />
            <Route path="/supervisor/settings" element={<Settings />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/website-reports" element={<ProtectedRoute roles={['ADMIN']}><WebsiteReports /></ProtectedRoute>} />
            <Route path="/admin/issues/:id" element={<ProtectedRoute roles={['ADMIN']}><IssueDetail /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />

            {/* Reports - accessible by admin and official */}
            <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'OFFICIAL']}><Reports /></ProtectedRoute>} />
          </Route>

          {/* Catch-all - redirect based on role */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}