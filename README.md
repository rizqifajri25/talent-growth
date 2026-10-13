# Talent Growth Blog Platform

A full-stack blog application for sharing knowledge and growing together, built with modern web technologies.

## 🎯 Purpose

Talent Growth Blog Platform is a web application that enables users to create, read, and share blog posts. The platform aims to foster knowledge sharing and professional growth within a community.

## 🛠️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React, TypeScript, Vite           |
| Backend    | Node.js, Express.js, TypeScript   |
| Database   | PostgreSQL (via Supabase) — *TBD* |
| ORM        | Prisma — *TBD*                    |
| Auth       | JWT + bcrypt — *TBD*              |
| HTTP Client| Axios — *TBD*                     |
| Deployment | Vercel, Railway, Supabase — *TBD* |

> Items marked *TBD* will be configured in upcoming phases.

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
│   ├── src/
│   │   ├── config/            # Configuration modules
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/
│   │   │   └── health.routes.ts  # Health check endpoint
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # HTTP server entry point
│   ├── .env.example           # Environment variable template
│   ├── package.json           # Backend dependencies & scripts
│   └── tsconfig.json          # TypeScript configuration
├── .editorconfig              # Editor formatting rules
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 📋 Prerequisites

- **Node.js** >= 18.x (tested with v25.7.0)
- **npm** >= 9.x (tested with v11.10.1)
- **Git** >= 2.x

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd talent-growth
```

### 2. Set up environment variables

Copy the example environment files and adjust values if needed:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

The `.env.example` files contain default development values that work out of the box. The `.env` files are gitignored and will not be committed.

### 3. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

The frontend development server starts at: **http://localhost:5173**

### 5. Run the backend

```bash
cd backend
npm run dev
```

The backend API server starts at: **http://localhost:4000**

### 6. Verify the health endpoint

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "Talent Growth API is running",
  "timestamp": "2026-10-13T14:00:00.000Z"
}
```

## 🔧 Environment Variables

### Frontend (`frontend/.env`)

| Variable             | Description                  | Default                          |
| -------------------- | ---------------------------- | -------------------------------- |
| `VITE_API_BASE_URL`  | Backend API base URL         | `http://localhost:4000/api/v1`   |

### Backend (`backend/.env`)

| Variable        | Description                          | Default                    |
| --------------- | ------------------------------------ | -------------------------- |
| `PORT`          | Port the API server listens on       | `4000`                     |
| `FRONTEND_URL`  | Frontend origin URL (for CORS)       | `http://localhost:5173`    |

## 📜 Available Scripts

### Frontend

| Script          | Command           | Description                      |
| --------------- | ----------------- | -------------------------------- |
| `npm run dev`   | `vite`            | Start development server         |
| `npm run build` | `tsc -b && vite build` | Type-check and build for production |
| `npm run preview`| `vite preview`   | Preview production build locally |

### Backend

| Script          | Command           | Description                          |
| --------------- | ----------------- | ------------------------------------ |
| `npm run dev`   | `tsx watch src/server.ts` | Start dev server with hot reload |
| `npm run build` | `tsc`             | Compile TypeScript to JavaScript     |
| `npm start`     | `node dist/server.js` | Run compiled production server   |

## ✅ Current Status (Phase 1)

- [x] Repository initialized with Git
- [x] Frontend scaffolded with React + TypeScript + Vite
- [x] Backend scaffolded with Express + TypeScript
- [x] Health check endpoint (`GET /api/v1/health`)
- [x] CORS configured for local development
- [x] Environment variable templates
- [x] Project documentation

## 🗺️ Roadmap

| Phase | Description                          | Status     |
| ----- | ------------------------------------ | ---------- |
| 1     | Project initialization & scaffolding | ✅ Done    |
| 2     | Database setup (PostgreSQL + Prisma) | ⏳ Pending |
| 3     | Authentication (JWT + bcrypt)        | ⏳ Pending |
| 4     | Blog post CRUD                       | ⏳ Pending |
| 5     | Comments system                      | ⏳ Pending |
| 6     | User profiles & authorization        | ⏳ Pending |
| 7     | Search, pagination, markdown         | ⏳ Pending |
| 8     | Photo upload                         | ⏳ Pending |
| 9     | Testing                              | ⏳ Pending |
| 10    | Deployment                           | ⏳ Pending |

## 🏗️ Design Decisions

1. **Monorepo structure**: Frontend and backend live in the same repository under separate directories for simplified development and version control.
2. **TypeScript everywhere**: Both frontend and backend use TypeScript with strict mode for type safety and consistency.
3. **Separated app and server**: The Express app (`app.ts`) is separated from the HTTP server (`server.ts`) to enable easier testing in the future.
4. **Environment-based CORS**: CORS origin is configured via environment variable rather than using a wildcard, improving security even in development.
5. **API versioning**: Routes are prefixed with `/api/v1` to support future API versioning.
6. **tsx for development**: Using `tsx watch` for backend development provides fast TypeScript execution without a separate compilation step.
7. **CommonJS for backend**: Backend uses CommonJS module system for broad Node.js ecosystem compatibility with Express middleware.

## 📄 License

ISC
