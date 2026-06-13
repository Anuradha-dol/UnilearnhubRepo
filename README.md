# UniLearnHub

UniLearnHub is a full-stack university learning and collaboration platform. It combines user account management, secure authentication, learning resource sharing, task planning, community posts, realtime support chat, and review management in one application.

This documentation describes the current `final` branch.

## Project Status

| Item | Value |
| --- | --- |
| Primary working branch | `final` |
| Remote branch | `origin/final` |
| Backend default URL | `http://localhost:8081` |
| Frontend default URL | `http://localhost:4173` |
| Database | PostgreSQL |
| Runtime uploads | Local `uploads/` directory, ignored by Git |

## Team Contributions

| Member | Main Module | Implemented Functional Areas |
| --- | --- | --- |
| Anuradha | User Management | Registration, login, OTP email verification, JWT authentication, HTTP-only cookie security, forgot-password recovery, profile and account settings, admin/user profile access, realtime problem asking/support chat, user-to-user chat, user-to-admin chat, admin-to-user chat, review system, and concept-based help chat. |
| Sasindi | Knowledge Sharing and Content Management | Video resource upload and streaming, shared library uploads and downloads, resource filtering, learning content management, quiz creation, quiz update/delete, learner quiz attempts, and quiz result handling. |
| Laksra | Task Management | Personal task creation, admin task assignment, subtasks, task completion, progress dashboard, leaderboard, task notifications, gamification sessions, subject quiz game, and business simulation game. |
| Yohan | Resource Management | Community post feed, post uploads, comments, nested replies, reactions, shares, hashtags, saved post collections, user feed, notification stream, and media attachment handling. |

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Axios, Tailwind CSS |
| Backend | Java 21, Spring Boot 4, Spring Web MVC, Spring Security, Spring Data JPA, Spring WebSocket |
| Database | PostgreSQL |
| Authentication | BCrypt password hashing, JWT access/refresh/verify tokens, HTTP-only cookies |
| Realtime | Native Spring WebSocket endpoint for support/direct chat updates |
| File Storage | Local filesystem upload storage through `uploads/` |
| Mail | Spring Mail with SMTP configuration |
| Build Tools | Maven Wrapper for backend, npm for frontend |

## Architecture Overview

```text
React/Vite client
  |
  | Axios requests with credentials enabled
  v
Spring Boot REST API
  |
  | JWTAuthFilter reads ACCESS token from HTTP-only cookie or Bearer header
  v
Spring Security authorization
  |
  | Controllers -> Services -> Repositories
  v
PostgreSQL database

Realtime support/direct chat:
React client -> /ws/support WebSocket handshake -> SupportWebSocketAuthInterceptor -> SupportWebSocketHandler
```

The frontend uses `frontend/ui/src/api.js` as the shared Axios client. The backend reads all sensitive runtime values from environment variables and keeps real credentials out of source control.

## Core Functional Modules

### 1. User Management, Security, Support Chat, and Reviews

Owner: Anuradha

This module handles user identity, role access, account lifecycle, secure token handling, support/problem asking, direct messaging, and user reviews.

#### Authentication and Registration

- Users can register with first name, last name, primary email, backup email, phone number, role, learning interest, and password.
- Passwords are encoded with BCrypt before storage.
- Email uniqueness and phone number uniqueness are checked during registration.
- New accounts are created as unverified users until OTP verification succeeds.
- A 6-digit OTP is generated with `SecureRandom`.
- Registration OTP expires after 2 minutes.
- OTP resend is rate-limited to 3 attempts inside a 1-minute window.
- If resend limits are exceeded, the user is blocked from resending for 30 minutes.
- The verification flow uses an HTTP-only `userEmail` cookie so the frontend does not need to expose the email in normal application state.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/register` | Create account and send email verification OTP |
| `POST /auth/login` | Authenticate verified users |
| `POST /auth/verify-code` | Verify registration OTP |
| `POST /auth/resend-otp` | Resend registration OTP with rate limiting |
| `POST /auth/check-phone` | Check phone number availability |

#### JWT and HTTP-Only Cookie Security

- Login creates both ACCESS and REFRESH JWT tokens.
- ACCESS token expiry is 1 hour.
- REFRESH token expiry is 7 days.
- Forgot-password verification creates a VERIFY token with a 30-minute expiry.
- JWT roles are embedded into token claims for authorization.
- Tokens are stored in HTTP-only cookies, reducing exposure to client-side JavaScript.
- Cookie behavior is controlled through environment variables:
  - `COOKIE_SECURE`
  - `COOKIE_SAME_SITE`
  - `COOKIE_DOMAIN`
- `JWT_SECRET` must be a Base64-encoded key that decodes to at least 32 bytes.
- The application fails fast if `JWT_SECRET` is missing, invalid Base64, or too short.
- The security filter authenticates from the ACCESS cookie first, then falls back to the `Authorization: Bearer` header.
- The backend is stateless through Spring Security `SessionCreationPolicy.STATELESS`.

#### Forgot Password Recovery

- Users must provide at least two matching identifiers from primary email, backup email, and phone number.
- Recovery can send OTP through primary email, backup email, or phone channel placeholder logic.
- Forgot-password OTP expires after 5 minutes.
- OTP resend uses the same 3-attempt limit and 30-minute block strategy.
- The flow stores the recovery email in an HTTP-only `forgotEmail` cookie.
- After OTP verification, the backend issues a short-lived VERIFY token.
- Password change requires the VERIFY token and matching new/repeat password fields.
- After a successful password change, the forgot-password record is deleted and the VERIFY token is removed.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /forgotpass/send-otp` | Start account recovery |
| `POST /forgotpass/resend-otp` | Resend recovery OTP |
| `POST /forgotpass/verify-otp` | Verify recovery OTP and create VERIFY token |
| `POST /forgotpass/change-password` | Change password with VERIFY token |

