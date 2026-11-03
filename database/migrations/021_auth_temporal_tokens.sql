-- =============================================================
-- Migration 021: Auth Temporal Tokens (Registration & Password Reset)
-- Depends on: 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS pending_registrations (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    farm_name  VARCHAR(150) NOT NULL,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pending_reg_email (email),
    INDEX idx_pending_reg_token (token_hash),
    INDEX idx_pending_reg_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    email      VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used_at    TIMESTAMP    NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_pwd_reset_token (token_hash),
    INDEX idx_pwd_reset_user (user_id),
    INDEX idx_pwd_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
