# 🌾 Farm Management System (FFMS)

An Intelligent Farm Management System built with plain PHP 8+, MySQL, and React 19.

---

## 🚀 Quick Start

### Option A — XAMPP (Windows/Mac/Linux)

1. Clone the repo into your XAMPP `htdocs` folder (or anywhere).
2. Start **Apache** and **MySQL** in the XAMPP control panel.
3. Open **phpMyAdmin** (`http://localhost/phpmyadmin`), create a database called `farm_management`.
4. Run the migrations in order from `database/migrations/`.
5. Copy `.env.example` to `.env` and fill in your DB credentials if they differ from defaults.
6. Start the PHP dev server:
   ```bash
   cd backend
   php -S localhost:8000 -t public public/index.php
   ```
7. In a separate terminal, start the frontend:
   ```bash
   cd ffms-frontend
   npm install
   npm run dev
   ```

### Option B — Docker

```bash
docker compose up --build
```

---

### Option A: Quick-Start 1-Step Setup (Recommended for Local Teams)
Import the consolidated schema containing all 59 tables and 16 phases:
```bash
mysql -u root -p < database/full_schema.sql
```
*Or via phpMyAdmin: Go to **Import** → Choose `database/full_schema.sql` → Click **Import**.*

### Option B: Step-by-Step Migrations
Run individual migration files in numerical order:

```
database/migrations/001_users_roles.sql      ← Phase 1 (run first)
database/migrations/002_farms_fields.sql     ← Phase 2
database/migrations/003_crops.sql            ← Phase 2
database/migrations/004_livestock.sql        ← Phase 2
database/migrations/005_irrigation.sql       ← Phase 3
database/migrations/006_inventory.sql        ← Phase 3
database/migrations/007_equipment.sql        ← Phase 3
database/migrations/008_labour.sql           ← Phase 3
database/migrations/009_pest_disease.sql     ← Phase 3
database/migrations/010_weather.sql          ← Phase 3
database/migrations/011_harvest.sql          ← Phase 4
database/migrations/012_sales.sql            ← Phase 4
database/migrations/013_finance.sql          ← Phase 4
database/migrations/014_suppliers.sql        ← Phase 4
database/migrations/015_storage.sql          ← Phase 4
database/migrations/016_notifications.sql    ← Phase 5
```

---

## 🔌 API Endpoints Overview

Base URL: `http://localhost:8000`

All protected endpoints require:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Phase 1 — Authentication & Utility (Public / Protected)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get current logged-in user |
| `POST` | `/api/auth/logout` | Protected | Logout current session |
| `GET` | `/api/health` | Public | Server health check |
| `GET` | `/api/modules` | Public | List all system modules |

