const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// JWT Generation Helper
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'complainsy_secret_jwt_key_2026_modern_ui_ux',
    { expiresIn: '7d' }
  );
};

// 1. User Registration
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone_number, location, age, gender } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, phone_number, location, age, gender, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        full_name,
        email.toLowerCase(),
        hashedPassword,
        phone_number || '',
        location || '',
        age ? parseInt(age) : null,
        gender || 'Other',
        'user',
        '/default-avatar.png'
      ]
    );

    const userId = result.insertId;

    // Generate JWT
    const token = generateToken({ id: userId, email: email.toLowerCase(), role: 'user' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        full_name,
        email: email.toLowerCase(),
        phone_number: phone_number || '',
        location: location || '',
        age: age ? parseInt(age) : null,
        gender: gender || 'Other',
        role: 'user',
        profile_image: '/default-avatar.png'
      }
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

    // Find user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Record login in history
    await db.query(
      'INSERT INTO login_history (user_id, ip_address, device_info) VALUES (?, ?, ?)',
      [user.id, ip_address || req.ip || '127.0.0.1', device_info || req.headers['user-agent'] || 'Unknown Device']
    );

    // Generate JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        location: user.location,
        age: user.age,
        gender: user.gender,
        role: user.role,
        profile_image: user.profile_image
      }
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

    // Check if user already exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (!users || users.length === 0) {
      // Create new user for google auth
      // Generate standard random password since they login via Google
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const [result] = await db.query(
        'INSERT INTO users (full_name, email, password, phone_number, location, age, gender, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name,
          email.toLowerCase(),
          hashedPassword,
          '',
          '',
          null,
          'Other',
          'user',
          imageUrl || '/default-avatar.png'
        ]
      );
      
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];
    }

    // Save login history
    await db.query(
      'INSERT INTO login_history (user_id, ip_address, device_info) VALUES (?, ?, ?)',
      [user.id, ip_address || 'Google OAuth', device_info || 'Browser']
    );

    // Issue JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        location: user.location,
        age: user.age,
        gender: user.gender,
        role: user.role,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

// 4. Get Logged In User Profile
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        location: user.location,
        age: user.age,
        gender: user.gender,
        role: user.role,
        profile_image: user.profile_image,
        created_at: user.created_at
      }
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

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = users[0];

    // Update in database
    await db.query(
      'UPDATE users SET full_name = ?, phone_number = ?, location = ?, age = ?, gender = ?, profile_image = ? WHERE email = ?',
      [
        full_name || currentUser.full_name,
        phone_number !== undefined ? phone_number : currentUser.phone_number,
        location !== undefined ? location : currentUser.location,
        age ? parseInt(age) : currentUser.age,
        gender || currentUser.gender,
        profile_image || currentUser.profile_image,
        currentUser.email
      ]
    );

    // Retrieve updated user details
    const [updatedUsers] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = updatedUsers[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        location: user.location,
        age: user.age,
        gender: user.gender,
        role: user.role,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile', error: error.message });
  }
};

// 6. Get User Login History
exports.getLoginHistory = async (req, res) => {
  try {
    const [history] = await db.query('SELECT * FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 10', [req.user.id]);
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

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      // For security, return success even if user not found, so hackers can't harvest emails
      return res.status(200).json({ success: true, message: 'If the email exists, a password reset link has been sent!' });
    }

    // Generates a mock token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // In production, save to db and send email. For demo/prototyping, we just return the success
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
