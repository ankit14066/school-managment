# School Management System - Phase 1

Full-stack MERN School Management System with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| Frontend | React.js, React Router v6, Axios |
| Auth | JWT + bcryptjs |
| Styling | Tailwind CSS |
| State | React Context API |
| Validation | express-validator (backend) |
| Uploads | Multer (student photos) |

## Features

### Authentication & RBAC
- 3 roles: **Admin**, **Teacher**, **Student**
- JWT login/logout with protected routes
- Role-based dashboards and navigation

### Student Management (Admin)
- CRUD with roll number, class, DOB, parent info, photo upload
- Search & filter by class/section
- Student profile view

### Teacher Management (Admin)
- CRUD with employee ID, qualification, joining date
- Assign subjects to teachers

### Class & Subject Management (Admin)
- Classes 1–12 with sections A, B, C
- Subjects linked to classes with teacher assignment
- Class teacher assignment

### Attendance
- Teachers mark daily attendance (Present/Absent/Late)
- Admin views history with date filter
- Monthly attendance report with percentage

### Fees Management (Admin)
- Fee structure per class (tuition, transport, misc)
- Record payments with pending/paid/partial status
- Printable fee receipts
- Monthly collection report

### Marks / Results
- Create exams (Mid-term, Final, etc.)
- Bulk marks entry per exam
- Auto grade calculation (A/B/C/D/F)
- Students view their own results

### Admin Dashboard
- Total students, teachers, classes
- Today's attendance summary
- Monthly fee collection
- Recent activity log

### Issue Ticket Module
- Anyone can submit a support ticket (Title, Module, Description, optional Screenshot, reference URL, Priority)
- Special Developer role has access to all pages (Admin + Teacher + portals)
- Developer dashboard with ticket search, status/priority/module filtering, and color-coded table
- Ticket details page with image preview, reference link, status update controls, and private internal notes

## Project Structure

```
school-managment/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # MVC controllers
│   ├── middleware/      # Auth, validation, upload, errors
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helpers (pagination, grades, receipts)
│   ├── validators/      # express-validator rules
│   ├── uploads/         # Student photos
│   ├── seed.js          # Database seeder
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI
│       ├── context/     # Auth context
│       ├── pages/       # Route pages
│       └── services/    # API layer
└── README.md
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install
# Configure backend/.env (see below)
npm run seed    # Create demo data
npm run dev     # Start on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # Start on http://localhost:3000
```

## Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
DEVELOPER_EMAIL=developer@school.com
DEVELOPER_PASSWORD=developer123
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## Demo Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Teacher | rajesh@school.com | teacher123 |
| Student | amit@school.com | student123 |
| Developer | developer@school.com | developer123 |

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Current user + profile |
| GET/POST/PUT/DELETE | `/api/students` | Admin | Student CRUD |
| GET/POST/PUT/DELETE | `/api/teachers` | Admin | Teacher CRUD |
| GET/POST/PUT/DELETE | `/api/classes` | Admin (write) | Class CRUD |
| GET/POST/PUT/DELETE | `/api/subjects` | Admin (write) | Subject CRUD |
| GET/POST | `/api/attendance` | Admin/Teacher | View/mark attendance |
| GET | `/api/attendance/report/:studentId` | All roles | Monthly report |
| GET/POST | `/api/fees` | Admin | Fee records |
| PUT | `/api/fees/:id/pay` | Admin | Record payment |
| GET | `/api/fees/:id/receipt` | Admin | Fee receipt |
| GET/POST | `/api/results` | Admin/Teacher | Results |
| POST | `/api/results/exams` | Admin/Teacher | Create exam |
| POST | `/api/results/bulk` | Admin/Teacher | Bulk marks entry |
| GET | `/api/dashboard/stats` | Admin | Dashboard stats |
| POST | `/api/tickets` | Private | Submit issue ticket (optional screenshot) |
| GET | `/api/tickets` | Developer | List all tickets (search & filter) |
| GET | `/api/tickets/:id` | Private | Get single ticket detail |
| PUT | `/api/tickets/:id` | Developer | Update status & internal notes |

## Database Models

- **User** — name, email, password, role, profilePic
- **Student** — linked to User, class, rollNo, parentInfo, photo
- **Teacher** — linked to User, employeeId, subjects, qualification
- **Class** — name (1-12), section (A/B/C), classTeacher, students[], subjects[]
- **Subject** — name, code, class, teacher
- **Attendance** — student, class, date, status, markedBy
- **Fee / FeeStructure** — payments, class fee structure, receipts
- **Exam / Result** — exams, marks, auto grades
- **ActivityLog** — dashboard recent activity
- **Ticket** — ticketId (#TKT-xxx), title, moduleName, description, screenshot, referenceUrl, priority, status, submittedBy, internalNotes, closedAt

## License

MIT

---

## Phase 2 Features (Enhancement)

### New Role: Parent
- 4th role added to User model
- Parent linked to student during registration (`parentEmail` field)
- Parent Portal: view child's attendance, fees, results, homework, notices
- Login: `vikram.parent@school.com / parent123` (after seed)

### Timetable Management
- Weekly timetable per class (Mon–Sat, periods 1–8)
- Teacher sees own schedule; student sees class schedule
- Printable view

### Notice Board
- Admin posts school-wide or role-specific notices
- Mark as read; expiry dates
- Shown on all dashboards

### Homework Tracker
- Teachers assign homework with due dates
- Students/parents mark as submitted
- Overdue alerts on dashboard

### PDF Reports (Server-side via PDFKit)
- `GET /api/reports/marksheet/:studentId`
- `GET /api/reports/attendance/:studentId`
- `GET /api/reports/fee-receipt/:feeId`

### Events Calendar
- Holidays, exams, school events
- Holidays block attendance marking
- Upcoming events widget on dashboard

### In-App Messaging
- Teacher → Parent messaging
- Admin broadcast to teachers/parents/students
- Inbox with read/unread; polls every 30s

### Mobile Responsive
- Hamburger menu + slide-out drawer
- Bottom navigation bar on mobile
- Responsive card layouts for tables
- Touch-friendly attendance buttons

### New API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/parents/dashboard` | Parent child overview |
| `GET/POST /api/timetable` | Timetable CRUD |
| `GET/POST/DELETE /api/notices` | Notice board |
| `GET/POST/PUT /api/homework` | Homework tracker |
| `GET/POST /api/events` | Events calendar |
| `GET/POST /api/messages` | Messaging |
| `GET /api/reports/*` | PDF downloads |

