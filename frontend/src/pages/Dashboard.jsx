import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, parentAPI, noticeAPI, eventAPI, homeworkAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [noticeRes, eventRes, hwRes] = await Promise.all([
          noticeAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          eventAPI.getAll({ upcoming: 'true' }).catch(() => ({ data: { data: [] } })),
          homeworkAPI.getAll({ limit: 3 }).catch(() => ({ data: { data: [] } })),
        ]);
        setNotices(noticeRes.data.data || []);
        setEvents(eventRes.data.data || []);
        setHomework(hwRes.data.data || []);

        if (isAdmin) {
          const { data } = await dashboardAPI.getStats();
          setStats(data.data);
        } else if (isTeacher) {
          const { data } = await dashboardAPI.getTeacher();
          setStats(data.data);
        } else if (isStudent) {
          const { data } = await dashboardAPI.getStudent();
          setStats(data.data);
        } else if (isParent) {
          const { data } = await parentAPI.getDashboard();
          setStats(data.data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdmin, isTeacher, isStudent, isParent]);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 capitalize">{user?.role} Dashboard</p>
      </div>

      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Students" value={stats.totalStudents} color="green" icon={<span className="text-2xl">🎓</span>} />
          <StatCard title="Teachers" value={stats.totalTeachers} color="blue" icon={<span className="text-2xl">👨‍🏫</span>} />
          <StatCard title="Classes" value={stats.totalClasses} color="purple" icon={<span className="text-2xl">🏫</span>} />
          <StatCard title="Present Today" value={stats.todayAttendance?.present || 0} color="green" icon={<span className="text-2xl">✅</span>} />
          <StatCard title="Fee Collected" value={`₹${stats.feeCollection?.collected || 0}`} color="primary" icon={<span className="text-2xl">💰</span>} />
        </div>
      )}

      {isParent && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Child" value={stats.child?.user?.name || '—'} color="green" icon={<span className="text-2xl">👨‍👧</span>} />
          <StatCard title="Attendance" value={`${stats.monthAttendancePercentage || 0}%`} color="blue" icon={<span className="text-2xl">📋</span>} />
          <StatCard title="Pending Fees" value={`₹${stats.pendingFees || 0}`} color="orange" icon={<span className="text-2xl">💰</span>} />
          <StatCard title="Results" value={stats.results?.length || 0} color="purple" icon={<span className="text-2xl">📊</span>} />
        </div>
      )}

      {isStudent && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatCard title="Attendance" value={`${stats.monthAttendancePercentage || 0}%`} color="blue" icon={<span className="text-2xl">📋</span>} />
          <StatCard title="Pending Fees" value={`₹${stats.pendingFees || 0}`} color="orange" icon={<span className="text-2xl">💰</span>} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">📢 Notices</h2>
            <Link to="/notices" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {notices.length ? notices.map((n) => (
            <div key={n._id} className="py-2 border-b border-gray-50 last:border-0">
              <p className="text-sm font-medium">{n.title} {!n.isRead && <Badge variant="teacher">New</Badge>}</p>
              <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-sm text-gray-400">No notices</p>}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">📅 Upcoming Events</h2>
            <Link to="/events" className="text-sm text-primary-600 hover:underline">Calendar</Link>
          </div>
          {events.length ? events.map((ev) => (
            <div key={ev._id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <span>{ev.name}</span>
              <Badge variant={ev.type === 'holiday' ? 'inactive' : 'active'}>{ev.type}</Badge>
            </div>
          )) : <p className="text-sm text-gray-400">No upcoming events</p>}
        </div>

        {(isStudent || isParent) && homework.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">📝 Pending Homework</h2>
              <Link to="/homework" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {homework.map((hw) => (
              <div key={hw._id} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span>{hw.title || hw.description?.slice(0, 40)}</span>
                <span className="text-gray-400">Due {new Date(hw.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
