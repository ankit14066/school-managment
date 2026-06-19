import { useEffect, useState } from 'react';
import { subjectAPI, classAPI, teacherAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', class: '', teacher: '', description: '' });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await subjectAPI.getAll({ page, limit: 10 });
      setSubjects(data.data);
      setPages(data.pages);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSubjects();
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
    teacherAPI.getAll({ limit: 100 }).then(({ data }) => setTeachers(data.data)).catch(() => {});
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.teacher) delete payload.teacher;
    try {
      if (editing) { await subjectAPI.update(editing._id, payload); toast.success('Updated'); }
      else { await subjectAPI.create(payload); toast.success('Created'); }
      setShowModal(false);
      fetchSubjects();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">Subjects</h1></div>
        <button onClick={() => { setEditing(null); setForm({ name: '', code: '', class: '', teacher: '', description: '' }); setShowModal(true); }} className="btn-primary">+ Add Subject</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>{['Code','Name','Class','Teacher','Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {subjects.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{s.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm">{s.class ? `${s.class.name}-${s.class.section}` : '—'}</td>
                  <td className="px-4 py-3 text-sm">{s.teacher?.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button onClick={() => { setEditing(s); setForm({ name: s.name, code: s.code, class: s.class?._id || '', teacher: s.teacher?._id || '', description: s.description || '' }); setShowModal(true); }} className="text-primary-600 hover:underline">Edit</button>
                    <button onClick={async () => { if (window.confirm('Delete?')) { await subjectAPI.delete(s._id); toast.success('Deleted'); fetchSubjects(); } }} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4"><Pagination page={page} pages={pages} onPageChange={setPage} /></div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Code *</label><input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
            <div><label className="label">Class *</label><select className="input-field" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} required><option value="">Select</option>{classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}</select></div>
            <div><label className="label">Teacher</label><select className="input-field" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">Select</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Subjects;
