import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, classAPI, studentAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import GreenSelect from "../components/GreenSelect";

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
        <h1 className="page-title">📋 Attendance</h1>
        <p className="page-subtitle">Mark, view &amp; report student attendance</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {['mark', 'history', 'report'].map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${viewMode === m ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>{m === 'mark' ? 'Mark Attendance' : m === 'history' ? 'View History' : 'Monthly Report'}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)] mb-6 flex flex-col sm:flex-row gap-4">
        <GreenSelect value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="sm:w-48">
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
        </GreenSelect>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field sm:w-48" />
        {viewMode === 'history' && <button onClick={loadHistory} className="btn-primary">Load History</button>}
        {viewMode === 'report' && (
          <>
            <GreenSelect value={reportStudent} onChange={(e) => setReportStudent(e.target.value)} className=" flex-1">
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.user?.name} ({s.rollNumber})</option>)}
            </GreenSelect>
            <button onClick={loadReport} className="btn-primary">Get Report</button>
          </>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <>
          {viewMode === 'mark' && selectedClass && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50/60 border-b border-slate-100"><tr>{['Roll No','Name','Status'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r, i) => (
                    <tr key={r.student} className="hover:bg-emerald-50/15">
                      <td className="px-5 py-3.5"><span className="text-xs font-bold text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded-lg">{r.rollNumber}</span></td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{r.name}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((s) => (
                            <button key={s} type="button" onClick={() => { const u = [...records]; u[i] = { ...u[i], status: s }; setRecords(u); }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${r.status === s ? (s === 'present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : s === 'absent' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200') : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>{s}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length > 0 && (
                <div className="p-5 border-t border-slate-50"><button onClick={handleSave} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving...' : 'Save Attendance'}</button></div>
              )}
            </div>
          )}

          {viewMode === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50/60 border-b border-slate-100"><tr>{['Student','Date','Status','Marked By'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((h) => (
                    <tr key={h._id} className="hover:bg-emerald-50/15">
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{h.student?.user?.name}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5"><Badge variant={h.status === 'present' ? 'active' : h.status === 'absent' ? 'inactive' : 'teacher'}>{h.status}</Badge></td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{h.markedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'report' && report && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">{report.month} Report</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[{ l: 'Total Days', v: report.total }, { l: 'Present', v: report.present }, { l: 'Absent', v: report.absent }, { l: 'Late', v: report.late }, { l: 'Percentage', v: `${report.percentage}%` }].map((s) => (
                  <div key={s.l} className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{s.l}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{s.v}</p>
                  </div>
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
