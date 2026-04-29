import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6">
      <Link to="/" className="absolute top-6 left-6 text-white/60 hover:text-white text-sm flex items-center gap-1">
        ← Back
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-primary rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Municipal Authority Login</h1>
          <p className="text-white/50 text-sm mt-2">Secure access for authorized personnel only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5">Email or Employee ID</label>
            <input type="text" placeholder="admin@municipality.gov" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-white/30"
              required />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-white/70 text-sm">Password</label>
              <a href="#" className="text-primary text-xs hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-white/30 pr-10"
                required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 mt-2">
            {loading ? <span className="spinner" /> : 'Log In'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-6 text-white/40 text-xs">
          <HelpCircle size={14} />
          <a href="#" className="hover:text-white/60">Contact IT Support</a>
        </div>
        <p className="text-center text-white/20 text-xs mt-6 uppercase tracking-widest">For authorized municipal staff only</p>
      </div>
    </div>
  );
}
