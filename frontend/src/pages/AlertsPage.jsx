import React, { useState, useEffect } from 'react';
import { Bell, Droplets, Wrench, Plus, Mail, Smartphone } from 'lucide-react';
import { alertAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = { Water: <Droplets size={16} className="text-blue-500" />, Road: <Wrench size={16} className="text-orange-500" /> };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [preferences, setPreferences] = useState({ push: true, email: false, sms: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await alertAPI.getAll();
      setAlerts(data.alerts || []);
      setPreferences(data.preferences || { push: true, email: false });
    } catch { } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alertId) => {
    try {
      const { data } = await alertAPI.toggle(alertId);
      setAlerts(data.alerts);
    } catch { toast.error('Failed to toggle alert'); }
  };

  const deleteAlert = async (alertId) => {
    try {
      await alertAPI.remove(alertId);
      setAlerts(a => a.filter(x => x._id !== alertId));
      toast.success('Alert removed');
    } catch { toast.error('Failed to remove alert'); }
  };

  const togglePref = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await alertAPI.updatePreferences(updated);
    } catch { }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alerts Settings</h1>
        <button className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-primary-600 transition-colors">
          <Plus size={14} /> New Alert
        </button>
      </div>

      {/* My Active Alerts */}
      <div className="mb-6">
        <h2 className="font-semibold mb-1">My Active Alerts</h2>
        <p className="text-gray-500 text-sm mb-4">Get notified about issues in your preferred areas or categories.</p>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">
            <Bell size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active alerts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className={`bg-white rounded-2xl shadow-card p-4 flex items-start gap-3 ${!alert.active ? 'opacity-60' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  {CATEGORY_ICONS[alert.category] || <Bell size={16} className="text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{alert.label}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{alert.location}</span>
                    {alert.category && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Category: {alert.category}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Toggle */}
                  <button onClick={() => toggleAlert(alert._id)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${alert.active ? 'bg-primary' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${alert.active ? 'translate-x-6 left-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="border-gray-200 my-5" />

      {/* Notification Methods */}
      <div>
        <h2 className="font-semibold mb-4">Notification Methods</h2>
        <div className="space-y-3">
          {[
            { key: 'push', icon: <Smartphone size={18} className="text-gray-500" />, label: 'Push Notifications', desc: 'Real-time alerts on your device' },
            { key: 'email', icon: <Mail size={18} className="text-gray-500" />, label: 'Email Digest', desc: 'Daily summary of community activities' },
          ].map(({ key, icon, label, desc }) => (
            <div key={key} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
              <button onClick={() => togglePref(key)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${preferences[key] ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences[key] ? 'translate-x-6 left-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
