import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('phone', form.phone);
      fd.append('location', form.location);
      fd.append('bio', form.bio);

      const { data } = await authAPI.updateProfile(fd);
      updateUser(data.user);

      if (form.currentPassword && form.newPassword) {
        await authAPI.changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
        toast.success('Password changed successfully');
      }

      toast.success('Profile updated!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Avatar upload — sends as multipart via authAPI.updateProfile
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('fullName', user?.fullName || '');
    fd.append('avatar', file);
    try {
      const { data } = await authAPI.updateProfile(fd);
      updateUser(data.user);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to update photo');
    }
  };

  // Remove avatar — just clear it via profile update
  const handleRemoveAvatar = async () => {
    const fd = new FormData();
    fd.append('fullName', user?.fullName || '');
    fd.append('removeAvatar', 'true');
    try {
      await authAPI.updateProfile(fd);
      updateUser({ avatar: { url: '', publicId: '' } });
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await authAPI.deleteAccount();
      toast.success('Account deleted');
      navigate('/login');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  // Build correct image src — local paths need the backend host prefix
  const avatarSrc = user?.avatar?.url
    ? user.avatar.url.startsWith('http')
      ? user.avatar.url
      : `http://localhost:5000${user.avatar.url}`
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4 border-b border-gray-100">
        <Link to="/profile"><ArrowLeft size={20} className="text-gray-600" /></Link>
        <div className="flex-1">
          <h1 className="font-bold">Edit Profile</h1>
          <p className="text-gray-400 text-xs">Manage your account information</p>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-primary-600 transition-colors">
          {loading ? '...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSave} className="px-4 pb-24">
        {/* Avatar */}
        <div className="py-5 flex flex-col items-center border-b border-gray-100">
          <div className="relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {user?.fullName?.[0]}
              </div>
            )}
            <button type="button" onClick={() => fileRef.current.click()}
              className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center shadow">
              <Camera size={14} />
            </button>
          </div>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleAvatarChange} className="hidden" />
          <p className="text-gray-500 text-xs mt-3">Update your photo for better community recognition.</p>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => fileRef.current.click()}
              className="text-primary text-sm font-medium border border-primary px-3 py-1 rounded-full">
              Upload New
            </button>
            {avatarSrc && (
              <button type="button" onClick={handleRemoveAvatar}
                className="text-red-500 text-sm font-medium border border-red-200 px-3 py-1 rounded-full">
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input className="input" value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <input className="input bg-gray-50" value={user?.email || ''} disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Location / Sector</label>
              <input className="input" placeholder="Sector 12, Main City" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea className="input h-20 resize-none" maxLength={200}
              placeholder="Brief description..." value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/200 characters</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-6">
          <h3 className="font-semibold text-primary mb-3">🔒 Change Password</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.currentPassword}
                onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.newPassword}
                onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-6 bg-red-50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-600 text-sm">Delete Account</p>
            <p className="text-red-400 text-xs mt-0.5">Once deleted, there is no going back.</p>
          </div>
          <button type="button" onClick={handleDeleteAccount}
            className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
            Delete Account
          </button>
        </div>
      </form>
    </div>
  );
}
