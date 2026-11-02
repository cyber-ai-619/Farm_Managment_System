<?php

declare(strict_types=1);

require_once __DIR__ . '/JwtHelper.php';
require_once __DIR__ . '/UserModel.php';
require_once __DIR__ . '/AuditLogger.php';

/**
 * AuthController
 *
 * Handles all /api/auth/* routes:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   PUT  /api/auth/me
 *   POST /api/auth/logout
 */
class AuthController
{
    private PDO         $pdo;
    private UserModel   $users;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->pdo   = $pdo;
        $this->users = new UserModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    // ---------------------------------------------------------------
    // POST /api/auth/register
    // ---------------------------------------------------------------

    /**
     * Register a new user account.
     * Public self-registration is strictly scoped to Farm Owners (role 2).
     * Automatically initializes an initial farm workspace for the owner.
     */
    public function register(): void
    {
        $body = $this->jsonBody();

        // Validate required fields
        $name     = trim((string) ($body['name'] ?? ''));
        $email    = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $farmName = trim((string) ($body['farm_name'] ?? ''));

        if ($name === '' || $email === '' || $password === '') {
            respond(['success' => false, 'message' => 'Name, email, and password are required.'], 422);
        }

        if (strlen($name) > 150) {
            respond(['success' => false, 'message' => 'Name cannot exceed 150 characters.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
            respond(['success' => false, 'message' => 'Invalid email address.'], 422);
        }

        // Strictly enforce 8-72 character passwords to prevent Bcrypt CPU DoS attacks
        if (strlen($password) < 8 || strlen($password) > 72) {
            respond(['success' => false, 'message' => 'Password must be between 8 and 72 characters.'], 422);
        }

        if ($this->users->emailExists($email)) {
            respond(['success' => false, 'message' => 'An account with that email already exists.'], 409);
        }

        // Self-registration is strictly for Farm Owners (role 2).
        // Prevents privilege escalation where attackers submit role_id: 1 (admin).
        $roleId = 2; // farm_owner

        $userId = $this->users->create($name, $email, $password, $roleId);
        $user   = $this->users->findById($userId);

        // Auto-create initial farm for the new owner
        require_once __DIR__ . '/../farm_field/FarmModel.php';
        $farmModel = new FarmModel($this->pdo);
        $farmName = $farmName !== '' ? $farmName : ($name . "'s Farm");
        $farmId = $farmModel->create([
            'owner_id'    => $userId,
            'name'        => $farmName,
            'description' => 'Primary farm created upon owner registration',
        ]);

        $token = JwtHelper::generate([
            'sub'       => $userId,
            'email'     => $email,
            'role'      => $user['role_name'],
            'role_id'   => (int) $user['role_id'],
            'farm_id'   => $farmId,
        ]);

        $this->audit->log('user.registered', $userId, 'users', $userId);

        respond([
            'success' => true,
            'message' => 'Account created successfully.',
            'token'   => $token,
            'user'    => $this->publicUser($user),
            'farm_id' => $farmId,
        ], 201);
    }

    // ---------------------------------------------------------------
    // GET /api/auth/invite
    // ---------------------------------------------------------------

    /**
     * Validates an invite token and returns pre-populated metadata.
     */
    public function getInvite(): void
    {
        $token = trim((string) ($_GET['token'] ?? ''));
        if ($token === '') {
            respond(['success' => false, 'message' => 'Invite token is required.'], 422);
        }

        $stmt = $this->pdo->prepare("
            SELECT fm.id AS member_id, fm.farm_id, fm.user_id, fm.role_id, fm.status,
                   u.name, u.email, f.name AS farm_name, r.name AS role_name
            FROM farm_members fm
            JOIN users u ON u.id = fm.user_id
            JOIN farms f ON f.id = fm.farm_id
            JOIN roles r ON r.id = fm.role_id
            WHERE fm.invite_token = :token AND fm.status = 'invited'
            LIMIT 1
        ");
        $stmt->execute([':token' => $token]);
        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            respond(['success' => false, 'message' => 'Invalid or expired invitation link.'], 404);
        }

        respond([
            'success' => true,
            'data'    => [
                'token'     => $token,
                'name'      => $invite['name'],
                'email'     => $invite['email'],
                'farm_name' => $invite['farm_name'],
                'role_name' => $invite['role_name'],
                'role_id'   => (int) $invite['role_id'],
            ]
        ]);
    }

    // ---------------------------------------------------------------
    // POST /api/auth/accept-invite
    // ---------------------------------------------------------------

    /**
     * Accepts an invitation, sets the user's password, activates their farm membership,
     * and authenticates them immediately.
     */
    public function acceptInvite(): void
    {
        $body = $this->jsonBody();
        $token    = trim((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $name     = trim((string) ($body['name'] ?? ''));

        if ($token === '' || $password === '') {
            respond(['success' => false, 'message' => 'Token and password are required.'], 422);
        }

        if (strlen($password) < 8 || strlen($password) > 72) {
            respond(['success' => false, 'message' => 'Password must be between 8 and 72 characters.'], 422);
        }

        $stmt = $this->pdo->prepare("
            SELECT fm.id AS member_id, fm.farm_id, fm.user_id, fm.role_id,
                   u.name, u.email, f.name AS farm_name, r.name AS role_name
            FROM farm_members fm
            JOIN users u ON u.id = fm.user_id
            JOIN farms f ON f.id = fm.farm_id
            JOIN roles r ON r.id = fm.role_id
            WHERE fm.invite_token = :token AND fm.status = 'invited'
            LIMIT 1
        ");
        $stmt->execute([':token' => $token]);
        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            respond(['success' => false, 'message' => 'Invalid or expired invitation link.'], 404);
        }

        $userId = (int) $invite['user_id'];
        $farmId = (int) $invite['farm_id'];
        $hash   = password_hash($password, PASSWORD_BCRYPT);

        if ($name !== '') {
            $upUser = $this->pdo->prepare("UPDATE users SET name = :name, password_hash = :hash WHERE id = :id");
            $upUser->execute([':name' => $name, ':hash' => $hash, ':id' => $userId]);
        } else {
            $upUser = $this->pdo->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
            $upUser->execute([':hash' => $hash, ':id' => $userId]);
        }

        // Activate farm membership and clear invite token
        $upMember = $this->pdo->prepare("
            UPDATE farm_members
            SET status = 'active', invite_token = NULL
            WHERE id = :id
        ");
        $upMember->execute([':id' => $invite['member_id']]);

        $user = $this->users->findById($userId);

        $jwtToken = JwtHelper::generate([
            'sub'     => $userId,
            'email'   => $user['email'],
            'role'    => $user['role_name'],
            'role_id' => (int) $user['role_id'],
            'farm_id' => $farmId,
        ]);

        $this->audit->log('user.invite_accepted', $userId, 'farm_members', (int) $invite['member_id']);

        respond([
            'success' => true,
            'message' => 'Invitation accepted! Welcome to the farm team.',
            'token'   => $jwtToken,
            'user'    => $this->publicUser($user),
            'farm_id' => $farmId,
        ]);
    }

    // ---------------------------------------------------------------
    // POST /api/auth/login
    // ---------------------------------------------------------------

    /**
     * Authenticate a user and return a JWT.
     *
     * Request body (JSON):
     *   { "email": "...", "password": "..." }
     */
    public function login(): void
    {
        $body = $this->jsonBody();

        $email    = trim($body['email']    ?? '');
        $password = $body['password']      ?? '';

        if ($email === '' || $password === '') {
            respond(['success' => false, 'message' => 'email and password are required.'], 422);
        }

        $user = $this->users->findByEmail($email);

        // Use a generic error message to avoid leaking whether the email exists
        if ($user === null || !$this->users->verifyPassword($password, $user['password_hash'])) {
            respond(['success' => false, 'message' => 'Invalid email or password.'], 401);
        }

        $token = JwtHelper::generate([
            'sub'     => (int) $user['id'],
            'email'   => $user['email'],
            'role'    => $user['role_name'],
            'role_id' => (int) $user['role_id'],
        ]);

        $this->audit->log('user.login', (int) $user['id']);

        respond([
            'success' => true,
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => $this->publicUser($user),
        ]);
    }

    // ---------------------------------------------------------------
    // GET /api/auth/me
    // ---------------------------------------------------------------

    /**
     * Return the currently authenticated user's profile.
     * Requires a valid Bearer token.
     */
    public function me(): void
    {
        $payload = requireAuth();

        $user = $this->users->findById((int) $payload['sub']);

        if ($user === null) {
            respond(['success' => false, 'message' => 'User not found.'], 404);
        }

        respond([
            'success' => true,
            'user'    => $this->publicUser($user),
        ]);
    }

    /**
     * Update the authenticated user's editable profile fields.
     */
    public function updateMe(): void
    {
        $payload = requireAuth();
        $body = $this->jsonBody();
        $userId = (int) $payload['sub'];
        $currentUser = $this->users->findById($userId);

        if ($currentUser === null) {
            respond(['success' => false, 'message' => 'User not found.'], 404);
        }

        $name = trim((string) ($body['name'] ?? $currentUser['name']));
        $email = strtolower(trim((string) ($body['email'] ?? $currentUser['email'])));
        $phone = trim((string) ($body['phone'] ?? $currentUser['phone'] ?? ''));
        $location = trim((string) ($body['location'] ?? $currentUser['location'] ?? ''));
        $nameLength = preg_match_all('/./us', $name);
        $phoneLength = preg_match_all('/./us', $phone);
        $locationLength = preg_match_all('/./us', $location);

        if ($nameLength === false || $name === '' || $nameLength > 150) {
            respond(['success' => false, 'message' => 'Name must be between 1 and 150 characters.'], 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
            respond(['success' => false, 'message' => 'Enter a valid email address.'], 422);
        }
        if ($this->users->emailExistsForOtherUser($email, $userId)) {
            respond(['success' => false, 'message' => 'That email address is already in use.'], 409);
        }
        if ($phoneLength === false || $phoneLength > 30 || ($phone !== '' && !preg_match('/^[0-9+().\-\s]{7,30}$/', $phone))) {
            respond(['success' => false, 'message' => 'Enter a valid phone number.'], 422);
        }
        if ($locationLength === false || $locationLength > 255) {
            respond(['success' => false, 'message' => 'Location must be 255 characters or fewer.'], 422);
        }

        $profilePhoto = $currentUser['profile_photo'];
        if (array_key_exists('profile_photo', $body)) {
            $profilePhoto = $this->validatedProfilePhoto($body['profile_photo']);
        }

        $this->users->updateProfile($userId, [
            'name' => $name,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'location' => $location !== '' ? $location : null,
            'profile_photo' => $profilePhoto,
        ]);
        $user = $this->users->findById($userId);

        $this->audit->log('user.profile_updated', $userId, 'users', $userId);

        respond([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $this->publicUser($user),
        ]);
    }

    public function changePassword(): void
    {
        $payload = requireAuth();
        $body = $this->jsonBody();
        $userId = (int) $payload['sub'];
        $user = $this->users->findForPasswordChange($userId);

        if ($user === null) {
            respond(['success' => false, 'message' => 'User not found.'], 404);
        }

        $currentPassword = (string) ($body['current_password'] ?? '');
        $newPassword = (string) ($body['new_password'] ?? '');
        if (!$this->users->verifyPassword($currentPassword, $user['password_hash'])) {
            respond(['success' => false, 'message' => 'Current password is incorrect.'], 422);
        }
        if (strlen($newPassword) < 8 || strlen($newPassword) > 72) {
            respond(['success' => false, 'message' => 'New password must be between 8 and 72 characters.'], 422);
        }
        if ($this->users->verifyPassword($newPassword, $user['password_hash'])) {
            respond(['success' => false, 'message' => 'Choose a password you have not used before.'], 422);
        }

        $this->users->updatePassword($userId, $newPassword);
        $this->audit->log('user.password_changed', $userId, 'users', $userId);
        respond(['success' => true, 'message' => 'Password changed successfully.']);
    }

    private function validatedProfilePhoto(mixed $photo): ?string
    {
        if ($photo === null || $photo === '') {
            return null;
        }
        if (!is_string($photo) || !preg_match('/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/', $photo, $matches)) {
            respond(['success' => false, 'message' => 'Profile photo must be a JPG, PNG, or WEBP image.'], 422);
        }

        $imageData = base64_decode($matches[2], true);
        if ($imageData === false || strlen($imageData) > 5 * 1024 * 1024) {
            respond(['success' => false, 'message' => 'Profile photo must be 5 MB or smaller.'], 422);
        }
        $imageInfo = getimagesizefromstring($imageData);
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if ($imageInfo === false || !in_array($imageInfo['mime'], $allowedTypes, true)) {
            respond(['success' => false, 'message' => 'The selected file is not a supported image.'], 422);
        }

        return 'data:' . $imageInfo['mime'] . ';base64,' . base64_encode($imageData);
    }

    // ---------------------------------------------------------------
    // POST /api/auth/logout
    // ---------------------------------------------------------------

    /**
     * Logout is stateless with JWT — we just acknowledge the request.
     * The client is responsible for discarding the token.
     */
    public function logout(): void
    {
        $payload = requireAuth();
        $this->audit->log('user.logout', (int) $payload['sub']);

        respond([
            'success' => true,
            'message' => 'Logged out. Please discard your token.',
        ]);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /**
     * Read and decode the JSON request body.
     */
    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }

    /**
     * Strip the password_hash before returning user data to the client.
     */
    private function publicUser(array $user): array
    {
        unset($user['password_hash']);
        return $user;
    }
}
