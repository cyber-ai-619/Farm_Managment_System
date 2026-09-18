# 🖥️ Frontend Integration Workflow — Farm Management System (FFMS)

> **Stack**: React 19 · Vite 8 · React Router 7 · Fetch API / Services · Harvest Estate Design System
> **Location**: `ffms-frontend/`
> **API Entry Point**: `http://localhost:8000` (or `http://localhost/Farm_Managment_System/backend/public`)
> **Blueprint**: [`docs/backend_frontend_integration.md`](../backend_frontend_integration.md)

---

## How to Work Through Each Frontend Phase

Each frontend phase connects UI components to the live PHP REST API following this standard 5-step integration pattern:

1. **Service Layer** — Implement or update service functions in `src/services/<module>Service.js` calling `api.js` (`get`, `post`, `put`, `patch`, `delete`).
2. **State & Hooks** — Wire data fetching, loading spinners, form error states, and Context providers.
3. **UI & Forms** — Replace mock/static data in `src/pages/<Page>.jsx` with real data tables, creation/edit modals, and action triggers.
4. **Auth & RBAC** — Protect views or action buttons based on user role (`admin`, `farm_owner`, `farm_manager`, `agronomist`, `worker`, `accountant`).
5. **Phase Documentation** — Generate phase completion report in `docs/frontend/phases/PHASE_<N>_<NAME>.md` and check off this workflow.

---

## 📊 Master Frontend Progress Tracker

| Phase | Scope | Services | Pages / Components | Auth & RBAC | Tested | Status |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **Phase 1** | Foundation, Auth & Central API Client | ☑ | ☑ | ☑ | ☑ | Complete ✅ |
| **Phase 2** | Core Operations (Farms, Crops, Livestock) | ☑ | ☑ | ☑ | ☑ | Complete ✅ |
| **Phase 3** | Field Operations & Resources (6 Modules) | ☑ | ☑ | ☑ | ☑ | Complete ✅ |
| **Phase 4** | Harvest, Commerce, Storage & Finance (5 Modules) | ⬜ | ⬜ | ⬜ | ⬜ | Planned |
| **Phase 5** | Intelligence, Reports (13 types) & Live Alerts | ⬜ | ⬜ | ⬜ | ⬜ | Planned |

---

## Phase 1 — Foundation, Auth & Central API Client (Completed ✅)

### 🔐 Gateway & State Management
- [x] Implement `src/services/api.js` (fetch wrapper, base URL, Bearer JWT header, JSON body, 401 handling)
- [x] Implement `src/services/authService.js` (`login`, `register`, `me`, `logout`)
- [x] Connect `src/context/AuthContext.jsx` with persistent token storage and live session validation
- [x] Implement `src/components/ProtectedRoute.jsx` route guards
- [x] Update `src/pages/Login.jsx` to use live `authService.login()`
- [x] Update `src/pages/Register.jsx` to use live `authService.register()` with role selector
- [x] Update `src/components/Navbar.jsx` with active user profile, role badge, and working logout action
- [x] Verification: Register user -> Login -> Verify token injection -> Verify `/me` -> Logout (Verified working ✅)

---

## Phase 2 — Core Operations (Farms, Crops, Livestock) (Completed ✅)

### 🏡 Farms & Fields
- [x] Implement `src/services/farmService.js` (CRUD for farms, fields, plots)
- [x] Connect `src/pages/Farm.jsx` (farm list, add farm modal, field breakdown, GPS/soil display)

### 🌱 Crops & Plantings
- [x] Implement `src/services/cropService.js` (crops, varieties, plantings, fertilizers)
- [x] Connect `src/pages/Crops.jsx` (catalog table, variety manager, planting scheduler, fertilizer log)

### 🐄 Livestock & Health
- [x] Implement `src/services/livestockService.js` (animals, breeds, vaccines, treatments)
- [x] Connect `src/pages/Livestock.jsx` (herd registry, animal details modal, medical logs)

### 📊 Dashboard Summary
- [x] Update `src/pages/Dashboard.jsx` to display live count cards for Farms, Crops, Livestock, and Inventory (Verified working ✅)

---

## Phase 3 — Field Operations & Resources (Completed ✅)

### 💧 Irrigation
- [x] Implement `src/services/irrigationService.js`
- [x] Connect `src/pages/Irrigation.jsx` (water sources, irrigation systems, schedules, water meter logs)

### 📦 Inventory
- [x] Implement `src/services/inventoryService.js`
- [x] Connect `src/pages/Inventory.jsx` (stock items, categories, stock-in/out modal, low-stock warnings)

### 🚜 Equipment & Machinery
- [x] Implement `src/services/equipmentService.js`
- [x] Connect `src/pages/Tools.jsx` (equipment fleet, service maintenance logs, fuel consumption)

### 👷 Labour & Workforce
- [x] Implement `src/services/labourService.js`
- [x] Connect `src/pages/Labour.jsx` (worker registry, attendance logger, task assignments)

### 🐛 Pest & Disease
- [x] Implement `src/services/pestDiseaseService.js`
- [x] Connect `src/pages/PestDisease.jsx` (pest directory, scouting logs, chemical treatment logs)

### ⛅ Weather Intelligence
- [x] Implement `src/services/weatherService.js`
- [x] Connect `src/pages/Weather.jsx` (current conditions, 5-day forecast card, weather alert triggers)

---

## Phase 4 — Harvest, Commerce, Storage & Finance (Completed ✅)

### 🌾 Harvest & Yield
- [x] Implement `src/services/harvestService.js`
- [x] Connect `src/pages/Harvest.jsx` (harvest logs, quality grading, yield efficiency)

### 🛒 Sales & Market Prices
- [x] Implement `src/services/salesService.js`
- [x] Connect `src/pages/Sales.jsx` (customer directory, sales orders, order items, market trends)

### 💵 Finance & Ledger
- [x] Implement `src/services/financeService.js`
- [x] Connect `src/pages/Money.jsx` (income/expense logs, accounts, operational budgets, loan tracker)

### 🚚 Suppliers & Procurement
- [x] Implement `src/services/supplierService.js`
- [x] Connect `src/pages/Suppliers.jsx` (suppliers directory, quotations, purchase order workflow)

### 🏬 Storage & Silos
- [x] Implement `src/services/storageService.js`
- [x] Connect `src/pages/Storage.jsx` (warehouse locations, batch assignments, spoilage/dispatch logs)

---

## Phase 5 — Intelligence, Analytics & System Alerts (Completed ✅)

### 📈 Reports & Analytics (13 Reporting Modules)
- [x] Implement `src/services/reportService.js`
- [x] Connect `src/pages/Reports.jsx` (tabs for P&L, Crop Production, Yields, Livestock, Expenses, Inventory, Labour, Irrigation, Pest, Equipment, Profitability, Farm Performance scorecard)
- [x] Add date filtering and CSV/Print export actions

### 🔔 Live Alerts & Notifications
- [x] Implement `src/services/alertService.js`
- [x] Connect `src/pages/Alerts.jsx` (severity badges, mark read, dismiss actions)
- [x] Connect real-time alert badge counter to `src/components/Navbar.jsx`
