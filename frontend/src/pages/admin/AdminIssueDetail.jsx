import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, MapPin, User, Shield, Phone, Mail, Image } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import MapComponent from '../../components/MapComponent';

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Water & Sanitation',
  'Electricity',
  'Waste Management',
  'Public Safety',
  'Parks & Recreation',
  'General Administration',
];
const STATUS_OPTIONS = ['In Review', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_BADGE = {
  'Reported': 'bg-blue-100 text-blue-700',
  'In Review': 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-orange-100 text-orange-700',
  'Resolved': 'bg-green-100 text-green-700',
};
const PRIORITY_BADGE = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-50 text-blue-600',
  High: 'bg-orange-50 text-orange-600',
  Urgent: 'bg-red-50 text-red-600',
};
const TIMELINE_STEP = { 'Reported': 0, 'In Review': 1, 'In Progress': 2, 'Resolved': 3 };

export default function AdminIssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [form, setForm] = useState({
    status: '',
    priority: '',
    assignDepartment: '',
    assignOfficer: '',
    resolutionNotes: '',
    officialMessage: '',
  });

  useEffect(() => { fetchIssue(); }, [id]);

  const fetchIssue = async () => {
    try {
      const { data } = await adminAPI.getIssue(id);
      const iss = data.issue;
      setIssue(iss);
      setForm(f => ({
        ...f,
        status: iss.status,
        priority: iss.priority || 'Medium',
        assignDepartment: iss.assignedTo?.department || '',
        assignOfficer: iss.assignedTo?.officer || '',
      }));
    } catch {
      toast.error('Issue not found');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { data } = await adminAPI.updateIssue(id, {
        status: form.status,
        priority: form.priority,
        assignDepartment: form.assignDepartment,
        assignOfficer: form.assignOfficer,
        resolutionNotes: form.resolutionNotes,
        officialMessage: form.officialMessage,
        officialFrom: user?.fullName || 'Municipal Authority',
      });
      setIssue(data.issue);
      setForm(f => ({ ...f, resolutionNotes: '', officialMessage: '' }));
      toast.success('Issue updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="spinner" /></div>;
  if (!issue) return null;

  const currentStep = TIMELINE_STEP[issue.status] || 0;
  const photoSrc = issue.photo?.url
    ? (issue.photo.url.startsWith('http') ? issue.photo.url : `http://localhost:5000${issue.photo.url}`)
    : null;
  const citizen = issue.reportedBy;

  // ✅ Correct path: location.coordinates.lat / lng
  const lat = issue.location?.coordinates?.lat;
  const lng = issue.location?.coordinates?.lng;
  const hasLocation = lat && lng;

  return (
    <div className="min-h-screen bg-surface">

      {/* Nav */}
      <nav className="bg-dark text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft size={16} /> Issue Management
        </Link>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Shield size={16} className="text-primary" /> CivicLens Admin
        </div>
        <Link to="/admin" className="text-white/60 hover:text-white"><X size={18} /></Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded">
            {issue.category.toUpperCase()} • {issue.issueId}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[issue.status]}`}>
            {issue.status}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[issue.priority]}`}>
            {issue.priority} Priority
          </span>
          {issue.assignedTo?.department && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              📋 {issue.assignedTo.department}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold mt-2 mb-2">{issue.title}</h1>
        <p className="text-gray-500 text-sm">{issue.description}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location?.address}</span>
          <span className="flex items-center gap-1"><User size={11} /> {citizen?.fullName}</span>
          <span>Reported {new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>

        {/* ── Photo with geo-tag stamp ── */}
        {photoSrc && (
          <div className="mt-5 rounded-2xl overflow-hidden cursor-pointer group relative"
            onClick={() => setPhotoOpen(true)}>
            <img src={photoSrc} alt={issue.title} className="w-full h-56 object-cover" />
            {/* Geo-tag stamp */}
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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 transition-opacity shadow">
                <Image size={12} /> View full photo
              </span>
            </div>
          </div>
        )}

        {/* ── Map Section ── */}
        {hasLocation ? (
          <div className="mt-4">
            <h2 className="font-semibold mb-2 flex items-center gap-1.5">
              <MapPin size={15} className="text-primary" /> Issue Location
            </h2>
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <MapComponent lat={Number(lat)} lng={Number(lng)} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <MapPin size={11} />
              {issue.location?.address} — {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-gray-100 h-28 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
            <MapPin size={20} className="mb-1" />
            <p className="text-xs">No location data available</p>
          </div>
        )}

        {/* ── Citizen card ── */}
        {citizen && (
          <div className="bg-white rounded-2xl shadow-card p-4 mt-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
              {citizen.fullName?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{citizen.fullName}</p>
              <div className="flex flex-wrap gap-3 mt-1">
                {citizen.email && (
                  <a href={`mailto:${citizen.email}`}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                    <Mail size={11} /> {citizen.email}
                  </a>
                )}
                {citizen.phone && (
                  <a href={`tel:${citizen.phone}`}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                    <Phone size={11} /> {citizen.phone}
                  </a>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">Citizen</span>
          </div>
        )}

        {/* ── Status Timeline ── */}
        <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
          <h2 className="font-semibold mb-4">Status Timeline</h2>
          <div className="flex items-center gap-1 mb-6">
            {['Reported', 'In Review', 'In Progress', 'Resolved'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-colors ${
                    i <= currentStep ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 text-center ${i <= currentStep ? 'text-primary font-medium' : 'text-gray-400'}`}>
                    {s}
                  </span>
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 mb-4 ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="space-y-4">
            {issue.timeline?.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  event.authorType === 'authority' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                }`}>
                  {event.authorType === 'authority' ? '👮' : '⚙️'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{event.author}</p>
                    {event.authorType === 'authority' && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">AUTHORITY</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{event.description}</p>
                  <p className="text-gray-400 text[10px] mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Last official message ── */}
        {issue.officialUpdate?.message && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
            <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">Last official message to citizen</p>
            <p className="text-sm text-gray-700">{issue.officialUpdate.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              — {issue.officialUpdate.from} • {new Date(issue.officialUpdate.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {/* ── Update Form ── */}
        <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
          <h2 className="font-semibold text-primary mb-5">Update Issue</h2>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <p className="text-sm font-medium mb-2">Change Status</p>
              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s}
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`text-sm px-4 py-2 rounded-xl border-2 text-left transition-colors ${
                      form.status === s
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Change Priority</p>
              <div className="flex flex-col gap-2">
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`text-sm px-4 py-2 rounded-xl border-2 text-left transition-colors ${
                      form.priority === p
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm font-medium mb-3">Assign to Department / Officer</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Department</label>
                <select
                  value={form.assignDepartment}
                  onChange={e => setForm(f => ({ ...f, assignDepartment: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                >
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Officer / Person in charge</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  placeholder="e.g. Ravi Kumar"
                  value={form.assignOfficer}
                  onChange={e => setForm(f => ({ ...f, assignOfficer: e.target.value }))}
                />
              </div>
            </div>
            {issue.assignedTo?.department && (
              <p className="text-xs text-gray-400 mt-2">
                Currently assigned: <span className="text-gray-600 font-medium">{issue.assignedTo.department}</span>
                {issue.assignedTo.officer && <> — <span className="text-gray-600">{issue.assignedTo.officer}</span></>}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium block mb-1.5">
              Internal Notes <span className="text-gray-400 font-normal text-xs">(not visible to citizen)</span>
            </label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Add internal observations, notes, or resolution details…"
              value={form.resolutionNotes}
              onChange={e => setForm(f => ({ ...f, resolutionNotes: e.target.value }))}
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium block mb-1.5">
              Official Message to Citizen <span className="text-gray-400 font-normal text-xs">(shown on their issue page)</span>
            </label>
            <textarea
              className="input h-20 resize-none"
              placeholder="e.g. Our crew has been dispatched. Work is expected to be completed by Friday."
              value={form.officialMessage}
              onChange={e => setForm(f => ({ ...f, officialMessage: e.target.value }))}
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <span className="spinner" /> : 'Update Issue'}
          </button>
          <p className="text-center text-gray-400 text-xs mt-3">
            For authorized municipal staff only • Confidential Access
          </p>
        </div>

      </div>

      {/* Fullscreen photo lightbox */}
      {photoOpen && photoSrc && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setPhotoOpen(false)}
          >
            <X size={20} />
          </button>
          <img
            src={photoSrc}
            alt={issue.title}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}