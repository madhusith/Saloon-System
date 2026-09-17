-- ========================================================================
-- BEAUTY LANE SALON MANAGEMENT SYSTEM - FULL PRODUCTION DATABASE SETUP
-- Execute this file in your Cloud MySQL / phpMyAdmin / Railway / Aiven DB.
-- ========================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'STAFF', 'CASHIER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  email_verified_at DATETIME NULL,
  requires_password_change BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- 2. AUTH TOKENS TABLE
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

-- 3. CUSTOMER PROFILES TABLE
CREATE TABLE IF NOT EXISTS customer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  address TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. STAFF PROFILES TABLE
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

-- 5. NOTIFICATIONS TABLE
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

-- 6. AUDIT LOGS TABLE
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

-- 7. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category ENUM('HAIR', 'FACE', 'BODY', 'NAILS', 'BRIDAL', 'OTHER') NOT NULL,
  duration_minutes INT NULL,
  price DECIMAL(10,2) NULL,
  image_url VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB;

-- 8. STAFF SERVICES JUNCTION
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. STAFF SCHEDULES
CREATE TABLE IF NOT EXISTS staff_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
  is_working BOOLEAN DEFAULT TRUE,
  start_time TIME NULL,
  end_time TIME NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY idx_staff_day (staff_id, day_of_week)
) ENGINE=InnoDB;

-- 10. STAFF UNAVAILABILITY
CREATE TABLE IF NOT EXISTS staff_unavailability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  unavailability_type ENUM('LEAVE', 'BREAK', 'MEETING', 'PERSONAL', 'BLOCKED') NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  staff_id INT NOT NULL,
  booking_reference VARCHAR(50) NOT NULL UNIQUE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_duration_minutes INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'CONFIRMED',
  payment_status ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
  check_in_time DATETIME NULL,
  notes TEXT NULL,
  cancellation_reason VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_appointment_status (status)
) ENGINE=InnoDB;

-- 12. APPOINTMENT SERVICES JUNCTION
CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (appointment_id, service_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category ENUM('HAIR', 'FACE', 'BODY', 'NAILS', 'OTHER') NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  image_url VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_products_sku (sku),
  INDEX idx_products_status (status)
) ENGINE=InnoDB;

-- 14. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  cashier_id INT NOT NULL,
  customer_id INT NULL,
  appointment_id INT NULL,
  sale_type ENUM('APPOINTMENT', 'WALK_IN', 'PRODUCT_ONLY', 'MIXED') NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') DEFAULT 'PAID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_sales_invoice (invoice_number),
  INDEX idx_sales_created_at (created_at)
) ENGINE=InnoDB;

-- 15. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  item_type ENUM('PRODUCT', 'SERVICE') NOT NULL,
  product_id INT NULL,
  service_id INT NULL,
  item_name_snapshot VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 16. ONLINE SHOP ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_reference VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  order_status ENUM('PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  pickup_date DATE NOT NULL,
  customer_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_reference (order_reference),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (order_status)
) ENGINE=InnoDB;

-- 17. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 18. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  appointment_id INT NULL,
  sale_id INT NULL,
  order_id INT NULL,
  cashier_name VARCHAR(255) NULL,
  payment_method ENUM('CASH', 'CARD', 'ONLINE') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  transaction_reference VARCHAR(255) NULL,
  gateway_name VARCHAR(100) NULL,
  payment_status ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL,
  recorded_by INT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_sale (sale_id),
  INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;

-- 19. DISCOUNT APPROVALS TABLE
CREATE TABLE IF NOT EXISTS discount_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NULL,
  requested_by INT NOT NULL,
  approved_by INT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 20. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('STOCK_PURCHASE', 'POS_SALE', 'ONLINE_ORDER', 'CUSTOMER_RETURN', 'DAMAGED_PRODUCT', 'MANUAL_ADJUSTMENT', 'ORDER_CANCELLATION') NOT NULL,
  quantity INT NOT NULL,
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  reference_type ENUM('SALE', 'ORDER', 'MANUAL') DEFAULT 'MANUAL',
  reference_id INT NULL,
  note VARCHAR(255) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_movements_product (product_id),
  INDEX idx_movements_type (movement_type)
) ENGINE=InnoDB;

-- ========================================================================
-- INITIAL SEED DATA (Default password for all users: Password123)
-- ========================================================================

