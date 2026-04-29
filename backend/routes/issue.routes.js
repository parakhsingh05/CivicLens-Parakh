const express = require('express');
const router = express.Router();
const { getIssues, getIssue, createIssue, updateIssue, upvoteIssue, getMyIssues, getStats } = require('../controllers/issue.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

router.get('/stats', getStats);
router.get('/my-issues', protect, getMyIssues);
router.get('/', getIssues);
router.get('/:id', getIssue);
router.post('/', protect, upload.single('photo'), createIssue);
router.put('/:id', protect, upload.single('photo'), updateIssue);
router.post('/:id/upvote', protect, upvoteIssue);

module.exports = router;
