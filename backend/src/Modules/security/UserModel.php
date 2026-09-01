<?php

declare(strict_types=1);

/**
 * UserModel
 *
 * Handles all database operations for the users table.
 */
class UserModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ---------------------------------------------------------------
    // Read
    // ---------------------------------------------------------------

    /**
     * Find a user by their email address.
     *
     * @return array|null  Full user row, or null if not found.
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.*, r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.email = :email AND u.is_active = 1
             LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Find a user by their primary key.
     *
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.id = :id AND u.is_active = 1
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * List all active users (admin use).
     *
     * @return array[]
     */
    public function all(): array
    {
        $stmt = $this->pdo->query(
            'SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.created_at DESC'
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ---------------------------------------------------------------
    // Write
    // ---------------------------------------------------------------

    /**
     * Insert a new user.
     *
     * @param string $name
     * @param string $email
     * @param string $plainPassword  Will be hashed before storage.
     * @param int    $roleId         Defaults to 5 (worker).
     * @return int                   The new user's ID.
     */
    public function create(string $name, string $email, string $plainPassword, int $roleId = 5): int
    {
        $hash = password_hash($plainPassword, PASSWORD_BCRYPT);

        $stmt = $this->pdo->prepare(
            'INSERT INTO users (name, email, password_hash, role_id)
             VALUES (:name, :email, :hash, :role_id)'
        );
        $stmt->execute([
            ':name'    => $name,
            ':email'   => $email,
            ':hash'    => $hash,
            ':role_id' => $roleId,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Verify a plain password against the stored hash.
     */
    public function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    /**
     * Check whether an email is already registered.
     */
    public function emailExists(string $email): bool
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
