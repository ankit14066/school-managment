import { useEffect, useState } from 'react';
import { parentAPI, reportAPI, downloadBlob } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const ParentPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentAPI.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => toast.error('Failed to load child data'))
      .finally(() => setLoading(false));
  }, []);

  const downloadMarksheet = async () => {
    try {
      const studentId = data?.child?._id;
      const res = await reportAPI.downloadMarksheet(studentId);
      downloadBlob(res.data, 'marksheet.pdf');
    } catch { toast.error('Failed to download marksheet'); }
  };

  const downloadAttendance = async () => {
    try {
      const studentId = data?.child?._id;
      const now = new Date();
      const res = await reportAPI.downloadAttendance(studentId, { month: now.getMonth() + 1, year: now.getFullYear() });
      downloadBlob(res.data, 'attendance.pdf');
    } catch { toast.error('Failed to download attendance report'); }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><p className="text-xs font-bold text-slate-400 text-center py-20">No child data found.</p></DashboardLayout>;

  const child = data.child;

  return (
    <DashboardLayout>
      <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.008)] mb-8">
        <h1 className="page-title">👨‍👧 Parent Portal</h1>
        <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
          Viewing data for <span className="text-emerald-600">{child?.user?.name}</span> · Roll #{child?.rollNumber} · Class {child?.class?.name}-{child?.class?.section}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Attendance %" value={`${data.monthAttendancePercentage}%`} color="green" icon={<span className="text-xl">📋</span>} badge="This month" />
        <StatCard title="Pending Fees" value={`₹${data.pendingFees}`} color="orange" icon={<span className="text-xl">💰</span>} badge="Payment portal" />
        <StatCard title="Results" value={data.results?.length || 0} color="blue" icon={<span className="text-xl">📊</span>} badge="Report cards" />
        <StatCard title="Homework" value={data.homework?.length || 0} color="purple" icon={<span className="text-xl">📝</span>} badge="Pending tasks" />
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={downloadMarksheet} className="btn-secondary text-xs">📄 Download Marksheet</button>
        <button onClick={downloadAttendance} className="btn-secondary text-xs">📄 Attendance Report</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">Recent Results</h2>
          {data.results?.length ? data.results.map((r) => (
            <div key={r._id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
              <span className="text-xs font-bold text-slate-700">{r.exam?.subject?.name} ({r.exam?.name})</span>
              <Badge variant="active">{r.marksObtained} marks · {r.grade}</Badge>
            </div>
          )) : <p className="text-xs font-bold text-slate-400 text-center py-6">No results yet</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">Pending Homework</h2>
          {data.homework?.length ? data.homework.map((hw) => (
            <div key={hw._id} className="py-3 border-b border-slate-50 last:border-0">
              <p className="text-xs font-bold text-slate-800">{hw.title || hw.description?.slice(0, 40)}</p>
              <p className="text-xs font-bold text-rose-500 mt-1">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-xs font-bold text-slate-400 text-center py-6">No pending homework</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">Notices</h2>
          {data.notices?.length ? data.notices.map((n) => (
            <div key={n._id} className="py-3 border-b border-slate-50 last:border-0">
              <p className="text-xs font-bold text-slate-800">{n.title}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{n.body?.slice(0, 100)}...</p>
            </div>
          )) : <p className="text-xs font-bold text-slate-400 text-center py-6">No notices</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentPortal;
