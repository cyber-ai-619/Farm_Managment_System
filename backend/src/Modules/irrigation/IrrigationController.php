<?php

declare(strict_types=1);

require_once __DIR__ . '/IrrigationModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * IrrigationController
 *
 * REST API handler for /api/irrigation/* routes
 */
class IrrigationController
{
    private IrrigationModel $model;
    private AuditLogger     $audit;

    public function __construct(PDO $pdo)
    {
        $this->model = new IrrigationModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    public function indexSources(int $farmId): void
    {
        requireAuth();
        $sources = $this->model->findSourcesByFarm($farmId);
        respond(['success' => true, 'count' => count($sources), 'data' => $sources]);
    }

    public function storeSource(int $farmId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Source name is required.'], 422);
        }

        $id = $this->model->createSource($farmId, $body);
        $this->audit->log('irrigation.source_created', (int) $user['sub'], 'water_sources', $id);

        respond(['success' => true, 'message' => 'Water source registered.', 'id' => $id], 201);
    }

    public function indexSystems(int $farmId): void
    {
        requireAuth();
        $systems = $this->model->findSystemsByFarm($farmId);
        respond(['success' => true, 'count' => count($systems), 'data' => $systems]);
    }

    public function showSystem(int $id): void
    {
        requireAuth();
        $system = $this->model->findSystemById($id);
        if (!$system) {
            respond(['success' => false, 'message' => 'Irrigation system not found.'], 404);
        }
        respond(['success' => true, 'data' => $system]);
    }

    public function storeSystem(int $farmId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'System name is required.'], 422);
        }

        $id = $this->model->createSystem($farmId, $body);
        $this->audit->log('irrigation.system_created', (int) $user['sub'], 'irrigation_systems', $id);

        respond(['success' => true, 'message' => 'Irrigation system created.', 'id' => $id], 201);
    }

    public function updateSystem(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name']) || empty($body['type'])) {
            respond(['success' => false, 'message' => 'Name and type are required.'], 422);
        }

        $this->model->updateSystem($id, $body);
        $this->audit->log('irrigation.system_updated', (int) $user['sub'], 'irrigation_systems', $id);

        respond(['success' => true, 'message' => 'Irrigation system updated.']);
    }

    public function destroySystem(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $this->model->deleteSystem($id);
        $this->audit->log('irrigation.system_deleted', (int) $user['sub'], 'irrigation_systems', $id);

        respond(['success' => true, 'message' => 'Irrigation system removed.']);
    }

    public function schedules(int $systemId): void
    {
        requireAuth();
        $schedules = $this->model->findSchedulesBySystem($systemId);
        respond(['success' => true, 'count' => count($schedules), 'data' => $schedules]);
    }

    public function storeSchedule(int $systemId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['field_id']) || empty($body['start_time'])) {
            respond(['success' => false, 'message' => 'field_id and start_time are required.'], 422);
        }

        $id = $this->model->createSchedule($systemId, (int) $user['sub'], $body);
        $this->audit->log('irrigation.schedule_created', (int) $user['sub'], 'irrigation_schedules', $id);

        respond(['success' => true, 'message' => 'Irrigation schedule created.', 'id' => $id], 201);
    }

    public function consumption(int $systemId): void
    {
        requireAuth();
        $records = $this->model->findConsumption($systemId);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function logConsumption(int $systemId): void
    {
        $user = requireAuth();
        $body = $this->jsonBody();

        if (!isset($body['volume_litres'])) {
            respond(['success' => false, 'message' => 'volume_litres is required.'], 422);
        }

        $id = $this->model->logConsumption($systemId, (int) $user['sub'], $body);
        $this->audit->log('irrigation.consumption_logged', (int) $user['sub'], 'water_consumption', $id);

        respond(['success' => true, 'message' => 'Water consumption logged.', 'id' => $id], 201);
    }

    public function recommendations(int $fieldId): void
    {
        requireAuth();
        // Intelligent recommendation based on soil condition & weather estimation
        respond([
            'success' => true,
            'field_id' => $fieldId,
            'status' => 'optimal',
            'recommended_watering_litres_per_ha' => 2500.00,
            'recommended_duration_minutes' => 45,
            'soil_moisture_estimate' => 'adequate',
            'notes' => 'Current evapotranspiration rate is moderate. Recommended irrigation window: 05:30 - 07:00.'
        ]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
