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
      <h1 className="text-2xl font-bold mb-8">My Attendance</h1>
      {report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[{ l: 'Total Days', v: report.total }, { l: 'Present', v: report.present }, { l: 'Absent', v: report.absent }, { l: 'Late', v: report.late }, { l: 'Percentage', v: `${report.percentage}%` }].map((s) => (
              <div key={s.l} className="card text-center"><p className="text-xs text-gray-500">{s.l}</p><p className="text-2xl font-bold mt-1">{s.v}</p></div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>{['Date','Status'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {report.records?.map((r) => (
                  <tr key={r._id}><td className="px-4 py-3 text-sm">{new Date(r.date).toLocaleDateString()}</td><td className="px-4 py-3"><Badge variant={r.status === 'present' ? 'active' : r.status === 'absent' ? 'inactive' : 'teacher'}>{r.status}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p className="text-gray-500">No attendance records found.</p>}
    </DashboardLayout>
  );
};

export default MyAttendance;
