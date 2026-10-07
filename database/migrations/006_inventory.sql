-- =============================================================
-- Migration 006: Farm Inventory & Inputs
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','animal_feed','vet_medicine','packaging','fuel','tools','equipment_parts','other') NOT NULL,
    sku                  VARCHAR(50) NULL,
    quantity_on_hand     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_of_measure      VARCHAR(20) NOT NULL DEFAULT 'units',
    reorder_level        DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    unit_cost            DECIMAL(10, 2) NULL DEFAULT 0.00,
    storage_location     VARCHAR(100) NULL,
    expiry_date          DATE NULL,
    supplier_name        VARCHAR(150) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invitem_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_invitem_farm     (farm_id),
    INDEX idx_invitem_category (category),
    INDEX idx_invitem_sku      (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    movement_type        ENUM('stock_in','stock_out','adjustment','wastage','transfer') NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit_price           DECIMAL(10, 2) NULL,
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stockmove_item     FOREIGN KEY (item_id)     REFERENCES inventory_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_stockmove_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_stockmove_item (item_id),
    INDEX idx_stockmove_type (movement_type),
    INDEX idx_stockmove_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
