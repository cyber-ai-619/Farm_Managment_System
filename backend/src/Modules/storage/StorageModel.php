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

    public function findWarehouses(int $farmId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM warehouses WHERE farm_id = :farm_id ORDER BY name ASC');
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findWarehouseById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM warehouses WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createWarehouse(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO warehouses (farm_id, name, type, capacity_cubic_metres, current_temperature_c, current_humidity_pct, location_description, is_active)
             VALUES (:farm_id, :name, :type, :capacity_cubic_metres, :current_temperature_c, :current_humidity_pct, :location_description, :is_active)'
        );
        $stmt->execute([
            ':farm_id'               => $farmId,
            ':name'                  => $data['name'],
            ':type'                  => $data['type'] ?? 'dry_shed',
            ':capacity_cubic_metres' => $data['capacity_cubic_metres'] ?? null,
            ':current_temperature_c' => $data['current_temperature_c'] ?? null,
            ':current_humidity_pct'  => $data['current_humidity_pct'] ?? null,
            ':location_description'  => $data['location_description'] ?? null,
            ':is_active'             => isset($data['is_active']) ? (int) $data['is_active'] : 1,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateWarehouse(int $id, array $data): bool
    {
        $allowed = ['name', 'type', 'capacity_cubic_metres', 'current_temperature_c', 'current_humidity_pct', 'location_description', 'is_active'];
        $fields  = [];
        $params  = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
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
        $sql = 'SELECT sb.*, w.name AS warehouse_name, c.name AS crop_name, hr.harvest_date
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
            'SELECT sb.*, w.name AS warehouse_name, c.name AS crop_name, hr.harvest_date
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
        $batchCode = $data['batch_code'] ?? ('BAT-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3))));
        $qty = (float) ($data['quantity_stored_kg'] ?? 0);
        $remaining = isset($data['quantity_remaining_kg']) ? (float) $data['quantity_remaining_kg'] : $qty;

        $stmt = $this->pdo->prepare(
            'INSERT INTO storage_batches (warehouse_id, harvest_id, crop_id, batch_code, quantity_stored_kg, quantity_remaining_kg, unit_cost_estimated, quality_grade, entry_date, expiry_date, status, spoilage_kg, notes)
             VALUES (:warehouse_id, :harvest_id, :crop_id, :batch_code, :quantity_stored_kg, :quantity_remaining_kg, :unit_cost_estimated, :quality_grade, :entry_date, :expiry_date, :status, :spoilage_kg, :notes)'
        );
        $stmt->execute([
            ':warehouse_id'           => $data['warehouse_id'],
            ':harvest_id'              => $data['harvest_id'] ?? null,
            ':crop_id'                 => $data['crop_id'],
            ':batch_code'              => $batchCode,
            ':quantity_stored_kg'      => $qty,
            ':quantity_remaining_kg'   => $remaining,
            ':unit_cost_estimated'     => $data['unit_cost_estimated'] ?? 0.00,
            ':quality_grade'           => $data['quality_grade'] ?? 'A',
            ':entry_date'              => $data['entry_date'] ?? date('Y-m-d'),
            ':expiry_date'             => $data['expiry_date'] ?? null,
            ':status'                  => $data['status'] ?? 'stored',
            ':spoilage_kg'             => $data['spoilage_kg'] ?? 0.00,
            ':notes'                   => $data['notes'] ?? null,
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
        $sql = 'SELECT dr.*, sb.batch_code, c.name AS crop_name, u.name AS dispatched_by_name, so.order_number
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
            'SELECT dr.*, u.name AS dispatched_by_name, so.order_number
             FROM dispatch_records dr
             JOIN users u ON u.id = dr.dispatched_by
             LEFT JOIN sales_orders so ON so.id = dr.order_id
             WHERE dr.batch_id = :batch_id
             ORDER BY dr.dispatch_date DESC'
        );
        $stmt->execute([':batch_id' => $batchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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

            // Insert dispatch record
            $dStmt = $this->pdo->prepare(
                'INSERT INTO dispatch_records (batch_id, order_id, dispatched_by, quantity_kg, destination, vehicle_registration, driver_name, dispatch_date, notes)
                 VALUES (:batch_id, :order_id, :dispatched_by, :quantity_kg, :destination, :vehicle_registration, :driver_name, :dispatch_date, :notes)'
            );
            $dStmt->execute([
                ':batch_id'             => $batchId,
                ':order_id'             => $data['order_id'] ?? null,
                ':dispatched_by'        => $userId,
                ':quantity_kg'          => $qty,
                ':destination'          => $data['destination'],
                ':vehicle_registration' => $data['vehicle_registration'] ?? null,
                ':driver_name'          => $data['driver_name'] ?? null,
                ':dispatch_date'        => $data['dispatch_date'] ?? date('Y-m-d'),
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
