-- =============================================================================
-- Migration 002: Farm & Field Management
-- Tables: farms, fields, plots
-- Depends on: users (Phase 1)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. farms
--    Top-level entity. A user (farm_owner / admin) owns one or many farms.
-- -----------------------------------------------------------------------------
CREATE TABLE farms (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id      INT UNSIGNED NOT NULL,
    name          VARCHAR(150) NOT NULL,
    location      VARCHAR(255) NULL COMMENT 'Human-readable address / region',
    latitude      DECIMAL(10, 7) NULL,
    longitude     DECIMAL(10, 7) NULL,
    total_area_ha DECIMAL(10, 2) NULL COMMENT 'Total farm area in hectares',
    description   TEXT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_farms_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_farms_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. fields
--    A farm is divided into fields. Each field has soil metadata and GPS bounds.
-- -----------------------------------------------------------------------------
CREATE TABLE fields (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id         INT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    area_ha         DECIMAL(10, 2) NULL COMMENT 'Field area in hectares',
    soil_type       ENUM('clay','sandy','loam','silt','peat','chalk','clay_loam','sandy_loam') NULL,
    soil_condition  ENUM('excellent','good','fair','poor') NULL DEFAULT 'good',
    soil_ph         DECIMAL(4, 2) NULL COMMENT 'Soil pH value e.g. 6.50',
    latitude        DECIMAL(10, 7) NULL COMMENT 'Centre-point latitude',
    longitude       DECIMAL(10, 7) NULL COMMENT 'Centre-point longitude',
    gps_boundary    TEXT NULL COMMENT 'JSON polygon array of lat/lng pairs',
    description     TEXT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fields_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_fields_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. plots
--    Optional sub-division of a field (raised beds, blocks, zones).
-- -----------------------------------------------------------------------------
CREATE TABLE plots (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    field_id    INT UNSIGNED NOT NULL,
    name        VARCHAR(100) NOT NULL,
    area_ha     DECIMAL(10, 4) NULL,
    description TEXT NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_plots_field FOREIGN KEY (field_id) REFERENCES fields (id) ON DELETE CASCADE,
    INDEX idx_plots_field (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
