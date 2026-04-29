const Issue = require('../models/Issue');
const User = require('../models/User');

// @desc    Get all issues (public with filters)
// @route   GET /api/issues
// @access  Public
const getIssues = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const query = { draftMode: false };

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      issues,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { issueId: req.params.id }],
    }).populate('reportedBy', 'fullName avatar level');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { title, description, category, locationAddress, locationLat, locationLng, draftMode } = req.body;

    const issueData = {
      title,
      description,
      category,
      location: {
        address: locationAddress,
        coordinates: {
          lat: locationLat ? Number(locationLat) : undefined,
          lng: locationLng ? Number(locationLng) : undefined,
        },
      },
      reportedBy: req.user._id,
      draftMode: draftMode === 'true',
    };

    if (req.file) {
      issueData.photo = {
        url: `/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    const issue = await Issue.create(issueData);

    // Update user stats and points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalReports': 1, points: 10 },
    });

    res.status(201).json({ success: true, message: 'Issue reported successfully', issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update an issue (user's own issue)
// @route   PUT /api/issues/:id
// @access  Private
const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    if (issue.reportedBy.toString() !== req.user._id.toString() && req.user.role === 'citizen') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this issue' });
    }

    const { title, description, category } = req.body;
    if (title) issue.title = title;
    if (description) issue.description = description;
    if (category) issue.category = category;
    if (req.file) {
      issue.photo = { url: `/uploads/${req.file.filename}`, publicId: req.file.filename };
    }
    issue.draftMode = false;

    await issue.save();
    res.json({ success: true, message: 'Issue updated', issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upvote an issue
// @route   POST /api/issues/:id/upvote
// @access  Private
const upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    const userId = req.user._id;
    const alreadyVoted = issue.upvotes.includes(userId);

    if (alreadyVoted) {
      issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId.toString());
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.upvotes': -1 } });
    } else {
      issue.upvotes.push(userId);
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.upvotes': 1 } });
    }

    await issue.save();
    res.json({ success: true, upvoted: !alreadyVoted, upvoteCount: issue.upvotes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user's own issues
// @route   GET /api/issues/my-issues
// @access  Private
const getMyIssues = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { reportedBy: req.user._id };
    if (status && status !== 'All') query.status = status;

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get stats summary
// @route   GET /api/issues/stats
// @access  Public
const getStats = async (req, res) => {
  try {
    const total = await Issue.countDocuments({ draftMode: false });
    const resolved = await Issue.countDocuments({ status: 'Resolved', draftMode: false });
    const inProgress = await Issue.countDocuments({ status: 'In Progress', draftMode: false });
    const inReview = await Issue.countDocuments({ status: 'In Review', draftMode: false });
    const reported = await Issue.countDocuments({ status: 'Reported', draftMode: false });
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({ success: true, stats: { total, resolved, inProgress, inReview, reported, resolutionRate } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getIssues, getIssue, createIssue, updateIssue, upvoteIssue, getMyIssues, getStats };
