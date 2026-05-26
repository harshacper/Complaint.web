const db = require('../config/db');
const supabase = require('../config/supabase');
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

// Map Supabase schema back to local format
const mapSupabaseToLocalComplaint = (sComp) => {
  if (!sComp) return null;
  return {
    id: sComp.id,
    complaint_id: `CMP${1000 + sComp.id}`,
    complaint_title: sComp.title,
    complaint_description: sComp.description,
    complaint_category: sComp.category,
    complaint_location: sComp.location,
    complaint_image: sComp.image_data,
    name: sComp.user_name,
    email: sComp.user_email,
    phone_number: sComp.contact || '',
    emergency_level: 'Medium', // default fallback since Supabase table doesn't have it
    complaint_status: sComp.status,
    created_at: sComp.created_at,
    estimated_days: sComp.estimated_days || 7,
    priority_score: sComp.priority_score || 5.0,
    predicted_emotion: sComp.predicted_emotion || 'Neutral'
  };
};

// 1. Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check Supabase users table where email matches and role = 'admin'
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('role', 'admin');

    if (findError) {
      console.error('Supabase Admin Login Error:', findError);
      return res.status(500).json({ success: false, message: 'Database query failed', error: findError.message });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const adminUser = users[0];
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate Admin JWT
    const token = generateAdminToken({
      id: adminUser.id,
      email: adminUser.email,
      role: 'admin',
      admin_name: adminUser.name
    });

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
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

    let query = supabase.from('complaints').select('*');

    // Category filter
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Status filter
    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search) {
      const searchWild = `%${search}%`;
      query = query.or(`title.ilike.${searchWild},description.ilike.${searchWild},user_name.ilike.${searchWild},user_email.ilike.${searchWild}`);
    }

    const { data: supabaseComplaints, error: findError } = await query.order('created_at', { ascending: false });

    if (findError) {
      console.error('Admin Get Complaints Error:', findError);
      return res.status(500).json({ success: false, message: 'Failed to fetch complaints from database' });
    }

    let complaints = supabaseComplaints.map(mapSupabaseToLocalComplaint);

    // If emergency filter is set and not "All"
    if (emergency && emergency !== 'All') {
      complaints = complaints.filter(c => c.emergency_level === emergency);
    }

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

    // Check if complaint exists in Supabase
    const { data: complaints, error: findError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id);

    if (findError || !complaints || complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Update in Supabase
    const { error: updateError } = await supabase
      .from('complaints')
      .update({ status: complaint_status })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase Update Status Error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update status in database' });
    }

    // Also update local database safely as backup
    try {
      await db.query(
        'UPDATE complaints SET complaint_status = ?, resolution_details = ? WHERE id = ?',
        [complaint_status, resolution_details || null, id]
      );
    } catch (e) {
      console.log('Skipped local DB update status:', e.message);
    }

    // Mock Email dispatch to user informing about status update
    console.log(`✉️ Mail sent to ${complaint.user_email}: Your complaint CMP${1000 + complaint.id} status has been updated to "${complaint_status}".`);

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${complaint_status} successfully`,
      data: {
        id,
        complaint_id: `CMP${1000 + complaint.id}`,
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

    // Check if complaint exists in Supabase
    const { data: complaints, error: findError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id);

    if (findError || !complaints || complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase Delete Complaint Error:', deleteError);
      return res.status(500).json({ success: false, message: 'Failed to delete complaint from database' });
    }

    // Also delete from local database safely
    try {
      await db.query('DELETE FROM complaints WHERE id = ?', [id]);
    } catch (e) {
      console.log('Skipped deleting complaint from local database:', e.message);
    }

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
    const { data: supabaseUsers, error: findError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (findError) {
      console.error('Supabase Get Users Error:', findError);
      return res.status(500).json({ success: false, message: 'Failed to fetch users list' });
    }

    const users = supabaseUsers.map(sUser => ({
      id: sUser.id,
      full_name: sUser.name || '',
      email: sUser.email,
      phone_number: sUser.phone || '',
      location: sUser.address || '',
      age: null,
      gender: sUser.gender || 'Other',
      role: sUser.role || 'user',
      profile_image: '/default-avatar.png',
      created_at: sUser.created_at
    }));

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
    // Fetch all complaints from Supabase
    const { data: supabaseComplaints, error: compError } = await supabase
      .from('complaints')
      .select('*');

    // Fetch all regular users from Supabase
    const { data: supabaseUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'user');

    if (compError || userError) {
      console.error('Supabase Analytics Error:', compError || userError);
      return res.status(500).json({ success: false, message: 'Failed to compile analytics' });
    }

    const complaints = supabaseComplaints.map(mapSupabaseToLocalComplaint);
    const totalComplaints = complaints.length;
    const totalUsers = supabaseUsers ? supabaseUsers.length : 0;

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

// Helper to map Supabase contact message back to Admin format
const mapSupabaseToLocalMessage = (sMsg) => {
  if (!sMsg) return null;
  let subject = 'Contact Inquiry';
  let message = sMsg.message || '';
  
  if (message.startsWith('[Subject:')) {
    const endIndex = message.indexOf(']');
    if (endIndex !== -1) {
      subject = message.slice(9, endIndex).trim();
      message = message.slice(endIndex + 1).trim();
    }
  }
  
  return {
    id: sMsg.id,
    name: sMsg.name,
    email: sMsg.email,
    subject,
    message,
    is_read: false,
    created_at: sMsg.created_at
  };
};

// 7. Get All Contact Messages
exports.getAllContactMessages = async (req, res) => {
  try {
    const { data: supabaseMsgs, error: findError } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (findError) {
      console.error('Supabase Contact Message Fetch Error:', findError);
      return res.status(500).json({ success: false, message: 'Failed to fetch contact messages' });
    }

    const messages = supabaseMsgs.map(mapSupabaseToLocalMessage);

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

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase Delete Message Error:', deleteError);
      return res.status(500).json({ success: false, message: 'Failed to delete message from database' });
    }

    // Also delete from local database safely
    try {
      await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    } catch (e) {
      console.log('Skipped deleting contact message from local database:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Admin Delete Contact Message Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting contact message' });
  }
};
