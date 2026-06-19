import { useEffect, useState } from 'react';
import { homeworkAPI, subjectAPI, classAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const Homework = () => {
  const { isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', subject: '', class: '', description: '', dueDate: '' });

  const fetchHomework = async () => {
    try {
      const { data } = await homeworkAPI.getAll({ limit: 20 });
      setHomework(data.data);
    } catch { toast.error('Failed to load homework'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHomework();
    if (isAdmin || isTeacher) {
      subjectAPI.getAll({ limit: 100 }).then(({ data }) => setSubjects(data.data)).catch(() => {});
      classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await homeworkAPI.create(form);
      toast.success('Homework assigned');
      setShowModal(false);
      fetchHomework();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleSubmit = async (id) => {
    try {
      await homeworkAPI.submit(id);
      toast.success('Marked as submitted');
      fetchHomework();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const statusColor = { pending: 'inactive', submitted: 'active', overdue: 'teacher' };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">Homework</h1></div>
        {(isAdmin || isTeacher) && <button onClick={() => setShowModal(true)} className="btn-primary">+ Assign Homework</button>}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="space-y-4">
          {homework.map((hw) => (
            <div key={hw._id} className={`card ${hw.isOverdue ? 'border-l-4 border-l-red-400' : ''}`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-semibold">{hw.title || hw.description?.slice(0, 50)}</h3>
                  <p className="text-sm text-gray-500">{hw.subject?.name} · Class {hw.class?.name}-{hw.class?.section}</p>
                  <p className="text-sm text-gray-600 mt-2">{hw.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {hw.isOverdue && <Badge variant="inactive">Overdue</Badge>}
                  {(isStudent || isParent) && (
                    <button onClick={() => handleSubmit(hw._id)} className="btn-primary text-sm">Mark Submitted</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Homework">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title</label><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Class</label><select className="input-field" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} required><option value="">Select</option>{classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}</select></div>
          <div><label className="label">Subject</label><select className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required><option value="">Select</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
          <div><label className="label">Description</label><textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
          <div><label className="label">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></div>
          <button type="submit" className="btn-primary w-full">Assign</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Homework;
