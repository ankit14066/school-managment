import { useEffect, useState } from 'react';
import { studentAPI, classAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Edit, Trash2, Eye, Download, Upload } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const emptyForm = {
  name: '', email: '', password: '', rollNumber: '', class: '',
  dateOfBirth: '', parentName: '', phone: '', address: '',
  parentEmail: '', parentPassword: '',
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (classFilter) params.class = classFilter;
      const { data } = await studentAPI.getAll(params);
      setStudents(data.data);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
  }, [page, search, classFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhoto(null);
    setShowModal(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      name: student.user?.name || '',
      email: student.user?.email || '',
      password: '',
      rollNumber: student.rollNumber,
      class: student.class?._id || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      parentName: student.parentName,
      phone: student.phone,
      address: student.address || '',
    });
    setPhoto(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v && k !== 'password' || k === 'password' && v) fd.append(k, v); });
    if (photo) fd.append('photo', photo);

    try {
      if (editing) {
        await studentAPI.update(editing._id, fd);
        toast.success('Student updated');
      } else {
        await studentAPI.create(fd);
        toast.success('Student created');
      }
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    const fd = new FormData();
    fd.append('csv', csvFile);

    try {
      const response = await fetch(`${API_BASE}/api/students/import/bulk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Import failed');
      }

      if (data.data?.errors?.length > 0) {
        const errorMsg = data.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.error}`).join('\n');
        toast.error(`${data.data.successCount} imported. Errors:\n${errorMsg}`);
      } else {
        toast.success(`${data.data.successCount} students imported successfully!`);
      }

      setShowImportModal(false);
      setCsvFile(null);
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `name,email,rollNumber,classId,dateOfBirth,parentName,phone,address,parentEmail,parentPassword,password
John Doe,john.doe@example.com,101,REPLACE_WITH_CLASS_ID,2008-05-15,Robert Doe,+1234567890,123 Main St,parent.john@example.com,parent123,student123
Jane Smith,jane.smith@example.com,102,REPLACE_WITH_CLASS_ID,2008-07-20,Sarah Smith,+1234567891,456 Oak Ave,parent.jane@example.com,parent123,student123
Mike Johnson,mike.johnson@example.com,103,REPLACE_WITH_CLASS_ID,2008-03-10,David Johnson,+1234567892,789 Pine Rd,parent.mike@example.com,parent123,student123
Emily Brown,emily.brown@example.com,104,REPLACE_WITH_CLASS_ID,2008-11-25,Patricia Brown,+1234567893,321 Elm St,parent.emily@example.com,parent123,student123
Alex Williams,alex.williams@example.com,105,REPLACE_WITH_CLASS_ID,2008-09-08,Michael Williams,+1234567894,654 Maple Dr,parent.alex@example.com,parent123,student123`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-gray-500 text-sm">Manage student records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadSampleCSV} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Sample CSV
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={18} /> Import CSV
          </button>
          <button onClick={openCreate} className="btn-primary">+ Add Student</button>
        </div>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-4">
        <input placeholder="Search by name, roll no..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field flex-1" />
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="input-field sm:w-48">
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Roll No', 'Name', 'Class', 'Parent', 'Phone', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                ) : students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium">{s.user?.name}</td>
                    <td className="px-4 py-3 text-sm">{s.class ? `${s.class.name}-${s.class.section}` : '—'}</td>
                    <td className="px-4 py-3 text-sm">{s.parentName}</td>
                    <td className="px-4 py-3 text-sm">{s.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setViewStudent(s)} 
                          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                          title="View student"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openEdit(s)} 
                          className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition"
                          title="Edit student"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s._id)} 
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                          title="Delete student"
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email *</label><input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            {!editing && <div><label className="label">Password</label><input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: student123" /></div>}
            <div><label className="label">Roll Number *</label><input className="input-field" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required /></div>
            <div><label className="label">Class *</label>
              <select className="input-field" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} required>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
              </select>
            </div>
            <div><label className="label">Date of Birth *</label><input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required /></div>
            <div><label className="label">Parent Name *</label><input className="input-field" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} required /></div>
            <div><label className="label">Phone *</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="sm:col-span-2"><label className="label">Address</label><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="label">Parent Email (creates parent login)</label><input type="email" className="input-field" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@email.com" /></div>
            <div><label className="label">Parent Password</label><input type="password" className="input-field" value={form.parentPassword} onChange={(e) => setForm({ ...form, parentPassword: e.target.value })} placeholder="Default: parent123" /></div>
            <div className="sm:col-span-2"><label className="label">Photo</label><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Profile">
        {viewStudent && (
          <div className="space-y-3 text-sm">
            {viewStudent.photo && <img src={`${API_BASE}${viewStudent.photo}`} alt="" className="w-24 h-24 rounded-full object-cover" />}
            <p><span className="text-gray-500">Name:</span> <strong>{viewStudent.user?.name}</strong></p>
            <p><span className="text-gray-500">Roll No:</span> {viewStudent.rollNumber}</p>
            <p><span className="text-gray-500">Class:</span> {viewStudent.class?.name}-{viewStudent.class?.section}</p>
            <p><span className="text-gray-500">DOB:</span> {new Date(viewStudent.dateOfBirth).toLocaleDateString()}</p>
            <p><span className="text-gray-500">Parent:</span> {viewStudent.parentName}</p>
            <p><span className="text-gray-500">Phone:</span> {viewStudent.phone}</p>
            <p><span className="text-gray-500">Address:</span> {viewStudent.address || '—'}</p>
          </div>
        )}
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Students from CSV" size="lg">
        <form onSubmit={handleImportCSV} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">CSV Format Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Required columns: name, email, rollNumber, classId, dateOfBirth, parentName, phone</li>
              <li>Optional columns: address, parentEmail, parentPassword, password</li>
              <li>Date format: YYYY-MM-DD (e.g., 2008-05-15)</li>
              <li>ClassId must be the MongoDB ID of the class</li>
              <li>Default passwords: student123, parent123 (if not provided)</li>
            </ul>
          </div>

          <div>
            <label className="label">CSV File *</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="input-field"
              required
            />
            {csvFile && <p className="text-xs text-green-600 mt-1">✓ {csvFile.name} selected</p>}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <p className="text-yellow-800">
              <strong>Tip:</strong> Download and review the sample CSV file to understand the required format before uploading.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowImportModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={importing} className="btn-primary">
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Students;
