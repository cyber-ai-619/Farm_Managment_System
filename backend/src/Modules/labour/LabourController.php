<?php

declare(strict_types=1);

require_once __DIR__ . '/LabourModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * LabourController
 *
 * REST API handler for /api/labour/* and /api/workers/* routes
 */
class LabourController
{
    private LabourModel $model;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->model = new LabourModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    public function indexWorkers(): void
    {
        requireAuth();
        $farmId  = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $workers = $this->model->findByFarm($farmId);
        respond(['success' => true, 'count' => count($workers), 'data' => $workers]);
    }

    public function showWorker(int $id): void
    {
        requireAuth();
        $worker = $this->model->findById($id);
        if (!$worker) {
            respond(['success' => false, 'message' => 'Worker not found.'], 404);
        }
        respond(['success' => true, 'data' => $worker]);
    }

    public function storeWorker(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['first_name']) || empty($body['last_name']) || empty($body['farm_id'])) {
            respond(['success' => false, 'message' => 'first_name, last_name, and farm_id are required.'], 422);
        }

        $id = $this->model->create((int) $body['farm_id'], $body);
        $this->audit->log('labour.worker_created', (int) $user['sub'], 'workers', $id);

        respond(['success' => true, 'message' => 'Worker registered.', 'id' => $id], 201);
    }

    public function updateWorker(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['first_name']) || empty($body['last_name'])) {
            respond(['success' => false, 'message' => 'first_name and last_name are required.'], 422);
        }

        $this->model->update($id, $body);
        $this->audit->log('labour.worker_updated', (int) $user['sub'], 'workers', $id);

        respond(['success' => true, 'message' => 'Worker updated.']);
    }

    public function indexAttendance(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $date   = $_GET['date'] ?? null;

        $attendance = $this->model->findAttendanceByFarm($farmId, $date);
        respond(['success' => true, 'count' => count($attendance), 'data' => $attendance]);
    }

    public function storeAttendance(int $workerId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'worker']);
        $body = $this->jsonBody();

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->model->recordAttendance($workerId, $farmId, (int) $user['sub'], $body);
        $this->audit->log('labour.attendance_logged', (int) $user['sub'], 'worker_attendance', $id);

        respond(['success' => true, 'message' => 'Attendance logged.', 'id' => $id], 201);
    }

    public function indexTasks(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $status = $_GET['status'] ?? null;

        $tasks = $this->model->findTasksByFarm($farmId, $status);
        respond(['success' => true, 'count' => count($tasks), 'data' => $tasks]);
    }

    public function storeTask(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['title']) || empty($body['farm_id'])) {
            respond(['success' => false, 'message' => 'title and farm_id are required.'], 422);
        }

        $id = $this->model->createTask((int) $body['farm_id'], (int) $user['sub'], $body);
        $this->audit->log('labour.task_created', (int) $user['sub'], 'task_assignments', $id);

        respond(['success' => true, 'message' => 'Task assigned.', 'id' => $id], 201);
    }

    public function updateTaskStatus(int $id): void
    {
        requireAuth();
        $body = $this->jsonBody();

        if (empty($body['status'])) {
            respond(['success' => false, 'message' => 'status is required.'], 422);
        }

        $this->model->updateTaskStatus($id, (string) $body['status']);
        respond(['success' => true, 'message' => 'Task status updated.']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
