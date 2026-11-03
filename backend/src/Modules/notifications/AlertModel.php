<?php

declare(strict_types=1);

/**
 * AlertModel
 *
 * Database operations for system notifications and alerts.
 */
class AlertModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findActiveAlerts(int $farmId, ?int $userId = null): array
    {
        $sql = 'SELECT *, alert_type AS category FROM alerts 
                WHERE farm_id = :farm_id 
                  AND is_dismissed = 0';
        $params = [':farm_id' => $farmId];

        if ($userId !== null) {
            $sql .= ' AND (user_id = :user_id OR user_id IS NULL)';
            $params[':user_id'] = $userId;
        }

        $sql .= ' ORDER BY CASE severity WHEN "critical" THEN 1 WHEN "warning" THEN 2 ELSE 3 END, created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getActiveAlerts(int $farmId, ?int $userId = null): array
    {
        return $this->findActiveAlerts($farmId, $userId);
    }

    public function findAlertHistory(int $farmId, int $limit = 50): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT *, alert_type AS category FROM alerts 
             WHERE farm_id = :farm_id 
             ORDER BY created_at DESC 
             LIMIT :limit'
        );
        $stmt->bindValue(':farm_id', $farmId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAlertHistory(int $farmId, int $limit = 50): array
    {
        return $this->findAlertHistory($farmId, $limit);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT *, alert_type AS category FROM alerts WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function alertExists(int $farmId, string $alertType, string $title): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM alerts 
             WHERE farm_id = :farm_id 
               AND alert_type = :type 
               AND title = :title 
               AND is_dismissed = 0 
             LIMIT 1'
        );
        $stmt->execute([
            ':farm_id' => $farmId,
            ':type'    => $alertType,
            ':title'   => $title,
        ]);
        return (bool) $stmt->fetch();
    }

    public function createAlert(int $farmId, ?int $userId, array $data): int
    {
        $rawType = strtolower(trim((string) ($data['alert_type'] ?? ($data['category'] ?? 'general'))));
        $typeMap = [
            'weather'      => 'weather_risk',
            'inventory'    => 'inventory_low',
            'equipment'    => 'maintenance_due',
            'pest_disease' => 'pest_outbreak',
            'livestock'    => 'vaccination_due',
            'irrigation'   => 'general',
        ];
        $alertType = $typeMap[$rawType] ?? str_replace(' ', '_', $rawType);
        $validTypes = ['inventory_low', 'maintenance_due', 'weather_risk', 'vaccination_due', 'harvest_due', 'pest_outbreak', 'task_overdue', 'loan_payment_due', 'general'];
        if (!in_array($alertType, $validTypes, true)) {
            $alertType = 'general';
        }

        $severity = strtolower(trim((string) ($data['severity'] ?? 'info')));
        if (!in_array($severity, ['info', 'warning', 'critical'], true)) {
            $severity = 'info';
        }

        $resolvedUserId = ($userId !== null && $userId > 0)
            ? $userId
            : (!empty($data['user_id']) ? (int) $data['user_id'] : null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO alerts (farm_id, user_id, alert_type, title, message, severity, is_read, is_dismissed)
             VALUES (:farm_id, :user_id, :alert_type, :title, :message, :severity, 0, 0)'
        );
        $stmt->execute([
            ':farm_id'    => $farmId,
            ':user_id'    => $resolvedUserId,
            ':alert_type' => $alertType,
            ':title'      => $data['title'],
            ':message'    => $data['message'],
            ':severity'   => $severity,
        ]);
        $alertId = (int) $this->pdo->lastInsertId();

        // Log notification entry
        $logStmt = $this->pdo->prepare(
            'INSERT INTO notification_logs (alert_id, channel, status) VALUES (:alert_id, "in_app", "sent")'
        );
        $logStmt->execute([':alert_id' => $alertId]);

        return $alertId;
    }

    public function dismissAlert(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE alerts SET is_dismissed = 1, updated_at = NOW() WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function markAsRead(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE alerts SET is_read = 1, updated_at = NOW() WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }
}
