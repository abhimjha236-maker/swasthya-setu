import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/common/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { AshaDashboard } from './pages/AshaDashboard';
import { PhcDashboard } from './pages/PhcDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeleconsultationRoomPage } from './pages/TeleconsultationRoomPage';

import { ShieldCheck, Heart, Globe, Building2, PhoneCall, CheckCircle2 } from 'lucide-react';

// Protected Route Component with Strict Role Authorization
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and current user is not authorized, redirect to /unauthorized (403)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      {/* Main Government Navbar */}
      <Navbar />

      {/* Page Routing */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Patient Module - 10 Dedicated URLs */}
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="overview" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/profile" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="profile" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/records" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="records" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/consultations" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="consultations" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/referrals" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="referrals" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/medicines" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="medicines" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/appointments" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="appointments" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/followups" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="followups" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/schemes" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="schemes" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/notifications" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard initialTab="notifications" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/asha/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['asha']}>
                <AshaDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/phc/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['phc']}>
                <PhcDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hospital/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['hospital']}>
                <HospitalDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Alias Routes for Seamless Compatibility */}
          <Route path="/dashboard/patient" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/dashboard/asha" element={<Navigate to="/asha/dashboard" replace />} />
          <Route path="/dashboard/phc" element={<Navigate to="/phc/dashboard" replace />} />
          <Route path="/dashboard/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
          <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Live Teleconsultation Room */}
          <Route 
            path="/teleconsultation/:id" 
            element={
              <ProtectedRoute>
                <TeleconsultationRoomPage />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Government Health Platform Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>SWASTHYA SETU</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                National Rural Healthcare Continuum Platform bridging Patients, ASHA field workers, Primary Health Centres, and District Hospitals.
              </p>
              <div className="text-[10px] text-teal-400 font-mono">
                Smart India Hackathon 2026 Prototype
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Stakeholder Portals</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="/login" className="hover:text-teal-300 transition-colors">Patient Health Portal</a></li>
                <li><a href="/login" className="hover:text-teal-300 transition-colors">ASHA Worker Field App</a></li>
                <li><a href="/login" className="hover:text-teal-300 transition-colors">Primary Health Centre (PHC)</a></li>
                <li><a href="/login" className="hover:text-teal-300 transition-colors">District Hospital Referral Desk</a></li>
                <li><a href="/login" className="hover:text-teal-300 transition-colors">District CMHO Administration</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Public Health Standards</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> ABDM & ABHA Compliant</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> PM-JAY Ayushman Bharat</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> e-Sanjeevani Teleconsultation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> ICD-10 Diagnosis Encoding</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Emergency Helplines</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>National Emergency: <strong>112</strong></li>
                <li>National Ambulance Service: <strong>108</strong></li>
                <li>National Health Helpline: <strong>1075</strong></li>
                <li>Tele-MANAS Mental Health: <strong>14416</strong></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© 2026 Swasthya Setu Platform. Developed for Smart India Hackathon (SIH).</div>
            <div className="flex items-center gap-4">
              <span>Bhopal District Public Health Network</span>
              <span>•</span>
              <span className="text-teal-400">Government of India Inspired</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
