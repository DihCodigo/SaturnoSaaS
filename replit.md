# Saturno - Sistema de Controle de Ponto Eletronico

## Overview
SaaS system for electronic time clock management. Multi-company, multi-role.
Built with React + Express + PostgreSQL.

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js with JWT authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT tokens with bcrypt password hashing

## User Roles
1. **Admin Master** (admin/admin123) - System owner, manages all companies
2. **Admin Company** (empresa/empresa123) - Company admin, manages employees
3. **Employee** (joao.santos/123456) - Clock in/out, view history

## Key Features
- Separate login paths for admin vs employee
- Time clock with geolocation
- Real-time work timer with remaining time
- 10-minute tolerance rule (CLT)
- Bank hours calculation
- Employee management (CRUD)
- **Automatic irregularity detection** (missing exits, missing lunch records)
- **Adjustment workflow**: Admin detects irregularity → sends request → Employee responds with ALL missing times + reason → Admin approves
- Adjustment requests (employee-initiated also supported)
- **Multi-time adjustment response**: Employee can fill in all missing punches at once (stored comma-separated, creates multiple records on approval)
- Holiday management (with auto-seed Brazilian national holidays)
- Company settings (work hours, geo radius, tolerance)
- Professional reports with CSV export
- Dark/light theme
- Mobile-first employee interface
- **Onboarding guide**: First-time tooltip tour for admin and employee (stored in localStorage)
- **Timezone**: Server configured for America/Sao_Paulo (BRT) - both Node.js TZ and PostgreSQL session timezone

## Irregularity Detection System
- **Automatic detection**: Scans last 30 days for incomplete punch records
- **Types detected**: 
  - `missing_exit`: Odd number of punches (entry without exit)
  - `missing_lunch`: Only 2 punches (no lunch break recorded)
- **Workflow**: 
  1. System detects irregularities automatically
  2. Admin sees alerts on dashboard (clickable, links to adjustments page)
  3. Admin sends adjustment request to employee with a note
  4. Employee sees "Acao Necessaria" with notification badge
  5. Employee fills in correct time + reason
  6. Admin reviews and approves/rejects
  7. On approval, a time record is automatically inserted
- **Statuses**: awaiting_employee → pending → approved/rejected
- Irregularities already addressed (with non-rejected adjustments) are hidden from the list

## Project Structure
```
client/src/
  pages/
    login.tsx          - Login page with admin/employee tabs
    register.tsx       - Company registration
    change-password.tsx - Force password change
    admin/
      dashboard.tsx    - Admin dashboard with stats
      employees.tsx    - Employee CRUD management
      adjustments.tsx  - Adjustment request reviews
      holidays.tsx     - Holiday management
      reports.tsx      - Reports with CSV export
      settings.tsx     - Company settings
    employee/
      clock.tsx        - Time clock with live timer
      history.tsx      - Work history
      adjustments.tsx  - Request adjustments
    master/
      dashboard.tsx    - Master admin overview
  components/
    app-layout.tsx     - Admin layout with nav
    onboarding-guide.tsx - First-time tooltip tour
  lib/
    auth.tsx           - Auth context provider
    theme.tsx          - Theme provider
server/
  auth.ts             - JWT middleware
  db.ts               - Database connection (with BRT timezone)
  routes.ts           - All API routes
  seed.ts             - Database seeding
  storage.ts          - Data access layer
shared/
  schema.ts           - Drizzle schema + types
```

## API Routes
- POST /api/auth/login - Login
- POST /api/auth/register - Register company
- POST /api/auth/change-password - Change password
- GET /api/admin/dashboard - Dashboard stats
- GET /api/admin/recent-records - Recent records
- GET/POST /api/admin/employees - Employee CRUD
- PUT /api/admin/employees/:id - Update employee
- PATCH /api/admin/employees/:id/toggle - Toggle active
- GET/PUT /api/admin/company - Company settings
- GET/POST/DELETE /api/admin/holidays - Holidays
- GET /api/admin/reports - Reports with date/employee filters
- GET /api/admin/irregularities - Detect incomplete punches
- GET/POST /api/admin/adjustments - Adjustments (admin can create for employees)
- PATCH /api/admin/adjustments/:id/review - Approve/reject adjustments
- GET /api/employee/today - Today's records + timer
- POST /api/employee/punch - Clock in/out
- GET /api/employee/history - Work history
- GET/POST /api/employee/adjustments - Adjustments
- PATCH /api/employee/adjustments/:id/respond - Employee responds to admin request
- GET /api/master/dashboard - Master stats
