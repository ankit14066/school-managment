import { useEffect, useState } from 'react';
import { classAPI, teacherAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const CLASS_NAMES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C'];

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '10', section: 'A', academicYear: '2025-2026', classTeacher: '', capacity: 40 });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data } = await classAPI.getAll({ page, limit: 10 });
      setClasses(data.data);
      setPages(data.pages);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClasses();
    teacherAPI.getAll({ limit: 100 }).then(({ data }) => setTeachers(data.data)).catch(() => {});
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.classTeacher) delete payload.classTeacher;
    try {
      if (editing) { await classAPI.update(editing._id, payload); toast.success('Class updated'); }
      else { await classAPI.create(payload); toast.success('Class created'); }
      setShowModal(false);
      fetchClasses();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try { await classAPI.delete(id); toast.success('Deleted'); fetchClasses(); }
    catch (error) { toast.error(error.response?.data?.message || 'Delete failed'); }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">Classes</h1><p className="text-gray-500 text-sm">Manage classes and sections</p></div>
        <button onClick={() => { setEditing(null); setForm({ name: '10', section: 'A', academicYear: '2025-2026', classTeacher: '', capacity: 40 }); setShowModal(true); }} className="btn-primary">+ Add Class</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div key={c._id} className="card">
              <h3 className="text-lg font-semibold">Class {c.name} - {c.section}</h3>
              <p className="text-sm text-gray-500">{c.academicYear}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>Teacher: {c.classTeacher?.user?.name || 'Not assigned'}</p>
                <p>Subjects: {c.subjects?.length || 0}</p>
                <p>Capacity: {c.capacity}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditing(c); setForm({ name: c.name, section: c.section, academicYear: c.academicYear, classTeacher: c.classTeacher?._id || '', capacity: c.capacity }); setShowModal(true); }} className="btn-secondary text-sm flex-1">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="btn-danger text-sm flex-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Class</label><select className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>{CLASS_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="label">Section</label><select className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label">Academic Year</label><input className="input-field" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required /></div>
            <div><label className="label">Capacity</label><input type="number" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} min={1} /></div>
            <div className="col-span-2"><label className="label">Class Teacher</label>
              <select className="input-field" value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })}>
                <option value="">Select Teacher</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name} ({t.employeeId})</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Classes;
