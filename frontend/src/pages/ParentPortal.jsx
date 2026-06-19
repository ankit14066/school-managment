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
  if (!data) return <DashboardLayout><p className="text-gray-500">No child data found.</p></DashboardLayout>;

  const child = data.child;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Parent Portal</h1>
        <p className="text-gray-500">Viewing data for <strong>{child?.user?.name}</strong> (Roll: {child?.rollNumber})</p>
        <p className="text-sm text-gray-400">Class {child?.class?.name}-{child?.class?.section}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance %" value={`${data.monthAttendancePercentage}%`} color="green" icon={<span className="text-2xl">📋</span>} />
        <StatCard title="Pending Fees" value={`₹${data.pendingFees}`} color="orange" icon={<span className="text-2xl">💰</span>} />
        <StatCard title="Results" value={data.results?.length || 0} color="blue" icon={<span className="text-2xl">📊</span>} />
        <StatCard title="Homework" value={data.homework?.length || 0} color="purple" icon={<span className="text-2xl">📝</span>} />
      </div>

      <div className="flex gap-2 mb-8">
        <button onClick={downloadMarksheet} className="btn-secondary text-sm">📄 Download Marksheet</button>
        <button onClick={downloadAttendance} className="btn-secondary text-sm">📄 Attendance Report</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Results</h2>
          {data.results?.length ? data.results.map((r) => (
            <div key={r._id} className="flex justify-between py-2 border-b border-gray-50 text-sm">
              <span>{r.exam?.subject?.name} ({r.exam?.name})</span>
              <Badge variant="active">{r.marksObtained} marks · {r.grade}</Badge>
            </div>
          )) : <p className="text-sm text-gray-400">No results yet</p>}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Pending Homework</h2>
          {data.homework?.length ? data.homework.map((hw) => (
            <div key={hw._id} className="py-2 border-b border-gray-50 text-sm">
              <p className="font-medium">{hw.title || hw.description?.slice(0, 40)}</p>
              <p className="text-xs text-gray-400">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-sm text-gray-400">No pending homework</p>}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">Notices</h2>
          {data.notices?.length ? data.notices.map((n) => (
            <div key={n._id} className="py-2 border-b border-gray-50">
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-gray-500">{n.body?.slice(0, 100)}...</p>
            </div>
          )) : <p className="text-sm text-gray-400">No notices</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentPortal;
