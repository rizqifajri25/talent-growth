# Talent Growth Blog Platform

A full-stack blog application for sharing knowledge and growing together, built with modern web technologies.

## 🎯 Purpose

Talent Growth Blog Platform is a web application that enables users to create, read, and share blog posts. The platform aims to foster knowledge sharing and professional growth within a community.

## 🛠️ Tech Stack

| Layer      | Technology                                              | Status                 |
| ---------- | ------------------------------------------------------- | ---------------------- |
| Frontend   | React, TypeScript, Vite                                 | ✅ Scaffolded (Phase 1) |
| Backend    | Node.js, Express.js, TypeScript                         | ✅ Scaffolded (Phase 1) |
| Database   | PostgreSQL (local / Supabase)                           | ✅ Designed (Phase 2)   |
| ORM        | Prisma ORM (v7.10.0 + `@prisma/adapter-pg`)              | ✅ Configured (Phase 2) |
| Auth       | JWT (HS256) + bcrypt (12 rounds) + Zod                  | ✅ Implemented (Phase 3)|
| Testing    | Vitest, Supertest                                       | ✅ Implemented (Phase 3)|
| HTTP Client| Axios                                                   | ⏳ Planned             |
| Deployment | Vercel (Frontend), Railway (Backend), Supabase (DB)     | ⏳ Planned             |

## 📁 Project Structure

