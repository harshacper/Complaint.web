const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter for Images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Helper middleware to extract user if JWT is present, but NOT enforce it
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'complainsy_secret_jwt_key_2026_modern_ui_ux');
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token and continue anonymously/with body data
    }
  }
  next();
};

// Route mappings
router.post('/', upload.single('complaint_image'), optionalAuth, complaintController.submitComplaint);
router.post('/ai-suggest', complaintController.aiSuggest);
router.get('/track/:complaintId', complaintController.trackComplaint);
router.get('/user', authMiddleware, complaintController.getUserComplaints);

module.exports = router;