#### Profile and Account Management

- Authenticated users can view profile details.
- Users can update name, email, and password.
- Email update sends an OTP to verify the new email before replacing the old one.
- Users can upload profile images and cover images.
- Users can delete their account with current password confirmation.
- Users can also request account deletion through OTP verification.
- Mention search supports community post mentions by searching first name, last name, or email.
- Admin users have protected profile and dashboard endpoints.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /user/me` | Current user profile |
| `PUT /user/update-name` | Update first/last name |
| `PUT /user/update-email` | Request email update OTP |
| `POST /user/verify-new-email` | Confirm new email |
| `PUT /user/update-password` | Change password |
| `DELETE /user/delete` | Delete account with current password |
| `POST /user/delete-forgot-request` | Request account deletion OTP |
| `POST /user/delete-forgot-verify` | Verify account deletion OTP |
| `POST /user/upload-profile-image` | Upload profile image |
| `POST /user/upload-cover-image` | Upload cover image |
| `GET /user/mention-search` | Search users for mentions |
| `GET /admin/me` | Current admin profile |
| `GET /admin/dashboard` | Admin dashboard summary |

#### Realtime Problem Asking and Support Chat

The support system is built as a private chat/problem asking module.

Supported conversation types:

- User to admin support chat: a normal user opens a private support thread. Admins can see and reply through the support inbox.
- User to user direct chat: any authenticated user can start a private direct conversation with another user.
- User to admin direct chat: a user can select an admin contact and start a direct private chat.
- Admin to user direct chat: admins can start direct conversations with users.

How it works:

- Initial chat data is loaded through `GET /support/bootstrap`.
- Contacts are loaded through `GET /support/contacts`.
- Support conversations are created through `POST /support/support-conversations`.
- Direct conversations are created through `POST /support/direct-conversations`.
- Messages are sent through HTTP multipart endpoints so text and attachments can be saved safely.
- The WebSocket endpoint `/ws/support` is used to push realtime conversation updates after HTTP send/edit/delete actions.
- WebSocket authentication accepts the ACCESS token from the HTTP-only cookie, `Authorization` header, or `accessToken` query parameter.
- The WebSocket handler tracks active sessions by user id and keeps a separate admin session set.
- Support conversation updates are broadcast to the owner user and all connected admins.
- Direct conversation updates are broadcast only to the two participants.
- Supported chat attachments are images, videos, and PDFs.
- Message owners can edit their own text messages.
- Message owners can delete their own messages.
- When an attachment message is deleted, the related file is cleaned up from local storage when possible.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /support/bootstrap` | Load current user, support chats, direct chats, users, and admins |
| `GET /support/contacts` | Search contacts by first name |
| `POST /support/support-conversations` | Create or open user's support thread |
| `POST /support/direct-conversations` | Create or open private direct chat |
| `POST /support/conversations/{id}/messages` | Send text and/or attachment |
| `PUT /support/conversations/{id}/messages/{messageId}` | Edit own message |
| `DELETE /support/conversations/{id}/messages/{messageId}` | Delete own message |
| `GET /ws/support` | Authenticated WebSocket connection for realtime updates |

WebSocket event types:

| Event Type | Meaning |
| --- | --- |
| `CONVERSATION_UPDATED` | A conversation changed because a message was created or edited |
| `MESSAGE_DELETED` | A message was deleted from a conversation |
| `ERROR` | Client attempted unsupported WebSocket send action |

