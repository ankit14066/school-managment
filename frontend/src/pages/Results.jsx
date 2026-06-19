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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{isStudent ? 'My Results' : 'Results & Exams'}</h1>
        {(isAdmin || isTeacher) && (
          <div className="flex gap-2">
            <button onClick={() => setShowExamModal(true)} className="btn-secondary">+ Create Exam</button>
          </div>
        )}
      </div>

      {isStudent && studentSummary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center"><p className="text-xs text-gray-500">Total Marks</p><p className="text-2xl font-bold">{studentSummary.totalMarks}/{studentSummary.maxMarks}</p></div>
            <div className="card text-center"><p className="text-xs text-gray-500">Percentage</p><p className="text-2xl font-bold">{studentSummary.overallPercentage}%</p></div>
            <div className="card text-center"><p className="text-xs text-gray-500">Subjects</p><p className="text-2xl font-bold">{studentSummary.subjectCount}</p></div>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>{['Exam','Subject','Marks','Percentage','Grade'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {studentSummary.results?.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 text-sm">{r.exam?.name}</td>
                    <td className="px-4 py-3 text-sm">{r.exam?.subject?.name}</td>
                    <td className="px-4 py-3 text-sm">{r.marksObtained}/{r.exam?.maxMarks}</td>
                    <td className="px-4 py-3 text-sm">{r.percentage}%</td>
                    <td className="px-4 py-3"><Badge variant={gradeColor[r.grade]}>{r.grade}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isStudent && (
        <>
          <h2 className="text-lg font-semibold mb-4">Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {exams.map((exam) => (
              <div key={exam._id} className="card">
                <h3 className="font-semibold">{exam.name}</h3>
                <p className="text-sm text-gray-500">{exam.subject?.name} — Class {exam.class?.name}-{exam.class?.section}</p>
                <p className="text-sm text-gray-500">Max Marks: {exam.maxMarks} | {new Date(exam.date).toLocaleDateString()}</p>
                <button onClick={() => openMarksEntry(exam)} className="btn-primary text-sm mt-3 w-full">Enter Marks</button>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-4">Recent Results</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>{['Student','Exam','Subject','Marks','Grade'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {results.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 text-sm">{r.student?.user?.name}</td>
                    <td className="px-4 py-3 text-sm">{r.exam?.name}</td>
                    <td className="px-4 py-3 text-sm">{r.exam?.subject?.name}</td>
                    <td className="px-4 py-3 text-sm">{r.marksObtained}/{r.exam?.maxMarks}</td>
                    <td className="px-4 py-3"><Badge variant={gradeColor[r.grade]}>{r.grade}</Badge></td>
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
            <thead className="bg-gray-50 sticky top-0"><tr><th className="text-left px-3 py-2 text-xs">Roll No</th><th className="text-left px-3 py-2 text-xs">Name</th><th className="text-left px-3 py-2 text-xs">Marks (/{selectedExam?.maxMarks})</th></tr></thead>
            <tbody className="divide-y">
              {markRecords.map((r, i) => (
                <tr key={r.student}>
                  <td className="px-3 py-2 text-sm font-mono">{r.rollNumber}</td>
                  <td className="px-3 py-2 text-sm">{r.name}</td>
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
