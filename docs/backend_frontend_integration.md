# 🔌 Backend & Frontend Integration Plan

This document defines the complete phased blueprint for integrating the **React 19 Frontend (`ffms-frontend`)** with the **PHP REST Backend (`backend/public/index.php`)**.

---

## 🏛️ 1. Architecture & Communication Protocol

### Base URL & Environment Configuration
- **Backend API Base**: `http://localhost:8000` (or `http://localhost/Farm_Managment_System/backend/public`)
- **Frontend Dev Server**: `http://localhost:5173` (via Vite)
- **CORS Support**: Handled in backend router (`Access-Control-Allow-Origin: *`, `Authorization, Content-Type`).

### Authentication & Token Flow
1. User submits credentials on `/` (Login).
2. Frontend sends `POST /api/auth/login`.
3. Backend validates against `users` table and issues a JWT token containing:
   ```json
   {
     "success": true,
     "token": "<JWT_TOKEN_STRING>",
     "user": {
       "id": 1,
       "name": "Jane Doe",
       "email": "jane@farm.com",
       "role_id": 2,
       "role": "farm_owner"
     }
   }
   ```
4. Frontend saves `token` and `user` to `localStorage`.
5. All subsequent requests attach:
   ```
   Authorization: Bearer <JWT_TOKEN_STRING>
   Content-Type: application/json
   ```
6. On `401 Unauthorized` responses, frontend automatically clears `localStorage` and redirects to `/`.

---

## 📅 2. Phased Integration Sequence

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Foundation, Auth & Central API Client         │
│ (api.js, authService, AuthContext, Protected Routes)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: Core Farm Operations                          │
│ (Farms, Fields, Crops, Plantings, Livestock, Breeds)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: Field Operations & Resources                  │
│ (Irrigation, Inventory, Equipment, Labour, Pest, Wx)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: Harvest, Commerce, Storage & Finance          │
│ (Harvest, Sales Orders, P&L/Finance, Suppliers, Silos) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 5: Analytics, Reporting & System Alerts          │
│ (13 Comprehensive Reports, Live Alerts, Notification)  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Phase 1: Foundation & Authentication (Complete ✅)

### Goals
- Establish the centralized HTTP client with base URL and JWT interceptor.
- Replace mock browser storage authentication with real backend API calls.
- Protect dashboard routes using dynamic role verification.

