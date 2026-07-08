import { useEffect, useState } from 'react';
import { noticeAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Bell, Clock } from 'lucide-react';

const Notices = () => {
  const { isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetAudience: 'all', expiryDate: '' });

  const fetchNotices = async () => {
    try {
      const { data } = await noticeAPI.getAll({ limit: 20 });
      setNotices(data.data);
    } catch { toast.error('Failed to load notices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    try {
      await noticeAPI.create(fd);
      toast.success('Notice posted');
      setShowModal(false);
      fetchNotices();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const markRead = async (id) => {
    await noticeAPI.markRead(id);
    fetchNotices();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">📢 Notice Board</h1>
          <p className="page-subtitle">School announcements &amp; updates</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary text-xs">+ Post Notice</button>}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="space-y-4">
          {notices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">No notices found</p>
            </div>
          ) : notices.map((n) => (
            <div key={n._id} className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] hover:border-slate-200/50 ${!n.isRead ? 'border-l-4 border-l-emerald-500' : ''}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-800">{n.title}</h3>
                    {!n.isRead && <Badge variant="student">New</Badge>}
                    <Badge variant="admin">{n.targetAudience}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                  <p className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    By {n.postedBy?.name} · {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0 uppercase tracking-wider">Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post Notice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title</label><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Body</label><textarea className="input-field" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Audience</label>
              <select className="input-field" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                <option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option>
              </select>
            </div>
            <div><label className="label">Expiry Date</label><input type="date" className="input-field" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn-primary w-full">Post Notice</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Notices;
