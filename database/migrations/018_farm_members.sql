-- =============================================================
-- Migration 018: Multi-Tenancy Farm Members & Staff Roles
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS farm_members (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    role_id    INT UNSIGNED NOT NULL,
    status       ENUM('invited', 'active', 'suspended') NOT NULL DEFAULT 'active',
    invite_token VARCHAR(64) NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fm_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_fm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fm_role FOREIGN KEY (role_id) REFERENCES roles (id),
    UNIQUE KEY uq_farm_user (farm_id, user_id),
    INDEX idx_farm_members_farm (farm_id),
    INDEX idx_farm_members_user (user_id),
    INDEX idx_farm_members_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate farm_members with existing farm owners
INSERT IGNORE INTO farm_members (farm_id, user_id, role_id, status)
SELECT f.id, f.owner_id, u.role_id, 'active'
FROM farms f
JOIN users u ON u.id = f.owner_id;
