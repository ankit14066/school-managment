import { useEffect, useState } from 'react';
import { feeAPI, studentAPI, classAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Printer, ReceiptText } from 'lucide-react';

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
  const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatLabel = (value) => value ? value.replace(/_/g, ' ') : 'N/A';

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

      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Fee Receipt" size="lg">
        {receipt && (
          <div>
            <div id="receipt-print" className="overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900">
              <div className="bg-gray-950 px-6 py-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">SchoolMS Phase 2</p>
                    <h2 className="mt-2 text-2xl font-bold">Fee Receipt</h2>
                    <p className="mt-1 text-sm text-gray-300">Official payment acknowledgement</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <ReceiptText size={26} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-gray-400">Receipt No.</p>
                    <p className="mt-1 font-semibold">{receipt.receiptNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Payment Date</p>
                    <p className="mt-1 font-semibold">{formatDate(receipt.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Status</p>
                    <p className="mt-1 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">{receipt.status}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[1fr_240px]">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Received From</p>
                    <h3 className="mt-1 text-xl font-bold">{receipt.studentName}</h3>
                    <p className="mt-1 text-sm text-gray-500">{receipt.class} {receipt.rollNumber ? `- Roll No. ${receipt.rollNumber}` : ''}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ['Fee Type', formatLabel(receipt.type)],
                      ['Month', `${receipt.month} (${receipt.academicYear})`],
                      ['Payment Method', formatLabel(receipt.paymentMethod)],
                      ['Academic Year', receipt.academicYear],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                        <p className="mt-1 text-sm font-semibold capitalize text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase text-gray-500">Payment Summary</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-semibold">{formatCurrency(receipt.amount)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Paid Amount</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(receipt.paidAmount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-700">Balance Due</span>
                        <span className="text-lg font-bold text-gray-950">{formatCurrency(receipt.dueAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 px-6 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Note</p>
                    <p className="mt-1 text-sm text-gray-600">This is a computer generated receipt.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="mb-2 h-px w-40 bg-gray-300 sm:ml-auto" />
                    <p className="text-xs font-semibold uppercase text-gray-500">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => window.print()} className="btn-primary mt-4 flex w-full items-center justify-center gap-2">
              <Printer size={18} /> Print Receipt
            </button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Fees;
