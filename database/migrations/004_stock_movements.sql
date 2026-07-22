-- Phase 7: Stock Movements table schema
USE salon_management;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('STOCK_PURCHASE', 'POS_SALE', 'ONLINE_ORDER', 'CUSTOMER_RETURN', 'DAMAGED_PRODUCT', 'MANUAL_ADJUSTMENT', 'ORDER_CANCELLATION') NOT NULL,
  quantity INT NOT NULL, -- Positive for stock added, negative for stock sold/damaged
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  reference_type ENUM('SALE', 'ORDER', 'MANUAL') DEFAULT 'MANUAL',
  reference_id INT NULL, -- ID pointing to sale_id, order_id, etc.
  note VARCHAR(255) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_movements_product (product_id),
  INDEX idx_movements_type (movement_type)
) ENGINE=InnoDB;
