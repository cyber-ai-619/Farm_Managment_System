-- =============================================================================
-- Migration 020: Farm Worker Subsystem Enhancements
-- Adds task execution lifecycle (started_at, completion_notes, verified_by),
-- worker attendance self-clock timestamps & verification (clock_in_time, is_verified),
-- and field_incidents table for worker hazard/issue reporting.
-- =============================================================================

-- 1. Enhance task_assignments table for worker progress and owner verification
ALTER TABLE task_assignments
    ADD COLUMN IF NOT EXISTS started_at       TIMESTAMP    NULL,
    ADD COLUMN IF NOT EXISTS completion_notes TEXT         NULL,
    ADD COLUMN IF NOT EXISTS verified_by      INT UNSIGNED NULL,
    ADD COLUMN IF NOT EXISTS verified_at      TIMESTAMP    NULL;

-- Add foreign key constraint for verified_by if not present
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'task_assignments'
      AND CONSTRAINT_NAME = 'fk_task_verified_by'
);
SET @sql := IF(@fk_exists = 0,
    'ALTER TABLE task_assignments ADD CONSTRAINT fk_task_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Enhance worker_attendance table for self-clock-in/out and verification
ALTER TABLE worker_attendance
    ADD COLUMN IF NOT EXISTS clock_in_time  TIME         NULL,
    ADD COLUMN IF NOT EXISTS clock_out_time TIME         NULL,
    ADD COLUMN IF NOT EXISTS is_verified    TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified_by    INT UNSIGNED NULL,
    ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMP    NULL;

SET @fk_attend_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'worker_attendance'
      AND CONSTRAINT_NAME = 'fk_attend_verified_by'
);
SET @sql_attend := IF(@fk_attend_exists = 0,
    'ALTER TABLE worker_attendance ADD CONSTRAINT fk_attend_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_attend FROM @sql_attend;
EXECUTE stmt_attend;
DEALLOCATE PREPARE stmt_attend;


-- 3. Create field_incidents table for worker hazard and issue reporting
CREATE TABLE IF NOT EXISTS field_incidents (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id          INT UNSIGNED NOT NULL,
    worker_id        INT UNSIGNED NULL,
    reported_by      INT UNSIGNED NOT NULL,
    field_id         INT UNSIGNED NULL,
    type             ENUM('irrigation_leak', 'equipment_breakdown', 'pest_outbreak', 'livestock_injury', 'hazard', 'other') NOT NULL DEFAULT 'hazard',
    severity         ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    title            VARCHAR(150) NOT NULL,
    description      TEXT NULL,
    status           ENUM('open', 'investigating', 'resolved') NOT NULL DEFAULT 'open',
    resolution_notes TEXT NULL,
    resolved_by      INT UNSIGNED NULL,
    resolved_at      TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident_farm        FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_incident_worker      FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_reporter    FOREIGN KEY (reported_by) REFERENCES users (id)   ON DELETE CASCADE,
    CONSTRAINT fk_incident_field       FOREIGN KEY (field_id)    REFERENCES fields (id)  ON DELETE SET NULL,
    CONSTRAINT fk_incident_resolver    FOREIGN KEY (resolved_by) REFERENCES users (id)   ON DELETE SET NULL,
    INDEX idx_incident_farm   (farm_id),
    INDEX idx_incident_worker (worker_id),
    INDEX idx_incident_status (status),
    INDEX idx_incident_type   (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
