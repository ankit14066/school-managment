import { useEffect, useState } from 'react';
import { feeAPI, studentAPI, classAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState({ student: '', amount: '', type: 'tuition', dueDate: '', academicYear: '2025-2026', month: MONTHS[new Date().getMonth()] });
  const [payForm, setPayForm] = useState({ paidAmount: '', paymentMethod: 'cash' });
  const [structureForm, setStructureForm] = useState({ class: '', tuition: '', transport: '', misc: '', academicYear: '2025-2026' });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const { data } = await feeAPI.getAll({ page, limit: 10 });
      setFees(data.data);
      setPages(data.pages);
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFees();
    studentAPI.getAll({ limit: 100 }).then(({ data }) => setStudents(data.data)).catch(() => {});
    classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
    feeAPI.getMonthlyReport({ month: MONTHS[new Date().getMonth()], academicYear: '2025-2026' }).then(({ data }) => setReport(data.data)).catch(() => {});
  }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.create({ ...form, amount: parseFloat(form.amount) });
      toast.success('Fee record created');
      setShowModal(false);
      fetchFees();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.recordPayment(selectedFee._id, { ...payForm, paidAmount: parseFloat(payForm.paidAmount) });
      toast.success('Payment recorded');
      setShowPayModal(false);
      fetchFees();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleStructure = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.createStructure({ ...structureForm, tuition: parseFloat(structureForm.tuition), transport: parseFloat(structureForm.transport || 0), misc: parseFloat(structureForm.misc || 0) });
      toast.success('Fee structure saved');
      setShowStructureModal(false);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const printReceipt = async (feeId) => {
    try {
      const { data } = await feeAPI.getReceipt(feeId);
      setReceipt(data.data);
    } catch { toast.error('Failed to load receipt'); }
  };

  const statusVariant = { paid: 'active', pending: 'inactive', partial: 'teacher' };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold">Fees Management</h1></div>
        <div className="flex gap-2">
          <button onClick={() => setShowStructureModal(true)} className="btn-secondary">Fee Structure</button>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Fee</button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ l: 'Total Due', v: `₹${report.totalDue}` }, { l: 'Collected', v: `₹${report.totalCollected}` }, { l: 'Pending', v: `₹${report.pendingAmount}` }, { l: 'Paid Records', v: report.paid }].map((s) => (
            <div key={s.l} className="card text-center"><p className="text-xs text-gray-500">{s.l}</p><p className="text-xl font-bold mt-1">{s.v}</p></div>
          ))}
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>{['Student','Type','Amount','Paid','Status','Month','Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {fees.map((f) => (
                <tr key={f._id}>
                  <td className="px-4 py-3 text-sm">{f.student?.user?.name}</td>
                  <td className="px-4 py-3 text-sm capitalize">{f.type}</td>
                  <td className="px-4 py-3 text-sm">₹{f.amount}</td>
                  <td className="px-4 py-3 text-sm">₹{f.paidAmount}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[f.status]}>{f.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{f.month}</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    {f.status !== 'paid' && <button onClick={() => { setSelectedFee(f); setPayForm({ paidAmount: String(f.amount - f.paidAmount), paymentMethod: 'cash' }); setShowPayModal(true); }} className="text-green-600 hover:underline">Pay</button>}
                    {f.receiptNumber && <button onClick={() => printReceipt(f._id)} className="text-blue-600 hover:underline">Receipt</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4"><Pagination page={page} pages={pages} onPageChange={setPage} /></div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Fee Record">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Student</label><select className="input-field" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required><option value="">Select</option>{students.map((s) => <option key={s._id} value={s._id}>{s.user?.name} ({s.rollNumber})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Amount</label><input type="number" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><label className="label">Type</label><select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="tuition">Tuition</option><option value="transport">Transport</option><option value="misc">Misc</option><option value="combined">Combined</option></select></div>
            <div><label className="label">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></div>
            <div><label className="label">Month</label><select className="input-field" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <button type="submit" className="btn-primary w-full">Create</button>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <div><label className="label">Amount</label><input type="number" className="input-field" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} required /></div>
          <div><label className="label">Method</label><select className="input-field" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></select></div>
          <button type="submit" className="btn-primary w-full">Record Payment</button>
        </form>
      </Modal>

      <Modal isOpen={showStructureModal} onClose={() => setShowStructureModal(false)} title="Fee Structure">
        <form onSubmit={handleStructure} className="space-y-4">
          <div><label className="label">Class</label><select className="input-field" value={structureForm.class} onChange={(e) => setStructureForm({ ...structureForm, class: e.target.value })} required><option value="">Select</option>{classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Tuition</label><input type="number" className="input-field" value={structureForm.tuition} onChange={(e) => setStructureForm({ ...structureForm, tuition: e.target.value })} required /></div>
            <div><label className="label">Transport</label><input type="number" className="input-field" value={structureForm.transport} onChange={(e) => setStructureForm({ ...structureForm, transport: e.target.value })} /></div>
            <div><label className="label">Misc</label><input type="number" className="input-field" value={structureForm.misc} onChange={(e) => setStructureForm({ ...structureForm, misc: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn-primary w-full">Save Structure</button>
        </form>
      </Modal>

      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Fee Receipt">
        {receipt && (
          <div id="receipt-print" className="space-y-2 text-sm">
            <p className="text-center text-lg font-bold mb-4">FEE RECEIPT</p>
            <p><strong>Receipt No:</strong> {receipt.receiptNumber}</p>
            <p><strong>Student:</strong> {receipt.studentName}</p>
            <p><strong>Class:</strong> {receipt.class}</p>
            <p><strong>Type:</strong> {receipt.type}</p>
            <p><strong>Month:</strong> {receipt.month} ({receipt.academicYear})</p>
            <p><strong>Amount:</strong> ₹{receipt.amount}</p>
            <p><strong>Paid:</strong> ₹{receipt.paidAmount}</p>
            <p><strong>Method:</strong> {receipt.paymentMethod}</p>
            <p><strong>Date:</strong> {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : '—'}</p>
            <button onClick={() => window.print()} className="btn-primary w-full mt-4">Print Receipt</button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Fees;
