-- ===========================================================
--  Local Service Provider Directory  (ServiceHub)
--  Import this file in phpMyAdmin  (Import tab)
-- ===========================================================

CREATE DATABASE IF NOT EXISTS local_service_directory
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE local_service_directory;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS provider_profiles;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1) Users (customer / provider / admin)
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    role        ENUM('customer','provider','admin') NOT NULL DEFAULT 'customer',
    status      ENUM('active','blocked') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) Service categories (Electrician, Plumber, Tutor ...)
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

-- 3) Extra details only providers have
CREATE TABLE provider_profiles (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL UNIQUE,
    category_id      INT NOT NULL,
    area             VARCHAR(100) NOT NULL,
    price_per_hour   DECIMAL(10,2) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    bio              TEXT,
    approved         TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- 4) Bookings made by customers
CREATE TABLE bookings (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT NOT NULL,
    provider_id  INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    address      VARCHAR(255) NOT NULL,
    note         TEXT,
    status       ENUM('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) Reviews (one review per completed booking)
CREATE TABLE reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    booking_id  INT NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    rating      TINYINT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id)  REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
--  Sample data   (admin password: admin123 | all others: 123456)
-- ===========================================================

INSERT INTO categories (id, name, description) VALUES
(1, 'Electrician', 'Wiring, fan and light fitting, electrical repair'),
(2, 'Plumber',     'Pipe fitting, leakage repair, bathroom and kitchen work'),
(3, 'Tutor',       'Home tutors for school and college students'),
(4, 'Cleaner',     'Home and office cleaning services'),
(5, 'Carpenter',   'Furniture making and wooden repair work'),
(6, 'AC Repair',   'AC servicing, gas refill and installation');

INSERT INTO users (id, name, email, password, phone, role, status) VALUES
(1,  'Site Admin',     'admin@example.com',   '$2b$12$WWjfOKTbm5ovmU5/oGT9nukUG9bwrsTWEHcN0HhqEBrFJWx9SBHvW', '01700000000', 'admin',    'active'),
(2,  'Rahim Uddin',    'rahim@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01711111111', 'provider', 'active'),
(3,  'Karim Hossain',  'karim@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01722222222', 'provider', 'active'),
(4,  'Sumaiya Akter',  'sumaiya@example.com', '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01733333333', 'provider', 'active'),
(5,  'Nasir Ahmed',    'nasir@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01744444444', 'provider', 'active'),
(6,  'Farhana Yasmin', 'farhana@example.com', '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01755555555', 'provider', 'active'),
(7,  'Jahid Hasan',    'jahid@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01766666666', 'provider', 'active'),
(8,  'Amit Roy',       'amit@example.com',    '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01811111111', 'customer', 'active'),
(9,  'Nusrat Jahan',   'nusrat@example.com',  '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01822222222', 'customer', 'active'),
(10, 'Tanvir Alam',    'tanvir@example.com',  '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01833333333', 'customer', 'active');

INSERT INTO provider_profiles (user_id, category_id, area, price_per_hour, experience_years, bio, approved) VALUES
(2, 1, 'Tangail Sadar', 500.00, 8, 'Licensed electrician. House wiring, fan, light and circuit breaker repair. Fast and tidy work.', 1),
(3, 2, 'Santosh',       450.00, 6, 'Experienced plumber for pipe leakage, tap and commode fitting, and water tank connection.', 1),
(4, 3, 'Tangail Sadar', 400.00, 4, 'Math and Physics tutor for SSC and HSC students. Home visit available.', 1),
(5, 1, 'Kalihati',      350.00, 3, 'Electrician for small home repairs, switchboard and lighting installation.', 1),
(6, 3, 'Mirzapur',      300.00, 5, 'English and ICT tutor for class 6 to 10. Friendly teaching with weekly tests.', 1),
(7, 2, 'Ghatail',       400.00, 2, 'Plumber for bathroom and kitchen fittings. (Waiting for admin approval)', 0);

INSERT INTO bookings (id, customer_id, provider_id, booking_date, booking_time, address, note, status) VALUES
(1, 8,  2, '2026-09-10', '10:00:00', 'House 12, Road 3, Tangail Sadar', 'Ceiling fan not working',        'completed'),
(2, 9,  2, '2026-09-15', '15:00:00', 'Flat 4B, Victoria Road, Tangail', 'Need new switchboard fitting',   'completed'),
(3, 10, 3, '2026-09-20', '09:30:00', 'Santosh Bazar, near the mosque',  'Kitchen sink is leaking',        'completed'),
(4, 8,  4, '2026-09-22', '17:00:00', 'House 12, Road 3, Tangail Sadar', 'HSC Physics, 2 hours',           'completed'),
(5, 9,  5, '2026-10-12', '11:00:00', 'Flat 4B, Victoria Road, Tangail', 'Install two LED lights',         'pending'),
(6, 10, 2, '2026-10-14', '14:00:00', 'Kagmari Road, Tangail',           'Short circuit in bedroom',       'accepted'),
(7, 8,  3, '2026-10-16', '10:00:00', 'House 12, Road 3, Tangail Sadar', 'Bathroom tap replacement',       'pending'),
(8, 9,  6, '2026-10-05', '16:00:00', 'Flat 4B, Victoria Road, Tangail', 'English tutor for class 8',      'rejected');

INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment) VALUES
(1, 8,  2, 5, 'Very professional. Fixed the fan quickly and cleaned up after work.'),
(2, 9,  2, 4, 'Good work, arrived a little late but the result was neat.'),
(3, 10, 3, 5, 'Solved the leakage problem in under an hour. Highly recommended.'),
(4, 8,  4, 4, 'Explains difficult topics clearly. My brother improved a lot.');


