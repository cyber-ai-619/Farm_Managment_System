-- =============================================================
-- Migration 015: Storage & Post-Harvest Management
-- Depends on: 002_farms_fields.sql, 003_crops.sql, 011_harvest.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS warehouses (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id                INT UNSIGNED NOT NULL,
    name                   VARCHAR(150) NOT NULL,
    type                   ENUM('silo','cold_storage','dry_shed','grain_bin','greenhouse','packing_shed','cellar','other') NOT NULL DEFAULT 'dry_shed',
    capacity_cubic_metres  DECIMAL(10, 2) NULL,
    current_temperature_c  DECIMAL(5, 2) NULL,
    current_humidity_pct   DECIMAL(5, 2) NULL,
    location_description   TEXT NULL,
    is_active              TINYINT(1) NOT NULL DEFAULT 1,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wh_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_wh_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS storage_batches (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id           INT UNSIGNED NOT NULL,
    harvest_id             INT UNSIGNED NULL,
    crop_id                INT UNSIGNED NOT NULL,
    batch_code             VARCHAR(50) NOT NULL UNIQUE,
    quantity_stored_kg     DECIMAL(10, 2) NOT NULL,
    quantity_remaining_kg  DECIMAL(10, 2) NOT NULL,
    unit_cost_estimated    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quality_grade          ENUM('A','B','C','rejected') NOT NULL DEFAULT 'A',
    entry_date             DATE NOT NULL,
    expiry_date            DATE NULL,
    status                 ENUM('stored','partially_dispatched','dispatched','spoiled') NOT NULL DEFAULT 'stored',
    spoilage_kg            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes                  TEXT NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_wh      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)      ON DELETE CASCADE,
    CONSTRAINT fk_batch_harvest FOREIGN KEY (harvest_id)   REFERENCES harvest_records (id) ON DELETE SET NULL,
    CONSTRAINT fk_batch_crop    FOREIGN KEY (crop_id)      REFERENCES crops (id)            ON DELETE CASCADE,
    INDEX idx_batch_wh     (warehouse_id),
    INDEX idx_batch_crop   (crop_id),
    INDEX idx_batch_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS storage_movements (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_id             INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    movement_type        ENUM('intake','dispatch','spoilage_writeoff','warehouse_transfer') NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sm_batch    FOREIGN KEY (batch_id)    REFERENCES storage_batches (id) ON DELETE CASCADE,
    CONSTRAINT fk_sm_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_sm_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dispatch_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_id             INT UNSIGNED NOT NULL,
    order_id             INT UNSIGNED NULL,
    dispatched_by        INT UNSIGNED NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    destination          VARCHAR(150) NOT NULL,
    vehicle_registration VARCHAR(50) NULL,
    driver_name          VARCHAR(100) NULL,
    dispatch_date        DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disp_batch    FOREIGN KEY (batch_id)      REFERENCES storage_batches (id) ON DELETE CASCADE,
    CONSTRAINT fk_disp_order    FOREIGN KEY (order_id)      REFERENCES sales_orders (id)    ON DELETE SET NULL,
    CONSTRAINT fk_disp_recorder FOREIGN KEY (dispatched_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_disp_batch (batch_id),
    INDEX idx_disp_date  (dispatch_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
