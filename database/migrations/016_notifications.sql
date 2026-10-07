-- =============================================================
-- Migration 016: Notifications & System Alerts
-- Depends on: 002_farms_fields.sql, 001_users_roles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    user_id              INT UNSIGNED NULL,
    alert_type           ENUM('inventory_low','maintenance_due','weather_risk','vaccination_due','harvest_due','pest_outbreak','task_overdue','loan_payment_due','general') NOT NULL DEFAULT 'general',
    title                VARCHAR(150) NOT NULL,
    message              TEXT NOT NULL,
    severity             ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
    is_read              TINYINT(1) NOT NULL DEFAULT 0,
    is_dismissed         TINYINT(1) NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_alert_farm      (farm_id),
    INDEX idx_alert_user      (user_id),
    INDEX idx_alert_type      (alert_type),
    INDEX idx_alert_severity  (severity),
    INDEX idx_alert_dismissed (is_dismissed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_logs (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_id             INT UNSIGNED NOT NULL,
    channel              ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
    status               ENUM('sent','delivered','failed') NOT NULL DEFAULT 'sent',
    sent_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
    INDEX idx_notif_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
