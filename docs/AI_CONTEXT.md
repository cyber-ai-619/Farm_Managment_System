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
│           ├── security/           # Phase 1: JwtHelper, UserModel, AuthController, AuditLogger
│           ├── farm_field/         # Phase 2: FarmModel, FieldModel, FarmController, FieldController
│           ├── crop/               # Phase 2: CropModel, PlantingModel, CropController
│           ├── livestock/          # Phase 2: LivestockModel, HealthModel, LivestockController
│           ├── irrigation/         # Phase 3: IrrigationModel, IrrigationController
│           ├── inventory/          # Phase 3: InventoryModel, InventoryController
│           ├── equipment/          # Phase 3: EquipmentModel, EquipmentController
│           ├── labour/             # Phase 3: LabourModel, LabourController
│           ├── pest_disease/       # Phase 3: PestModel, TreatmentModel, PestDiseaseController
│           ├── weather/            # Phase 3: WeatherModel, WeatherApiService, WeatherController
│           ├── harvest/            # Phase 4: HarvestModel, HarvestController
│           ├── sales_market/       # Phase 4: SalesModel, MarketModel, SalesMarketController
│           ├── finance/            # Phase 4: FinanceModel, FinanceController
│           ├── suppliers_procurement/ # Phase 4: SupplierModel, ProcurementModel, SuppliersProcurementController
│           └── storage/            # Phase 4: StorageModel, StorageController
├── ffms-frontend/                  # React 19 + Vite frontend application
│   ├── src/
│   │   ├── pages/                  # Page components (Dashboard, Crops, Auth, etc.)
│   │   ├── components/             # Reusable UI components (Navbar, Sidebar, Modal, etc.)
│   │   └── layouts/                # DashboardLayout & Auth layouts
│   └── package.json
├── database/                       # SQL migrations & DB scripts
│   └── migrations/                 # Versioned SQL migrations (001 to 015)
├── docs/                           # Project documentation & specs
│   ├── backend/
│   │   ├── schema.md               # Single source of truth for DB tables & planned schema
│   │   └── phases/                 # Backend Phase completion reports (Phases 1-5)
│   ├── frontend/
│   │   ├── frontend_workflow.md    # Master checklist & progress tracker for frontend phases
│   │   └── phases/                 # Frontend Phase completion reports (Phases 1-5)
│   ├── backend_frontend_integration.md # Master architectural integration plan
│   ├── AI_CONTEXT.md               # THIS FILE — LLM context & developer rules
│   ├── backend_workflow.md         # Master checklist & progress tracker across all 5 backend phases
│   ├── assignment-scope.md         # Original brief requirement groups
│   ├── module-map.md               # Ownership map for feature modules
│   └── team-workflow.md            # Git branching and team rules
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
   - Dynamic route segments (e.g. `{id}`) are extracted using `preg_match()`.
   - A `$pdo = getPdo()` variable is assigned at the top of `index.php` for all Phase 2+ controllers.
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

### ✅ Completed: Phase 2 — Core Farm Entities
- **Migrations**: `002_farms_fields.sql`, `003_crops.sql`, `004_livestock.sql`
- **Tables**: `farms`, `fields`, `plots`, `crops`, `crop_varieties`, `planting_schedules`, `fertilizer_records`, `spraying_schedules`, `breeds`, `animals`, `vaccinations`, `treatments`, `feed_records`, `breeding_records`, `livestock_production`
- **Classes**:
  - `farm_field/`: `FarmModel.php`, `FieldModel.php`, `FarmController.php`, `FieldController.php`
  - `crop/`: `CropModel.php`, `PlantingModel.php`, `CropController.php`
  - `livestock/`: `LivestockModel.php`, `HealthModel.php`, `LivestockController.php`
- **Endpoints**:
  - `GET/POST /api/farms` (Protected)
  - `GET/PUT/DELETE /api/farms/{id}` (Protected)
  - `GET/POST /api/farms/{id}/fields` (Protected)
  - `GET/PUT/DELETE /api/fields/{id}` (Protected)
  - `GET/POST /api/fields/{id}/plots` (Protected)
  - `GET/POST /api/crops` (Protected)
  - `GET/PUT/DELETE /api/crops/{id}` (Protected)
  - `GET/POST /api/crops/{id}/varieties` (Protected)
  - `GET/POST /api/crops/{id}/plantings` (Protected)
  - `GET/POST /api/crops/{id}/fertilizer-records` (Protected)
  - `GET/POST /api/livestock/breeds` (Protected)
  - `GET/POST /api/livestock` (Protected)
  - `GET/PUT/DELETE /api/livestock/{id}` (Protected)
  - `GET/POST /api/livestock/{id}/vaccinations` (Protected)
  - `GET/POST /api/livestock/{id}/treatments` (Protected)
  - `GET/POST /api/livestock/{id}/feed-records` (Protected)
