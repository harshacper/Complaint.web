const db = require('../config/db');

// AI Category Suggestion Engine (Keyword-based NLP)
const suggestCategory = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  const keywords = {
    'Road Damage': ['road', 'pothole', 'tar', 'asphalt', 'highway', 'street', 'flyover', 'concrete', 'pavement', 'lane'],
    'Water Problem': ['water', 'leak', 'drain', 'sewage', 'drinking water', 'pipe', 'clog', 'sump', 'water supply', 'borewell'],
    'Electricity Issue': ['electricity', 'power', 'blackout', 'load shedding', 'wire', 'transformer', 'voltage', 'current', 'power cut', 'street light'],
    'Garbage Problem': ['garbage', 'trash', 'waste', 'litter', 'dump', 'dirty', 'smell', 'dustbin', 'collection', 'debris'],
    'Internet Fraud': ['internet', 'fraud', 'scam', 'phishing', 'online payment', 'transaction', 'upi', 'credit card', 'otp', 'otp scam', 'bank fraud'],
    'Cyber Crime': ['cyber', 'online harassment', 'hacking', 'account hacked', 'identity theft', 'social media', 'spam', 'malware', 'virus'],
    'Public Safety': ['safety', 'threat', 'crime', 'steal', 'robbery', 'thief', 'security', 'suspicious', 'street light dark', 'danger'],
    'Noise Pollution': ['noise', 'loudspeaker', 'music', 'night', 'sound', 'decibel', 'party', 'construction noise', 'horn'],
    'Police Complaint': ['police', 'fir', 'assault', 'harassment', 'bribe', 'extortion', 'complaint against', 'rowdy', 'illegal activity']
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return category;
    }
  }

  return 'Other';
};

// 1. AI Suggestion API
exports.aiSuggest = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Title or description required for AI suggestion' });
    }

    const suggested = suggestCategory(title, description);

    res.status(200).json({
      success: true,
      suggested_category: suggested
    });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({ success: false, message: 'AI Category suggestion failed' });
  }
};

// 2. Submit Complaint
exports.submitComplaint = async (req, res) => {
  try {
    const {
      complaint_title,
      complaint_description,
      complaint_category,
      complaint_location,
      name,
      email,
      phone_number,
      age,
      gender,
      emergency_level,
      additional_notes
    } = req.body;

    if (!complaint_title || !complaint_description || !complaint_category || !complaint_location || !name || !email) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    // Auto-generate Complaint ID
    // Find the latest complaint ID to increment
    const [allComplaints] = await db.query('SELECT complaint_id FROM complaints ORDER BY id DESC LIMIT 1');
    let nextIdNumber = 1001;

    if (allComplaints && allComplaints.length > 0) {
      const lastId = allComplaints[0].complaint_id; // e.g. "CMP1002"
      const match = lastId.match(/\d+/);
      if (match) {
        nextIdNumber = parseInt(match[0]) + 1;
      }
    }

    const complaint_id = `CMP${nextIdNumber}`;

    // Handle Uploaded File
    let complaint_image = null;
    if (req.file) {
      complaint_image = `/uploads/${req.file.filename}`;
    }

    // Determine associated user_id if logged in
    let user_id = null;
    if (req.user) {
      user_id = req.user.id;
    } else {
      // Find user by email to link them
      const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (users && users.length > 0) {
        user_id = users[0].id;
      }
    }

    // Insert complaint
    await db.query(
      `INSERT INTO complaints (
        complaint_id, user_id, complaint_title, complaint_description, 
        complaint_category, complaint_location, complaint_image, 
        name, email, phone_number, age, gender, emergency_level, 
        additional_notes, complaint_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        complaint_id,
        user_id,
        complaint_title,
        complaint_description,
        complaint_category,
        complaint_location,
        complaint_image,
        name,
        email.toLowerCase(),
        phone_number || '',
        age ? parseInt(age) : null,
        gender || 'Other',
        emergency_level || 'Medium',
        additional_notes || '',
        'Pending'
      ]
    );

    // Mock Email notification to admin and user
    console.log(`✉️ Mail sent to admin harshasubhash@gmail.com: New Complaint Submitted: ${complaint_id}`);
    console.log(`✉️ Mail sent to user ${email}: Complaint registered successfully! Track using ID: ${complaint_id}`);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted and registered successfully',
      complaint_id,
      data: {
        complaint_id,
        complaint_title,
        complaint_category,
        complaint_status: 'Pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Complaint Submission Error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting complaint', error: error.message });
  }
};

// 3. Track Complaint by ID
exports.trackComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!complaintId) {
      return res.status(400).json({ success: false, message: 'Complaint ID is required' });
    }

    const [complaints] = await db.query('SELECT * FROM complaints WHERE complaint_id = ?', [complaintId]);
    
    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found with this tracking ID' });
    }

    res.status(200).json({
      success: true,
      complaint: complaints[0]
    });
  } catch (error) {
    console.error('Track Complaint Error:', error);
    res.status(500).json({ success: false, message: 'Server error while tracking complaint' });
  }
};

// 4. Get Respective User Complaints
exports.getUserComplaints = async (req, res) => {
  try {
    // If authenticated, we fetch by logged-in user email
    let email = req.user.email;

    const [complaints] = await db.query('SELECT * FROM complaints WHERE email = ? ORDER BY created_at DESC', [email]);

    res.status(200).json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get User Complaints Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving user complaints' });
  }
};
