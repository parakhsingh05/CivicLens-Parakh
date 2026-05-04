import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Building, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

// Steps: 1 = enter email + send OTP, 2 = enter OTP, 3 = enter name/password
const STEP_EMAIL  = 1;
const STEP_OTP    = 2;
const STEP_FINISH = 3;

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState(STEP_EMAIL);
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [form, setForm]         = useState({ fullName: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email });
      toast.success('Verification code sent! Check your inbox.');
      setStep(STEP_OTP);
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend countdown ──────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const id = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email });
      toast.success('New code sent!');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp });
      toast.success('Email verified!');
      setStep(STEP_FINISH);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: complete registration ─────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (!agreed) return toast.error('Please accept Terms and Conditions');
    setLoading(true);
    try {
      await register(form.fullName, email, form.password);
      toast.success('Account created! Welcome to CivicLens.');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared left panel ─────────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary p-10 text-white">
      <div className="flex items-center gap-2 font-bold text-lg">
        <Building size={22} /> CivicLens
      </div>
      <div>
        <h2 className="text-4xl font-extrabold leading-tight mb-4">Empower your<br />community.</h2>
        <p className="text-white/70 mb-6">Report local issues, track progress in real-time, and collaborate with neighbours to build a better city.</p>
        <div className="space-y-2">
          {['Quick Reporting — Submit issues in seconds.', 'Transparent Tracking — Follow reports to resolution.'].map(f => (
            <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-xs">✓</div>
              {f}
            </div>
          ))}
        </div>
      </div>
      <div />
    </div>
  );

  // ── Step indicator dots ───────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-6">
      {[STEP_EMAIL, STEP_OTP, STEP_FINISH].map(s => (
        <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-primary' : s < step ? 'w-2 bg-primary/50' : 'w-2 bg-gray-200'}`} />
      ))}
      <span className="text-xs text-gray-400 ml-1">Step {step} of 3</span>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-orange-50">
        <div className="w-full max-w-md">

          {/* ── STEP 1: Email ── */}
          {step === STEP_EMAIL && (
            <>
              <h1 className="text-2xl font-bold mb-1">Create Account</h1>
              <p className="text-gray-500 mb-6">First, let's verify your email address.</p>
              <StepDots />
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input pl-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">We'll send a 6-digit code to verify this address.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="spinner" /> : 'Send Verification Code'}
                </button>
              </form>

              

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
              </p>
              <p className="text-center text-sm text-gray-500 mt-3">
                <Link to="/" className="text-primary hover:underline">Back to Home</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === STEP_OTP && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck size={28} className="text-primary" />
                <h1 className="text-2xl font-bold">Check your inbox</h1>
              </div>
              <p className="text-gray-500 mb-1">
                We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">Check spam/junk if you don't see it.</p>
              <StepDots />

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <span className="spinner" /> : 'Verify Email'}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  onClick={() => { setStep(STEP_EMAIL); setOtp(''); }}
                  className="text-gray-500 hover:underline"
                >
                  ← Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className={`font-medium ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Name + Password ── */}
          {step === STEP_FINISH && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                <span className="text-sm text-green-600 font-medium">Email verified: {email}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1 mt-2">Almost there!</h1>
              <p className="text-gray-500 mb-6">Complete your profile to finish signing up.</p>
              <StepDots />

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="input pl-9 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-primary mt-0.5" />
                  I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </label>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="spinner" /> : 'Create Account'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
