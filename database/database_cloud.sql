-- ===========================================================
--  ServiceHub - Local Service Provider Directory
--  Run this whole file once (MySQL Workbench / phpMyAdmin Import)
-- ===========================================================

-- (cloud version: no CREATE DATABASE / USE - your host already gave you a database)

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS favorites;
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

-- 2) Service categories
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
    headline         VARCHAR(120) NOT NULL DEFAULT '',
    price_per_hour   DECIMAL(10,2) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    bio              TEXT,
    approved         TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- 4) Bookings made by customers
CREATE TABLE bookings (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    customer_id    INT NOT NULL,
    provider_id    INT NOT NULL,
    booking_date   DATE NOT NULL,
    booking_time   TIME NOT NULL,
    hours          TINYINT UNSIGNED NOT NULL DEFAULT 1,
    price_per_hour DECIMAL(10,2) NULL,
    address        VARCHAR(255) NOT NULL,
    note           TEXT,
    status         ENUM('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- 6) Customers' saved (favourite) providers
CREATE TABLE favorites (
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, provider_id),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7) In-app notifications
CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    message    VARCHAR(255) NOT NULL,
    link       VARCHAR(255) NULL,
    is_read    TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
--  Sample data   (admin password: admin123 | all others: 123456)
-- ===========================================================

INSERT INTO categories (id, name, description) VALUES
(1, 'Electrician', 'Wiring, fan and light fitting, electrical repair'),
(2, 'Plumber',     'Pipe fitting, leakage repair, bathroom and kitchen work'),
(3, 'Tutor',       'Home tutors for school and college students'),
(4, 'Cleaner',     'Home and office deep cleaning services'),
(5, 'Carpenter',   'Furniture making and wooden repair work'),
(6, 'AC Repair',   'AC servicing, gas refill and installation');

INSERT INTO users (id, name, email, password, phone, role, status) VALUES
(1,  'Site Admin',       'admin@example.com',   '$2b$12$WWjfOKTbm5ovmU5/oGT9nukUG9bwrsTWEHcN0HhqEBrFJWx9SBHvW', '01700000000', 'admin',    'active'),
(2,  'Rahim Uddin',      'rahim@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01711111111', 'provider', 'active'),
(3,  'Karim Hossain',    'karim@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01722222222', 'provider', 'active'),
(4,  'Sumaiya Akter',    'sumaiya@example.com', '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01733333333', 'provider', 'active'),
(5,  'Nasir Ahmed',      'nasir@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01744444444', 'provider', 'active'),
(6,  'Farhana Yasmin',   'farhana@example.com', '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01755555555', 'provider', 'active'),
(7,  'Jahid Hasan',      'jahid@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01766666666', 'provider', 'active'),
(8,  'Amit Roy',         'amit@example.com',    '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01811111111', 'customer', 'active'),
(9,  'Nusrat Jahan',     'nusrat@example.com',  '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01822222222', 'customer', 'active'),
(10, 'Tanvir Alam',      'tanvir@example.com',  '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01833333333', 'customer', 'active'),
(11, 'Habib Mia',        'habib@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01777777777', 'provider', 'active'),
(12, 'Mizanur Rahman',   'mizan@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01788888888', 'provider', 'active'),
(13, 'Arif Hossain',     'arif@example.com',    '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01799999999', 'provider', 'active'),
(14, 'Shirin Sultana',   'shirin@example.com',  '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01712121212', 'provider', 'active'),
(15, 'Sadia Islam',      'sadia@example.com',   '$2b$12$MbgR5qfKAGIa6YS5d9h3EenE8bEuPNvCiXv/wRBrTM.ggkGOrkVXm',  '01844444444', 'customer', 'active');

INSERT INTO provider_profiles (user_id, category_id, area, headline, price_per_hour, experience_years, bio, approved) VALUES
(2,  1, 'Tangail Sadar', 'Licensed electrician for safe home wiring',     500.00, 8, 'Licensed electrician. House wiring, fan, light and circuit breaker repair. Fast and tidy work with a service guarantee.', 1),
(3,  2, 'Santosh',       'Leak fixing and bathroom fittings expert',      450.00, 6, 'Experienced plumber for pipe leakage, tap and commode fitting, and water tank connection.', 1),
(4,  3, 'Tangail Sadar', 'Math and Physics tutor for SSC and HSC',        400.00, 4, 'Math and Physics tutor for SSC and HSC students. Home visit available with weekly progress reports.', 1),
(5,  1, 'Kalihati',      'Switchboard and lighting installation',         350.00, 3, 'Electrician for small home repairs, switchboard and lighting installation.', 1),
(6,  3, 'Mirzapur',      'English and ICT tutor for class 6 to 10',       300.00, 5, 'English and ICT tutor for class 6 to 10. Friendly teaching with weekly tests.', 1),
(7,  2, 'Ghatail',       'Kitchen and bathroom plumbing',                 400.00, 2, 'Plumber for bathroom and kitchen fittings. (Waiting for admin approval)', 0),
(11, 4, 'Tangail Sadar', 'Spotless deep cleaning for homes and offices',  600.00, 5, 'Professional deep cleaning team for flats, houses and offices. We bring our own equipment and eco-friendly products.', 1),
(12, 5, 'Santosh',       'Custom furniture and wooden repair',            550.00, 12, 'Skilled carpenter for beds, wardrobes, doors and kitchen cabinets. Quality wood and clean finishing.', 1),
(13, 6, 'Tangail Sadar', 'AC servicing, gas refill and installation',     700.00, 7, 'Certified AC technician for all brands. Cleaning, gas refill, repair and installation with warranty.', 1),
(14, 4, 'Kalihati',      'Reliable home cleaning at friendly prices',     350.00, 2, 'Home cleaning service for kitchens, bathrooms and living rooms. Flexible weekly or one-time bookings.', 1);

INSERT INTO bookings (id, customer_id, provider_id, booking_date, booking_time, hours, price_per_hour, address, note, status) VALUES
(1,  8,  2,  '2026-09-10', '10:00:00', 2, 500.00, 'House 12, Road 3, Tangail Sadar', 'Ceiling fan not working',        'completed'),
(2,  9,  2,  '2026-09-15', '15:00:00', 3, 500.00, 'Flat 4B, Victoria Road, Tangail', 'Need new switchboard fitting',   'completed'),
(3,  10, 3,  '2026-09-20', '09:30:00', 2, 450.00, 'Santosh Bazar, near the mosque',  'Kitchen sink is leaking',        'completed'),
(4,  8,  4,  '2026-09-22', '17:00:00', 2, 400.00, 'House 12, Road 3, Tangail Sadar', 'HSC Physics, 2 hours',           'completed'),
(5,  9,  5,  '2026-10-12', '11:00:00', 2, 350.00, 'Flat 4B, Victoria Road, Tangail', 'Install two LED lights',         'pending'),
(6,  10, 2,  '2026-10-14', '14:00:00', 2, 500.00, 'Kagmari Road, Tangail',           'Short circuit in bedroom',       'accepted'),
(7,  8,  3,  '2026-10-16', '10:00:00', 1, 450.00, 'House 12, Road 3, Tangail Sadar', 'Bathroom tap replacement',       'pending'),
(8,  9,  6,  '2026-10-05', '16:00:00', 2, 300.00, 'Flat 4B, Victoria Road, Tangail', 'English tutor for class 8',      'rejected'),
(9,  9,  11, '2026-08-05', '09:00:00', 3, 600.00, 'Flat 4B, Victoria Road, Tangail', 'Full flat deep cleaning',        'completed'),
(10, 10, 12, '2026-08-18', '11:00:00', 4, 550.00, 'Kagmari Road, Tangail',           'Repair wardrobe doors',          'completed'),
(11, 8,  13, '2026-07-22', '15:00:00', 2, 700.00, 'House 12, Road 3, Tangail Sadar', 'AC not cooling',                 'completed'),
(12, 15, 2,  '2026-08-28', '10:30:00', 2, 500.00, 'Mirpur Road, Tangail',            'Install new ceiling fan',        'completed'),
(13, 15, 14, '2026-10-02', '09:30:00', 3, 350.00, 'Mirpur Road, Tangail',            'Kitchen and bathroom cleaning',  'completed'),
(14, 9,  4,  '2026-07-12', '16:00:00', 2, 400.00, 'Flat 4B, Victoria Road, Tangail', 'SSC Math revision',              'completed'),
(15, 10, 11, '2026-10-18', '10:00:00', 4, 600.00, 'Kagmari Road, Tangail',           'Office deep cleaning',           'accepted'),
(16, 15, 13, '2026-10-20', '14:00:00', 2, 700.00, 'Mirpur Road, Tangail',            'AC servicing before summer',     'pending');

INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment) VALUES
(1,  8,  2,  5, 'Very professional. Fixed the fan quickly and cleaned up after work.'),
(2,  9,  2,  4, 'Good work, arrived a little late but the result was neat.'),
(3,  10, 3,  5, 'Solved the leakage problem in under an hour. Highly recommended.'),
(4,  8,  4,  4, 'Explains difficult topics clearly. My brother improved a lot.'),
(9,  9,  11, 5, 'The flat looks brand new. Very polite and hardworking team.'),
(10, 10, 12, 4, 'Great finishing on the wardrobe. Fair price for quality work.'),
(11, 8,  13, 5, 'AC works perfectly now. He explained the problem honestly.'),
(12, 15, 2,  5, 'Neat wiring and very safe work. Will call again.'),
(13, 15, 14, 3, 'Good cleaning but they were 30 minutes late.'),
(14, 9,  4,  5, 'Patient teacher. My Math marks improved after only a month.');

INSERT INTO favorites (customer_id, provider_id) VALUES (8, 2), (8, 4), (9, 11);

INSERT INTO notifications (user_id, message, link, is_read) VALUES
(2,  'New booking request from Tanvir Alam for 2026-10-14.',         'provider-dashboard.html', 0),
(2,  'Sadia Islam left you a 5-star review.',                        'provider-dashboard.html', 0),
(10, 'Rahim Uddin accepted your booking for 2026-10-14.',            'customer.html',           0),
(8,  'Welcome to ServiceHub! Search for a service and book in minutes.', 'customer.html',           1),
(1,  'A new provider is waiting for approval.',                      'admin.html',              0);
