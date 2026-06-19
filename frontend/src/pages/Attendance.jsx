import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, classAPI, studentAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['present', 'absent', 'late'];

const Attendance = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('mark');
  const [history, setHistory] = useState([]);
  const [reportStudent, setReportStudent] = useState('');
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
    if (isAdmin) studentAPI.getAll({ limit: 100 }).then(({ data }) => setStudents(data.data)).catch(() => {});
  }, [isAdmin]);

  const loadStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getClassStudents(selectedClass, { date });
      setRecords(data.data.map((r) => ({ ...r, status: r.status || 'present' })));
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (viewMode === 'mark') loadStudents(); }, [selectedClass, date, viewMode]);

  const handleSave = async () => {
    if (!selectedClass || records.length === 0) return;
    setSaving(true);
    try {
      await attendanceAPI.mark({
        class: selectedClass,
        date,
        records: records.map((r) => ({ student: r.student, status: r.status })),
      });
      toast.success('Attendance saved!');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const loadHistory = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const params = { class: selectedClass, limit: 50 };
      if (date) params.startDate = date;
      if (date) params.endDate = date;
      const { data } = await attendanceAPI.getAll(params);
      setHistory(data.data);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  const loadReport = async () => {
    if (!reportStudent) return;
    setLoading(true);
    try {
      const now = new Date();
      const { data } = await attendanceAPI.getReport(reportStudent, { month: now.getMonth() + 1, year: now.getFullYear() });
      setReport(data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex gap-2 mt-4">
          {['mark', 'history', 'report'].map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${viewMode === m ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{m === 'mark' ? 'Mark Attendance' : m === 'history' ? 'View History' : 'Monthly Report'}</button>
          ))}
        </div>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input-field sm:w-48">
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field sm:w-48" />
        {viewMode === 'history' && <button onClick={loadHistory} className="btn-primary">Load History</button>}
        {viewMode === 'report' && (
          <>
            <select value={reportStudent} onChange={(e) => setReportStudent(e.target.value)} className="input-field flex-1">
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.user?.name} ({s.rollNumber})</option>)}
            </select>
            <button onClick={loadReport} className="btn-primary">Get Report</button>
          </>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <>
          {viewMode === 'mark' && selectedClass && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr>{['Roll No','Name','Status'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {records.map((r, i) => (
                    <tr key={r.student}>
                      <td className="px-4 py-3 text-sm font-mono">{r.rollNumber}</td>
                      <td className="px-4 py-3 text-sm">{r.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((s) => (
                            <button key={s} type="button" onClick={() => { const u = [...records]; u[i] = { ...u[i], status: s }; setRecords(u); }}
                              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${r.status === s ? (s === 'present' ? 'bg-green-100 text-green-700' : s === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700') : 'bg-gray-100 text-gray-500'}`}>{s}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length > 0 && (
                <div className="p-4 border-t"><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Attendance'}</button></div>
              )}
            </div>
          )}

          {viewMode === 'history' && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr>{['Student','Date','Status','Marked By'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td className="px-4 py-3 text-sm">{h.student?.user?.name}</td>
                      <td className="px-4 py-3 text-sm">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge variant={h.status === 'present' ? 'active' : h.status === 'absent' ? 'inactive' : 'teacher'}>{h.status}</Badge></td>
                      <td className="px-4 py-3 text-sm">{h.markedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'report' && report && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">{report.month} Report</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[{ l: 'Total Days', v: report.total }, { l: 'Present', v: report.present }, { l: 'Absent', v: report.absent }, { l: 'Late', v: report.late }, { l: 'Percentage', v: `${report.percentage}%` }].map((s) => (
                  <div key={s.l} className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">{s.l}</p><p className="text-xl font-bold">{s.v}</p></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Attendance;
