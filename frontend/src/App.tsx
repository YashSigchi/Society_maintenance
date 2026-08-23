import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminLogin } from './pages/auth/AdminLogin';
import { ChangePassword } from './pages/auth/ChangePassword';
import { Toaster } from './components/ui/toaster';
import { ResidentDashboard } from './pages/resident/Dashboard';
import { Complaints } from './pages/resident/Complaints';
import { RaiseComplaint } from './pages/resident/RaiseComplaint';
import { ComplaintDetail } from './pages/resident/ComplaintDetail';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminComplaints } from './pages/admin/Complaints';
import { AdminNotices } from './pages/admin/Notices';
import { AdminManagement } from './pages/admin/AdminManagement';
import { NoticeBoard } from './pages/shared/NoticeBoard';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>

          <Route element={<MainLayout />}>
            <Route path="/resident/dashboard" element={<ResidentDashboard />} />
            <Route path="/resident/complaints" element={<Complaints />} />
            <Route path="/resident/complaints/new" element={<RaiseComplaint />} />
            <Route path="/resident/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/notices" element={<NoticeBoard />} />

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/management" element={<AdminManagement />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
