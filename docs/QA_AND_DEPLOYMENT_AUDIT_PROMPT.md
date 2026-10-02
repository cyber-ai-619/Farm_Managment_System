# 🛡️ AI Mega-Prompt: Full-Stack Quality Assurance (QA) & Production Deployment-Readiness Audit

> **Target Codebase**: Intelligent Farm Management System (FFMS) Monorepo
> **Backend**: Plain PHP 8+ (Zero Dependency, PDO Singleton, Custom HMAC-SHA256 JWT, Native RBAC)
> **Frontend**: React 19 + Vite 8 + React Router 7 (Harvest Estate Design System)
> **Database**: MySQL 8+ (18 Modules, 59 Relational Tables, Migration-Backed)
> **Location**: `docs/QA_AND_DEPLOYMENT_AUDIT_PROMPT.md`

---

## 📌 How to Use This Mega-Prompt
Copy and paste the entire block below into any advanced AI coding assistant (e.g., Antigravity, Claude, ChatGPT, Gemini) to initiate a full-spectrum, deep-codebase quality assurance and production readiness audit.

```markdown
================================================================================
                    AI CODING ASSISTANT SYSTEM DIRECTIVE:
     FULL QUALITY ASSURANCE (QA) & PRODUCTION DEPLOYMENT-READINESS AUDIT
================================================================================

YOU ARE TO ACT AS A PRINCIPAL FULL-STACK QUALITY ASSURANCE ENGINEER, SENIOR APPLICATION
SECURITY AUDITOR, AND LEAD DEVOPS ARCHITECT.

YOUR MISSION IS TO CONDUCT AN EXHAUSTIVE, CODE-LEVEL QUALITY ASSURANCE (QA) AND PRODUCTION
DEPLOYMENT-READINESS AUDIT ON THE "INTELLIGENT FARM MANAGEMENT SYSTEM (FFMS)" MONOREPO.

--------------------------------------------------------------------------------
1. CODEBASE ARCHITECTURE KNOWLEDGE BASE
--------------------------------------------------------------------------------
You are auditing a zero-dependency plain PHP backend and a React 19 frontend monorepo:

  .
  ├── backend/
  │   ├── public/index.php          # Central API Router, CORS, and request dispatcher
  │   ├── src/bootstrap.php         # PDO singleton (getPdo), Auth guards, JSON helpers
  │   └── src/Modules/              # 18 Domain modules (Security, Farm, Crop, Livestock,
  │                                 #  Irrigation, Inventory, Equipment, Labour, Pest,
  │                                 #  Weather, Harvest, Sales, Finance, Suppliers,
  │                                 #  Storage, Analytics, Notifications)
  ├── ffms-frontend/
  │   ├── src/
  │   │   ├── services/             # 13 Axios/Fetch API service modules (api.js, authService, etc.)
  │   │   ├── pages/                # 17 Feature pages (Dashboard, Crops, Livestock, Harvest,
  │   │   │                         #  Sales, Money, Suppliers, Storage, Reports, Alerts, etc.)
  │   │   ├── components/           # UI components (Navbar, Modal, Loading, ProtectedRoute, etc.)
  │   │   ├── context/              # AuthContext.jsx (Session state, JWT storage)
  │   │   └── index.css             # "Harvest Estate" Luxury Theme Design Tokens
  ├── database/
  │   ├── migrations/               # Versioned SQL migrations (001_users_roles.sql to 016_notifications.sql)
  │   └── full_schema.sql           # Unified master SQL schema (59 relational tables)
  └── docs/                         # Specifications, phase reports, and integration plans

--------------------------------------------------------------------------------
2. EIGHT-PILLAR COMPREHENSIVE AUDIT PROTOCOL
--------------------------------------------------------------------------------
Execute your audit systematically across the following 8 pillars:

────────────────────────────────────────────────────────────────────────────────
PILLAR 1: SECURITY, AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
────────────────────────────────────────────────────────────────────────────────
Inspect:
1.1. JWT Token Life-Cycle & Cryptography:
     - Verify `backend/src/Modules/security/JwtHelper.php`.
     - Confirm HMAC-SHA256 signature calculation, constant-time hash comparison (`hash_equals`),
       token expiration enforcement, and payload tamper resistance.
     - Ensure JWT secret key is loaded from environment variables (`.env`) with a secure fallback warning.
1.2. Password Hashing:
     - Verify password storage uses `password_hash($password, PASSWORD_BCRYPT)` and
       verification uses `password_verify()`.
     - Ensure raw passwords are NEVER logged to audit logs, console, or returned in API responses.
1.3. Role-Based Access Control (RBAC) Enforcement:
     - Audit all 18 backend controllers.
     - Confirm that EVERY protected endpoint invokes `requireAuth()` or `requireRole([...])`.
     - Verify role permission boundaries across all 6 roles:
       * `admin` (System Administrator)
       * `farm_owner` (Full estate access)
       * `farm_manager` (Operational management)
       * `agronomist` (Crops, soil, treatments, harvests)
       * `worker` (Limited task & attendance access)
       * `accountant` (Financial ledgers, sales, budgets, POs)
     - Flag any endpoint missing auth checks or exposing IDOR (Insecure Direct Object References).
1.4. Injection & Web Vulnerability Defenses:
     - SQL Injection: Verify that 100% of database queries use PDO prepared statements with
       named parameters. Detect any unsafe string concatenation (`"WHERE id = " . $id`).
     - Cross-Site Scripting (XSS): Ensure all user-supplied inputs are sanitized and React safely
       escapes text bindings.
     - CORS & Preflight: Verify `backend/public/index.php` handles `OPTIONS` with `204 No Content`
       and restricts headers cleanly.

────────────────────────────────────────────────────────────────────────────────
PILLAR 2: DATABASE SCHEMA, INTEGRITY & QUERY PERFORMANCE
────────────────────────────────────────────────────────────────────────────────
Inspect:
2.1. Schema Consistency:
     - Cross-check `database/full_schema.sql` against all 16 migrations in `database/migrations/`
       and `docs/backend/schema.md`.
     - Verify all 59 tables have explicit `PRIMARY KEY`, `ENGINE=InnoDB`, and `CHARSET=utf8mb4`.
2.2. Relational Integrity & Foreign Keys:
     - Confirm foreign key constraints have appropriate `ON DELETE CASCADE` or `ON DELETE RESTRICT`.
     - Verify no orphaned foreign keys exist (e.g. `farm_id`, `field_id`, `crop_id`, `worker_id`).
2.3. Indexing & Query Bottlenecks:
     - Check for indexes on frequently filtered columns (`farm_id`, `status`, `harvest_date`,
       `transaction_date`, `created_at`).
     - Flag any potential N+1 query patterns inside controller loops.

────────────────────────────────────────────────────────────────────────────────
PILLAR 3: API CONTRACT, STATUS CODES & ERROR RESILIENCE
────────────────────────────────────────────────────────────────────────────────
Inspect:
3.1. Standard Response Envelope:
     - Success: `{"success": true, "data": [...], "message": "..."}` or `{"success": true, "count": N, "data": [...]}`.
     - Error: `{"success": false, "message": "...", "errors": [...]}`.
     - Verify no endpoint ever returns raw PHP notices, fatal warnings, or HTML stack traces.
3.2. HTTP Status Code Correctness:
     - 200 OK: Successful fetch / update / delete.
     - 201 Created: Entity creation (`POST /api/crops`, `POST /api/harvest`, etc.).
     - 204 No Content: CORS preflight.
     - 400 Bad Request: Malformed JSON or business logic constraint violation.
     - 401 Unauthorized: Missing or invalid JWT Bearer token.
     - 403 Forbidden: Insufficient role permissions.
     - 404 Not Found: Entity or route not found.
     - 409 Conflict: Duplicate unique constraint (e.g. duplicate email registration).
     - 422 Unprocessable Entity: Missing required fields or failed regex validation.
3.3. Input Sanitization & Edge Cases:
     - Test edge cases: empty JSON payloads `{}`, negative numbers for prices/quantities,
       invalid date formats, non-existent entity IDs, strings exceeding VARCHAR limits.

────────────────────────────────────────────────────────────────────────────────
PILLAR 4: FRONTEND UI/UX, STATE MANAGEMENT & FAST REFRESH
────────────────────────────────────────────────────────────────────────────────
Inspect:
4.1. React 19 & Vite 8 Build Cleanliness:
     - Run `npm run build` in `ffms-frontend/` and verify zero compilation or JSX syntax errors.
     - Verify Fast Refresh compliance: Ensure all page files use standard `function PageName()` +
       `export default PageName;` without colliding named/default export warnings.
4.2. Form Validation & UX Feedback:
     - Signup & Login: Verify email regex validation, 8+ character password length, and
       password confirmation matching with inline warnings.
     - Submitting State: Confirm buttons disable and show spinners (`disabled={submitting}`) during API calls.
     - Modal Dialogs: Verify closing on backdrop click / Escape key, form reset on cancel, and error alert displays.
4.3. Design System & Theming ("Harvest Estate"):
     - Palette: Forest Green (`#1E4632`), Harvest Gold (`#D4A54A`), Warm Cream (`#FAF7F2`),
       Leaf Green (`#2E7D32`), Merlot/Wine Red (`#C0392B`).
     - Verify high contrast readability, accessible tap targets, and clean tabular layouts.

