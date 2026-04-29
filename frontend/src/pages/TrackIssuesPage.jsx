import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight } from 'lucide-react';
import { issueAPI } from '../services/api';

const STATUS_TABS = ['All', 'Reported', 'In Review', 'In Progress', 'Resolved'];
const STATUS_CLASSES = {
  'Reported': 'status-reported',
  'In Review': 'status-in-review',
  'In Progress': 'status-in-progress',
  'Resolved': 'status-resolved',
};
const CATEGORY_ICONS = { Road: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Other: '📋' };

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TrackIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (activeTab !== 'All') params.status = activeTab;
      if (search) params.search = search;
      const { data } = await issueAPI.getAll(params);
      setIssues(data.issues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchIssues, 300);
    return () => clearTimeout(timeout);
  }, [fetchIssues]);

  return (
    <div className="min-h-screen px-4 pt-8 pb-6">
      <h1 className="text-2xl font-bold mb-4">Track Issues</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search issues..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <Link to={`/track/${issue._id}`} key={issue._id}
              className="bg-white rounded-2xl shadow-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                {CATEGORY_ICONS[issue.category] || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{issue.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{issue.description}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <MapPin size={10} /> {issue.location?.address}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock size={10} /> {timeAgo(issue.createdAt)}
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
  );
}
