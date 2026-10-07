<?php

declare(strict_types=1);

/**
 * WeatherModel
 *
 * Database operations for weather observations and environmental alerts.
 */
class WeatherModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findLatestByFarm(int $farmId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM weather_observations WHERE farm_id = :farm_id ORDER BY observed_at DESC LIMIT 1'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findHistoryByFarm(int $farmId, int $limit = 30): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM weather_observations WHERE farm_id = :farm_id ORDER BY observed_at DESC LIMIT :limit'
        );
        $stmt->bindValue(':farm_id', $farmId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logObservation(int $farmId, ?int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO weather_observations (farm_id, recorded_by, temperature_c, humidity_pct, rainfall_mm, wind_speed_kmh, wind_direction, solar_radiation_wm2, soil_temperature_c, soil_moisture_pct, condition_summary, source, observed_at)
             VALUES (:farm_id, :recorded_by, :temp, :humidity, :rain, :wind_spd, :wind_dir, :solar, :soil_temp, :soil_moisture, :condition, :source, :observed_at)'
        );
        $stmt->execute([
            ':farm_id'       => $farmId,
            ':recorded_by'   => $userId,
            ':temp'          => $data['temperature_c'],
            ':humidity'      => $data['humidity_pct'] ?? null,
            ':rain'          => $data['rainfall_mm'] ?? 0.00,
            ':wind_spd'      => $data['wind_speed_kmh'] ?? null,
            ':wind_dir'      => $data['wind_direction'] ?? null,
            ':solar'         => $data['solar_radiation_wm2'] ?? null,
            ':soil_temp'     => $data['soil_temperature_c'] ?? null,
            ':soil_moisture' => $data['soil_moisture_pct'] ?? null,
            ':condition'     => $data['condition_summary'] ?? null,
            ':source'        => $data['source'] ?? 'manual',
            ':observed_at'   => $data['observed_at'] ?? date('Y-m-d H:i:s'),
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findActiveAlerts(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM weather_alerts
             WHERE farm_id = :farm_id AND is_active = 1 AND valid_until >= NOW()
             ORDER BY valid_from ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createAlert(int $farmId, ?int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO weather_alerts (farm_id, created_by, alert_type, severity, title, description, recommended_action, valid_from, valid_until)
             VALUES (:farm_id, :created_by, :type, :severity, :title, :description, :action, :valid_from, :valid_until)'
        );
        $stmt->execute([
            ':farm_id'     => $farmId,
            ':created_by'  => $userId,
            ':type'        => $data['alert_type'],
            ':severity'    => $data['severity'] ?? 'warning',
            ':title'       => $data['title'],
            ':description' => $data['description'],
            ':action'      => $data['recommended_action'] ?? null,
            ':valid_from'  => $data['valid_from'] ?? date('Y-m-d H:i:s'),
            ':valid_until' => $data['valid_until'] ?? date('Y-m-d H:i:s', strtotime('+24 hours')),
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
