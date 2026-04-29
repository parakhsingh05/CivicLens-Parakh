import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Filter, ChevronRight, Search, Download, BarChart2, ShieldCheck } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const STATUS_CLASSES = {
  'Reported': 'status-reported',
  'In Review': 'status-in-review',
  'In Progress': 'status-in-progress',
  'Resolved': 'status-resolved',
};
const PRIORITY_BG = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-blue-50 text-blue-600',
  High: 'bg-orange-50 text-orange-600',
  Urgent: 'bg-red-50 text-red-600 font-semibold',
};

export default function AdminDashboard() {
  const { user, logout, isSuperadmin } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({ allTotal: 0, newReports: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, search: searchInput })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { fetchIssues(); }, [filters]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const { data } = await adminAPI.getIssues(params);
      setIssues(data.issues);
      setSummary(data.summary);
    } catch { } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this issue? This cannot be undone.')) return;
    try {
      await adminAPI.deleteIssue(id);
      setIssues(prev => prev.filter(i => i.issueId !== id && i._id !== id));
      toast.success('Issue deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Quick priority change inline from the table row
  const handlePriorityChange = async (issue, newPriority, e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await adminAPI.updateIssue(issue.issueId || issue._id, { priority: newPriority });
      setIssues(prev => prev.map(i => i._id === issue._id ? { ...i, priority: newPriority } : i));
      toast.success(`Priority → ${newPriority}`);
    } catch { toast.error('Failed to update priority'); }
  };

  // CSV export of current filtered list
  const handleExport = () => {
    const headers = ['Issue ID', 'Title', 'Category', 'Priority', 'Status', 'Assigned Dept', 'Assigned Officer', 'Location', 'Reported By', 'Date'];
    const rows = issues.map(i => [
      i.issueId,
      `"${i.title}"`,
      i.category,
      i.priority,
      i.status,
      `"${i.assignedTo?.department || ''}"`,
      `"${i.assignedTo?.officer || ''}"`,
      `"${i.location?.address || ''}"`,
      `"${i.reportedBy?.fullName || ''}"`,
      new Date(i.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `civiclens-issues-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const activeFiltersCount = [filters.status, filters.category, filters.priority, filters.search].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-dark text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold">
          <Shield size={18} className="text-primary" /> CivicLens Admin
        </div>
        <div className="flex items-center gap-4">
          {user?.fullName && <span className="text-white/50 text-sm hidden sm:block">{user.fullName}</span>}
          {isSuperadmin && (
            <Link to="/admin/manage" className="text-white/60 hover:text-white text-sm flex items-center gap-1.5">
              <ShieldCheck size={14} /> Manage Admins
            </Link>
          )}
          <button onClick={handleLogout} className="text-white/60 hover:text-white text-sm flex items-center gap-1.5">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { val: summary.allTotal, label: 'Total Issues', color: 'text-gray-700', icon: <BarChart2 size={16} className="text-gray-400 mb-2" /> },
            { val: summary.newReports, label: 'New Reports', color: 'text-blue-600', dot: 'bg-blue-500' },
            { val: summary.inProgress, label: 'In Progress', color: 'text-orange-600', dot: 'bg-orange-500' },
            { val: summary.resolved, label: 'Resolved', color: 'text-green-600', dot: 'bg-green-500' },
          ].map(({ val, label, color, dot, icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-card p-5">
              {dot && <span className={`inline-block w-2 h-2 rounded-full ${dot} mb-2`} />}
              {icon}
              <p className={`text-3xl font-extrabold ${color}`}>{val}</p>
              <p className="text-gray-500 text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + Export */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Search by title, issue ID, or location…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <span className="text-gray-500 text-sm font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setFilters({ status: '', category: '', priority: '', search: '' }); setSearchInput(''); }}
                className="text-xs text-primary hover:underline ml-auto"
              >
                Clear all ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Status row */}
          <div className="flex flex-wrap gap-2 mb-2">
            {['All Status', 'Reported', 'In Review', 'In Progress', 'Resolved'].map(s => (
              <button key={s}
                onClick={() => setFilters(f => ({ ...f, status: s === 'All Status' ? '' : s }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  (filters.status === s || (s === 'All Status' && !filters.status))
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* Category + Priority row */}
          <div className="flex flex-wrap gap-2">
            {['All Types', 'Road', 'Water', 'Electricity', 'Sanitation', 'Other'].map(c => (
              <button key={c}
                onClick={() => setFilters(f => ({ ...f, category: c === 'All Types' ? '' : c }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  (filters.category === c || (c === 'All Types' && !filters.category))
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {c}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 self-center mx-1" />
            {['All Priority', 'Low', 'Medium', 'High', 'Urgent'].map(p => (
              <button key={p}
                onClick={() => setFilters(f => ({ ...f, priority: p === 'All Priority' ? '' : p }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  (filters.priority === p || (p === 'All Priority' && !filters.priority))
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Issues table */}
        <div className="bg-white rounded-2xl shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Issue</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="spinner mx-auto" /></td></tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm">No issues match your filters</p>
                  </td>
                </tr>
              ) : (
                issues.map(issue => (
                  <tr key={issue._id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3 max-w-xs">
                      <p className="font-semibold text-gray-800 truncate">{issue.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{issue.issueId} • {issue.location?.address}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{issue.category}</td>

                    {/* Inline priority dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={issue.priority || 'Medium'}
                        onChange={e => handlePriorityChange(issue, e.target.value, e)}
                        onClick={e => e.stopPropagation()}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 ${PRIORITY_BG[issue.priority] || 'bg-gray-100 text-gray-500'}`}
                      >
                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <span className={STATUS_CLASSES[issue.status]}>{issue.status}</span>
                    </td>

                    {/* Assigned department badge */}
                    <td className="px-4 py-3">
                      {issue.assignedTo?.department ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">{issue.assignedTo.department}</p>
                          {issue.assignedTo.officer && (
                            <p className="text-xs text-gray-400">{issue.assignedTo.officer}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/admin/issues/${issue.issueId || issue._id}`}
                          className="text-primary font-semibold text-xs hover:underline flex items-center gap-1"
                        >
                          Manage <ChevronRight size={12} />
                        </Link>
                        <button
                          onClick={e => handleDelete(issue.issueId || issue._id, e)}
                          className="text-red-400 text-xs hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && issues.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-gray-400 text-xs">
              <span>Showing {issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
              <span className="hidden sm:block">CivicLens Admin Portal • Municipal Maintenance & Management System</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
