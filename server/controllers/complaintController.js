const db = require('../config/db');
const supabase = require('../config/supabase');
const mlService = require('../services/mlService');

// 1. AI Suggestion API
exports.aiSuggest = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Title or description required for AI suggestion' });
    }

    // Use ML Model for prediction (Linear Classification & Regression)
    const { predictedCategory, predictedUrgency, estimatedDays, priorityScore, predictedEmotion } = mlService.analyzeComplaint(`${title} ${description}`);

    res.status(200).json({
      success: true,
      suggested_category: predictedCategory,
      suggested_urgency: predictedUrgency,
      estimated_days: estimatedDays,
      suggested_priority: priorityScore,
      suggested_emotion: predictedEmotion
    });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({ success: false, message: 'AI Category suggestion failed' });
  }
};

// 2. Submit Complaint
exports.submitComplaint = async (req, res) => {
  try {
    let {
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
      additional_notes,
      estimated_days,
      priority_score,
      predicted_emotion
    } = req.body;

    if (!complaint_title || !complaint_description || !complaint_category || !complaint_location || !name || !email) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    // Fallback prediction if not provided by client
    if (!estimated_days || !priority_score || !predicted_emotion) {
      try {
        const mlSug = mlService.analyzeComplaint(`${complaint_title} ${complaint_description}`);
        if (!estimated_days) estimated_days = mlSug.estimatedDays;
        if (!priority_score) priority_score = mlSug.priorityScore;
        if (!predicted_emotion) predicted_emotion = mlSug.predictedEmotion;
      } catch (err) {
        console.error("ML Fallback error during submission:", err);
      }
    }
    
    // Set default fallbacks if ML fails
    estimated_days = estimated_days ? parseInt(estimated_days) : 7;
    priority_score = priority_score ? parseFloat(priority_score) : 5.0;
    predicted_emotion = predicted_emotion || 'Neutral';

    // Handle Uploaded File
    let complaint_image = null;
    if (req.file) {
      complaint_image = `/uploads/${req.file.filename}`;
    }

    // Determine associated user_id if logged in
    let user_id = null;
    if (req.user) {
      user_id = req.user.id;
    }

    // Insert complaint into Supabase first
    const supabaseComplaint = {
      title: complaint_title,
      description: complaint_description,
      contact: phone_number || '',
      location: complaint_location,
      category: complaint_category,
      status: 'Pending',
      user_email: email.toLowerCase(),
      user_name: name,
      image_data: complaint_image || '',
      incident_date: new Date().toISOString().split('T')[0],
      estimated_days: estimated_days,
      priority_score: priority_score,
      predicted_emotion: predicted_emotion
    };

    let { data: newSupComplaints, error: supabaseError } = await supabase
      .from('complaints')
      .insert([supabaseComplaint])
      .select();

    // Fallback: If Supabase table lacks the new columns, retry inserting without them
    if (supabaseError && (supabaseError.message?.includes('column') || supabaseError.code === '42703')) {
      console.warn('⚠️ Supabase complaints table lacks ML columns. Retrying insert without ML stats...');
      const fallbackComplaint = { ...supabaseComplaint };
      delete fallbackComplaint.estimated_days;
      delete fallbackComplaint.priority_score;
      delete fallbackComplaint.predicted_emotion;

      const retryResult = await supabase
        .from('complaints')
        .insert([fallbackComplaint])
        .select();

      newSupComplaints = retryResult.data;
      supabaseError = retryResult.error;
    }

    if (supabaseError) {
      console.error('Supabase Complaint Insert Error:', supabaseError);
      return res.status(500).json({ success: false, message: 'Database submission failed', error: supabaseError.message });
    }

    if (!newSupComplaints || newSupComplaints.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to register complaint in database' });
    }

    const nextIdNumber = 1000 + newSupComplaints[0].id;
    const complaint_id = `CMP${nextIdNumber}`;

    // Also write to local DB (MySQL or JSON fallback) safely for dual resilience
    try {
      await db.query(
        `INSERT INTO complaints (
          complaint_id, user_id, complaint_title, complaint_description, 
          complaint_category, complaint_location, complaint_image, 
          name, email, phone_number, age, gender, emergency_level, 
          additional_notes, complaint_status, estimated_days, priority_score, predicted_emotion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          'Pending',
          estimated_days,
          priority_score,
          predicted_emotion
        ]
      );
    } catch (e) {
      console.log('Skipped writing complaint to local fallback database:', e.message);
    }

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

    // Extract number from complaintId (e.g. CMP1005 -> 1005)
    const match = complaintId.match(/\d+/);
    let dbId = null;
    if (match) {
      const idNum = parseInt(match[0]);
      if (idNum > 1000) {
        dbId = idNum - 1000;
      } else {
        dbId = idNum;
      }
    }

    // Try fetching from Supabase first
    if (dbId) {
      const { data: supabaseComplaints, error: findError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', dbId);

      if (!findError && supabaseComplaints && supabaseComplaints.length > 0) {
        const sComp = supabaseComplaints[0];
        // Map Supabase complaint back to the MySQL schema format the frontend expects
        const mappedComplaint = {
          id: sComp.id,
          complaint_id: complaintId,
          complaint_title: sComp.title,
          complaint_description: sComp.description,
          complaint_category: sComp.category,
          complaint_location: sComp.location,
          complaint_image: sComp.image_data,
          name: sComp.user_name,
          email: sComp.user_email,
          phone_number: sComp.contact,
          complaint_status: sComp.status,
          created_at: sComp.created_at,
          estimated_days: sComp.estimated_days || 7,
          priority_score: sComp.priority_score || 5.0,
          predicted_emotion: sComp.predicted_emotion || 'Neutral'
        };

        return res.status(200).json({
          success: true,
          complaint: mappedComplaint
        });
      }
    }

    // Fallback to local DB query
    try {
      const [complaints] = await db.query('SELECT * FROM complaints WHERE complaint_id = ?', [complaintId]);
      if (complaints && complaints.length > 0) {
        return res.status(200).json({
          success: true,
          complaint: complaints[0]
        });
      }
    } catch (dbError) {
      console.log('Skipped local database fallback during trackComplaint:', dbError.message);
    }
    
    res.status(404).json({ success: false, message: 'Complaint not found with this tracking ID' });
  } catch (error) {
    console.error('Track Complaint Error:', error);
    res.status(500).json({ success: false, message: 'Server error while tracking complaint' });
  }
};

// 4. Get Respective User Complaints
exports.getUserComplaints = async (req, res) => {
  try {
    let email = req.user.email;

    // Fetch from Supabase
    const { data: supabaseComplaints, error: findError } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (!findError && supabaseComplaints) {
      // Map to frontend expected format
      const mappedComplaints = supabaseComplaints.map(sComp => ({
        id: sComp.id,
        complaint_id: `CMP${1000 + sComp.id}`,
        complaint_title: sComp.title,
        complaint_description: sComp.description,
        complaint_category: sComp.category,
        complaint_location: sComp.location,
        complaint_image: sComp.image_data,
        name: sComp.user_name,
        email: sComp.user_email,
        phone_number: sComp.contact,
        complaint_status: sComp.status,
        created_at: sComp.created_at,
        estimated_days: sComp.estimated_days || 7,
        priority_score: sComp.priority_score || 5.0,
        predicted_emotion: sComp.predicted_emotion || 'Neutral'
      }));

      return res.status(200).json({
        success: true,
        complaints: mappedComplaints
      });
    }

    // Fallback to local DB
    let complaints = [];
    try {
      const [rows] = await db.query('SELECT * FROM complaints WHERE email = ? ORDER BY created_at DESC', [email]);
      complaints = rows;
    } catch (dbError) {
      console.log('Skipped local database fallback during getUserComplaints:', dbError.message);
    }

    res.status(200).json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get User Complaints Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving user complaints' });
  }
};
