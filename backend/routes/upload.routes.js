const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

// POST /api/upload — upload a single image, returns local URL
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    publicId: req.file.filename,
  });
});

module.exports = router;
