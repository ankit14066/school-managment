import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import GreenSelect from '../components/GreenSelect';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const TicketList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    moduleName: '',
    search: '',
  });

  const modules = [
    'Dashboard', 'Students', 'Teachers', 'Classes', 'Subjects',
    'Attendance', 'Fees', 'Results', 'Timetable', 'Notices',
    'Homework', 'Events', 'Messages', 'Other'
  ];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await ticketAPI.getAll(filters);
      setTickets(data.data || []);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filters.status, filters.priority, filters.moduleName, filters.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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

  return (
    <DashboardLayout>
      <div className="mb-8">
          <h1 className="page-title">🎫 Issue Tickets</h1>
          <p className="page-subtitle">View, manage &amp; resolve system tickets</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.008)] mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label">Search</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search title, ID, or user..."
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Status</label>
          <GreenSelect name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </GreenSelect>
        </div>

        <div>
          <label className="label">Priority</label>
          <GreenSelect name="priority" value={filters.priority} onChange={handleFilterChange}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </GreenSelect>
        </div>

        <div>
          <label className="label">Module</label>
          <GreenSelect name="moduleName" value={filters.moduleName} onChange={handleFilterChange}>
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </GreenSelect>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.008)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-4xl block mb-2">🎫</span>
            <p className="text-sm font-extrabold text-slate-600">No tickets found</p>
            <p className="text-xs font-bold text-slate-400 mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  {['Ticket ID', 'Title', 'Module', 'Submitted By', 'Date', 'Priority', 'Status'].map((h) => (
                    <th key={h} className={`table-th ${h === 'Priority' || h === 'Status' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="hover:bg-emerald-50/15 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                      {ticket.ticketId}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800 max-w-xs truncate">
                      {ticket.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{ticket.moduleName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-800">{ticket.submittedBy?.name}</div>
                      <div className="text-xs font-bold text-slate-400 capitalize">{ticket.submittedBy?.role}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-xl border ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-xl border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TicketList;
