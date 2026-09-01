# 🌾 Backend Development Workflow — Farm Management System (FFMS)

> **Stack**: Plain PHP · MySQL · JWT Auth · No framework (use `backend/src/Modules/<module>/`)
> **Entry point**: [`backend/public/index.php`](backend/public/index.php) — all routes are added here.
> **Shared logic**: [`backend/src/bootstrap.php`](backend/src/bootstrap.php)

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
> [`backend/src/Modules/security/`](backend/src/Modules/security)

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

## Phase 2 — Core Farm Entities

### 🏡 Module 2: Farm & Field Management
> [`backend/src/Modules/farm_field/`](backend/src/Modules/farm_field)

- [ ] Migration `002_farms_fields.sql`
  - Tables: `farms`, `fields`, `plots`
  - Fields include: GPS coordinates, field size (ha), soil type, soil condition
- [ ] `FarmModel.php` — CRUD for farms
- [ ] `FieldModel.php` — CRUD for fields/plots, crop rotation history
- [ ] Routes:
  - `GET/POST /api/farms`
  - `GET/PUT/DELETE /api/farms/{id}`
  - `GET/POST /api/farms/{id}/fields`
  - `GET/PUT/DELETE /api/fields/{id}`
- [ ] Test: create a farm, attach multiple fields

---

### 🌱 Module 3: Crop Management
> [`backend/src/Modules/crop/`](backend/src/Modules/crop)

- [ ] Migration `003_crops.sql`
  - Tables: `crops`, `crop_varieties`, `planting_schedules`, `fertilizer_records`, `spraying_schedules`
- [ ] `CropModel.php` — crop & variety registration, planting density/spacing
- [ ] `PlantingModel.php` — planting schedules, expected harvest dates
- [ ] Routes:
  - `GET/POST /api/crops`
  - `GET/PUT/DELETE /api/crops/{id}`
  - `GET/POST /api/crops/{id}/plantings`
  - `GET/POST /api/crops/{id}/fertilizer-records`
- [ ] Test: register a crop, create a planting schedule

---

### 🐄 Module 4: Livestock Management
> [`backend/src/Modules/livestock/`](backend/src/Modules/livestock)

- [ ] Migration `004_livestock.sql`
  - Tables: `animals`, `breeds`, `vaccinations`, `treatments`, `feed_records`, `breeding_records`, `livestock_production`
- [ ] `LivestockModel.php` — animal registration, birth/death records, weight tracking
- [ ] `HealthModel.php` — vaccination schedules, disease/treatment records
- [ ] Routes:
  - `GET/POST /api/livestock`
  - `GET/PUT/DELETE /api/livestock/{id}`
  - `GET/POST /api/livestock/{id}/vaccinations`
  - `GET/POST /api/livestock/{id}/treatments`
  - `GET/POST /api/livestock/{id}/feed-records`
- [ ] Test: add an animal, log a vaccination

---

## Phase 3 — Operations

### 💧 Module 5: Irrigation & Water Management
> [`backend/src/Modules/irrigation/`](backend/src/Modules/irrigation)

- [ ] Migration `005_irrigation.sql`
  - Tables: `irrigation_systems`, `water_sources`, `irrigation_schedules`, `water_consumption`
  - System types: drip, sprinkler, etc.
- [ ] `IrrigationModel.php`
- [ ] Routes:
  - `GET/POST /api/irrigation/systems`
  - `GET/POST /api/irrigation/schedules`
  - `GET /api/irrigation/consumption`
  - `GET /api/irrigation/recommendations` *(weather-based, can be stub)*
- [ ] Test: register a system, create a schedule

---

### 📦 Module 6: Farm Inventory & Inputs
> [`backend/src/Modules/inventory/`](backend/src/Modules/inventory)

- [ ] Migration `006_inventory.sql`
  - Tables: `inventory_items`, `stock_movements`
  - Categories: seeds, fertilizers, chemicals/pesticides, animal feed, vet medicines, packaging, fuel, tools
  - Fields: `quantity`, `unit`, `expiry_date`, `low_stock_threshold`
- [ ] `InventoryModel.php` — stock-in/stock-out, expiry tracking
- [ ] Routes:
  - `GET/POST /api/inventory`
  - `GET/PUT/DELETE /api/inventory/{id}`
  - `POST /api/inventory/{id}/stock-in`
  - `POST /api/inventory/{id}/stock-out`
  - `GET /api/inventory/low-stock`
- [ ] Test: add item, do a stock-in and a stock-out, check low-stock

---

### 🚜 Module 7: Equipment & Machinery
> [`backend/src/Modules/equipment/`](backend/src/Modules/equipment)

- [ ] Migration `007_equipment.sql`
  - Tables: `equipment`, `maintenance_schedules`, `repair_history`, `fuel_consumption`
  - Fields: `name`, `type`, `purchase_date`, `depreciation_value`, `operating_hours`
