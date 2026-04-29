import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, MapPin, Bell, Shield, HelpCircle, ChevronRight, Plus, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { issueAPI } from '../services/api';

const LEVEL_TITLES = ['', 'Newcomer', 'Reporter', 'Contributor', 'Advocate', 'Guardian', 'Champion'];
const STATUS_CLASSES = { 'Reported': 'status-reported', 'In Review': 'status-in-review', 'In Progress': 'status-in-progress', 'Resolved': 'status-resolved' };

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myIssues, setMyIssues] = useState([]);

  useEffect(() => {
    issueAPI.getMyIssues({ limit: 2 }).then(({ data }) => setMyIssues(data.issues)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center justify-between px-4 pt-8 pb-3">
        <h1 className="text-xl font-bold">User Profile</h1>
        <Link to="/profile/edit"><Settings size={20} className="text-gray-500" /></Link>
      </div>

      {/* User card */}
      <div className="mx-4 bg-white rounded-2xl shadow-card p-4 flex items-center gap-4">
        <div className="relative">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt={user.fullName} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.fullName?.[0] || 'U'}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {user?.level || 1}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{user?.fullName}</h2>
          <p className="text-gray-400 text-xs">Active Community Member since {new Date(user?.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
          <div className="flex gap-2 mt-1">
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
              Level {user?.level}: {LEVEL_TITLES[user?.level] || 'Member'}
            </span>
            <span className="bg-yellow-50 text-yellow-600 text-xs font-medium px-2 py-0.5 rounded-full">
              ⭐ {user?.points || 0} Points
            </span>
          </div>
        </div>
        <Link to="/profile/edit" className="bg-primary text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-primary-600 transition-colors">
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        {[
          { val: user?.stats?.totalReports || 0, label: 'Reports', color: 'text-primary' },
          { val: user?.stats?.resolvedReports || 0, label: 'Resolved', color: 'text-green-500' },
          { val: user?.savedAlerts?.length || 0, label: 'Saved Alerts', color: 'text-orange-400' },
          { val: user?.stats?.upvotes || 0, label: 'Upvotes', color: 'text-blue-500' },
        ].map(({ val, label, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-card p-3 text-center">
            <p className={`text-xl font-extrabold ${color}`}>{val}</p>
            <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* My Recent Reports */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">My Recent Reports</h3>
          <Link to="/track" className="text-primary text-sm">View All</Link>
        </div>
        {myIssues.length === 0 ? (
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl text-sm">No reports yet</div>
        ) : (
          <div className="space-y-2">
            {myIssues.map(issue => (
              <Link to={`/track/${issue._id}`} key={issue._id} className="bg-white rounded-2xl shadow-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-base">
                  {issue.category === 'Road' ? '🛣️' : issue.category === 'Water' ? '💧' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{issue.title}</p>
                  <p className="text-gray-400 text-xs">{issue.location?.address} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={STATUS_CLASSES[issue.status]}>{issue.status}</span>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Saved Alerts */}
      {user?.savedAlerts?.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="font-bold mb-3">Saved Alert Locations</h3>
          <div className="grid grid-cols-2 gap-2">
            {user.savedAlerts.slice(0, 2).map(alert => (
              <div key={alert._id} className="bg-white rounded-2xl shadow-card p-3 flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{alert.label}</p>
                  <p className="text-gray-400 text-xs">{alert.radius}km radius</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/alerts" className="mt-2 flex items-center gap-2 text-primary text-sm font-medium border-2 border-dashed border-gray-200 rounded-2xl p-3 justify-center hover:border-primary transition-colors">
            <Plus size={14} /> Add New Alert Area
          </Link>
        </div>
      )}

      {/* Account Settings */}
      <div className="px-4 mt-5">
        <h3 className="font-bold text-primary mb-3">Account Settings</h3>
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {[
            { icon: Bell, label: 'Notification Preferences', desc: 'Push, Email, and SMS alerts', to: '/alerts' },
            { icon: Shield, label: 'Privacy & Security', desc: 'Manage password and data visibility', to: '/profile/edit' },
            { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ and community guidelines', to: '/' },
          ].map(({ icon: Icon, label, desc, to }) => (
            <Link to={to} key={label} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                <Icon size={16} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 border-2 border-red-100 rounded-2xl hover:bg-red-50 transition-colors text-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
