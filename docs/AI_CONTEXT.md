# 🤖 Project Context & Development Guide for AI Assistants

> **Purpose**: This document provides a complete overview of the **Farm Management System (FFMS)** codebase, architecture, conventions, and roadmap. Any AI assistant or LLM taking over tasks in this repository should read this document first.

---

## 1. Project Overview & Scope

- **Repository**: Monorepo for an **Intelligent Farm Management System (IFMS)** group assignment.
- **Backend Stack**: Plain PHP 8+ (No framework / zero dependencies).
- **Database**: MySQL 8+ (Managed via XAMPP phpMyAdmin locally or Docker).
- **Frontend Stack**: React 19 + Vite + React Router 7 + Axios (Located in `ffms-frontend/`).
- **Authentication**: Custom JWT (HMAC-SHA256) with native `password_hash(PASSWORD_BCRYPT)` and Role-Based Access Control (RBAC).

---

## 2. Directory Structure

```text
.
├── backend/                        # Plain PHP backend API
│   ├── public/
│   │   └── index.php               # Central API Router & CORS handling
│   └── src/
│       ├── bootstrap.php           # PDO singleton (getPdo), Auth guards, response helpers
│       └── Modules/                # Modular backend business logic (18 modules)
│           └── security/           # Phase 1: JwtHelper, UserModel, AuthController, AuditLogger
├── ffms-frontend/                  # React 19 + Vite frontend application
│   ├── src/
│   │   ├── pages/                  # Page components (Dashboard, Crops, Auth, etc.)
│   │   ├── components/             # Reusable UI components (Navbar, Sidebar, Modal, etc.)
│   │   └── layouts/                # DashboardLayout & Auth layouts
│   └── package.json
├── database/                       # SQL migrations & DB scripts
│   └── migrations/                 # Versioned SQL migrations (e.g. 001_users_roles.sql)
├── docs/                           # Project documentation & specs
│   ├── backend/
│   │   ├── schema.md               # Single source of truth for DB tables & planned schema
│   │   └── phases/                 # Phase completion reports (e.g. PHASE_1_SECURITY_AND_USERS.md)
│   ├── AI_CONTEXT.md               # THIS FILE — LLM context & developer rules
│   ├── assignment-scope.md         # Original brief requirement groups
│   ├── module-map.md               # Ownership map for feature modules
│   └── team-workflow.md            # Git branching and team rules
├── backend_workflow.md             # Master checklist & progress tracker across all 5 phases
├── README.md                       # Main user-facing setup guide (XAMPP & Docker)
└── .env.example                    # Environment variable template
```

---

## 3. Core Architecture & Coding Standards

### A. Backend Architecture (Plain PHP)
1. **Zero Framework Policy**: Do NOT introduce Laravel, Symfony, or heavy Composer dependencies unless explicitly instructed.
2. **Central Router (`backend/public/index.php`)**:
   - Incoming HTTP requests are matched by `$requestUri` and `$requestMethod`.
   - Instantiate module controllers passing `getPdo()` and call the target method.
3. **Shared Utility (`backend/src/bootstrap.php`)**:
   - `getPdo()`: Returns a shared `PDO` connection instance. Supports `.env` loading and falls back to local XAMPP defaults (`127.0.0.1`, user: `root`, pass: `""`).
   - `respond(array $payload, int $statusCode = 200)`: Sends JSON response and exits.
   - `requireAuth()`: Verifies Bearer JWT header. Returns token payload array (`sub`, `email`, `role`) or exits with `401 Unauthorized`.
   - `requireRole(array $allowedRoles)`: Asserts user role or exits with `403 Forbidden`.

### B. Standard 5-Step Module Implementation Workflow
When implementing any new backend module (e.g., `farm_field`, `crop`, `livestock`):
1. **Migration**: Create `database/migrations/00X_<module_name>.sql` with explicit table names, foreign keys, and indexes.
2. **Model**: Create `<ModuleName>Model.php` inside `backend/src/Modules/<module>/` containing PDO SQL queries.
3. **Controller**: Create `<ModuleName>Controller.php` inside `backend/src/Modules/<module>/` handling request inputs, auth checks, calling the model, and invoking `respond()`.
4. **Routes**: Register new endpoints in `backend/public/index.php`.
5. **Documentation & Tracking**: Update `docs/backend/schema.md` and `backend_workflow.md`.

