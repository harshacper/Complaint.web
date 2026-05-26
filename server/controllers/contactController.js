const db = require('../config/db');
const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Mail Transporter
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'harshasubhash@gmail.com') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  // Mock transporter for development/preview
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('✉️  [MOCK EMAIL SENT]');
      console.log('From:', mailOptions.from);
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.text);
      return { messageId: 'mock-id-' + Math.random().toString(36).substr(2, 9) };
    }
  };
}

exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Save message to contact_messages table in Supabase
    const supabaseMessage = {
      name,
      email: email.toLowerCase(),
      message: `[Subject: ${subject}] ${message}`
    };

    const { data: newMsgs, error: supabaseError } = await supabase
      .from('contact_messages')
      .insert([supabaseMessage])
      .select();

    if (supabaseError) {
      console.error('Supabase Contact Message Insert Error:', supabaseError);
    }

    // Also save to local database safely
    try {
      await db.query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject, message]
      );
    } catch (e) {
      console.log('Skipped writing contact message to local fallback database:', e.message);
    }

    // Send notification email to admin harshasubhash@gmail.com
    const adminEmail = process.env.ADMIN_EMAIL || 'harshasubhash@gmail.com';
    const mailOptions = {
      from: `"Complainsy Contact Form" <${process.env.EMAIL_USER || 'no-reply@complainsy.com'}>`,
      to: adminEmail,
      subject: `New Contact Inquiry: ${subject}`,
      text: `You have received a new contact submission from Complainsy web portal.\n\n` +
            `Details:\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}\n\n` +
            `Sent at: ${new Date().toLocaleString()}\n`
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Nodemailer failed, but message was saved in DB:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. Admin will review it shortly!'
    });
  } catch (error) {
    console.error('Contact Submission Error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending contact message' });
  }
};
