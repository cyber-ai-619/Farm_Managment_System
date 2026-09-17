-- =============================================================
-- Migration 007: Farm Equipment & Machinery
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS equipment (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('tractor','harvester','planter','sprayer','tillage','trailer','pump','generator','vehicle','implement','hand_tool','other') NOT NULL,
    brand                VARCHAR(100) NULL,
    model                VARCHAR(100) NULL,
    serial_number        VARCHAR(100) NULL,
    purchase_date        DATE NULL,
    purchase_cost        DECIMAL(12, 2) NULL DEFAULT 0.00,
    current_value        DECIMAL(12, 2) NULL DEFAULT 0.00,
    operating_hours      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fuel_type            ENUM('diesel','petrol','electric','manual','none') NOT NULL DEFAULT 'diesel',
    status               ENUM('available','in_use','maintenance','repair','retired') NOT NULL DEFAULT 'available',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_equipment_farm   (farm_id),
    INDEX idx_equipment_type   (type),
    INDEX idx_equipment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    service_type         VARCHAR(150) NOT NULL,
    interval_hours       DECIMAL(8, 2) NULL,
    interval_days        INT UNSIGNED NULL,
    last_service_date    DATE NULL,
    next_service_date    DATE NULL,
    last_service_hours   DECIMAL(10, 2) NULL,
    next_service_hours   DECIMAL(10, 2) NULL,
    status               ENUM('scheduled','due','overdue','completed') NOT NULL DEFAULT 'scheduled',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintsched_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    INDEX idx_maintsched_equipment (equipment_id),
    INDEX idx_maintsched_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repair_history (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    description          TEXT NOT NULL,
    cost_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    technician_name      VARCHAR(150) NULL,
    repair_date          DATE NOT NULL,
    parts_replaced       TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repair_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_recorder  FOREIGN KEY (recorded_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_repair_equipment (equipment_id),
    INDEX idx_repair_date      (repair_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fuel_logs (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    litres_added         DECIMAL(8, 2) NOT NULL,
    cost_amount          DECIMAL(10, 2) NULL DEFAULT 0.00,
    current_meter_hours  DECIMAL(10, 2) NULL,
    logged_date          DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fuellog_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    CONSTRAINT fk_fuellog_recorder  FOREIGN KEY (recorded_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_fuellog_equipment (equipment_id),
    INDEX idx_fuellog_date      (logged_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
