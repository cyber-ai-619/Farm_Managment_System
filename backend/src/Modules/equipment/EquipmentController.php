<?php

declare(strict_types=1);

require_once __DIR__ . '/EquipmentModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * EquipmentController
 *
 * REST API handler for /api/equipment/* routes
 */
class EquipmentController
{
    private EquipmentModel $model;
    private AuditLogger    $audit;

    public function __construct(PDO $pdo)
    {
        $this->model = new EquipmentModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    public function index(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $items  = $this->model->findByFarm($farmId);
        respond(['success' => true, 'count' => count($items), 'data' => $items]);
    }

    public function show(int $id): void
    {
        requireAuth();
        $equipment = $this->model->findById($id);
        if (!$equipment) {
            respond(['success' => false, 'message' => 'Equipment not found.'], 404);
        }
        $maintenance = $this->model->findMaintenance($id);
        $repairs     = $this->model->findRepairs($id);
        $fuel        = $this->model->findFuelLogs($id);

        respond([
            'success' => true,
            'data' => $equipment,
            'maintenance_schedules' => $maintenance,
            'repairs' => $repairs,
            'fuel_logs' => $fuel,
        ]);
    }

    public function store(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['name']) || empty($body['farm_id'])) {
            respond(['success' => false, 'message' => 'name and farm_id are required.'], 422);
        }

        $id = $this->model->create((int) $body['farm_id'], $body);
        $this->audit->log('equipment.created', (int) $user['sub'], 'equipment', $id);

        respond(['success' => true, 'message' => 'Equipment registered.', 'id' => $id], 201);
    }

    public function update(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'name is required.'], 422);
        }

        $this->model->update($id, $body);
        $this->audit->log('equipment.updated', (int) $user['sub'], 'equipment', $id);

        respond(['success' => true, 'message' => 'Equipment updated.']);
    }

    public function destroy(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $this->model->delete($id);
        $this->audit->log('equipment.deleted', (int) $user['sub'], 'equipment', $id);

        respond(['success' => true, 'message' => 'Equipment removed.']);
    }

    public function maintenance(int $id): void
    {
        requireAuth();
        $records = $this->model->findMaintenance($id);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function storeMaintenance(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['service_type'])) {
            respond(['success' => false, 'message' => 'service_type is required.'], 422);
        }

        $scheduleId = $this->model->createMaintenance($id, $body);
        $this->audit->log('equipment.maintenance_scheduled', (int) $user['sub'], 'maintenance_schedules', $scheduleId);

        respond(['success' => true, 'message' => 'Maintenance schedule added.', 'id' => $scheduleId], 201);
    }

    public function repairs(int $id): void
    {
        requireAuth();
        $repairs = $this->model->findRepairs($id);
        respond(['success' => true, 'count' => count($repairs), 'data' => $repairs]);
    }

    public function storeRepair(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['description'])) {
            respond(['success' => false, 'message' => 'description is required.'], 422);
        }

        $repairId = $this->model->logRepair($id, (int) $user['sub'], $body);
        $this->audit->log('equipment.repair_logged', (int) $user['sub'], 'repair_history', $repairId);

        respond(['success' => true, 'message' => 'Repair record logged.', 'id' => $repairId], 201);
    }

    public function fuelLogs(int $id): void
    {
        requireAuth();
        $logs = $this->model->findFuelLogs($id);
        respond(['success' => true, 'count' => count($logs), 'data' => $logs]);
    }

    public function storeFuelLog(int $id): void
    {
        $user = requireAuth();
        $body = $this->jsonBody();

        if (empty($body['litres_added'])) {
            respond(['success' => false, 'message' => 'litres_added is required.'], 422);
        }

        $fuelId = $this->model->logFuel($id, (int) $user['sub'], $body);
        $this->audit->log('equipment.fuel_logged', (int) $user['sub'], 'fuel_logs', $fuelId);

        respond(['success' => true, 'message' => 'Fuel entry logged.', 'id' => $fuelId], 201);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
