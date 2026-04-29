import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, PlusCircle, ArrowRight, MapPin, Clock } from 'lucide-react';
import { issueAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_ICONS = { Road: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Other: '📋' };
const STATUS_CLASSES = {
  'Reported': 'status-reported',
  'In Review': 'status-in-review',
  'In Progress': 'status-in-progress',
  'Resolved': 'status-resolved',
};

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, resolved: 0, resolutionRate: 0 });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, issuesRes] = await Promise.all([
          issueAPI.getStats(),
          issueAPI.getAll({ limit: 3 }),
        ]);
        setStats(statsRes.data.stats);
        setIssues(issuesRes.data.issues);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-primary text-white px-6 pt-10 pb-16">
        <div className="flex items-center gap-2 mb-4 text-white/80 text-sm font-semibold">
          <Shield size={16} /> CIVICLENS
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Smart City Issue<br />Reporting</h1>
        <p className="text-white/70 text-sm mb-6">Report civic issues, track resolutions, and build a better city together. Your voice makes a difference.</p>
        <Link to="/report" className="bg-white text-primary font-semibold px-6 py-3 rounded-full flex items-center gap-2 w-fit hover:bg-gray-100 transition-colors">
          <PlusCircle size={18} /> Report an Issue
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-8 grid grid-cols-3 gap-3">
        {[
          { value: stats.total, label: 'Issues Reported', color: 'text-primary' },
          { value: stats.resolved, label: 'Resolved', color: 'text-green-500' },
          { value: `${stats.resolutionRate}%`, label: 'Resolution Rate', color: 'text-primary' },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-card p-4 text-center">
            <p className={`text-2xl font-extrabold ${color}`}>{loading ? '–' : value}</p>
            <p className="text-gray-500 text-[10px] mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Issues */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Recent Issues</h2>
          <Link to="/track" className="text-primary text-sm font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="spinner" /></div>
        ) : issues.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No issues reported yet.</p>
            <Link to="/report" className="text-primary font-medium text-sm">Be the first to report!</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <Link to={`/track/${issue._id}`} key={issue._id} className="bg-white rounded-2xl shadow-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                  {CATEGORY_ICONS[issue.category] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{issue.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{issue.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin size={10} /> {issue.location?.address}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock size={10} /> {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    <span className={STATUS_CLASSES[issue.status]}>{issue.status}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
