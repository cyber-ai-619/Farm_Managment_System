<?php

declare(strict_types=1);

/**
 * EquipmentModel
 *
 * Database queries for farm machinery and equipment, maintenance intervals,
 * repair logs, and fuel tracking.
 */
class EquipmentModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM equipment WHERE farm_id = :farm_id ORDER BY type ASC, name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM equipment WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function create(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO equipment (farm_id, name, type, brand, model, serial_number, purchase_date, purchase_cost, current_value, operating_hours, fuel_type, status, notes)
             VALUES (:farm_id, :name, :type, :brand, :model, :serial_number, :purchase_date, :purchase_cost, :current_value, :operating_hours, :fuel_type, :status, :notes)'
        );
        $stmt->execute([
            ':farm_id'         => $farmId,
            ':name'            => $data['name'],
            ':type'            => $data['type'] ?? 'tractor',
            ':brand'           => $data['brand'] ?? null,
            ':model'           => $data['model'] ?? null,
            ':serial_number'   => $data['serial_number'] ?? null,
            ':purchase_date'   => $data['purchase_date'] ?? null,
            ':purchase_cost'   => $data['purchase_cost'] ?? 0.00,
            ':current_value'   => $data['current_value'] ?? 0.00,
            ':operating_hours' => $data['operating_hours'] ?? 0.00,
            ':fuel_type'       => $data['fuel_type'] ?? 'diesel',
            ':status'          => $data['status'] ?? 'available',
            ':notes'           => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE equipment
             SET name = :name, type = :type, brand = :brand, model = :model, serial_number = :serial_number,
                 current_value = :current_value, operating_hours = :operating_hours, status = :status, notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'              => $id,
            ':name'            => $data['name'],
            ':type'            => $data['type'] ?? 'tractor',
            ':brand'           => $data['brand'] ?? null,
            ':model'           => $data['model'] ?? null,
            ':serial_number'   => $data['serial_number'] ?? null,
            ':current_value'   => $data['current_value'] ?? 0.00,
            ':operating_hours' => $data['operating_hours'] ?? 0.00,
            ':status'          => $data['status'] ?? 'available',
            ':notes'           => $data['notes'] ?? null,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM equipment WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // =========================================================================
    // MAINTENANCE SCHEDULES
    // =========================================================================

    public function findMaintenance(int $equipmentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM maintenance_schedules WHERE equipment_id = :eq_id ORDER BY status ASC, next_service_date ASC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createMaintenance(int $equipmentId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO maintenance_schedules (equipment_id, service_type, interval_hours, interval_days, next_service_date, next_service_hours, status, notes)
             VALUES (:eq_id, :service_type, :interval_hours, :interval_days, :next_service_date, :next_service_hours, :status, :notes)'
        );
        $stmt->execute([
            ':eq_id'              => $equipmentId,
            ':service_type'       => $data['service_type'],
            ':interval_hours'     => $data['interval_hours'] ?? null,
            ':interval_days'      => $data['interval_days'] ?? null,
            ':next_service_date'  => $data['next_service_date'] ?? null,
            ':next_service_hours' => $data['next_service_hours'] ?? null,
            ':status'             => $data['status'] ?? 'scheduled',
            ':notes'              => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // REPAIRS & FUEL
    // =========================================================================

    public function findRepairs(int $equipmentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.*, u.name AS recorded_by_name
             FROM repair_history r
             JOIN users u ON u.id = r.recorded_by
             WHERE r.equipment_id = :eq_id
             ORDER BY r.repair_date DESC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logRepair(int $equipmentId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO repair_history (equipment_id, recorded_by, description, cost_amount, technician_name, repair_date, parts_replaced)
             VALUES (:eq_id, :recorded_by, :description, :cost_amount, :technician_name, :repair_date, :parts_replaced)'
        );
        $stmt->execute([
            ':eq_id'           => $equipmentId,
            ':recorded_by'     => $userId,
            ':description'     => $data['description'],
            ':cost_amount'     => $data['cost_amount'] ?? 0.00,
            ':technician_name' => $data['technician_name'] ?? null,
            ':repair_date'     => $data['repair_date'] ?? date('Y-m-d'),
            ':parts_replaced'  => $data['parts_replaced'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findFuelLogs(int $equipmentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT f.*, u.name AS recorded_by_name
             FROM fuel_logs f
             JOIN users u ON u.id = f.recorded_by
             WHERE f.equipment_id = :eq_id
             ORDER BY f.logged_date DESC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logFuel(int $equipmentId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO fuel_logs (equipment_id, recorded_by, litres_added, cost_amount, current_meter_hours, logged_date, notes)
             VALUES (:eq_id, :recorded_by, :litres_added, :cost_amount, :current_meter_hours, :logged_date, :notes)'
        );
        $stmt->execute([
            ':eq_id'               => $equipmentId,
            ':recorded_by'         => $userId,
            ':litres_added'        => $data['litres_added'],
            ':cost_amount'         => $data['cost_amount'] ?? 0.00,
            ':current_meter_hours' => $data['current_meter_hours'] ?? null,
            ':logged_date'         => $data['logged_date'] ?? date('Y-m-d'),
            ':notes'               => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