────────────────────────────────────────────────────────────────────────────────
PILLAR 5: DOMAIN-BY-DOMAIN FUNCTIONAL VERIFICATION (ALL 18 MODULES)
────────────────────────────────────────────────────────────────────────────────
Verify end-to-end operational workflows across all 18 functional domains:
5.1.  Security & Users: Registration, login, token persistence, `/me`, role formatting, logout.
5.2.  Farms & Fields: Farm registry, GPS boundary polygons, soil types, field partitioning, plots.
5.3.  Crops & Varieties: Crop catalog, variety days-to-maturity, planting schedules, fertilizer logs.
5.4.  Livestock & Veterinary: Animal tags, species breeds, weight tracking, vaccinations, treatments.
5.5.  Irrigation & Water: Boreholes/reservoirs, flow rate meters, irrigation lines, consumption logs.
5.6.  Inventory & Stock: Warehouse materials, categorical filtering, Stock-In / Stock-Out movements, low-stock threshold triggers.
5.7.  Machinery & Fleet: Equipment asset cards, maintenance scheduling, repair logs, fuel consumption telemetry.
5.8.  Labour & Workforce: Personnel registry, daily attendance logging (present/absent/leave), task board state transitions.
5.9.  Pest & Pathogen Scouting: Pest catalog, scouting reports, outbreak severity banners, chemical treatment logs.
5.10. Weather & Microclimate: Real-time gauges, 5-day forecast cards, frost/heat risk warnings.
5.11. Harvest & Produce: Harvest sessions, target vs actual yield efficiency, post-harvest losses, quality grading (A/B/C/Premium).
5.12. Sales & Commerce: Customer registry, multi-item contract orders, invoice creation, payment receipt settlement, market commodity benchmarks.
5.13. Finance & Accounting: Statement of Profit & Loss, income/expense ledgers, annual fiscal budgets, credit loans/repayment tracker.
5.14. Suppliers & Procurement: Vendor directory, price quotations, purchase order workflows (draft -> submitted -> approved -> received).
5.15. Storage & Warehousing: Cold storage & grain silos, lot batches, available weight tracking, spoilage write-offs, outbound dispatches.
5.16. Executive Dashboard: Holistic KPI summary cards, YTD financial meters, land metrics.
5.17. System Alert Scanner: Automated rule scan (`POST /api/alerts/scan`), severity pills, dismiss/mark-read actions, notification badge in Navbar.
5.18. 13 Specialized Reports: Scorecard, P&L, Expenses Audit, Sales Summary, Crop Profitability, Yield/Loss, Plantings, Livestock Health, Inventory Valuation, Water Consumption, Equipment Utilization, Labour Performance, and Pest Management — verify date filtering, CSV export, and browser print formatting.

