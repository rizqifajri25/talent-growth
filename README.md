# Talent Growth Blog Platform

A full-stack blog application for sharing knowledge and growing together, built with modern web technologies.

## 🎯 Purpose

Talent Growth Blog Platform is a web application that enables users to create, read, and share blog posts. The platform aims to foster knowledge sharing and professional growth within a community.

## 🛠️ Tech Stack

| Layer       | Technology                                              | Status                  |
| ----------- | ------------------------------------------------------- | ----------------------- |
| Frontend    | React 19, TypeScript, Vite, React Router v7             | ✅ Integrated (Phase 4) |
| Backend     | Node.js, Express.js, TypeScript                         | ✅ Scaffolded (Phase 1) |
| Database    | PostgreSQL (local / Supabase)                           | ✅ Designed (Phase 2)   |
| ORM         | Prisma ORM (v7.10.0 + `@prisma/adapter-pg`)              | ✅ Configured (Phase 2) |
| Auth        | JWT (HS256) + bcrypt (12 rounds) + Zod + In-Memory Token| ✅ Integrated (Phase 4) |
| Testing     | Vitest, Supertest                                       | ✅ Passing 26/26 Tests  |
| HTTP Client | Axios (Centralized instance with Bearer interceptor)    | ✅ Implemented (Phase 4)|
| Deployment  | Vercel (Frontend), Railway (Backend), Supabase (DB)     | ⏳ Planned              |

## 📁 Project Structure

```
talent-growth/
├── frontend/                  # React + TypeScript + Vite application
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── api/               # Centralized API layer
│   │   │   ├── client.ts      # Axios instance, in-memory tokenStore, interceptors
│   │   │   └── auth.api.ts    # Typed auth service (register, login, logout, getMe)
│   │   ├── assets/            # Images, icons, media
│   │   ├── components/        # Reusable components
│   │   │   ├── auth/          # Authentication guards
│   │   │   │   └── ProtectedRoute.tsx # Route guard redirecting to /login
│   │   │   └── layout/        # Layout components
│   │   │       ├── AppLayout.tsx # Shell layout with Navbar and Footer
│   │   │       └── Navbar.tsx # Auth-aware navigation & mobile menu
│   │   ├── context/           # React context providers & hooks
│   │   │   ├── authContextDef.ts # Context definition (React Refresh safe)
│   │   │   ├── AuthContext.tsx   # AuthProvider managing authentication state
│   │   │   └── useAuth.ts        # Custom hook for consuming auth context
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.tsx   # Landing page with dynamic auth CTAs
│   │   │   ├── LoginPage.tsx  # Sign-in form with 401 & network error handling
│   │   │   ├── RegisterPage.tsx # Account creation with client & server validation
│   │   │   └── ProfilePage.tsx  # Protected profile with live /auth/me data
│   │   ├── types/             # TypeScript interfaces & types
│   │   │   └── auth.types.ts  # User, session, payload, and response types
│   │   ├── App.tsx            # Root router & provider configuration
│   │   ├── App.css            # Bespoke dark theme & responsive UI styles
│   │   ├── index.css          # Design tokens, variables & base styling
│   │   └── main.tsx           # React entry point
│   ├── .env.example           # Frontend environment template
│   ├── index.html             # HTML shell
│   ├── package.json           # Dependencies (axios, react-router-dom, react 19)
│   ├── tsconfig.json          # TypeScript configuration
│   └── vite.config.ts         # Vite build configuration
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
│   │   ├── generated/         # Generated Prisma Client
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
│   │   │   ├── auth.api.test.ts # API integration tests (16 tests)
│   │   │   └── auth.validators.test.ts # Validator unit tests (10 tests)
│   │   ├── app.ts             # Express app setup & CORS configuration
│   │   └── server.ts          # HTTP server entry point
│   ├── .env.example           # Backend environment template
│   ├── package.json           # Backend dependencies & scripts
│   ├── prisma.config.ts       # Prisma 7 central configuration file
│   └── tsconfig.json          # TypeScript configuration
├── docs/                      # Architectural & design documentation
│   └── database-erd.md        # Relational ERD & schema documentation
├── .editorconfig              # Editor formatting rules
├── .gitignore                 # Git ignore rules
└── README.md                  # Main documentation
```

