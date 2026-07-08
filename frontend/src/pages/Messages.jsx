import { useEffect, useState, useCallback } from 'react';
import { messageAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

const Messages = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [broadcast, setBroadcast] = useState({ targetRole: 'teacher', subject: '', body: '' });

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await messageAPI.getInbox({ folder: folder === 'sent' ? 'sent' : undefined, limit: 30 });
      setMessages(data.data);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [folder]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await messageAPI.send(form);
      toast.success('Message sent');
      setShowCompose(false);
      fetchMessages();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await messageAPI.broadcast(broadcast);
      toast.success('Broadcast sent');
      setShowBroadcast(false);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const markRead = async (id) => {
    await messageAPI.markRead(id);
    fetchMessages();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">✉️ Messages</h1>
            {unreadCount > 0 && <Badge variant="inactive">{unreadCount} unread</Badge>}
          </div>
          <p className="page-subtitle">Inbox, sent &amp; broadcasts</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <button onClick={() => setShowBroadcast(true)} className="btn-secondary text-xs">Broadcast</button>}
          <button onClick={() => setShowCompose(true)} className="btn-primary text-xs">Compose</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['inbox', 'sent'].map((f) => (
          <button key={f} onClick={() => setFolder(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${folder === f ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>{f}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">No messages in {folder}</p>
            </div>
          ) : messages.map((m) => (
            <div key={m._id} className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)] hover:border-slate-200/50 cursor-pointer ${!m.isRead && folder === 'inbox' ? 'border-l-4 border-l-emerald-500' : ''}`}
              onClick={() => !m.isRead && folder === 'inbox' && markRead(m._id)}>
              <div className="flex justify-between items-start">
                <p className="text-sm font-extrabold text-slate-800">{m.subject}</p>
                <span className="text-xs font-bold text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-1">{folder === 'inbox' ? `From: ${m.from?.name}` : `To: ${m.to?.name}`}</p>
              <p className="text-xs font-semibold text-slate-600 mt-2 line-clamp-2">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Message">
        <form onSubmit={handleSend} className="space-y-4">
          <div><label className="label">To (User ID)</label><input className="input-field" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required placeholder="Recipient user ID" /></div>
          <div><label className="label">Subject</label><input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
          <div><label className="label">Message</label><textarea className="input-field" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
          <button type="submit" className="btn-primary w-full">Send</button>
        </form>
      </Modal>

      <Modal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} title="Broadcast Message">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div><label className="label">Send To</label>
            <select className="input-field" value={broadcast.targetRole} onChange={(e) => setBroadcast({ ...broadcast, targetRole: e.target.value })}>
              <option value="teacher">All Teachers</option><option value="parent">All Parents</option><option value="student">All Students</option>
            </select>
          </div>
          <div><label className="label">Subject</label><input className="input-field" value={broadcast.subject} onChange={(e) => setBroadcast({ ...broadcast, subject: e.target.value })} required /></div>
          <div><label className="label">Message</label><textarea className="input-field" rows={4} value={broadcast.body} onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })} required /></div>
          <button type="submit" className="btn-primary w-full">Broadcast</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Messages;
