const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateToken } = require('../middleware/auth.middleware');
const { sendOtpEmail } = require('../services/email.service');

// Helper: generate a 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// STEP 1: Send OTP to email
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    await Otp.deleteMany({ email: email.toLowerCase() });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({ email: email.toLowerCase(), otp, expiresAt });
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
  }
};

// STEP 2: Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const record = await Otp.findOne({ email: email.toLowerCase() });

    if (!record) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    }
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code.' });
    }

    record.verified = true;
    await record.save();

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STEP 3: Register (requires prior OTP verification)
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), verified: true });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please complete email verification first.',
      });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ fullName, email, password });
    await Otp.deleteMany({ email: email.toLowerCase() });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id, fullName: user.fullName, email: user.email,
        role: user.role, level: user.level, points: user.points,
        avatar: user.avatar, memberSince: user.memberSince,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true, message: 'Login successful', token,
      user: {
        _id: user._id, fullName: user.fullName, email: user.email,
        role: user.role, level: user.level, points: user.points,
        avatar: user.avatar, stats: user.stats, memberSince: user.memberSince,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: { $in: ['admin', 'authority', 'superadmin'] } }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or not an admin account' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true, message: 'Admin login successful', token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, location, bio, notificationPreferences } = req.body;
    const updateData = { fullName, phone, location, bio, notificationPreferences };
    if (req.file) {
      updateData.avatar = { url: `/uploads/${req.file.filename}`, publicId: req.file.filename };
    }
    if (req.body.removeAvatar === 'true') {
      updateData.avatar = { url: '', publicId: '' };
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendOtp, verifyOtp, register,
  login, adminLogin, getMe,
  updateProfile, changePassword, deleteAccount,
};