### Phase 2 — Farms, Crops & Livestock

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET/POST` | `/api/farms` | Protected | List or create farms |
| `GET/PUT/DELETE` | `/api/farms/{id}` | Protected | View, update, or remove farm |
| `GET/POST` | `/api/farms/{id}/fields` | Protected | List or create fields under a farm |
| `GET/PUT/DELETE` | `/api/fields/{id}` | Protected | View, update, or remove field |
| `GET/POST` | `/api/fields/{id}/plots` | Protected | List or add sub-plots |
| `GET/POST` | `/api/crops` | Protected | List or register crops |
| `GET/PUT/DELETE` | `/api/crops/{id}` | Protected | View, update, or delete crop |
| `GET/POST` | `/api/crops/{id}/varieties` | Protected | List or add crop varieties |
| `GET/POST` | `/api/crops/{id}/plantings` | Protected | List or schedule plantings |
| `GET/POST` | `/api/crops/{id}/fertilizer-records` | Protected | List or log fertilizer applications |
| `GET/POST` | `/api/livestock/breeds` | Protected | List or create animal breeds |
| `GET/POST` | `/api/livestock` | Protected | List animals or register animal |
| `GET/PUT/DELETE` | `/api/livestock/{id}` | Protected | View, update, or delete animal record |
| `GET/POST` | `/api/livestock/{id}/vaccinations` | Protected | List or log vaccinations |
| `GET/POST` | `/api/livestock/{id}/treatments` | Protected | List or log disease treatments |
| `GET/POST` | `/api/livestock/{id}/feed-records` | Protected | List or log daily feeding records |

### Phase 3 — Operations (Irrigation, Inventory, Equipment, Labour, Pests, Weather)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET/POST` | `/api/farms/{id}/irrigation-sources` | Protected | List or add water sources |
| `GET/POST` | `/api/farms/{id}/irrigation-systems` | Protected | List or add irrigation systems |
| `GET/PUT/DELETE` | `/api/irrigation/systems/{id}` | Protected | Manage irrigation system |
| `GET/POST` | `/api/irrigation/systems/{id}/schedules` | Protected | List or add watering schedules |
| `GET/POST` | `/api/irrigation/systems/{id}/consumption` | Protected | View or log water consumption |
| `GET` | `/api/irrigation/recommendations/{fieldId}` | Protected | Get smart watering recommendation |
| `GET/POST` | `/api/inventory` | Protected | List items or register inventory item |
| `GET/PUT` | `/api/inventory/{id}` | Protected | View item history or update item |
| `GET` | `/api/inventory/low-stock` | Protected | View items below reorder threshold |
| `POST` | `/api/inventory/{id}/stock-in` | Protected | Record stock intake |
| `POST` | `/api/inventory/{id}/stock-out` | Protected | Record stock consumption/dispatch |
| `GET/POST` | `/api/equipment` | Protected | List machinery or register equipment |
| `GET/PUT/DELETE` | `/api/equipment/{id}` | Protected | View machine details or update/remove |
| `GET/POST` | `/api/equipment/{id}/maintenance` | Protected | List or schedule service intervals |
| `GET/POST` | `/api/equipment/{id}/repairs` | Protected | List or log repair records |
| `GET/POST` | `/api/equipment/{id}/fuel-log` | Protected | List or log fuel consumption |
| `GET/POST` | `/api/workers` | Protected | List or register farm workers |
| `GET/PUT` | `/api/workers/{id}` | Protected | View or update worker details |
| `GET` | `/api/labour/attendance` | Protected | View worker attendance log |
| `POST` | `/api/workers/{id}/attendance` | Protected | Record worker attendance |
| `GET/POST` | `/api/labour/tasks` | Protected | List or assign farm tasks |
| `PATCH` | `/api/labour/tasks/{id}/status` | Protected | Update task status |
| `GET/POST` | `/api/pests` | Protected | View pest catalog or add entry |
| `GET/POST` | `/api/scouting` | Protected | View scouting reports or log finding |
| `GET/POST` | `/api/fields/{id}/treatments` | Protected | View or log chemical spraying |
| `PATCH` | `/api/treatments/{id}/effectiveness` | Protected | Record treatment rating |
| `GET` | `/api/pest-disease/outbreaks` | Protected | View severe outbreak alerts |
| `GET` | `/api/weather/current/{farmId}` | Protected | Current weather observation & live data |
| `GET` | `/api/weather/forecast/{farmId}` | Protected | 7-day agricultural weather forecast |
| `GET` | `/api/weather/history/{farmId}` | Protected | Historical weather observations |
| `POST` | `/api/weather/observe/{farmId}` | Protected | Manually log sensor/weather reading |
| `GET/POST` | `/api/weather/alerts/{farmId}` | Protected | View active alerts or create weather alert |

### Phase 4 — Produce & Commerce (Harvest, Sales & Market, Finance, Suppliers, Storage)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET/POST` | `/api/harvest` | Protected | List or record crop harvest yields |
| `GET/PUT` | `/api/harvest/{id}` | Protected | View or update harvest record |
| `GET` | `/api/harvest/field/{fieldId}` | Protected | List harvests from a specific field |
| `GET` | `/api/harvest/summary` | Protected | Aggregate harvest yield vs loss totals |
| `GET/POST` | `/api/customers` | Protected | List or create buyers/customers |
| `GET/PUT` | `/api/customers/{id}` | Protected | View or update customer contact/credit |
| `GET/POST` | `/api/sales-orders` | Protected | List or create sales orders with items |
| `GET` | `/api/sales-orders/{id}` | Protected | View sales order and attached invoice |
| `PATCH/PUT` | `/api/sales-orders/{id}` | Protected | Update order workflow status |
| `GET` | `/api/invoices` | Protected | List invoices with status filter |
| `GET` | `/api/invoices/{id}` | Protected | View invoice details & payments |
| `POST` | `/api/payments` | Protected | Record invoice payment receipt |
| `GET/POST` | `/api/market-prices` | Protected | List or log commodity market prices |
| `GET` | `/api/market-prices/trends` | Protected | View historical commodity price trends |
| `GET/POST` | `/api/finance/income` | Protected | List or record farm income/revenue |
| `GET/POST` | `/api/finance/expenses` | Protected | List or record operating expenses |
| `GET` | `/api/finance/profit-loss` | Protected | Generate P&L statement & margin |
| `GET/POST` | `/api/finance/loans` | Protected | List or create loan liabilities |
| `PATCH/PUT` | `/api/finance/loans/{id}` | Protected | Update loan repayments & balance |
| `GET/POST` | `/api/finance/budgets` | Protected | List or create fiscal budgets |
| `PATCH/PUT` | `/api/finance/budgets/{id}` | Protected | Update budget line items |
| `GET/POST` | `/api/suppliers` | Protected | List or add suppliers & vendors |
| `GET/PUT` | `/api/suppliers/{id}` | Protected | View or update supplier profile |
| `GET/POST` | `/api/suppliers/{id}/quotations` | Protected | List or record supplier price quotes |
| `GET/POST` | `/api/purchase-orders` | Protected | List or create purchase orders with items |
| `GET` | `/api/purchase-orders/{id}` | Protected | View purchase order details |
| `PATCH/PUT` | `/api/purchase-orders/{id}` | Protected | Update PO approval/fulfillment status |
| `GET/POST` | `/api/warehouses` | Protected | List or create storage facilities |
| `GET/PUT` | `/api/warehouses/{id}` | Protected | View or update warehouse details |
| `GET/POST` | `/api/storage/batches` | Protected | List or intake produce batches |
| `GET` | `/api/storage/batches/{id}` | Protected | View batch movements and dispatches |
| `GET` | `/api/storage/valuation` | Protected | Calculate stored produce inventory value |
| `POST` | `/api/storage/spoilage` | Protected | Write off spoiled storage produce |
| `GET/POST` | `/api/storage/dispatches` | Protected | List or dispatch produce orders |

