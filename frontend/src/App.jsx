import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import MyAttendance from './pages/MyAttendance';
import Fees from './pages/Fees';
import Results from './pages/Results';
import Profile from './pages/Profile';
import Notices from './pages/Notices';
import Timetable from './pages/Timetable';
import Homework from './pages/Homework';
import Events from './pages/Events';
import Messages from './pages/Messages';
import ParentPortal from './pages/ParentPortal';
import SubmitTicket from './pages/SubmitTicket';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';

const App = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/events" element={<Events />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/results" element={<Results />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/my-results" element={<Results />} />
        
        {/* Issue Ticket general routes */}
        <Route path="/tickets/submit" element={<SubmitTicket />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
      </Route>

      <Route element={<ProtectedRoute roles={['parent']} />}>
        <Route path="/parent-portal" element={<ParentPortal />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/fees" element={<Fees />} />
      </Route>

      <Route element={<ProtectedRoute roles={['developer']} />}>
        <Route path="/tickets" element={<TicketList />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
