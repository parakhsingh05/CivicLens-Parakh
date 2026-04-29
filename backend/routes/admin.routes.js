const express = require('express');
const router = express.Router();
const {
  getAdminIssues, getAdminIssue, updateAdminIssue, deleteAdminIssue, getUsers,
  getAdmins, createAdmin, deleteAdmin, updateAdmin,
} = require('../controllers/admin.controller');
const { protect, adminOnly, superadminOnly } = require('../middleware/auth.middleware');

// All admin routes require login + admin/authority/superadmin role
router.use(protect, adminOnly);

// Issue management (all admins)
router.get('/issues', getAdminIssues);
router.get('/issues/:id', getAdminIssue);
router.put('/issues/:id', updateAdminIssue);
router.delete('/issues/:id', deleteAdminIssue);

// User management (all admins)
router.get('/users', getUsers);

// Admin account management (superadmin only)
router.get('/admins', superadminOnly, getAdmins);
router.post('/admins', superadminOnly, createAdmin);
router.put('/admins/:id', superadminOnly, updateAdmin);
router.delete('/admins/:id', superadminOnly, deleteAdmin);

module.exports = router;
