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
        $sql = 'SELECT * FROM alerts 
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

    public function findAlertHistory(int $farmId, int $limit = 50): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM alerts 
             WHERE farm_id = :farm_id 
             ORDER BY created_at DESC 
             LIMIT :limit'
        );
        $stmt->bindValue(':farm_id', $farmId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM alerts WHERE id = :id LIMIT 1');
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
        $stmt = $this->pdo->prepare(
            'INSERT INTO alerts (farm_id, user_id, alert_type, title, message, severity, is_read, is_dismissed)
             VALUES (:farm_id, :user_id, :alert_type, :title, :message, :severity, 0, 0)'
        );
        $stmt->execute([
            ':farm_id'    => $farmId,
            ':user_id'    => $userId,
            ':alert_type' => $data['alert_type'] ?? 'general',
            ':title'      => $data['title'],
            ':message'    => $data['message'],
            ':severity'   => $data['severity'] ?? 'info',
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
