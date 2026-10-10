# ServiceHub - Local Service Provider Directory

A full-stack web application where customers find electricians, plumbers, tutors and other
local professionals, compare ratings, book services and leave reviews.

**Tech:** HTML, CSS, JavaScript (front-end) | Node.js + Express (back-end) | MySQL (database)

## Features
- **Customer:** search/filter providers, view profiles and reviews, book a service, cancel, review after completion
- **Provider:** register with service details, accept / reject / complete bookings, edit service profile, see ratings
- **Admin:** approve providers, block/delete users, manage categories (CRUD), moderate reviews, overview report
- Login with encrypted passwords (bcrypt), role-based access, prepared SQL statements, responsive design

## Run on your PC
1. Install **Node.js (LTS)** and **MySQL** (or XAMPP and start MySQL).
2. Import `database/database.sql` into MySQL (creates database `local_service_directory` with sample data).
3. Copy `.env.example` to `.env` and set your MySQL password if it is not empty.
4. In the project folder run:
   ```
   npm install
   npm start
   ```
5. Open http://localhost:3000

## Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Provider | rahim@example.com | 123456 |
| Customer | amit@example.com | 123456 |

## Project structure
```
server.js              starts the server
src/db.js              MySQL connection
src/middleware/auth.js login + role checks
src/routes/            auth, public, bookings, reviews, provider, admin APIs
public/                HTML pages, css/style.css, js/ (one script per page)
database/database.sql  tables + sample data
```

## Database tables
`users`, `categories`, `provider_profiles`, `bookings`, `reviews`
(users 1-to-1 provider_profiles; users 1-to-many bookings; bookings 1-to-1 reviews)
