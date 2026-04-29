import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, MoreVertical, MapPin, Bell, ThumbsUp } from 'lucide-react';
import { issueAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import MapComponent from '../components/MapComponent';

const STATUS_CLASSES = {
  'Reported': 'status-reported',
  'In Review': 'status-in-review',
  'In Progress': 'status-in-progress',
  'Resolved': 'status-resolved',
};

const STATUS_ICONS = {
  'Reported': '📥',
  'In Review': '🔍',
  'In Progress': '🔧',
  'Resolved': '✅'
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);

  useEffect(() => { fetchIssue(); }, [id]);

  const fetchIssue = async () => {
    try {
      const { data } = await issueAPI.getOne(id);
      setIssue(data.issue);
      setUpvoted(data.issue.upvotes?.includes(user?._id));
    } catch {
      toast.error('Issue not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const { data } = await issueAPI.upvote(id);
      setUpvoted(data.upvoted);
      setIssue(p => ({ ...p, upvotes: Array(data.upvoteCount).fill('') }));
    } catch {
      toast.error('Failed to upvote');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="spinner" />
    </div>
  );

  if (!issue) return (
    <div className="flex justify-center items-center min-h-screen text-gray-400">
      Issue not found
    </div>
  );

  // ✅ FIXED: correct path is location.coordinates.lat / lng
  const lat = issue.location?.coordinates?.lat;
  const lng = issue.location?.coordinates?.lng;
  const hasLocation = lat && lng;

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-3">
        <Link to="/track" className="text-gray-600"><ArrowLeft size={20} /></Link>
        <h2 className="font-bold">Issue Details</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigator.share?.({ title: issue.title, url: window.location.href })}
            className="text-gray-500"
          >
            <Share2 size={18} />
          </button>
          <button className="text-gray-500"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Photo with geo-tag stamp */}
      {issue.photo?.url && (
        <div className="relative mx-4 rounded-2xl overflow-hidden mb-4">
          <img
            src={issue.photo.url.startsWith('http') ? issue.photo.url : `http://localhost:5000${issue.photo.url}`}
            alt={issue.title}
            className="w-full h-52 object-cover"
          />
          {/* Status badge */}
          <span className={`absolute top-3 left-3 ${STATUS_CLASSES[issue.status]}`}>
            {issue.status}
          </span>
          {/* ✅ Geo-tag stamp on photo */}
          {hasLocation && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-green-400" />
                <span className="text-white text-xs font-mono">
                  {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-0.5">
                {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="px-4">

        {/* Title */}
        <h1 className="text-xl font-bold">{issue.title}</h1>
        <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
          <MapPin size={12} />
          {issue.location?.address} • Reported {new Date(issue.createdAt).toLocaleDateString()}
        </div>

        {/* Upvote */}
        <button
          onClick={handleUpvote}
          className={`mt-3 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
            upvoted ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'
          }`}
        >
          <ThumbsUp size={14} /> {issue.upvotes?.length || 0} Upvotes
        </button>

        {/* Description */}
        <div className="bg-gray-50 rounded-2xl p-4 mt-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{issue.description}</p>
        </div>

        {/* ✅ MAP SECTION */}
        {hasLocation ? (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">📍 Issue Location</h3>
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <MapComponent
                lat={Number(lat)}
                lng={Number(lng)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <MapPin size={11} />
              {issue.location.address}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-gray-100 h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
            <MapPin size={22} className="mb-1" />
            <p className="text-xs">No location data available</p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-gray-50 rounded-2xl p-4 mt-4">
          <h3 className="font-semibold mb-4">Activity Timeline</h3>
          <div className="relative">
            {issue.timeline?.map((event, i) => (
              <div key={i} className="flex gap-3 mb-4 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    i === issue.timeline.length - 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {STATUS_ICONS[event.status] || '•'}
                  </div>
                  {i < issue.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  )}
                </div>
                <div>
                  <p className={`font-medium text-sm ${i === issue.timeline.length - 1 ? 'text-primary' : ''}`}>
                    {event.title}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{event.description}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Update */}
        {issue.officialUpdate?.message && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
            <h3 className="font-semibold text-blue-800 mb-2">🏛️ Official Updates</h3>
            <div className="bg-white rounded-xl p-3">
              <p className="text-primary font-medium text-sm">{issue.officialUpdate.from}</p>
              <p className="text-gray-600 text-sm mt-1">{issue.officialUpdate.message}</p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(issue.officialUpdate.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Follow Progress */}
        <div className="bg-blue-50 rounded-2xl p-4 mt-4 mb-6">
          <h3 className="font-semibold text-sm mb-1">Stay Updated</h3>
          <p className="text-gray-500 text-xs mb-3">
            Enable notifications to get real-time alerts when the status changes.
          </p>
          <button className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2">
            <Bell size={14} /> Follow Progress
          </button>
        </div>

      </div>
    </div>
  );
}