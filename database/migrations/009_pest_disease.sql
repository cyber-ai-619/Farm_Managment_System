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
