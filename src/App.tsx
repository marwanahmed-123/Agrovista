import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import NotFound from './pages/NotFound';
import { authService } from './services/authService';
import Login from './pages/Login';

import VerifyEmail from './pages/VerifyEmail';
import ParcelList from './pages/ParcelList';
import ParcelDetails from './pages/ParcelDetails';
import CreateParcel from './pages/CreateParcel';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingParcels from './pages/admin/PendingParcels';
import ApprovedParcels from './pages/admin/ApprovedParcels';
import Users from './pages/admin/Users';
import Crops from './pages/admin/Crops';
import CreateAdmin from './pages/admin/CreateAdmin';
import ChangePassword from './pages/admin/ChangePassword';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!authService.isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  if (authService.mustChangePassword() && location.pathname !== "/admin/change-password") {
    return <Navigate to="/admin/change-password" replace />;
  }

  return <>{children}</>;
}

function PageTitleSetter() {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/login': 'Login',

      '/verify-email': 'Verify Email',
      '/admin': 'Dashboard',
      '/admin/pending-parcels': 'Pending Parcels',
      '/admin/approved-parcels': 'Approved Parcels',
      '/admin/users': 'Users',
      '/admin/crops': 'Crops',
      '/admin/create-admin': 'Create Admin',
      '/admin/change-password': 'Change Password',
      '/parcels': 'Parcels',
      '/parcels/create': 'Create Parcel',
    };

    const path = location.pathname;
    const title = titles[path];

    if (title) {
      document.title = `Agrovista - ${title}`;
    } else if (path.startsWith('/parcels/') && path.endsWith('/edit')) {
      document.title = 'Agrovista - Edit Parcel';
    } else if (path.startsWith('/parcels/')) {
      document.title = 'Agrovista - Parcel Details';
    } else {
      document.title = 'Agrovista';
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageTitleSetter />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="pending-parcels" element={<PendingParcels />} />
          <Route path="approved-parcels" element={<ApprovedParcels />} />
          <Route path="users" element={<Users />} />
          <Route path="crops" element={<Crops />} />
          <Route path="create-admin" element={<CreateAdmin />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
        <Route
          path="/parcels"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<ParcelList />} />
          <Route path="create" element={<CreateParcel />} />
          <Route path=":id" element={<ParcelDetails />} />
          <Route path=":id/edit" element={<CreateParcel />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;