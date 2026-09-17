# 🌾 Backend Development Workflow — Farm Management System (FFMS)

> **Stack**: Plain PHP · MySQL · JWT Auth · No framework (use `backend/src/Modules/<module>/`)
> **Entry point**: [`backend/public/index.php`](../backend/public/index.php) — all routes are added here.
> **Shared logic**: [`backend/src/bootstrap.php`](../backend/src/bootstrap.php)

---

## How to work through this list

Each module follows the same repeating pattern:

1. **DB** — Add a migration SQL file to `database/migrations/`
2. **Model** — Create a `Model.php` class in the module folder (PDO queries)
3. **Controller** — Create a `Controller.php` class (handles request → calls model → calls `respond()`)
4. **Routes** — Register `GET/POST/PUT/DELETE` routes in `index.php`
5. **Test** — Hit the endpoints with a REST client (e.g. Postman / Thunder Client / curl)

> [!IMPORTANT]
> Always work the modules in the order below. Later modules have **foreign key dependencies** on earlier ones (e.g., Crops depend on Farms; Harvest depends on Crops and Fields).

---

## Phase 1 — Foundation (Completed ✅)

### 🔐 Module 1: Security & User Management
> [`backend/src/Modules/security/`](../backend/src/Modules/security)

This is the **gateway module** — all other endpoints are protected behind auth.

- [x] Create `database/migrations/001_users_roles.sql`
  - Tables: `users`, `roles`, `audit_logs`
  - Fields: `id`, `name`, `email`, `password_hash`, `role_id`, `created_at`
  - Roles: `admin`, `farm_owner`, `farm_manager`, `agronomist`, `worker`, `accountant`
- [x] Create `security/UserModel.php` — register, find by email, hash/verify password
- [x] Create `security/AuthController.php`
  - `POST /api/auth/register` — create user, return token
  - `POST /api/auth/login` — verify credentials, return JWT token
  - `GET /api/auth/me` — return current user (protected)
  - `POST /api/auth/logout`
- [x] Create `security/JwtHelper.php` — zero-dependency HMAC-SHA256 JWT helper
- [x] Add `requireAuth()` & `requireRole()` middleware helpers to `bootstrap.php`
- [x] Create `security/AuditLogger.php` — write to `audit_logs` table
- [x] Test: register → login → call protected `/me` route with token (Verified working ✅)

---

## Phase 2 — Core Farm Entities (Completed ✅)

### 🏡 Module 2: Farm & Field Management
> [`backend/src/Modules/farm_field/`](../backend/src/Modules/farm_field)

- [x] Migration `002_farms_fields.sql`
  - Tables: `farms`, `fields`, `plots`
  - Fields include: GPS coordinates, field size (ha), soil type, soil condition
- [x] `FarmModel.php` — CRUD for farms
- [x] `FieldModel.php` — CRUD for fields/plots, crop rotation history
- [x] `FarmController.php` & `FieldController.php`
- [x] Routes:
  - `GET/POST /api/farms`
  - `GET/PUT/DELETE /api/farms/{id}`
  - `GET/POST /api/farms/{id}/fields`
  - `GET/PUT/DELETE /api/fields/{id}`
  - `GET/POST /api/fields/{id}/plots`
- [x] Test: create a farm, attach multiple fields, add plots (Verified working ✅)

---

### 🌱 Module 3: Crop Management
> [`backend/src/Modules/crop/`](../backend/src/Modules/crop)

- [x] Migration `003_crops.sql`
  - Tables: `crops`, `crop_varieties`, `planting_schedules`, `fertilizer_records`, `spraying_schedules`
- [x] `CropModel.php` — crop & variety registration, planting density/spacing
- [x] `PlantingModel.php` — planting schedules, expected harvest dates
- [x] `CropController.php`
- [x] Routes:
  - `GET/POST /api/crops`
  - `GET/PUT/DELETE /api/crops/{id}`
  - `GET/POST /api/crops/{id}/varieties`
  - `GET/POST /api/crops/{id}/plantings`
  - `GET/POST /api/crops/{id}/fertilizer-records`
