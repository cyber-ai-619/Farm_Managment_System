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
