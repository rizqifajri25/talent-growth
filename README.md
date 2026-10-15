# Talent Growth Blog Platform

A full-stack editorial blog platform for sharing knowledge and growing together, built with modern web technologies and the **Aurora** editorial design system.

## 🎯 Purpose

Talent Growth Blog Platform is a web publication and blogging platform enabling engineers, architects, and independent thinkers to compose, read, edit, and share essays. The platform prioritizes calm, high-signal reading, typographic excellence, and robust full-stack security.

## 🛠️ Tech Stack

| Layer       | Technology                                                  | Status                       |
| ----------- | ----------------------------------------------------------- | ---------------------------- |
| Frontend    | React 19, TypeScript, Vite, React Router v7                 | ✅ Integrated (Phase 4, 5, 6)|
| Design System| **Aurora** (Warm Porcelain, Instrument Serif, Minimalist)   | ✅ Permanent Standard        |
| Backend     | Node.js, Express.js, TypeScript                             | ✅ Production-ready          |
| Database    | PostgreSQL (Local `talent_growth_dev` / Supabase)            | ✅ Relational Schema         |
| ORM         | Prisma ORM (v7.10.0 + `@prisma/adapter-pg` driver)          | ✅ Configured & Migrated     |
| Auth        | JWT (HS256) + bcrypt (12 rounds) + Zod + In-Memory RAM Store | ✅ Tested & Verified         |
| Testing     | Vitest, Supertest                                           | ✅ **116/116 Tests Passing** (106 backend + 10 frontend) |
| Linter      | Oxlint (Fast Rust-based linting, 0 warnings, 0 errors)       | ✅ Enforced                  |
| Markdown    | react-markdown v10, remark-gfm v4, rehype-sanitize v6        | ✅ Safe Rendering & Sanitization |
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
│   │   │   ├── aurora-login.│   ├── src/
│   │   ├── api/               # Centralized API service layer
│   │   │   ├── client.ts      # Axios instance, in-memory tokenStore, extractApiError
│   │   │   ├── auth.api.ts    # Auth endpoints (register, login, logout, getMe, updateProfile)
│   │   │   ├── posts.api.ts   # Blog post CRUD service
│   │   │   ├── comments.api.ts# Threaded comments service (get, create, update, delete)
│   │   │   └── authors.api.ts # Author directory & public profiles service
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx # Route guard redirecting to /login
│   │   │   ├── comments/      # Aurora nested comments system
│   │   │   │   ├── CommentSection.tsx     # Thread feed, counter, auth prompt & composer
│   │   │   │   ├── CommentItem.tsx        # Recursive threaded item with inline edit & reply
│   │   │   │   └── CommentDeleteModal.tsx # Accessible soft-delete confirmation modal
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx      # Shell layout (Navbar, Outlet, Footer)
│   │   │   │   └── Navbar.tsx         # Aurora sticky header with Writers link & mobile drawer
│   │   │   └── posts/
│   │   │       ├── PostCard.tsx       # Editorial article card with category badge
│   │   │       └── DeleteConfirmModal.tsx # Accessible modal for post removal
│   │   ├── context/           # React context providers & hooks
│   │   │   ├── authContextDef.ts # Fast Refresh safe auth context definition
│   │   │   ├── AuthContext.tsx   # AuthProvider managing authentication state & user sync
│   │   │   └── useAuth.ts        # Custom hook for consuming auth context
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.tsx       # Split-hero with latest live PostgreSQL essays
│   │   │   ├── EssaysPage.tsx     # Full archive with category topic filters
│   │   │   ├── PostDetailPage.tsx # Editorial reading view with threaded comments section
│   │   │   ├── WritersPage.tsx    # Author directory of published contributors
│   │   │   ├── PublicAuthorPage.tsx # Public author profile with author bio and published essays
│   │   │   ├── NewPostPage.tsx    # Authoring desk for composing new essays
│   │   │   ├── EditPostPage.tsx   # Authoring desk for revising existing essays
│   │   │   ├── LoginPage.tsx      # Split-panel sign in with error handling
│   │   │   ├── RegisterPage.tsx   # Split-panel registration with UTF-8 limits
│   │   │   └── ProfilePage.tsx    # Author workspace with profile editor (name, bio) & essay manager
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── auth.types.ts      # User (with bio), session, update payload, and response types
│   │   │   ├── posts.types.ts     # Post, Author, CRUD payloads, API wrappers
│   │   │   ├── comments.types.ts  # Comment, CommentAuthor, payloads, API wrappers
│   │   │   └── authors.types.ts   # AuthorSummary, PublicAuthorProfile, AuthorPost
│   │   ├── App.tsx            # Root router & protected route configuration
│   │   ├── App.css            # Aurora editorial styling & responsive rules
│   │   ├── index.css          # Aurora design tokens & base typography
│   │   └── main.tsx           # React entry point
│   ├── index.html             # HTML shell loading Google Fonts
│   └── package.json           # Frontend dependencies & scripts
├── backend/                   # Node.js + Express.js API server
│   ├── prisma/
│   │   ├── migrations/        # Version-controlled SQL migrations
│   │   │   ├── 20261014120000_init/
│   │   │   │   └── migration.sql # Initial schema (User, Post, Comment, AuthSession)
│   │   │   ├── 20261014232133_add_nested_comments_and_soft_delete/
│   │   │   │   └── migration.sql # Self-referencing parent_id & deleted_at fields
│   │   │   └── 20261015011234_add_user_bio/
│   │   │       └── migration.sql # Safe optional bio column on User model
│   │   └── schema.prisma      # Prisma schema definition with bio field
│   ├── src/
│   │   ├── config/            # Server & database configurations
│   │   │   ├── auth.ts        # Centralized JWT config
│   │   │   └── prisma.ts      # Singleton Prisma Client instance
│   │   ├── controllers/       # HTTP controllers
│   │   │   ├── auth.controller.ts     # Register, login, logout, getMe, updateMe
│   │   │   ├── posts.controller.ts    # Blog post CRUD controllers
│   │   │   ├── comments.controller.ts # Nested comments & mutation controllers
│   │   │   └── authors.controller.ts  # Author directory & public profile controllers
│   │   ├── generated/         # Generated Prisma Client
│   │   ├── middleware/        # Express middleware
│   │   │   └── requireAuth.ts # Bearer token & active database session verification
│   │   ├── routes/            # Route declarations
│   │   │   ├── auth.routes.ts     # /api/v1/auth routes (including PATCH /me)
│   │   │   ├── posts.routes.ts    # /api/v1/posts routes
│   │   │   ├── comments.routes.ts # /api/v1/posts/:id/comments & /comments/:id
│   │   │   ├── authors.routes.ts  # /api/v1/authors routes
│   │   │   └── health.routes.ts   # Health & diagnostic checks
│   │   ├── services/          # Business logic layer
│   │   │   ├── auth.service.ts     # Password hashing, JWT sessions, profile updates
│   │   │   ├── posts.service.ts    # Post queries, safe author selects, ownership enforcement
│   │   │   ├── comments.service.ts # Tree builder, parent validation, soft-delete policy
│   │   │   └── authors.service.ts  # Published author aggregation, public profile projection
│   │   ├── validators/        # Zod request validators
│   │   │   ├── auth.validators.ts     # Input validation & normalization
│   │   │   ├── posts.validators.ts    # UUID, title, content, category validation
│   │   │   ├── comments.validators.ts # UUID, content (1-5000), parentId validation
│   │   │   └── profile.validators.ts  # Author UUID and profile update (name, bio) validation
│   │   ├── __tests__/         # Automated test suites
│   │   │   ├── auth.validators.test.ts # 10 unit tests
│   │   │   ├── auth.api.test.ts        # 16 integration tests
│   │   │   ├── posts.api.test.ts       # 17 CRUD integration tests
│   │   │   ├── comments.api.test.ts    # 22 threaded comments integration tests
│   │   │   └── authors.api.test.ts     # 22 author directory & profile integration tests
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