- [x] Test: register a crop, create a planting schedule (Verified working ✅)

---

### 🐄 Module 4: Livestock Management
> [`backend/src/Modules/livestock/`](../backend/src/Modules/livestock)

- [x] Migration `004_livestock.sql`
  - Tables: `animals`, `breeds`, `vaccinations`, `treatments`, `feed_records`, `breeding_records`, `livestock_production`
- [x] `LivestockModel.php` — animal registration, birth/death records, weight tracking
- [x] `HealthModel.php` — vaccination schedules, disease/treatment records
- [x] `LivestockController.php`
- [x] Routes:
  - `GET/POST /api/livestock/breeds`
  - `GET/POST /api/livestock`
  - `GET/PUT/DELETE /api/livestock/{id}`
  - `GET/POST /api/livestock/{id}/vaccinations`
  - `GET/POST /api/livestock/{id}/treatments`
  - `GET/POST /api/livestock/{id}/feed-records`
- [x] Test: add an animal, log a vaccination, log a treatment (Verified working ✅)

---

## Phase 3 — Operations (Completed ✅)

### 💧 Module 5: Irrigation & Water Management
> [`backend/src/Modules/irrigation/`](../backend/src/Modules/irrigation)

- [x] Migration `005_irrigation.sql`
  - Tables: `irrigation_systems`, `water_sources`, `irrigation_schedules`, `water_consumption`
  - System types: drip, sprinkler, etc.
- [x] `IrrigationModel.php`
- [x] `IrrigationController.php`
- [x] Routes:
  - `GET/POST /api/farms/{id}/irrigation-sources`
  - `GET/POST /api/farms/{id}/irrigation-systems`
  - `GET/PUT/DELETE /api/irrigation/systems/{id}`
  - `GET/POST /api/irrigation/systems/{id}/schedules`
  - `GET/POST /api/irrigation/systems/{id}/consumption`
  - `GET /api/irrigation/recommendations/{fieldId}`
- [x] Test: register a system, create a schedule, log consumption (Verified working ✅)

---

### 📦 Module 6: Farm Inventory & Inputs
> [`backend/src/Modules/inventory/`](../backend/src/Modules/inventory)

- [x] Migration `006_inventory.sql`
  - Tables: `inventory_items`, `stock_movements`
  - Categories: seeds, fertilizers, chemicals/pesticides, animal feed, vet medicines, packaging, fuel, tools
  - Fields: `quantity_on_hand`, `unit_of_measure`, `expiry_date`, `reorder_level`
- [x] `InventoryModel.php` — stock-in/stock-out, expiry tracking
- [x] `InventoryController.php`
- [x] Routes:
  - `GET/POST /api/inventory`
  - `GET/PUT /api/inventory/{id}`
  - `POST /api/inventory/{id}/stock-in`
  - `POST /api/inventory/{id}/stock-out`
  - `GET /api/inventory/low-stock`
- [x] Test: add item, do a stock-in and a stock-out, check low-stock (Verified working ✅)

---

### 🚜 Module 7: Equipment & Machinery
> [`backend/src/Modules/equipment/`](../backend/src/Modules/equipment)

- [x] Migration `007_equipment.sql`
  - Tables: `equipment`, `maintenance_schedules`, `repair_history`, `fuel_logs`
  - Fields: `name`, `type`, `purchase_date`, `operating_hours`, `fuel_type`, `status`
- [x] `EquipmentModel.php`
- [x] `EquipmentController.php`
- [x] Routes:
  - `GET/POST /api/equipment`
  - `GET/PUT/DELETE /api/equipment/{id}`
  - `GET/POST /api/equipment/{id}/maintenance`
  - `GET/POST /api/equipment/{id}/repairs`
  - `GET/POST /api/equipment/{id}/fuel-log`
- [x] Test: register a tractor, schedule maintenance, log repairs and fuel (Verified working ✅)

---

