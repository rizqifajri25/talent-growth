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
| Auth       | JWT + bcrypt                                            | ⏳ Planned (Phase 3)   |
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
│   │   │   └── prisma.ts      # Singleton Prisma Client instance
│   │   ├── generated/         # Generated Prisma Client (CommonJS)
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/
│   │   │   └── health.routes.ts # Health & diagnostic endpoints
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

### 2. Database Client Singleton

The database client is located at `backend/src/config/prisma.ts`. It initializes a single `PrismaClient` using `@prisma/adapter-pg` and the `pg` connection pool. During local development, the singleton pattern prevents multiple client connections from being opened across hot-reloads (`tsx watch`).

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
2. Create a development database (e.g. `talent_growth_dev`):
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

### 7. Run the Applications

```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

The frontend will run at **http://localhost:5173** and the backend at **http://localhost:4000**.

---

## 📡 API Endpoints

### 1. Basic Health Check

Verifies that the Express HTTP server is operational.

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

### 2. Database Diagnostic Health Check

Executes a probe query (`SELECT 1`) via Prisma Client to verify database connectivity.

```http
GET /api/v1/health/db
```

**Response when database is connected (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Database connection is healthy",
  "status": "connected",
  "timestamp": "2026-10-14T12:00:00.000Z"
}
```

**Response when database is disconnected or unreachable (HTTP 503 Service Unavailable):**
```json
{
  "success": false,
  "message": "Database is currently unreachable",
  "status": "disconnected",
  "timestamp": "2026-10-14T11:57:28.084Z"
}
```

> **Security Note:** The `/api/v1/health/db` endpoint never returns internal stack traces, connection strings, or database credentials. It is intended for development and infrastructure diagnostics; evaluate whether to restrict or disable this endpoint before exposing it to the public internet.

---

## 🔧 Environment Variables

### Frontend (`frontend/.env`)

| Variable            | Description                   | Default                        |
| ------------------- | ----------------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | Backend API base URL          | `http://localhost:4000/api/v1` |

### Backend (`backend/.env`)

| Variable        | Description                                               | Default / Format                                                      |
| --------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`          | HTTP port the API server listens on                       | `4000`                                                                |
| `FRONTEND_URL`  | Origin URL allowed by CORS                                | `http://localhost:5173`                                               |
| `DATABASE_URL`  | Pooled PostgreSQL connection string for runtime queries   | `postgresql://user:password@localhost:5432/talent_growth_dev?schema=public` |
| `DIRECT_URL`    | Direct PostgreSQL connection string for Prisma migrations | `postgresql://user:password@localhost:5432/talent_growth_dev?schema=public` |

---

## 📜 Available Scripts

### Frontend

| Script           | Command                | Description                         |
| ---------------- | ---------------------- | ----------------------------------- |
| `npm run dev`    | `vite`                 | Start development server            |
| `npm run build`  | `tsc -b && vite build` | Type-check and build for production |
| `npm run preview`| `vite preview`         | Preview production build locally    |

### Backend

| Script                 | Command                  | Description                                            |
| ---------------------- | ------------------------ | ------------------------------------------------------ |
| `npm run dev`          | `tsx watch src/server.ts`| Start development server with hot reload               |
| `npm run build`        | `tsc`                    | Compile TypeScript to JavaScript                       |
| `npm start`            | `node dist/server.js`    | Run compiled production server                         |
| `npm run db:validate`  | `prisma validate`        | Validate Prisma schema syntax and model definitions    |
| `npm run db:generate`  | `prisma generate`        | Generate Prisma Client for TypeScript / CommonJS       |
| `npm run db:migrate:dev`| `prisma migrate dev`    | Create and apply migrations in development             |
| `npm run db:migrate:deploy`| `prisma migrate deploy`| Apply pending migrations in production / staging     |
| `npm run db:status`    | `prisma migrate status`  | Check status of database migrations                   |
| `npm run db:studio`    | `prisma studio`          | Launch interactive web GUI to view and edit data       |