### 1. Author Directory & Public Profiles (`/api/v1/authors`)

| Method | Endpoint | Access | Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/authors` | **Public** | `q`, `page` (default 1), `limit` (default 12, max 48) | Searches and paginates published authors (`postCount >= 1`) by name or bio (case-insensitive, trimmed). Sorted alphabetically. Sensitive fields (email, passwordHash, sessions) excluded. |
| `GET` | `/api/v1/authors/:id` | **Public** | `postsPage` (default 1), `postsLimit` (default 6, max 24) | Retrieves public author profile with biography, total `postCount`, and paginated published essays sorted newest first. |

#### Design Decision — Published Contributor Directory:
- `GET /api/v1/authors` filters by `posts: { some: {} }`. Registered users without any published essays do not clutter the public contributor directory.
- `GET /api/v1/authors/:id` remains accessible for any registered user ID, returning `postCount: 0` and an empty array (`posts: []`) with an Aurora empty state.
- **Search & Pagination**: Parameter `q` searches both author `name` and `bio` (case-insensitive substring). Email is strictly excluded from search to prevent enumeration. Responses include pagination metadata (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPreviousPage`).

#### Sensitive Data Security:
- Author profiles strictly expose `{ id, name, bio, avatarUrl, joinedAt, postCount, posts, postsPagination }`.
- User emails, password hashes, and session data are **never exposed** in directory or public profile responses.

