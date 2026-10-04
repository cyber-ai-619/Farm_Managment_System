-- =============================================================
-- Migration 011: Harvest Management
-- Depends on: 002_farms_fields.sql, 003_crops.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS harvest_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    crop_id              INT UNSIGNED NOT NULL,
    variety_id           INT UNSIGNED NULL,
    harvested_by         INT UNSIGNED NOT NULL,
    harvest_date         DATE NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    expected_yield_kg    DECIMAL(10, 2) NULL,
    loss_kg              DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quality_grade        ENUM('A','B','C','rejected') NOT NULL DEFAULT 'A',
    storage_location     VARCHAR(150) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_harvest_farm     FOREIGN KEY (farm_id)      REFERENCES farms (id)          ON DELETE CASCADE,
    CONSTRAINT fk_harvest_field    FOREIGN KEY (field_id)     REFERENCES fields (id)         ON DELETE CASCADE,
    CONSTRAINT fk_harvest_crop     FOREIGN KEY (crop_id)      REFERENCES crops (id)          ON DELETE CASCADE,
    CONSTRAINT fk_harvest_variety  FOREIGN KEY (variety_id)   REFERENCES crop_varieties (id) ON DELETE SET NULL,
    CONSTRAINT fk_harvest_recorder FOREIGN KEY (harvested_by) REFERENCES users (id)          ON DELETE CASCADE,
    INDEX idx_harvest_farm  (farm_id),
    INDEX idx_harvest_field (field_id),
    INDEX idx_harvest_crop  (crop_id),
    INDEX idx_harvest_date  (harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS harvest_quality (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    harvest_id           INT UNSIGNED NOT NULL,
    inspected_by         INT UNSIGNED NOT NULL,
    moisture_content_pct DECIMAL(5, 2) NULL,
    foreign_matter_pct   DECIMAL(5, 2) NULL,
    defect_rate_pct      DECIMAL(5, 2) NULL,
    sugar_brix           DECIMAL(4, 2) NULL,
    certification_status ENUM('standard','organic','global_gap','fair_trade','pending') NOT NULL DEFAULT 'standard',
    inspection_date      DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hq_harvest   FOREIGN KEY (harvest_id)   REFERENCES harvest_records (id) ON DELETE CASCADE,
    CONSTRAINT fk_hq_inspector FOREIGN KEY (inspected_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_hq_harvest (harvest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