#### Concept-Based Help Chat

- `POST /api/chat` provides a simple learning/help chat endpoint.
- It answers predefined questions such as Uni Learn Hub, deep learning, and how to learn.
- It can also search stored `Concept` records using fuzzy text matching through Apache Commons Text.
- This is useful for lightweight problem asking or concept explanation flows.

#### Site Review System

- Users can create reviews with comment, rating, and sentiment status.
- Rating is stored as an integer from 1 to 5.
- Status supports values such as `positive`, `neutral`, and `negative`.
- Users can view their own reviews.
- Users can update or delete only their own reviews.
- All reviews can be listed for public display/testimonials.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /reviews` | List all reviews |
| `GET /reviews/gets` | List current user's reviews |
| `POST /reviews` | Create current user's review |
| `PUT /reviews/{id}` | Update own review |
| `DELETE /reviews/{id}` | Delete own review |

### 2. Knowledge Sharing and Content Management

Owner: Sasindi

This module manages educational resources, video learning material, shared files, and quizzes.

#### Video Resource Management

- Admin users can upload learning videos.
- Each video can store title, description, year, semester, and academic year.
- Authenticated users can list all videos.
- Admin users can view their uploaded videos.
- Admin users can update or delete their own videos.
- Videos can be streamed inline through the backend.
- Video lists can be filtered by year, semester, title, and academic year.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/videos/upload` | Admin video upload |
| `GET /api/videos/all` | List all videos |
| `GET /api/videos/my` | Admin's uploaded videos |
| `PUT /api/videos/{id}` | Update video metadata |
| `DELETE /api/videos/{id}` | Delete video |
| `GET /api/videos/stream/{id}` | Stream video |
| `GET /api/videos/filter` | Filter video resources |

#### Shared Library Resources

- Authenticated users can upload shared learning resources.
- Resources store title, description, year, semester, file metadata, uploader details, content type, and file size.
- Users can list all shared resources or their own uploads.
- Users can filter resources by year, semester, title, and resource type.
- Resources can be streamed or downloaded.
- Video resources stream inline, while other resources download as attachments.
- Owners can delete their uploaded resources.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/shared-resources/upload` | Upload shared resource |
| `GET /api/shared-resources/all` | List all shared resources |
| `GET /api/shared-resources/my` | List current user's uploads |
| `GET /api/shared-resources/filter` | Filter resources |
| `DELETE /api/shared-resources/{id}` | Delete resource |
| `GET /api/shared-resources/stream/{id}` | Stream/open resource |
| `GET /api/shared-resources/download/{id}` | Download resource |

#### Quiz Management

- Admin users can create quiz questions for videos.
- Admin users can update or delete quiz questions.
- Learners can retrieve a quiz for a selected video.
- Learners can submit answers.
- The service returns attempt/result data to the frontend.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /quizzes/{videoId}` | Learner quiz attempt |
| `POST /quizzes/{videoId}/submit` | Submit quiz answers |
| `GET /quizzes/admin/{videoId}` | Admin view of quiz questions |
| `POST /quizzes/create` | Create quiz question |
| `PUT /quizzes/update/{id}` | Update quiz question |
| `DELETE /quizzes/delete/{id}` | Delete quiz question |

### 3. Task Management

Owner: Laksra

This module supports student task planning, admin task assignment, task status tracking, notifications, dashboards, leaderboard, and gamified learning.

#### User Task Workflow

- Users can create their own main tasks.
- Tasks can contain subtasks.
- Users can view their own tasks.
- Users can update subtask status.
- Users can mark a main task as complete.
- Users can delete their own main tasks or subtasks.
- The dashboard summarizes task progress and activity.
- Leaderboard data is available for ranking users.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /tasks/create` | Create self task |
| `GET /tasks/my` | List current user's tasks |
| `GET /tasks/dashboard` | Task dashboard metrics |
| `GET /tasks/leaderboard` | Leaderboard |
| `PUT /tasks/subtask/{id}/status` | Update subtask status |
| `POST /tasks/{id}/complete` | Complete task |
| `DELETE /tasks/maintask/{id}` | Delete main task |
| `DELETE /tasks/subtask/{id}` | Delete subtask |

#### Admin Task Assignment

- Admins can assign tasks to users.
- Admins can list assignable users.
- Admins can view all assigned tasks.
- Admins can delete assigned tasks.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /tasks/admin/assign` | Assign task to user |
| `GET /tasks/admin/users` | List assignable users |
| `GET /tasks/admin/assigned` | List all assigned tasks |
| `DELETE /tasks/admin/{id}` | Delete assigned task |

