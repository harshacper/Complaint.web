const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.VERCEL
  ? path.join('/tmp', 'db_fallback.json')
  : path.join(__dirname, 'db_fallback.json');

// Initialize fallback JSON database if it doesn't exist
function initFallbackDb() {
  if (!fs.existsSync(dbPath)) {
    const defaultData = {
      users: [
        {
          id: 1,
          full_name: 'System Admin',
          email: 'harsha@gmail.com',
          password: '$2a$10$hM9ojfe9GORQo6qdi/Tax.eWuaEzS/K9X8P4sEVE.IrkocqVS6rcK', // harsha@#$
          phone_number: '9876543210',
          location: 'Bengaluru, Karnataka',
          age: 30,
          gender: 'Male',
          profile_image: '/default-avatar.png',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          full_name: 'Harsha Vardhana',
          email: 'user@complainsy.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgOfKNWCCMimBq4bW5TIQK', // Admin@123456
          phone_number: '9876543211',
          location: 'Bengaluru, Karnataka',
          age: 23,
          gender: 'Male',
          profile_image: '/default-avatar.png',
          role: 'user',
          created_at: new Date().toISOString()
        }
      ],
      login_history: [],
      complaints: [
        {
          id: 1,
          complaint_id: 'CMP1001',
          user_id: 2,
          complaint_title: 'Major Pothole on Outer Ring Road',
          complaint_description: 'There is a huge pothole near the Silk Board junction causing massive traffic jams and potential accidents. Please patch this immediately.',
          complaint_category: 'Road Damage',
          complaint_location: 'Outer Ring Road, Silk Board, Bengaluru',
          complaint_image: null,
          name: 'Harsha Vardhana',
          email: 'user@complainsy.com',
          phone_number: '9876543211',
          age: 23,
          gender: 'Male',
          emergency_level: 'High',
          additional_notes: 'Urgent action required as monsoon is starting.',
          complaint_status: 'In Progress',
          resolution_details: null,
          estimated_days: 7,
          priority_score: 8.5,
          predicted_emotion: 'Concerned',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          complaint_id: 'CMP1002',
          user_id: 2,
          complaint_title: 'Uncollected Garbage in HSR Layout Sector 3',
          complaint_description: 'Garbage has not been collected for the past 5 days. It is piling up near the park and producing a terrible smell. Stray dogs are scattering it.',
          complaint_category: 'Garbage Problem',
          complaint_location: '14th Cross, Sector 3, HSR Layout, Bengaluru',
          complaint_image: null,
          name: 'Harsha Vardhana',
          email: 'user@complainsy.com',
          phone_number: '9876543211',
          age: 23,
          gender: 'Male',
          emergency_level: 'Medium',
          additional_notes: 'Health hazard for kids playing in the park.',
          complaint_status: 'Pending',
          resolution_details: null,
          estimated_days: 3,
          priority_score: 5.0,
          predicted_emotion: 'Frustrated',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      contact_messages: [],
      admins: [
        {
          id: 1,
          admin_name: 'System Admin',
          email: 'harsha@gmail.com',
          password: '$2a$10$hM9ojfe9GORQo6qdi/Tax.eWuaEzS/K9X8P4sEVE.IrkocqVS6rcK',
          role: 'super_admin',
          created_at: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

initFallbackDb();

let pool = null;
let useFallback = false;

// Attempt to connect to MySQL
async function connectToMySQL() {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'complaint_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    pool = mysql.createPool(config);
    // Test the connection
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    conn.release();
    useFallback = false;
  } catch (error) {
    console.warn('⚠️  MySQL Database Connection Failed:', error.message);
    console.warn('🔄 Falling back to JSON Database (db_fallback.json) for smooth execution.');
    useFallback = true;
  }
}

connectToMySQL();

// Read JSON DB
function readJsonDb() {
  try {
    initFallbackDb();
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON fallback DB', err);
    return { users: [], login_history: [], complaints: [], contact_messages: [], admins: [] };
  }
}

// Write JSON DB
function writeJsonDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON fallback DB', err);
  }
}

// SQL Mock Emulator for common queries
async function queryEmulator(sql, params = []) {
  const db = readJsonDb();
  const sqlClean = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT FROM admins
  if (sqlClean.match(/SELECT \* FROM admins WHERE email = \?/i)) {
    const email = params[0];
    const admin = db.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    return [admin ? [admin] : []];
  }

  // 2. INSERT INTO admins
  if (sqlClean.match(/INSERT INTO admins/i)) {
    const [name, email, password, role] = params;
    const newAdmin = {
      id: db.admins.length + 1,
      admin_name: name,
      email,
      password,
      role: role || 'moderator',
      created_at: new Date().toISOString()
    };
    db.admins.push(newAdmin);
    writeJsonDb(db);
    return [{ insertId: newAdmin.id }];
  }

  // 3. SELECT FROM users BY email
  if (sqlClean.match(/FROM users WHERE email = \?/i)) {
    const email = params[0];
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return [user ? [user] : []];
  }

  // 4. SELECT FROM users BY id
  if (sqlClean.match(/FROM users WHERE id = \?/i)) {
    const id = parseInt(params[0]);
    const user = db.users.find(u => u.id === id);
    return [user ? [user] : []];
  }

  // 5. SELECT ALL FROM users
  if (sqlClean.match(/FROM users/i)) {
    if (sqlClean.match(/role\s*=\s*['"]user['"]/i)) {
      return [db.users.filter(u => u.role === 'user')];
    }
    if (sqlClean.match(/role\s*=\s*['"]admin['"]/i)) {
      return [db.users.filter(u => u.role === 'admin')];
    }
    return [db.users];
  }

  // 6. INSERT INTO users
  if (sqlClean.match(/INSERT INTO (IGNORE INTO )?users/i)) {
    // fields: full_name, email, password, phone_number, location, age, gender, role (optional), profile_image (optional)
    // To keep it simple, we extract the keys or match positionally
    let name, email, password, phone, loc, age, gender, role = 'user', profile_image = '/default-avatar.png';
    
    if (params.length === 9) {
      [name, email, password, phone, loc, age, gender, role, profile_image] = params;
    } else if (params.length === 8) {
      [name, email, password, phone, loc, age, gender, role] = params;
    } else if (params.length === 7) {
      [name, email, password, phone, loc, age, gender] = params;
    } else if (params.length === 4) { // Unified admin/user insert
      [name, email, password, role] = params;
    } else {
      [name, email, password, phone, loc, age, gender, role, profile_image] = params;
    }

    // Check if user already exists
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (sqlClean.includes('IGNORE')) {
        return [{ insertId: existing.id, affectedRows: 0 }];
      }
      throw new Error('Email already exists');
    }

    const newUser = {
      id: db.users.length + 1,
      full_name: name,
      email,
      password,
      phone_number: phone || '',
      location: loc || '',
      age: age ? parseInt(age) : null,
      gender: gender || 'Other',
      profile_image: profile_image || '/default-avatar.png',
      role: role || 'user',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeJsonDb(db);
    return [{ insertId: newUser.id, affectedRows: 1 }];
  }

  // 7. UPDATE users
  if (sqlClean.match(/UPDATE users SET/i)) {
    // UPDATE users SET full_name = ?, phone_number = ?, location = ?, age = ?, gender = ?, profile_image = ? WHERE email = ?
    if (params.length >= 7) {
      const [name, phone, loc, age, gender, img, email] = params;
      const userIndex = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (userIndex !== -1) {
        db.users[userIndex] = {
          ...db.users[userIndex],
          full_name: name,
          phone_number: phone,
          location: loc,
          age: parseInt(age),
          gender: gender,
          profile_image: img || db.users[userIndex].profile_image
        };
        writeJsonDb(db);
        return [{ affectedRows: 1 }];
      }
    }
    // Update simple fields
    return [{ affectedRows: 0 }];
  }

  // 8. INSERT INTO login_history
  if (sqlClean.match(/INSERT INTO login_history/i)) {
    const [userId, ipAddress, deviceInfo] = params;
    const newLog = {
      id: db.login_history.length + 1,
      user_id: userId,
      ip_address: ipAddress || '127.0.0.1',
      device_info: deviceInfo || 'Unknown Device',
      login_time: new Date().toISOString()
    };
    db.login_history.push(newLog);
    writeJsonDb(db);
    return [{ insertId: newLog.id }];
  }

  // 9. SELECT FROM login_history
  if (sqlClean.match(/SELECT \* FROM login_history/i)) {
    if (params.length > 0) {
      const userId = params[0];
      const history = db.login_history.filter(h => h.user_id === userId);
      return [history];
    }
    return [db.login_history];
  }

  // 10. INSERT INTO complaints
  if (sqlClean.match(/INSERT INTO complaints/i)) {
    const [
      complaint_id, user_id, complaint_title, complaint_description, 
      complaint_category, complaint_location, complaint_image, 
      name, email, phone_number, age, gender, emergency_level, 
      additional_notes, complaint_status, estimated_days, priority_score, predicted_emotion
    ] = params;

    const newComplaint = {
      id: db.complaints.length + 1,
      complaint_id,
      user_id: user_id ? parseInt(user_id) : null,
      complaint_title,
      complaint_description,
      complaint_category,
      complaint_location,
      complaint_image,
      name,
      email,
      phone_number,
      age: age ? parseInt(age) : null,
      gender,
      emergency_level: emergency_level || 'Medium',
      additional_notes: additional_notes || '',
      complaint_status: complaint_status || 'Pending',
      resolution_details: null,
      estimated_days: estimated_days ? parseInt(estimated_days) : null,
      priority_score: priority_score ? parseFloat(priority_score) : null,
      predicted_emotion: predicted_emotion || 'Neutral',
      created_at: new Date().toISOString()
    };

    db.complaints.push(newComplaint);
    writeJsonDb(db);
    return [{ insertId: newComplaint.id, affectedRows: 1 }];
  }

  // 11. SELECT FROM complaints BY ID (CMP100X)
  if (sqlClean.match(/FROM complaints WHERE complaint_id = \?/i)) {
    const cmpId = params[0];
    const complaint = db.complaints.find(c => c.complaint_id.toUpperCase() === cmpId.toUpperCase());
    return [complaint ? [complaint] : []];
  }

  // 12. SELECT FROM complaints BY email
  if (sqlClean.match(/FROM complaints WHERE email = \?/i)) {
    const email = params[0];
    const filtered = db.complaints.filter(c => c.email.toLowerCase() === email.toLowerCase());
    return [filtered];
  }

  // 13. SELECT ALL complaints or filtered
  if (sqlClean.match(/FROM complaints/i)) {
    if (sqlClean.match(/WHERE id = \?/i)) {
      const id = parseInt(params[0]);
      const complaint = db.complaints.find(c => c.id === id);
      return [complaint ? [complaint] : []];
    }
    return [db.complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))];
  }

  // 14. UPDATE complaint status
  if (sqlClean.match(/UPDATE complaints SET complaint_status = \?, resolution_details = \? WHERE id = \?/i)) {
    const [status, details, id] = params;
    const complaintIndex = db.complaints.findIndex(c => c.id === parseInt(id));
    if (complaintIndex !== -1) {
      db.complaints[complaintIndex] = {
        ...db.complaints[complaintIndex],
        complaint_status: status,
        resolution_details: details
      };
      writeJsonDb(db);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 15. DELETE complaint
  if (sqlClean.match(/DELETE FROM complaints WHERE id = \?/i)) {
    const id = parseInt(params[0]);
    const originalLen = db.complaints.length;
    db.complaints = db.complaints.filter(c => c.id !== id);
    writeJsonDb(db);
    return [{ affectedRows: originalLen - db.complaints.length }];
  }

  // 16. INSERT INTO contact_messages
  if (sqlClean.match(/INSERT INTO contact_messages/i)) {
    const [name, email, subject, message] = params;
    const newMessage = {
      id: db.contact_messages.length + 1,
      name,
      email,
      subject,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.contact_messages.push(newMessage);
    writeJsonDb(db);
    return [{ insertId: newMessage.id }];
  }

  // 17. SELECT ALL contact_messages
  if (sqlClean.match(/FROM contact_messages/i)) {
    return [db.contact_messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))];
  }

  // 18. DELETE FROM contact_messages BY id
  if (sqlClean.match(/DELETE FROM contact_messages WHERE id = \?/i)) {
    const id = parseInt(params[0]);
    const originalLen = db.contact_messages.length;
    db.contact_messages = db.contact_messages.filter(m => m.id !== id);
    writeJsonDb(db);
    return [{ affectedRows: originalLen - db.contact_messages.length }];
  }

  // Default fallback for any unhandled mock queries
  return [[]];
}

// Export a unified query interface
module.exports = {
  query: async (sql, params = []) => {
    if (!useFallback && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.warn('MySQL execution error, checking if fallback needed:', err.message);
        // If MySQL dies, fall back
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
          useFallback = true;
          return await queryEmulator(sql, params);
        }
        throw err;
      }
    } else {
      return await queryEmulator(sql, params);
    }
  },
  isFallback: () => useFallback
};
