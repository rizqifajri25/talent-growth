# Talent Growth Blog Platform

A full-stack editorial blog platform for sharing knowledge and growing together, built with modern web technologies and the **Aurora** editorial design system.

## 🎯 Purpose

Talent Growth Blog Platform is a web publication and blogging platform enabling engineers, architects, and independent thinkers to compose, read, edit, and share essays. The platform prioritizes calm, high-signal reading, typographic excellence, and robust full-stack security.

## 🛠️ Tech Stack

| Layer       | Technology                                                  | Status                       |
| ----------- | ----------------------------------------------------------- | ---------------------------- |
| Frontend    | React 19, TypeScript, Vite, React Router v7                 | ✅ Integrated (Phase 4 & 5)  |
| Design System| **Aurora** (Warm Porcelain, Instrument Serif, Minimalist)   | ✅ Permanent Standard        |
| Backend     | Node.js, Express.js, TypeScript                             | ✅ Production-ready          |
| Database    | PostgreSQL (Local `talent_growth_dev` / Supabase)            | ✅ Relational Schema         |
| ORM         | Prisma ORM (v7.10.0 + `@prisma/adapter-pg` driver)          | ✅ Configured & Migrated     |
| Auth        | JWT (HS256) + bcrypt (12 rounds) + Zod + In-Memory RAM Store | ✅ Tested & Verified         |
| Testing     | Vitest, Supertest                                           | ✅ **43/43 Tests Passing**   |
| Linter      | Oxlint (Fast Rust-based linting, 0 warnings, 0 errors)       | ✅ Enforced                  |
| HTTP Client | Axios (Centralized instance with Bearer interceptor)        | ✅ Implemented               |
| Deployment  | Vercel (Frontend), Railway (Backend), Supabase (DB)         | ⏳ Planned (Phase 11)        |

---

## 🎨 Design System: Aurora (Permanent Standard)

Starting from Phase 4 and cemented throughout Phase 5 and all future phases, Talent Growth strictly adheres to **Aurora — Warm Editorial Luxury & Architectural Minimalism**:

- **Warm Porcelain Palette**:
  - Background Canvas: `--color-bg: #FBFBFA` (Porcelain)
  - Card & Surface: `--color-surface: #FFFFFF` (Pure White) with subtle stone borders (`#E8E6DF`)
  - Deep Carbon Typography: `--color-text: #121212` for high contrast and readability
  - Muted Graphite: `--color-text-secondary: #6B6963`
  - Muted Brass Accents: `--color-accent-brass: #C2A676`
- **Typographic Hierarchy**:
  - **Display / Headlines**: *Instrument Serif* (Google Fonts) with editorial italic flourishes.
  - **Body Text**: *Plus Jakarta Sans* (18px, line-height 1.85 for comfortable reading).
  - **Labels / Micro-copy**: *JetBrains Mono* for timestamps, categories, and technical metadata.
- **Architectural Minimalism**:
  - Pill form buttons with solid jet-black fill and directional arrows (`Write an essay ↗`).
  - Brass-toned category badges.
  - Split-screen editorial compositions with 3D architectural sculpture framing.
  - Prohibition of neon glows, heavy gradients, or generic AI slop templates.

---

## 📁 Project Structure

