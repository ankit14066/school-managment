import { useEffect, useState } from 'react';
import { timetableAPI, classAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { isAdmin } = useAuth();
  const [timetable, setTimetable] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ day: 'Monday', period: 1, subject: '', teacher: '', startTime: '08:00', endTime: '08:45', academicYear: '2025-2026' });

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = selectedClass ? { class: selectedClass } : {};
      const { data } = await timetableAPI.getAll(params);
      setTimetable(data.data || {});
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
    fetchTimetable();
  }, [selectedClass]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await timetableAPI.create({ ...form, class: selectedClass });
      toast.success('Entry added');
      setShowModal(false);
      fetchTimetable();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handlePrint = () => window.print();

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold">Timetable</h1></div>
        <div className="flex gap-2">
          {isAdmin && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input-field sm:w-48">
              <option value="">My Class / Select</option>
              {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
            </select>
          )}
          {isAdmin && selectedClass && <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Period</button>}
          <button onClick={handlePrint} className="btn-secondary">🖨️ Print</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div id="timetable-print" className="space-y-6">
          {DAYS.map((day) => (
            <div key={day} className="card">
              <h3 className="font-semibold text-primary-700 mb-3">{day}</h3>
              {(timetable[day]?.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {timetable[day].map((entry) => (
                    <div key={entry._id} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="font-medium">Period {entry.period}</p>
                      <p className="text-primary-600">{entry.subject?.name}</p>
                      <p className="text-gray-500">{entry.teacher?.user?.name || 'TBA'}</p>
                      <p className="text-xs text-gray-400">{entry.startTime} - {entry.endTime}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No classes scheduled</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Entry">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Day</label><select className="input-field" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label className="label">Period</label><input type="number" min={1} max={8} className="input-field" value={form.period} onChange={(e) => setForm({ ...form, period: parseInt(e.target.value) })} /></div>
            <div><label className="label">Start Time</label><input type="time" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="label">End Time</label><input type="time" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
          </div>
          <p className="text-xs text-gray-500">Subject & teacher IDs from subjects page</p>
          <div><label className="label">Subject ID</label><input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Paste subject ID" /></div>
          <button type="submit" className="btn-primary w-full">Add Entry</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Timetable;
