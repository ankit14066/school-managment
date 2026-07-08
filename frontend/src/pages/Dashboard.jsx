import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, parentAPI, noticeAPI, eventAPI, homeworkAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { Link } from 'react-router-dom';
import { Calendar, Bell, BookOpen, Clock, CheckCircle } from 'lucide-react';

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
        setNotices(noticeRes.data?.data || []);
        setEvents(eventRes.data?.data || []);
        setHomework(hwRes.data?.data || []);

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

  // Format currency helpers
  const formatLakhs = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <DashboardLayout>
      {/* Welcome Greeting Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.008)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
          <p className="text-xs font-semibold text-slate-400 capitalize mt-1.5 tracking-wider">
            {user?.role === 'developer' ? 'System Administrator / Developer' : `${user?.role} Portal`} • {todayStr}
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest leading-none">
            Active Session
          </span>
        </div>
      </div>

      {/* Admin metrics dashboard */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Students" 
            value={stats.totalStudents || 0} 
            color="pink" 
            icon={<span className="text-xl">🎓</span>} 
            badge="+0 this month"
          />
          <StatCard 
            title="Total Teachers" 
            value={stats.totalTeachers || 0} 
            color="blue" 
            icon={<span className="text-xl">👨‍🏫</span>} 
            badge="All active"
          />
          <StatCard 
            title="Total Classes" 
            value={stats.totalClasses || 0} 
            color="purple" 
            icon={<span className="text-xl">🏫</span>} 
            badge="Classes 1–12"
          />
          <StatCard 
            title="Fee Collected" 
            value={formatLakhs(stats.feeCollection?.collected)} 
            color="orange" 
            icon={<span className="text-xl">💰</span>} 
            badge={`Due: ${formatLakhs(stats.feeCollection?.due)}`}
          />
        </div>
      )}

      {/* Parent metrics dashboard */}
      {isParent && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Child Student" 
            value={stats.child?.user?.name || '—'} 
            color="green" 
            icon={<span className="text-xl">👨‍👧</span>} 
            badge={`Roll No: ${stats.child?.rollNo || '—'}`}
          />
          <StatCard 
            title="Attendance Rate" 
            value={`${stats.monthAttendancePercentage || 0}%`} 
            color="blue" 
            icon={<span className="text-xl">📋</span>} 
            badge="This Month"
          />
          <StatCard 
            title="Pending Fees" 
            value={`₹${stats.pendingFees || 0}`} 
            color="orange" 
            icon={<span className="text-xl">💰</span>} 
            badge="Payment Portal"
          />
          <StatCard 
            title="Total Exams" 
            value={stats.results?.length || 0} 
            color="purple" 
            icon={<span className="text-xl">📊</span>} 
            badge="Report Cards"
          />
        </div>
      )}

      {/* Student metrics dashboard */}
      {isStudent && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Attendance Rate" 
            value={`${stats.monthAttendancePercentage || 0}%`} 
            color="blue" 
            icon={<span className="text-xl">📋</span>} 
            badge="Monthly report"
          />
          <StatCard 
            title="Pending Fees" 
            value={`₹${stats.pendingFees || 0}`} 
            color="orange" 
            icon={<span className="text-xl">💰</span>} 
            badge="Fee invoices"
          />
          <StatCard 
            title="Your Class" 
            value={stats.student?.class?.name ? `${stats.student.class.name} - ${stats.student.class.section}` : '—'} 
            color="purple" 
            icon={<span className="text-xl">🏫</span>} 
            badge={stats.student?.class?.academicYear || 'Academic Year'}
          />
        </div>
      )}

      {/* Grid containing Notice board, Calendar, Homework widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Notices Board */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">📢 Notices Board</h2>
              </div>
              <Link to="/notices" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">View all</Link>
            </div>
            
            <div className="space-y-4">
              {notices.length ? notices.map((n) => (
                <div key={n._id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-850 line-clamp-1">{n.title}</p>
                    {!n.isRead && <Badge variant="student">New</Badge>}
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1.5 leading-none">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400">No active notices found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events Calendar */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">📅 School Calendar</h2>
              </div>
              <Link to="/events" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Calendar</Link>
            </div>

            <div className="space-y-4">
              {events.length ? events.map((ev) => (
                <div key={ev._id} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-850 truncate">{ev.name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 leading-none">
                      {new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant={ev.type === 'holiday' ? 'inactive' : 'active'}>{ev.type}</Badge>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400">No upcoming events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Homework Widget (Students / Parents) */}
        {(isStudent || isParent) && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">📝 Pending Homework</h2>
                </div>
                <Link to="/homework" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">View all</Link>
              </div>

              <div className="space-y-4">
                {homework.length ? homework.map((hw) => (
                  <div key={hw._id} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-850 truncate">{hw.title || hw.description?.slice(0, 40)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                        Due {new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {hw.subject?.name || 'Class Subject'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">You are all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs (Admin/Developer role overview) */}
        {(isAdmin || user?.role === 'developer') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">⚡ Recent Activities</h2>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {stats?.recentActivity?.length ? stats.recentActivity.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-750">{log.action}</p>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-1">
                      <span>By {log.performedBy?.name || 'System'} ({log.performedBy?.role || 'Admin'})</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400">No activity logs recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
