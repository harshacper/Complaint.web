const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows Next.js frontend to fetch uploads statically
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Main Route Mapping
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Server status API endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Complainsy REST API Server is active and operational!',
    timestamp: new Date(),
    database: db.isFallback() ? 'JSON Fallback Local Database' : 'MySQL Database Live Connected',
    version: '1.0.0'
  });
});

// Root API Endpoint (displays premium styled info if opened in browser)
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: radial-gradient(circle at top right, #09090b, #020205); color: #ffffff; margin: 0;">
      <div style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); padding: 3rem; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center; max-width: 500px;">
        <h1 style="background: linear-gradient(135deg, #a78bfa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.5rem; margin-top: 0; font-weight: 800; letter-spacing: -0.05em;">Complainsy API</h1>
        <p style="color: #94a3b8; line-height: 1.6; font-size: 1.1rem; margin-bottom: 2rem;">The premium, high-security backend server for the Complainsy Complaint Management System is running successfully.</p>
        <div style="display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-start; text-align: left; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.04); font-family: monospace; font-size: 0.9rem; width: 100%; box-sizing: border-box;">
          <div><span style="color: #6366f1;">●</span> STATUS: <span style="color: #10b981;">ACTIVE</span></div>
          <div><span style="color: #6366f1;">●</span> PORT: <span style="color: #e2e8f0;">${PORT}</span></div>
          <div><span style="color: #6366f1;">●</span> ENGINE: <span style="color: #e2e8f0;">Express.js + Node.js</span></div>
          <div><span style="color: #6366f1;">●</span> DATABASE: <span style="color: ${db.isFallback() ? '#f59e0b' : '#10b981'}; font-weight: bold;">${db.isFallback() ? 'JSON DB (Fallback)' : 'MySQL (Live)'}</span></div>
        </div>
      </div>
    </div>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong inside the server!'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Complainsy server running on http://localhost:${PORT}`);
});