#### Task Notifications and Gamification

- Users can list unread task notifications.
- Users can mark task notifications as read.
- Users can delete task notifications.
- Gamification sessions can be started per feature.
- Subject quiz game questions can be loaded and submitted.
- Business simulation scenarios can be loaded and submitted.
- Rewards/unlocks are handled through the task gamification service.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /tasks/notifications` | List task notifications |
| `PUT /tasks/notifications/{id}/read` | Mark task notification read |
| `DELETE /tasks/notifications/{id}` | Delete task notification |
| `POST /tasks/games/{feature}/session` | Start game session |
| `GET /tasks/games/subject-quiz` | Load subject quiz |
| `POST /tasks/games/subject-quiz/submit` | Submit subject quiz |
| `GET /tasks/games/business-simulation` | Load business scenario |
| `POST /tasks/games/business-simulation/submit` | Submit business decision |

### 4. Resource and Community Management

Owner: Yohan

This module provides the community feed and social learning resource interactions.

#### Posts and Feed

- Users can create posts with text, optional media, and learning preference.
- Posts can include hashtags extracted/stored for filtering and display.
- Users can view their own posts.
- Authenticated users can view the feed.
- Users can delete only their own posts.
- Upload paths are resolved safely before being returned to the frontend.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /posts/create` | Create post |
| `GET /posts/my` | List current user's posts |
| `GET /posts/feed` | List feed posts |
| `DELETE /posts/delete/{postId}` | Delete own post |

#### Comments, Replies, Reactions, and Shares

- Users can comment with text or attachment.
- Comments can be submitted as JSON or multipart form data.
- Users can reply to comments.
- Nested replies are returned recursively.
- Users can update or delete only their own comments.
- Users can react to posts and remove reactions.
- Reaction counts are available per post.
- Users can share posts with optional captions.
- Full feed combines original and shared content.
- Feed can be filtered by hashtag.
- Users can delete their own shares.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /comments/{postId}/add` | Add comment |
| `POST /comments/{postId}/reply/{parentCommentId}` | Add reply |
| `GET /comments/{postId}/all` | List comments and replies |
| `GET /comments/{postId}/count` | Count comments |
| `PUT /comments/{commentId}/update` | Update own comment |
| `DELETE /comments/{commentId}/delete` | Delete own comment |
| `POST /reactions/{postId}` | Add/update reaction |
| `DELETE /reactions/{postId}` | Remove reaction |
| `GET /reactions/{postId}/counts` | Reaction counts |
| `POST /shares/{postId}/share` | Share post |
| `GET /shares/feed` | Full feed |
| `GET /shares/my` | Current user's shares |
| `DELETE /shares/{shareId}` | Delete own share |

#### Saved Collections and Notifications

- Users can create saved post collections.
- Users can save posts into a collection or default saved area.
- Users can unsave posts.
- Users can view saved posts and saved post ids.
- Notification data includes unread counts, mark-read, mark-all-read, and Server-Sent Events streaming.

Main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /saved-posts/collections` | List collections |
| `POST /saved-posts/collections` | Create collection |
| `POST /saved-posts/{postId}` | Save post |
| `DELETE /saved-posts/{postId}` | Unsave post |
| `GET /saved-posts` | List saved posts |
| `GET /saved-posts/ids` | List saved post ids |
| `GET /notifications/my` | List notifications |
| `GET /notifications/unread-count` | Unread notification count |
| `PATCH /notifications/{notificationId}/read` | Mark one notification read |
| `PATCH /notifications/read-all` | Mark all notifications read |
| `GET /notifications/stream` | SSE notification stream |

## Frontend Routes

| Route | Screen |
| --- | --- |
| `/` | Landing page |
| `/sign-up`, `/signup` | Registration |
| `/login` | Login |
| `/forgot-password` | Forgot password |
| `/verify` | OTP verification |
| `/home` | User home |
| `/dashboard` | Admin dashboard |
| `/profile` | Profile |
| `/settings` | Settings |
| `/resources` | User resources |
| `/learning-resources` | Learning resources |
| `/resources-management` | Admin resource management |
| `/createquiz/:videoId` | Quiz management |
| `/Review` | Review page |
| `/SupportUser` | User support/direct chat |
| `/SupportAdmin` | Admin support/direct chat |
| `/taskPage` | Task hub |
| `/assigned-tasks` | Assigned tasks |
| `/admin-task-manager` | Admin task manager |

## Repository Structure