```json
// Example GET /api/v1/authors?q=engineer&page=1&limit=12 Response
{
  "success": true,
  "message": "Authors retrieved successfully",
  "data": {
    "authors": [
      {
        "id": "8e98a9a1-c121-4300-bb26-6ce0f0f564e9",
        "name": "beliau",
        "bio": "Senior distributed systems engineer.",
        "avatarUrl": null,
        "joinedAt": "2026-10-14T22:44:49.236Z",
        "postCount": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

### 2. Profile Management Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | **Protected** | Retrieves current authenticated user profile including `bio`. |
| `PATCH` | `/api/v1/auth/me` | **Protected** | Updates current authenticated user's `name` and/or `bio`. Disallowed fields are rejected. |
| `POST` | `/api/v1/auth/register` | Public | Registers new author with bcrypt (12 rounds) and creates active database session. |
| `POST` | `/api/v1/auth/login` | Public | Verifies credentials and issues JWT token with database session tracking. |
| `POST` | `/api/v1/auth/logout` | **Protected** | Instantly revokes session in PostgreSQL (`revokedAt = NOW()`). |

#### Profile Update Validation Rules (Zod):
- Identity strictly derived from JWT token context (`req.auth.userId`). No user ID is accepted in URL or request body.
- `name`: Optional string, trimmed, 1–80 characters. Cannot be empty string.
- `bio`: Optional string, maximum 500 characters. Empty or whitespace-only values are automatically normalized to `null`.
- At least one updateable field (`name` or `bio`) must be provided.
- Disallowed fields (`id`, `email`, `passwordHash`, `avatarUrl`, `createdAt`, etc.) are ignored and never written to the database.

---

### 3. Blog Post CRUD, Search & Pagination Endpoints (`/api/v1/posts`)

| Method | Endpoint | Access | Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/posts` | **Public** | `q`, `category`, `page` (default 1), `limit` (default 9, max 50) | Retrieves paginated posts sorted newest first (`createdAt: 'desc', id: 'desc'`) with safe author info. Supports full-text title and content search combined with category filter. |
| `GET` | `/api/v1/posts/:id` | **Public** | None | Retrieves full post details by UUID. Returns 404 if not found, 400 if invalid UUID. |
| `POST` | `/api/v1/posts` | **Protected** | None | Creates new post. `authorId` is strictly assigned from verified JWT token context. Content supports Markdown. |
| `PUT` | `/api/v1/posts/:id` | **Protected** | None | Updates post. Enforces ownership: returns 403 Forbidden if current user is not author. |
| `DELETE` | `/api/v1/posts/:id` | **Protected** | None | Deletes post. Enforces ownership: returns 403 Forbidden if current user is not author. |