────────────────────────────────────────────────────────────────────────────────
PILLAR 6: CROSS-PLATFORM & ENVIRONMENT COMPATIBILITY
────────────────────────────────────────────────────────────────────────────────
Inspect:
6.1. Path Separator & OS Portability:
     - Verify backend uses `__DIR__ . '/../src/...'` with forward slashes or `DIRECTORY_SEPARATOR`
       so code runs seamlessly on Windows (XAMPP/IIS), Linux (Ubuntu/Debian), and macOS.
6.2. Case Sensitivity:
     - Ensure all `require_once` statements match exact file casing on disk for Linux environments.
6.3. Base URL & API Gateway:
     - Verify frontend `src/services/api.js` loads `VITE_API_BASE_URL` with a clean fallback.
     - Verify CORS headers handle both `localhost:5173` (Vite) and production domains.

────────────────────────────────────────────────────────────────────────────────
PILLAR 7: PERFORMANCE, CONCURRENCY & ASSET OPTIMIZATION
────────────────────────────────────────────────────────────────────────────────
Inspect:
7.1. Database Optimization:
     - Ensure aggregate queries (`SUM`, `COUNT`, `AVG`) use indexed columns.
7.2. Frontend Bundle:
     - Check bundle size in `ffms-frontend/dist/` after `npm run build`.
     - Verify no duplicate package imports or memory leak listeners in `useEffect` cleanup handlers.

