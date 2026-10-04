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
