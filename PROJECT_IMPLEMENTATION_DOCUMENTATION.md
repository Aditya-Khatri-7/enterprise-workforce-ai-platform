# Enterprise Workforce AI Platform - Project Implementation Documentation

## 1. Purpose of This Document

This document explains how the Enterprise Workforce AI Platform has been built so far, how the backend works, how the frontend works, what technologies are used, what has already been completed, and what remains to complete the project.

The original goal and requirement planning came from `converted.md`. That file defines the full product vision: a centralized workforce management platform for HR, employees, managers, finance, IT, and administrators, with an AI Operations Assistant.

## 2. Project Summary

The project is a MERN-based enterprise workforce management system. It is designed to replace disconnected HR tools, spreadsheets, manual approvals, and email-based workflows with one web application.

The platform currently supports core workforce operations such as authentication, organization setup, employee management, leaves, support tickets, project/team workflows, notifications, audit logs, attendance, recruitment, assets, policies, grievances, payroll hold/release, and AI assistant integration.

At a high level:

- Frontend: React application built with Vite.
- Backend: Node.js and Express REST API.
- Database: MongoDB through Mongoose models.
- Authentication: JWT access tokens stored in cookies, refresh token flow, role-based access control.
- Real-time features: Socket.IO notifications.
- Email: Nodemailer with Gmail SMTP for welcome emails and OTP password reset.
- AI: Google Gemini API integration for the AI Operations Assistant.
- Styling: Tailwind CSS, custom CSS, Framer Motion animations, Lucide icons, React Three Fiber/Three.js for richer UI effects.

## 3. Original Goals from `converted.md`

`converted.md` defines the project as an Enterprise Workforce Management Platform with an AI Operations Assistant.

Main goals from the plan:

- Automate employee management.
- Digitize attendance and leave processes.
- Reduce payroll processing time.
- Improve recruitment workflow.
- Provide centralized document and policy management.
- Add AI-powered HR and operations assistance.
- Improve productivity through dashboards, analytics, notifications, and self-service.
- Enforce secure role-based access control.
- Build a scalable enterprise-ready MERN application.

Main modules planned:

- Authentication and user management
- Organization management
- Employee management
- Recruitment
- Attendance
- Leave management
- Payroll
- Performance management
- Project and task management
- Asset management
- Help desk
- Document/policy management
- Notifications
- Reports and analytics
- AI Operations Assistant

## 4. Current Project Structure

```text
enterprise-workforce-ai-platform/
  backend/
    controllers/
    middlewares/
    models/
    routes/
    utils/
    server.js
    package.json
  frontend/
    src/
      components/
      context/
      hooks/
      layouts/
      pages/
      routes/
      services/
      utils/
    package.json
    vite.config.js
    tailwind.config.js
  public/
  converted.md
  planning.md
  README.md
```

## 5. Backend Working

The backend is an Express.js API server running from `backend/server.js`.

### 5.1 Server Flow

The backend starts by loading environment variables using `dotenv`, then creates an Express app and applies common middleware:

- `helmet` for security headers.
- `cors` for allowing the frontend origins.
- `express-rate-limit` for API rate limiting in production.
- `express.json()` and `express.urlencoded()` for request body parsing.
- `cookie-parser` for reading authentication cookies.

After middleware setup, the server mounts API route files under `/api/...`, connects to MongoDB through Mongoose, initializes Socket.IO, and starts listening on port `3000` unless another port is provided through environment variables.

### 5.2 Backend API Routes

The backend currently mounts these main route groups:

| API Base Path | Purpose |
|---|---|
| `/api/auth` | Login, logout, refresh token, current user, password change, forgot/reset password |
| `/api/employees` | Employee create, update, delete, search, profile, department change, resume, rating |
| `/api/organizations` | Organization creation, admin assignment, status changes |
| `/api/users` | User creation, role change, activation/deactivation, unlock, password reset |
| `/api/audit` | Audit logs |
| `/api/departments` | Department management |
| `/api/designations` | Designation management |
| `/api/leaves` | Leave apply, list, approve/reject |
| `/api/support` | Help desk support ticket creation, list, status update |
| `/api/policies` | Company policy management |
| `/api/workshifts` | Work shift configuration |
| `/api/office-locations` | Office location management |
| `/api/recruitment` | Job posting, candidates, candidate status, hired-to-employee conversion |
| `/api/assets` | Asset CRUD and assignment |
| `/api/attendance` | Today attendance, clock-in, clock-out, monthly history |
| `/api/ai` | AI chat assistant |
| `/api/notifications` | Notification list and read status |
| `/api/payroll` | Hold/release salary |
| `/api/teams` | Employee reassignment and available team leads |
| `/api/progress-reports` | Progress report request, submission, feedback |
| `/api/objections` | Work objection create/list/resolve |
| `/api/projects` | Projects, project requests, team requests, approvals |
| `/api/proposals` | Proposal creation and review |
| `/api/requests` | General request workflow with comments and actions |
| `/api/grievances` | Grievance create/list/resolve |

