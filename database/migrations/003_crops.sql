-- =============================================================================
-- Migration 003: Crop Management
-- Tables: crops, crop_varieties, planting_schedules, fertilizer_records, spraying_schedules
-- Depends on: farms, fields, plots (Migration 002), users (Migration 001)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. crops
--    Master crop catalogue (e.g. "Maize", "Tomato", "Wheat")
-- -----------------------------------------------------------------------------
CREATE TABLE crops (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    scientific_name  VARCHAR(150) NULL,
    category         ENUM('cereal','legume','vegetable','fruit','root','oilseed','fodder','other') NOT NULL DEFAULT 'other',
    description      TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_crops_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. crop_varieties
--    Specific varieties under each crop (e.g. "SC403" under "Maize")
-- -----------------------------------------------------------------------------
CREATE TABLE crop_varieties (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    crop_id             INT UNSIGNED NOT NULL,
    variety_name        VARCHAR(150) NOT NULL,
    days_to_maturity    SMALLINT UNSIGNED NULL COMMENT 'Approximate days from planting to harvest',
    planting_density    VARCHAR(100) NULL COMMENT 'e.g. 25000 plants/ha',
    row_spacing_cm      DECIMAL(6, 2) NULL,
    plant_spacing_cm    DECIMAL(6, 2) NULL,
    expected_yield_t_ha DECIMAL(8, 2) NULL COMMENT 'Expected tonnes per hectare',
    notes               TEXT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_varieties_crop FOREIGN KEY (crop_id) REFERENCES crops (id) ON DELETE CASCADE,
    INDEX idx_varieties_crop (crop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. planting_schedules
--    Records of actual planting events on a specific field/plot
-- -----------------------------------------------------------------------------
CREATE TABLE planting_schedules (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    field_id             INT UNSIGNED NOT NULL,
    plot_id              INT UNSIGNED NULL COMMENT 'Null if entire field is planted',
    crop_id              INT UNSIGNED NOT NULL,
    variety_id           INT UNSIGNED NULL,
    planted_by           INT UNSIGNED NOT NULL COMMENT 'User who recorded the planting',
    planting_date        DATE NOT NULL,
    expected_harvest_date DATE NULL,
    actual_harvest_date  DATE NULL,
    area_planted_ha      DECIMAL(10, 2) NULL,
    seed_quantity_kg     DECIMAL(10, 2) NULL,
    status               ENUM('planned','planted','growing','harvested','failed') NOT NULL DEFAULT 'planned',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_planting_field    FOREIGN KEY (field_id)   REFERENCES fields (id)          ON DELETE CASCADE,
    CONSTRAINT fk_planting_plot     FOREIGN KEY (plot_id)    REFERENCES plots (id)           ON DELETE SET NULL,
    CONSTRAINT fk_planting_crop     FOREIGN KEY (crop_id)    REFERENCES crops (id)           ON DELETE CASCADE,
    CONSTRAINT fk_planting_variety  FOREIGN KEY (variety_id) REFERENCES crop_varieties (id)  ON DELETE SET NULL,
    CONSTRAINT fk_planting_user     FOREIGN KEY (planted_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_planting_field (field_id),
    INDEX idx_planting_crop  (crop_id),
    INDEX idx_planting_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. fertilizer_records
--    Fertilizer application events linked to a planting schedule
-- -----------------------------------------------------------------------------
CREATE TABLE fertilizer_records (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planting_id     INT UNSIGNED NOT NULL,
    applied_by      INT UNSIGNED NOT NULL,
    fertilizer_name VARCHAR(150) NOT NULL,
    fertilizer_type ENUM('organic','inorganic','foliar','basal','top_dress','other') NOT NULL DEFAULT 'other',
    quantity_kg     DECIMAL(10, 2) NOT NULL,
    application_date DATE NOT NULL,
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fertilizer_planting FOREIGN KEY (planting_id) REFERENCES planting_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_fertilizer_user     FOREIGN KEY (applied_by)  REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_fertilizer_planting (planting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5. spraying_schedules
--    Chemical spray events (pesticides, herbicides, fungicides) per planting
-- -----------------------------------------------------------------------------
CREATE TABLE spraying_schedules (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planting_id      INT UNSIGNED NOT NULL,
    applied_by       INT UNSIGNED NOT NULL,
    chemical_name    VARCHAR(150) NOT NULL,
    chemical_type    ENUM('pesticide','herbicide','fungicide','insecticide','other') NOT NULL DEFAULT 'other',
    quantity_litres  DECIMAL(10, 2) NOT NULL,
    dilution_ratio   VARCHAR(50) NULL COMMENT 'e.g. 1:20',
    spray_date       DATE NOT NULL,
    target_pest      VARCHAR(150) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spraying_planting FOREIGN KEY (planting_id) REFERENCES planting_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_spraying_user     FOREIGN KEY (applied_by)  REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_spraying_planting (planting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
