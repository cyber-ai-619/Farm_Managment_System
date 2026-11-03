<?php

declare(strict_types=1);

/**
 * StorageModel
 *
 * Database operations for warehouses, storage batches, post-harvest
 * spoilage tracking, inventory valuation, and dispatch logs.
 */
class StorageModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // -------------------------------------------------------------
    // Warehouses
    // -------------------------------------------------------------

    private function normalizeWarehouseType(?string $raw): string
    {
        $rawType = strtolower(trim((string) ($raw ?? 'dry_shed')));
        $typeMap = [
            'cold storage'     => 'cold_storage',
            'grain silo'       => 'silo',
            'dry storage shed' => 'dry_shed',
            'root cellar'      => 'cellar',
            'packaging hall'   => 'packing_shed',
        ];
        $type = $typeMap[$rawType] ?? str_replace(' ', '_', $rawType);
        $valid = ['silo', 'cold_storage', 'dry_shed', 'grain_bin', 'greenhouse', 'packing_shed', 'cellar', 'other'];
        return in_array($type, $valid, true) ? $type : 'dry_shed';
    }

    public function findWarehouses(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT *, type AS storage_type, capacity_cubic_metres AS capacity_kg,
                    current_temperature_c AS temperature_celsius, current_humidity_pct AS humidity_percent,
                    location_description AS location
             FROM warehouses WHERE farm_id = :farm_id ORDER BY name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findWarehouseById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT *, type AS storage_type, capacity_cubic_metres AS capacity_kg,
                    current_temperature_c AS temperature_celsius, current_humidity_pct AS humidity_percent,
                    location_description AS location
             FROM warehouses WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createWarehouse(int $farmId, array $data): int
    {
        $type = $this->normalizeWarehouseType($data['type'] ?? ($data['storage_type'] ?? 'dry_shed'));
        $cap  = $data['capacity_cubic_metres'] ?? ($data['capacity_kg'] ?? null);
        $temp = $data['current_temperature_c'] ?? ($data['temperature_celsius'] ?? null);
        $hum  = $data['current_humidity_pct'] ?? ($data['humidity_percent'] ?? null);
        $loc  = $data['location_description'] ?? ($data['location'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO warehouses (farm_id, name, type, capacity_cubic_metres, current_temperature_c, current_humidity_pct, location_description, is_active)
             VALUES (:farm_id, :name, :type, :capacity_cubic_metres, :current_temperature_c, :current_humidity_pct, :location_description, :is_active)'
        );
        $stmt->execute([
            ':farm_id'               => $farmId,
            ':name'                  => $data['name'],
            ':type'                  => $type,
            ':capacity_cubic_metres' => ($cap !== '' && $cap !== null) ? (float) $cap : null,
            ':current_temperature_c' => ($temp !== '' && $temp !== null) ? (float) $temp : null,
            ':current_humidity_pct'  => ($hum !== '' && $hum !== null) ? (float) $hum : null,
            ':location_description'  => $loc,
            ':is_active'             => isset($data['is_active']) ? (int) $data['is_active'] : 1,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateWarehouse(int $id, array $data): bool
    {
        if (array_key_exists('storage_type', $data) && !array_key_exists('type', $data)) {
            $data['type'] = $data['storage_type'];
        }
        if (array_key_exists('capacity_kg', $data) && !array_key_exists('capacity_cubic_metres', $data)) {
            $data['capacity_cubic_metres'] = $data['capacity_kg'];
        }
        if (array_key_exists('temperature_celsius', $data) && !array_key_exists('current_temperature_c', $data)) {
            $data['current_temperature_c'] = $data['temperature_celsius'];
        }
        if (array_key_exists('humidity_percent', $data) && !array_key_exists('current_humidity_pct', $data)) {
            $data['current_humidity_pct'] = $data['humidity_percent'];
        }
        if (array_key_exists('location', $data) && !array_key_exists('location_description', $data)) {
            $data['location_description'] = $data['location'];
        }

        $allowed = ['name', 'type', 'capacity_cubic_metres', 'current_temperature_c', 'current_humidity_pct', 'location_description', 'is_active'];
        $fields  = [];
        $params  = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if ($field === 'type') {
                    $val = $this->normalizeWarehouseType((string) $val);
                } elseif (in_array($field, ['capacity_cubic_metres', 'current_temperature_c', 'current_humidity_pct'], true)) {
                    $val = ($val !== '' && $val !== null) ? (float) $val : null;
                }
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $val;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = 'UPDATE warehouses SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    // -------------------------------------------------------------
    // Storage Batches
    // -------------------------------------------------------------

    public function findBatches(int $farmId, ?int $warehouseId = null, ?string $status = null): array
    {
        $sql = 'SELECT sb.*, w.name AS warehouse_name, c.name AS crop_name, hr.harvest_date,
                       sb.batch_code AS batch_number,
                       sb.quantity_remaining_kg AS quantity_available_kg,
                       sb.unit_cost_estimated AS unit_cost,
                       sb.entry_date AS storage_date
                FROM storage_batches sb
                JOIN warehouses w ON w.id = sb.warehouse_id
                JOIN crops c ON c.id = sb.crop_id
                LEFT JOIN harvest_records hr ON hr.id = sb.harvest_id
                WHERE w.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($warehouseId !== null) {
            $sql .= ' AND sb.warehouse_id = :wh_id';
            $params[':wh_id'] = $warehouseId;
        }
        if ($status !== null && $status !== '') {
            $sql .= ' AND sb.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY sb.entry_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findBatchById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sb.*, w.name AS warehouse_name, c.name AS crop_name, hr.harvest_date,
                    sb.batch_code AS batch_number,
                    sb.quantity_remaining_kg AS quantity_available_kg,
                    sb.unit_cost_estimated AS unit_cost,
                    sb.entry_date AS storage_date
             FROM storage_batches sb
             JOIN warehouses w ON w.id = sb.warehouse_id
             JOIN crops c ON c.id = sb.crop_id
             LEFT JOIN harvest_records hr ON hr.id = sb.harvest_id
             WHERE sb.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $batch = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$batch) {
            return null;
        }
        $batch['movements'] = $this->findMovementsByBatch($id);
        $batch['dispatches'] = $this->findDispatchesByBatch($id);
        return $batch;
    }

    public function createBatch(array $data): int
    {
        $rawBatchCode = trim((string) ($data['batch_code'] ?? ($data['batch_number'] ?? '')));
        $batchCode = $rawBatchCode !== '' ? $rawBatchCode : ('BATCH-' . strtoupper(uniqid()));
        $qty = (float) ($data['quantity_stored_kg'] ?? 0);
        $remaining = isset($data['quantity_remaining_kg']) && $data['quantity_remaining_kg'] !== ''
            ? (float) $data['quantity_remaining_kg']
            : $qty;

        $unitCost = ($data['unit_cost_estimated'] ?? ($data['unit_cost'] ?? '')) !== ''
            ? (float) ($data['unit_cost_estimated'] ?? $data['unit_cost'])
            : 0.00;
        $entryDate = !empty($data['entry_date'])
            ? $data['entry_date']
            : (!empty($data['storage_date']) ? $data['storage_date'] : date('Y-m-d'));

        $harvestId = !empty($data['harvest_id']) ? (int) $data['harvest_id'] : null;
        $expiryDate = !empty($data['expiry_date']) ? $data['expiry_date'] : null;

        $qualityGrade = $data['quality_grade'] ?? 'A';
        if (!in_array($qualityGrade, ['A', 'B', 'C', 'rejected'], true)) {
            $qualityGrade = 'A';
        }

        $status = $data['status'] ?? 'stored';
        if (!in_array($status, ['stored', 'partially_dispatched', 'dispatched', 'spoiled'], true)) {
            $status = 'stored';
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO storage_batches (warehouse_id, harvest_id, crop_id, batch_code, quantity_stored_kg, quantity_remaining_kg, unit_cost_estimated, quality_grade, entry_date, expiry_date, status, spoilage_kg, notes)
             VALUES (:warehouse_id, :harvest_id, :crop_id, :batch_code, :quantity_stored_kg, :quantity_remaining_kg, :unit_cost_estimated, :quality_grade, :entry_date, :expiry_date, :status, :spoilage_kg, :notes)'
        );
        $stmt->execute([
            ':warehouse_id'          => $data['warehouse_id'],
            ':harvest_id'            => $harvestId,
            ':crop_id'               => $data['crop_id'],
            ':batch_code'            => $batchCode,
            ':quantity_stored_kg'    => $qty,
            ':quantity_remaining_kg' => $remaining,
            ':unit_cost_estimated'   => $unitCost,
            ':quality_grade'         => $qualityGrade,
            ':entry_date'            => $entryDate,
            ':expiry_date'           => $expiryDate,
            ':status'                => $status,
            ':spoilage_kg'           => ($data['spoilage_kg'] ?? '') !== '' ? (float) $data['spoilage_kg'] : 0.00,
            ':notes'                 => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // -------------------------------------------------------------
    // Movements & Spoilage
    // -------------------------------------------------------------

    public function findMovementsByBatch(int $batchId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sm.*, u.name AS recorded_by_name
             FROM storage_movements sm
             JOIN users u ON u.id = sm.recorded_by
             WHERE sm.batch_id = :batch_id
             ORDER BY sm.created_at DESC'
        );
        $stmt->execute([':batch_id' => $batchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function recordSpoilage(int $batchId, int $userId, float $spoilageKg, ?string $notes = null): bool
    {
        $this->pdo->beginTransaction();
        try {
            $batch = $this->findBatchById($batchId);
            if (!$batch) {
                throw new InvalidArgumentException('Batch not found.');
            }

            $currentRem = (float) $batch['quantity_remaining_kg'];
            $deduct = min($spoilageKg, $currentRem);
            $newRem = $currentRem - $deduct;
            $newSpoilage = (float) $batch['spoilage_kg'] + $spoilageKg;
            $newStatus = ($newRem <= 0) ? 'spoiled' : 'stored';

            // Insert movement
            $mStmt = $this->pdo->prepare(
                'INSERT INTO storage_movements (batch_id, recorded_by, movement_type, quantity_kg, notes)
                 VALUES (:batch_id, :recorded_by, :movement_type, :quantity_kg, :notes)'
            );
            $mStmt->execute([
                ':batch_id'      => $batchId,
                ':recorded_by'   => $userId,
                ':movement_type' => 'spoilage_writeoff',
                ':quantity_kg'   => $spoilageKg,
                ':notes'         => $notes,
            ]);

            // Update batch
            $uStmt = $this->pdo->prepare(
                'UPDATE storage_batches SET quantity_remaining_kg = :rem, spoilage_kg = :spoil, status = :status WHERE id = :id'
            );
            $uStmt->execute([
                ':rem'    => $newRem,
                ':spoil'  => $newSpoilage,
                ':status' => $newStatus,
                ':id'     => $batchId,
            ]);

            $this->pdo->commit();
            return true;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // -------------------------------------------------------------
    // Dispatches
    // -------------------------------------------------------------

    public function findDispatches(int $farmId, ?int $batchId = null): array
    {
        $sql = 'SELECT dr.*, sb.batch_code, sb.batch_code AS batch_number, c.name AS crop_name,
                       u.name AS dispatched_by_name, so.order_number,
                       dr.vehicle_registration AS vehicle_number
                FROM dispatch_records dr
                JOIN storage_batches sb ON sb.id = dr.batch_id
                JOIN warehouses w ON w.id = sb.warehouse_id
                JOIN crops c ON c.id = sb.crop_id
                JOIN users u ON u.id = dr.dispatched_by
                LEFT JOIN sales_orders so ON so.id = dr.order_id
                WHERE w.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($batchId !== null) {
            $sql .= ' AND dr.batch_id = :batch_id';
            $params[':batch_id'] = $batchId;
        }

        $sql .= ' ORDER BY dr.dispatch_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findDispatchesByBatch(int $batchId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT dr.*, u.name AS dispatched_by_name, so.order_number, dr.vehicle_registration AS vehicle_number
             FROM dispatch_records dr
             JOIN users u ON u.id = dr.dispatched_by
             LEFT JOIN sales_orders so ON so.id = dr.order_id
             WHERE dr.batch_id = :batch_id
             ORDER BY dr.dispatch_date DESC'
        );
        $stmt->execute([':batch_id' => $batchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function recordDispatch(int $userId, array $data): int
    {
        return $this->createDispatch($userId, $data);
    }

    public function createDispatch(int $userId, array $data): int
    {
        $this->pdo->beginTransaction();
        try {
            $batchId = (int) $data['batch_id'];
            $batch = $this->findBatchById($batchId);
            if (!$batch) {
                throw new InvalidArgumentException('Batch not found.');
            }

            $qty = (float) $data['quantity_kg'];
            $currentRem = (float) $batch['quantity_remaining_kg'];
            if ($qty > $currentRem) {
                throw new InvalidArgumentException("Insufficient batch quantity. Remaining: {$currentRem} kg.");
            }

            $vehicleReg = $data['vehicle_registration'] ?? ($data['vehicle_number'] ?? null);
            $orderId    = !empty($data['order_id']) ? (int) $data['order_id'] : null;
            $dispatchDate = !empty($data['dispatch_date']) ? $data['dispatch_date'] : date('Y-m-d');

            // Insert dispatch record
            $dStmt = $this->pdo->prepare(
                'INSERT INTO dispatch_records (batch_id, order_id, dispatched_by, quantity_kg, destination, vehicle_registration, driver_name, dispatch_date, notes)
                 VALUES (:batch_id, :order_id, :dispatched_by, :quantity_kg, :destination, :vehicle_registration, :driver_name, :dispatch_date, :notes)'
            );
            $dStmt->execute([
                ':batch_id'             => $batchId,
                ':order_id'             => $orderId,
                ':dispatched_by'        => $userId,
                ':quantity_kg'          => $qty,
                ':destination'          => $data['destination'],
                ':vehicle_registration' => $vehicleReg,
                ':driver_name'          => $data['driver_name'] ?? null,
                ':dispatch_date'        => $dispatchDate,
                ':notes'                => $data['notes'] ?? null,
            ]);
            $dispatchId = (int) $this->pdo->lastInsertId();

            // Insert storage movement
            $mStmt = $this->pdo->prepare(
                'INSERT INTO storage_movements (batch_id, recorded_by, movement_type, quantity_kg, notes)
                 VALUES (:batch_id, :recorded_by, :movement_type, :quantity_kg, :notes)'
            );
            $mStmt->execute([
                ':batch_id'      => $batchId,
                ':recorded_by'   => $userId,
                ':movement_type' => 'dispatch',
                ':quantity_kg'   => $qty,
                ':notes'         => 'Dispatched to ' . $data['destination'],
            ]);

            // Update remaining batch quantity
            $newRem = $currentRem - $qty;
            $newStatus = ($newRem <= 0) ? 'dispatched' : 'partially_dispatched';

            $uStmt = $this->pdo->prepare(
                'UPDATE storage_batches SET quantity_remaining_kg = :rem, status = :status WHERE id = :id'
            );
            $uStmt->execute([
                ':rem'    => $newRem,
                ':status' => $newStatus,
                ':id'     => $batchId,
            ]);

            $this->pdo->commit();
            return $dispatchId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // -------------------------------------------------------------
    // Valuation Summary
    // -------------------------------------------------------------

    public function getInventoryValuation(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sb.id, sb.batch_code, sb.crop_id, c.name AS crop_name, sb.quantity_remaining_kg, sb.unit_cost_estimated, sb.quality_grade,
                    (sb.quantity_remaining_kg * sb.unit_cost_estimated) AS estimated_batch_value,
                    sb.spoilage_kg, w.name AS warehouse_name
             FROM storage_batches sb
             JOIN warehouses w ON w.id = sb.warehouse_id
             JOIN crops c ON c.id = sb.crop_id
             WHERE w.farm_id = :farm_id AND sb.quantity_remaining_kg > 0'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalKg = 0.0;
        $totalValuation = 0.0;
        $totalSpoilageKg = 0.0;

        foreach ($batches as $b) {
            $totalKg += (float) $b['quantity_remaining_kg'];
            $totalValuation += (float) $b['estimated_batch_value'];
            $totalSpoilageKg += (float) $b['spoilage_kg'];
        }

        return [
            'farm_id'               => $farmId,
            'active_batches_count'  => count($batches),
            'total_quantity_kg'     => round($totalKg, 2),
            'total_estimated_value' => round($totalValuation, 2),
            'total_spoilage_kg'     => round($totalSpoilageKg, 2),
            'batches'               => $batches,
        ];
    }
}