```text
UnilearnhubRepo/
  backend/
    src/main/java/com/itpm/website/
      config/                  Web, upload, Jackson, WebSocket configuration
      controller/              REST controllers grouped by module
      dtos/                    Request and response DTOs
      enities/                 JPA entities
      repos/                   Spring Data repositories
      security/                Spring Security and JWT filter setup
      service/                 Business logic
      utils/                   JWT, email, upload helpers
      websocket/               Support chat WebSocket authentication and handler
    src/main/resources/
      application.yaml         Environment-driven backend configuration
    pom.xml                    Maven project definition
    mvnw, mvnw.cmd             Maven wrapper

  frontend/
    ui/
      src/
        landing/               Landing page
        pages/                 Auth, home, profile, dashboard, settings
        library/               Resources and quiz UI
        post/                  Community feed UI
        review/                Review and support chat UI
        tasks/                 Task and game UI
        api.js                 Shared Axios client
      package.json             Frontend scripts and dependencies

  uploads/                     Local runtime uploads, ignored by Git except .gitkeep
  .env.example                 Backend environment template
  frontend/ui/.env.example     Frontend environment template
  .gitignore                   Ignore rules for local/generated files
  README.md                    Project documentation
```

## Database Overview

The backend uses Spring Data JPA with PostgreSQL. Hibernate is configured with `JPA_DDL_AUTO=update` by default for local development.

Main data areas:

| Area | Main Entities |
| --- | --- |
| Users and auth | `User`, `ForgotPassword` |
| Learning resources | `VideoResource`, `SharedLibraryResource`, `QuizQuestion`, `UserVideoQuizAssignment` |
| Community | `Post`, `Comment`, `Reaction`, `Share`, `SavedPost`, `PostCollection`, `PostHashtag`, `Notification`, `Mention` |
| Support and reviews | `ChatConversation`, `ChatMessage`, `Review`, `Concept`, `SupportQuestion`, `SupportMessage` |
| Tasks | `MainTask`, `SubTask`, `Progress`, `Reward`, `Notifications`, `GameUnlock` |

For production deployments, change schema handling to:

```text
JPA_DDL_AUTO=validate
```

## Prerequisites

- Java 21
- Node.js 20 or newer
- npm
- PostgreSQL
- Git

## Environment Configuration

Never commit real passwords, mail credentials, JWT secrets, `.env` files, generated logs, IDE settings, build outputs, or uploaded user files.

Backend variables are defined in `.env.example`:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/itpm_uni_learnhub_project
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=change-me

JWT_SECRET=replace-with-a-base64-encoded-32-byte-secret

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@example.com
MAIL_SMTP_AUTH=true
MAIL_STARTTLS_ENABLE=true

SERVER_PORT=8081
FRONTEND_URL=http://localhost:4173
COOKIE_SECURE=false
COOKIE_SAME_SITE=Lax
COOKIE_DOMAIN=
UPLOAD_DIR=uploads
JPA_DDL_AUTO=update
```

Generate a JWT secret:

```bash
openssl rand -base64 32
```

PowerShell example:

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

Frontend variables are defined in `frontend/ui/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

## Database Setup

Create the local PostgreSQL database before starting the backend:

```sql
CREATE DATABASE itpm_uni_learnhub_project;
```

## Run Locally

Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

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

Open the application:

```text
http://localhost:4173
```

## Useful Commands

Backend:

```bash
cd backend
./mvnw test
./mvnw -DskipTests package
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend/ui
npm run lint
npm run build
npm run dev
```

## Security Notes

- Passwords are hashed with BCrypt.
- JWT secrets are environment-driven and validated during startup.
- JWT tokens are placed in HTTP-only cookies with configurable `Secure` and `SameSite`.
- Use `COOKIE_SECURE=true` in HTTPS production environments.
- Use `COOKIE_SAME_SITE=None` only when cross-site cookies are required and HTTPS is enabled.
- Runtime upload folders are ignored by Git.
- Local IDE files such as `.idea/` and `.vscode/` are ignored by Git.
- Rotate any credentials that were ever committed in old branches or commit history.

## Professional Repository Rules

- Keep source code, documentation, config templates, lock files, and tests in Git.
- Keep generated files, build folders, logs, runtime uploads, and local environment files out of Git.
- Do not hardcode passwords, app passwords, JWT secrets, or database credentials.
- Prefer environment variables for all deployment-specific configuration.
- Keep the `final` branch stable and use feature branches for future module changes.
- Validate frontend changes with `npm run lint` and `npm run build`.
- Validate backend changes with Maven tests or at least `./mvnw -DskipTests package` when the local database is unavailable.
