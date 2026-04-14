import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterFarmerAssociation from './pages/RegisterFarmerAssociation';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import ExtensionWorkerDashboard from './pages/ExtensionWorkerDashboard';
import HeadDashboard from './pages/HeadDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import GovernorDashboard from './pages/GovernorDashboard';
import LivestockPage from './pages/livestock/LivestockPage';
import SplashScreen from './pages/SplashScreen';

// Redirect user based on role
function getDashboardByRole(role) {
  switch (role?.trim()) { // trim to remove extra spaces
    case "Admin": return "/admin";
    case "Program Coordinator": return "/coordinator";
    case "Agriculture Extension Worker": return "/extension-worker";
    case "Head of the Office": return "/head";
    case "Farmer Association Representative": return "/farmer";
    case "Governor Assistant": return "/governor-assistant"; // match your route
    default: return "/login";
  }
}

// Private Route
function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" />;

  // If role doesn't match it will redirect to correct dashboard
  if (allowedRole && role?.trim() !== allowedRole) {
    return <Navigate to={getDashboardByRole(role)} />;
  }

  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-farmer-association" element={<RegisterFarmerAssociation />} />

        {/* Auto redirect root based on role */}
        <Route path="/" element={
          token ? <Navigate to={getDashboardByRole(role)} /> : <Navigate to="/login" />
        } />

        {/* Dashboards */}
        <Route path="/admin" element={
          <PrivateRoute allowedRole="Admin">
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/coordinator" element={
          <PrivateRoute allowedRole="Program Coordinator">
            <CoordinatorDashboard />
          </PrivateRoute>
        } />

        <Route path="/coordinator/livestock" element={
          <PrivateRoute allowedRole="Program Coordinator">
            <LivestockPage />
          </PrivateRoute>
        } />

        <Route path="/extension-worker" element={
          <PrivateRoute allowedRole="Agriculture Extension Worker">
            <ExtensionWorkerDashboard />
          </PrivateRoute>
        } />

        <Route path="/head" element={
          <PrivateRoute allowedRole="Head of the Office">
            <HeadDashboard />
          </PrivateRoute>
        } />

        <Route path="/farmer" element={
          <PrivateRoute allowedRole="Farmer Association Representative">
            <FarmerDashboard />
          </PrivateRoute>
        } />

        <Route path="/governor-assistant" element={
          <PrivateRoute allowedRole="Governor Assistant">
            <GovernorDashboard />
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