### 5.3 Database Models

The backend uses Mongoose models for the main business entities:

- User, Role, Permission, RefreshToken, Otp
- Organization, Department, Designation, OfficeLocation, WorkShift
- Employee
- LeaveRequest
- Attendance, AttendanceCorrection
- Payroll
- Candidate, JobPosting
- Asset
- SupportRequest
- Policy
- Notification
- AuditLog
- Project, Task, ProjectRequest, ProjectProposal, TeamRequest
- ProgressReport, PerformanceReview
- Request, Grievance, WorkObjection

This shows that the database layer is already structured for most of the modules defined in the original plan.

### 5.4 Authentication and Authorization

Authentication is handled through JWT tokens.

Current behavior:

- User logs in through `/api/auth/login`.
- Access token is stored in an HTTP-only cookie.
- Frontend calls `/api/auth/me` to check the logged-in user.
- Expired access tokens are refreshed using `/api/auth/refresh`.
- Protected backend routes use `authenticateUser`.
- Role-based backend routes use `authorizeRoles`.
- Suspended, locked, and inactive account states are handled in middleware.

Roles used in the system include:

- Super Admin
- Organization Admin
- HR Manager
- IT Administrator
- Manager
- Department Manager
- Team Lead
- Finance
- Auditor
- Employee

### 5.5 Notifications and Real-Time Updates

The backend uses Socket.IO through `backend/utils/socket.js`.

The flow is:

1. Socket.IO starts with the HTTP server.
2. A user joins a private room like `user_<userId>`.
3. When a notification is created, it is saved in MongoDB.
4. The notification is emitted in real time to that user room.

Notifications are also exposed through `/api/notifications`.

### 5.6 Email System

The email system is in `backend/utils/emailService.js`.

It uses Nodemailer with Gmail SMTP and supports:

- Welcome email with login credentials.
- OTP email for forgot password/reset password.

Required environment variables include:

- `EMAIL_USER`
- `EMAIL_PASS`

### 5.7 AI Operations Assistant

The AI backend endpoint is `/api/ai/chat`.

Current flow:

1. Frontend sends a prompt to `/api/ai/chat`.
2. Backend verifies the logged-in user.
3. Backend gathers organization context from employees, tasks, leaves, tickets, candidates, and policies.
4. It builds a system prompt.
5. It calls Google Gemini API using `GEMINI_API_KEY`.
6. It returns the AI answer to the frontend.

This means the AI assistant is not only a simple chatbot. It is designed to answer based on organizational data.

## 6. Frontend Working

The frontend is a React application built with Vite.

### 6.1 Frontend Architecture

Main frontend folders:

```text
frontend/src/
  components/   Reusable UI and AI/boot/showcase components
  context/      Auth, theme, and demo context
  hooks/        Custom React hooks
  layouts/      Dashboard layout
  pages/        Main screens
  routes/       Protected route and role route wrappers
  services/     Axios API client
  utils/        Demo data and helper utilities
```

### 6.2 Routing

Routing is defined in `frontend/src/App.jsx` using `react-router-dom`.

Public routes include:

- `/`
- `/login`
- `/forgot-password`
- `/welcome`
- `/demo`
- `/create-organization`
- `/unauthorized`
- `/account-suspended`

Protected routes include:

- `/dashboard`
- `/admin/dashboard`
- `/admin/employees`
- `/admin/audit`
- `/admin/requests`
- `/admin/team-leads`
- `/admin/project-requests`
- `/admin/team-requests`
- `/admin/grievances`
- `/admin/my-team`
- `/admin/team-lead-requests`
- `/admin/employee-ratings`
- `/employee/dashboard`
- `/employee/projects`
- `/employee/history`
- `/employee/company-info`
- `/employee/leaves`
- `/employee/tickets`
- `/employee/team-lead-requests`
- `/employee/project-requests`
- `/profile`

