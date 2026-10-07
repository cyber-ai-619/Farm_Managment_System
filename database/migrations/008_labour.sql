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
