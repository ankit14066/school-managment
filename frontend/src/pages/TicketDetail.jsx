import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import GreenSelect from '../components/GreenSelect';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink } from 'lucide-react';

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
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-sky-700 bg-sky-50 border-sky-200';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Complete':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In Progress':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-rose-700 bg-rose-50 border-rose-200';
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
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Tickets
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{ticket.title}</h1>
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{ticket.ticketId}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Submitted by <span className="text-slate-600">{ticket.submittedBy?.name}</span>
            <span className="capitalize"> ({ticket.submittedBy?.role})</span>
            <span className="mx-1.5">•</span>
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 text-xs font-extrabold rounded-xl border ${getPriorityStyle(ticket.priority)}`}>
            {ticket.priority} Priority
          </span>
          <span className={`px-2.5 py-1 text-xs font-extrabold rounded-xl border ${getStatusStyle(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 pb-3 border-b border-slate-50">Description</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
              {ticket.description}
            </p>
          </div>

          {ticket.screenshot && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 pb-3 border-b border-slate-50">Screenshot / Attachment</h3>
              <a
                href={getBackendUrl(ticket.screenshot)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={getBackendUrl(ticket.screenshot)}
                  alt="Attachment"
                  className="w-full object-contain max-h-96"
                />
              </a>
              <p className="text-xs font-bold text-slate-400 mt-3 text-center uppercase tracking-wider">Click image to open in new tab</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-3">Details</h3>

            <div>
              <p className="label mb-1">Module Name</p>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{ticket.moduleName}</span>
            </div>

            {ticket.referenceUrl && (
              <div>
                <p className="label mb-1">Reference URL</p>
                <a
                  href={ticket.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 truncate transition-colors"
                >
                  {ticket.referenceUrl}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            )}

            {ticket.closedAt && (
              <div>
                <p className="label mb-1">Resolved On</p>
                <p className="text-sm font-bold text-slate-800">
                  {new Date(ticket.closedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {isDeveloper ? (
            <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)] space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-3">Developer Controls</h3>

              <div>
                <label className="label">Update Status</label>
                <GreenSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Complete">Complete</option>
                </GreenSelect>
              </div>

              <div>
                <label className="label">Internal Notes (Private)</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={4}
                  placeholder="Write developer progress logs, debugging steps, etc. (Not visible to submitter)..."
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" disabled={updating} className="btn-primary w-full text-xs">
                {updating ? 'Saving...' : 'Save Settings'}
              </button>

              {ticket.status !== 'Complete' && (
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  disabled={updating}
                  className="btn-danger w-full text-xs"
                >
                  Close Ticket
                </button>
              )}
            </form>
          ) : (
            ticket.status === 'Complete' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-emerald-800 text-sm font-extrabold">This ticket is resolved and closed.</p>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetail;
