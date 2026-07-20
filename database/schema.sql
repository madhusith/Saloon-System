-- Salon Management System database schema.

CREATE DATABASE IF NOT EXISTS salon_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE salon_management;

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER', 'STAFF', 'CASHIER', 'ADMIN') NOT NULL,
  email_verified_at DATETIME NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- 2. auth_tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_type ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'REFRESH_TOKEN') NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- 3. customer_profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  address TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. staff_profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  specialization VARCHAR(255) NULL,
  experience_years INT DEFAULT 0,
  bio TEXT NULL,
  profile_image_url VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  related_entity_type VARCHAR(100) NULL,
  related_entity_id INT NULL,
  status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
  error_message TEXT NULL,
  retry_count INT DEFAULT 0,
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notifications_status (status)
) ENGINE=InnoDB;

-- 6. audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id INT NULL,
  old_values_json JSON NULL,
  new_values_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
