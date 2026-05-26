const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const supabase = require('../config/supabase');
require('dotenv').config();

// JWT Generation Helper
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'complainsy_secret_jwt_key_2026_modern_ui_ux',
    { expiresIn: '7d' }
  );
};

// Map local object to Supabase schema
const mapLocalToSupabaseUser = (localUser) => {
  return {
    name: localUser.full_name,
    email: localUser.email.toLowerCase(),
    password: localUser.password,
    phone: localUser.phone_number || '',
    gender: localUser.gender || 'Other',
    address: localUser.location || '',
    role: localUser.role || 'user'
  };
};

// Map Supabase schema back to local format
const mapSupabaseToLocalUser = (sUser) => {
  if (!sUser) return null;
  return {
    id: sUser.id,
    full_name: sUser.name || '',
    email: sUser.email,
    password: sUser.password,
    phone_number: sUser.phone || '',
    location: sUser.address || '',
    gender: sUser.gender || 'Other',
    role: sUser.role || 'user',
    profile_image: '/default-avatar.png',
    created_at: sUser.created_at
  };
};

// 1. User Registration
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone_number, location, age, gender } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    // Check if email already exists in Supabase
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (checkError) {
      console.error('Supabase Email Check Error:', checkError);
      return res.status(500).json({ success: false, message: 'Database check failed', error: checkError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into Supabase
    const supabaseUser = mapLocalToSupabaseUser({
      full_name,
      email,
      password: hashedPassword,
      phone_number,
      location,
      gender,
      role: 'user'
    });

    const { data: newUsers, error: insertError } = await supabase
      .from('users')
      .insert([supabaseUser])
      .select();

    if (insertError) {
      console.error('Supabase Register Insert Error:', insertError);
      return res.status(500).json({ success: false, message: 'Server error during registration', error: insertError.message });
    }

    if (!newUsers || newUsers.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to create user account' });
    }

    const createdUser = mapSupabaseToLocalUser(newUsers[0]);

    // Generate JWT
    const token = generateToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: createdUser
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// 2. User Login
exports.login = async (req, res) => {
  try {
    const { email, password, ip_address, device_info } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email in Supabase
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (findError) {
      console.error('Supabase Login Find Error:', findError);
      return res.status(500).json({ success: false, message: 'Database query failed', error: findError.message });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const sUser = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, sUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const localUser = mapSupabaseToLocalUser(sUser);

    // Record login in history (optional logging, fallback to local DB safely)
    try {
      await db.query(
        'INSERT INTO login_history (user_id, ip_address, device_info) VALUES (?, ?, ?)',
        [localUser.id, ip_address || req.ip || '127.0.0.1', device_info || req.headers['user-agent'] || 'Unknown Device']
      );
    } catch (e) {
      console.log('Skipped writing login history to database:', e.message);
    }

    // Generate JWT
    const token = generateToken({ id: localUser.id, email: localUser.email, role: localUser.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: localUser
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// 3. Google Authentication (Mock/Integration)
exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken, profile, ip_address, device_info } = req.body;
    
    if (!profile || !profile.email) {
      return res.status(400).json({ success: false, message: 'Google profile details are required' });
    }

    const { email, name, imageUrl } = profile;

    // Check if user already exists in Supabase
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (findError) {
      console.error('Supabase Google Auth Find Error:', findError);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    let sUser;

    if (!users || users.length === 0) {
      // Create new user for google auth in Supabase
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const supabaseUser = mapLocalToSupabaseUser({
        full_name: name,
        email,
        password: hashedPassword,
        phone_number: '',
        location: '',
        gender: 'Other',
        role: 'user'
      });

      const { data: newUsers, error: insertError } = await supabase
        .from('users')
        .insert([supabaseUser])
        .select();

      if (insertError) {
        console.error('Supabase Google Auth Insert Error:', insertError);
        return res.status(500).json({ success: false, message: 'Failed to create user from Google profile' });
      }

      sUser = newUsers[0];
    } else {
      sUser = users[0];
    }

    const localUser = mapSupabaseToLocalUser(sUser);

    // Save login history to local database safely
    try {
      await db.query(
        'INSERT INTO login_history (user_id, ip_address, device_info) VALUES (?, ?, ?)',
        [localUser.id, ip_address || 'Google OAuth', device_info || 'Browser']
      );
    } catch (e) {
      console.log('Skipped writing login history to database:', e.message);
    }

    // Issue JWT
    const token = generateToken({ id: localUser.id, email: localUser.email, role: localUser.role });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: localUser
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

// 4. Get Logged In User Profile
exports.getMe = async (req, res) => {
  try {
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id);

    if (findError) {
      console.error('Supabase getMe Find Error:', findError);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const localUser = mapSupabaseToLocalUser(users[0]);
    res.status(200).json({
      success: true,
      user: localUser
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// 5. Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone_number, location, age, gender, profile_image } = req.body;

    // Check if user exists in Supabase
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id);

    if (findError) {
      console.error('Supabase updateProfile Find Error:', findError);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentSUser = users[0];

    // Prepare updated fields for Supabase
    const updatedSUser = {
      name: full_name || currentSUser.name,
      phone: phone_number !== undefined ? phone_number : currentSUser.phone,
      address: location !== undefined ? location : currentSUser.address,
      gender: gender || currentSUser.gender
    };

    // Update in Supabase
    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update(updatedSUser)
      .eq('id', req.user.id)
      .select();

    if (updateError) {
      console.error('Supabase updateProfile Update Error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }

    const localUser = mapSupabaseToLocalUser(updatedUsers[0]);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: localUser
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile', error: error.message });
  }
};

// 6. Get User Login History
exports.getLoginHistory = async (req, res) => {
  try {
    let history = [];
    try {
      const [rows] = await db.query('SELECT * FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 10', [req.user.id]);
      history = rows;
    } catch (dbError) {
      console.log('Skipped fetching login history from local DB:', dbError.message);
    }
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get Login History Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

// 7. Forgot Password (Mock/Support)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (findError || !users || users.length === 0) {
      // For security, return success even if user not found
      return res.status(200).json({ success: true, message: 'If the email exists, a password reset link has been sent!' });
    }

    // Generates a mock token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log(`🔑 Reset token for ${email}: ${resetToken}`);
    
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent!',
      token: resetToken // In dev mode, return the token for convenience
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
};
