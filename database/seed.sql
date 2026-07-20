-- Safe development seed data.
-- Default password for all seeded users is: Password123

USE salon_management;

-- Clear existing data (safely for dev)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE staff_profiles;
TRUNCATE TABLE customer_profiles;
TRUNCATE TABLE auth_tokens;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert users
-- Hashed password is for 'Password123'
INSERT INTO users (id, full_name, email, phone, password_hash, role, email_verified_at, status) VALUES
(1, 'System Admin', 'admin@example.test', '+1111111111', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'ADMIN', NOW(), 'ACTIVE'),
(2, 'Jane Cashier', 'cashier@example.test', '+2222222222', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'CASHIER', NOW(), 'ACTIVE'),
(3, 'Alex Stylist', 'stylist@example.test', '+3333333333', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'STAFF', NOW(), 'ACTIVE'),
(4, 'John Customer', 'customer@example.test', '+4444444444', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'CUSTOMER', NOW(), 'ACTIVE');

-- Insert Customer profile
INSERT INTO customer_profiles (user_id, address, notes) VALUES
(4, '123 Main Street, Colombo', 'Regular customer, prefers hair styling and modern cuts.');

-- Insert Staff profile
INSERT INTO staff_profiles (user_id, specialization, experience_years, bio, status) VALUES
(3, 'Hair styling and coloring', 5, 'Professional hair stylist with 5 years experience in creative styling.', 'ACTIVE');