### Phase 5 — Intelligence & Reporting (Analytics, Alerts & Cross-Module Reports)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Protected | Executive multi-module KPI dashboard overview |
| `GET` | `/api/analytics/yield` | Protected | Multi-year crop yield trend analytics |
| `GET` | `/api/analytics/finance` | Protected | Monthly revenue vs expense breakdown |
| `GET` | `/api/analytics/weather-vs-yield` | Protected | Agro-climatic weather vs harvest output correlation |
| `GET/POST` | `/api/alerts` | Protected | List active alerts (auto-runs scan) or create manual alert |
| `GET` | `/api/alerts/history` | Protected | View historical / dismissed system alerts |
| `POST` | `/api/alerts/scan` | Protected | Force automated diagnostic scan across farm data |
| `PATCH` | `/api/alerts/{id}/dismiss` | Protected | Dismiss an alert |
| `PATCH` | `/api/alerts/{id}/read` | Protected | Mark an alert as read |
| `GET` | `/api/reports/crop-production` | Protected | Crop plantings and varieties report |
| `GET` | `/api/reports/yield` | Protected | Harvest yields and kg/ha efficiency report |
| `GET` | `/api/reports/livestock` | Protected | Livestock health and treatments report |
| `GET` | `/api/reports/financial` | Protected | Complete Profit & Loss (P&L) statement |
| `GET` | `/api/reports/expenses` | Protected | Categorized operational expense report |
| `GET` | `/api/reports/sales` | Protected | Sales orders, invoices, and payment summary |
| `GET` | `/api/reports/inventory` | Protected | Current stock valuation and movements report |
| `GET` | `/api/reports/labour` | Protected | Worker attendance and task performance report |
| `GET` | `/api/reports/irrigation` | Protected | Water consumption volume report |
| `GET` | `/api/reports/pest-disease` | Protected | Scouting logs and pest treatment efficacy report |
| `GET` | `/api/reports/equipment` | Protected | Equipment usage hours, maintenance, and fuel report |
| `GET` | `/api/reports/profitability` | Protected | Crop profitability and revenue analysis |
| `GET` | `/api/reports/farm-performance` | Protected | Holistic executive farm performance scorecard |

---

## 👥 Role Permissions

| Role | Description |
|---|---|
| `admin` | Full access to everything |
| `farm_owner` | Manages their own farms, fields, crops, livestock, equipment, and finances |
| `farm_manager` | Can manage operational records, workers, inventory, and equipment |
| `agronomist` | Can manage crop, pest/disease, and livestock health records |
| `worker` | Can log feed records, task completion, and attendance |
| `accountant` | Read-only access to farm, inventory, and financial data |

---

## 📁 Project Structure

```
backend/src/Modules/
├── security/        ✅ Phase 1
├── farm_field/      ✅ Phase 2
├── crop/            ✅ Phase 2
├── livestock/       ✅ Phase 2
├── irrigation/      ✅ Phase 3
├── inventory/       ✅ Phase 3
├── equipment/       ✅ Phase 3
├── labour/          ✅ Phase 3
├── pest_disease/    ✅ Phase 3
├── weather/         ✅ Phase 3
├── harvest/         ✅ Phase 4
├── sales_market/    ✅ Phase 4
├── finance/         ✅ Phase 4
├── suppliers_procurement/ ✅ Phase 4
├── storage/         ✅ Phase 4
├── analytics/       ✅ Phase 5
└── notifications/   ✅ Phase 5
```

