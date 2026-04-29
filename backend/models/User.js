const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  phone:     { type: String, default: '' },
  location:  { type: String, default: '' },
  bio:       { type: String, maxlength: [200, 'Bio cannot exceed 200 characters'], default: '' },
  avatar: {
    url:      { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'authority', 'superadmin'],
    default: 'citizen',
  },
  level:  { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  stats: {
    totalReports:    { type: Number, default: 0 },
    resolvedReports: { type: Number, default: 0 },
    upvotes:         { type: Number, default: 0 },
  },
  savedAlerts: [{
    label:    String,
    location: String,
    radius:   Number,
    category: String,
    frequency: { type: String, enum: ['realtime', 'daily', 'weekly'], default: 'realtime' },
    active:    { type: Boolean, default: true },
  }],
  notificationPreferences: {
    push:  { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms:   { type: Boolean, default: false },
  },
  memberSince: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLevel = function () {
  const thresholds = [0, 100, 300, 700, 1200, 2000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (this.points >= thresholds[i]) { this.level = i + 1; break; }
  }
};

module.exports = mongoose.model('User', userSchema);
