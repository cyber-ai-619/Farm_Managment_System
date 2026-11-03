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

    // =========================================================================
    // WATER SOURCES
    // =========================================================================

    public function findSourcesByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*,
                    s.type AS source_type,
                    s.capacity_litres AS capacity_liters,
                    s.current_level_litres AS current_level_liters
             FROM water_sources s
             WHERE s.farm_id = :farm_id AND s.is_active = 1
             ORDER BY s.name ASC'
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

        $type = strtolower(trim((string)($data['type'] ?? ($data['source_type'] ?? 'borehole'))));
        if ($type === 'rainwater tank') $type = 'rainwater';
        if ($type === 'reservoir') $type = 'dam';
        $validTypes = ['borehole','well','river','dam','municipal','rainwater','canal','other'];
        if (!in_array($type, $validTypes)) $type = 'other';

        $stmt->execute([
            ':farm_id'              => $farmId,
            ':name'                 => $data['name'],
            ':type'                 => $type,
            ':capacity_litres'      => !empty($data['capacity_litres']) ? (float)$data['capacity_litres'] : (!empty($data['capacity_liters']) ? (float)$data['capacity_liters'] : null),
            ':current_level_litres' => !empty($data['current_level_litres']) ? (float)$data['current_level_litres'] : (!empty($data['current_level_liters']) ? (float)$data['current_level_liters'] : null),
            ':ph_level'             => !empty($data['ph_level']) ? (float)$data['ph_level'] : null,
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
            'SELECT s.*,
                    s.type AS system_type,
                    f.name AS field_name,
                    f.area_ha AS field_area_ha,
                    ws.name AS source_name,
                    ws.type AS source_type,
                    ROUND(COALESCE(s.drip_lines_count * s.drip_line_length_m, (s.coverage_area_ha * 10000) / NULLIF(s.line_spacing_m, 0)), 1) AS total_drip_length_m
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
            'SELECT s.*,
                    s.type AS system_type,
                    f.name AS field_name,
                    f.area_ha AS field_area_ha,
                    ws.name AS source_name,
                    ws.type AS source_type,
                    ROUND(COALESCE(s.drip_lines_count * s.drip_line_length_m, (s.coverage_area_ha * 10000) / NULLIF(s.line_spacing_m, 0)), 1) AS total_drip_length_m
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

    private function normalizeSystemStatus(mixed $val): string
    {
        $status = strtolower(trim((string) ($val ?? 'active')));
        $allowed = ['active', 'inactive', 'maintenance', 'faulty'];
        return in_array($status, $allowed, true) ? $status : 'active';
    }

    public function createSystem(int $farmId, array $data): int
    {
        $type = strtolower(trim((string)($data['type'] ?? ($data['system_type'] ?? 'drip'))));
        if ($type === 'pivot') $type = 'center_pivot';
        if ($type === 'center pivot') $type = 'center_pivot';
        if ($type === 'micro spray' || $type === 'microspray') $type = 'micro_spray';
        $validTypes = ['drip','sprinkler','center_pivot','flood','micro_spray','manual','other'];
        if (!in_array($type, $validTypes)) $type = 'other';

        $sourceId = !empty($data['water_source_id']) ? (int)$data['water_source_id'] : (!empty($data['source_id']) ? (int)$data['source_id'] : null);
        $fieldId  = !empty($data['field_id']) ? (int)$data['field_id'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO irrigation_systems 
                (farm_id, field_id, water_source_id, name, type, coverage_area_ha,
                 drip_lines_count, drip_line_length_m, line_spacing_m, emitter_spacing_m,
                 emitter_flow_rate_lph, filtration_type, sprinkler_heads_count,
                 sprinkler_radius_m, operating_pressure_bar, pivot_spans_count,
                 pivot_length_m, pipe_diameter_mm, flow_rate_lpm, status, installation_date, notes)
             VALUES 
                (:farm_id, :field_id, :water_source_id, :name, :type, :coverage_area_ha,
                 :drip_lines_count, :drip_line_length_m, :line_spacing_m, :emitter_spacing_m,
                 :emitter_flow_rate_lph, :filtration_type, :sprinkler_heads_count,
                 :sprinkler_radius_m, :operating_pressure_bar, :pivot_spans_count,
                 :pivot_length_m, :pipe_diameter_mm, :flow_rate_lpm, :status, :installation_date, :notes)'
        );
        $stmt->execute([
            ':farm_id'                => $farmId,
            ':field_id'               => $fieldId,
            ':water_source_id'        => $sourceId,
            ':name'                   => $data['name'],
            ':type'                   => $type,
            ':coverage_area_ha'       => !empty($data['coverage_area_ha']) ? (float)$data['coverage_area_ha'] : null,
            ':drip_lines_count'       => !empty($data['drip_lines_count']) ? (int)$data['drip_lines_count'] : null,
            ':drip_line_length_m'     => !empty($data['drip_line_length_m']) ? (float)$data['drip_line_length_m'] : null,
            ':line_spacing_m'         => !empty($data['line_spacing_m']) ? (float)$data['line_spacing_m'] : null,
            ':emitter_spacing_m'      => !empty($data['emitter_spacing_m']) ? (float)$data['emitter_spacing_m'] : null,
            ':emitter_flow_rate_lph'  => !empty($data['emitter_flow_rate_lph']) ? (float)$data['emitter_flow_rate_lph'] : null,
            ':filtration_type'        => $data['filtration_type'] ?? null,
            ':sprinkler_heads_count'  => !empty($data['sprinkler_heads_count']) ? (int)$data['sprinkler_heads_count'] : null,
            ':sprinkler_radius_m'     => !empty($data['sprinkler_radius_m']) ? (float)$data['sprinkler_radius_m'] : null,
            ':operating_pressure_bar' => !empty($data['operating_pressure_bar']) ? (float)$data['operating_pressure_bar'] : null,
            ':pivot_spans_count'      => !empty($data['pivot_spans_count']) ? (int)$data['pivot_spans_count'] : null,
            ':pivot_length_m'         => !empty($data['pivot_length_m']) ? (float)$data['pivot_length_m'] : null,
            ':pipe_diameter_mm'       => !empty($data['pipe_diameter_mm']) ? (float)$data['pipe_diameter_mm'] : null,
            ':flow_rate_lpm'          => !empty($data['flow_rate_lpm']) ? (float)$data['flow_rate_lpm'] : null,
            ':status'                 => $this->normalizeSystemStatus($data['status'] ?? 'active'),
            ':installation_date'      => !empty($data['installation_date']) ? $data['installation_date'] : null,
            ':notes'                  => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateSystem(int $id, array $data): bool
    {
        $type = strtolower(trim((string)($data['type'] ?? ($data['system_type'] ?? 'drip'))));
        if ($type === 'pivot') $type = 'center_pivot';
        if ($type === 'center pivot') $type = 'center_pivot';
        if ($type === 'micro spray' || $type === 'microspray') $type = 'micro_spray';
        $validTypes = ['drip','sprinkler','center_pivot','flood','micro_spray','manual','other'];
        if (!in_array($type, $validTypes)) $type = 'other';

        $sourceId = !empty($data['water_source_id']) ? (int)$data['water_source_id'] : (!empty($data['source_id']) ? (int)$data['source_id'] : null);
        $fieldId  = !empty($data['field_id']) ? (int)$data['field_id'] : null;

        $stmt = $this->pdo->prepare(
            'UPDATE irrigation_systems
             SET name = :name,
                 type = :type,
                 field_id = :field_id,
                 water_source_id = :water_source_id,
                 coverage_area_ha = :coverage_area_ha,
                 drip_lines_count = :drip_lines_count,
                 drip_line_length_m = :drip_line_length_m,
                 line_spacing_m = :line_spacing_m,
                 emitter_spacing_m = :emitter_spacing_m,
                 emitter_flow_rate_lph = :emitter_flow_rate_lph,
                 filtration_type = :filtration_type,
                 sprinkler_heads_count = :sprinkler_heads_count,
                 sprinkler_radius_m = :sprinkler_radius_m,
                 operating_pressure_bar = :operating_pressure_bar,
                 pivot_spans_count = :pivot_spans_count,
                 pivot_length_m = :pivot_length_m,
                 pipe_diameter_mm = :pipe_diameter_mm,
                 flow_rate_lpm = :flow_rate_lpm,
                 status = :status,
                 notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'                     => $id,
            ':name'                   => $data['name'],
            ':type'                   => $type,
            ':field_id'               => $fieldId,
            ':water_source_id'        => $sourceId,
            ':coverage_area_ha'       => !empty($data['coverage_area_ha']) ? (float)$data['coverage_area_ha'] : null,
            ':drip_lines_count'       => !empty($data['drip_lines_count']) ? (int)$data['drip_lines_count'] : null,
            ':drip_line_length_m'     => !empty($data['drip_line_length_m']) ? (float)$data['drip_line_length_m'] : null,
            ':line_spacing_m'         => !empty($data['line_spacing_m']) ? (float)$data['line_spacing_m'] : null,
            ':emitter_spacing_m'      => !empty($data['emitter_spacing_m']) ? (float)$data['emitter_spacing_m'] : null,
            ':emitter_flow_rate_lph'  => !empty($data['emitter_flow_rate_lph']) ? (float)$data['emitter_flow_rate_lph'] : null,
            ':filtration_type'        => $data['filtration_type'] ?? null,
            ':sprinkler_heads_count'  => !empty($data['sprinkler_heads_count']) ? (int)$data['sprinkler_heads_count'] : null,
            ':sprinkler_radius_m'     => !empty($data['sprinkler_radius_m']) ? (float)$data['sprinkler_radius_m'] : null,
            ':operating_pressure_bar' => !empty($data['operating_pressure_bar']) ? (float)$data['operating_pressure_bar'] : null,
            ':pivot_spans_count'      => !empty($data['pivot_spans_count']) ? (int)$data['pivot_spans_count'] : null,
            ':pivot_length_m'         => !empty($data['pivot_length_m']) ? (float)$data['pivot_length_m'] : null,
            ':pipe_diameter_mm'       => !empty($data['pipe_diameter_mm']) ? (float)$data['pipe_diameter_mm'] : null,
            ':flow_rate_lpm'          => !empty($data['flow_rate_lpm']) ? (float)$data['flow_rate_lpm'] : null,
            ':status'                 => $this->normalizeSystemStatus($data['status'] ?? 'active'),
            ':notes'                  => $data['notes'] ?? null,
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
        $freq = strtolower(trim((string) ($data['frequency'] ?? 'daily')));
        $allowedFreq = ['daily', 'twice_daily', 'alternate_days', 'weekly', 'custom'];
        if (!in_array($freq, $allowedFreq, true)) {
            $freq = 'daily';
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO irrigation_schedules (system_id, field_id, created_by, start_time, duration_minutes, target_volume_litres, frequency, days_of_week, next_run, notes)
             VALUES (:system_id, :field_id, :created_by, :start_time, :duration_minutes, :target_volume_litres, :frequency, :days_of_week, :next_run, :notes)'
        );
        $stmt->execute([
            ':system_id'            => $systemId,
            ':field_id'             => (int) $data['field_id'],
            ':created_by'           => $userId,
            ':start_time'           => $data['start_time'],
            ':duration_minutes'     => (int) ($data['duration_minutes'] ?? 60),
            ':target_volume_litres' => ($data['target_volume_litres'] ?? '') !== '' ? (float) $data['target_volume_litres'] : null,
            ':frequency'            => $freq,
            ':days_of_week'         => $data['days_of_week'] ?? null,
            ':next_run'             => ($data['next_run'] ?? '') !== '' ? $data['next_run'] : null,
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
        $costVal = $data['cost_amount'] ?? ($data['cost'] ?? '');
        $stmt = $this->pdo->prepare(
            'INSERT INTO water_consumption (system_id, field_id, schedule_id, recorded_by, volume_litres, duration_minutes, cost_amount, logged_date, notes)
             VALUES (:system_id, :field_id, :schedule_id, :recorded_by, :volume_litres, :duration_minutes, :cost_amount, :logged_date, :notes)'
        );
        $stmt->execute([
            ':system_id'        => $systemId,
            ':field_id'         => ($data['field_id'] ?? '') !== '' ? (int) $data['field_id'] : null,
            ':schedule_id'      => ($data['schedule_id'] ?? '') !== '' ? (int) $data['schedule_id'] : null,
            ':recorded_by'      => $userId,
            ':volume_litres'    => (float) $data['volume_litres'],
            ':duration_minutes' => ($data['duration_minutes'] ?? '') !== '' ? (int) $data['duration_minutes'] : null,
            ':cost_amount'      => $costVal !== '' && $costVal !== null ? (float) $costVal : 0.00,
            ':logged_date'      => !empty($data['logged_date']) ? $data['logged_date'] : date('Y-m-d'),
            ':notes'            => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
