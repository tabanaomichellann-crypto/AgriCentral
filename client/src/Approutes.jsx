import { Routes, Route, Navigate } from 'react-router-dom';

import Login                from '../pages/Login';
import AdminDashboard       from '../pages/AdminDashboard';
import CoordinatorDashboard from '../pages/CoordinatorDashboard';
import GovernorDashboard    from '../pages/GovernorDashboard';
import HeadDashboard        from '../pages/HeadDashboard';
import FarmerDashboard      from '../pages/FarmerDashboard';
import ExtensionWorkerDashboard from '../pages/ExtensionWorkerDashboard';

// Equipment sub-pages (each dashboard embeds these via its own tab/nav)
import EquipmentPage        from '../pages/equipment/EquipmentPage';
import EquipmentRequestPage from '../pages/equipment/EquipmentRequestPage';
import ConditionLogPage     from '../pages/equipment/ConditionLogPage';
import CropPage             from '../pages/crop/CropPage';

// Auth guard — redirects to /login if no token
function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route path="/admin/*" element={
        <PrivateRoute roles={['Admin']}>
          <AdminDashboard />
        </PrivateRoute>
      } />

      {/* Program Coordinator — full equipment CRUD + validate logs */}
      <Route path="/coordinator/*" element={
        <PrivateRoute roles={['Program Coordinator']}>
          <CoordinatorDashboard />
        </PrivateRoute>
      }>
        <Route path="equipment"         element={<EquipmentPage />} />
        <Route path="equipment/requests" element={<EquipmentRequestPage />} />
        <Route path="equipment/logs"     element={<ConditionLogPage />} />
        <Route path="crops"             element={<CropPage />} />
      </Route>

      {/* Governor — approve/reject requests (first gate) */}
      <Route path="/governor/*" element={
        <PrivateRoute roles={['Governor Assistant']}>
          <GovernorDashboard />
        </PrivateRoute>
      }>
        <Route path="equipment/requests" element={<EquipmentRequestPage />} />
      </Route>

      {/* Head of Office — second approval + inventory view */}
      <Route path="/head/*" element={
        <PrivateRoute roles={['Head of the Office']}>
          <HeadDashboard />
        </PrivateRoute>
      }>
        <Route path="equipment"          element={<EquipmentPage />} />
        <Route path="equipment/requests" element={<EquipmentRequestPage />} />
      </Route>

      {/* Farmer / Association Rep — view inventory + submit requests */}
      <Route path="/farmer/*" element={
        <PrivateRoute roles={['Farmer Association Representative']}>
          <FarmerDashboard />
        </PrivateRoute>
      }>
        <Route path="equipment"          element={<EquipmentPage />} />
        <Route path="equipment/requests" element={<EquipmentRequestPage />} />
      </Route>

      {/* Extension Worker — field inspection + condition logs */}
      <Route path="/extension-worker/*" element={
        <PrivateRoute roles={['Agriculture Extension Worker']}>
          <ExtensionWorkerDashboard />
        </PrivateRoute>
      }>
        <Route path="equipment/logs" element={<ConditionLogPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}