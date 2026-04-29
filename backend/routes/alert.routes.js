// Alert routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User');

// Get user alerts
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAlerts notificationPreferences');
    res.json({ success: true, alerts: user.savedAlerts, preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add alert
router.post('/', protect, async (req, res) => {
  try {
    const { label, location, radius, category, frequency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedAlerts: { label, location, radius, category, frequency } } },
      { new: true }
    ).select('savedAlerts');
    res.json({ success: true, alerts: user.savedAlerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle alert
router.put('/:alertId/toggle', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const alert = user.savedAlerts.id(req.params.alertId);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    alert.active = !alert.active;
    await user.save();
    res.json({ success: true, alerts: user.savedAlerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete alert
router.delete('/:alertId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedAlerts: { _id: req.params.alertId } },
    });
    res.json({ success: true, message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update notification preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: req.body },
      { new: true }
    ).select('notificationPreferences');
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
