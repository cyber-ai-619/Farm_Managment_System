<?php

declare(strict_types=1);

// ---------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------

/**
 * Load simple key=value pairs from .env into $_ENV if file exists
 */
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (str_contains($line, '=')) {
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            $_ENV[$key] = $val;
        }
    }
}

/**
 * Return a shared PDO instance (created once per request).
 * Reads DB_* values from environment variables / .env, defaulting to standard XAMPP setup.
 */
function getPdo(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $host   = $_ENV['DB_HOST']     ?? getenv('DB_HOST')     ?: '127.0.0.1';
        $port   = $_ENV['DB_PORT']     ?? getenv('DB_PORT')     ?: '3306';
        $dbname = $_ENV['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: 'farm_management';
        $user   = $_ENV['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: 'root';
        $pass   = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}

// ---------------------------------------------------------------
// Authentication guards
// ---------------------------------------------------------------

/**
 * Verify the Bearer JWT from the Authorization header.
 * Returns the decoded token payload on success.
 * Calls respond() with 401 and exits on failure.
 *
 * Usage:
 *   $payload = requireAuth();
 *   $userId  = (int) $payload['sub'];
 */
function requireAuth(): array
{
    require_once __DIR__ . '/Modules/security/JwtHelper.php';

    $token = JwtHelper::fromHeader();

    if ($token === null) {
        respond(['success' => false, 'message' => 'No token provided. Add Authorization: Bearer <token>'], 401);
    }

    $payload = JwtHelper::verify($token);

    if ($payload === null) {
        respond(['success' => false, 'message' => 'Token is invalid or has expired.'], 401);
    }

    return $payload;
}

/**
 * Like requireAuth() but also asserts the user has one of the given roles.
 *
 * @param string[] $roles  e.g. ['admin', 'farm_owner']
 */
function requireRole(array $roles): array
{
    $payload = requireAuth();

    if (!in_array($payload['role'] ?? '', $roles, true)) {
        respond(['success' => false, 'message' => 'You do not have permission to perform this action.'], 403);
    }

    return $payload;
}

// ---------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------

function respond(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function farm_module_catalog(): array
{
    return [
        [
            'key' => 'farm_field',
            'label' => 'Farm and Field Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'crop',
            'label' => 'Crop Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'irrigation',
            'label' => 'Irrigation and Water Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'livestock',
            'label' => 'Livestock Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'inventory',
            'label' => 'Farm Inventory and Inputs',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'equipment',
            'label' => 'Farm Equipment and Machinery',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'labour',
            'label' => 'Labour and Employee Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'pest_disease',
            'label' => 'Pest and Disease Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'weather',
            'label' => 'Weather and Environmental Monitoring',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'harvest',
            'label' => 'Harvest Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'sales_market',
            'label' => 'Market and Sales Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'finance',
            'label' => 'Financial Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'suppliers_procurement',
            'label' => 'Supplier and Procurement Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'storage',
            'label' => 'Storage and Post-Harvest Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'analytics',
            'label' => 'Dashboard and Analytics',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'notifications',
            'label' => 'Notifications and Alerts',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'security',
            'label' => 'Security and User Management',
            'status' => 'scaffolded',
        ],
    ];
}

