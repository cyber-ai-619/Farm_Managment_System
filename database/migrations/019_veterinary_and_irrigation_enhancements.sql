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
    ADD COLUMN veterinarian_name  VARCHAR(150) NULL AFTER status,
    ADD COLUMN veterinarian_phone VARCHAR(50)  NULL AFTER veterinarian_name,
    ADD COLUMN veterinarian_id    INT UNSIGNED NULL AFTER veterinarian_phone,
    ADD CONSTRAINT fk_animals_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 4. Vaccinations table: Comprehensive vaccine records & veterinarian attribution
ALTER TABLE vaccinations
    ADD COLUMN veterinarian_name    VARCHAR(150)   NULL AFTER administered_by,
    ADD COLUMN veterinarian_id      INT UNSIGNED   NULL AFTER veterinarian_name,
    ADD COLUMN dosage               VARCHAR(100)   NULL AFTER dose_ml,
    ADD COLUMN route                VARCHAR(50)    NULL DEFAULT 'intramuscular' AFTER dosage,
    ADD COLUMN withdrawal_days_meat INT UNSIGNED   NOT NULL DEFAULT 0 AFTER batch_number,
    ADD COLUMN withdrawal_days_milk INT UNSIGNED   NOT NULL DEFAULT 0 AFTER withdrawal_days_meat,
    ADD COLUMN manufacturer         VARCHAR(150)   NULL AFTER withdrawal_days_milk,
    ADD COLUMN cost                 DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER manufacturer,
    ADD CONSTRAINT fk_vaccinations_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 5. Treatments table: Comprehensive medical records & veterinarian attribution
ALTER TABLE treatments
    ADD COLUMN veterinarian_name VARCHAR(150) NULL AFTER administered_by,
    ADD COLUMN veterinarian_id   INT UNSIGNED NULL AFTER veterinarian_name,
    ADD COLUMN route             VARCHAR(50)  NULL DEFAULT 'intramuscular' AFTER dose,
    ADD COLUMN withdrawal_days   INT UNSIGNED NOT NULL DEFAULT 0 AFTER outcome,
    ADD COLUMN clinic_name       VARCHAR(150) NULL AFTER withdrawal_days,
    ADD CONSTRAINT fk_treatments_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES workers (id) ON DELETE SET NULL;

-- 6. Irrigation Systems table: Sizing, Drip lateral details, and Sprinkler/Pivot specs
ALTER TABLE irrigation_systems
    ADD COLUMN coverage_area_ha       DECIMAL(10, 2) NULL AFTER type,
    ADD COLUMN drip_lines_count       INT UNSIGNED   NULL AFTER coverage_area_ha,
    ADD COLUMN drip_line_length_m     DECIMAL(8, 2)  NULL AFTER drip_lines_count,
    ADD COLUMN line_spacing_m         DECIMAL(6, 2)  NULL AFTER drip_line_length_m,
    ADD COLUMN emitter_spacing_m      DECIMAL(6, 2)  NULL AFTER line_spacing_m,
    ADD COLUMN emitter_flow_rate_lph  DECIMAL(6, 2)  NULL AFTER emitter_spacing_m,
    ADD COLUMN filtration_type        VARCHAR(100)   NULL AFTER emitter_flow_rate_lph,
    ADD COLUMN sprinkler_heads_count  INT UNSIGNED   NULL AFTER filtration_type,
    ADD COLUMN sprinkler_radius_m     DECIMAL(6, 2)  NULL AFTER sprinkler_heads_count,
    ADD COLUMN operating_pressure_bar DECIMAL(6, 2)  NULL AFTER sprinkler_radius_m,
    ADD COLUMN pivot_spans_count      INT UNSIGNED   NULL AFTER operating_pressure_bar,
    ADD COLUMN pivot_length_m         DECIMAL(8, 2)  NULL AFTER pivot_spans_count,
    ADD COLUMN pipe_diameter_mm       DECIMAL(6, 2)  NULL AFTER pivot_length_m;