- [ ] `EquipmentModel.php`
- [ ] Routes:
  - `GET/POST /api/equipment`
  - `GET/PUT/DELETE /api/equipment/{id}`
  - `GET/POST /api/equipment/{id}/maintenance`
  - `GET/POST /api/equipment/{id}/repairs`
  - `GET /api/equipment/{id}/fuel-log`
- [ ] Test: register a tractor, log maintenance

---

### 👷 Module 8: Labour & Employee Management
> [`backend/src/Modules/labour/`](backend/src/Modules/labour)

- [ ] Migration `008_labour.sql`
  - Tables: `workers`, `attendance`, `task_assignments`, `labour_costs`, `payroll`
- [ ] `LabourModel.php` — worker registration, roles, attendance, daily tasks
- [ ] Routes:
  - `GET/POST /api/workers`
  - `GET/PUT/DELETE /api/workers/{id}`
  - `POST /api/workers/{id}/attendance`
  - `GET/POST /api/tasks`
  - `GET /api/labour/costs`
- [ ] Test: register a worker, log attendance, assign a task

---

### 🐛 Module 9: Pest & Disease Management
> [`backend/src/Modules/pest_disease/`](backend/src/Modules/pest_disease)

- [ ] Migration `009_pest_disease.sql`
  - Tables: `pests`, `diseases`, `scouting_records`, `treatment_records`, `spraying_schedules`
- [ ] `PestModel.php` — pest/disease database, field scouting reports
- [ ] `TreatmentModel.php` — chemical application records, effectiveness tracking
- [ ] Routes:
  - `GET/POST /api/pests`
  - `GET/POST /api/diseases`
  - `GET/POST /api/scouting`
  - `GET/POST /api/treatments`
  - `GET /api/pest-disease/outbreaks`
- [ ] Test: log a scouting event, record a treatment

---

### 🌦️ Module 10: Weather & Environmental Monitoring
> [`backend/src/Modules/weather/`](backend/src/Modules/weather)

- [ ] Migration `010_weather.sql`
  - Tables: `weather_observations`, `weather_alerts`
- [ ] `WeatherModel.php` — store observations, retrieve history
- [ ] `WeatherApiService.php` — wrapper to call an external Weather API (e.g. Open-Meteo, free)
- [ ] Routes:
  - `GET /api/weather/current`
  - `GET /api/weather/forecast`
  - `GET /api/weather/history`
  - `GET /api/weather/alerts`
- [ ] Test: fetch current weather, check historical data

---

## Phase 4 — Produce & Commerce

### 🌾 Module 11: Harvest Management
> [`backend/src/Modules/harvest/`](backend/src/Modules/harvest)

*Depends on: Crops (Phase 2), Fields (Phase 2)*

- [ ] Migration `011_harvest.sql`
  - Tables: `harvest_records`, `harvest_quality`
  - Fields: `field_id`, `crop_id`, `quantity_kg`, `grade`, `loss_kg`, `actual_date`, `expected_date`
- [ ] `HarvestModel.php` — harvest scheduling, yield per field/hectare, actual vs expected yield
- [ ] Routes:
  - `GET/POST /api/harvests`
  - `GET/PUT/DELETE /api/harvests/{id}`
  - `GET /api/harvests/yield-report`
- [ ] Test: record a harvest, compare expected vs actual yield

---

### 🛒 Module 12: Market & Sales Management
> [`backend/src/Modules/sales_market/`](backend/src/Modules/sales_market)

*Depends on: Crops, Harvest*

- [ ] Migration `012_sales.sql`
  - Tables: `customers`, `sales_orders`, `order_items`, `invoices`, `payments`, `market_prices`
- [ ] `SalesModel.php` — buyer registration, sales orders, invoices, payments
- [ ] `MarketModel.php` — market price monitoring, crop demand, best selling periods
- [ ] Routes:
  - `GET/POST /api/customers`
  - `GET/POST /api/sales`
  - `GET/PUT /api/sales/{id}`
  - `GET/POST /api/invoices`
  - `POST /api/invoices/{id}/pay`
  - `GET /api/market-prices`
- [ ] Test: create a customer, create a sale, mark invoice as paid

---

### 💰 Module 13: Financial Management
> [`backend/src/Modules/finance/`](backend/src/Modules/finance)

*Depends on: Sales, Labour, Equipment, Inventory*

- [ ] Migration `013_finance.sql`
  - Tables: `income_records`, `expense_records`, `loans`, `budgets`
  - Expense categories: input costs, labour, fuel, equipment
- [ ] `FinanceModel.php` — income/expenditure tracking, P&L, ROI, cost per hectare/kg
- [ ] Routes:
  - `GET/POST /api/finance/income`
  - `GET/POST /api/finance/expenses`
  - `GET /api/finance/profit-loss`
  - `GET/POST /api/finance/loans`
  - `GET/POST /api/finance/budgets`
- [ ] Test: log income and expenses, check P&L report

