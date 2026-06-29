import { useEffect, useState } from 'react';
import { teacherAPI, subjectAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Edit, Trash2, Download, Upload, FileText } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '', employeeId: '', phone: '', qualification: '', joiningDate: '', subjects: [] };

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await teacherAPI.getAll({ page, limit: 10, search });
      setTeachers(data.data);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    subjectAPI.getAll({ limit: 100 }).then(({ data }) => setSubjects(data.data)).catch(() => {});
  }, [page, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.user?.name || '', email: t.user?.email || '', password: '',
      employeeId: t.employeeId, phone: t.phone, qualification: t.qualification || '',
      joiningDate: t.joiningDate ? new Date(t.joiningDate).toISOString().split('T')[0] : '',
      subjects: t.subjects?.map((s) => s._id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await teacherAPI.update(editing._id, form);
        toast.success('Teacher updated');
      } else {
        await teacherAPI.create(form);
        toast.success('Teacher created');
      }
      setShowModal(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Teacher',
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
      await teacherAPI.delete(id);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const toggleSubject = (id) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(id) ? f.subjects.filter((s) => s !== id) : [...f.subjects, id],
    }));
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...');
      const response = await teacherAPI.exportCSV({});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teachers-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Teachers exported to CSV successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to CSV failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Exporting to PDF...');
      const response = await teacherAPI.exportPDF({});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teachers-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Teachers exported to PDF successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to PDF failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold">Teachers</h1><p className="text-gray-500 text-sm">Manage teacher records</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
            <FileText size={18} /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Export PDF
          </button>
          <button onClick={openCreate} className="btn-primary">+ Add Teacher</button>
        </div>
      </div>

      <div className="card mb-6">
        <input placeholder="Search teachers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field" />
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>{['Employee ID', 'Name', 'Email', 'Phone', 'Subjects', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {teachers.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{t.employeeId}</td>
                    <td className="px-4 py-3 text-sm font-medium">{t.user?.name}</td>
                    <td className="px-4 py-3 text-sm">{t.user?.email}</td>
                    <td className="px-4 py-3 text-sm">{t.phone}</td>
                    <td className="px-4 py-3 text-sm">{t.subjects?.length || 0} subjects</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => openEdit(t)} 
                          className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition"
                          title="Edit teacher"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(t._id)} 
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                          title="Delete teacher"
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email *</label><input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            {!editing && <div><label className="label">Password</label><input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: teacher123" /></div>}
            <div><label className="label">Employee ID *</label><input className="input-field" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required /></div>
            <div><label className="label">Phone *</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div><label className="label">Qualification</label><input className="input-field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div><label className="label">Joining Date</label><input type="date" className="input-field" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Assign Subjects</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {subjects.map((s) => (
                <button key={s._id} type="button" onClick={() => toggleSubject(s._id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${form.subjects.includes(s._id) ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  {s.name} ({s.code})
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Teachers;
