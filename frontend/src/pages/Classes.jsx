import { useEffect, useState } from 'react';
import { classAPI, teacherAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import GreenSelect from "../components/GreenSelect";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">🏫 Classes</h1>
          <p className="page-subtitle">Manage classes, sections &amp; teachers</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '10', section: 'A', academicYear: '2025-2026', classTeacher: '', capacity: 40 }); setShowModal(true); }} className="btn-primary text-xs">+ Add Class</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.025)] hover:border-slate-200/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Class {c.name} - {c.section}</h3>
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block mt-1 uppercase tracking-wider">{c.academicYear}</p>
                </div>
                <span className="text-2xl">📚</span>
              </div>
              <div className="space-y-2 mb-5">
                {[
                  { l: 'Class Teacher', v: c.classTeacher?.user?.name || 'Not assigned' },
                  { l: 'Subjects', v: c.subjects?.length || 0 },
                  { l: 'Capacity', v: c.capacity },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between items-center bg-slate-50/50 rounded-xl px-3 py-2 border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{l}</span>
                    <span className="text-xs font-bold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(c); setForm({ name: c.name, section: c.section, academicYear: c.academicYear, classTeacher: c.classTeacher?._id || '', capacity: c.capacity }); setShowModal(true); }} className="btn-secondary text-xs flex-1">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="btn-danger text-xs flex-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Class</label><GreenSelect  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>{CLASS_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</GreenSelect></div>
            <div><label className="label">Section</label><GreenSelect  value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</GreenSelect></div>
            <div><label className="label">Academic Year</label><input className="input-field" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required /></div>
            <div><label className="label">Capacity</label><input type="number" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} min={1} /></div>
            <div className="col-span-2"><label className="label">Class Teacher</label>
              <GreenSelect  value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })}>
                <option value="">Select Teacher</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name} ({t.employeeId})</option>)}
              </GreenSelect>
            </div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Classes;
