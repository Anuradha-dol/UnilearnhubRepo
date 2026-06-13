# UniLearnHub

UniLearnHub is a full-stack learning platform for student collaboration, resource sharing, task management, and user profile management. The repository contains a Spring Boot backend API and a React/Vite frontend application.

## Project Status

- Primary branch: `final`
- Default remote branch: `origin/final`
- Backend runs on `http://localhost:8081` by default
- Frontend runs on `http://localhost:4173` by default

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Tailwind CSS |
| Backend | Java 21, Spring Boot, Spring MVC, Spring Security, Spring Data JPA, WebSocket |
| Database | PostgreSQL |
| Authentication | Spring Security, BCrypt password hashing, JWT access/refresh cookies |
| File Storage | Local `uploads/` directory for user media, learning resources, chat attachments, and post attachments |
| Build Tools | Maven Wrapper, npm |

## Core Features

- User Management: registration, login, email OTP verification, password reset, profile updates, account deletion, role-based access for users and admins.
- Knowledge Sharing and Content Management: video resource upload/streaming, shared library uploads/downloads, quiz creation, quiz submission, and learning resource filtering.
- Task Management: user tasks, admin task assignment, subtasks, notifications, dashboard metrics, leaderboard, and gamified task activities.
- Resource and Community Management: posts, comments, replies, reactions, shares, saved collections, notifications, reviews, support conversations, and WebSocket chat support.

## Team Module Ownership

| Member | Module |
| --- | --- |
| Anuradha | User Management |
| Sasindi | Knowledge Sharing and Content Management |
| Laksra | Task Management |
| Yohan | Resource Management |

## Repository Structure

```text
UnilearnhubRepo/
  backend/                  Spring Boot API
    src/main/java/          Controllers, services, repositories, entities, security, config
    src/main/resources/     Application configuration
    src/test/java/          Backend tests
    pom.xml                 Maven project file
  frontend/
    ui/                     React/Vite client
      src/                  Pages, modules, API client, styles, assets
      package.json          Frontend scripts and dependencies
  uploads/                  Runtime upload directory, ignored by Git
  .env.example              Backend environment variable template
  README.md                 Project documentation
```

## Prerequisites

- Java 21
- Node.js 20 or newer
- npm
- PostgreSQL
- Git

## Configuration

Do not commit real passwords, mail credentials, or JWT secrets. Use environment variables from `.env.example`.

Important backend variables:

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `FRONTEND_URL`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `UPLOAD_DIR`

Generate a JWT secret:

```bash
openssl rand -base64 32
```

Windows PowerShell example:

```powershell
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/itpm_uni_learnhub_project"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="your-db-password"
$env:JWT_SECRET="your-base64-secret"
$env:MAIL_USERNAME="your-email@example.com"
$env:MAIL_PASSWORD="your-mail-app-password"
$env:MAIL_FROM="your-email@example.com"
$env:FRONTEND_URL="http://localhost:4173"
```

Frontend configuration is in `frontend/ui/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

## Database Setup

Create the PostgreSQL database before starting the backend:

```sql
CREATE DATABASE itpm_uni_learnhub_project;
```

By default, Hibernate uses `update` for local development. For production, set:

```text
JPA_DDL_AUTO=validate
```

## Run Locally

Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start the frontend:

```bash
cd frontend/ui
npm install
npm run dev
```

Open:

```text
http://localhost:4173
```

## Useful Scripts

Backend:

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend/ui
npm run dev
npm run build
npm run lint
```

## Security Notes

- Passwords are stored with BCrypt through Spring Security.
- JWT signing uses `JWT_SECRET`; it must be a Base64-encoded key that decodes to at least 32 bytes.
- Runtime uploads, logs, IDE metadata, and local environment files are ignored by Git.
- Use `COOKIE_SECURE=true` and HTTPS in production.
- Rotate any credentials that were previously committed in old branches or commit history.

## API Areas

- Authentication: `/auth`
- Forgot password: `/forgotpass`
- User profile: `/user`
- Admin profile/dashboard: `/admin`
- Learning videos: `/api/videos`
- Shared resources: `/api/shared-resources`
- Quizzes: `/quizzes`
- Posts, comments, reactions, shares, saved posts, notifications: `/posts`, `/comments`, `/reactions`, `/shares`, `/saved-posts`, `/notifications`
- Reviews and support: `/reviews`, `/support`, `/api/chat`, `/ws/support`
- Tasks and games: `/tasks`, `/tasks/admin`, `/tasks/games`

## Professional Repository Rules

- Keep generated logs and uploaded user files out of Git.
- Keep `.env` files local only.
- Commit source code, config templates, lock files, tests, and documentation.
- Prefer environment variables for deployment-specific values.
