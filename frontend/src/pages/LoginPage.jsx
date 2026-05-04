import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary p-10 text-white">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Shield size={22} /> CivicLens
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">See your city<br />clearly.</h2>
          <p className="text-white/70 text-lg">Join thousands of citizens reporting, tracking, and improving their local communities in real-time.</p>
        </div>
        <p className="text-white/50 text-sm">+2k Empowering citizens in over 50 cities worldwide.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-orange-50">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Welcome Back</h1>
          <p className="text-gray-500 mb-8">Please enter your details to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="name@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-9" required />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="accent-primary" /> Remember me for 30 days
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

         

         

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-3">
          <Link to="/" className="text-primary hover:underline">
          Back to Home
          </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
