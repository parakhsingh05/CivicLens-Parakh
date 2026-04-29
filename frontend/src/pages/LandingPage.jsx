import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, CheckCircle, Users, ArrowRight, Menu, X } from 'lucide-react';

export default function LandingPage() {

  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans">

      {/* NAVBAR */}
      <nav className="relative flex items-center justify-between px-4 py-4 bg-primary md:px-8">

        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Shield size={20} />
          <span>CIVIC LENS</span>
        </div>

        {/* Desktop Menu */}
       

        {/* Mobile Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* 🔥 FULLSCREEN MOBILE MENU (FIXED VERSION) */}
      {open && (
        <div className="fixed inset-0 bg-primary text-white flex flex-col items-center justify-center gap-8 z-50">

          {/* Close button */}
          <button 
            className="absolute top-4 right-4"
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>

          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/" onClick={() => setOpen(false)}>How it Works</Link>
          <Link to="/login" onClick={() => setOpen(false)}>Sign In</Link>
        </div>
      )}

      {/* HERO */}
      <section className="bg-primary text-white px-4 py-10 text-center md:px-8 md:py-20">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 rounded-full p-3">
            <Shield size={32} />
          </div>
        </div>

        <h1 className="text-2xl md:text-5xl font-extrabold mb-4 leading-tight">
          Smart City Issue<br />Reporting Platform
        </h1>

        <p className="text-white/80 max-w-lg mx-auto mb-8">
          Report civic issues, track resolutions, and build a better city together.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link 
            to="/register" 
            className="w-full md:w-auto bg-white text-primary font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight size={16} />
          </Link>

          <Link 
            to="/login" 
            className="w-full md:w-auto border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div className="max-w-2xl mx-auto -mt-8 px-4 md:px-6">
        <div className="bg-white rounded-2xl shadow-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {[
            { value: '247', label: 'Issues Reported', color: 'text-primary' },
            { value: '182', label: 'Resolved', color: 'text-green-500' },
            { value: '73%', label: 'Resolution Rate', color: 'text-primary' },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="px-4 py-10 max-w-3xl mx-auto md:px-8 md:py-16">
        <h2 className="text-2xl font-bold text-center text-primary mb-2">How It Works</h2>
        <div className="w-12 h-1 bg-primary mx-auto rounded mb-10" />

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: MapPin, title: 'Report Issues', desc: 'Snap a photo and report issues instantly.' },
            { icon: CheckCircle, title: 'Track Progress', desc: 'Get real-time updates on your reports.' },
            { icon: Users, title: 'Resolve Together', desc: 'Authorities respond and resolve issues.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-primary/10 rounded-full p-3">
                  <Icon size={24} className="text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white px-4 py-10 text-center mx-4 rounded-3xl mb-16 md:px-8 md:py-16 md:mx-6">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
          Ready to make a difference?
        </h2>

        <p className="text-white/80 mb-8 max-w-md mx-auto">
          Join thousands of citizens improving their city.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            to="/register" 
            className="w-full sm:w-auto bg-primary-800 text-white font-semibold px-8 py-3 rounded-full flex items-center justify-center gap-2"
          >
            Citizen Login / Sign Up
          </Link>

          <Link 
            to="/admin/login" 
            className="w-full sm:w-auto border-2 border-white/50 text-white font-semibold px-8 py-3 rounded-full flex items-center justify-center gap-2"
          >
            Authority Login
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-400 text-sm border-t">
        <p>© 2026 CivicLens</p>
        <p className="mt-2 max-w-2xl mx-auto text-xs text-gray-500 leading-relaxed">
    CivicLens is a college project created for educational and demonstration purposes.
    Reports submitted through this platform are not connected to real government
    authorities, municipalities, or emergency services.
  </p>
      </footer>

    </div>
  );
}