# PontoMax - Sistema de Controle de Ponto Eletronico

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
- Adjustment requests workflow
- Holiday management
- Company settings (work hours, geo radius, tolerance)
- Dark/light theme
- Mobile-first employee interface

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
  lib/
    auth.tsx           - Auth context provider
    theme.tsx          - Theme provider
server/
  auth.ts             - JWT middleware
  db.ts               - Database connection
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
- GET/PATCH /api/admin/adjustments - Adjustments
- GET /api/employee/today - Today's records + timer
- POST /api/employee/punch - Clock in/out
- GET /api/employee/history - Work history
- GET/POST /api/employee/adjustments - Adjustments
- GET /api/master/dashboard - Master stats
