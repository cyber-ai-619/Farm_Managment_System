<?php

declare(strict_types=1);

require_once __DIR__ . '/StorageModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * StorageController
 *
 * REST API controller for warehouses, storage batches, spoilage write-offs,
 * dispatches, and inventory valuation.
 */
class StorageController
{
    private StorageModel $storageModel;
    private AuditLogger  $audit;

    public function __construct(PDO $pdo)
    {
        $this->storageModel = new StorageModel($pdo);
        $this->audit        = new AuditLogger($pdo);
    }

    // -------------------------------------------------------------
    // Warehouses
    // -------------------------------------------------------------

    public function indexWarehouses(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $warehouses = $this->storageModel->findWarehouses($farmId);
        respond(['success' => true, 'count' => count($warehouses), 'data' => $warehouses]);
    }

    public function showWarehouse(int $id): void
    {
        requireAuth();
        $wh = $this->storageModel->findWarehouseById($id);
        if (!$wh) {
            respond(['success' => false, 'message' => 'Warehouse not found.'], 404);
        }
        respond(['success' => true, 'data' => $wh]);
    }

    public function storeWarehouse(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Warehouse name is required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->storageModel->createWarehouse($farmId, $body);
        $this->audit->log('warehouse.created', (int) $user['sub'], 'warehouses', $id);

        respond(['success' => true, 'message' => 'Warehouse created successfully.', 'id' => $id], 201);
    }

    public function updateWarehouse(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        $existing = $this->storageModel->findWarehouseById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Warehouse not found.'], 404);
        }

        $this->storageModel->updateWarehouse($id, $body);
        $this->audit->log('warehouse.updated', (int) $user['sub'], 'warehouses', $id);

        respond(['success' => true, 'message' => 'Warehouse updated successfully.']);
    }

    // -------------------------------------------------------------
    // Batches
    // -------------------------------------------------------------

    public function indexBatches(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $whId   = isset($_GET['warehouse_id']) ? (int) $_GET['warehouse_id'] : null;
        $status = $_GET['status'] ?? null;

        $batches = $this->storageModel->findBatches($farmId, $whId, $status);
        respond(['success' => true, 'count' => count($batches), 'data' => $batches]);
    }

    public function showBatch(int $id): void
    {
        requireAuth();
        $batch = $this->storageModel->findBatchById($id);
        if (!$batch) {
            respond(['success' => false, 'message' => 'Storage batch not found.'], 404);
        }
        respond(['success' => true, 'data' => $batch]);
    }

    public function storeBatch(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['warehouse_id']) || empty($body['crop_id']) || !isset($body['quantity_stored_kg'])) {
            respond(['success' => false, 'message' => 'warehouse_id, crop_id, and quantity_stored_kg are required.'], 422);
        }

        $id = $this->storageModel->createBatch($body);
        $this->audit->log('storage_batch.created', (int) $user['sub'], 'storage_batches', $id);

        respond(['success' => true, 'message' => 'Storage batch created successfully.', 'id' => $id], 201);
    }

    // -------------------------------------------------------------
    // Valuation Summary
    // -------------------------------------------------------------

    public function valuation(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $valuation = $this->storageModel->getInventoryValuation($farmId);
        respond(['success' => true, 'data' => $valuation]);
    }

    // -------------------------------------------------------------
    // Spoilage
    // -------------------------------------------------------------

    public function storeSpoilage(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['batch_id']) || !isset($body['spoilage_kg']) || (float)$body['spoilage_kg'] <= 0) {
            respond(['success' => false, 'message' => 'batch_id and positive spoilage_kg are required.'], 422);
        }

        try {
            $this->storageModel->recordSpoilage(
                (int) $body['batch_id'],
                (int) $user['sub'],
                (float) $body['spoilage_kg'],
                $body['notes'] ?? null
            );
            $this->audit->log('storage.spoilage_recorded', (int) $user['sub'], 'storage_batches', (int) $body['batch_id']);
            respond(['success' => true, 'message' => 'Storage spoilage written off successfully.']);
        } catch (Throwable $e) {
            respond(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // -------------------------------------------------------------
    // Dispatches
    // -------------------------------------------------------------

    public function indexDispatches(): void
    {
        requireAuth();
        $farmId  = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $batchId = isset($_GET['batch_id']) ? (int) $_GET['batch_id'] : null;

        $dispatches = $this->storageModel->findDispatches($farmId, $batchId);
        respond(['success' => true, 'count' => count($dispatches), 'data' => $dispatches]);
    }

    public function storeDispatch(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['batch_id']) || empty($body['destination']) || !isset($body['quantity_kg']) || (float)$body['quantity_kg'] <= 0) {
            respond(['success' => false, 'message' => 'batch_id, destination, and positive quantity_kg are required.'], 422);
        }

        try {
            $id = $this->storageModel->createDispatch((int) $user['sub'], $body);
            $this->audit->log('storage.dispatched', (int) $user['sub'], 'dispatch_records', $id);
            respond(['success' => true, 'message' => 'Dispatch recorded successfully.', 'id' => $id], 201);
        } catch (Throwable $e) {
            respond(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
