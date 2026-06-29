import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDeveloper } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const { data } = await ticketAPI.getById(id);
      setTicket(data.data);
      setStatus(data.data.status);
      setInternalNotes(data.data.internalNotes || '');
    } catch (error) {
      toast.error('Failed to load ticket details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await ticketAPI.update(id, { status, internalNotes });
      toast.success('Ticket updated successfully!');
      fetchTicket();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseTicket = async () => {
    setUpdating(true);
    try {
      await ticketAPI.update(id, { status: 'Complete' });
      toast.success('Ticket closed successfully!');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to close ticket');
    } finally {
      setUpdating(false);
    }
  };

  const getBackendUrl = (path) => {
    if (!path) return '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${path}`;
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Complete':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'In Progress':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) return null;

  return (
    <DashboardLayout>
      <div className="w-full px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1 mb-2"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <span className="font-mono text-gray-400 text-lg font-medium">{ticket.ticketId}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Submitted by <span className="font-semibold text-gray-700">{ticket.submittedBy?.name}</span> ({ticket.submittedBy?.role}) on {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityStyle(ticket.priority)}`}>
              {ticket.priority} Priority
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {ticket.screenshot && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Screenshot / Attachment</h3>
                <a
                  href={getBackendUrl(ticket.screenshot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getBackendUrl(ticket.screenshot)}
                    alt="Attachment"
                    className="w-full object-contain max-h-96"
                  />
                </a>
                <p className="text-xs text-gray-400 mt-2 text-center">Click image to open in new tab</p>
              </div>
            )}
          </div>

          {/* Sidebar / Developer Panel */}
          <div className="space-y-6">
            {/* Meta details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Details</h3>
              
              <div>
                <p className="text-xs text-gray-400 uppercase">Module Name</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{ticket.moduleName}</p>
              </div>

              {ticket.referenceUrl && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Reference URL</p>
                  <a
                    href={ticket.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-green-700 hover:underline mt-0.5 block truncate"
                  >
                    {ticket.referenceUrl}
                  </a>
                </div>
              )}

              {ticket.closedAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Resolved On</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {new Date(ticket.closedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Developer Notes & Status Form */}
            {isDeveloper ? (
              <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Developer Controls</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internal Notes (Private)</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                    placeholder="Write developer progress logs, debugging steps, etc. (Not visible to submitter)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Settings'}
                </button>

                {ticket.status !== 'Complete' && (
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    disabled={updating}
                    className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 mt-2"
                  >
                    Close Ticket
                  </button>
                )}
              </form>
            ) : (
              ticket.status === 'Complete' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-800 text-sm font-semibold mt-1">This ticket is resolved and closed.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetail;
