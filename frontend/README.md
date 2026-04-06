# College LMS — Angular Frontend

Angular 19 frontend for the College LMS backend.

## ⚠️ Important: Setup Instructions

**Do NOT run `npm audit fix --force`** — it will upgrade build tools past Angular 19 and break the project.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start
# → http://localhost:4200

# 3. Production build
npm run build
```

## Backend

The app expects the backend at `http://localhost:5000/api` (development).

To change this, edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://YOUR_BACKEND_URL/api'
};
```

## Angular Version

This project uses **Angular 19.2.x** with:
- Standalone components
- Signals for state management
- Lazy-loaded routes
- JWT auth interceptor

## Features

| Page | Roles |
|------|-------|
| Dashboard | Student / Instructor / Admin (role-aware) |
| Courses | All (CRUD for Instructor/Admin) |
| Assignments | Pending submissions + grading |
| Grades | My grades (Student) |
| Attendance | Sessions + create (Instructor/Admin) |
| Timetable | Weekly grid + slot management |
| Notifications | Inbox with mark-read |
| Progress | Grade trends + completion charts |
| Users | Admin only — CRUD |
