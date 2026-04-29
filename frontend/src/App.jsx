import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import HomePage from './pages/HomePage';
import ReportIssuePage from './pages/ReportIssuePage';
import TrackIssuesPage from './pages/TrackIssuesPage';
import IssueDetailPage from './pages/IssueDetailPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIssueDetail from './pages/admin/AdminIssueDetail';
import AdminManagePage from './pages/admin/AdminManagePage';

// Layout
import AppLayout from './components/layout/AppLayout';

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="spinner" />
  </div>
);

// Citizen-only: redirect to /login if not logged in
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

// Admin-only: must be logged in AND have admin/authority role
// Key fix: we stay on the loading spinner until user state is fully resolved,
// so isAdmin is never evaluated against a stale null user after adminLogin.
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};

// Superadmin-only: regular admins get redirected back to /admin
const SuperadminRoute = ({ children }) => {
  const { user, loading, isSuperadmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isSuperadmin) return <Navigate to="/admin" replace />;
  return children;
};

// Public-only: redirect logged-in users away from /login and /register
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? children : <Navigate to="/home" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      {/* Admin login is NOT wrapped in PublicRoute — admins should always be able to reach it */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected citizen app */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/report" element={<ReportIssuePage />} />
        <Route path="/track" element={<TrackIssuesPage />} />
        <Route path="/track/:id" element={<IssueDetailPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
      </Route>

      {/* Admin portal */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/issues/:id" element={<AdminRoute><AdminIssueDetail /></AdminRoute>} />
      <Route path="/admin/manage" element={<SuperadminRoute><AdminManagePage /></SuperadminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#E07B2B', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