## 📋 Prerequisites

- **Node.js** >= 18.x (tested with v25.7.0)
- **npm** >= 9.x (tested with v11.10.1)
- **Git** >= 2.x
- **PostgreSQL** >= 14.x (local instance or cloud Supabase project)

---

## 🔐 Frontend Authentication & Token Architecture (Phase 4)

### 1. In-Memory Token Security Model
- **Strict RAM-Only Storage**: Access tokens returned by the backend are stored exclusively in an in-memory module variable (`inMemoryAccessToken` in `frontend/src/api/client.ts`).
- **No Web Storage / No XSS Token Theft**: Tokens are **never** persisted to `localStorage`, `sessionStorage`, `IndexedDB`, or JavaScript-readable cookies. This neutralizes cross-site scripting (XSS) token extraction.
- **Page Reload Behavior**: Because tokens exist solely in RAM, refreshing the browser safely resets authentication state, requiring the user to sign in again. This is an intentional security design choice for Phase 4.
- **No Client JWT Decoding**: The frontend does not verify or decode JWT signatures locally. The backend remains the sole authoritative source of session validity.

### 2. Centralized Axios API Client
- **Base URL Configuration**: Configured with `import.meta.env.VITE_API_BASE_URL` (defaulting to `http://localhost:4000/api/v1`).
- **Bearer Token Request Interceptor**: Automatically attaches the `Authorization: Bearer <token>` header to outgoing HTTP requests whenever a token exists in memory.
- **Error Normalization (`extractApiError`)**: Parses field-level errors (e.g. Zod validation arrays), 401 unauthenticated errors, and network connectivity dropouts into user-friendly messages without exposing internal stack traces or secrets.

### 3. Application State & Provider (`AuthProvider`)
The application exposes authentication state and actions through the `useAuth()` hook:
- `user: User | null`: The currently authenticated user object (`id`, `name`, `email`, `avatarUrl`, `createdAt`).
- `isAuthenticated: boolean`: Boolean derived from the presence of both active user profile and valid memory token.
- `isLoading: boolean`: Loading state indicator during authentication transitions.
- `register(payload)`: Submits registration, caches token in memory, sets user state, and navigates to `/profile`.
- `login(payload)`: Authenticates credentials, caches token in memory, sets user state, and navigates to destination.
- `logout()`: Dispatches revocation request to `POST /api/v1/auth/logout`, clears token from memory, and resets auth state.
- `refreshUser()`: Queries `GET /api/v1/auth/me` to refresh the active profile using the bearer token.

### 4. Routing & Protected Routes (`ProtectedRoute`)
Using **React Router v7**:
- `/` — **Home Page**: Public landing page featuring responsive hero, dynamic action buttons based on auth state, and status cards.
- `/login` — **Login Page**: Sign-in form with real-time field validation, 401 credential error banner, and redirect preservation.
- `/register` — **Register Page**: Account creation with name, email, password, and password confirmation checks (enforcing 8 characters minimum and 72 bytes UTF-8 maximum).
- `/profile` — **Profile Page (Protected)**: Requires authentication. Automatically redirects unauthenticated visitors to `/login`. Fetches live account details directly from `GET /api/v1/auth/me` to verify backend Bearer token authorization.
- `*` — Wildcard redirect back to `/`.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd talent-growth
```

### 2. Set up environment variables

Copy the example environment files:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

In `backend/.env`, configure your PostgreSQL credentials and a secure `JWT_SECRET` (minimum 32 characters):
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:password@localhost:5432/talent_growth_dev?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/talent_growth_dev?schema=public"
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
JWT_ISSUER="talent-growth-api"
JWT_AUDIENCE="talent-growth-web"
JWT_ACCESS_TOKEN_TTL_SECONDS=900
```

### 3. Install dependencies

