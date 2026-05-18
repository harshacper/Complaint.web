const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Role-based auth check to ensure req.user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access Denied: Admin role required' });
  }
};

// Public Admin Auth Route
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.get('/complaints', authMiddleware, isAdmin, adminController.getAllComplaints);
router.put('/complaints/:id/status', authMiddleware, isAdmin, adminController.updateComplaintStatus);
router.delete('/complaints/:id', authMiddleware, isAdmin, adminController.deleteComplaint);
router.get('/users', authMiddleware, isAdmin, adminController.getAllUsers);
router.get('/analytics', authMiddleware, isAdmin, adminController.getAnalytics);

module.exports = router;
