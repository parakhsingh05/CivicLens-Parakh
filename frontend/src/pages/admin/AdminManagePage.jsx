import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, UserPlus, Trash2, ChevronLeft, Eye, EyeOff, RefreshCw, Users, ShieldCheck,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  superadmin: 'bg-purple-100 text-purple-700 border border-purple-200',
  admin:       'bg-blue-100 text-blue-700 border border-blue-200',
  authority:   'bg-amber-100 text-amber-700 border border-amber-200',
};

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  authority:  'Authority',
};

export default function AdminManagePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // admin object pending confirmation

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAdmins();
      setAdmins(data.admins);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setCreating(true);
    try {
      const { data } = await adminAPI.createAdmin(form);
      toast.success(data.message);
      setForm({ fullName: '', email: '', password: '', role: 'admin' });
      setShowPassword(false);
      await fetchAdmins();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.deleteAdmin(deleteTarget._id);
      toast.success('Admin account deleted');
      setDeleteTarget(null);
      setAdmins(prev => prev.filter(a => a._id !== deleteTarget._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  // Separate current user from others in list
  const otherAdmins = admins.filter(a => a._id !== user?._id);
  const currentAdmin = admins.find(a => a._id === user?._id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm">
              <ChevronLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-600" />
              <span className="font-semibold text-gray-800">Admin Management</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              Signed in as <strong className="text-gray-700">{user?.fullName}</strong>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE.superadmin}`}>
              Superadmin
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors ml-2"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage admin and authority accounts. Only superadmins can access this page.
          </p>
        </div>

        {/* Two-column layout on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Create Admin Form ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <UserPlus size={18} className="text-orange-500" />
                <h2 className="font-semibold text-gray-800">Create New Admin</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Jane Smith"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@civiclens.gov"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                  >
                    <option value="admin">Admin — full dashboard access</option>
                    <option value="authority">Authority — manage & update issues</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {creating ? (
                    <><RefreshCw size={15} className="animate-spin" /> Creating…</>
                  ) : (
                    <><UserPlus size={15} /> Create Account</>
                  )}
                </button>
              </form>

              {/* Role legend */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role guide</p>
                <div className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${ROLE_BADGE.admin}`}>Admin</span>
                  <p className="text-xs text-gray-500">Full dashboard: view, update, assign, delete issues + manage citizens.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${ROLE_BADGE.authority}`}>Authority</span>
                  <p className="text-xs text-gray-500">Department-level: update issue status and add official responses.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Admin List ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={17} className="text-gray-500" />
                  <h2 className="font-semibold text-gray-800">All Admin Accounts</h2>
                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full ml-1">
                    {admins.length}
                  </span>
                </div>
                <button
                  onClick={fetchAdmins}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <RefreshCw size={16} className="animate-spin" /> Loading…
                </div>
              ) : admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <Users size={32} className="opacity-30" />
                  <p>No admins found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {/* Current user first */}
                  {currentAdmin && (
                    <AdminRow
                      admin={currentAdmin}
                      isSelf={true}
                      onDelete={() => {}}
                    />
                  )}
                  {otherAdmins.map(admin => (
                    <AdminRow
                      key={admin._id}
                      admin={admin}
                      isSelf={false}
                      onDelete={() => setDeleteTarget(admin)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Admin Account</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong>'s account?
              They will lose all admin access immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminRow({ admin, isSelf, onDelete }) {
  const initials = admin.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-amber-500', 'bg-pink-500', 'bg-teal-500',
  ];
  const color = avatarColors[admin.email.charCodeAt(0) % avatarColors.length];

  return (
    <li className="px-6 py-4 flex items-center gap-3">
      {admin.avatar?.url ? (
        <img src={admin.avatar.url} alt={admin.fullName} className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800 truncate">{admin.fullName}</span>
          {isSelf && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">You</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[admin.role] || ROLE_BADGE.admin}`}>
            {ROLE_LABELS[admin.role] || admin.role}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{admin.email}</p>
      </div>
      <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
        {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      {!isSelf && admin.role !== 'superadmin' && (
        <button
          onClick={onDelete}
          className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
          title="Delete admin"
        >
          <Trash2 size={15} />
        </button>
      )}
    </li>
  );
}