- **Documentation**: [`docs/backend/phases/PHASE_2_FARM_CROP_LIVESTOCK.md`](backend/phases/PHASE_2_FARM_CROP_LIVESTOCK.md)

---

### ✅ Completed: Phase 3 — Operations
- **Migrations**: `005_irrigation.sql`, `006_inventory.sql`, `007_equipment.sql`, `008_labour.sql`, `009_pest_disease.sql`, `010_weather.sql`
- **Tables**: `water_sources`, `irrigation_systems`, `irrigation_schedules`, `water_consumption`, `inventory_items`, `stock_movements`, `equipment`, `maintenance_schedules`, `repair_history`, `fuel_logs`, `workers`, `worker_attendance`, `task_assignments`, `payroll_records`, `pests_diseases`, `scouting_records`, `pest_treatments`, `weather_observations`, `weather_alerts`
- **Classes**:
  - `irrigation/`: `IrrigationModel.php`, `IrrigationController.php`
  - `inventory/`: `InventoryModel.php`, `InventoryController.php`
  - `equipment/`: `EquipmentModel.php`, `EquipmentController.php`
  - `labour/`: `LabourModel.php`, `LabourController.php`
  - `pest_disease/`: `PestModel.php`, `TreatmentModel.php`, `PestDiseaseController.php`
  - `weather/`: `WeatherModel.php`, `WeatherApiService.php`, `WeatherController.php`
- **Endpoints**:
  - `GET/POST /api/farms/{id}/irrigation-sources` (Protected)
  - `GET/POST /api/farms/{id}/irrigation-systems` (Protected)
  - `GET/PUT/DELETE /api/irrigation/systems/{id}` (Protected)
  - `GET/POST /api/irrigation/systems/{id}/schedules` (Protected)
  - `GET/POST /api/irrigation/systems/{id}/consumption` (Protected)
  - `GET /api/irrigation/recommendations/{fieldId}` (Protected)
  - `GET/POST /api/inventory` (Protected)
  - `GET/PUT /api/inventory/{id}` (Protected)
  - `GET /api/inventory/low-stock` (Protected)
  - `POST /api/inventory/{id}/stock-in` (Protected)
  - `POST /api/inventory/{id}/stock-out` (Protected)
  - `GET/POST /api/equipment` (Protected)
  - `GET/PUT/DELETE /api/equipment/{id}` (Protected)
  - `GET/POST /api/equipment/{id}/maintenance` (Protected)
  - `GET/POST /api/equipment/{id}/repairs` (Protected)
  - `GET/POST /api/equipment/{id}/fuel-log` (Protected)
  - `GET/POST /api/workers` (Protected)
  - `GET/PUT /api/workers/{id}` (Protected)
  - `GET /api/labour/attendance` (Protected)
  - `POST /api/workers/{id}/attendance` (Protected)
  - `GET/POST /api/labour/tasks` (Protected)
  - `PATCH /api/labour/tasks/{id}/status` (Protected)
  - `GET/POST /api/pests` (Protected)
  - `GET/POST /api/scouting` (Protected)
  - `GET/POST /api/fields/{id}/treatments` (Protected)
  - `PATCH /api/treatments/{id}/effectiveness` (Protected)
  - `GET /api/pest-disease/outbreaks` (Protected)
  - `GET /api/weather/current/{farmId}` (Protected)
  - `GET /api/weather/forecast/{farmId}` (Protected)
  - `GET /api/weather/history/{farmId}` (Protected)
  - `POST /api/weather/observe/{farmId}` (Protected)
  - `GET/POST /api/weather/alerts/{farmId}` (Protected)
- **Documentation**: [`docs/backend/phases/PHASE_3_OPERATIONS.md`](backend/phases/PHASE_3_OPERATIONS.md)

---

### ✅ Completed: Phase 4 — Produce & Commerce
- **Migrations**: `011_harvest.sql`, `012_sales.sql`, `013_finance.sql`, `014_suppliers.sql`, `015_storage.sql`
- **Tables**: `harvest_records`, `customers`, `sales_orders`, `order_items`, `invoices`, `payments`, `market_prices`, `income_records`, `expense_records`, `loans`, `budgets`, `suppliers`, `supplier_quotations`, `purchase_orders`, `purchase_order_items`, `warehouses`, `storage_batches`, `storage_movements`, `dispatch_records`
- **Classes**:
  - `harvest/`: `HarvestModel.php`, `HarvestController.php`
  - `sales_market/`: `SalesModel.php`, `MarketModel.php`, `SalesMarketController.php`
  - `finance/`: `FinanceModel.php`, `FinanceController.php`
  - `suppliers_procurement/`: `SupplierModel.php`, `ProcurementModel.php`, `SuppliersProcurementController.php`
  - `storage/`: `StorageModel.php`, `StorageController.php`
