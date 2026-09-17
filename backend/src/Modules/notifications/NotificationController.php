<?php

declare(strict_types=1);

require_once __DIR__ . '/AlertModel.php';
require_once __DIR__ . '/AlertTriggerService.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * NotificationController
 *
 * REST API controller for active alerts, historical alerts,
 * alert dismissal, mark-as-read, and automated trigger scans.
 */
class NotificationController
{
    private AlertModel          $alertModel;
    private AlertTriggerService $triggerService;
    private AuditLogger         $audit;

    public function __construct(PDO $pdo)
    {
        $this->alertModel     = new AlertModel($pdo);
        $this->triggerService = new AlertTriggerService($pdo);
        $this->audit          = new AuditLogger($pdo);
    }

    public function index(): void
    {
        $user   = requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        // Auto-run scanner when fetching alerts
        if (!isset($_GET['skip_scan'])) {
            $this->triggerService->runAutomatedChecks($farmId);
        }

        $userId = ($user['role'] === 'worker') ? (int) $user['sub'] : null;
        $alerts = $this->alertModel->findActiveAlerts($farmId, $userId);

        respond(['success' => true, 'count' => count($alerts), 'data' => $alerts]);
    }

    public function history(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $limit  = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;

        $history = $this->alertModel->findAlertHistory($farmId, $limit);
        respond(['success' => true, 'count' => count($history), 'data' => $history]);
    }

    public function store(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager']);
        $body = $this->jsonBody();

        if (empty($body['title']) || empty($body['message'])) {
            respond(['success' => false, 'message' => 'title and message are required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $userId = isset($body['user_id']) ? (int) $body['user_id'] : null;

        $id = $this->alertModel->createAlert($farmId, $userId, $body);
        $this->audit->log('alert.created', (int) $user['sub'], 'alerts', $id);

        respond(['success' => true, 'message' => 'Alert created successfully.', 'id' => $id], 201);
    }

    public function dismiss(int $id): void
    {
        $user = requireAuth();
        $existing = $this->alertModel->findById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Alert not found.'], 404);
        }

        $this->alertModel->dismissAlert($id);
        $this->audit->log('alert.dismissed', (int) $user['sub'], 'alerts', $id);

        respond(['success' => true, 'message' => 'Alert dismissed.']);
    }

    public function markRead(int $id): void
    {
        $user = requireAuth();
        $existing = $this->alertModel->findById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Alert not found.'], 404);
        }

        $this->alertModel->markAsRead($id);
        respond(['success' => true, 'message' => 'Alert marked as read.']);
    }

    public function runScan(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $generated = $this->triggerService->runAutomatedChecks($farmId);

        respond([
            'success'         => true,
            'message'         => 'Automated checks completed.',
            'generated_count' => count($generated),
            'generated'       => $generated,
        ]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
