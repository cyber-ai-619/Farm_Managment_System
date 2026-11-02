<?php

declare(strict_types=1);

require_once __DIR__ . '/FarmModel.php';
require_once __DIR__ . '/../security/UserModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

class FarmMemberController
{
    private PDO         $pdo;
    private FarmModel   $farmModel;
    private UserModel   $userModel;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->pdo       = $pdo;
        $this->farmModel = new FarmModel($pdo);
        $this->userModel = new UserModel($pdo);
        $this->audit     = new AuditLogger($pdo);

        $this->ensureSchema();
    }

    private function ensureSchema(): void
    {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS farm_members (
                    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    farm_id      INT UNSIGNED NOT NULL,
                    user_id      INT UNSIGNED NOT NULL,
                    role_id      INT UNSIGNED NOT NULL,
                    status       ENUM('invited', 'active', 'suspended') NOT NULL DEFAULT 'active',
                    invite_token VARCHAR(64) NULL,
                    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_farm_user (farm_id, user_id),
                    INDEX idx_farm_members_farm (farm_id),
                    INDEX idx_farm_members_user (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            $this->pdo->exec("ALTER TABLE farm_members ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) NULL AFTER status");
        } catch (\Throwable) {
            // Ignore schema creation errors if permissions are restricted
        }
    }

    public function index(int $farmId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);

        if (!$this->farmModel->hasAccess($farmId, (int) $user['sub'], (string) $user['role'])) {
            respond(['success' => false, 'message' => 'You do not have permission to view members for this farm.'], 403);
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT fm.id, fm.farm_id, fm.user_id, fm.role_id, fm.status, fm.invite_token, fm.created_at,
                       u.name, u.email, u.phone, r.name AS role_name
                FROM farm_members fm
                JOIN users u ON u.id = fm.user_id
                JOIN roles r ON r.id = fm.role_id
                WHERE fm.farm_id = :farm_id
                ORDER BY fm.created_at ASC
            ");
            $stmt->execute([':farm_id' => $farmId]);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            $stmt = $this->pdo->prepare("
                SELECT fm.id, fm.farm_id, fm.user_id, fm.role_id, fm.status, NULL AS invite_token, fm.created_at,
                       u.name, u.email, u.phone, r.name AS role_name
                FROM farm_members fm
                JOIN users u ON u.id = fm.user_id
                JOIN roles r ON r.id = fm.role_id
                WHERE fm.farm_id = :farm_id
                ORDER BY fm.created_at ASC
            ");
            $stmt->execute([':farm_id' => $farmId]);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        respond(['success' => true, 'count' => count($members), 'data' => $members]);
    }

    public function store(int $farmId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        if (!$this->farmModel->hasAccess($farmId, (int) $user['sub'], (string) $user['role'])) {
            respond(['success' => false, 'message' => 'You do not have permission to add members to this farm.'], 403);
        }

        $body = $this->jsonBody();
        $name     = trim((string) ($body['name'] ?? ''));
        $email    = strtolower(trim((string) ($body['email'] ?? '')));
        $roleId   = (int) ($body['role_id'] ?? 5);
        $mode     = trim((string) ($body['mode'] ?? 'invite')); // 'invite' | 'direct'
        $password = (string) ($body['password'] ?? '');

        if ($name === '' || $email === '') {
            respond(['success' => false, 'message' => 'Name and email are required.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(['success' => false, 'message' => 'Invalid email address.'], 422);
        }

        $allowedStaffRoles = [3, 4, 5, 6]; // manager, agronomist, worker, accountant
        if (!in_array($roleId, $allowedStaffRoles, true)) {
            respond(['success' => false, 'message' => 'Invalid role assigned. Staff roles can be Manager, Agronomist, Worker, or Accountant.'], 422);
        }

        $existingUser = $this->userModel->findByEmail($email);
        $userId = null;
        $status = 'active';
        $inviteToken = null;

        if ($existingUser !== null) {
            $userId = (int) $existingUser['id'];
            // Check if already in this farm
            $checkStmt = $this->pdo->prepare("SELECT id FROM farm_members WHERE farm_id = :farm_id AND user_id = :user_id LIMIT 1");
            $checkStmt->execute([':farm_id' => $farmId, ':user_id' => $userId]);
            if ($checkStmt->fetch()) {
                respond(['success' => false, 'message' => 'This user is already a member of your farm team.'], 409);
            }
        } else {
            // New user creation
            if ($mode === 'direct') {
                if (strlen($password) < 8 || strlen($password) > 72) {
                    respond(['success' => false, 'message' => 'Temporary password must be between 8 and 72 characters.'], 422);
                }
            } else {
                // Invite link mode
                $status = 'invited';
                $inviteToken = bin2hex(random_bytes(16));
                $password = bin2hex(random_bytes(12)); // Random initial password until token activation
            }

            $userId = $this->userModel->create($name, $email, $password, $roleId);
        }

        // Insert into farm_members
        try {
            $insertStmt = $this->pdo->prepare("
                INSERT INTO farm_members (farm_id, user_id, role_id, status, invite_token)
                VALUES (:farm_id, :user_id, :role_id, :status, :invite_token)
            ");
            $insertStmt->execute([
                ':farm_id'      => $farmId,
                ':user_id'      => $userId,
                ':role_id'      => $roleId,
                ':status'       => $status,
                ':invite_token' => $inviteToken,
            ]);
        } catch (\Throwable) {
            $insertStmt = $this->pdo->prepare("
                INSERT INTO farm_members (farm_id, user_id, role_id, status)
                VALUES (:farm_id, :user_id, :role_id, :status)
            ");
            $insertStmt->execute([
                ':farm_id' => $farmId,
                ':user_id' => $userId,
                ':role_id' => $roleId,
                ':status'  => $status,
            ]);
        }
        $memberId = (int) $this->pdo->lastInsertId();

        $this->audit->log('farm.member_added', (int) $user['sub'], 'farm_members', $memberId);

        respond([
            'success'     => true,
            'message'     => $mode === 'invite' ? 'Member invited successfully.' : 'Staff account created successfully.',
            'id'          => $memberId,
            'user_id'     => $userId,
            'status'      => $status,
            'invite_token'=> $inviteToken,
        ], 201);
    }

    public function update(int $farmId, int $memberId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        if (!$this->farmModel->hasAccess($farmId, (int) $user['sub'], (string) $user['role'])) {
            respond(['success' => false, 'message' => 'You do not have permission to manage this farm.'], 403);
        }

        $body = $this->jsonBody();
        $status = $body['status'] ?? null;
        $roleId = isset($body['role_id']) ? (int) $body['role_id'] : null;

        $updates = [];
        $params  = [':id' => $memberId, ':farm_id' => $farmId];

        if ($status !== null && in_array($status, ['active', 'suspended', 'invited'], true)) {
            $updates[] = 'status = :status';
            $params[':status'] = $status;
        }

        if ($roleId !== null && in_array($roleId, [3, 4, 5, 6], true)) {
            $updates[] = 'role_id = :role_id';
            $params[':role_id'] = $roleId;
        }

        if (empty($updates)) {
            respond(['success' => false, 'message' => 'No valid fields to update.'], 422);
        }

        $sql = 'UPDATE farm_members SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id AND farm_id = :farm_id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        $this->audit->log('farm.member_updated', (int) $user['sub'], 'farm_members', $memberId);

        respond(['success' => true, 'message' => 'Member updated successfully.']);
    }

    public function destroy(int $farmId, int $memberId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        if (!$this->farmModel->hasAccess($farmId, (int) $user['sub'], (string) $user['role'])) {
            respond(['success' => false, 'message' => 'You do not have permission to manage this farm.'], 403);
        }

        // Prevent removing the farm owner
        $checkStmt = $this->pdo->prepare("
            SELECT fm.user_id, f.owner_id
            FROM farm_members fm
            JOIN farms f ON f.id = fm.farm_id
            WHERE fm.id = :id AND fm.farm_id = :farm_id
            LIMIT 1
        ");
        $checkStmt->execute([':id' => $memberId, ':farm_id' => $farmId]);
        $row = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            respond(['success' => false, 'message' => 'Member not found.'], 404);
        }

        if ((int) $row['user_id'] === (int) $row['owner_id']) {
            respond(['success' => false, 'message' => 'The Farm Owner cannot be removed from their own farm.'], 422);
        }

        $stmt = $this->pdo->prepare("DELETE FROM farm_members WHERE id = :id AND farm_id = :farm_id");
        $stmt->execute([':id' => $memberId, ':farm_id' => $farmId]);

        $this->audit->log('farm.member_removed', (int) $user['sub'], 'farm_members', $memberId);

        respond(['success' => true, 'message' => 'Member removed from farm team.']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