### Implemented Files
| Component / File | Purpose | Backend Endpoints | Status |
|---|---|---|:---:|
| [`src/services/api.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/api.js) | Centralized `fetch` / request wrapper with Bearer token injection & error handling | All `/api/*` | Complete ✅ |
| [`src/services/authService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/authService.js) | Auth API functions (`login`, `register`, `me`, `logout`) | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET /api/auth/me`<br>`POST /api/auth/logout` | Complete ✅ |
| [`src/context/AuthContext.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/context/AuthContext.jsx) | React Context managing `user`, `token`, `login()`, `logout()`, `isAuthenticated` | — | Complete ✅ |
| [`src/hooks/useAuth.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/hooks/useAuth.js) | Custom hook to consume AuthContext | — | Complete ✅ |
| [`src/components/ProtectedRoute.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/components/ProtectedRoute.jsx) | Route guard redirecting unauthenticated users to `/` | — | Complete ✅ |
| [`src/components/Navbar.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/components/Navbar.jsx) | Display current user name, role badge, and active logout button | `POST /api/auth/logout` | Complete ✅ |
| [`src/pages/Login.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Login.jsx) | Real API form submission with error messages | `POST /api/auth/login` | Complete ✅ |
| [`src/pages/Register.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Register.jsx) | Real API user registration with role selector | `POST /api/auth/register` | Complete ✅ |
| [`src/App.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/App.jsx) | Top-level AuthProvider & Route Guarding | — | Complete ✅ |

---

## 🌾 Phase 2: Core Operations (Farms, Crops, Livestock) (Complete ✅)

### Goals
- Provide full interactive CRUD for farms, fields, sub-plots, crops, varieties, plantings, livestock, and medical logs.
- Populate executive metrics on the top-level Dashboard.

### Implemented Files
| Component / File | Features & Modals | Backend Endpoints | Status |
|---|---|---|:---:|
| [`src/services/farmService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/farmService.js) | Farm, Field, and Plot CRUD API service | `GET/POST /api/farms`<br>`GET/PUT/DELETE /api/farms/{id}`<br>`GET/POST /api/farms/{id}/fields`<br>`GET/PUT/DELETE /api/fields/{id}`<br>`GET/POST /api/fields/{id}/plots` | Complete ✅ |
| [`src/services/cropService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/cropService.js) | Crop catalog, variety, planting, and fertilizer logs | `GET/POST /api/crops`<br>`GET/PUT/DELETE /api/crops/{id}`<br>`GET/POST /api/crops/{id}/varieties`<br>`GET/POST /api/crops/{id}/plantings`<br>`GET/POST /api/crops/{id}/fertilizer-records` | Complete ✅ |
| [`src/services/livestockService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/livestockService.js) | Animals, breeds, vaccination, and treatment records | `GET/POST /api/livestock`<br>`GET/PUT/DELETE /api/livestock/{id}`<br>`GET/POST /api/livestock/breeds`<br>`GET/POST /api/livestock/{id}/vaccinations`<br>`GET/POST /api/livestock/{id}/treatments` | Complete ✅ |
| [`src/components/Modal.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/components/Modal.jsx) | Reusable modal dialog with backdrop blur and foil accent | — | Complete ✅ |
| [`src/pages/Dashboard.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Dashboard.jsx) | Real-time count cards and quick-action shortcuts | Aggregated stats | Complete ✅ |
| [`src/pages/Farm.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Farm.jsx) | Farm listing, Add Farm modal, Field breakdown table | Farm endpoints | Complete ✅ |
| [`src/pages/Crops.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Crops.jsx) | Crop catalog, Planting scheduler, Fertilizer logs | Crop endpoints | Complete ✅ |
| [`src/pages/Livestock.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Livestock.jsx) | Herd registry, Tag ID tracking, Health & Vaccine logs | Livestock endpoints | Complete ✅ |

---

## 🚜 Phase 3: Field Operations & Resources (Complete ✅)

### Goals
- Connect irrigation tracking, inventory stock control, equipment fleet maintenance, workforce labour, pest scouting, and live weather forecast.

### Implemented Files
| Component / File | Features & Modals | Backend Endpoints | Status |
|---|---|---|:---:|
| [`src/services/irrigationService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/irrigationService.js) | Schedules, execution logs, water meter readings | `GET/POST /api/farms/{id}/irrigation-sources`<br>`GET/POST /api/farms/{id}/irrigation-systems`<br>`GET/PUT/DELETE /api/irrigation/systems/{id}` | Complete ✅ |
| [`src/services/inventoryService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/inventoryService.js) | Stock items, categories, batch tracking, stock in/out | `GET/POST /api/inventory`<br>`POST /api/inventory/{id}/stock-in`<br>`POST /api/inventory/{id}/stock-out` | Complete ✅ |
| [`src/services/equipmentService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/equipmentService.js) | Machinery fleet, maintenance service logs, fuel logs | `GET/POST /api/equipment`<br>`GET/POST /api/equipment/{id}/maintenance`<br>`GET/POST /api/equipment/{id}/fuel-log` | Complete ✅ |
| [`src/services/labourService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/labourService.js) | Worker profiles, daily attendance register, task boards | `GET/POST /api/workers`<br>`GET/POST /api/labour/attendance`<br>`GET/POST /api/labour/tasks` | Complete ✅ |
| [`src/services/pestDiseaseService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/pestDiseaseService.js) | Pest catalog, scouting reports, chemical treatments | `GET/POST /api/pests`<br>`GET/POST /api/scouting`<br>`GET /api/pest-disease/outbreaks` | Complete ✅ |
| [`src/services/weatherService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/weatherService.js) | Live weather conditions, 5-day forecasts, risk alerts | `GET /api/weather/current/{id}`<br>`GET /api/weather/forecast/{id}`<br>`GET/POST /api/weather/alerts/{id}` | Complete ✅ |
| [`src/pages/Irrigation.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Irrigation.jsx) | Water sources, irrigation lines, capacity management | Irrigation endpoints | Complete ✅ |
| [`src/pages/Inventory.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Inventory.jsx) | Stock balance, low stock alerts, stock in/out modals | Inventory endpoints | Complete ✅ |
| [`src/pages/Tools.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Tools.jsx) | Fleet catalog, maintenance scheduler, fuel consumption | Equipment endpoints | Complete ✅ |
| [`src/pages/Labour.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Labour.jsx) | Worker directory, attendance logs, task assignment board | Labour endpoints | Complete ✅ |
| [`src/pages/PestDisease.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/PestDisease.jsx) | Scouting logs, pest identification, outbreak warnings | Pest endpoints | Complete ✅ |
| [`src/pages/Weather.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Weather.jsx) | Current conditions, 5-day forecast, risk alerts | Weather endpoints | Complete ✅ |

---

## 💰 Phase 4: Produce, Commerce, Storage & Finance (Complete ✅)

### Goals
- Connect harvest yield collection, customer sales orders, financial ledgers/budgets, procurement purchase orders, and warehouse batch storage.

### Key Files & Changes
| Component / File | Features & Modals | Backend Endpoints | Status |
|---|---|---|---|
| [`src/services/harvestService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/harvestService.js)<br>[`src/pages/Harvest.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Harvest.jsx) | Harvest logging, yield calculations, loss kg, quality grades | `GET/POST /api/harvest`<br>`GET/PUT /api/harvest/{id}`<br>`GET /api/harvest/summary` | Complete ✅ |
| [`src/services/salesService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/salesService.js)<br>[`src/pages/Sales.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Sales.jsx) | Customer directory, sales orders with items, market prices, invoice payments | `GET/POST /api/customers`<br>`GET/POST /api/sales-orders`<br>`GET /api/invoices`<br>`POST /api/payments`<br>`GET/POST /api/market-prices` | Complete ✅ |
| [`src/services/financeService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/financeService.js)<br>[`src/pages/Money.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Money.jsx) | P&L statement, income/expenses ledger, operational budgets, loans | `GET/POST /api/finance/income`<br>`GET/POST /api/finance/expenses`<br>`GET /api/finance/profit-loss`<br>`GET/POST /api/finance/budgets`<br>`GET/POST /api/finance/loans` | Complete ✅ |
| [`src/services/supplierService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/supplierService.js)<br>[`src/pages/Suppliers.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Suppliers.jsx) | Supplier database, quotations, purchase order workflows | `GET/POST /api/suppliers`<br>`GET/POST /api/suppliers/{id}/quotations`<br>`GET/POST /api/purchase-orders` | Complete ✅ |
| [`src/services/storageService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/storageService.js)<br>[`src/pages/Storage.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Storage.jsx) | Warehouse locations, storage batches, spoilage write-offs, dispatches | `GET/POST /api/warehouses`<br>`GET/POST /api/storage/batches`<br>`GET /api/storage/valuation`<br>`POST /api/storage/spoilage`<br>`GET/POST /api/storage/dispatches` | Complete ✅ |

---

## 📊 Phase 5: Analytics, Reports & Live System Alerts (Complete ✅)

### Goals
- Render 13 analytical reporting modules with date filtering and data exports.
- Implement real-time system alerts and alert dismissal badge.

### Key Files & Changes
| Component / File | Features & Modals | Backend Endpoints | Status |
|---|---|---|---|
| [`src/services/reportService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/reportService.js)<br>[`src/pages/Reports.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Reports.jsx) | 13 report endpoints, filters, KPI summaries, and CSV/Print export | `GET /api/reports/crop-production`<br>`GET /api/reports/yield`<br>`GET /api/reports/livestock`<br>`GET /api/reports/financial`<br>`GET /api/reports/expenses`<br>`GET /api/reports/sales`<br>`GET /api/reports/inventory`<br>`GET /api/reports/labour`<br>`GET /api/reports/irrigation`<br>`GET /api/reports/pest-disease`<br>`GET /api/reports/equipment`<br>`GET /api/reports/profitability`<br>`GET /api/reports/farm-performance` | Complete ✅ |
| [`src/services/alertService.js`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/services/alertService.js)<br>[`src/pages/Alerts.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/pages/Alerts.jsx) | Active alert stream, scan trigger, dismiss/read actions, broadcast modal | `GET/POST /api/alerts`<br>`GET /api/alerts/history`<br>`POST /api/alerts/scan`<br>`PATCH /api/alerts/{id}/dismiss`<br>`PATCH /api/alerts/{id}/read` | Complete ✅ |
| [`src/components/Navbar.jsx`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/ffms-frontend/src/components/Navbar.jsx) | Unread notification counter badge with live 30s background polling | Dynamic Alert count | Complete ✅ |

---

## 📋 3. Standard API Response Structure

Every backend endpoint follows this consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Paginated / List Response
```json
{
  "success": true,
  "count": 12,
  "data": [ ... ]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed or resource not found",
  "code": 400
}
```

---

## 🧪 4. Testing & Verification Checklist
1. **Auth Test**: Register user `test@farm.com`, login, receive JWT token, verify automatic token attachment.
2. **Persistence Test**: Refresh page; verify user session remains intact via `GET /api/auth/me`.
3. **Logout Test**: Click logout in navbar; verify token is deleted and user redirected to `/`.
4. **CRUD Integrity**: Create a Farm -> add a Field -> add a Plot -> verify cascade and data consistency.
5. **Report Generation**: Access `/reports` and verify Profit & Loss and Yield reports compute without errors.