```
talent-growth/
├── frontend/                  # React + Vite application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/            # Images, icons, media
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page-level components
│   │   ├── App.tsx            # Root application component
│   │   ├── App.css            # App-level styles
│   │   ├── index.css          # Global styles & design tokens
│   │   └── main.tsx           # Application entry point
│   ├── .env.example           # Environment variable template
│   ├── index.html             # HTML entry point
│   ├── package.json           # Frontend dependencies & scripts
│   ├── tsconfig.json          # TypeScript configuration
│   └── vite.config.ts         # Vite configuration
├── backend/                   # Express.js API server
│   ├── prisma/                # Prisma ORM configuration
│   │   ├── migrations/        # Version-controlled SQL migrations
│   │   │   ├── 20261014120000_init/
│   │   │   │   └── migration.sql # Initial schema migration
│   │   │   └── migration_lock.toml
│   │   └── schema.prisma      # Prisma schema definition
│   ├── src/
│   │   ├── config/            # Configuration modules
│   │   │   ├── auth.ts        # Centralized auth & JWT configuration
│   │   │   └── prisma.ts      # Singleton Prisma Client instance
│   │   ├── controllers/       # HTTP request controllers
│   │   │   └── auth.controller.ts # Register, login, logout, getMe
│   │   ├── generated/         # Generated Prisma Client (CommonJS)
│   │   ├── middleware/        # Express middleware
│   │   │   └── requireAuth.ts # JWT + database session verification
│   │   ├── routes/            # Express route definitions
│   │   │   ├── auth.routes.ts # Auth route endpoints
│   │   │   └── health.routes.ts # Health & diagnostic endpoints
│   │   ├── services/          # Business logic layer
│   │   │   └── auth.service.ts # Registration, password hashing, session tracking
│   │   ├── validators/        # Request validation schemas (Zod)
│   │   │   └── auth.validators.ts # Input validation & normalization
│   │   ├── __tests__/         # Automated test suites
│   │   │   ├── auth.api.test.ts # API integration tests
│   │   │   └── auth.validators.test.ts # Validator unit tests
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # HTTP server entry point
│   ├── .env.example           # Environment variable template
│   ├── package.json           # Backend dependencies & scripts
│   ├── prisma.config.ts       # Prisma 7 central configuration file
│   └── tsconfig.json          # TypeScript configuration
├── docs/                      # Architectural & design documentation
│   └── database-erd.md        # Relational ERD & schema documentation
├── .editorconfig              # Editor formatting rules
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 📋 Prerequisites

- **Node.js** >= 18.x (tested with v25.7.0)
- **npm** >= 9.x (tested with v11.10.1)
- **Git** >= 2.x
- **PostgreSQL** >= 14.x (local instance or cloud Supabase project)

---

## 🔐 Authentication & Session Architecture

The application uses stateful JWT access tokens verified against a database session store:

1. **Password Hashing (bcrypt)**:
   - Passwords are encrypted with `bcrypt` using **12 salt rounds**.
   - Input passwords are restricted to a maximum of **72 bytes in UTF-8** to align with bcrypt's internal algorithm boundary.
   - Plaintext passwords are never stored, logged, or retained in memory longer than necessary.
2. **Access Token Generation (JWT)**:
   - Algorithm: Explicitly set to `HS256`.
   - Token claims:
     - `sub`: Authenticated User UUID.
     - `jti`: Unique session UUID identifier.
     - `iss`: Configured issuer (`talent-growth-api`).
     - `aud`: Configured audience (`talent-growth-web`).
     - `iat`: Issuance timestamp.
     - `exp`: Expiration timestamp (default: 900 seconds / 15 minutes).
3. **Session Tracking & Instant Revocation (`AuthSession`)**:
   - Pure stateless JWTs cannot be revoked immediately when a user logs out.
   - Every issued access token is tracked in the `auth_sessions` table via its unique `tokenId` (`jti`).
   - The full JWT is **never** saved in the database; only the `jti` identifier is stored.
   - When a user logs out (`POST /api/v1/auth/logout`), the `revokedAt` timestamp is updated in PostgreSQL.
   - The `requireAuth` middleware checks both cryptographic signature and the database session status. Revoked or expired sessions immediately return `HTTP 401 Unauthorized`.
4. **Input Validation & Sanitization (Zod)**:
   - Names are trimmed, required, and capped at 80 characters.
   - Email addresses are trimmed, converted to lowercase, and verified for standard RFC compliance.
   - Passwords require at least 8 characters and maximum 72 bytes. Passwords are never auto-trimmed to preserve user intent.

---

## 🗄️ Database Architecture

The application uses **PostgreSQL** as its relational database and **Prisma ORM (v7.10.0)** as its data access layer.

### 1. Data Models

The relational schema consists of four core models:

1. **`User` (`users`)**: Represents platform users.
   - Fields: `id` (UUID PK), `name` (VarChar), `email` (VarChar Unique), `passwordHash` (VarChar), `avatarUrl` (Text, nullable), `createdAt`, `updatedAt`.
   - Relations: Has many `Post`, `Comment`, and `AuthSession`.
2. **`Post` (`posts`)**: Represents blog articles.
   - Fields: `id` (UUID PK), `title` (VarChar), `content` (Text), `category` (VarChar, nullable), `authorId` (UUID FK -> `users.id`), `createdAt`, `updatedAt`.
   - Relations: Belongs to `User` (author); has many `Comment`.
   - Index: Compound index on `(author_id, created_at)`.
3. **`Comment` (`comments`)**: Represents article comments.
   - Fields: `id` (UUID PK), `content` (Text), `postId` (UUID FK -> `posts.id`), `authorId` (UUID FK -> `users.id`), `createdAt`, `updatedAt`.
   - Relations: Belongs to `Post`; belongs to `User`.
   - Indexes: Compound index on `(post_id, created_at)` and single index on `author_id`.
4. **`AuthSession` (`auth_sessions`)**: Represents active user sessions and supports token revocation / logout.
   - Fields: `id` (UUID PK), `userId` (UUID FK -> `users.id`), `tokenId` (VarChar Unique `jti`), `expiresAt`, `revokedAt` (nullable), `createdAt`.
   - Relations: Belongs to `User`.
   - Index: Index on `user_id`.

For the complete ERD diagram, column dictionaries, and cardinality details, see [docs/database-erd.md](file:///d:/talent-growth/docs/database-erd.md).

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd talent-growth
```

### 2. Set up environment variables

Copy the example environment files and adjust values:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

