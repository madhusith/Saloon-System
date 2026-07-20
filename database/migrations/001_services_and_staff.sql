-- Phase 3: Services and Staff Management tables

USE salon_management;

-- 1. Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category ENUM('HAIR', 'FACE', 'BODY', 'NAILS', 'BRIDAL', 'OTHER') NOT NULL,
  duration_minutes INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB;

-- 2. Create staff_services junction table
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Create staff_schedules table
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

-- 4. Create staff_unavailability table
CREATE TABLE IF NOT EXISTS staff_unavailability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  unavailability_type ENUM('LEAVE', 'BREAK', 'MEETING', 'PERSONAL', 'BLOCKED') NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed default services
INSERT INTO services (id, name, description, category, duration_minutes, price, status) VALUES
(1, 'Haircut', 'Professional haircut, hair wash and basic styling.', 'HAIR', 30, 1500.00, 'ACTIVE'),
(2, 'Hair Colouring', 'Permanent hair coloring with quality materials.', 'HAIR', 90, 8000.00, 'ACTIVE'),
(3, 'Facial', 'Herbal skin rejuvenating facial pack and face massage.', 'FACE', 60, 4500.00, 'ACTIVE'),
(4, 'Hair Treatment', 'Keratin restoration treatment for damaged hair.', 'HAIR', 120, 12000.00, 'ACTIVE'),
(5, 'Manicure', 'Hand massage, nail shape, and premium gel polish.', 'NAILS', 45, 2500.00, 'ACTIVE'),
(6, 'Pedicure', 'Foot soak, scrub, nail shape, and premium gel polish.', 'NAILS', 60, 3500.00, 'ACTIVE'),
(7, 'Bridal Dressing', 'Complete bridal makeup, dressing, and hair design.', 'BRIDAL', 180, 25000.00, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=name;

-- Seed default services for Alex Stylist (user_id = 3)
INSERT IGNORE INTO staff_services (staff_id, service_id) VALUES
(3, 1), -- Haircut
(3, 2), -- Hair Colouring
(3, 4); -- Hair Treatment

-- Seed default weekly working hours for Alex Stylist (user_id = 3)
INSERT IGNORE INTO staff_schedules (staff_id, day_of_week, is_working, start_time, end_time) VALUES
(3, 'MONDAY', 1, '09:00:00', '18:00:00'),
(3, 'TUESDAY', 1, '09:00:00', '18:00:00'),
(3, 'WEDNESDAY', 1, '09:00:00', '18:00:00'),
(3, 'THURSDAY', 1, '09:00:00', '18:00:00'),
(3, 'FRIDAY', 1, '09:00:00', '18:00:00'),
(3, 'SATURDAY', 1, '09:00:00', '18:00:00'),
(3, 'SUNDAY', 0, NULL, NULL);