```
talent-growth/
├── frontend/                  # React 19 + TypeScript + Vite application
│   ├── public/
│   │   ├── images/            # Curated Aurora 3D architectural imagery
│   │   │   ├── aurora-home.jpg
│   │   │   ├── aurora-login.jpg
│   │   │   └── aurora-register.jpg
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/               # Centralized API service layer
│   │   │   ├── client.ts      # Axios instance, in-memory tokenStore, extractApiError
│   │   │   ├── auth.api.ts    # Auth endpoints (register, login, logout, getMe)
│   │   │   └── posts.api.ts   # Blog post CRUD service (getPosts, getById, create, update, delete)
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx # Route guard redirecting to /login
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx      # Shell layout (Navbar, Outlet, Footer)
│   │   │   │   └── Navbar.tsx         # Aurora sticky header with author actions
│   │   │   └── posts/
│   │   │       ├── PostCard.tsx       # Editorial article card with category badge
│   │   │       └── DeleteConfirmModal.tsx # Accessible modal for post removal
│   │   ├── context/           # React context providers & hooks
│   │   │   ├── authContextDef.ts # Fast Refresh safe auth context definition
│   │   │   ├── AuthContext.tsx   # AuthProvider managing authentication state
│   │   │   └── useAuth.ts        # Custom hook for consuming auth context
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.tsx       # Split-hero with latest live PostgreSQL essays
│   │   │   ├── EssaysPage.tsx     # Full archive with category topic filters
│   │   │   ├── PostDetailPage.tsx # Editorial reading view with author controls
│   │   │   ├── NewPostPage.tsx    # Authoring desk for composing new essays
│   │   │   ├── EditPostPage.tsx   # Authoring desk for revising existing essays
│   │   │   ├── LoginPage.tsx      # Split-panel sign in with error handling
│   │   │   ├── RegisterPage.tsx   # Split-panel registration with UTF-8 limits
│   │   │   └── ProfilePage.tsx    # Author workspace with published essays manager
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── auth.types.ts      # User, session, payload, and response types
│   │   │   └── posts.types.ts     # Post, Author, CRUD payloads, API wrappers
│   │   ├── App.tsx            # Root router & protected route configuration
│   │   ├── App.css            # Aurora editorial styling & responsive rules
│   │   ├── index.css          # Aurora design tokens & base typography
│   │   └── main.tsx           # React entry point
│   ├── index.html             # HTML shell loading Google Fonts
│   └── package.json           # Frontend dependencies & scripts
├── backend/                   # Node.js + Express.js API server
│   ├── prisma/
│   │   ├── migrations/        # Version-controlled SQL migrations
│   │   │   └── 20261014120000_init/
│   │   │       └── migration.sql # Initial schema (User, Post, Comment, AuthSession)
│   │   └── schema.prisma      # Prisma schema definition
│   ├── src/
│   │   ├── config/            # Server & database configurations
│   │   │   ├── auth.ts        # Centralized JWT config
│   │   │   └── prisma.ts      # Singleton Prisma Client instance
│   │   ├── controllers/       # HTTP controllers
│   │   │   ├── auth.controller.ts  # Register, login, logout, getMe
│   │   │   └── posts.controller.ts # Blog post CRUD controllers
│   │   ├── generated/         # Generated Prisma Client
│   │   ├── middleware/        # Express middleware
│   │   │   └── requireAuth.ts # Bearer token & active database session verification
│   │   ├── routes/            # Route declarations
│   │   │   ├── auth.routes.ts   # /api/v1/auth routes
│   │   │   ├── posts.routes.ts  # /api/v1/posts routes
│   │   │   └── health.routes.ts # Health & diagnostic checks
│   │   ├── services/          # Business logic layer
│   │   │   ├── auth.service.ts  # Password hashing, JWT sessions, revocation
│   │   │   └── posts.service.ts # Post queries, safe author selects, ownership enforcement
│   │   ├── validators/        # Zod request validators
│   │   │   ├── auth.validators.ts  # Input validation & normalization
│   │   │   └── posts.validators.ts # UUID, title, content, category validation
│   │   ├── __tests__/         # Automated test suites
│   │   │   ├── auth.validators.test.ts # 10 unit tests
│   │   │   ├── auth.api.test.ts        # 16 integration tests
│   │   │   └── posts.api.test.ts       # 17 CRUD integration tests
│   │   ├── app.ts             # Express application & route registration
│   │   └── server.ts          # Server entry point
│   ├── package.json           # Backend dependencies & scripts
│   └── tsconfig.json          # TypeScript configuration
├── docs/                      # Architectural & design documentation
│   ├── database-erd.md        # Relational ERD & schema documentation
│   └── phase-5-final-report.md# Comprehensive Phase 5 report
├── README.md                  # Main documentation
└── .gitignore                 # Git ignore rules
```

---

## 📡 Backend API Endpoints

### 1. Blog Post CRUD Endpoints (`/api/v1/posts`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/posts` | **Public** | Retrieves all posts sorted newest first (`createdAt: 'desc'`) with safe author info. |
| `GET` | `/api/v1/posts/:id` | **Public** | Retrieves full post details by UUID. Returns 404 if not found, 400 if invalid UUID. |
| `POST` | `/api/v1/posts` | **Protected** | Creates new post. `authorId` is strictly assigned from verified JWT token context. |
| `PUT` | `/api/v1/posts/:id` | **Protected** | Updates post. Enforces ownership: returns 403 Forbidden if current user is not author. |
| `DELETE` | `/api/v1/posts/:id` | **Protected** | Deletes post. Enforces ownership: returns 403 Forbidden if current user is not author. |

#### Request Validation Rules (Zod):
- `title`: String, trimmed, min 1 character, max 255 characters.
- `content`: String, trimmed, min 1 character, max 50,000 characters.
- `category`: String, optional, max 100 characters (saved as `null` if empty).
- `id`: Valid UUID v4.

#### Sensitive Data Security:
- Author info returned in post responses contains only `{ id, name, avatarUrl }`.
- Password hashes, user emails, and database sessions are **strictly excluded** from post responses.

### 2. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Registers new author with bcrypt (12 rounds) and creates active database session. |
| `POST` | `/api/v1/auth/login` | Public | Verifies credentials and issues JWT token with database session tracking. |
| `POST` | `/api/v1/auth/logout` | Protected | Instantly revokes session in PostgreSQL (`revokedAt = NOW()`). |
| `GET` | `/api/v1/auth/me` | Protected | Retrieves current user profile from database using Bearer token. |

### 3. Diagnostic Endpoints (`/api/v1/health`)
- `GET /api/v1/health` — Basic API health check
- `GET /api/v1/health/db` — PostgreSQL connection and latency check