```bash
# Install frontend packages (React 19, React Router v7, Axios, Oxlint, Vite)
cd frontend
npm install

# Install backend packages (Express, Prisma, bcrypt, jsonwebtoken, Zod, Vitest)
cd ../backend
npm install
```

### 4. Database Setup & Migrations

```bash
cd backend

# Validate Prisma schema
npm run db:validate

# Generate Prisma Client
npm run db:generate

# Apply migrations to development database
npm run db:migrate:dev
```

### 5. Run the Applications

You can run both servers concurrently in separate terminal windows:

```bash
# Terminal 1 — Start Backend Server (runs on http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Start Frontend Application (runs on http://localhost:5173)
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## 🧪 Testing & Verification

### Backend Automated Tests (26 Passing)
Run the full backend test suite covering password hashing, Zod validators, token issuance, session tracking, and revocation:

```bash
cd backend
npm test
```

### Frontend Production Build & Linting
Validate TypeScript strict types, production bundling, and code quality:

```bash
cd frontend

# Run Oxlint (0 warnings, 0 errors)
npm run lint

# Compile and build Vite production bundle
npm run build
```

---

## 📡 Backend API Endpoints

### Health Endpoints
- `GET /api/v1/health` — Basic API health check
- `GET /api/v1/health/db` — PostgreSQL connection diagnostic check

### Authentication Endpoints
- `POST /api/v1/auth/register` — Create account, hash password with bcrypt (12 rounds), issue JWT session
- `POST /api/v1/auth/login` — Verify credentials, issue JWT session
- `POST /api/v1/auth/logout` — Revoke active database session (`revokedAt` timestamp updated)
- `GET /api/v1/auth/me` — Retrieve live user profile using `Authorization: Bearer <token>`

---

## 🎨 UI/UX & Design System

The frontend is styled using custom vanilla CSS design tokens (no bulky UI frameworks or generic templates):
- **Dark Theme Palette**: Deep slate background (`#0f172a`), refined cards (`#1e293b`), and indigo/cyan primary accents.
- **Anti-AI Slop Hierarchy**: Crisp typography, intentional spacing, subtle borders (`rgba(255, 255, 255, 0.08)`), and restrained micro-animations.
- **Accessible Forms**: Standard HTML5 semantic labels, clear focus indicators (`outline: 2px solid var(--color-primary-light)`), descriptive inline error messages, and `prefers-reduced-motion` compliance.
- **Honest Empty States**: Clean profile view indicating that published blog articles will appear in Phase 5 without fabricated database items.

---

## ✅ Current Status (Phase 4 Completed)

- [x] Phase 1: Project initialization & scaffolding (React, Express, TypeScript)
- [x] Phase 2: PostgreSQL relational schema, Prisma ORM v7, database health diagnostics
- [x] Phase 3: JWT authentication, bcrypt (12 rounds), session tracking, instant revocation, 26 backend tests
- [x] Phase 4: React frontend authentication integration:
  - [x] Centralized Axios client with in-memory Bearer token store
  - [x] `AuthProvider` & `useAuth` hook for centralized auth state management
  - [x] Public routes: `/` (Home), `/login` (Login), `/register` (Register)
  - [x] Protected routes: `/profile` with route guard (`ProtectedRoute`)
  - [x] Live profile verification via backend `GET /api/v1/auth/me`
  - [x] Logout integration calling `POST /api/v1/auth/logout` and clearing memory state
  - [x] Auth-aware dynamic Navbar with responsive mobile navigation
  - [x] Form validation (UTF-8 72-byte password limit, matching confirmation, required fields)
  - [x] Zero-storage security (0 bytes in `localStorage` / `sessionStorage`)
  - [x] Production build and Oxlint passing with 0 errors and 0 warnings

## 🗺️ Roadmap

| Phase | Description                                    | Status      |
| ----- | ---------------------------------------------- | ----------- |
| 1     | Project initialization & scaffolding           | ✅ Done     |
| 2     | Database setup (PostgreSQL + Prisma)           | ✅ Done     |
| 3     | Authentication (JWT, bcrypt, session tracking) | ✅ Done     |
| 4     | Frontend Auth Integration (UI, login, register)| ✅ Done     |
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
