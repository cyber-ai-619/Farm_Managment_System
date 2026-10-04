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
