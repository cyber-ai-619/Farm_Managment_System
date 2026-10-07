<?php

declare(strict_types=1);

require_once __DIR__ . '/InventoryModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * InventoryController
 *
 * REST API handler for /api/inventory/* routes
 */
class InventoryController
{
    private InventoryModel $model;
    private AuditLogger    $audit;

    public function __construct(PDO $pdo)
    {
        $this->model = new InventoryModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    public function index(): void
    {
        requireAuth();
        $farmId   = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $category = $_GET['category'] ?? null;

        $items = $this->model->findByFarm($farmId, $category);
        respond(['success' => true, 'count' => count($items), 'data' => $items]);
    }

    public function show(int $id): void
    {
        requireAuth();
        $item = $this->model->findById($id);
        if (!$item) {
            respond(['success' => false, 'message' => 'Inventory item not found.'], 404);
        }
        $movements = $this->model->findMovements($id);
        respond(['success' => true, 'data' => $item, 'movements' => $movements]);
    }

    public function lowStock(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $lowItems = $this->model->findLowStock($farmId);
        respond(['success' => true, 'count' => count($lowItems), 'data' => $lowItems]);
    }

    public function store(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name']) || empty($body['farm_id'])) {
            respond(['success' => false, 'message' => 'name and farm_id are required.'], 422);
        }

        $id = $this->model->create((int) $body['farm_id'], $body);
        $this->audit->log('inventory.item_created', (int) $user['sub'], 'inventory_items', $id);

        respond(['success' => true, 'message' => 'Inventory item created.', 'id' => $id], 201);
    }

    public function update(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'name is required.'], 422);
        }

        $this->model->update($id, $body);
        $this->audit->log('inventory.item_updated', (int) $user['sub'], 'inventory_items', $id);

        respond(['success' => true, 'message' => 'Inventory item updated.']);
    }

    public function stockIn(int $id): void
    {
        $user = requireAuth();
        $body = $this->jsonBody();

        if (empty($body['quantity']) || (float) $body['quantity'] <= 0) {
            respond(['success' => false, 'message' => 'Positive quantity is required.'], 422);
        }

        $movementId = $this->model->recordMovement(
            $id,
            (int) $user['sub'],
            'stock_in',
            (float) $body['quantity'],
            isset($body['unit_price']) ? (float) $body['unit_price'] : null,
            $body['notes'] ?? null
        );

        $this->audit->log('inventory.stock_in', (int) $user['sub'], 'stock_movements', $movementId);
        $updatedItem = $this->model->findById($id);

        respond([
            'success' => true,
            'message' => 'Stock-in recorded successfully.',
            'movement_id' => $movementId,
            'new_quantity' => $updatedItem['quantity_on_hand']
        ]);
    }

    public function stockOut(int $id): void
    {
        $user = requireAuth();
        $body = $this->jsonBody();

        if (empty($body['quantity']) || (float) $body['quantity'] <= 0) {
            respond(['success' => false, 'message' => 'Positive quantity is required.'], 422);
        }

        $movementId = $this->model->recordMovement(
            $id,
            (int) $user['sub'],
            'stock_out',
            (float) $body['quantity'],
            null,
            $body['notes'] ?? null
        );

        $this->audit->log('inventory.stock_out', (int) $user['sub'], 'stock_movements', $movementId);
        $updatedItem = $this->model->findById($id);

        respond([
            'success' => true,
            'message' => 'Stock-out recorded successfully.',
            'movement_id' => $movementId,
            'new_quantity' => $updatedItem['quantity_on_hand']
        ]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