### 👷 Module 8: Labour & Employee Management
> [`backend/src/Modules/labour/`](../backend/src/Modules/labour)

- [x] Migration `008_labour.sql`
  - Tables: `workers`, `worker_attendance`, `task_assignments`, `payroll_records`
- [x] `LabourModel.php` — worker registration, roles, attendance, daily tasks
- [x] `LabourController.php`
- [x] Routes:
  - `GET/POST /api/workers`
  - `GET/PUT /api/workers/{id}`
  - `GET /api/labour/attendance`
  - `POST /api/workers/{id}/attendance`
  - `GET/POST /api/labour/tasks`
  - `PATCH /api/labour/tasks/{id}/status`
- [x] Test: register a worker, log attendance, assign a task (Verified working ✅)

---

### 🐛 Module 9: Pest & Disease Management
> [`backend/src/Modules/pest_disease/`](../backend/src/Modules/pest_disease)

- [x] Migration `009_pest_disease.sql`
  - Tables: `pests_diseases`, `scouting_records`, `pest_treatments`
- [x] `PestModel.php` — pest/disease database, field scouting reports
- [x] `TreatmentModel.php` — chemical application records, effectiveness tracking
- [x] `PestDiseaseController.php`
- [x] Routes:
  - `GET/POST /api/pests`
  - `GET/POST /api/scouting`
  - `GET/POST /api/fields/{id}/treatments`
  - `PATCH /api/treatments/{id}/effectiveness`
  - `GET /api/pest-disease/outbreaks`
- [x] Test: log a scouting event, record a treatment, check outbreaks (Verified working ✅)

---

### 🌦️ Module 10: Weather & Environmental Monitoring
> [`backend/src/Modules/weather/`](../backend/src/Modules/weather)

- [x] Migration `010_weather.sql`
  - Tables: `weather_observations`, `weather_alerts`
- [x] `WeatherModel.php` — store observations, retrieve history
- [x] `WeatherApiService.php` — wrapper to call external Open-Meteo API
- [x] `WeatherController.php`
- [x] Routes:
  - `GET /api/weather/current/{farmId}`
  - `GET /api/weather/forecast/{farmId}`
  - `GET /api/weather/history/{farmId}`
  - `POST /api/weather/observe/{farmId}`
  - `GET/POST /api/weather/alerts/{farmId}`
- [x] Test: fetch current weather, 7-day forecast, log observation, view alerts (Verified working ✅)

---

## Phase 4 — Produce & Commerce (Completed ✅)

### 🌾 Module 11: Harvest Management
> [`backend/src/Modules/harvest/`](../backend/src/Modules/harvest)

*Depends on: Crops (Phase 2), Fields (Phase 2)*

- [x] Migration `011_harvest.sql`
  - Tables: `harvest_records`
  - Fields: `field_id`, `crop_id`, `quantity_kg`, `quality_grade`, `loss_kg`, `harvest_date`, `expected_yield_kg`
- [x] `HarvestModel.php` — harvest records, yields, loss tracking, field history
- [x] `HarvestController.php`
- [x] Routes:
  - `GET/POST /api/harvest`
  - `GET/PUT /api/harvest/{id}`
  - `GET /api/harvest/field/{fieldId}`
  - `GET /api/harvest/summary`
- [x] Test: record a harvest, view yield summaries and field logs (Verified working ✅)

---

### 🛒 Module 12: Market & Sales Management
> [`backend/src/Modules/sales_market/`](../backend/src/Modules/sales_market)

*Depends on: Crops, Harvest*

- [x] Migration `012_sales.sql`
  - Tables: `customers`, `sales_orders`, `order_items`, `invoices`, `payments`, `market_prices`
- [x] `SalesModel.php` — buyer registration, sales orders, order items, invoices, payments
- [x] `MarketModel.php` — market price monitoring, commodity price trends
- [x] `SalesMarketController.php`
- [x] Routes:
  - `GET/POST /api/customers`
  - `GET/PUT /api/customers/{id}`
  - `GET/POST /api/sales-orders`
  - `GET/PUT/PATCH /api/sales-orders/{id}`
  - `GET /api/invoices`
  - `GET /api/invoices/{id}`
  - `POST /api/payments`
  - `GET/POST /api/market-prices`
  - `GET /api/market-prices/trends`
