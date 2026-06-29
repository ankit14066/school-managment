import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Tickets</h1>
        <p className="text-sm text-gray-500">View, manage, and resolve system tickets submitted by users.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Search</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search title, ID, or user..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Module</label>
          <select
            name="moduleName"
            value={filters.moduleName}
            onChange={handleFilterChange}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <span className="text-4xl block mb-2">🎫</span>
            <p className="font-semibold text-lg">No tickets found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Priority</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                      {ticket.ticketId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                      {ticket.title}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.moduleName}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.submittedBy?.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{ticket.submittedBy?.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(ticket.status)}`}>
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