Generate a secure random secret for `JWT_SECRET` in `backend/.env` (at least 32 characters, e.g. using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

### 3. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 4. Database Setup (Local or Supabase)

#### Local PostgreSQL:
1. Ensure PostgreSQL is running on your machine.
2. Create a development database:
   ```sql
   CREATE DATABASE talent_growth_dev;
   ```
3. Set `DATABASE_URL` and `DIRECT_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/talent_growth_dev?schema=public"
   DIRECT_URL="postgresql://postgres:your_password@localhost:5432/talent_growth_dev?schema=public"
   ```

#### Supabase (Cloud Hosting):
1. Create a project in [Supabase](https://supabase.com).
2. Retrieve your connection strings from **Project Settings > Database**:
   - **Connection Pooling (`DATABASE_URL`)**: Select **Transaction mode** (port `6543`).
   - **Direct Connection (`DIRECT_URL`)**: Select **Session / Direct mode** (port `5432`).
3. Set the URLs in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```

### 5. Validate Schema and Generate Prisma Client

```bash
cd backend
npm run db:validate
npm run db:generate
```

### 6. Apply Database Migrations

- **Development workflow** (tracks and applies migration history):
  ```bash
  npm run db:migrate:dev
  ```
- **Production / Staging deployment** (applies pending migrations without prompting):
  ```bash
  npm run db:migrate:deploy
  ```
- **Check migration status**:
  ```bash
  npm run db:status
  ```
- **Inspect database visually with Prisma Studio**:
  ```bash
  npm run db:studio
  ```

### 7. Run Automated Tests

Execute all validator unit tests and API integration tests:

```bash
npm test
```

### 8. Run the Applications

```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

The frontend runs at **http://localhost:5173** and the backend at **http://localhost:4000**.

---

## 📡 API Endpoints

### Health Endpoints

#### 1. Basic Health Check
```http
GET /api/v1/health
```
**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Talent Growth API is running",
  "timestamp": "2026-10-14T11:57:17.986Z"
}
```

#### 2. Database Health Check
```http
GET /api/v1/health/db
```
**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Database connection is healthy",
  "status": "connected",
  "timestamp": "2026-10-14T12:39:10.626Z"
}
```

---

### Authentication Endpoints

All authentication endpoints use the prefix `/api/v1/auth`.

#### 1. User Registration
Creates a new user account, stores password hash, creates an active session, and returns an access token.

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "password": "SecurePassword123!"
}
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "e82d1c68-07cb-4fc4-bb77-9df08f62f3a4",
      "name": "Budi Santoso",
      "email": "budi.santoso@example.com",
      "avatarUrl": null,
      "createdAt": "2026-10-14T12:45:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**Common Error Responses:**
- `HTTP 400 Bad Request`: Input validation failed (e.g. name empty, invalid email, password < 8 chars or > 72 bytes).
- `HTTP 409 Conflict`: An account with this email address already exists.

#### 2. User Login
Verifies credentials, generates a new session and `jti`, and returns an access token.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "budi.santoso@example.com",
  "password": "SecurePassword123!"
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "e82d1c68-07cb-4fc4-bb77-9df08f62f3a4",
      "name": "Budi Santoso",
      "email": "budi.santoso@example.com",
      "avatarUrl": null,
      "createdAt": "2026-10-14T12:45:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**Common Error Responses:**
- `HTTP 400 Bad Request`: Invalid request data.
- `HTTP 401 Unauthorized`: `Invalid email or password.` (Generic message to avoid email enumeration).

#### 3. User Logout (Protected)
Revokes the session corresponding to the bearer token in PostgreSQL.

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 4. Current User Profile (Protected)
Retrieves the profile of the authenticated user.

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "user": {
      "id": "e82d1c68-07cb-4fc4-bb77-9df08f62f3a4",
      "name": "Budi Santoso",
      "email": "budi.santoso@example.com",
      "avatarUrl": null,
      "createdAt": "2026-10-14T12:45:00.000Z",
      "updatedAt": "2026-10-14T12:45:00.000Z"
    }
  }
}
```

**Common Protected Error Responses:**
- `HTTP 401 Unauthorized`: Missing header, invalid format, invalid cryptographic signature, expired token, or revoked session.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable                       | Description                                               | Example / Default Value                                               |
| ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`                         | HTTP port the API server listens on                       | `4000`                                                                |
| `FRONTEND_URL`                 | Origin URL allowed by CORS                                | `http://localhost:5173`                                               |
| `DATABASE_URL`                 | Pooled PostgreSQL connection string for runtime queries   | `postgresql://postgres:password@localhost:5432/talent_growth_dev?schema=public` |
| `DIRECT_URL`                   | Direct PostgreSQL connection string for Prisma migrations | `postgresql://postgres:password@localhost:5432/talent_growth_dev?schema=public` |
| `JWT_SECRET`                   | Cryptographic secret for signing JWT access tokens (>= 32 chars) | `replace-with-a-random-secret-of-at-least-32-characters`              |
| `JWT_ISSUER`                   | Expected JWT issuer claim (`iss`)                         | `talent-growth-api`                                                   |
| `JWT_AUDIENCE`                 | Expected JWT audience claim (`aud`)                       | `talent-growth-web`                                                   |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | Token time-to-live in seconds                             | `900` (15 minutes)                                                    |

---

## 📜 Available Scripts

### Backend

