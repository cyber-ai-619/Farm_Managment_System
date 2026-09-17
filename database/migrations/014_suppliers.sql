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
