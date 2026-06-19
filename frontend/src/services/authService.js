import api from './api';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
};

export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getProfileSummary: (id) => api.get(`/students/${id}/profile-summary`),
  getNextRollNumber: (params) => api.get('/students/next-roll', { params }),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkDelete: (ids) => api.post('/students/bulk-delete', { ids }),
  exportCSV: (params) => api.get('/students/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/students/export/pdf', { params, responseType: 'blob' }),
};

export const teacherAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  exportCSV: (params) => api.get('/teachers/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/teachers/export/pdf', { params, responseType: 'blob' }),
};

export const classAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  exportCSV: (params) => api.get('/subjects/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/subjects/export/pdf', { params, responseType: 'blob' }),
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  getReport: (studentId, params) => api.get(`/attendance/report/${studentId}`, { params }),
  getTodaySummary: () => api.get('/attendance/summary/today'),
  getClassStudents: (classId, params) => api.get(`/attendance/class/${classId}/students`, { params }),
};

export const feeAPI = {
  getAll: (params) => api.get('/fees', { params }),
  create: (data) => api.post('/fees', data),
  recordPayment: (id, data) => api.put(`/fees/${id}/pay`, data),
  getReceipt: (id) => api.get(`/fees/${id}/receipt`),
  getMonthlyReport: (params) => api.get('/fees/report/monthly', { params }),
  getStructures: () => api.get('/fees/structures'),
  createStructure: (data) => api.post('/fees/structures', data),
};

export const resultAPI = {
  getExams: (params) => api.get('/results/exams', { params }),
  createExam: (data) => api.post('/results/exams', data),
  getAll: (params) => api.get('/results', { params }),
  create: (data) => api.post('/results', data),
  bulkEnter: (data) => api.post('/results/bulk', data),
  getStudentSummary: (studentId) => api.get(`/results/summary/${studentId}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getTeacher: () => api.get('/dashboard/teacher'),
  getStudent: () => api.get('/dashboard/student'),
};

export const parentAPI = {
  getDashboard: () => api.get('/parents/dashboard'),
  getAttendance: (params) => api.get('/parents/attendance', { params }),
};

export const noticeAPI = {
  getAll: (params) => api.get('/notices', { params }),
  create: (data) => api.post('/notices', data),
  markRead: (id) => api.put(`/notices/${id}/read`),
  delete: (id) => api.delete(`/notices/${id}`),
};

export const timetableAPI = {
  getAll: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  bulkCreate: (data) => api.post('/timetable/bulk', data),
  delete: (id) => api.delete(`/timetable/${id}`),
  exportCSV: (params) => api.get('/timetable/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/timetable/export/pdf', { params, responseType: 'blob' }),
};

export const homeworkAPI = {
  getAll: (params) => api.get('/homework', { params }),
  create: (data) => api.post('/homework', data),
  submit: (id) => api.put(`/homework/${id}/submit`),
  getSubmissions: (id) => api.get(`/homework/${id}/submissions`),
};

export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  delete: (id) => api.delete(`/events/${id}`),
};

export const messageAPI = {
  getInbox: (params) => api.get('/messages', { params }),
  send: (data) => api.post('/messages', data),
  broadcast: (data) => api.post('/messages/broadcast', data),
  sendToParent: (data) => api.post('/messages/to-parent', data),
  markRead: (id) => api.put(`/messages/${id}/read`),
};

export const reportAPI = {
  downloadMarksheet: (studentId) => api.get(`/reports/marksheet/${studentId}`, { responseType: 'blob' }),
  downloadAttendance: (studentId, params) => api.get(`/reports/attendance/${studentId}`, { params, responseType: 'blob' }),
  downloadFeeReceipt: (feeId) => api.get(`/reports/fee-receipt/${feeId}`, { responseType: 'blob' }),
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