- [x] Test: create customer, order with items, auto-invoice, record payment (Verified working ✅)

---

### 💰 Module 13: Financial Management
> [`backend/src/Modules/finance/`](../backend/src/Modules/finance)

*Depends on: Sales, Labour, Equipment, Inventory*

- [x] Migration `013_finance.sql`
  - Tables: `income_records`, `expense_records`, `loans`, `budgets`
- [x] `FinanceModel.php` — income/expenditure tracking, P&L aggregation, loan liabilities, budgets
- [x] `FinanceController.php`
- [x] Routes:
  - `GET/POST /api/finance/income`
  - `GET/POST /api/finance/expenses`
  - `GET /api/finance/profit-loss`
  - `GET/POST /api/finance/loans`
  - `PUT/PATCH /api/finance/loans/{id}`
  - `GET/POST /api/finance/budgets`
  - `PUT/PATCH /api/finance/budgets/{id}`
- [x] Test: log income/expenses, generate P&L statement, budget and loan tracking (Verified working ✅)

---

### 🏪 Module 14: Supplier & Procurement Management
> [`backend/src/Modules/suppliers_procurement/`](../backend/src/Modules/suppliers_procurement)

- [x] Migration `014_suppliers.sql`
  - Tables: `suppliers`, `supplier_quotations`, `purchase_orders`, `purchase_order_items`
- [x] `SupplierModel.php` — supplier registration, ratings, terms, quotations
- [x] `ProcurementModel.php` — purchase orders, order line items, approval status workflow
- [x] `SuppliersProcurementController.php`
- [x] Routes:
  - `GET/POST /api/suppliers`
  - `GET/PUT /api/suppliers/{id}`
  - `GET/POST /api/suppliers/{id}/quotations`
  - `GET/POST /api/purchase-orders`
  - `GET /api/purchase-orders/{id}`
  - `PUT/PATCH /api/purchase-orders/{id}`
- [x] Test: add supplier, register quotes, create and approve PO (Verified working ✅)

---

### 🏭 Module 15: Storage & Post-Harvest Management
> [`backend/src/Modules/storage/`](../backend/src/Modules/storage)

*Depends on: Harvest*

- [x] Migration `015_storage.sql`
  - Tables: `warehouses`, `storage_batches`, `storage_movements`, `dispatch_records`
- [x] `StorageModel.php` — warehouse telemetry, batch tracking, valuation, spoilage write-offs, dispatch
- [x] `StorageController.php`
- [x] Routes:
  - `GET/POST /api/warehouses`
  - `GET/PUT /api/warehouses/{id}`
  - `GET/POST /api/storage/batches`
  - `GET /api/storage/batches/{id}`
  - `GET /api/storage/valuation`
  - `POST /api/storage/spoilage`
  - `GET/POST /api/storage/dispatches`
- [x] Test: intake batch, inventory valuation, spoilage deduct, order dispatch (Verified working ✅)

---

## Phase 5 — Intelligence & Reporting (Completed ✅)

### 📊 Module 16: Dashboard & Analytics
> [`backend/src/Modules/analytics/`](../backend/src/Modules/analytics)

*Depends on: all operational modules*

- [x] `AnalyticsController.php` — aggregate queries across modules
- [x] Routes:
  - `GET /api/dashboard` — summary stats (acreage, active crops, livestock count, expenses, revenue, profit, inventory levels)
  - `GET /api/analytics/yield` — yield trends over time
  - `GET /api/analytics/finance` — financial overview
  - `GET /api/analytics/weather-vs-yield` — correlation data
- [x] Test: call `/api/dashboard` and verify all summary fields are present (Verified working ✅)

---

### 🔔 Module 17: Notifications & Alerts
> [`backend/src/Modules/notifications/`](../backend/src/Modules/notifications)

