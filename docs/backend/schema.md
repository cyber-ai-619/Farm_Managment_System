# 🗄️ Farm Management System — Database Schema

This document serves as the shared single source of truth for the database design across all backend development phases.

---

## 🟢 Implemented Schemas (Phase 1)

### 1. `roles`
Defines system access roles.
```sql
CREATE TABLE roles (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
**Default Roles Seeded**:
- `1` : `admin`
- `2` : `farm_owner`
- `3` : `farm_manager`
- `4` : `agronomist`
- `5` : `worker` (Default)
- `6` : `accountant`

---

### 2. `users`
System user accounts.
```sql
CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT UNSIGNED NOT NULL DEFAULT 5,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3. `audit_logs`
Security & operational audit log.
```sql
CREATE TABLE audit_logs (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NULL,
    action     VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id  INT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🟡 Planned Schemas (Upcoming Phases)

| Phase | Planned Tables | Description |
|---|---|---|
| **Phase 2** | `farms`, `fields`, `plots` | Farm location, field boundary, acreage, soil data |
| **Phase 2** | `crops`, `crop_varieties`, `plantings` | Crop types, variety specs, planting schedules |
| **Phase 2** | `animals`, `breeds`, `health_records` | Livestock inventory, breed tracking, health/vaccinations |
| **Phase 3** | `irrigation_systems`, `water_sources`, `schedules` | Water usage, pump equipment, irrigation schedules |
| **Phase 3** | `inventory_items`, `stock_movements` | Inputs (seeds, fertilizers, fuel), stock levels |
| **Phase 3** | `equipment`, `maintenance_schedules`, `repairs` | Machinery tracking, fuel logs, maintenance history |
| **Phase 3** | `workers`, `attendance`, `task_assignments` | Labour management, worker attendance, daily tasks |
| **Phase 3** | `pests`, `diseases`, `scouting_reports`, `spraying` | Scouting logs, chemical spraying records |
| **Phase 3** | `weather_observations`, `weather_alerts` | Environmental data & weather forecasts |
| **Phase 4** | `harvest_records`, `yield_quality` | Harvested produce, actual vs expected yield |
| **Phase 4** | `customers`, `sales_orders`, `invoices`, `payments` | Sales contracts, orders, billing |
| **Phase 4** | `income_records`, `expense_records`, `loans` | Financial accounting, expenses, ROI |
| **Phase 4** | `suppliers`, `purchase_orders` | Vendor registry, procurement workflows |
| **Phase 4** | `warehouses`, `storage_batches`, `dispatches` | Post-harvest storage & inventory valuation |
| **Phase 5** | `alerts`, `notification_logs` | System alerts & reminder triggers |

---

## 📌 Schema Design Guidelines for Teammates

1. **Naming Conventions**:
   - Use `snake_case` for all table names and column names.
   - Use plural nouns for table names (`farms`, `users`, `harvests`).
   - Primary key must always be `id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.
2. **Foreign Keys**:
   - Foreign keys must end with `_id` (e.g. `farm_id`, `user_id`).
   - Explicitly define foreign key constraints with `CONSTRAINT fk_tablename_columnname`.
3. **Timestamps**:
   - Always include `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
   - Include `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` for mutable records.
4. **Migrations**:
   - Save SQL definitions in `database/migrations/00X_filename.sql` sequentially before writing backend models.