---

## 🏗️ Design Decisions

1. **Relational Database (PostgreSQL)**:
   - Blog platforms inherently feature relational data structures: users author posts, posts receive comments, and users own sessions. PostgreSQL provides ACID transactions, robust foreign key enforcement, and high performance.
2. **Prisma ORM with Driver Adapter (`@prisma/adapter-pg`)**:
   - Prisma offers end-to-end type safety, automated migrations, and schema validation. Prisma 7's driver adapter architecture decouples the query engine from low-level networking, allowing native connection pooling via `pg`.
3. **`passwordHash` Storage**:
   - Passwords must never be stored in plaintext. The field is named `passwordHash` to enforce the architectural standard that only one-way cryptographic hashes (such as bcrypt) will be stored when authentication is implemented in Phase 3.
4. **`AuthSession` for Token Revocation**:
   - Pure stateless JWTs cannot be revoked prior to expiration when a user logs out. The `AuthSession` model tracks unique token IDs (`jti`), enabling instant revocation on logout without storing sensitive JWT signatures or payloads.
5. **Nullable Category on Posts**:
   - In early stages, forcing rigid category management adds friction to content creation. A nullable string category keeps the model lightweight while allowing future taxonomy expansion without schema breakage.
6. **Explicit Referential Actions (`ON DELETE CASCADE`)**:
   - Data cleanup policies are defined explicitly on all foreign keys: deleting a user cascades to their posts, comments, and sessions; deleting a post cascades to its comments. This eliminates orphan rows.
7. **Deferred Features (Scope Boundary)**:
   - Business logic, user registration, JWT generation, post CRUD, and comment routes are explicitly deferred to subsequent phases. Phase 2 strictly establishes the database foundation, schema, migration history, and client configuration.

---

## ✅ Current Status (Phase 2 Completed)

- [x] Repository initialized with Git (Phase 1)
- [x] Frontend scaffolded with React + TypeScript + Vite (Phase 1)
- [x] Backend scaffolded with Express + TypeScript (Phase 1)
- [x] Basic HTTP health check endpoint (`GET /api/v1/health`) (Phase 1)
- [x] PostgreSQL relational schema designed (`User`, `Post`, `Comment`, `AuthSession`) (Phase 2)
- [x] Entity Relationship Diagram and architecture documentation (`docs/database-erd.md`) (Phase 2)
- [x] Prisma ORM v7 configured with PostgreSQL adapter (`@prisma/adapter-pg`) (Phase 2)
- [x] Prisma configuration file created (`prisma.config.ts`) (Phase 2)
- [x] Singleton Prisma Client created (`src/config/prisma.ts`) (Phase 2)
- [x] Initial migration SQL generated (`prisma/migrations/20261014120000_init/migration.sql`) (Phase 2)
- [x] Diagnostic database health endpoint added (`GET /api/v1/health/db`) (Phase 2)
- [x] Database management scripts added to `package.json` (Phase 2)

## 🗺️ Roadmap

| Phase | Description                          | Status      |
| ----- | ------------------------------------ | ----------- |
| 1     | Project initialization & scaffolding | ✅ Done     |
| 2     | Database setup (PostgreSQL + Prisma) | ✅ Done     |
| 3     | Authentication (JWT + bcrypt)        | ⏳ Upcoming |
| 4     | Blog post CRUD                       | ⏳ Upcoming |
| 5     | Comments system                      | ⏳ Upcoming |
| 6     | User profiles & authorization        | ⏳ Upcoming |
| 7     | Search, pagination, markdown         | ⏳ Upcoming |
| 8     | Photo upload                         | ⏳ Upcoming |
| 9     | Testing                              | ⏳ Upcoming |
| 10    | Deployment                           | ⏳ Upcoming |

---

## 📄 License

ISC
