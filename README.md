# Talent Growth Blog Platform

> **🚀 Live Production Website**: [https://talent-growth-one.vercel.app/](https://talent-growth-one.vercel.app/)  
> **📡 Production Backend API**: [https://talent-growth.onrender.com](https://talent-growth.onrender.com)  
> **🗄️ Cloud Infrastructure**: Vercel (Frontend) + Render (Backend) + Supabase (PostgreSQL & Media Storage)

A full-stack editorial blog platform for sharing knowledge and growing together, built with modern web technologies and the **Aurora** editorial design system.

## 🎯 Purpose

Talent Growth Blog Platform is a web publication and blogging platform enabling engineers, architects, and independent thinkers to compose, read, edit, and share essays. The platform prioritizes calm, high-signal reading, typographic excellence, and robust full-stack security.

## 🛠️ Tech Stack

| Layer       | Technology                                                  | Status                       |
| ----------- | ----------------------------------------------------------- | ---------------------------- |
| Frontend    | React 19, TypeScript, Vite, React Router v7                 | ✅ Integrated (Phase 4, 5, 6, 7, 8, 9, 10)|
| Design System| **Aurora** (Warm Porcelain, Instrument Serif, Minimalist)   | ✅ Permanent Standard        |
| Backend     | Node.js, Express.js, TypeScript                             | ✅ Production-ready          |
| Database    | PostgreSQL (Local `talent_growth_dev` / Supabase Cloud)      | ✅ Relational Schema         |
| ORM         | Prisma ORM (v7.10.0 + `@prisma/adapter-pg` driver)          | ✅ Configured & Migrated     |
| Auth        | JWT (HS256) + bcrypt (12 rounds) + Zod + In-Memory RAM Store | ✅ Tested & Verified         |
| Storage     | Supabase Storage (`avatars`, `post-covers`) + sharp WebP     | ✅ Media Processing Pipeline |
| Testing     | Vitest, Supertest                                           | ✅ **145/145 Tests Passing** (132 backend + 13 frontend) |
| Linter      | Oxlint (Fast Rust-based linting, 0 warnings, 0 errors)       | ✅ Enforced                  |
| Markdown    | react-markdown v10, remark-gfm v4, rehype-sanitize v6        | ✅ Safe Rendering & Sanitization |
| HTTP Client | Axios (Centralized instance with Bearer interceptor)        | ✅ Implemented               |
| Code Split  | React.lazy & Suspense with Aurora fallback                  | ✅ Route-level chunks        |
| Deployment  | Vercel (Frontend), Render (Backend), Supabase (DB & Storage)| ✅ **Live in Production**    |

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
│   │   │   ├── authors.api.ts # Author directory & public profiles service
│   │   │   └── topics.api.ts  # Topics taxonomy & category counts service
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx # Route guard redirecting to /login
│   │   │   ├── comments/      # Aurora nested comments system
│   │   │   │   ├── CommentSection.tsx     # Thread feed, counter, auth prompt & composer
│   │   │   │   ├── CommentItem.tsx        # Recursive threaded item with inline edit & reply
│   │   │   │   └── CommentDeleteModal.tsx # Accessible soft-delete confirmation modal
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx      # Shell layout with Suspense fallback
│   │   │   │   └── Navbar.tsx         # Aurora sticky header with active Topics & Writers links
│   │   │   └── posts/
│   │   │       ├── PostCard.tsx       # Editorial article card with category badge
│   │   │       └── DeleteConfirmModal.tsx # Accessible modal for post removal
│   │   ├── context/           # React context providers & hooks
│   │   │   ├── authContextDef.ts # Fast Refresh safe auth context definition
│   │   │   ├── AuthContext.tsx   # AuthProvider managing authentication state & user sync
│   │   │   └── useAuth.ts        # Custom hook for consuming auth context
│   │   ├── pages/             # Page components (Lazy-loaded via React.lazy)
│   │   │   ├── HomePage.tsx       # Split-hero with latest live PostgreSQL essays
│   │   │   ├── EssaysPage.tsx     # Full archive with category topic filters
│   │   │   ├── TopicsPage.tsx     # Editorial topics taxonomy derived from database categories
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
│   │   │   ├── authors.types.ts   # AuthorSummary, PublicAuthorProfile, AuthorPost
│   │   │   └── topics.types.ts    # TopicItem and TopicsApiResponse
│   │   ├── utils/
│   │   │   └── useDocumentTitle.ts # SPA document title and meta description hook
│   │   ├── App.tsx            # Root router with route-level React.lazy code splitting
│   │   ├── App.css            # Aurora editorial styling, accessibility & responsive rules
│   │   ├── index.css          # Aurora design tokens & base typography
│   │   └── main.tsx           # React entry point
│   ├── index.html             # HTML shell loading Google Fonts & SEO metadata
│   └── package.json           # Frontend dependencies & scripts
├── backend/                   # Node.js + Express.js API server
│   ├── prisma/
│   │   ├── migrations/        # Version-controlled SQL migrations
│   │   │   ├── 20261014120000_init/
│   │   │   │   └── migration.sql # Initial schema (User, Post, Comment, AuthSession)
│   │   │   ├── 20261014232133_add_nested_comments_and_soft_delete/
│   │   │   │   └── migration.sql # Self-referencing parent_id & deleted_at fields
│   │   │   ├── 20261015011234_add_user_bio/
│   │   │   │   └── migration.sql # Safe optional bio column on User model
│   │   │   └── 20261015034626_add_post_cover_image/
│   │   │       └── migration.sql # Add cover_image_url and cover_image_alt to Post
│   │   └── schema.prisma      # Prisma schema definition with cover fields
│   ├── src/
│   │   ├── config/            # Server & database configurations
│   │   │   ├── auth.ts        # Centralized JWT config
│   │   │   ├── prisma.ts      # Singleton Prisma Client instance
│   │   │   └── storage.config.ts # Supabase Storage URL, keys & buckets loader
│   │   ├── controllers/       # HTTP controllers
│   │   │   ├── auth.controller.ts     # Register, login, logout, getMe, updateMe, avatar upload/delete
│   │   │   ├── posts.controller.ts    # Blog post CRUD & cover upload/delete controllers
│   │   │   ├── comments.controller.ts # Nested comments & mutation controllers
│   │   │   ├── authors.controller.ts  # Author directory & public profile controllers
│   │   │   └── topics.controller.ts   # Topic taxonomy controller
│   │   ├── generated/         # Generated Prisma Client
│   │   ├── middleware/        # Express middleware
│   │   │   ├── requireAuth.ts # Bearer token & active database session verification
│   │   │   └── upload.middleware.ts # Multer memory storage (5MB avatar, 8MB cover limits)
│   │   ├── routes/            # Route declarations
│   │   │   ├── auth.routes.ts     # /api/v1/auth routes (including avatar upload/delete)
│   │   │   ├── posts.routes.ts    # /api/v1/posts routes (including cover upload/delete)
│   │   │   ├── comments.routes.ts # /api/v1/posts/:id/comments & /comments/:id
│   │   │   ├── authors.routes.ts  # /api/v1/authors routes
│   │   │   ├── topics.routes.ts   # /api/v1/topics taxonomy routes
│   │   │   └── health.routes.ts   # Health & diagnostic checks
│   │   ├── services/          # Business logic layer
│   │   │   ├── auth.service.ts     # Password hashing, JWT sessions, profile & avatar lifecycle
│   │   │   ├── posts.service.ts    # Post queries, ownership enforcement, cover lifecycle & cleanup
│   │   │   ├── comments.service.ts # Tree builder, parent validation, soft-delete policy
│   │   │   ├── authors.service.ts  # Published author aggregation, public profile projection
│   │   │   ├── topics.service.ts   # Post category grouping, trimming & alphabetical ordering
│   │   │   ├── image-processor.service.ts # Sharp decoding, orientation, WebP conversion & bomb protection
│   │   │   └── media-storage.service.ts   # Supabase Storage client, path extraction, mock injection
│   │   ├── validators/        # Zod request validators
│   │   │   ├── auth.validators.ts     # Input validation & normalization
│   │   │   ├── posts.validators.ts    # UUID, title, content, category, cover altText validation
│   │   │   ├── comments.validators.ts # UUID, content (1-5000), parentId validation
│   │   │   └── profile.validators.ts  # Author UUID and profile update (name, bio) validation
│   │   ├── __tests__/         # Automated test suites
│   │   │   ├── auth.validators.test.ts # 10 unit tests
│   │   │   ├── auth.api.test.ts        # 16 integration tests
│   │   │   ├── posts.api.test.ts       # 17 CRUD integration tests
│   │   │   ├── comments.api.test.ts    # 22 threaded comments integration tests
│   │   │   ├── authors.api.test.ts     # 22 author directory & profile integration tests
│   │   │   ├── search.pagination.test.ts # 19 search & pagination tests
│   │   │   ├── media.storage.test.ts   # 23 media processing, upload & storage tests
│   │   │   └── topics.api.test.ts      # 3 topics taxonomy integration tests
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

### 2. Profile & Avatar Management Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Content-Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | **Protected** | `application/json` | Retrieves current authenticated user profile including `bio` and `avatarUrl`. |
| `PATCH` | `/api/v1/auth/me` | **Protected** | `application/json` | Updates current authenticated user's `name` and/or `bio`. Disallowed fields are rejected. |
| `POST` | `/api/v1/auth/me/avatar` | **Protected** | `multipart/form-data` | Uploads author avatar image (`avatar` field, max 5MB, JPEG/PNG/WebP). Re-encodes to 512x512 WebP, updates `User.avatarUrl`, and cleans up old object. |
| `DELETE` | `/api/v1/auth/me/avatar` | **Protected** | None | Deletes author avatar from Supabase Storage and sets `avatarUrl: null`, safely returning to monogram fallback. |
| `POST` | `/api/v1/auth/register` | Public | `application/json` | Registers new author with bcrypt (12 rounds) and creates active database session. |
| `POST` | `/api/v1/auth/login` | Public | `application/json` | Verifies credentials and issues JWT token with database session tracking. |
| `POST` | `/api/v1/auth/logout` | **Protected** | None | Instantly revokes session in PostgreSQL (`revokedAt = NOW()`). |

#### Profile Update Validation Rules (Zod):
- Identity strictly derived from JWT token context (`req.auth.userId`). No user ID is accepted in URL or request body.
- `name`: Optional string, trimmed, 1–80 characters. Cannot be empty string.
- `bio`: Optional string, maximum 500 characters. Empty or whitespace-only values are automatically normalized to `null`.
- At least one updateable field (`name` or `bio`) must be provided.
- Disallowed fields (`id`, `email`, `passwordHash`, `avatarUrl`, `createdAt`, etc.) are ignored and never written to the database.

---

### 3. Blog Post CRUD, Search, Pagination & Cover Endpoints (`/api/v1/posts`)

| Method | Endpoint | Access | Query / Form Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/posts` | **Public** | `q`, `category`, `page` (default 1), `limit` (default 9, max 50) | Retrieves paginated posts sorted newest first (`createdAt: 'desc', id: 'desc'`) with safe author info and cover image metadata. |
| `GET` | `/api/v1/posts/:id` | **Public** | None | Retrieves full post details by UUID including `coverImageUrl` and `coverImageAlt`. Returns 404 if not found, 400 if invalid UUID. |
| `POST` | `/api/v1/posts` | **Protected** | JSON body | Creates new post. `authorId` is strictly assigned from verified JWT token context. Content supports Markdown. |
| `PUT` | `/api/v1/posts/:id` | **Protected** | JSON body | Updates post. Enforces ownership: returns 403 Forbidden if current user is not author. |
| `DELETE` | `/api/v1/posts/:id` | **Protected** | None | Deletes post and best-effort cleans up associated cover image from storage. Enforces ownership (403). |
| `POST` | `/api/v1/posts/:id/cover` | **Protected** | `cover` (file, max 8MB), `altText` (max 160 chars) | Uploads editorial article cover image. Enforces post ownership (403). Re-encodes to max 2400x1600 WebP, updates `coverImageUrl` and `coverImageAlt`, and cleans up previous cover object. |
| `DELETE` | `/api/v1/posts/:id/cover` | **Protected** | None | Deletes article cover from storage and sets `coverImageUrl: null`, `coverImageAlt: null`. Enforces post ownership (403). |

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

### 6. Media Upload, Image Processing & Supabase Storage Integration (Phase 9)

Talent Growth Phase 9 implements full-stack media management for author profile avatars and editorial article cover images, backed by **Supabase Storage** and high-performance server-side image processing with `sharp`.

#### Architecture Overview:
- **Backend as Secure Media Broker**: Files are uploaded through Express backend middleware (`multer` with memory storage). The client never communicates directly with storage credentials.
- **Image Processing Pipeline (`sharp`)**:
  - Validates buffer decoding and format against raster types (`image/jpeg`, `image/png`, `image/webp`). Non-raster files (SVG, HTML, PDF, executables, animated GIFs) are strictly rejected with HTTP 400.
  - Decompression bomb guard: Files with dimensions exceeding 40 Megapixels (`width * height > 40,000,000`) are rejected immediately.
  - Auto-rotates orientation according to EXIF tags.
  - Strips all sensitive metadata (GPS, EXIF, camera serials).
  - Normalizes and re-encodes to high-quality **WebP** (`image/webp`).
  - **Avatars**: Cropped to square and scaled to a maximum of 512 × 512 pixels.
  - **Covers**: Scaled proportionally with aspect ratio preserved to a maximum of 2400 × 1600 pixels.
- **Supabase Storage Buckets**:
  - `avatars`: Public read model for user profile avatars. Organized as `${userId}/${uuid}.webp`.
  - `post-covers`: Public read model for editorial essay covers. Organized as `${userId}/${postId}/${uuid}.webp`.
  - Public Read Rationale: Avatars and article covers are displayed on public pages (Home, Essays, Post Detail, Writers). Upload and deletion operations remain strictly authenticated and authorized on the backend.
- **Security & Data Safety**:
  - Object paths are strictly server-generated using UUIDs to prevent user filename manipulation or path traversal attacks.
  - Ownership authorization: Only the post's authenticated author can upload or delete its cover (returns 403 Forbidden otherwise). Avatar uploads strictly bind to `req.auth.userId`.
  - Storage abstraction (`media-storage.service.ts`): Allows dependency injection and deterministic in-memory mock testing without calling remote cloud storage or requiring live credentials.
  - Partial failure handling & Compensating Cleanup: If the PostgreSQL update fails after an object is uploaded, the newly uploaded storage object is automatically deleted to prevent orphan files. When an image is replaced or deleted, the previous storage object is cleaned up asynchronously.
  - Database schema integrity: Images are never stored as Base64 strings or binary BLOBS in PostgreSQL. Only clean, validated public URLs are stored in `User.avatarUrl`, `Post.coverImageUrl`, and `Post.coverImageAlt`.
  - Legacy Compatibility: Articles and authors without images render Aurora editorial monogram fallbacks seamlessly without layout shift or broken image placeholders.

#### Supabase Storage Manual Setup Guide:
To configure Supabase Storage for remote production or local cloud testing:
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard) and select or create your project.
2. Navigate to **Storage** from the left navigation menu.
3. Click **New Bucket** and create the avatars bucket:
   - Name: `avatars`
   - Public Bucket: **Enabled (Checked)** (allows public URL reads for avatars)
   - Max file size limit: `5MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Click **New Bucket** and create the post covers bucket:
   - Name: `post-covers`
   - Public Bucket: **Enabled (Checked)** (allows public URL reads for editorial covers)
   - Max file size limit: `8MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
5. Retrieve your project credentials from **Project Settings** > **API**:
   - **Project URL**: Found under Configuration.
   - **Service Role Secret Key**: Found under Project API Keys (must be kept secret on the server; never expose with `VITE_` or frontend bundles).
6. Populate `backend/.env`:
   ```env
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SECRET_KEY="your-supabase-secret-key"
   SUPABASE_AVATARS_BUCKET="avatars"
   SUPABASE_COVERS_BUCKET="post-covers"
   ```
7. If storage credentials are not provided or configured, the backend continues to operate all core services (auth, articles, comments, authors) and returns a clean, safe HTTP 503 response on upload endpoints without application crashing.

---

### 7. Topics Taxonomy Endpoints (`/api/v1/topics`)

| Method | Endpoint | Access | Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/topics` | **Public** | None | Returns distinct non-empty categories derived from live PostgreSQL articles with accurate `postCount`, sorted alphabetically. Null/empty categories excluded. |

#### Topics Data Rationale:
- **Zero Schema Changes**: Categories are aggregated directly from the existing `Post.category` field using Prisma grouping and counting.
- **Privacy Guaranteed**: Does not expose author identities, emails, password hashes, or session tokens.
- **Deep Integration**: Topics cards link seamlessly to the archive filter: `/essays?category=<name>`.

```json
// Example GET /api/v1/topics Response
{
  "success": true,
  "message": "Topics retrieved successfully",
  "data": {
    "topics": [
      { "name": "Architecture", "postCount": 1 },
      { "name": "Developer", "postCount": 1 },
      { "name": "engineering of the software", "postCount": 1 }
    ]
  }
}
```

---

### 8. Diagnostic Endpoints (`/api/v1/health`)
- `GET /api/v1/health` — Basic API health check
- `GET /api/v1/health/db` — PostgreSQL connection and latency check

---

## 💻 Frontend Routes & Navigation

| Route | Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Split-hero with recent essays fetched from PostgreSQL, reading CTAs. |
| `/essays` | `EssaysPage` | Public | The Archive: complete list of essays with topic category filter pills. |
| `/topics` | `TopicsPage` | Public | Editorial taxonomy derived from real database categories with article counts. |
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

### Full Automated Test Suite (145 Passing Tests)
Run all unit, integration, storage, and security tests across backend (132 tests) and frontend (13 tests):

```bash
# Backend test suite (132 passing tests across 8 suites)
cd backend
npm test

# Frontend test suite (13 passing tests via Vitest & jsdom)
cd frontend
npm test
```

Test coverage includes:
- `topics.api.test.ts` (3 tests): Category grouping and aggregation from PostgreSQL, accurate post counts, exclusion of null/empty/blank values, alphabetical ordering, and privacy protection.
- `media.storage.test.ts` (23 tests): JPEG, PNG, and WebP valid buffer processing; rejection of fake MIME extensions (text disguised as jpg), SVG, animated GIF, and corrupted image buffers; rejection of images exceeding 40 Megapixels decompression bomb limit; avatar upload authentication requirement, user profile avatar URL update, avatar replacement with previous object cleanup, avatar removal reverting `avatarUrl` to null for monogram fallback, prevention of target user manipulation from request body; post cover upload authentication & ownership checks (403 for unauthorized users, 404 for missing post), alt text length validation (max 160 characters), cover update & previous object cleanup, cover removal setting fields to null, post deletion cover object cleanup, compensating cleanup when database updates fail, and safe error handling without secret leakage.
- `search.pagination.test.ts` (19 tests): Article search by title, article search by content, case-insensitive normalization, whitespace trimming, combined search and category filtering, deterministic sorting (`createdAt DESC, id DESC`), pagination defaults (`page=1, limit=9`), pagination boundaries and rejection of invalid/negative/decimal/exceeding limits, empty state pagination consistency, author directory search by name/bio with email isolation, author directory pagination, and public author profile essay pagination (`postsPage`, `postsLimit`) with total `postCount` preservation.
- `authors.api.test.ts` (22 tests): Public directory access, contributor postCount filtering, name sorting, bio display, email/passwordHash privacy protection, public profile by ID, newest-first essay ordering, 0-post user empty state, invalid UUID (400), user not found (404), profile update (`PATCH /api/v1/auth/me`), name validation (1-80 chars), bio length (500 chars), whitespace normalization to `null`, rejection of empty update body, forbidden field protection (`email`, `id`, `avatarUrl`), 401 unauthenticated check, revoked session rejection, database persistence, and isolated test cleanup.
- `comments.api.test.ts` (22 tests): Threaded comments tree, parentId validation, cross-post rejection, leaf hard-delete, parent soft-delete.
- `posts.api.test.ts` (17 tests): Public reads, safe author filtering, creation with token identity, ownership enforcement for edit/delete, 403 for unauthorized users, 404 for missing records.
- `auth.api.test.ts` (16 tests): Registration, login, duplicate email rejection, session revocation, live db check.
- `auth.validators.test.ts` (10 tests): UTF-8 72-byte passwords, email normalization, required fields.
- `markdown.security.test.tsx` (13 frontend tests): Sanitization of `<script>` tags, stripping of dangerous inline event handlers (`onload`, `onerror`), disarming malicious URL schemes (`javascript:`), secure external link handling (`target="_blank"` with `rel="noopener noreferrer"`), remote image neutralization with pill badge indicator, rendering standard Markdown (headings, bold, italic, blockquote, lists, inline code, code blocks, and GFM tables), and safe plain-text backward compatibility.

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

# Supabase Storage Configuration (Phase 9)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-secret-key"
SUPABASE_AVATARS_BUCKET="avatars"
SUPABASE_COVERS_BUCKET="post-covers"
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

## ✅ Current Status (Phase 11 Deployed to Production)

- [x] **Phase 1**: Full-stack scaffolding (React 19 + Express + TypeScript)
- [x] **Phase 2**: PostgreSQL schema, Prisma ORM v7, database health checks
- [x] **Phase 3**: JWT authentication, bcrypt (12 rounds), session tracking, 26 tests
- [x] **Phase 4**: Frontend authentication integration, in-memory tokens, protected routes, Aurora visual system
- [x] **Phase 5**: Full-Stack Blog Post CRUD & Aurora Editorial Experience (17 tests)
- [x] **Phase 6**: Nested Comments System, Replies, Ownership Authorization & Aurora UI (22 tests)
- [x] **Phase 7**: Author Directory, Public Author Profiles & Profile Management (22 tests)
- [x] **Phase 8**: Search, Pagination, Markdown Editor & Safe Content Rendering (29 tests)
- [x] **Phase 9**: Avatar Upload, Article Cover Images & Supabase Storage Integration (23 tests)
- [x] **Phase 10**: Comprehensive Quality Audit, Performance Optimization, Accessibility & Topics Navigation (145 tests)
- [x] **Phase 11**: Full Production Cloud Deployment:
  - [x] **Frontend Live on Vercel**: [https://talent-growth-one.vercel.app/](https://talent-growth-one.vercel.app/) with automated SPA routing rewrites (`vercel.json`).
  - [x] **Backend Live on Render**: [https://talent-growth.onrender.com](https://talent-growth.onrender.com) with automated Prisma DDL migrations.
  - [x] **Database & Media Storage Live on Supabase**: PostgreSQL database (`talent_growth_dev` schema) and public media buckets (`avatars`, `post-covers`) with IPv4 connection pooling.
  - [x] **Full-Stack Integration Verified**: End-to-end communication, CORS authorization, and database health verified live in production.

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
| 9     | Photo upload & media management                 | ✅ Done     |
| 10    | Quality Audit, Accessibility & Topics Polish    | ✅ Done     |
| 11    | Deployment (Vercel, Render, Supabase)          | ✅ Done     |

---

## 📄 License

ISC

