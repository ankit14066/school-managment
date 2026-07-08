import { useEffect, useState } from 'react';
import { eventAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Calendar } from 'lucide-react';

const typeColors = { holiday: 'inactive', exam: 'teacher', event: 'active' };

const Events = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'event', description: '' });

  const fetchEvents = async () => {
    try {
      const { data } = await eventAPI.getAll({});
      setEvents(data.data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await eventAPI.create(form);
      toast.success('Event created');
      setShowModal(false);
      fetchEvents();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const eventsOnDate = events.filter((ev) => {
    const d = new Date(ev.date).toISOString().split('T')[0];
    return d === selectedDate;
  });

  const upcoming = events.filter((ev) => new Date(ev.date) >= new Date()).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">📅 Events Calendar</h1>
          <p className="page-subtitle">School events, holidays &amp; exams</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary text-xs">+ Add Event</button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <label className="text-sm font-extrabold text-slate-800">Select Date</label>
          </div>
          <input type="date" className="input-field" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <div className="mt-4 space-y-3">
            {eventsOnDate.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-6">No events on this date</p>
            ) : eventsOnDate.map((ev) => (
              <div key={ev._id} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2"><Badge variant={typeColors[ev.type]}>{ev.type}</Badge><span className="font-bold text-xs text-slate-800">{ev.name}</span></div>
                {ev.description && <p className="text-xs font-semibold text-slate-500 mt-1.5">{ev.description}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 pb-3 border-b border-slate-50">Upcoming Events</h2>
          {loading ? <Spinner /> : (
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-10">No upcoming events</p>
              ) : upcoming.map((ev) => (
                <div key={ev._id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{ev.name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{new Date(ev.date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={typeColors[ev.type]}>{ev.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Name</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date</label><input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div><label className="label">Type</label><select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="event">Event</option><option value="holiday">Holiday</option><option value="exam">Exam</option></select></div>
          </div>
          <div><label className="label">Description</label><textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" className="btn-primary w-full">Create</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Events;