| Script                 | Command                  | Description                                            |
| ---------------------- | ------------------------ | ------------------------------------------------------ |
| `npm run dev`          | `tsx watch src/server.ts`| Start development server with hot reload               |
| `npm run build`        | `npm run db:generate && tsc` | Generate Prisma client and compile TypeScript      |
| `npm start`            | `node dist/server.js`    | Run compiled production server                         |
| `npm test`             | `vitest run`             | Run all automated unit and integration tests           |
| `npm run db:validate`  | `prisma validate`        | Validate Prisma schema syntax and model definitions    |
| `npm run db:generate`  | `prisma generate`        | Generate Prisma Client for TypeScript / CommonJS       |
| `npm run db:migrate:dev`| `prisma migrate dev`    | Create and apply migrations in development             |
| `npm run db:migrate:deploy`| `prisma migrate deploy`| Apply pending migrations in production / staging     |
| `npm run db:status`    | `prisma migrate status`  | Check status of database migrations                   |
| `npm run db:studio`    | `prisma studio`          | Launch interactive web GUI to view and edit data       |

---

## 🏗️ Design Decisions

1. **Stateful JWT with Database Sessions**:
   - While JWTs carry claims statelessly, tracking active session identifiers (`jti`) in PostgreSQL gives the server immediate revocation power upon logout or suspicious activity without storing bloated tokens.
2. **Password Hashing with bcrypt**:
   - bcrypt with 12 rounds provides strong protection against rainbow tables and brute-force attacks while maintaining fast enough response times for user registration and login.
3. **Decoupled Architecture**:
   - Validators (`Zod`), Services (business logic & transactions), Controllers (HTTP handling), and Middleware (`requireAuth`) are strictly separated for clean testability and maintainability.
4. **Targeted Integration Test Cleanup**:
   - Integration tests connect to the local development database using dynamically generated random emails (`test_<uuid>@example.com`). Tests strictly delete only their created records upon completion and never reset or wipe database tables.

---

## ✅ Current Status (Phase 3 Completed)

- [x] Repository initialized with Git (Phase 1)
- [x] Frontend scaffolded with React + TypeScript + Vite (Phase 1)
- [x] Backend scaffolded with Express + TypeScript (Phase 1)
- [x] Basic HTTP health check endpoint (`GET /api/v1/health`) (Phase 1)
- [x] PostgreSQL relational schema designed (`User`, `Post`, `Comment`, `AuthSession`) (Phase 2)
- [x] Entity Relationship Diagram and architecture documentation (`docs/database-erd.md`) (Phase 2)
- [x] Prisma ORM v7 configured with PostgreSQL adapter (`@prisma/adapter-pg`) (Phase 2)
- [x] Initial migration applied to local database `talent_growth_dev` (Phase 2)
- [x] Diagnostic database health endpoint added (`GET /api/v1/health/db`) (Phase 2)
- [x] Password hashing with bcrypt (12 rounds) & 72-byte UTF-8 enforcement (Phase 3)
- [x] JWT token signing & verification with HS256, issuer, audience, and expiration (Phase 3)
- [x] Zod validation schemas for register & login with error normalization (Phase 3)
- [x] Registration endpoint (`POST /api/v1/auth/register`) with atomic session creation (Phase 3)
- [x] Login endpoint (`POST /api/v1/auth/login`) with generic error messages (Phase 3)
- [x] Logout endpoint (`POST /api/v1/auth/logout`) with session revocation in database (Phase 3)
- [x] Current user profile endpoint (`GET /api/v1/auth/me`) (Phase 3)
- [x] `requireAuth` middleware with token and PostgreSQL session verification (Phase 3)
- [x] Full automated test suite (26 passing tests with Vitest & Supertest) (Phase 3)

## 🗺️ Roadmap

| Phase | Description                                    | Status      |
| ----- | ---------------------------------------------- | ----------- |
| 1     | Project initialization & scaffolding           | ✅ Done     |
| 2     | Database setup (PostgreSQL + Prisma)           | ✅ Done     |
| 3     | Authentication (JWT, bcrypt, session tracking) | ✅ Done     |
| 4     | Frontend Auth Integration (UI, login, register)| ⏳ Upcoming |
| 5     | Blog post CRUD                                 | ⏳ Upcoming |
| 6     | Comments system                                | ⏳ Upcoming |
| 7     | User profiles & authorization                  | ⏳ Upcoming |
| 8     | Search, pagination, markdown                   | ⏳ Upcoming |
| 9     | Photo upload                                   | ⏳ Upcoming |
| 10    | Testing & Polish                               | ⏳ Upcoming |
| 11    | Deployment                                     | ⏳ Upcoming |

---

## 📄 License

ISC