- **Endpoints**:
  - `GET/POST /api/harvest` (Protected)
  - `GET/PUT /api/harvest/{id}` (Protected)
  - `GET /api/harvest/field/{fieldId}` (Protected)
  - `GET /api/harvest/summary` (Protected)
  - `GET/POST /api/customers` (Protected)
  - `GET/PUT /api/customers/{id}` (Protected)
  - `GET/POST /api/sales-orders` (Protected)
  - `GET /api/sales-orders/{id}` (Protected)
  - `PATCH/PUT /api/sales-orders/{id}` (Protected)
  - `GET /api/invoices` (Protected)
  - `GET /api/invoices/{id}` (Protected)
  - `POST /api/payments` (Protected)
  - `GET/POST /api/market-prices` (Protected)
  - `GET /api/market-prices/trends` (Protected)
  - `GET/POST /api/finance/income` (Protected)
  - `GET/POST /api/finance/expenses` (Protected)
  - `GET /api/finance/profit-loss` (Protected)
  - `GET/POST /api/finance/loans` (Protected)
  - `PATCH/PUT /api/finance/loans/{id}` (Protected)
  - `GET/POST /api/finance/budgets` (Protected)
  - `PATCH/PUT /api/finance/budgets/{id}` (Protected)
  - `GET/POST /api/suppliers` (Protected)
  - `GET/PUT /api/suppliers/{id}` (Protected)
  - `GET/POST /api/suppliers/{id}/quotations` (Protected)
  - `GET/POST /api/purchase-orders` (Protected)
  - `GET /api/purchase-orders/{id}` (Protected)
  - `PATCH/PUT /api/purchase-orders/{id}` (Protected)
  - `GET/POST /api/warehouses` (Protected)
  - `GET/PUT /api/warehouses/{id}` (Protected)
  - `GET/POST /api/storage/batches` (Protected)
  - `GET /api/storage/batches/{id}` (Protected)
  - `GET /api/storage/valuation` (Protected)
  - `POST /api/storage/spoilage` (Protected)
  - `GET/POST /api/storage/dispatches` (Protected)
- **Documentation**: [`docs/backend/phases/PHASE_4_PRODUCE_AND_COMMERCE.md`](backend/phases/PHASE_4_PRODUCE_AND_COMMERCE.md)

---

### ✅ Completed: Phase 5 — Intelligence & Reporting
- **Migrations**: `016_notifications.sql`
- **Tables**: `alerts`, `notification_logs`
- **Classes**:
  - `notifications/`: `AlertModel.php`, `AlertTriggerService.php`, `NotificationController.php`
  - `analytics/`: `AnalyticsController.php`, `ReportController.php`
- **Endpoints**:
  - `GET /api/dashboard` (Protected)
  - `GET /api/analytics/yield` (Protected)
  - `GET /api/analytics/finance` (Protected)
  - `GET /api/analytics/weather-vs-yield` (Protected)
  - `GET/POST /api/alerts` (Protected)
  - `GET /api/alerts/history` (Protected)
  - `POST /api/alerts/scan` (Protected)
  - `PATCH /api/alerts/{id}/dismiss` (Protected)
  - `PATCH /api/alerts/{id}/read` (Protected)
  - `GET /api/reports/crop-production` (Protected)
  - `GET /api/reports/yield` (Protected)
  - `GET /api/reports/livestock` (Protected)
  - `GET /api/reports/financial` (Protected)
  - `GET /api/reports/expenses` (Protected)
  - `GET /api/reports/sales` (Protected)
  - `GET /api/reports/inventory` (Protected)
  - `GET /api/reports/labour` (Protected)
  - `GET /api/reports/irrigation` (Protected)
  - `GET /api/reports/pest-disease` (Protected)
  - `GET /api/reports/equipment` (Protected)
  - `GET /api/reports/profitability` (Protected)
  - `GET /api/reports/farm-performance` (Protected)
- **Documentation**: [`docs/backend/phases/PHASE_5_INTELLIGENCE_AND_REPORTING.md`](backend/phases/PHASE_5_INTELLIGENCE_AND_REPORTING.md)

---

### 🏁 Backend Implementation Complete (18 of 18 Modules Finished)

All 5 development phases of the backend API have been completed, migrated, verified, and integrated into the central router.

| Phase | Scope | Status |
|---|---|:---:|
| **Phase 1** | Security, Users, Roles & Audit Logging | Complete ✅ |
| **Phase 2** | Farms, Fields, Crops, Varieties & Livestock | Complete ✅ |
| **Phase 3** | Irrigation, Inventory, Equipment, Labour, Pest/Disease & Weather | Complete ✅ |
| **Phase 4** | Harvest, Sales Orders, Finance, Suppliers & Warehouses | Complete ✅ |
| **Phase 5** | Executive Dashboard, Alert Scanner & Cross-Module Reports | Complete ✅ |

