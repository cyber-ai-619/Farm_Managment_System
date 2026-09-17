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
