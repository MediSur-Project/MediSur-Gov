import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import theme from './theme/theme';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HospitalsPage from './pages/hospitals/HospitalsPage';
import HospitalForm from './pages/hospitals/HospitalForm';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import PatientsPage from './pages/patients/PatientsPage';
import PandemicTrackingPage from './pages/PandemicTrackingPage';

// Auth utilities
import { isAuthenticated } from './services/authService';

// For MVP: Set to true to enable direct access to dashboard without login
const ENABLE_DIRECT_DASHBOARD_ACCESS = true;

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated() && !ENABLE_DIRECT_DASHBOARD_ACCESS) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// Landing page redirector
const LandingPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (ENABLE_DIRECT_DASHBOARD_ACCESS || isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  return null;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={5000}
      >
        <Router>
          <Routes>
            {/* Root path redirects to either login or dashboard based on configuration */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Stealthy pandemic tracking page - direct route outside of DashboardLayout */}
            <Route 
              path="/pandemic-tracking" 
              element={
                <ProtectedRoute>
                  <PandemicTrackingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes with dashboard layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              
              {/* Hospital routes */}
              <Route path="hospitals" element={<HospitalsPage />} />
              <Route path="hospitals/new" element={<HospitalForm />} />
              <Route path="hospitals/edit/:id" element={<HospitalForm />} />
              
              {/* Appointment routes */}
              <Route path="appointments" element={<AppointmentsPage />} />
              
              {/* Patient routes */}
              <Route path="patients" element={<PatientsPage />} />
              
              {/* Redirect to dashboard if the route doesn't exist */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