### 6.3 Frontend Authentication

Frontend authentication is managed in `frontend/src/context/AuthContext.jsx`.

The flow is:

1. On app load, frontend calls `/auth/me`.
2. If the user is valid, the user state is stored in context.
3. Login calls `/auth/login`.
4. Logout calls `/auth/logout`.
5. Role information is normalized so UI routing can work reliably.

### 6.4 API Communication

The Axios client is in `frontend/src/services/api.js`.

Current behavior:

- Backend base URL is generated from the browser hostname.
- API base path is `http://<hostname>:3000/api`.
- `withCredentials: true` sends cookies with requests.
- Response interceptor handles token refresh on `401`.
- Suspended accounts are redirected to `/account-suspended`.
- Demo mode can intercept API calls and return mock data from `mockDataEngine`.

### 6.5 Role-Based Frontend Access

Frontend route protection uses:

- `ProtectedRoute.jsx` for logged-in access.
- `RoleRoute.jsx` for role-specific screens.

This ensures users only see pages allowed for their role.

### 6.6 AI Chat Widget

The AI chat widget is implemented in `frontend/src/components/AIChatWidget.jsx`.

It provides:

- Floating chat button.
- Slide-out AI assistant panel.
- Message history.
- Quick prompts.
- API call to `/ai/chat`.
- Loading state.

### 6.7 UI and Styling

The frontend uses:

- Tailwind CSS
- Custom CSS
- Framer Motion
- Lucide React icons
- React Toastify
- Recharts
- React Three Fiber and Three.js
- Custom background, boot sequence, and AI-themed UI components

## 7. What We Have Used

### Backend Technologies

| Technology | Use |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB schema/model layer |
| JWT | Authentication tokens |
| Cookie Parser | Reading auth cookies |
| Bcrypt | Password hashing |
| Helmet | Security headers |
| CORS | Frontend/backend communication |
| Express Rate Limit | API rate limiting |
| Socket.IO | Real-time notifications |
| Nodemailer | Email/OTP/welcome emails |
| Google Gemini API | AI assistant responses |
| Dotenv | Environment variable loading |
| Nodemon | Development server auto-reload |

### Frontend Technologies

| Technology | Use |
|---|---|
| React | Frontend UI |
| Vite | Frontend build/dev tool |
| React Router DOM | Routing |
| Axios | API requests |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Toastify | Toast messages |
| React Hook Form | Form handling |
| React Google reCAPTCHA | Captcha support |
| Recharts | Charts and dashboard visuals |
| Socket.IO Client | Real-time client support |
| Lucide React | Icons |
| Three.js / React Three Fiber / Drei | 3D/visual effects |
| Oxlint | Frontend linting |

### Development/Project Tools

| Tool | Status |
|---|---|
| Git | Used for source control |
| npm | Used for dependency management |
| Nodemon | Used for backend development |
| Vite dev server | Used for frontend development |
| Docker | Mentioned in docs/requirements, but no project Dockerfile or docker-compose file is currently implemented |
| Swagger/OpenAPI | Not currently implemented in the repo |

## 8. Module Completion Status

| Module | Current Status |
|---|---|
| Authentication and User Management | Implemented |
| Organization Management | Implemented |
| Employee Management | Implemented |
| Department/Designation/Office/Shift Setup | Implemented |
| Leave Management | Implemented |
| Help Desk Support | Implemented |
| Audit Logs | Implemented |
| Notifications | Implemented with DB + Socket.IO |
| AI Operations Assistant | Implemented with Gemini API and organization context |
| Recruitment | Backend implemented; frontend coverage should be completed/verified |
| Attendance | Backend implemented; frontend coverage should be completed/verified |
| Asset Management | Backend implemented; frontend coverage should be completed/verified |
| Project/Request/Team Workflows | Backend and multiple frontend pages implemented |
| Grievances and Objections | Implemented routes/pages exist |
| Payroll | Partial; salary hold/release exists, full monthly payroll generation still needed |
| Performance Management | Partial; ratings/progress concepts exist, full review workflow still needed |
| Document Management | Partial; resume update exists, full document repository/upload workflow still needed |
| Reports and Analytics | Partial; dashboards and audit exist, full analytics still needed |
| Docker Deployment | Pending |
| Swagger API Documentation | Pending |