---

## 4. Current Progress & Phase Roadmap

### ✅ Completed: Phase 1 — Security & User Management
- **Migration**: `001_users_roles.sql` (`roles`, `users`, `audit_logs`).
- **Classes**: `UserModel.php`, `AuthController.php`, `JwtHelper.php`, `AuditLogger.php`.
- **Endpoints**:
  - `POST /api/auth/register` (Public)
  - `POST /api/auth/login` (Public)
  - `GET /api/auth/me` (Protected — `Bearer <token>`)
  - `POST /api/auth/logout` (Protected)
- **Documentation**: [`docs/backend/phases/PHASE_1_SECURITY_AND_USERS.md`](backend/phases/PHASE_1_SECURITY_AND_USERS.md)

---

### ⏳ Upcoming Phases (Follow this order due to DB foreign keys)

| Phase | Modules | Key Entities / Description |
|---|---|---|
| **Phase 2** | `farm_field`, `crop`, `livestock` | Farms, fields, plots, soil, crops, planting schedules, animal breeds, health records |
| **Phase 3** | `irrigation`, `inventory`, `equipment`, `labour`, `pest_disease`, `weather` | Water consumption, input stock, machinery maintenance, workers & tasks, scouting reports, weather API |
| **Phase 4** | `harvest`, `sales_market`, `finance`, `suppliers_procurement`, `storage` | Yield tracking, customer sales orders, financial P&L, purchase orders, warehouse storage |
| **Phase 5** | `analytics`, `notifications`, `reports` | Dashboard metrics, system alerts, date-ranged performance reports |

---

## 5. Critical Instructions for AI Assistants

1. **Relative Paths Only**:
   - NEVER use machine-specific absolute file URIs (e.g. `file:///C:/Users/...`).
   - ALWAYS reference files using clean repository-relative paths (e.g. `backend/src/bootstrap.php`).
2. **Preserve Compatibility**:
   - Maintain the established response format: `{"success": true|false, ...}`.
   - Password hashes must always use `password_hash()` and `password_verify()`.
3. **Error Log Extraction**:
   - Inspect PHP error output or MySQL tracebacks thoroughly before forming diagnostic hypotheses.
4. **Local Development Environment**:
   - PHP server runs via: `php -S localhost:8000 -t public public/index.php` from `backend/`.
   - React dev server runs via: `npm run dev` from `ffms-frontend/`.
   - XAMPP default MySQL port: `3306`, user: `root`, password: `""`.

---

## 6. Required Documentation Updates per Phase Completion / Modification

Whenever a development phase is modified or completed, AI assistants MUST ensure the following **5 documentation files** are created or updated:

| # | Document | Action | Content Requirements |
|---|---|---|---|
| 1 | 📄 **Phase Completion Report**<br>`docs/backend/phases/PHASE_<N>_<NAME>.md` | **CREATE** | Full phase report: Executive summary, implemented SQL tables, backend classes created/modified, complete API endpoint specs (JSON payloads), and teammate integration guide. |
| 2 | 🗄️ **Central Database Schema**<br>`docs/backend/schema.md` | **UPDATE** | Move newly implemented SQL table definitions from "Planned Schemas" to "Implemented Schemas" with full column types, primary/foreign keys, and constraints. |
| 3 | 🌾 **Master Workflow Checklist**<br>`backend_workflow.md` | **UPDATE** | Check off completed tasks (`[x]`) in the phase section and update the Progress Tracker table with `☑` checkmarks across DB, Model, Controller, Routes, and Tested. |
| 4 | 📘 **Main README**<br>`README.md` | **UPDATE** | Update the API Endpoints Overview table with any new public or protected endpoints added during the phase. |
| 5 | 🤖 **AI Assistant Context**<br>`docs/AI_CONTEXT.md` | **UPDATE** | Update Section 4 ("Current Progress & Phase Roadmap") to reflect the newly completed phase and its deliverables. |
