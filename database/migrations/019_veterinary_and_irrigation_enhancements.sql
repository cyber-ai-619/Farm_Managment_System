-- =============================================================================
-- Migration 019: Veterinary Linkage & Irrigation Sizing Enhancements
-- Adds veterinarian role, worker roles, animal vet attribution,
-- comprehensive vaccine & treatment health metrics, and deep drip/sprinkler
-- specifications for irrigation systems.
-- =============================================================================

-- 1. Ensure 'veterinarian' role exists in roles table
INSERT IGNORE INTO roles (name) VALUES ('veterinarian');

-- 2. Expand workers.role ENUM to include 'veterinarian'
ALTER TABLE workers 
    MODIFY COLUMN role ENUM(
        'field_worker',
        'supervisor',
        'tractor_driver',
        'harvester',
        'agronomist',
        'technician',
        'general_labour',
        'veterinarian',
        'other'
    ) NOT NULL DEFAULT 'field_worker';

-- 3. Animals table: Add attending veterinarian linkage & contact
ALTER TABLE animals
    ADD COLUMN IF NOT EXISTS veterinarian_name  VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS veterinarian_phone VARCHAR(50)  NULL,
    ADD COLUMN IF NOT EXISTS veterinarian_id    INT UNSIGNED NULL,
    ADD CONSTRAINT fk_animals_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 4. Vaccinations table: Comprehensive vaccine records & veterinarian attribution
ALTER TABLE vaccinations
    ADD COLUMN IF NOT EXISTS veterinarian_name    VARCHAR(150)   NULL,
    ADD COLUMN IF NOT EXISTS veterinarian_id      INT UNSIGNED   NULL,
    ADD COLUMN IF NOT EXISTS dosage               VARCHAR(100)   NULL,
    ADD COLUMN IF NOT EXISTS route                VARCHAR(50)    NULL DEFAULT 'intramuscular',
    ADD COLUMN IF NOT EXISTS withdrawal_days_meat INT UNSIGNED   NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withdrawal_days_milk INT UNSIGNED   NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS manufacturer         VARCHAR(150)   NULL,
    ADD COLUMN IF NOT EXISTS cost                 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD CONSTRAINT fk_vaccinations_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 5. Treatments table: Comprehensive medical records & veterinarian attribution
ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS veterinarian_name VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS veterinarian_id   INT UNSIGNED NULL,
    ADD COLUMN IF NOT EXISTS route             VARCHAR(50)  NULL DEFAULT 'intramuscular',
    ADD COLUMN IF NOT EXISTS withdrawal_days   INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clinic_name       VARCHAR(150) NULL,
    ADD CONSTRAINT fk_treatments_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 6. Irrigation Systems table: Sizing, Drip lateral details, and Sprinkler/Pivot specs
ALTER TABLE irrigation_systems
    ADD COLUMN IF NOT EXISTS coverage_area_ha       DECIMAL(10, 2) NULL,
    ADD COLUMN IF NOT EXISTS drip_lines_count       INT UNSIGNED   NULL,
    ADD COLUMN IF NOT EXISTS drip_line_length_m     DECIMAL(8, 2)  NULL,
    ADD COLUMN IF NOT EXISTS line_spacing_m         DECIMAL(6, 2)  NULL,
    ADD COLUMN IF NOT EXISTS emitter_spacing_m      DECIMAL(6, 2)  NULL,
    ADD COLUMN IF NOT EXISTS emitter_flow_rate_lph  DECIMAL(6, 2)  NULL,
    ADD COLUMN IF NOT EXISTS filtration_type        VARCHAR(100)   NULL,
    ADD COLUMN IF NOT EXISTS sprinkler_heads_count  INT UNSIGNED   NULL,
    ADD COLUMN IF NOT EXISTS sprinkler_radius_m     DECIMAL(6, 2)  NULL,
    ADD COLUMN IF NOT EXISTS operating_pressure_bar DECIMAL(6, 2)  NULL,
    ADD COLUMN IF NOT EXISTS pivot_spans_count      INT UNSIGNED   NULL,
    ADD COLUMN IF NOT EXISTS pivot_length_m         DECIMAL(8, 2)  NULL,
    ADD COLUMN IF NOT EXISTS pipe_diameter_mm       DECIMAL(6, 2)  NULL;
