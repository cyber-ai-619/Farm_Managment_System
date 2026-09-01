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