- [x] Migration `016_notifications.sql`
  - Tables: `alerts`, `notification_logs`
  - Alert types: low inventory, overdue equipment maintenance, active weather warnings, overdue tasks, pest outbreaks, upcoming harvests
- [x] `AlertModel.php` — create, read, dismiss alerts
- [x] `AlertTriggerService.php` — scan module data and generate alerts (e.g. low stock, overdue maintenance)
- [x] `NotificationController.php`
- [x] Routes:
  - `GET/POST /api/alerts` — list active alerts (auto-runs diagnostic scan)
  - `GET /api/alerts/history`
  - `POST /api/alerts/scan`
  - `PATCH /api/alerts/{id}/dismiss`
  - `PATCH /api/alerts/{id}/read`
- [x] Test: trigger a low-stock condition, verify alert appears (Verified working ✅)

---

### 📋 Module 18: Reports & Analytics
> *(Uses `analytics/` and cross-module queries)*

- [x] `ReportController.php`
- [x] Routes:
  - `GET /api/reports/crop-production`
  - `GET /api/reports/yield`
  - `GET /api/reports/livestock`
  - `GET /api/reports/financial`
  - `GET /api/reports/expenses`
  - `GET /api/reports/sales`
  - `GET /api/reports/inventory`
  - `GET /api/reports/labour`
  - `GET /api/reports/irrigation`
  - `GET /api/reports/pest-disease`
  - `GET /api/reports/equipment`
  - `GET /api/reports/profitability`
  - `GET /api/reports/farm-performance`
- [x] Each route accepts `?farm_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD` query params
- [x] Test: run report endpoints with date range filters (Verified working ✅)

---

## Quick-reference: Suggested file layout per module

```
backend/src/Modules/farm_field/
├── FarmModel.php          # PDO queries
├── FieldModel.php
├── FarmController.php     # Request → Model → respond()
└── FieldController.php
```

---

## Route registration pattern (in `index.php`)

```php
// Assign $pdo once at the top of index.php (required for Phase 2+ controllers)
$pdo = getPdo();

// Simple route
if ($requestUri === '/api/farms' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    $ctrl = new FarmController($pdo);
    $ctrl->index();
}

// Dynamic route with ID segment
if (preg_match('#^/api/farms/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    $ctrl = new FarmController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}
```

---

## Progress tracker

| # | Module | DB | Model | Controller | Routes | Tested |
|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | Security & Users | ☑ | ☑ | ☑ | ☑ | ☑ |
| 2 | Farm & Field | ☑ | ☑ | ☑ | ☑ | ☑ |
| 3 | Crop | ☑ | ☑ | ☑ | ☑ | ☑ |
| 4 | Livestock | ☑ | ☑ | ☑ | ☑ | ☑ |
| 5 | Irrigation | ☑ | ☑ | ☑ | ☑ | ☑ |
| 6 | Inventory | ☑ | ☑ | ☑ | ☑ | ☑ |
| 7 | Equipment | ☑ | ☑ | ☑ | ☑ | ☑ |
| 8 | Labour | ☑ | ☑ | ☑ | ☑ | ☑ |
| 9 | Pest & Disease | ☑ | ☑ | ☑ | ☑ | ☑ |
| 10 | Weather | ☑ | ☑ | ☑ | ☑ | ☑ |
| 11 | Harvest | ☑ | ☑ | ☑ | ☑ | ☑ |
| 12 | Sales & Market | ☑ | ☑ | ☑ | ☑ | ☑ |
| 13 | Finance | ☑ | ☑ | ☑ | ☑ | ☑ |
| 14 | Suppliers | ☑ | ☑ | ☑ | ☑ | ☑ |
| 15 | Storage | ☑ | ☑ | ☑ | ☑ | ☑ |
| 16 | Dashboard | — | — | ☑ | ☑ | ☑ |
| 17 | Notifications | ☑ | ☑ | ☑ | ☑ | ☑ |
| 18 | Reports | — | — | ☑ | ☑ | ☑ |

