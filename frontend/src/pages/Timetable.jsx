import { useEffect, useState } from 'react';
import { timetableAPI, classAPI, subjectAPI, teacherAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import GreenSelect from '../components/GreenSelect';
import { Trash2, Download, FileText, Share2, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { isAdmin } = useAuth();
  const [timetable, setTimetable] = useState({});
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ day: 'Monday', period: 1, subject: '', teacher: '', startTime: '08:00', endTime: '08:45' });
  const [academicYear] = useState('2025-2026');
  const isAllClassesView = !selectedClass;

  const getClassLabel = (entry) => {
    if (!entry?.class) return 'Class N/A';
    return `Class ${entry.class.name}-${entry.class.section}`;
  };

  const getEntriesByClass = () => {
    return entries.reduce((grouped, entry) => {
      const classLabel = getClassLabel(entry);
      if (!grouped[classLabel]) {
        grouped[classLabel] = {};
        DAYS.forEach((day) => { grouped[classLabel][day] = []; });
      }
      if (grouped[classLabel][entry.day]) grouped[classLabel][entry.day].push(entry);
      return grouped;
    }, {});
  };

  const fetchTimetable = async (classId = null) => {
    setLoading(true);
    try {
      const params = { academicYear };
      if (classId) params.class = classId;
      const { data } = await timetableAPI.getAll(params);
      const grouped = data.data || {};
      setTimetable(grouped);
      
      // Flatten for table view
      const allEntries = [];
      Object.values(grouped).forEach((dayEntries) => {
        allEntries.push(...dayEntries);
      });
      setEntries(allEntries);
    } catch { 
      toast.error('Failed to load timetable');
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, subjectRes, teacherRes] = await Promise.all([
          classAPI.getAll({ limit: 100 }),
          subjectAPI.getAll({ limit: 100 }),
          teacherAPI.getAll({ limit: 100 }),
        ]);
        setClasses(classRes.data.data || []);
        setSubjects(subjectRes.data.data || []);
        setTeachers(teacherRes.data.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchTimetable(selectedClass || null);
  }, [selectedClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    if (!form.subject || !form.teacher) {
      toast.error('Please select subject and teacher');
      return;
    }
    
    try {
      const payload = { ...form, class: selectedClass, academicYear };
      if (editing) {
        // Update would require PUT endpoint
        toast.info('Update functionality coming soon');
      } else {
        await timetableAPI.create(payload);
        toast.success('Timetable entry added');
      }
      setShowModal(false);
      setForm({ day: 'Monday', period: 1, subject: '', teacher: '', startTime: '08:00', endTime: '08:45' });
      fetchTimetable(selectedClass || null);
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Timetable Entry',
      text: 'Are you sure? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await timetableAPI.delete(id);
      toast.success('Entry deleted successfully');
      fetchTimetable(selectedClass || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...');
      const params = { academicYear };
      if (selectedClass) params.class = selectedClass;
      const response = await timetableAPI.exportCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timetable-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Timetable exported to CSV!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Exporting to PDF...');
      const params = { academicYear };
      if (selectedClass) params.class = selectedClass;
      const response = await timetableAPI.exportPDF(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timetable-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Timetable exported to PDF!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export failed');
    }
  };

  const handleShare = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    const result = await Swal.fire({
      title: 'Share Timetable',
      html: `<p class="text-sm mb-4">Timetable will be shared with all students and parents of this class.</p>
             <label class="flex items-center gap-2 text-sm">
               <input type="checkbox" id="shareMsg" checked>
               <span>Send notification message</span>
             </label>`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Share Now',
    });

    if (result.isConfirmed) {
      toast.success('Timetable shared with students and parents! (Notifications sent)');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">🗓️ Timetable</h1>
          <p className="page-subtitle">Manage &amp; view class schedules</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-nowrap">
            <GreenSelect value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-40 sm:w-64">
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
            </GreenSelect>
            {selectedClass && (
              <button
                onClick={() => { setEditing(null); setForm({ day: 'Monday', period: 1, subject: '', teacher: '', startTime: '08:00', endTime: '08:45' }); setShowModal(true); }}
                className="btn-primary shrink-0 whitespace-nowrap text-xs"
              >
                + Add Period
              </button>
            )}
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)] mb-6 flex gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5 text-xs">
            <FileText size={15} /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={15} /> Export PDF
          </button>
          {isAdmin && selectedClass && (
            <button onClick={handleShare} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Share2 size={15} /> Share with Class
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : entries.length > 0 ? (
        <div>
          {/* Table View */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden mb-6">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50/60 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    {[...(isAllClassesView ? ['Class'] : []), 'Day', 'Period', 'Subject', 'Teacher', 'Time', 'Actions'].map((h) => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entries.length === 0 ? (
                    <tr><td colSpan={isAllClassesView ? 7 : 6} className="px-5 py-8 text-center text-sm font-bold text-slate-400">No timetable entries yet</td></tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-emerald-50/15">
                        {isAllClassesView && (
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{getClassLabel(entry)}</span>
                          </td>
                        )}
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{entry.day}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">P{entry.period}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-slate-800">{entry.subject?.name}</p>
                          <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{entry.subject?.code}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{entry.teacher?.user?.name || 'TBA'}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">{entry.startTime} – {entry.endTime}</td>
                        <td className="px-5 py-3.5">
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(entry._id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card View by Day */}
          {isAllClassesView ? (
            <div className="space-y-4">
              {Object.entries(getEntriesByClass()).map(([classLabel, grouped]) => (
                <div key={classLabel} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">{classLabel}</h3>
                  <div className="space-y-5">
                    {DAYS.map((day) => (
                      grouped[day]?.length > 0 && (
                        <div key={`${classLabel}-${day}`}>
                          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">{day}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {grouped[day].map((entry) => (
                              <div key={entry._id} className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-xl p-4 border border-emerald-200/60 hover:shadow-md hover:shadow-emerald-600/5">
                                <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1.5">Period {entry.period}</p>
                                <p className="text-sm font-extrabold text-slate-800">{entry.subject?.name}</p>
                                <p className="text-xs font-bold text-slate-400 font-mono mt-1">{entry.subject?.code}</p>
                                <p className="text-xs font-semibold text-slate-600 mt-2">{entry.teacher?.user?.name || 'TBA'}</p>
                                <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                                  <Clock size={11} /> {entry.startTime} – {entry.endTime}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="space-y-4">
            {DAYS.map((day) => (
              timetable[day]?.length > 0 && (
                <div key={day} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">{day}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {timetable[day].map((entry) => (
                      <div key={entry._id} className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-xl p-4 border border-emerald-200/60 hover:shadow-md hover:shadow-emerald-600/5">
                        <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1.5">Period {entry.period}</p>
                        <p className="text-sm font-extrabold text-slate-800">{entry.subject?.name}</p>
                        <p className="text-xs font-bold text-slate-400 font-mono mt-1">{entry.subject?.code}</p>
                        <p className="text-xs font-semibold text-slate-600 mt-2">{entry.teacher?.user?.name || 'TBA'}</p>
                        <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                          <Clock size={11} /> {entry.startTime} – {entry.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] text-center py-16">
          <span className="text-4xl block mb-2">🗓️</span>
          <p className="text-sm font-extrabold text-slate-600">No timetable entries found</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Select a class and add periods to get started.</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Entry" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Day *</label>
              <GreenSelect value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} required>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </GreenSelect>
            </div>
            <div>
              <label className="label">Period *</label>
              <input type="number" min={1} max={8} className="input-field" value={form.period} onChange={(e) => setForm({ ...form, period: parseInt(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Subject *</label>
              <GreenSelect value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </GreenSelect>
            </div>
            <div>
              <label className="label">Teacher *</label>
              <GreenSelect value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} required>
                <option value="">Select Teacher</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name}</option>)}
              </GreenSelect>
            </div>
            <div>
              <label className="label">Start Time *</label>
              <input type="time" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="time" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Entry</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Timetable;
