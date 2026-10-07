<?php

declare(strict_types=1);

require_once __DIR__ . '/HarvestModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * HarvestController
 *
 * REST API handler for /api/harvests/* routes
 */
class HarvestController
{
    private HarvestModel $model;
    private AuditLogger  $audit;

    public function __construct(PDO $pdo)
    {
        $this->model = new HarvestModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    public function index(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $records = $this->model->findByFarm($farmId);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function show(int $id): void
    {
        requireAuth();
        $record = $this->model->findById($id);
        if (!$record) {
            respond(['success' => false, 'message' => 'Harvest record not found.'], 404);
        }
        respond(['success' => true, 'data' => $record]);
    }

    public function store(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['farm_id']) || empty($body['field_id']) || empty($body['crop_id']) || !isset($body['quantity_kg'])) {
            respond(['success' => false, 'message' => 'farm_id, field_id, crop_id, and quantity_kg are required.'], 422);
        }

        $id = $this->model->create((int) $body['farm_id'], (int) $user['sub'], $body);
        $this->audit->log('harvest.created', (int) $user['sub'], 'harvest_records', $id);

        respond(['success' => true, 'message' => 'Harvest record created.', 'id' => $id], 201);
    }

    public function update(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (!isset($body['quantity_kg'])) {
            respond(['success' => false, 'message' => 'quantity_kg is required.'], 422);
        }

        $this->model->update($id, $body);
        $this->audit->log('harvest.updated', (int) $user['sub'], 'harvest_records', $id);

        respond(['success' => true, 'message' => 'Harvest record updated.']);
    }

    public function destroy(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $this->model->delete($id);
        $this->audit->log('harvest.deleted', (int) $user['sub'], 'harvest_records', $id);

        respond(['success' => true, 'message' => 'Harvest record deleted.']);
    }

    public function yieldReport(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $report = $this->model->getYieldReport($farmId);

        respond(['success' => true, 'farm_id' => $farmId, 'yield_report' => $report]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