---

### 🖥️ Frontend Integration Roadmap (`ffms-frontend/`)

| Phase | Scope | Target Services & Components | Status |
|---|---|---|:---:|
| **Phase 1** | Foundation, Auth & Central API Client | `api.js`, `authService.js`, `AuthContext.jsx`, `ProtectedRoute.jsx`, `Login.jsx`, `Register.jsx`, `Navbar.jsx` | Complete ✅ |
| **Phase 2** | Core Farm Operations | `farmService.js`, `cropService.js`, `livestockService.js`, `Modal.jsx`, `Dashboard.jsx`, `Farm.jsx`, `Crops.jsx`, `Livestock.jsx` | Complete ✅ |
| **Phase 3** | Field Operations & Resources | `irrigationService.js`, `inventoryService.js`, `equipmentService.js`, `labourService.js`, `pestDiseaseService.js`, `weatherService.js`, `Irrigation.jsx`, `Inventory.jsx`, `Tools.jsx`, `Labour.jsx`, `PestDisease.jsx`, `Weather.jsx` | Complete ✅ |
| **Phase 4** | Harvest, Commerce, Storage & Finance | `harvestService.js`, `salesService.js`, `financeService.js`, `supplierService.js`, `storageService.js`, `Harvest.jsx`, `Sales.jsx`, `Money.jsx`, `Suppliers.jsx`, `Storage.jsx` | Complete ✅ |
| **Phase 5** | Analytics, Reports & Live Alerts | `reportService.js`, `alertService.js`, `Reports.jsx` (13 reports), `Alerts.jsx`, `Navbar.jsx` | Complete ✅ |

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
5. **Known index.php conventions (Phase 2+)**:
   - `$pdo = getPdo()` is assigned at the top of `index.php` so all controllers can use `$pdo` directly.
   - Dynamic route segments use `preg_match('#^/api/resource/(\d+)$#', $requestUri, $m)` pattern.
   - The stray second `<?php` tag bug has been fixed — never add a second `<?php` when appending routes.

---

## 6. Required Documentation Updates per Phase Completion / Modification

### A. Backend Phase Housekeeping Rules
Whenever a backend development phase is modified or completed, AI assistants MUST ensure the following **5 documentation files** are created or updated:

| # | Document | Action | Content Requirements |
|---|---|---|---|
| 1 | 📄 **Backend Phase Report**<br>`docs/backend/phases/PHASE_<N>_<NAME>.md` | **CREATE** | Full phase report: Executive summary, implemented SQL tables, backend classes created/modified, complete API endpoint specs (JSON payloads), and teammate integration guide. |
| 2 | 🗄️ **Central Database Schema**<br>`docs/backend/schema.md` | **UPDATE** | Move newly implemented SQL table definitions from "Planned Schemas" to "Implemented Schemas" with full column types, primary/foreign keys, and constraints. |
| 3 | 🌾 **Backend Workflow Checklist**<br>`docs/backend_workflow.md` | **UPDATE** | Check off completed tasks (`[x]`) in the phase section and update the Progress Tracker table with `☑` checkmarks across DB, Model, Controller, Routes, and Tested. |
| 4 | 📘 **Main README**<br>`README.md` | **UPDATE** | Update the API Endpoints Overview table with any new public or protected endpoints added during the phase. |
| 5 | 🤖 **AI Assistant Context**<br>`docs/AI_CONTEXT.md` | **UPDATE** | Update Section 4 ("Current Progress & Phase Roadmap") to reflect the newly completed phase and its deliverables. |

### B. Frontend Phase Housekeeping Rules
Whenever a frontend integration phase is completed or modified, AI assistants MUST ensure the following **4 documentation files** are created or updated:

| # | Document | Action | Content Requirements |
|---|---|---|---|
| 1 | 📄 **Frontend Phase Report**<br>`docs/frontend/phases/PHASE_<N>_<NAME>.md` | **CREATE** | Full frontend phase report: Implemented React services, component changes, state management/context updates, route guards/RBAC, UI screenshot/mock flows, and API integration tests. |
| 2 | 🖥️ **Frontend Workflow Checklist**<br>`docs/frontend/frontend_workflow.md` | **UPDATE** | Check off completed tasks (`[x]`) in the phase section and update the Master Frontend Progress Tracker table (`☑` across Services, Pages, Auth/RBAC, and Tested). |
| 3 | 🔌 **Integration Blueprint**<br>`docs/backend_frontend_integration.md` | **UPDATE** | Mark corresponding frontend components and services as connected with live API endpoints. |
| 4 | 🤖 **AI Assistant Context**<br>`docs/AI_CONTEXT.md` | **UPDATE** | Update the Frontend Integration Roadmap table in Section 4 with phase completion deliverables and status. |



