-- Phase 5 & 6: Products, POS Sales, Payments, and Discount approvals schema
USE salon_management;

-- 1. Create products table
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

-- 2. Create sales table
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

-- 3. Create sale_items table
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

-- 4. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  appointment_id INT NULL,
  sale_id INT NULL,
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
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_sale (sale_id),
  INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;

-- 5. Create discount_approvals table
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

-- Seed default products
INSERT INTO products (id, sku, name, description, category, cost_price, selling_price, stock_quantity, reorder_level, status) VALUES
(1, 'SHAM-001', 'Premium Herbal Shampoo', 'Nourishing herbal shampoo for all hair types.', 'HAIR', 800.00, 1200.00, 25, 5, 'ACTIVE'),
(2, 'COND-002', 'Nourishing Hair Conditioner', 'Provides deep moisture and silky feel to hair.', 'HAIR', 900.00, 1500.00, 20, 5, 'ACTIVE'),
(3, 'GEL-003', 'Strong Hold Styling Gel', 'Long-lasting firm hold hair styling gel.', 'HAIR', 500.00, 800.00, 15, 5, 'ACTIVE'),
(4, 'FACE-004', 'Aloe Vera Face Wash', 'Refreshing facial cleanser with pure aloe vera extracts.', 'FACE', 600.00, 1000.00, 30, 5, 'ACTIVE'),
(5, 'OIL-005', 'Essential Argan Oil', 'Organic oil for hair and scalp conditioning.', 'HAIR', 1200.00, 2200.00, 12, 3, 'ACTIVE'),
(6, 'POLISH-006', 'Premium Nail Lacquer', 'Vibrant gel nail polish, long wearing formula.', 'NAILS', 300.00, 700.00, 50, 10, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=name;
