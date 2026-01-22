import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuickUpdate } from './pages/QuickUpdate';
import { Login } from './pages/Login';
import { AllClients } from './pages/AllClients';
import { ClientPage } from './pages/ClientPage';
import { Finance } from './pages/Finance';
import { Events } from './pages/Events';
import { EventPage } from './pages/EventPage';
import { Suppliers } from './pages/Suppliers';
import { Quotes } from './pages/Quotes';
import { Forms } from './pages/Forms';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageUsers } from './pages/ManageUsers';
import { Archive } from './pages/Archive';
import { TimeTrackingReports } from './pages/TimeTrackingReports';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="quick_update" element={<QuickUpdate />} />
            <Route path="all_clients" element={<AllClients />} />
            <Route path="client/:clientId" element={<ClientPage />} />
            <Route path="finance" element={<Finance />} />
            <Route path="events" element={<Events />} />
            <Route path="event/:eventId" element={<EventPage />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="forms" element={<Forms />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/users" element={<ManageUsers />} />
            <Route path="archive" element={<Archive />} />
            <Route path="time_tracking" element={<TimeTrackingReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