#### Search & Pagination Architecture:
- **Search Parameter (`q`)**: Case-insensitive substring search matching both `title` and `content` columns. Whitespace is automatically trimmed. Max length: 100 characters (exceeding length returns HTTP 400).
- **Category Filter (`category`)**: Exact category matching. Works seamlessly in conjunction with `q` search.
- **Deterministic Ordering**: `createdAt DESC, id DESC` tie-breaker ensures stable pagination without page drift.
- **Pagination Envelope**: Every list response includes `{ posts: [...], pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage } }`.
- **Out of Range Handling**: Requesting a page beyond `totalPages` returns an empty array `posts: []` with accurate metadata, enabling clean empty states.

```json
// Example GET /api/v1/posts?q=system&category=Architecture&page=1&limit=9 Response
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "3c8466e3-5494-4366-9df9-bb225881a7fc",
        "title": "Scalable Microservice Architecture",
        "excerpt": "A deep dive into distributed event streaming...",
        "content": "## Core Tenets\n\nEvent streaming provides decoupled consistency...",
        "category": "Architecture",
        "createdAt": "2026-10-15T01:30:00.000Z",
        "updatedAt": "2026-10-15T01:30:00.000Z",
        "author": {
          "id": "8e98a9a1-c121-4300-bb26-6ce0f0f564e9",
          "name": "beliau",
          "avatarUrl": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 9,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

### 4. Markdown Authoring & Safe Content Rendering

Talent Growth Phase 8 introduces native Markdown authoring with real-time preview and safe rendering.

#### Features:
- **Write / Preview Tabs**: Toggle between raw Markdown source authoring and sanitized editorial preview.
- **Lightweight Formatting Toolbar**: One-click insertions for Heading 2 (`## `), Heading 3 (`### `), Bold (`**text**`), Italic (`*text*`), Blockquote (`> `), Unordered List (`- `), Ordered List (`1. `), Inline Code (`` `code` ``), Code Block (```` ```\ncode\n``` ````), and GFM Table.
- **Cursor-Aware Syntax Insertion**: Toolbar actions preserve existing text, wrap selected text, or place cursor inside syntax boundaries.
- **Live Character Counter**: Tracks character usage against the 50,000-character backend limit.
- **Zero Database Schema Changes**: Markdown source is stored directly as plain text in `Post.content`. Existing plain-text articles render seamlessly.

#### Security Model & XSS Mitigation:
1. **No Raw HTML Execution**: Arbitrary HTML tags (e.g., `<script>`, `<iframe onload=...>`, `<img onerror=...>`) are completely neutralized via `rehype-sanitize`.
2. **No `dangerouslySetInnerHTML`**: All rendering uses React virtual DOM node trees created by `react-markdown`.
3. **Dangerous Protocol Neutralization**: Links with `javascript:`, `vbscript:`, or `data:` URLs are sanitized and disarmed.
4. **Safe External Navigation**: All rendered hyperlinks automatically include `target="_blank"` and `rel="noopener noreferrer"`.
5. **No Untrusted Remote Tracking Images**: Remote Markdown images are transformed into an Aurora badge placeholder (`[Image: alt]`), preventing arbitrary cross-site network tracking until Phase 9 introduces verified media uploads.

---