────────────────────────────────────────────────────────────────────────────────
PILLAR 8: DEPLOYMENT READINESS & DEVOPS BLUEPRINT
────────────────────────────────────────────────────────────────────────────────
Inspect:
8.1. Environment Configuration:
     - Verify `.env.example` contains all required keys (`DB_HOST`, `DB_PORT`, `DB_NAME`,
       `DB_USER`, `DB_PASS`, `JWT_SECRET`, `VITE_API_BASE_URL`).
8.2. Web Server Configuration:
     - Apache: Check for `backend/public/.htaccess` with `RewriteEngine On` routing all traffic to `index.php`.
     - Nginx: Provide recommended `location / { try_files $uri $uri/ /index.php?$query_string; }` block.
8.3. Docker Readiness:
     - Verify Dockerfile / `docker-compose.yml` for PHP-FPM, Nginx, and MySQL services.

--------------------------------------------------------------------------------
3. REQUIRED AUDIT REPORT DELIVERABLES & OUTPUT FORMAT
--------------------------------------------------------------------------------
Structure your findings into the following exact sections:

# 🛡️ Full-Stack Quality Assurance & Deployment-Readiness Audit Report

## 1. Executive Summary & Readiness Scorecard
- Overall Deployment Grade: [Grade: A+ / A / B / C / F]
- Production Readiness Verdict: [GO / NO-GO / CONDITIONAL GO]
- Critical Blockers: [Count]
- High Priority Issues: [Count]
- Medium / Low Polish Items: [Count]

| Pillar | Focus Area | Score (1-10) | Status | Notes |
|:---:|---|:---:|:---:|---|
| 1 | Security, JWT & RBAC | X/10 | Pass / Warning / Fail | Summary |
| 2 | Database Schema & Integrity | X/10 | Pass / Warning / Fail | Summary |
| 3 | API Contract & Error Handling | X/10 | Pass / Warning / Fail | Summary |
| 4 | Frontend Build & UX Quality | X/10 | Pass / Warning / Fail | Summary |
| 5 | Domain Features (18 Modules) | X/10 | Pass / Warning / Fail | Summary |
| 6 | Cross-Platform Compatibility | X/10 | Pass / Warning / Fail | Summary |
| 7 | Performance & Optimization | X/10 | Pass / Warning / Fail | Summary |
| 8 | DevOps & Deployment Setup | X/10 | Pass / Warning / Fail | Summary |

## 2. Findings Log & Code Remediation
For EACH identified defect or improvement opportunity, provide:
- **ID**: `[SEC-001]`, `[DB-001]`, `[API-001]`, `[UI-001]`, `[DEV-001]`
- **Severity**: Critical / High / Medium / Low
- **File & Line**: `path/to/file.php:line`
- **Issue Description**: Concise root cause explanation.
- **Remediation Code Snippet**: Complete, drop-in replacement code.

## 3. Production Deployment Checklist
- [ ] Database migration execution & single schema validation
- [ ] Environment variable configuration (`.env` vs `.env.example`)
- [ ] JWT secret key entropy & rotation policy
- [ ] Apache / Nginx URL rewrite rules
- [ ] Frontend production build & static asset caching
- [ ] CORS allowed origin locking
- [ ] Error logging & debug mode deactivation (`display_errors = Off`)

## 4. Immediate Action Plan
Step-by-step list of tasks to execute before public release or academic submission.

================================================================================
START AUDIT EXECUTION NOW.
================================================================================
```

---

## 🚀 Execution Instructions
To run this audit:
1. Provide the prompt above to the AI assistant in this repository.
2. The AI assistant will explore the codebase using file viewing, shell testing, and build verification tools.
3. Review the generated scorecard and apply any suggested code remediations.
