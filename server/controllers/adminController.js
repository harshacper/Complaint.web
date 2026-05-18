const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper to generate Admin JWT
const generateAdminToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'complainsy_secret_jwt_key_2026_modern_ui_ux',
    { expiresIn: '24h' }
  );
};

// 1. Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check admins table
    const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    let admin = null;
    let isMatch = false;

    if (admins && admins.length > 0) {
      admin = admins[0];
      // Compare hashed password
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      // Fallback: Check if there's a user in the users table with role = 'admin'
      const [users] = await db.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
      if (users && users.length > 0) {
        admin = {
          id: users[0].id,
          admin_name: users[0].full_name,
          email: users[0].email,
          password: users[0].password,
          role: 'super_admin'
        };
        isMatch = await bcrypt.compare(password, admin.password);
      }
    }

    if (!admin || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate Admin JWT
    const token = generateAdminToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
      admin_name: admin.admin_name
    });

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        id: admin.id,
        name: admin.admin_name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login', error: error.message });
  }
};

// 2. Get All Complaints (with Search and Filters)
exports.getAllComplaints = async (req, res) => {
  try {
    const { search, category, status, emergency } = req.query;

    let queryStr = 'SELECT * FROM complaints WHERE 1=1';
    let queryParams = [];

    // Search filter
    if (search) {
      queryStr += ' AND (complaint_title LIKE ? OR complaint_description LIKE ? OR complaint_id LIKE ? OR name LIKE ? OR email LIKE ?)';
      const searchWild = `%${search}%`;
      queryParams.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    // Category filter
    if (category && category !== 'All') {
      queryStr += ' AND complaint_category = ?';
      queryParams.push(category);
    }

    // Status filter
    if (status && status !== 'All') {
      queryStr += ' AND complaint_status = ?';
      queryParams.push(status);
    }

    // Emergency Level filter
    if (emergency && emergency !== 'All') {
      queryStr += ' AND emergency_level = ?';
      queryParams.push(emergency);
    }

    // Sort by newest first
    queryStr += ' ORDER BY created_at DESC';

    const [complaints] = await db.query(queryStr, queryParams);

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Admin Get Complaints Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching complaints' });
  }
};

// 3. Update Complaint Status & Resolution
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { complaint_status, resolution_details } = req.body;

    if (!complaint_status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Check if complaint exists
    const [complaints] = await db.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Update status
    await db.query(
      'UPDATE complaints SET complaint_status = ?, resolution_details = ? WHERE id = ?',
      [complaint_status, resolution_details || null, id]
    );

    // Mock Email dispatch to user informing about status update
    console.log(`✉️ Mail sent to ${complaint.email}: Your complaint ${complaint.complaint_id} status has been updated to "${complaint_status}". Resolution: ${resolution_details || 'N/A'}`);

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${complaint_status} successfully`,
      data: {
        id,
        complaint_id: complaint.complaint_id,
        complaint_status,
        resolution_details
      }
    });
  } catch (error) {
    console.error('Update Complaint Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// 4. Delete Complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if complaint exists
    const [complaints] = await db.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Delete complaint
    await db.query('DELETE FROM complaints WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete Complaint Error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting complaint' });
  }
};

// 5. Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, full_name, email, phone_number, location, age, gender, role, profile_image, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
};

// 6. Get Admin Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [complaints] = await db.query('SELECT * FROM complaints');
    const [users] = await db.query('SELECT id FROM users WHERE role = "user"');

    // Count statistics
    const totalComplaints = complaints.length;
    const totalUsers = users.length;

    const stats = {
      Pending: 0,
      'Under Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0
    };

    const categories = {};
    const emergencyLevels = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0
    };

    complaints.forEach(c => {
      // Status
      if (stats[c.complaint_status] !== undefined) {
        stats[c.complaint_status]++;
      }
      
      // Category
      categories[c.complaint_category] = (categories[c.complaint_category] || 0) + 1;

      // Emergency Level
      if (emergencyLevels[c.emergency_level] !== undefined) {
        emergencyLevels[c.emergency_level]++;
      }
    });

    // Formatting analytics for Recharts
    const statusData = Object.keys(stats).map(key => ({
      name: key,
      value: stats[key]
    }));

    const categoryData = Object.keys(categories).map(key => ({
      name: key,
      value: categories[key]
    }));

    const emergencyData = Object.keys(emergencyLevels).map(key => ({
      name: key,
      value: emergencyLevels[key]
    }));

    res.status(200).json({
      success: true,
      analytics: {
        totalComplaints,
        totalUsers,
        statusStats: stats,
        statusData,
        categoryData,
        emergencyData,
        recentComplaints: complaints.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error while compiling analytics data' });
  }
};

// 7. Get All Contact Messages
exports.getAllContactMessages = async (req, res) => {
  try {
    const [messages] = await db.query('SELECT * FROM contact_messages');
    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Admin Get Contact Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching contact messages' });
  }
};

// 8. Delete Contact Message
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Admin Delete Contact Message Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting contact message' });
  }
};
