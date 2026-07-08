import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resultAPI, classAPI, subjectAPI, studentAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const Results = () => {
  const { isAdmin, isTeacher, isStudent, profile } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [markRecords, setMarkRecords] = useState([]);
  const [examForm, setExamForm] = useState({ name: 'Mid-term', class: '', subject: '', maxMarks: 100, date: '', academicYear: '2025-2026' });
  const [studentSummary, setStudentSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isStudent && profile?._id) {
          const { data } = await resultAPI.getStudentSummary(profile._id);
          setStudentSummary(data.data);
        } else {
          const [examRes, resultRes] = await Promise.all([
            resultAPI.getExams({ limit: 50 }),
            resultAPI.getAll({ limit: 50 }),
          ]);
          setExams(examRes.data.data);
          setResults(resultRes.data.data);
        }
      } catch { toast.error('Failed to load results'); }
      finally { setLoading(false); }
    };
    load();
    if (!isStudent) {
      classAPI.getAll({ limit: 100 }).then(({ data }) => setClasses(data.data)).catch(() => {});
      subjectAPI.getAll({ limit: 100 }).then(({ data }) => setSubjects(data.data)).catch(() => {});
    }
  }, [isStudent, profile]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await resultAPI.createExam(examForm);
      toast.success('Exam created');
      setShowExamModal(false);
      const { data } = await resultAPI.getExams({ limit: 50 });
      setExams(data.data);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const openMarksEntry = async (exam) => {
    setSelectedExam(exam);
    try {
      const { data } = await studentAPI.getAll({ class: exam.class?._id || exam.class, limit: 100 });
      const existing = await resultAPI.getAll({ exam: exam._id, limit: 100 });
      const existingMap = {};
      existing.data.data.forEach((r) => { existingMap[r.student?._id || r.student] = r.marksObtained; });
      setMarkRecords(data.data.map((s) => ({
        student: s._id,
        name: s.user?.name,
        rollNumber: s.rollNumber,
        marksObtained: existingMap[s._id] || '',
      })));
      setShowMarksModal(true);
    } catch { toast.error('Failed to load students'); }
  };

  const handleBulkMarks = async () => {
    try {
      await resultAPI.bulkEnter({
        exam: selectedExam._id,
        records: markRecords.filter((r) => r.marksObtained !== '').map((r) => ({
          student: r.student,
          marksObtained: parseFloat(r.marksObtained),
        })),
      });
      toast.success('Marks saved');
      setShowMarksModal(false);
      const { data } = await resultAPI.getAll({ limit: 50 });
      setResults(data.data);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const gradeColor = { A: 'active', B: 'teacher', C: 'admin', D: 'inactive', F: 'inactive' };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">{isStudent ? '📊 My Results' : '📊 Results & Exams'}</h1>
          <p className="page-subtitle">{isStudent ? 'Your academic performance' : 'Manage exams, marks &amp; report cards'}</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={() => setShowExamModal(true)} className="btn-primary text-xs">+ Create Exam</button>
        )}
      </div>

      {isStudent && studentSummary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[
              { l: 'Total Marks', v: `${studentSummary.totalMarks}/${studentSummary.maxMarks}` },
              { l: 'Percentage', v: `${studentSummary.overallPercentage}%` },
              { l: 'Subjects', v: studentSummary.subjectCount },
            ].map((s) => (
              <div key={s.l} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">{s.l}</p>
                <p className="text-2xl font-extrabold text-slate-800">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50/60 border-b border-slate-100"><tr>{['Exam','Subject','Marks','Percentage','Grade'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {studentSummary.results?.map((r) => (
                  <tr key={r._id} className="hover:bg-emerald-50/15">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{r.exam?.name}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{r.exam?.subject?.name}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{r.marksObtained}/{r.exam?.maxMarks}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">{r.percentage}%</td>
                    <td className="px-5 py-3.5"><Badge variant={gradeColor[r.grade]}>{r.grade}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isStudent && (
        <>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {exams.map((exam) => (
              <div key={exam._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] hover:border-slate-200/50">
                <h3 className="text-sm font-extrabold text-slate-800">{exam.name}</h3>
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block mt-1">{exam.subject?.name} — Class {exam.class?.name}-{exam.class?.section}</p>
                <p className="text-xs font-semibold text-slate-500 mt-2">Max Marks: {exam.maxMarks} · {new Date(exam.date).toLocaleDateString()}</p>
                <button onClick={() => openMarksEntry(exam)} className="btn-primary text-xs mt-4 w-full">Enter Marks</button>
              </div>
            ))}
          </div>

          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">Recent Results</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50/60 border-b border-slate-100"><tr>{['Student','Exam','Subject','Marks','Grade'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-emerald-50/15">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{r.student?.user?.name}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{r.exam?.name}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{r.exam?.subject?.name}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{r.marksObtained}/{r.exam?.maxMarks}</td>
                    <td className="px-5 py-3.5"><Badge variant={gradeColor[r.grade]}>{r.grade}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={showExamModal} onClose={() => setShowExamModal(false)} title="Create Exam">
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Exam</label><select className="input-field" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}><option>Mid-term</option><option>Final</option><option>Unit Test</option><option>Quarterly</option></select></div>
            <div><label className="label">Max Marks</label><input type="number" className="input-field" value={examForm.maxMarks} onChange={(e) => setExamForm({ ...examForm, maxMarks: parseInt(e.target.value) })} /></div>
            <div><label className="label">Class</label><select className="input-field" value={examForm.class} onChange={(e) => setExamForm({ ...examForm, class: e.target.value })} required><option value="">Select</option>{classes.map((c) => <option key={c._id} value={c._id}>Class {c.name}-{c.section}</option>)}</select></div>
            <div><label className="label">Subject</label><select className="input-field" value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} required><option value="">Select</option>{subjects.filter((s) => !examForm.class || s.class?._id === examForm.class || s.class === examForm.class).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
            <div><label className="label">Date</label><input type="date" className="input-field" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} required /></div>
          </div>
          <button type="submit" className="btn-primary w-full">Create Exam</button>
        </form>
      </Modal>

      <Modal isOpen={showMarksModal} onClose={() => setShowMarksModal(false)} title={`Enter Marks — ${selectedExam?.name}`} size="lg">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 sticky top-0"><tr><th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Roll No</th><th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Name</th><th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Marks (/{selectedExam?.maxMarks})</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {markRecords.map((r, i) => (
                <tr key={r.student} className="hover:bg-emerald-50/15">
                  <td className="px-5 py-2.5 text-xs font-bold font-mono text-slate-600">{r.rollNumber}</td>
                  <td className="px-5 py-2.5 text-sm font-bold text-slate-800">{r.name}</td>
                  <td className="px-3 py-2"><input type="number" className="input-field w-24" min={0} max={selectedExam?.maxMarks} value={r.marksObtained} onChange={(e) => { const u = [...markRecords]; u[i] = { ...u[i], marksObtained: e.target.value }; setMarkRecords(u); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={handleBulkMarks} className="btn-primary w-full mt-4">Save All Marks</button>
      </Modal>
    </DashboardLayout>
  );
};

export default Results;