## 9. How the Complete Application Works

### 9.1 Login Flow

```text
User opens frontend
  -> Enters email and password
  -> Frontend calls /api/auth/login
  -> Backend validates user
  -> Backend sets JWT cookie
  -> Frontend stores user in AuthContext
  -> User is redirected based on role
```

### 9.2 Protected API Flow

```text
Frontend calls protected API
  -> Browser sends auth cookie
  -> Backend authenticateUser middleware verifies JWT
  -> Backend checks account status
  -> authorizeRoles checks permission where needed
  -> Controller executes business logic
  -> MongoDB stores/returns data
  -> Response goes back to frontend
```

### 9.3 Notification Flow

```text
Business action happens
  -> Backend creates notification in MongoDB
  -> Socket.IO emits event to user room
  -> Frontend can show notification
  -> Notification remains available from API
```

### 9.4 AI Assistant Flow

```text
User asks AI a question
  -> Frontend sends prompt to /api/ai/chat
  -> Backend loads organization data
  -> Backend prepares context prompt
  -> Gemini API generates answer
  -> Frontend displays answer in AI chat widget
```

## 10. What Is Still Needed to Complete the Project

To complete the project properly, these items should be finished:

1. Complete frontend pages for every backend module.
   - Recruitment dashboard
   - Attendance clock-in/clock-out and reports
   - Asset management UI
   - Payroll UI
   - Performance review UI
   - Document management UI

2. Complete full payroll workflow.
   - Monthly salary calculation
   - Attendance/leave integration
   - Deductions and bonuses
   - Payslip generation
   - Finance approval

3. Complete performance management.
   - Goal setting
   - KPI tracking
   - Self review
   - Manager review
   - Final rating and promotion recommendation

4. Complete document management.
   - Upload employee documents
   - Store files locally or in cloud storage
   - Add document permissions
   - Connect documents with AI search where required

5. Improve reports and analytics.
   - HR dashboard
   - Attendance reports
   - Leave reports
   - Payroll reports
   - Recruitment reports
   - Project productivity reports

6. Add Swagger/OpenAPI documentation.
   - Generate API documentation for all routes
   - Add request/response schemas
   - Expose Swagger UI from backend

7. Add Docker support.
   - Backend Dockerfile
   - Frontend Dockerfile
   - Docker Compose for frontend, backend, and MongoDB
   - Environment variable examples

8. Add stronger testing.
   - Backend API tests
   - Frontend component/page tests
   - Authentication and RBAC tests
   - End-to-end workflow tests

9. Improve production readiness.
   - Centralized logging
   - Better error responses
   - Environment validation
   - Deployment configuration
   - Secure production CORS setup

10. Clean and update documentation.
    - Keep `converted.md` as original goal document.
    - Keep this file as implementation documentation.
    - Add setup/deployment steps after Docker and Swagger are completed.

## 11. Local Development Commands

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Backend API: `http://localhost:3000/api`
- Frontend: `http://localhost:5173`

## 12. Environment Variables Needed

Backend `.env` should include values similar to:

```text
PORT=3000
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<jwt-secret>
EMAIL_USER=<gmail-address>
EMAIL_PASS=<gmail-app-password>
GEMINI_API_KEY=<google-gemini-api-key>
NODE_ENV=development
```

Frontend `.env` may be used for frontend-specific settings if needed, but the current API client builds the backend URL from the browser hostname.

## 13. Final Summary

The project has moved beyond only planning. The backend already contains a large part of the enterprise platform: authentication, RBAC, user and employee handling, organization setup, leaves, support tickets, notifications, AI assistant, recruitment, attendance, assets, projects, teams, grievances, requests, and payroll-related endpoints.

The frontend already contains routing, authentication context, protected routes, role-based access, admin and employee dashboards, employee pages, manager/team-lead pages, AI welcome experience, and AI chat UI.

The main remaining work is to complete frontend coverage for every backend module, finish advanced workflows like payroll and performance reviews, add Docker, add Swagger/OpenAPI API documentation, strengthen testing, and prepare the app for production deployment.