-- Default Users
INSERT INTO users (id, full_name, email, phone, password_hash, role, email_verified_at, status) VALUES
(1, 'Beauty Lane Admin', 'admin@example.test', '+94771111111', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'ADMIN', NOW(), 'ACTIVE'),
(2, 'Beauty Lane Cashier', 'cashier@example.test', '+94772222222', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'CASHIER', NOW(), 'ACTIVE'),
(3, 'Alex Stylist', 'stylist@example.test', '+94773333333', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'STAFF', NOW(), 'ACTIVE'),
(4, 'Sample Customer', 'customer@example.test', '+94774444444', '$2b$10$XqM/Y47b9CXaYnE3hEKBzONIqvskA4rrRcAhS6SWeit8tX7LN5p.G', 'CUSTOMER', NOW(), 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Staff Profile
INSERT INTO staff_profiles (user_id, specialization, experience_years, bio, status) VALUES
(3, 'Senior Hair Specialist & Stylist', 6, 'Expert in modern cuts, bridal dressing and revitalizing hair treatments.', 'ACTIVE')
ON DUPLICATE KEY UPDATE specialization=VALUES(specialization);

-- Customer Profile
INSERT INTO customer_profiles (user_id, address, notes) VALUES
(4, '123 Main Street, Colombo', 'VIP customer')
ON DUPLICATE KEY UPDATE address=VALUES(address);

-- Services
INSERT INTO services (id, name, description, category, duration_minutes, price, status) VALUES
(1, 'Haircut & Styling', 'Professional haircut, hair wash and blow dry styling.', 'HAIR', 30, 1500.00, 'ACTIVE'),
(2, 'Hair Colouring', 'Permanent hair coloring with premium imported organic shades.', 'HAIR', 90, 8000.00, 'ACTIVE'),
(3, 'Rejuvenating Facial', 'Herbal deep pore cleansing and facial massage.', 'FACE', 60, 4500.00, 'ACTIVE'),
(4, 'Keratin Hair Treatment', 'Deep nourishing keratin smoothing therapy for damaged hair.', 'HAIR', 120, 12000.00, 'ACTIVE'),
(5, 'Luxury Manicure', 'Hand massage, exfoliation, cuticle care and gel nail polish.', 'NAILS', 45, 2500.00, 'ACTIVE'),
(6, 'Relaxing Pedicure', 'Aromatherapy foot soak, scrub, massage and nail care.', 'NAILS', 60, 3500.00, 'ACTIVE'),
(7, 'Bridal Dressing Package', 'Complete bridal makeup, saree drapery, hair styling & flowers.', 'BRIDAL', NULL, NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Connect Stylist to Services
INSERT IGNORE INTO staff_services (staff_id, service_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7);

-- Stylist Schedule (Monday to Saturday 9:00 AM - 6:00 PM)
INSERT IGNORE INTO staff_schedules (staff_id, day_of_week, is_working, start_time, end_time) VALUES
(3, 'MONDAY', 1, '09:00:00', '18:00:00'),
(3, 'TUESDAY', 1, '09:00:00', '18:00:00'),
(3, 'WEDNESDAY', 1, '09:00:00', '18:00:00'),
(3, 'THURSDAY', 1, '09:00:00', '18:00:00'),
(3, 'FRIDAY', 1, '09:00:00', '18:00:00'),
(3, 'SATURDAY', 1, '09:00:00', '18:00:00'),
(3, 'SUNDAY', 0, NULL, NULL);

-- Default Products
INSERT INTO products (id, sku, name, description, category, cost_price, selling_price, stock_quantity, reorder_level, status) VALUES
(1, 'SHAM-001', 'Premium Herbal Shampoo (250ml)', 'Nourishing organic shampoo suitable for all hair types.', 'HAIR', 800.00, 1200.00, 30, 5, 'ACTIVE'),
(2, 'COND-002', 'Silk Moisture Conditioner (250ml)', 'Deep moisture repair conditioner for silky softness.', 'HAIR', 900.00, 1500.00, 25, 5, 'ACTIVE'),
(3, 'GEL-003', 'Pro Hold Styling Gel (150ml)', 'Long-lasting firm hold hair styling gel.', 'HAIR', 500.00, 800.00, 20, 5, 'ACTIVE'),
(4, 'FACE-004', 'Pure Aloe Vera Cleanser (100ml)', 'Refreshing daily facial wash with aloe vera extract.', 'FACE', 600.00, 1000.00, 35, 5, 'ACTIVE'),
(5, 'OIL-005', 'Moroccan Argan Hair Oil (100ml)', 'Pure organic oil for hair shine and split-end repair.', 'HAIR', 1200.00, 2200.00, 15, 3, 'ACTIVE'),
(6, 'POLISH-006', 'Gloss Gel Nail Lacquer', 'High-shine chip-resistant gel finish nail polish.', 'NAILS', 300.00, 700.00, 50, 10, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);
