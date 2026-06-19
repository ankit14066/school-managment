import { useEffect, useState } from 'react';
import { subjectAPI, classAPI, teacherAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Edit, Trash2, Download, FileText } from 'lucide-react';

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
      if (editing) { await subjectAPI.update(editing._id, payload); toast.success('Subject updated'); }
      else { await subjectAPI.create(payload); toast.success('Subject created'); }
      setShowModal(false);
      setForm({ name: '', code: '', class: '', teacher: '', description: '' });
      fetchSubjects();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Subject',
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
      await subjectAPI.delete(id);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...');
      const response = await subjectAPI.exportCSV({});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subjects-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Subjects exported to CSV successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to CSV failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Exporting to PDF...');
      const response = await subjectAPI.exportPDF({});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subjects-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Subjects exported to PDF successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to PDF failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-gray-500 text-sm">Manage subject records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
            <FileText size={18} /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Export PDF
          </button>
          <button onClick={() => { setEditing(null); setForm({ name: '', code: '', class: '', teacher: '', description: '' }); setShowModal(true); }} className="btn-primary">+ Add Subject</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>{['Code','Name','Class','Teacher','Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{s.code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-sm">{s.class ? `${s.class.name}-${s.class.section}` : '—'}</td>
                    <td className="px-4 py-3 text-sm">{s.teacher?.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setEditing(s); setForm({ name: s.name, code: s.code, class: s.class?._id || '', teacher: s.teacher?._id || '', description: s.description || '' }); setShowModal(true); }} 
                          className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition"
                          title="Edit subject"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s._id)} 
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                          title="Delete subject"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4"><Pagination page={page} pages={pages} onPageChange={setPage} /></div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Code *</label><input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
            <div><label className="label">Class *</label><select className="input-field" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} required><option value="">Select</option>{classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}</select></div>
            <div><label className="label">Teacher</label><select className="input-field" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">Select</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input-field" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Subjects;
