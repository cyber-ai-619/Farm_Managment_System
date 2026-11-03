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
            'SELECT *, purchase_cost AS purchase_price FROM equipment WHERE farm_id = :farm_id ORDER BY type ASC, name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT *, purchase_cost AS purchase_price FROM equipment WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function create(int $farmId, array $data): int
    {
        $rawType = strtolower(trim((string) ($data['type'] ?? 'tractor')));
        if ($rawType === 'plow') {
            $rawType = 'tillage';
        }
        $validTypes = ['tractor', 'harvester', 'planter', 'sprayer', 'tillage', 'trailer', 'pump', 'generator', 'vehicle', 'implement', 'hand_tool', 'other'];
        $type = in_array($rawType, $validTypes, true) ? $rawType : 'other';

        $rawStatus = strtolower(trim((string) ($data['status'] ?? 'available')));
        if ($rawStatus === 'operational') {
            $rawStatus = 'available';
        }
        $validStatuses = ['available', 'in_use', 'maintenance', 'repair', 'retired'];
        $status = in_array($rawStatus, $validStatuses, true) ? $rawStatus : 'available';

        $rawCost = $data['purchase_cost'] ?? ($data['purchase_price'] ?? 0.00);
        $purchaseCost = ($rawCost !== '' && $rawCost !== null) ? (float) $rawCost : 0.00;
        $currentValue = ($data['current_value'] ?? '') !== '' ? (float) $data['current_value'] : 0.00;
        $operatingHours = ($data['operating_hours'] ?? '') !== '' ? (float) $data['operating_hours'] : 0.00;
        $purchaseDate = !empty($data['purchase_date']) ? $data['purchase_date'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO equipment (farm_id, name, type, brand, model, serial_number, purchase_date, purchase_cost, current_value, operating_hours, fuel_type, status, notes)
             VALUES (:farm_id, :name, :type, :brand, :model, :serial_number, :purchase_date, :purchase_cost, :current_value, :operating_hours, :fuel_type, :status, :notes)'
        );
        $stmt->execute([
            ':farm_id'         => $farmId,
            ':name'            => $data['name'],
            ':type'            => $type,
            ':brand'           => !empty($data['brand']) ? $data['brand'] : null,
            ':model'           => !empty($data['model']) ? $data['model'] : null,
            ':serial_number'   => !empty($data['serial_number']) ? $data['serial_number'] : null,
            ':purchase_date'   => $purchaseDate,
            ':purchase_cost'   => $purchaseCost,
            ':current_value'   => $currentValue,
            ':operating_hours' => $operatingHours,
            ':fuel_type'       => !empty($data['fuel_type']) ? $data['fuel_type'] : 'diesel',
            ':status'          => $status,
            ':notes'           => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $rawType = strtolower(trim((string) ($data['type'] ?? 'tractor')));
        if ($rawType === 'plow') {
            $rawType = 'tillage';
        }
        $validTypes = ['tractor', 'harvester', 'planter', 'sprayer', 'tillage', 'trailer', 'pump', 'generator', 'vehicle', 'implement', 'hand_tool', 'other'];
        $type = in_array($rawType, $validTypes, true) ? $rawType : 'other';

        $rawStatus = strtolower(trim((string) ($data['status'] ?? 'available')));
        if ($rawStatus === 'operational') {
            $rawStatus = 'available';
        }
        $validStatuses = ['available', 'in_use', 'maintenance', 'repair', 'retired'];
        $status = in_array($rawStatus, $validStatuses, true) ? $rawStatus : 'available';

        $currentValue = ($data['current_value'] ?? '') !== '' ? (float) $data['current_value'] : 0.00;
        $operatingHours = ($data['operating_hours'] ?? '') !== '' ? (float) $data['operating_hours'] : 0.00;

        $stmt = $this->pdo->prepare(
            'UPDATE equipment
             SET name = :name, type = :type, brand = :brand, model = :model, serial_number = :serial_number,
                 current_value = :current_value, operating_hours = :operating_hours, status = :status, notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'              => $id,
            ':name'            => $data['name'],
            ':type'            => $type,
            ':brand'           => !empty($data['brand']) ? $data['brand'] : null,
            ':model'           => !empty($data['model']) ? $data['model'] : null,
            ':serial_number'   => !empty($data['serial_number']) ? $data['serial_number'] : null,
            ':current_value'   => $currentValue,
            ':operating_hours' => $operatingHours,
            ':status'          => $status,
            ':notes'           => !empty($data['notes']) ? $data['notes'] : null,
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
            'SELECT m.*, m.next_service_date AS scheduled_date
             FROM maintenance_schedules m
             WHERE m.equipment_id = :eq_id
             ORDER BY m.status ASC, m.next_service_date ASC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createMaintenance(int $equipmentId, array $data): int
    {
        $nextDate = !empty($data['next_service_date']) ? $data['next_service_date'] : (!empty($data['scheduled_date']) ? $data['scheduled_date'] : null);
        $intervalHours = ($data['interval_hours'] ?? '') !== '' ? (int) $data['interval_hours'] : null;
        $intervalDays = ($data['interval_days'] ?? '') !== '' ? (int) $data['interval_days'] : null;
        $nextServiceHours = ($data['next_service_hours'] ?? '') !== '' ? (float) $data['next_service_hours'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO maintenance_schedules (equipment_id, service_type, interval_hours, interval_days, next_service_date, next_service_hours, status, notes)
             VALUES (:eq_id, :service_type, :interval_hours, :interval_days, :next_service_date, :next_service_hours, :status, :notes)'
        );
        $stmt->execute([
            ':eq_id'              => $equipmentId,
            ':service_type'       => $data['service_type'],
            ':interval_hours'     => $intervalHours,
            ':interval_days'      => $intervalDays,
            ':next_service_date'  => $nextDate,
            ':next_service_hours' => $nextServiceHours,
            ':status'             => !empty($data['status']) ? $data['status'] : 'scheduled',
            ':notes'              => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // REPAIRS & FUEL
    // =========================================================================

    public function findRepairs(int $equipmentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.*, u.name AS recorded_by_name, r.description AS repair_description, r.cost_amount AS cost
             FROM repair_history r
             LEFT JOIN users u ON u.id = r.recorded_by
             WHERE r.equipment_id = :eq_id
             ORDER BY r.repair_date DESC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logRepair(int $equipmentId, int $userId, array $data): int
    {
        $description = $data['description'] ?? ($data['repair_description'] ?? 'Repair Job');
        $costAmount = ($data['cost_amount'] ?? ($data['cost'] ?? '')) !== '' ? (float) ($data['cost_amount'] ?? $data['cost']) : 0.00;
        $repairDate = !empty($data['repair_date']) ? $data['repair_date'] : date('Y-m-d');

        $stmt = $this->pdo->prepare(
            'INSERT INTO repair_history (equipment_id, recorded_by, description, cost_amount, technician_name, repair_date, parts_replaced)
             VALUES (:eq_id, :recorded_by, :description, :cost_amount, :technician_name, :repair_date, :parts_replaced)'
        );
        $stmt->execute([
            ':eq_id'           => $equipmentId,
            ':recorded_by'     => $userId,
            ':description'     => $description,
            ':cost_amount'     => $costAmount,
            ':technician_name' => !empty($data['technician_name']) ? $data['technician_name'] : null,
            ':repair_date'     => $repairDate,
            ':parts_replaced'  => !empty($data['parts_replaced']) ? $data['parts_replaced'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findFuelLogs(int $equipmentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT f.*, u.name AS recorded_by_name, u.name AS logged_by_name, f.litres_added AS liters, f.cost_amount AS cost, f.logged_date AS log_date
             FROM fuel_logs f
             LEFT JOIN users u ON u.id = f.recorded_by
             WHERE f.equipment_id = :eq_id
             ORDER BY f.logged_date DESC'
        );
        $stmt->execute([':eq_id' => $equipmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function logFuel(int $equipmentId, int $userId, array $data): int
    {
        $litresAdded = (float) ($data['litres_added'] ?? ($data['liters'] ?? 0));
        $costAmount = ($data['cost_amount'] ?? ($data['cost'] ?? '')) !== '' ? (float) ($data['cost_amount'] ?? $data['cost']) : 0.00;
        $currentMeterHours = ($data['current_meter_hours'] ?? '') !== '' ? (float) $data['current_meter_hours'] : null;
        $loggedDate = !empty($data['logged_date']) ? $data['logged_date'] : (!empty($data['log_date']) ? $data['log_date'] : date('Y-m-d'));

        $stmt = $this->pdo->prepare(
            'INSERT INTO fuel_logs (equipment_id, recorded_by, litres_added, cost_amount, current_meter_hours, logged_date, notes)
             VALUES (:eq_id, :recorded_by, :litres_added, :cost_amount, :current_meter_hours, :logged_date, :notes)'
        );
        $stmt->execute([
            ':eq_id'               => $equipmentId,
            ':recorded_by'         => $userId,
            ':litres_added'        => $litresAdded,
            ':cost_amount'         => $costAmount,
            ':current_meter_hours' => $currentMeterHours,
            ':logged_date'         => $loggedDate,
            ':notes'               => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
