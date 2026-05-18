-- ============================================
-- Complainsy - Complaint Management System
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS complaint_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE complaint_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    location VARCHAR(255),
    age INT,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    profile_image VARCHAR(500) DEFAULT '/default-avatar.png',
    role ENUM('user', 'admin') DEFAULT 'user',
    google_id VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 2. Login History Table
CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    device_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) NOT NULL UNIQUE,
    user_id INT,
    complaint_title VARCHAR(300) NOT NULL,
    complaint_description TEXT NOT NULL,
    complaint_category ENUM(
        'Road Damage', 'Water Problem', 'Electricity Issue',
        'Garbage Problem', 'Internet Fraud', 'Cyber Crime',
        'Public Safety', 'Noise Pollution', 'Police Complaint', 'Other'
    ) NOT NULL,
    complaint_location VARCHAR(500) NOT NULL,
    complaint_image VARCHAR(500),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    age INT,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    emergency_level ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    additional_notes TEXT,
    complaint_status ENUM('Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    resolution_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_id (complaint_id),
    INDEX idx_status (complaint_status),
    INDEX idx_category (complaint_category),
    INDEX idx_email (email),
    INDEX idx_user_id (user_id)
);

-- 4. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 5. Admin Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'moderator') DEFAULT 'moderator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Insert default admin (password: harsha@#$)
INSERT IGNORE INTO admins (admin_name, email, password, role)
VALUES ('System Admin', 'harsha@gmail.com', '$2a$10$hM9ojfe9GORQo6qdi/Tax.eWuaEzS/K9X8P4sEVE.IrkocqVS6rcK', 'super_admin');

-- Also insert admin in users table for unified auth
INSERT IGNORE INTO users (full_name, email, password, role)
VALUES ('System Admin', 'harsha@gmail.com', '$2a$10$hM9ojfe9GORQo6qdi/Tax.eWuaEzS/K9X8P4sEVE.IrkocqVS6rcK', 'admin');
