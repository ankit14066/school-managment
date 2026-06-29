import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
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
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report an Issue / Support</h1>
          <p className="text-sm text-gray-500">Found a bug or need help? Tell us about the issue and we'll fix it.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Problem Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Attendance page fails to load student names"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Module Name *</label>
              <select
                name="moduleName"
                value={formData.moduleName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
              >
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
              <div className="flex gap-4 items-center h-10">
                {['Low', 'Medium', 'High'].map((p) => (
                  <label key={p} className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={formData.priority === p}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Explain the steps to reproduce the error or detailed context..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reference URL (Optional)</label>
              <input
                type="text"
                name="referenceUrl"
                value={formData.referenceUrl}
                onChange={handleChange}
                placeholder="e.g., http://localhost:3000/attendance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Screenshot / Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SubmitTicket;
