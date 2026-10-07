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
    private UserModel   $users;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->users = new UserModel($pdo);
        $this->audit = new AuditLogger($pdo);
    }

    // ---------------------------------------------------------------
    // POST /api/auth/register
    // ---------------------------------------------------------------

    /**
     * Register a new user account.
     *
     * Request body (JSON):
     *   { "name": "...", "email": "...", "password": "...", "role_id": 5 }
     *
     * role_id is optional; defaults to 5 (worker).
     */
    public function register(): void
    {
        $body = $this->jsonBody();

        // Validate required fields
        $name     = trim($body['name']     ?? '');
        $email    = trim($body['email']    ?? '');
        $password = $body['password']      ?? '';
        $roleId   = (int) ($body['role_id'] ?? 5);

        if ($name === '' || $email === '' || $password === '') {
            respond(['success' => false, 'message' => 'name, email, and password are required.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(['success' => false, 'message' => 'Invalid email address.'], 422);
        }

        if (strlen($password) < 8) {
            respond(['success' => false, 'message' => 'Password must be at least 8 characters.'], 422);
        }

        if ($this->users->emailExists($email)) {
            respond(['success' => false, 'message' => 'An account with that email already exists.'], 409);
        }

        $userId = $this->users->create($name, $email, $password, $roleId);
        $user   = $this->users->findById($userId);

        $token = JwtHelper::generate([
            'sub'       => $userId,
            'email'     => $email,
            'role'      => $user['role_name'],
            'role_id'   => $user['role_id'],
        ]);

        $this->audit->log('user.registered', $userId, 'users', $userId);

        respond([
            'success' => true,
            'message' => 'Account created successfully.',
            'token'   => $token,
            'user'    => $this->publicUser($user),
        ], 201);
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