---

### 🏪 Module 14: Supplier & Procurement Management
> [`backend/src/Modules/suppliers_procurement/`](backend/src/Modules/suppliers_procurement)

- [ ] Migration `014_suppliers.sql`
  - Tables: `suppliers`, `supplier_quotations`, `purchase_orders`, `purchase_history`
- [ ] `SupplierModel.php` — supplier registration, performance tracking, quotes
- [ ] `ProcurementModel.php` — purchase orders, approval workflow, payment tracking
- [ ] Routes:
  - `GET/POST /api/suppliers`
  - `GET/PUT/DELETE /api/suppliers/{id}`
  - `GET/POST /api/purchase-orders`
  - `PUT /api/purchase-orders/{id}/approve`
  - `GET /api/suppliers/{id}/performance`
- [ ] Test: add supplier, create and approve a purchase order

---

### 🏭 Module 15: Storage & Post-Harvest Management
> [`backend/src/Modules/storage/`](backend/src/Modules/storage)

*Depends on: Harvest*

- [ ] Migration `015_storage.sql`
  - Tables: `warehouses`, `storage_batches`, `stock_movements`, `dispatch_records`
  - Fields: `produce_grade`, `quality_status`, `spoilage_kg`, `storage_duration`
- [ ] `StorageModel.php` — warehouse management, produce grading, spoilage tracking
- [ ] Routes:
  - `GET/POST /api/warehouses`
  - `GET/POST /api/storage/batches`
  - `PUT /api/storage/batches/{id}`
  - `GET /api/storage/inventory-value`
  - `POST /api/storage/dispatch`
- [ ] Test: store a harvest batch, record spoilage, dispatch

---

## Phase 5 — Intelligence & Reporting

### 📊 Module 16: Dashboard & Analytics
> [`backend/src/Modules/analytics/`](backend/src/Modules/analytics)

*Depends on: all operational modules*

- [ ] `AnalyticsController.php` — aggregate queries across modules
- [ ] Routes:
  - `GET /api/dashboard` — summary stats (acreage, active crops, livestock count, expenses, revenue, profit, inventory levels)
  - `GET /api/analytics/yield` — yield trends over time
  - `GET /api/analytics/finance` — financial overview
  - `GET /api/analytics/weather-vs-yield` — correlation data
- [ ] Test: call `/api/dashboard` and verify all summary fields are present

---

### 🔔 Module 17: Notifications & Alerts
> [`backend/src/Modules/notifications/`](backend/src/Modules/notifications)

- [ ] Migration `016_notifications.sql`
  - Tables: `alerts`, `notification_log`
  - Alert types: planting dates, fertilizer, spraying, irrigation, vaccinations, disease outbreaks, low inventory, expiring chemicals, equipment maintenance, harvest, weather risks, market opportunities
- [ ] `AlertModel.php` — create, read, dismiss alerts
- [ ] `AlertTriggerService.php` — scan other module data and generate alerts (e.g. low stock, overdue maintenance)
- [ ] Routes:
  - `GET /api/alerts` — list active alerts for current user
  - `POST /api/alerts/{id}/dismiss`
  - `GET /api/alerts/history`
- [ ] Test: trigger a low-stock condition, verify alert appears

---

### 📋 Module 18: Reports & Analytics
> *(Uses `analytics/` and cross-module queries)*

- [ ] `ReportController.php`
- [ ] Routes:
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
- [ ] Each route should accept `?from=YYYY-MM-DD&to=YYYY-MM-DD` query params
- [ ] Test: run each report endpoint with a date range

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
// Example — Farm routes
if ($requestUri === '/api/farms' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    $ctrl = new FarmController($pdo);
    $ctrl->index();
}
if ($requestUri === '/api/farms' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    $ctrl = new FarmController($pdo);
    $ctrl->store();
}
```

---

## Progress tracker

| # | Module | DB | Model | Controller | Routes | Tested |
|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | Security & Users | ☑ | ☑ | ☑ | ☑ | ☑ |
| 2 | Farm & Field | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Crop | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Livestock | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Irrigation | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Inventory | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Equipment | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Labour | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Pest & Disease | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Weather | ☐ | ☐ | ☐ | ☐ | ☐ |
| 11 | Harvest | ☐ | ☐ | ☐ | ☐ | ☐ |
| 12 | Sales & Market | ☐ | ☐ | ☐ | ☐ | ☐ |
| 13 | Finance | ☐ | ☐ | ☐ | ☐ | ☐ |
| 14 | Suppliers | ☐ | ☐ | ☐ | ☐ | ☐ |
| 15 | Storage | ☐ | ☐ | ☐ | ☐ | ☐ |
| 16 | Dashboard | ☐ | — | ☐ | ☐ | ☐ |
| 17 | Notifications | ☐ | ☐ | ☐ | ☐ | ☐ |
| 18 | Reports | — | — | ☐ | ☐ | ☐ |
