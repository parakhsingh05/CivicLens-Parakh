const Issue = require('../models/Issue');
const User = require('../models/User');

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Water & Sanitation',
  'Electricity',
  'Waste Management',
  'Public Safety',
  'Parks & Recreation',
  'General Administration',
];

// @desc    Get all issues for admin
// @route   GET /api/admin/issues
const getAdminIssues = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All Status') query.status = status;
    if (category && category !== 'All Types') query.category = category;
    if (priority && priority !== 'All Priority') query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { issueId: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const allTotal = await Issue.countDocuments();
    const newReports = await Issue.countDocuments({ status: 'Reported' });
    const inProgress = await Issue.countDocuments({ status: 'In Progress' });
    const resolved = await Issue.countDocuments({ status: 'Resolved' });

    res.json({
      success: true, total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      summary: { allTotal, newReports, inProgress, resolved },
      issues,
      departments: DEPARTMENTS,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single issue for admin
// @route   GET /api/admin/issues/:id
const getAdminIssue = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      $or: [
        { issueId: req.params.id },
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      ],
    }).populate('reportedBy', 'fullName email avatar phone');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, issue, departments: DEPARTMENTS });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update issue — status, priority, assignment, notes, official message
// @route   PUT /api/admin/issues/:id
const updateAdminIssue = async (req, res) => {
  try {
    const { status, priority, resolutionNotes, officialMessage, officialFrom, assignDepartment, assignOfficer } = req.body;

    const issue = await Issue.findOne({
      $or: [
        { issueId: req.params.id },
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      ],
    });

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // ── Status change ──
    const statusLabels = {
      'In Review': { title: 'Under Review', description: 'Issue has been reviewed and assigned.' },
      'In Progress': { title: 'Repairs In Progress', description: 'Work has started on this issue.' },
      'Resolved': { title: 'Issue Resolved', description: 'The issue has been successfully resolved.' },
    };

    if (status && status !== issue.status) {
      issue.status = status;
      const label = statusLabels[status] || { title: status, description: '' };
      issue.timeline.push({
        status,
        title: label.title,
        description: resolutionNotes || label.description,
        author: req.user.fullName || 'Authority',
        authorType: 'authority',
      });
      if (status === 'Resolved') {
        await User.findByIdAndUpdate(issue.reportedBy, {
          $inc: { 'stats.resolvedReports': 1, points: 25 },
        });
      }
    }

    // ── Assignment change ──
    const deptChanged = assignDepartment && assignDepartment !== issue.assignedTo?.department;
    const officerChanged = assignOfficer && assignOfficer !== issue.assignedTo?.officer;

    if (deptChanged || officerChanged) {
      issue.assignedTo = {
        department: assignDepartment || issue.assignedTo?.department || '',
        officer: assignOfficer || issue.assignedTo?.officer || '',
        assignedAt: new Date(),
      };
      // Add to timeline so there's a record of who was assigned
      const assignDesc = [
        assignDepartment ? `Department: ${assignDepartment}` : null,
        assignOfficer ? `Officer: ${assignOfficer}` : null,
      ].filter(Boolean).join(', ');

      issue.timeline.push({
        status: issue.status,
        title: 'Issue Assigned',
        description: `Assigned to ${assignDesc}`,
        author: req.user.fullName || 'Authority',
        authorType: 'authority',
      });
    }

    // ── Other fields ──
    if (priority) issue.priority = priority;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;
    if (officialMessage) {
      issue.officialUpdate = {
        message: officialMessage,
        from: officialFrom || req.user.fullName || 'City Council',
        timestamp: new Date(),
      };
    }

    await issue.save();
    res.json({ success: true, message: 'Issue updated successfully', issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete an issue
// @route   DELETE /api/admin/issues/:id
const deleteAdminIssue = async (req, res) => {
  try {
    const issue = await Issue.findOneAndDelete({
      $or: [
        { issueId: req.params.id },
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      ],
    });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all citizen users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// @desc    Get all admins (superadmin only)
// @route   GET /api/admin/admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'authority', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new admin account (superadmin only)
// @route   POST /api/admin/admins
const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }
    if (!['admin', 'authority'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or authority' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const newAdmin = await User.create({ fullName, email, password, role });
    res.status(201).json({
      success: true,
      message: `${role === 'authority' ? 'Authority' : 'Admin'} account created successfully`,
      admin: {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete an admin account (superadmin only, cannot delete self)
// @route   DELETE /api/admin/admins/:id
const deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const admin = await User.findOne({ _id: req.params.id, role: { $in: ['admin', 'authority'] } });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update an admin's role (superadmin only)
// @route   PUT /api/admin/admins/:id
const updateAdmin = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'authority'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or authority' });
    }
    const admin = await User.findOne({ _id: req.params.id, role: { $in: ['admin', 'authority'] } });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.role = role;
    await admin.save();
    res.json({ success: true, message: 'Role updated successfully', admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdminIssues, getAdminIssue, updateAdminIssue, deleteAdminIssue, getUsers, DEPARTMENTS,
  getAdmins, createAdmin, deleteAdmin, updateAdmin,
};
