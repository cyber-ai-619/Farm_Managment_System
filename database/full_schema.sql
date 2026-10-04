-- =============================================================================
-- Farm Management System (FFMS) — Complete Unified Database Schema
--
-- Single-file consolidation of all 16 database migrations (Phases 1 to 5).
-- Total Tables: 59 tables
--
-- HOW TO USE ON YOUR LOCAL MACHINE:
-- 1. In phpMyAdmin: Go to Import -> Choose this file -> Click Import.
-- 2. Via CLI: mysql -u root -p < database/full_schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `farm_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `farm_management`;


-- ---------------------------------------------------------------------------
-- SECTION: 001_users_roles.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 001: Users & Roles
-- Run this first — all other modules depend on users existing.
-- =============================================================

CREATE TABLE IF NOT EXISTS roles (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,        -- admin, farm_owner, farm_manager, agronomist, worker, accountant
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (name) VALUES
    ('admin'),
    ('farm_owner'),
    ('farm_manager'),
    ('agronomist'),
    ('worker'),
    ('accountant');

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT UNSIGNED NOT NULL DEFAULT 5, -- defaults to 'worker'
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED     NULL,              -- NULL for unauthenticated actions
    action     VARCHAR(100) NOT NULL,              -- e.g. 'user.login', 'farm.created'
    table_name VARCHAR(100)     NULL,
    record_id  INT UNSIGNED     NULL,
    ip_address VARCHAR(45)      NULL,
    user_agent TEXT             NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 002_farms_fields.sql
-- ---------------------------------------------------------------------------

-- =============================================================================
-- Migration 002: Farm & Field Management
-- Tables: farms, fields, plots
-- Depends on: users (Phase 1)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. farms
--    Top-level entity. A user (farm_owner / admin) owns one or many farms.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
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
CREATE TABLE IF NOT EXISTS fields (
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
CREATE TABLE IF NOT EXISTS plots (
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

-- ---------------------------------------------------------------------------
-- SECTION: 003_crops.sql
-- ---------------------------------------------------------------------------

-- =============================================================================
-- Migration 003: Crop Management
-- Tables: crops, crop_varieties, planting_schedules, fertilizer_records, spraying_schedules
-- Depends on: farms, fields, plots (Migration 002), users (Migration 001)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. crops
--    Master crop catalogue (e.g. "Maize", "Tomato", "Wheat")
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crops (
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
CREATE TABLE IF NOT EXISTS crop_varieties (
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
CREATE TABLE IF NOT EXISTS planting_schedules (
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
CREATE TABLE IF NOT EXISTS fertilizer_records (
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
CREATE TABLE IF NOT EXISTS spraying_schedules (
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

-- ---------------------------------------------------------------------------
-- SECTION: 004_livestock.sql
-- ---------------------------------------------------------------------------

-- =============================================================================
-- Migration 004: Livestock Management
-- Tables: breeds, animals, vaccinations, treatments, feed_records,
--         breeding_records, livestock_production
-- Depends on: farms (Migration 002), users (Migration 001)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. breeds
--    Master breed catalogue (e.g. "Angus", "Holstein Friesian")
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS breeds (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    species     ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_breed_species_name (species, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. animals
--    Individual animal registry. Tied to a farm, optional breed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animals (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id         INT UNSIGNED NOT NULL,
    breed_id        INT UNSIGNED NULL,
    tag_number      VARCHAR(50) NOT NULL COMMENT 'Ear tag / RFID / unique identifier',
    name            VARCHAR(100) NULL COMMENT 'Optional name',
    species         ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    gender          ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown',
    date_of_birth   DATE NULL,
    date_of_death   DATE NULL,
    cause_of_death  VARCHAR(255) NULL,
    weight_kg       DECIMAL(8, 2) NULL COMMENT 'Most recent recorded weight',
    purchase_price  DECIMAL(10, 2) NULL,
    purchase_date   DATE NULL,
    source          VARCHAR(150) NULL COMMENT 'Where the animal came from',
    status          ENUM('active','sold','deceased','quarantine') NOT NULL DEFAULT 'active',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_animals_farm  FOREIGN KEY (farm_id)  REFERENCES farms (id)  ON DELETE CASCADE,
    CONSTRAINT fk_animals_breed FOREIGN KEY (breed_id) REFERENCES breeds (id) ON DELETE SET NULL,
    UNIQUE KEY uq_animals_farm_tag (farm_id, tag_number),
    INDEX idx_animals_farm   (farm_id),
    INDEX idx_animals_status (status),
    INDEX idx_animals_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. vaccinations
--    Vaccination events per animal
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vaccinations (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL COMMENT 'User who recorded / gave the vaccine',
    vaccine_name     VARCHAR(150) NOT NULL,
    disease_target   VARCHAR(150) NULL,
    dose_ml          DECIMAL(8, 2) NULL,
    vaccination_date DATE NOT NULL,
    next_due_date    DATE NULL,
    batch_number     VARCHAR(100) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vaccinations_animal FOREIGN KEY (animal_id)       REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_vaccinations_user   FOREIGN KEY (administered_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_vaccinations_animal (animal_id),
    INDEX idx_vaccinations_date   (vaccination_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. treatments
--    Disease / health treatment events per animal
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatments (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL,
    diagnosis        VARCHAR(255) NOT NULL,
    treatment_name   VARCHAR(150) NOT NULL,
    medication       VARCHAR(150) NULL,
    dose             VARCHAR(100) NULL COMMENT 'e.g. 10ml, 2 tablets',
    treatment_date   DATE NOT NULL,
    follow_up_date   DATE NULL,
    outcome          ENUM('recovered','ongoing','deceased','referred') NULL DEFAULT 'ongoing',
    cost             DECIMAL(10, 2) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_treatments_animal FOREIGN KEY (animal_id)       REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_treatments_user   FOREIGN KEY (administered_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_treatments_animal (animal_id),
    INDEX idx_treatments_date   (treatment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5. feed_records
--    Daily / per-event feed consumption logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_records (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id    INT UNSIGNED NOT NULL,
    recorded_by  INT UNSIGNED NOT NULL,
    feed_type    VARCHAR(150) NOT NULL COMMENT 'e.g. hay, silage, concentrates',
    quantity_kg  DECIMAL(10, 2) NOT NULL,
    cost         DECIMAL(10, 2) NULL,
    feed_date    DATE NOT NULL,
    notes        TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feed_animal FOREIGN KEY (animal_id)   REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_feed_user   FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_feed_animal (animal_id),
    INDEX idx_feed_date   (feed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 6. breeding_records
--    Mating events and pregnancy outcomes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS breeding_records (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dam_id          INT UNSIGNED NOT NULL  COMMENT 'Female animal',
    sire_id         INT UNSIGNED NULL      COMMENT 'Male animal (null = artificial insemination)',
    recorded_by     INT UNSIGNED NOT NULL,
    mating_date     DATE NOT NULL,
    expected_birth  DATE NULL,
    actual_birth    DATE NULL,
    offspring_count TINYINT UNSIGNED NULL DEFAULT 0,
    outcome         ENUM('pending','successful','failed','miscarriage') NOT NULL DEFAULT 'pending',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_breeding_dam      FOREIGN KEY (dam_id)      REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_breeding_sire     FOREIGN KEY (sire_id)     REFERENCES animals (id) ON DELETE SET NULL,
    CONSTRAINT fk_breeding_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_breeding_dam (dam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 7. livestock_production
--    Periodic production records (milk, eggs, wool) per animal
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livestock_production (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT UNSIGNED NOT NULL,
    recorded_by     INT UNSIGNED NOT NULL,
    product_type    ENUM('milk','eggs','wool','meat','honey','other') NOT NULL,
    quantity        DECIMAL(10, 2) NOT NULL,
    unit            VARCHAR(20) NOT NULL COMMENT 'e.g. litres, kg, units',
    production_date DATE NOT NULL,
    quality_grade   ENUM('A','B','C','rejected') NULL DEFAULT 'A',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_production_animal   FOREIGN KEY (animal_id)   REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_production_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_production_animal (animal_id),
    INDEX idx_production_date   (production_date),
    INDEX idx_production_type   (product_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 005_irrigation.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 005: Irrigation & Water Management
-- Depends on: 002_farms_fields.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS water_sources (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('borehole','well','river','dam','municipal','rainwater','canal','other') NOT NULL,
    capacity_litres      DECIMAL(12, 2) NULL,
    current_level_litres DECIMAL(12, 2) NULL,
    ph_level             DECIMAL(4, 2) NULL,
    location_description TEXT NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_watersource_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_watersource_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS irrigation_systems (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    water_source_id      INT UNSIGNED NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('drip','sprinkler','center_pivot','flood','micro_spray','manual','other') NOT NULL,
    flow_rate_lpm        DECIMAL(8, 2) NULL,
    status               ENUM('active','inactive','maintenance','faulty') NOT NULL DEFAULT 'active',
    installation_date    DATE NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_irrigsystem_farm   FOREIGN KEY (farm_id)         REFERENCES farms (id)         ON DELETE CASCADE,
    CONSTRAINT fk_irrigsystem_field  FOREIGN KEY (field_id)        REFERENCES fields (id)        ON DELETE SET NULL,
    CONSTRAINT fk_irrigsystem_source FOREIGN KEY (water_source_id) REFERENCES water_sources (id) ON DELETE SET NULL,
    INDEX idx_irrigsystem_farm  (farm_id),
    INDEX idx_irrigsystem_field (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    system_id            INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    start_time           TIME NOT NULL,
    duration_minutes     INT UNSIGNED NOT NULL,
    target_volume_litres DECIMAL(10, 2) NULL,
    frequency            ENUM('daily','twice_daily','alternate_days','weekly','custom') NOT NULL DEFAULT 'daily',
    days_of_week         VARCHAR(50) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_irrigsched_system  FOREIGN KEY (system_id)  REFERENCES irrigation_systems (id) ON DELETE CASCADE,
    CONSTRAINT fk_irrigsched_field   FOREIGN KEY (field_id)   REFERENCES fields (id)             ON DELETE CASCADE,
    CONSTRAINT fk_irrigsched_creator FOREIGN KEY (created_by) REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_irrigsched_system (system_id),
    INDEX idx_irrigsched_field  (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS water_consumption (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    system_id            INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    volume_litres        DECIMAL(10, 2) NOT NULL,
    duration_minutes     INT UNSIGNED NULL,
    cost_amount          DECIMAL(10, 2) NULL DEFAULT 0.00,
    logged_date          DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consumption_system   FOREIGN KEY (system_id)   REFERENCES irrigation_systems (id) ON DELETE CASCADE,
    CONSTRAINT fk_consumption_field    FOREIGN KEY (field_id)    REFERENCES fields (id)             ON DELETE SET NULL,
    CONSTRAINT fk_consumption_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_consumption_system (system_id),
    INDEX idx_consumption_field  (field_id),
    INDEX idx_consumption_date   (logged_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 006_inventory.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 006: Farm Inventory & Inputs
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','animal_feed','vet_medicine','packaging','fuel','tools','equipment_parts','other') NOT NULL,
    sku                  VARCHAR(50) NULL,
    quantity_on_hand     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_of_measure      VARCHAR(20) NOT NULL DEFAULT 'units',
    reorder_level        DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    unit_cost            DECIMAL(10, 2) NULL DEFAULT 0.00,
    storage_location     VARCHAR(100) NULL,
    expiry_date          DATE NULL,
    supplier_name        VARCHAR(150) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invitem_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_invitem_farm     (farm_id),
    INDEX idx_invitem_category (category),
    INDEX idx_invitem_sku      (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    movement_type        ENUM('stock_in','stock_out','adjustment','wastage','transfer') NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit_price           DECIMAL(10, 2) NULL,
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stockmove_item     FOREIGN KEY (item_id)     REFERENCES inventory_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_stockmove_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_stockmove_item (item_id),
    INDEX idx_stockmove_type (movement_type),
    INDEX idx_stockmove_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 007_equipment.sql
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- SECTION: 008_labour.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 008: Labour & Employee Management
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS workers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    user_id              INT UNSIGNED NULL,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    id_national_number   VARCHAR(50) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    role                 ENUM('field_worker','supervisor','tractor_driver','harvester','agronomist','technician','general_labour','other') NOT NULL DEFAULT 'field_worker',
    employment_type      ENUM('permanent','seasonal','temporary','contract','daily') NOT NULL DEFAULT 'permanent',
    daily_rate           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    hire_date            DATE NULL,
    status               ENUM('active','on_leave','terminated','suspended') NOT NULL DEFAULT 'active',
    emergency_contact    VARCHAR(150) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_worker_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_worker_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_worker_farm   (farm_id),
    INDEX idx_worker_status (status),
    INDEX idx_worker_role   (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS worker_attendance (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id            INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    work_date            DATE NOT NULL,
    status               ENUM('present','absent','half_day','sick_leave','paid_leave','unpaid_leave') NOT NULL DEFAULT 'present',
    hours_worked         DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
    overtime_hours       DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attend_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE CASCADE,
    CONSTRAINT fk_attend_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_attend_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    UNIQUE KEY uq_worker_date (worker_id, work_date),
    INDEX idx_attend_farm (farm_id),
    INDEX idx_attend_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_assignments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    worker_id            INT UNSIGNED NULL,
    assigned_by          INT UNSIGNED NOT NULL,
    title                VARCHAR(150) NOT NULL,
    description          TEXT NULL,
    priority             ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    due_date             DATE NULL,
    status               ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    completed_at         TIMESTAMP NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_task_field    FOREIGN KEY (field_id)    REFERENCES fields (id)  ON DELETE SET NULL,
    CONSTRAINT fk_task_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE SET NULL,
    CONSTRAINT fk_task_assigner FOREIGN KEY (assigned_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_task_farm   (farm_id),
    INDEX idx_task_worker (worker_id),
    INDEX idx_task_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payroll_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id            INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    period_start         DATE NOT NULL,
    period_end           DATE NOT NULL,
    days_worked          DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    base_salary          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    overtime_amount      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus_amount         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_payable          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status       ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
    payment_date         DATE NULL,
    payment_method       ENUM('cash','bank_transfer','mobile_money','cheque') NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payroll_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_payroll_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_payroll_worker (worker_id),
    INDEX idx_payroll_farm   (farm_id),
    INDEX idx_payroll_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 009_pest_disease.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 009: Pest & Disease Management
-- Depends on: 002_farms_fields.sql, 003_crops.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS pests_diseases (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    scientific_name      VARCHAR(150) NULL,
    type                 ENUM('pest','fungal_disease','bacterial_disease','viral_disease','weed','nematode','deficiency','other') NOT NULL,
    affected_crops       TEXT NULL,
    symptoms_description TEXT NULL,
    prevention_measures  TEXT NULL,
    recommended_control  TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pest_type (type),
    INDEX idx_pest_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scouting_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    crop_id              INT UNSIGNED NULL,
    pest_disease_id      INT UNSIGNED NULL,
    scouted_by           INT UNSIGNED NOT NULL,
    severity             ENUM('low','moderate','severe','critical') NOT NULL DEFAULT 'low',
    affected_area_pct    DECIMAL(5, 2) NULL,
    observation_date     DATE NOT NULL,
    symptoms_found       TEXT NULL,
    action_required      TINYINT(1) NOT NULL DEFAULT 0,
    photo_url            VARCHAR(255) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scout_farm     FOREIGN KEY (farm_id)         REFERENCES farms (id)          ON DELETE CASCADE,
    CONSTRAINT fk_scout_field    FOREIGN KEY (field_id)        REFERENCES fields (id)         ON DELETE CASCADE,
    CONSTRAINT fk_scout_crop     FOREIGN KEY (crop_id)         REFERENCES crops (id)          ON DELETE SET NULL,
    CONSTRAINT fk_scout_pest     FOREIGN KEY (pest_disease_id) REFERENCES pests_diseases (id) ON DELETE SET NULL,
    CONSTRAINT fk_scout_recorder FOREIGN KEY (scouted_by)      REFERENCES users (id)          ON DELETE CASCADE,
    INDEX idx_scout_field    (field_id),
    INDEX idx_scout_severity (severity),
    INDEX idx_scout_date     (observation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pest_treatments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scouting_id          INT UNSIGNED NULL,
    field_id             INT UNSIGNED NOT NULL,
    applied_by           INT UNSIGNED NOT NULL,
    treatment_type       ENUM('chemical_spray','biological_control','organic_spray','cultural_control','pruning_removal','other') NOT NULL DEFAULT 'chemical_spray',
    chemical_product     VARCHAR(150) NOT NULL,
    active_ingredient    VARCHAR(150) NULL,
    dosage_rate          VARCHAR(100) NOT NULL,
    total_quantity_used  DECIMAL(10, 2) NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'litres',
    application_date     DATE NOT NULL,
    pre_harvest_interval_days INT UNSIGNED NULL DEFAULT 0,
    re_entry_interval_hours   INT UNSIGNED NULL DEFAULT 24,
    effectiveness        ENUM('pending','highly_effective','moderately_effective','ineffective') NOT NULL DEFAULT 'pending',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_treat_scout    FOREIGN KEY (scouting_id) REFERENCES scouting_records (id) ON DELETE SET NULL,
    CONSTRAINT fk_treat_field    FOREIGN KEY (field_id)    REFERENCES fields (id)           ON DELETE CASCADE,
    CONSTRAINT fk_treat_applier  FOREIGN KEY (applied_by)  REFERENCES users (id)            ON DELETE CASCADE,
    INDEX idx_treat_field (field_id),
    INDEX idx_treat_date  (application_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 010_weather.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 010: Weather & Environmental Monitoring
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS weather_observations (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NULL,
    temperature_c        DECIMAL(5, 2) NOT NULL,
    humidity_pct         DECIMAL(5, 2) NULL,
    rainfall_mm          DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    wind_speed_kmh       DECIMAL(5, 2) NULL,
    wind_direction       VARCHAR(10) NULL,
    solar_radiation_wm2  DECIMAL(7, 2) NULL,
    soil_temperature_c   DECIMAL(5, 2) NULL,
    soil_moisture_pct    DECIMAL(5, 2) NULL,
    condition_summary    VARCHAR(100) NULL,
    source               ENUM('manual','sensor','open_meteo_api','station') NOT NULL DEFAULT 'manual',
    observed_at          DATETIME NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weather_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_weather_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_weather_farm (farm_id),
    INDEX idx_weather_date (observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS weather_alerts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NULL,
    alert_type           ENUM('frost','heatwave','heavy_rain','flood','drought','strong_winds','hail','storm','high_humidity') NOT NULL,
    severity             ENUM('advisory','watch','warning','emergency') NOT NULL DEFAULT 'warning',
    title                VARCHAR(150) NOT NULL,
    description          TEXT NOT NULL,
    recommended_action   TEXT NULL,
    valid_from           DATETIME NOT NULL,
    valid_until          DATETIME NOT NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weathalert_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_weathalert_creator  FOREIGN KEY (created_by)  REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_weathalert_farm   (farm_id),
    INDEX idx_weathalert_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 011_harvest.sql
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- SECTION: 012_sales.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 012: Market & Sales Management
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS customers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('wholesaler','retailer','processor','direct_consumer','supermarket','export','other') NOT NULL DEFAULT 'wholesaler',
    contact_person       VARCHAR(100) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    address              TEXT NULL,
    tax_number           VARCHAR(50) NULL,
    credit_limit         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_customer_farm (farm_id),
    INDEX idx_customer_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_orders (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    customer_id          INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    order_number         VARCHAR(50) NOT NULL UNIQUE,
    order_date           DATE NOT NULL,
    delivery_date        DATE NULL,
    status               ENUM('draft','confirmed','processing','dispatched','delivered','cancelled') NOT NULL DEFAULT 'draft',
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    CONSTRAINT fk_so_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_so_creator  FOREIGN KEY (created_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_so_farm     (farm_id),
    INDEX idx_so_customer (customer_id),
    INDEX idx_so_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id             INT UNSIGNED NOT NULL,
    item_type            ENUM('crop','livestock','value_added','other') NOT NULL DEFAULT 'crop',
    item_id              INT UNSIGNED NULL,
    item_name            VARCHAR(150) NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'kg',
    unit_price           DECIMAL(10, 2) NOT NULL,
    total_price          DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES sales_orders (id) ON DELETE CASCADE,
    INDEX idx_oi_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id             INT UNSIGNED NOT NULL UNIQUE,
    customer_id          INT UNSIGNED NOT NULL,
    invoice_number       VARCHAR(50) NOT NULL UNIQUE,
    issue_date           DATE NOT NULL,
    due_date             DATE NOT NULL,
    subtotal             DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount           DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status               ENUM('unpaid','partially_paid','paid','overdue','cancelled') NOT NULL DEFAULT 'unpaid',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_order    FOREIGN KEY (order_id)    REFERENCES sales_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES customers (id)    ON DELETE CASCADE,
    INDEX idx_inv_customer (customer_id),
    INDEX idx_inv_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id           INT UNSIGNED NOT NULL,
    customer_id          INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    amount               DECIMAL(12, 2) NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','credit_card') NOT NULL DEFAULT 'bank_transfer',
    payment_date         DATE NOT NULL,
    reference_number     VARCHAR(100) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices (id)  ON DELETE CASCADE,
    CONSTRAINT fk_pay_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_pay_invoice  (invoice_id),
    INDEX idx_pay_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS market_prices (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    commodity_name       VARCHAR(150) NOT NULL,
    market_location      VARCHAR(100) NOT NULL,
    price_per_unit       DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'kg',
    recorded_date        DATE NOT NULL,
    source               VARCHAR(100) NULL DEFAULT 'Agricultural Market Board',
    trend                ENUM('rising','stable','falling') NOT NULL DEFAULT 'stable',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mp_commodity (commodity_name),
    INDEX idx_mp_location  (market_location),
    INDEX idx_mp_date      (recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 013_finance.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 013: Financial Management
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS income_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    category             ENUM('crop_sales','livestock_sales','byproducts','subsidies','grants','machinery_rental','agritourism','consulting','other') NOT NULL DEFAULT 'crop_sales',
    amount               DECIMAL(12, 2) NOT NULL,
    date_received        DATE NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','other') NOT NULL DEFAULT 'bank_transfer',
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    payer_name           VARCHAR(150) NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inc_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_inc_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_inc_farm     (farm_id),
    INDEX idx_inc_category (category),
    INDEX idx_inc_date     (date_received)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expense_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','animal_feed','veterinary','fuel','labour_wages','equipment_maintenance','machinery_repairs','irrigation_water','utilities','land_lease','insurance','packaging','transport','other') NOT NULL,
    amount               DECIMAL(12, 2) NOT NULL,
    date_incurred        DATE NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','credit_card','other') NOT NULL DEFAULT 'bank_transfer',
    vendor_name          VARCHAR(150) NULL,
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_exp_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_exp_farm     (farm_id),
    INDEX idx_exp_category (category),
    INDEX idx_exp_date     (date_incurred)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS loans (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    lender_name          VARCHAR(150) NOT NULL,
    principal_amount     DECIMAL(12, 2) NOT NULL,
    interest_rate_pct    DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    loan_term_months     INT UNSIGNED NOT NULL,
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    monthly_payment      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_remaining    DECIMAL(12, 2) NOT NULL,
    status               ENUM('active','paid_off','defaulted','restructured') NOT NULL DEFAULT 'active',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_loan_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_loan_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_loan_farm   (farm_id),
    INDEX idx_loan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS budgets (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    fiscal_year          INT UNSIGNED NOT NULL,
    period_name          VARCHAR(50) NOT NULL DEFAULT 'Annual',
    category             VARCHAR(100) NOT NULL,
    budgeted_amount      DECIMAL(12, 2) NOT NULL,
    actual_amount        DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_farm    FOREIGN KEY (farm_id)    REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_budget_farm (farm_id),
    INDEX idx_budget_year (fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 014_suppliers.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 014: Supplier & Procurement Management
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','machinery','feed','veterinary','packaging','fuel','tools','general','other') NOT NULL DEFAULT 'general',
    contact_person       VARCHAR(100) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    address              TEXT NULL,
    tax_id               VARCHAR(50) NULL,
    rating               DECIMAL(3, 2) NULL DEFAULT 5.00,
    payment_terms_days   INT UNSIGNED NOT NULL DEFAULT 30,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_supp_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_supp_farm     (farm_id),
    INDEX idx_supp_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS supplier_quotations (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id          INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    item_description     VARCHAR(200) NOT NULL,
    quoted_price         DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'units',
    valid_until          DATE NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quote_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    INDEX idx_quote_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    supplier_id          INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    approved_by          INT UNSIGNED NULL,
    po_number            VARCHAR(50) NOT NULL UNIQUE,
    order_date           DATE NOT NULL,
    expected_delivery_date DATE NULL,
    status               ENUM('draft','submitted','approved','rejected','received','cancelled') NOT NULL DEFAULT 'draft',
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
    CONSTRAINT fk_po_creator  FOREIGN KEY (created_by)  REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT fk_po_approver FOREIGN KEY (approved_by) REFERENCES users (id)     ON DELETE SET NULL,
    INDEX idx_po_farm     (farm_id),
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id    INT UNSIGNED NOT NULL,
    description          VARCHAR(200) NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'units',
    unit_price           DECIMAL(10, 2) NOT NULL,
    total_price          DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_poi_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE,
    INDEX idx_poi_order (purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- SECTION: 015_storage.sql
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- SECTION: 016_notifications.sql
-- ---------------------------------------------------------------------------

-- =============================================================
-- Migration 016: Notifications & System Alerts
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    user_id              INT UNSIGNED NULL,
    alert_type           ENUM('inventory_low','maintenance_due','weather_risk','vaccination_due','harvest_due','pest_outbreak','task_overdue','loan_payment_due','general') NOT NULL DEFAULT 'general',
    title                VARCHAR(150) NOT NULL,
    message              TEXT NOT NULL,
    severity             ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
    is_read              TINYINT(1) NOT NULL DEFAULT 0,
    is_dismissed         TINYINT(1) NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_alert_farm      (farm_id),
    INDEX idx_alert_user      (user_id),
    INDEX idx_alert_type      (alert_type),
    INDEX idx_alert_severity  (severity),
    INDEX idx_alert_dismissed (is_dismissed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_logs (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_id             INT UNSIGNED NOT NULL,
    channel              ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
    status               ENUM('sent','delivered','failed') NOT NULL DEFAULT 'sent',
    sent_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
    INDEX idx_notif_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
