-- database/migrations/002_appointments_schema.sql
USE salon_management;

-- 1. Create appointments table
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_appointment_status (status)
) ENGINE=InnoDB;

-- 2. Create appointment_services junction table
CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (appointment_id, service_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;
