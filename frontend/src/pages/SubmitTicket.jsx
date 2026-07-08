import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import GreenSelect from '../components/GreenSelect';
import toast from 'react-hot-toast';

const SubmitTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    moduleName: 'Dashboard',
    description: '',
    referenceUrl: '',
    priority: 'Medium',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const modules = [
    'Dashboard', 'Students', 'Teachers', 'Classes', 'Subjects',
    'Attendance', 'Fees', 'Results', 'Timetable', 'Notices',
    'Homework', 'Events', 'Messages', 'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Title is required');
    if (!formData.description.trim()) return toast.error('Description is required');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('moduleName', formData.moduleName);
      data.append('description', formData.description);
      data.append('referenceUrl', formData.referenceUrl);
      data.append('priority', formData.priority);
      if (file) {
        data.append('screenshot', file);
      }

      await ticketAPI.create(data);
      toast.success('Issue ticket submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title">🎫 Report an Issue</h1>
        <p className="page-subtitle">Found a bug or need help? Submit a support ticket</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] space-y-6 max-w-3xl">
        <div>
          <label className="label">Problem Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Attendance page fails to load student names"
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Module Name *</label>
            <GreenSelect name="moduleName" value={formData.moduleName} onChange={handleChange}>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </GreenSelect>
          </div>

          <div>
            <label className="label">Priority *</label>
            <div className="flex gap-4 items-center h-10">
              {['Low', 'Medium', 'High'].map((p) => (
                <label key={p} className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={formData.priority === p}
                    onChange={handleChange}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="ml-2 text-xs font-bold text-slate-600">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Detailed Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Explain the steps to reproduce the error or detailed context..."
            className="input-field resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Reference URL (Optional)</label>
            <input
              type="text"
              name="referenceUrl"
              value={formData.referenceUrl}
              onChange={handleChange}
              placeholder="e.g., http://localhost:3000/attendance"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Screenshot / Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary text-xs">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary text-xs">
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default SubmitTicket;