### 5. Nested Comments Endpoints (`/api/v1/posts/:id/comments` & `/api/v1/comments/:id`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/posts/:id/comments` | **Public** | Retrieves threaded nested comments tree for an essay, sorted earliest first (`createdAt: 'asc'`). |
| `POST` | `/api/v1/posts/:id/comments` | **Protected** | Creates a top-level comment or nested reply. Identity strictly derived from JWT token (`req.auth.userId`). |
| `PUT` | `/api/v1/comments/:id` | **Protected** | Updates comment content. Author ownership strictly enforced (403 if not owner). Cannot edit soft-deleted comments. |
| `DELETE` | `/api/v1/comments/:id` | **Protected** | Deletes comment. Preserves tree via soft delete if replies exist; hard-deletes if leaf. |

---

### 5. Diagnostic Endpoints (`/api/v1/health`)
- `GET /api/v1/health` — Basic API health check
- `GET /api/v1/health/db` — PostgreSQL connection and latency check

---

## 💻 Frontend Routes & Navigation

| Route | Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Split-hero with recent essays fetched from PostgreSQL, reading CTAs. |
| `/essays` | `EssaysPage` | Public | The Archive: complete list of essays with topic category filter pills. |
| `/essays/:id` | `PostDetailPage` | Public | Reading view with full article, author controls, and Aurora threaded comments conversation. |
| `/writers` | `WritersPage` | Public | The Writers: directory of published contributors with bio, essay count, and profile links. |
| `/writers/:id` | `PublicAuthorPage`| Public | Public author profile showing biography, join date, metrics, and published essay catalog. |
| `/essays/new` | `NewPostPage` | **Protected** | Editorial desk for composing and publishing essays with client validation. |
| `/essays/:id/edit` | `EditPostPage` | **Protected** | Editorial desk for revising essays. Verifies ownership; non-owners get 403 card. |
| `/profile` | `ProfilePage` | **Protected** | Author workspace with live profile management (name, bio counter), read-only email, and essay manager. |
| `/login` | `LoginPage` | Public (Guest) | Split-panel login with error banners and redirect back to current essay. |
| `/register` | `RegisterPage` | Public (Guest) | Split-panel registration with UTF-8 byte validation. |
| `*` | `Navigate` | Public | Wildcard redirect to `/`. |

---

## 🧪 Testing & Verification

### Full Automated Test Suite (116 Passing Tests)
Run all unit, integration, and security tests across backend (106 tests) and frontend (10 tests):

```bash
# Backend test suite (106 passing tests across 6 suites)
cd backend
npm test

# Frontend test suite (10 passing tests via Vitest & jsdom)
cd frontend
npm test
```

Test coverage includes:
- `search.pagination.test.ts` (19 tests): Article search by title, article search by content, case-insensitive normalization, whitespace trimming, combined search and category filtering, deterministic sorting (`createdAt DESC, id DESC`), pagination defaults (`page=1, limit=9`), pagination boundaries and rejection of invalid/negative/decimal/exceeding limits, empty state pagination consistency, author directory search by name/bio with email isolation, author directory pagination, and public author profile essay pagination (`postsPage`, `postsLimit`) with total `postCount` preservation.
- `authors.api.test.ts` (22 tests): Public directory access, contributor postCount filtering, name sorting, bio display, email/passwordHash privacy protection, public profile by ID, newest-first essay ordering, 0-post user empty state, invalid UUID (400), user not found (404), profile update (`PATCH /api/v1/auth/me`), name validation (1-80 chars), bio length (500 chars), whitespace normalization to `null`, rejection of empty update body, forbidden field protection (`email`, `id`, `avatarUrl`), 401 unauthenticated check, revoked session rejection, database persistence, and isolated test cleanup.
- `comments.api.test.ts` (22 tests): Threaded comments tree, parentId validation, cross-post rejection, leaf hard-delete, parent soft-delete.
- `posts.api.test.ts` (17 tests): Public reads, safe author filtering, creation with token identity, ownership enforcement for edit/delete, 403 for unauthorized users, 404 for missing records.
- `auth.api.test.ts` (16 tests): Registration, login, duplicate email rejection, session revocation, live db check.
- `auth.validators.test.ts` (10 tests): UTF-8 72-byte passwords, email normalization, required fields.
- `markdown.security.test.tsx` (10 frontend tests): Sanitization of `<script>` tags, stripping of dangerous inline event handlers (`onload`, `onerror`), disarming malicious URL schemes (`javascript:`), secure external link handling (`target="_blank"` with `rel="noopener noreferrer"`), remote image neutralization with pill badge indicator, rendering standard Markdown (headings, bold, italic, blockquote, lists, inline code, code blocks, and GFM tables), and safe plain-text backward compatibility.

