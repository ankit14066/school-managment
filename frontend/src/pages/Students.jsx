import { useEffect, useState } from 'react';
import { studentAPI, classAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Edit, Trash2, Eye, Download, Upload, FileText, CheckSquare } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const emptyForm = {
  name: '', email: '', password: '', rollNumber: '', class: '',
  dateOfBirth: '', gender: '', bloodGroup: '', parentName: '', phone: '', address: '',
  parentEmail: '', parentPassword: '',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageMinFilter, setAgeMinFilter] = useState('');
  const [ageMaxFilter, setAgeMaxFilter] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [profileSummary, setProfileSummary] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (classFilter) params.class = classFilter;
      if (genderFilter) params.gender = genderFilter;
      if (ageMinFilter) params.ageMin = ageMinFilter;
      if (ageMaxFilter) params.ageMax = ageMaxFilter;
      if (feeStatusFilter) params.feeStatus = feeStatusFilter;
      const { data } = await studentAPI.getAll(params);
      setStudents(data.data);
      setPages(data.pages);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
  }, [page, search, classFilter, genderFilter, ageMinFilter, ageMaxFilter, feeStatusFilter]);

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
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      parentName: student.parentName,
      phone: student.phone,
      address: student.address || '',
      parentEmail: '',
      parentPassword: '',
    });
    setPhoto(null);
    setShowModal(true);
  };

  const suggestRollNumber = async (classId) => {
    if (!classId || editing) return;
    try {
      const { data } = await studentAPI.getNextRollNumber({ class: classId });
      setForm((prev) => prev.rollNumber ? prev : { ...prev, rollNumber: data.data.nextRollNumber });
    } catch {
      // Roll suggestion is optional; creation can still continue manually.
    }
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
    const result = await Swal.fire({
      title: 'Delete Student',
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
      await studentAPI.delete(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} students?`,
      text: 'Selected students and linked parent logins will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Selected',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await studentAPI.bulkDelete(selectedIds);
      toast.success('Selected students deleted');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    }
  };

  const openProfile = async (student) => {
    setViewStudent(student);
    setProfileSummary(null);
    setProfileLoading(true);
    try {
      const { data } = await studentAPI.getProfileSummary(student._id);
      setProfileSummary(data.data);
    } catch {
      toast.error('Failed to load student profile summary');
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleStudentSelection = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id]);
  };

  const toggleAllStudents = () => {
    setSelectedIds((prev) => prev.length === students.length ? [] : students.map((student) => student._id));
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

      setImportReport(data.data);
      if (!data.data?.errors?.length) setShowImportModal(false);
      setCsvFile(null);
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = async () => {
    let classId = '';
    
    // Get the first available class ID, or use classFilter if available
    if (classFilter) {
      classId = classFilter;
    } else if (classes.length > 0) {
      classId = classes[0]._id;
    } else {
      toast.error('No classes available. Please create a class first.');
      return;
    }

    const csvContent = `name,email,rollNumber,classId,dateOfBirth,gender,bloodGroup,parentName,phone,address,parentEmail,password
John Doe,john.doe@example.com,101,${classId},2008-05-15,male,O+,Robert Doe,+1234567890,123 Main St,parent.john@example.com,student123
Jane Smith,jane.smith@example.com,102,${classId},2008-07-20,female,A+,Sarah Smith,+1234567891,456 Oak Ave,parent.jane@example.com,student123
Mike Johnson,mike.johnson@example.com,103,${classId},2008-03-10,male,B+,David Johnson,+1234567892,789 Pine Rd,parent.mike@example.com,student123
Emily Brown,emily.brown@example.com,104,${classId},2008-11-25,female,AB+,Patricia Brown,+1234567893,321 Elm St,parent.emily@example.com,student123
Alex Williams,alex.williams@example.com,105,${classId},2008-09-08,other,O-,Michael Williams,+1234567894,654 Maple Dr,parent.alex@example.com,student123`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sample-students-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded with actual class ID!');
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...');
      const params = {};
      if (classFilter) params.class = classFilter;
      
      const response = await studentAPI.exportCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Students exported to CSV successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to CSV failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Exporting to PDF...');
      const params = {};
      if (classFilter) params.class = classFilter;
      
      const response = await studentAPI.exportPDF(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Students exported to PDF successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Export to PDF failed');
    }
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
          <button onClick={() => { setImportReport(null); setShowImportModal(true); }} className="btn-secondary flex items-center gap-2">
            <Upload size={18} /> Import CSV
          </button>
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
            <FileText size={18} /> Export CSV
          </button>
          {/* <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Export PDF
          </button> */}
          <button onClick={openCreate} className="btn-primary">+ Add Student</button>
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <input placeholder="Search by name, roll no..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field flex-1" />
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="input-field sm:w-48">
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
        </select>
        <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} className="input-field">
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select value={feeStatusFilter} onChange={(e) => { setFeeStatusFilter(e.target.value); setPage(1); }} className="input-field">
          <option value="">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" placeholder="Min age" value={ageMinFilter} onChange={(e) => { setAgeMinFilter(e.target.value); setPage(1); }} className="input-field" />
          <input type="number" min="0" placeholder="Max age" value={ageMaxFilter} onChange={(e) => { setAgeMaxFilter(e.target.value); setPage(1); }} className="input-field" />
        </div>
        <button
          type="button"
          onClick={() => { setSearch(''); setClassFilter(''); setGenderFilter(''); setFeeStatusFilter(''); setAgeMinFilter(''); setAgeMaxFilter(''); setPage(1); }}
          className="btn-secondary"
        >
          Clear Filters
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="card mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-700">{selectedIds.length} students selected</p>
          <button onClick={handleBulkDelete} className="btn-danger flex items-center justify-center gap-2">
            <CheckSquare size={18} /> Delete Selected
          </button>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto max-h-[573px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 bg-gray-50">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleAllStudents}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  {['Roll No', 'Name', 'Class', 'Gender', 'Blood', 'Parent', 'Phone', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                ) : students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s._id)}
                        onChange={() => toggleStudentSelection(s._id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium">{s.user?.name}</td>
                    <td className="px-4 py-3 text-sm">{s.class ? `${s.class.name}-${s.class.section}` : '—'}</td>
                    <td className="px-4 py-3 text-sm capitalize">{s.gender || '—'}</td>
                    <td className="px-4 py-3 text-sm">{s.bloodGroup || '—'}</td>
                    <td className="px-4 py-3 text-sm">{s.parentName}</td>
                    <td className="px-4 py-3 text-sm">{s.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => openProfile(s)} 
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
              <select className="input-field" value={form.class} onChange={(e) => { setForm({ ...form, class: e.target.value, rollNumber: editing ? form.rollNumber : '' }); suggestRollNumber(e.target.value); }} required>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}
              </select>
            </div>
            <div><label className="label">Date of Birth *</label><input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required /></div>
            <div><label className="label">Gender</label><select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="label">Blood Group</label><select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}><option value="">Select Blood Group</option>{BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}</select></div>
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
          {/* <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">CSV Format Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Required columns:</strong> name, email, rollNumber, classId, dateOfBirth, parentName, phone</li>
              <li><strong>Optional columns:</strong> address, parentEmail, password</li>
              <li><strong>Date format:</strong> YYYY-MM-DD (e.g., 2008-05-15)</li>
              <li><strong>ClassId:</strong> Copy from the sample CSV (includes actual class ID)</li>
              <li><strong>Default password:</strong> student123 (if not provided)</li>
              <li><strong>Important:</strong> Always download the Sample CSV first - it includes the correct class ID to use</li>
            </ul>
          </div> */}

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

          {/* <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <p className="text-yellow-800">
              <strong>👉 Step 1:</strong> Click "Sample CSV" to download the template with actual class ID<br/>
              <strong>👉 Step 2:</strong> Edit the file and add more student rows if needed<br/>
              <strong>👉 Step 3:</strong> Upload the CSV file using this form
            </p>
          </div> */}

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
