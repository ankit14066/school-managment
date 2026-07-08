import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const MyAttendance = () => {
  const { profile } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?._id) return;
    const now = new Date();
    attendanceAPI.getReport(profile._id, { month: now.getMonth() + 1, year: now.getFullYear() })
      .then(({ data }) => setReport(data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title">📋 My Attendance</h1>
        <p className="page-subtitle">Monthly attendance summary &amp; records</p>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
            {[{ l: 'Total Days', v: report.total }, { l: 'Present', v: report.present }, { l: 'Absent', v: report.absent }, { l: 'Late', v: report.late }, { l: 'Percentage', v: `${report.percentage}%` }].map((s) => (
              <div key={s.l} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)] text-center">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{s.l}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50/60 border-b border-slate-100"><tr>{['Date','Status'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {report.records?.map((r) => (
                  <tr key={r._id} className="hover:bg-emerald-50/15">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5"><Badge variant={r.status === 'present' ? 'active' : r.status === 'absent' ? 'inactive' : 'teacher'}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p className="text-xs font-bold text-slate-400 text-center py-20">No attendance records found.</p>}
    </DashboardLayout>
  );
};

export default MyAttendance;
