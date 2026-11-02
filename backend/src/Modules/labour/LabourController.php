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
    private PDO         $pdo;
    private LabourModel $model;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->pdo   = $pdo;
        $this->model = new LabourModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    // =========================================================================
    // WORKERS (MANAGEMENT)
    // =========================================================================

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

    public function linkUserAccount(int $workerId): void
    {
        $currentUser = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        $worker = $this->model->findById($workerId);
        if (!$worker) {
            respond(['success' => false, 'message' => 'Worker not found.'], 404);
        }

        $email    = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $userId   = isset($body['user_id']) ? (int) $body['user_id'] : null;

        if (!$userId && $email !== '') {
            // Find user by email or create
            require_once __DIR__ . '/../security/UserModel.php';
            $userModel = new UserModel($this->pdo);
            $existing = $userModel->findByEmail($email);

            if ($existing) {
                $userId = (int) $existing['id'];
            } else {
                if (strlen($password) < 8) {
                    respond(['success' => false, 'message' => 'Password must be at least 8 characters to create a new user account.'], 422);
                }
                $name = $worker['first_name'] . ' ' . $worker['last_name'];
                $userId = $userModel->create($name, $email, $password, 5); // role_id 5 = worker
            }
        }

        if (!$userId) {
            respond(['success' => false, 'message' => 'Valid email or user_id required to link an account.'], 422);
        }

        $this->model->linkUserToWorker($workerId, $userId);

        // Add to farm_members if not present
        try {
            $memberStmt = $this->pdo->prepare(
                'INSERT IGNORE INTO farm_members (farm_id, user_id, role_id, status)
                 VALUES (:farm_id, :user_id, 5, "active")'
            );
            $memberStmt->execute([':farm_id' => $worker['farm_id'], ':user_id' => $userId]);
        } catch (\Throwable) {}

        $this->audit->log('labour.worker_linked_user', (int) $currentUser['sub'], 'workers', $workerId);
        respond(['success' => true, 'message' => 'Worker successfully linked to user account.', 'user_id' => $userId]);
    }

    // =========================================================================
    // WORKER SELF-SERVICE (MOBILE PORTAL)
    // =========================================================================

    private function getAuthenticatedWorker(array $user): array
    {
        $userId = (int) $user['sub'];
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : ($user['farm_id'] ?? null);

        $worker = $this->model->findWorkerByUserId($userId, $farmId);
        if (!$worker) {
            respond([
                'success' => false,
                'message' => 'No active worker profile linked to this user account. Please contact your farm administrator.'
            ], 403);
        }
        return $worker;
    }

    public function myTasks(): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);
        $status = $_GET['status'] ?? null;

        $tasks = $this->model->findMyTasks((int) $worker['id'], (int) $worker['farm_id'], $status);
        respond([
            'success' => true,
            'worker'  => [
                'id'         => $worker['id'],
                'first_name' => $worker['first_name'],
                'last_name'  => $worker['last_name'],
                'role'       => $worker['role'],
                'farm_id'    => $worker['farm_id'],
            ],
            'count'   => count($tasks),
            'data'    => $tasks
        ]);
    }

    public function updateMyTask(int $taskId): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);
        $body = $this->jsonBody();

        $status = trim((string) ($body['status'] ?? ''));
        $notes  = isset($body['completion_notes']) ? trim((string) $body['completion_notes']) : null;

        $allowedStatuses = ['pending', 'in_progress', 'completed'];
        if (!in_array($status, $allowedStatuses, true)) {
            respond(['success' => false, 'message' => 'Invalid task status. Must be pending, in_progress, or completed.'], 422);
        }

        $ok = $this->model->updateWorkerTaskProgress($taskId, (int) $worker['id'], $status, $notes);
        if (!$ok) {
            respond(['success' => false, 'message' => 'Task not found or not assigned to you.'], 403);
        }

        $this->audit->log('labour.my_task_updated', (int) $user['sub'], 'task_assignments', $taskId);
        respond(['success' => true, 'message' => "Task marked as {$status}."]);
    }

    public function myClockIn(): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);

        $id = $this->model->recordSelfClockIn((int) $worker['id'], (int) $worker['farm_id'], (int) $user['sub']);
        $this->audit->log('labour.worker_clock_in', (int) $user['sub'], 'worker_attendance', $id);

        respond(['success' => true, 'message' => 'Clock-in recorded successfully.', 'attendance_id' => $id]);
    }

    public function myClockOut(): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);

        $ok = $this->model->recordSelfClockOut((int) $worker['id'], (int) $worker['farm_id']);
        if (!$ok) {
            respond(['success' => false, 'message' => 'No active clock-in found for today to clock out.'], 404);
        }

        $this->audit->log('labour.worker_clock_out', (int) $user['sub'], 'workers', (int) $worker['id']);
        respond(['success' => true, 'message' => 'Clock-out recorded successfully.']);
    }

    public function myAttendance(): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);
        $records = $this->model->findMyAttendance((int) $worker['id'], (int) $worker['farm_id']);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function myPayroll(): void
    {
        $user = requireAuth();
        $worker = $this->getAuthenticatedWorker($user);
        $records = $this->model->findPayrollByWorker((int) $worker['id'], (int) $worker['farm_id']);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    // =========================================================================
    // ATTENDANCE & MUSTER ROLL (MANAGEMENT)
    // =========================================================================

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

    public function bulkAttendance(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        $farmId  = (int) ($body['farm_id'] ?? 1);
        $date    = (string) ($body['work_date'] ?? date('Y-m-d'));
        $records = (array) ($body['records'] ?? []);

        if (empty($records)) {
            respond(['success' => false, 'message' => 'No attendance records provided in bulk payload.'], 422);
        }

        $this->model->bulkRecordAttendance($farmId, (int) $user['sub'], $date, $records);
        $this->audit->log('labour.bulk_attendance_saved', (int) $user['sub'], 'worker_attendance', count($records));

        respond(['success' => true, 'message' => 'Muster-roll attendance saved successfully.']);
    }

    public function verifyAttendance(int $attendanceId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $this->model->verifyAttendance($attendanceId, (int) $user['sub']);
        $this->audit->log('labour.attendance_verified', (int) $user['sub'], 'worker_attendance', $attendanceId);
        respond(['success' => true, 'message' => 'Attendance verified.']);
    }

    // =========================================================================
    // TASKS (MANAGEMENT)
    // =========================================================================

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

    public function verifyTask(int $taskId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $this->model->verifyTask($taskId, (int) $user['sub']);
        $this->audit->log('labour.task_verified', (int) $user['sub'], 'task_assignments', $taskId);
        respond(['success' => true, 'message' => 'Task marked as verified and approved.']);
    }

    // =========================================================================
    // PAYROLL (MANAGEMENT)
    // =========================================================================

    public function generatePayroll(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        $farmId    = (int) ($body['farm_id'] ?? 1);
        $startDate = (string) ($body['start_date'] ?? date('Y-m-01'));
        $endDate   = (string) ($body['end_date'] ?? date('Y-m-t'));

        $payroll = $this->model->calculateAndGeneratePayroll($farmId, (int) $user['sub'], $startDate, $endDate);
        $this->audit->log('labour.payroll_generated', (int) $user['sub'], 'payroll_records', count($payroll));

        respond(['success' => true, 'message' => 'Payroll calculation run complete.', 'count' => count($payroll), 'data' => $payroll]);
    }

    public function indexPayroll(): void
    {
        requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $farmId    = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $startDate = $_GET['start_date'] ?? null;
        $endDate   = $_GET['end_date'] ?? null;

        $records = $this->model->findPayrollByFarm($farmId, $startDate, $endDate);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function updatePayrollPayment(int $payrollId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'accountant']);
        $body = $this->jsonBody();

        $status = (string) ($body['payment_status'] ?? 'paid');
        $method = $body['payment_method'] ?? null;
        $date   = $body['payment_date'] ?? null;
        $notes  = $body['notes'] ?? null;

        $this->model->updatePayrollPayment($payrollId, $status, $method, $date, $notes);
        $this->audit->log('labour.payroll_paid', (int) $user['sub'], 'payroll_records', $payrollId);

        respond(['success' => true, 'message' => 'Payment status updated.']);
    }

    // =========================================================================
    // FIELD INCIDENTS & HAZARDS
    // =========================================================================

    public function reportIncident(): void
    {
        $user = requireAuth();
        $body = $this->jsonBody();

        if (empty($body['title']) || empty($body['farm_id'])) {
            respond(['success' => false, 'message' => 'title and farm_id are required.'], 422);
        }

        $farmId = (int) $body['farm_id'];
        $worker = $this->model->findWorkerByUserId((int) $user['sub'], $farmId);
        $workerId = $worker ? (int) $worker['id'] : null;

        $id = $this->model->recordIncident($farmId, $workerId, (int) $user['sub'], $body);
        $this->audit->log('labour.incident_reported', (int) $user['sub'], 'field_incidents', $id);

        respond(['success' => true, 'message' => 'Field incident reported.', 'id' => $id], 201);
    }

    public function indexIncidents(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $status = $_GET['status'] ?? null;

        $incidents = $this->model->findIncidents($farmId, $status);
        respond(['success' => true, 'count' => count($incidents), 'data' => $incidents]);
    }

    public function resolveIncident(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        $status = (string) ($body['status'] ?? 'resolved');
        $notes  = $body['resolution_notes'] ?? null;

        $this->model->resolveIncident($id, (int) $user['sub'], $status, $notes);
        $this->audit->log('labour.incident_resolved', (int) $user['sub'], 'field_incidents', $id);

        respond(['success' => true, 'message' => 'Incident updated.']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
