-- =============================================================
-- Migration 001: Users & Roles
-- Run this first — all other modules depend on users existing.
-- =============================================================

CREATE TABLE IF NOT EXISTS roles (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,        -- admin, farm_owner, farm_manager, agronomist, worker, accountant
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (name) VALUES
    ('admin'),
    ('farm_owner'),
    ('farm_manager'),
    ('agronomist'),
    ('worker'),
    ('accountant');

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT UNSIGNED NOT NULL DEFAULT 5, -- defaults to 'worker'
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED     NULL,              -- NULL for unauthenticated actions
    action     VARCHAR(100) NOT NULL,              -- e.g. 'user.login', 'farm.created'
    table_name VARCHAR(100)     NULL,
    record_id  INT UNSIGNED     NULL,
    ip_address VARCHAR(45)      NULL,
    user_agent TEXT             NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