---

## 💻 Frontend Routes & Navigation

| Route | Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Split-hero with recent essays fetched from PostgreSQL, reading CTAs. |
| `/essays` | `EssaysPage` | Public | The Archive: complete list of essays with topic category filter pills. |
| `/essays/:id` | `PostDetailPage` | Public | Reading view in 18px serif/sans layout. Edit & Delete buttons appear **only** for author. |
| `/essays/new` | `NewPostPage` | **Protected** | Editorial desk for composing and publishing essays with client validation. |
| `/essays/:id/edit` | `EditPostPage` | **Protected** | Editorial desk for revising essays. Verifies ownership; non-owners get 403 card. |
| `/profile` | `ProfilePage` | **Protected** | Author workspace displaying account metadata and manager for authored essays. |
| `/login` | `LoginPage` | Public (Guest) | Split-panel login with error banners and redirect. |
| `/register` | `RegisterPage` | Public (Guest) | Split-panel registration with UTF-8 byte validation. |
| `*` | `Navigate` | Public | Wildcard redirect to `/`. |

---

## 🧪 Testing & Verification

### Full Test Suite (43 Passing Tests)
Run all unit and integration tests across backend authentication and blog post CRUD:

```bash
cd backend
npm test
```

Test coverage includes:
- `auth.validators.test.ts` (10 tests): UTF-8 72-byte passwords, email normalization, required fields.
- `auth.api.test.ts` (16 tests): Registration, login, duplicate email rejection, session revocation.
- `posts.api.test.ts` (17 tests): Public reads, safe author filtering, creation with token identity, ownership enforcement for edit/delete, 403 for unauthorized users, 404 for missing records, targeted cleanup.

### Frontend Quality & Typecheck
Verify strict TypeScript compilation and linting:

```bash
cd frontend

# Oxlint (0 warnings, 0 errors on 24 files)
npm run lint

# Compile and build Vite production bundle
npm run build
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** running locally on port 5432 with database `talent_growth_dev`

### 2. Environment Setup

**Backend (`backend/.env`):**
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/talent_growth_dev"
JWT_SECRET="your-secure-jwt-secret-here"
FRONTEND_URL="http://localhost:5173"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL="http://localhost:4000/api/v1"
```

### 3. Database Migration
```bash
cd backend
npm install
npm run db:migrate:dev
```

### 4. Running the Dev Servers
```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## ✅ Current Status (Phase 5 Completed)

- [x] **Phase 1**: Full-stack scaffolding (React 19 + Express + TypeScript)
- [x] **Phase 2**: PostgreSQL schema, Prisma ORM v7, database health checks
- [x] **Phase 3**: JWT authentication, bcrypt (12 rounds), session revocation, 26 tests
- [x] **Phase 4**: Frontend authentication integration, in-memory tokens, protected routes, Aurora visual system
- [x] **Phase 5**: Full-Stack Blog Post CRUD & Aurora Editorial Experience:
  - [x] Backend CRUD endpoints (`GET /posts`, `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id`)
  - [x] Server-side Zod validation and safe author queries (no leaked password hashes)
  - [x] Strict ownership authorization (403 Forbidden for non-authors on update and delete)
  - [x] 17 new Vitest integration tests (total 43 passing tests) with safe cleanup
  - [x] Frontend `postsApi` service integrated into centralized `apiClient`
  - [x] The Archive (`/essays`) with topic category filters
  - [x] Reading view (`/essays/:id`) with 18px body, line-height 1.85, and owner action buttons
  - [x] Composition desk (`/essays/new`) and Revision desk (`/essays/:id/edit`)
  - [x] Accessible `DeleteConfirmModal` with permanent deletion warning
  - [x] Live PostgreSQL posts integrated into `HomePage` and authored posts in `ProfilePage`
  - [x] Zero browser inspection rule respected; frontend build and oxlint 100% clean

---

## 🗺️ Roadmap

| Phase | Description                                    | Status      |
| ----- | ---------------------------------------------- | ----------- |
| 1     | Project initialization & scaffolding           | ✅ Done     |
| 2     | Database setup (PostgreSQL + Prisma)           | ✅ Done     |
| 3     | Authentication (JWT, bcrypt, session tracking) | ✅ Done     |
| 4     | Frontend Auth Integration (In-Memory RAM)      | ✅ Done     |
| 5     | Blog post CRUD & Aurora Editorial Experience   | ✅ Done     |
| 6     | Comments system                                | ⏳ Upcoming |
| 7     | User profiles & author directory               | ⏳ Upcoming |
| 8     | Search, pagination, markdown                   | ⏳ Upcoming |
| 9     | Photo upload & media management                | ⏳ Upcoming |
| 10    | Testing & Polish                               | ⏳ Upcoming |
| 11    | Deployment (Vercel, Railway, Supabase)         | ⏳ Upcoming |

---

## 📄 License

ISC
