<?php

declare(strict_types=1);

/**
 * IrrigationModel
 *
 * Database operations for water sources, irrigation systems,
 * watering schedules, and water consumption records.
 */
class IrrigationModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // WATER SOURCES
    // =========================================================================

    public function findSourcesByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM water_sources WHERE farm_id = :farm_id AND is_active = 1 ORDER BY name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createSource(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO water_sources (farm_id, name, type, capacity_litres, current_level_litres, ph_level, location_description)
             VALUES (:farm_id, :name, :type, :capacity_litres, :current_level_litres, :ph_level, :location_description)'
        );
        $stmt->execute([
            ':farm_id'              => $farmId,
            ':name'                 => $data['name'],
            ':type'                 => $data['type'] ?? 'borehole',
            ':capacity_litres'      => $data['capacity_litres'] ?? null,
            ':current_level_litres' => $data['current_level_litres'] ?? null,
            ':ph_level'             => $data['ph_level'] ?? null,
            ':location_description' => $data['location_description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // IRRIGATION SYSTEMS
    // =========================================================================

    public function findSystemsByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, f.name AS field_name, ws.name AS source_name
             FROM irrigation_systems s
             LEFT JOIN fields f ON f.id = s.field_id
             LEFT JOIN water_sources ws ON ws.id = s.water_source_id
             WHERE s.farm_id = :farm_id
             ORDER BY s.name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findSystemById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, f.name AS field_name, ws.name AS source_name
             FROM irrigation_systems s
             LEFT JOIN fields f ON f.id = s.field_id
             LEFT JOIN water_sources ws ON ws.id = s.water_source_id
             WHERE s.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createSystem(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO irrigation_systems (farm_id, field_id, water_source_id, name, type, flow_rate_lpm, status, installation_date, notes)
             VALUES (:farm_id, :field_id, :water_source_id, :name, :type, :flow_rate_lpm, :status, :installation_date, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':field_id'          => $data['field_id'] ?? null,
            ':water_source_id'   => $data['water_source_id'] ?? null,
            ':name'              => $data['name'],
            ':type'              => $data['type'] ?? 'drip',
            ':flow_rate_lpm'     => $data['flow_rate_lpm'] ?? null,
            ':status'            => $data['status'] ?? 'active',
            ':installation_date' => $data['installation_date'] ?? null,
            ':notes'             => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateSystem(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE irrigation_systems
             SET name = :name, type = :type, field_id = :field_id, water_source_id = :water_source_id,
                 flow_rate_lpm = :flow_rate_lpm, status = :status, notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'              => $id,
            ':name'            => $data['name'],
            ':type'            => $data['type'],
            ':field_id'        => $data['field_id'] ?? null,
            ':water_source_id' => $data['water_source_id'] ?? null,
            ':flow_rate_lpm'   => $data['flow_rate_lpm'] ?? null,
            ':status'          => $data['status'] ?? 'active',
            ':notes'           => $data['notes'] ?? null,
        ]);
    }

    public function deleteSystem(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM irrigation_systems WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // =========================================================================
    // SCHEDULES
    // =========================================================================

    public function findSchedulesBySystem(int $systemId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, f.name AS field_name, u.name AS created_by_name
             FROM irrigation_schedules s
             JOIN fields f ON f.id = s.field_id
             JOIN users u ON u.id = s.created_by
             WHERE s.system_id = :system_id AND s.is_active = 1
             ORDER BY s.start_time ASC'
        );
        $stmt->execute([':system_id' => $systemId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createSchedule(int $systemId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO irrigation_schedules (system_id, field_id, created_by, start_time, duration_minutes, target_volume_litres, frequency, days_of_week, notes)
             VALUES (:system_id, :field_id, :created_by, :start_time, :duration_minutes, :target_volume_litres, :frequency, :days_of_week, :notes)'
        );
        $stmt->execute([
            ':system_id'            => $systemId,
            ':field_id'             => $data['field_id'],
            ':created_by'           => $userId,
            ':start_time'           => $data['start_time'],
            ':duration_minutes'     => (int) ($data['duration_minutes'] ?? 60),
            ':target_volume_litres' => $data['target_volume_litres'] ?? null,
            ':frequency'            => $data['frequency'] ?? 'daily',
            ':days_of_week'         => $data['days_of_week'] ?? null,
            ':notes'                => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // WATER CONSUMPTION
    // =========================================================================

    public function findConsumption(int $systemId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT c.*, u.name AS recorded_by_name
             FROM water_consumption c
             JOIN users u ON u.id = c.recorded_by
             WHERE c.system_id = :system_id
             ORDER BY c.logged_date DESC, c.id DESC'
        );
        $stmt->execute([':system_id' => $systemId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logConsumption(int $systemId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO water_consumption (system_id, field_id, recorded_by, volume_litres, duration_minutes, cost_amount, logged_date, notes)
             VALUES (:system_id, :field_id, :recorded_by, :volume_litres, :duration_minutes, :cost_amount, :logged_date, :notes)'
        );
        $stmt->execute([
            ':system_id'        => $systemId,
            ':field_id'         => $data['field_id'] ?? null,
            ':recorded_by'      => $userId,
            ':volume_litres'    => $data['volume_litres'],
            ':duration_minutes' => $data['duration_minutes'] ?? null,
            ':cost_amount'      => $data['cost_amount'] ?? 0.00,
            ':logged_date'      => $data['logged_date'] ?? date('Y-m-d'),
            ':notes'            => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
