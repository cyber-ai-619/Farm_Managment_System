# 🌾 Farm Management System (FFMS)

A collaboration-friendly monorepo for an Intelligent Farm Management System (IFMS) group assignment. Built with plain PHP (Backend), MySQL (Database), and React + Vite (Frontend).

---

## 🛠️ Local Machine Setup (XAMPP & Node.js)

Follow these steps to run the full stack locally on Windows/macOS/Linux without Docker.

### Prerequisites
- **XAMPP** (with PHP 8.+ and MySQL started)
- **Node.js** (v18 or higher)
- **Git**

---

### Step 1: Database Setup (XAMPP phpMyAdmin)

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open **phpMyAdmin** in your browser: `http://localhost/phpmyadmin`
3. Click **New** → Create a database named `farm_management` (collation `utf8mb4_general_ci`).
4. Select `farm_management` → Go to the **SQL** tab (or **Import** tab).
5. Copy and run the SQL migration from:
   ```
   database/migrations/001_users_roles.sql
   ```
   *(This creates the `roles`, `users`, and `audit_logs` tables and seeds default user roles).*

---

### Step 2: Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
copy .env.example .env
```

Ensure your `.env` contains:
```env
APP_NAME=Farm Management System
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080
API_URL=http://localhost:8000/api
APP_SECRET=dev-jwt-secret-key-12345

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=farm_management
DB_USERNAME=root
DB_PASSWORD=
```

---

### Step 3: Backend Server Setup (PHP)

1. Open a terminal in the project root:
   ```bash
   cd backend
   php -S localhost:8000 -t public public/index.php
   ```
2. Test backend in browser:
   - Base API info: `http://localhost:8000`
   - Health check: `http://localhost:8000/api/health`

---

### Step 4: Frontend Setup (React + Vite)

1. Open a new terminal tab/window:
   ```bash
   cd ffms-frontend
   npm install
   npm run dev
   ```
2. Open the React frontend in your browser: `http://localhost:5173` (or the URL printed by Vite).

---

## 🐳 Alternative Setup (Docker)

If you prefer to run the entire stack using Docker Compose:

1. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
2. Build and start containers:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```
3. Access services:
   - Frontend: `http://localhost:8080`
   - Backend API: `http://localhost:8000`

---

## 📁 Repository Structure

```text
.
├── backend/                  # Plain PHP API (Modules architecture)
│   ├── public/
│   │   └── index.php         # Central API Router & CORS handling
│   └── src/
│       ├── bootstrap.php     # DB connection (PDO), Auth guards, catalog
│       └── Modules/          # 18 feature modules (security, farm_field, crop, etc.)
├── ffms-frontend/            # React 19 + Vite frontend application
│   ├── src/
│   │   ├── pages/            # View components (Dashboard, Crops, Livestock, Auth, etc.)
│   │   ├── components/       # Shared UI components (Navbar, Sidebar, Modal, etc.)
│   │   └── layouts/          # DashboardLayout, Auth layouts
│   └── package.json
├── database/                 # Database documentation & SQL migrations
│   ├── migrations/           # 001_users_roles.sql, etc.
│   └── schema.md             # Shared database entity design
├── docs/                     # Assignment scope, module map, team workflow notes
│   ├── backend/
│   │   ├── schema.md         # Database schema design & implemented table reference
│   │   └── phases/           # Phase completion reports (Phase 1, etc.)
│   ├── AI_CONTEXT.md         # AI assistant & LLM development guide
│   ├── assignment-scope.md
│   ├── module-map.md
│   └── team-workflow.md
├── infra/                    # Docker Compose & Nginx configuration
```

---

## 🔐 API Endpoints Overview (Phase 1 Implemented)

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/` | API Root & available routes | ❌ |
| `GET` | `/api/health` | Service health status | ❌ |
| `GET` | `/api/modules` | Module catalog status | ❌ |
| `POST` | `/api/auth/register` | Register new user account | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | ❌ |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | ✅ (Bearer Token) |
| `POST` | `/api/auth/logout` | Client token invalidation | ✅ (Bearer Token) |

---

## 👥 Suggested Team Workflow

- Create one branch per module: `feature/<module-name>`
- Save database schema designs in `docs/backend/schema.md` before writing code
- Document module ownership using `docs/module-map.md`
- Review phase completion reports in `docs/backend/phases/`
- Track implementation progress using the Backend Development Workflow markdown.