### Frontend Quality & Typecheck
Verify strict TypeScript compilation and linting:

```bash
cd frontend

# Oxlint (0 warnings, 0 errors)
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

## ✅ Current Status (Phase 8 Completed)

- [x] **Phase 1**: Full-stack scaffolding (React 19 + Express + TypeScript)
- [x] **Phase 2**: PostgreSQL schema, Prisma ORM v7, database health checks
- [x] **Phase 3**: JWT authentication, bcrypt (12 rounds), session tracking, 26 tests
- [x] **Phase 4**: Frontend authentication integration, in-memory tokens, protected routes, Aurora visual system
- [x] **Phase 5**: Full-Stack Blog Post CRUD & Aurora Editorial Experience (17 tests)
- [x] **Phase 6**: Nested Comments System, Replies, Ownership Authorization & Aurora UI (22 tests)
- [x] **Phase 7**: Author Directory, Public Author Profiles & Profile Management (22 tests)
- [x] **Phase 8**: Search, Pagination, Markdown Editor & Safe Content Rendering:
  - [x] Full-stack article search by title & content (case-insensitive, trimmed, combining with category filter, deterministic `createdAt DESC, id DESC`).
  - [x] Article pagination on `/essays` with Aurora pagination controls, metadata counters, and out-of-range empty states.
  - [x] Author directory search (`q` matching name/bio, excluding email) and pagination on `/writers`.
  - [x] Public author profile article pagination (`postsPage`, `postsLimit`) on `/writers/:id` while preserving total `postCount`.
  - [x] Markdown editor with Write and Preview modes, character counter, and cursor-aware formatting toolbar on New Post (`/essays/new`) and Edit Post (`/essays/:id/edit`).
  - [x] Safe Markdown rendering on Post Detail (`/essays/:id`) and editor preview via `react-markdown`, `remark-gfm`, and `rehype-sanitize`.
  - [x] Strict XSS mitigation (no raw HTML, neutralization of `<script>` / event handlers, disarming of `javascript:` URLs, safe external links, and remote image badges).
  - [x] Bidirectional URL query synchronization (`/essays?q=...&category=...&page=...`, `/writers?q=...&page=...`, `/writers/:id?postsPage=...`).
  - [x] 19 new backend integration tests + 10 frontend security/rendering tests (**116/116 total passing automated tests**).
  - [x] Aurora design system visual continuity with 0 browser inspection rules respected.

---

## 🗺️ Roadmap

| Phase | Description                                     | Status      |
| ----- | ----------------------------------------------- | ----------- |
| 1     | Project initialization & scaffolding            | ✅ Done     |
| 2     | Database setup (PostgreSQL + Prisma)            | ✅ Done     |
| 3     | Authentication (JWT, bcrypt, session tracking)  | ✅ Done     |
| 4     | Frontend Auth Integration (In-Memory RAM)       | ✅ Done     |
| 5     | Blog post CRUD & Aurora Editorial Experience    | ✅ Done     |
| 6     | Nested Comments System & Threaded Conversation  | ✅ Done     |
| 7     | Author Directory, Public Profiles & Profile Mgmt| ✅ Done     |
| 8     | Search, pagination, markdown & safe rendering   | ✅ Done     |
| 9     | Photo upload & media management                 | ⏳ Upcoming |
| 10    | Testing & Polish                                | ⏳ Upcoming |
| 11    | Deployment (Vercel, Railway, Supabase)          | ⏳ Upcoming |

---

## 📄 License

ISC

