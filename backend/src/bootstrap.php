<?php

declare(strict_types=1);

// Prevent PHP from emitting HTML error tags (<br /><b>Fatal error...) into JSON responses
ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);

set_exception_handler(function (\Throwable $e): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }

    $status = 500;
    $message = $e->getMessage() ?: 'An unexpected server error occurred.';

    if ($e instanceof \PDOException) {
        $status = 400;
        // Provide a clear, actionable message while preserving technical debug details
        $message = 'Database operation error: ' . $e->getMessage();
    }

    respond([
        'success'    => false,
        'message'    => $message,
        'error_code' => $e instanceof \PDOException ? 'DATABASE_QUERY_ERROR' : 'SERVER_ERROR',
        'debug'      => [
            'type'    => get_class($e),
            'message' => $e->getMessage(),
            'file'    => basename($e->getFile()),
            'line'    => $e->getLine(),
        ],
    ], $status);
});

register_shutdown_function(function (): void {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            http_response_code(500);
        }
        echo json_encode([
            'success'    => false,
            'message'    => 'Fatal server error: ' . $error['message'],
            'error_code' => 'FATAL_ERROR',
            'debug'      => [
                'file' => basename($error['file']),
                'line' => $error['line'],
            ],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
});

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

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => true,
        ];

        $dbSsl = $_ENV['DB_SSL'] ?? getenv('DB_SSL');
        if ($dbSsl === 'true' || $dbSsl === '1') {
            $customCa = $_ENV['DB_SSL_CA'] ?? getenv('DB_SSL_CA');
            if (!empty($customCa) && file_exists($customCa)) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $customCa;
            } elseif (file_exists('/etc/ssl/certs/ca-certificates.crt')) {
                // Debian/Ubuntu default CA bundle installed in Docker container
                $options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/ssl/certs/ca-certificates.crt';
            }
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        try {
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            respond([
                'success'    => false,
                'message'    => 'Database connection failed. Please verify database service status and credentials.',
                'error_code' => 'DATABASE_UNAVAILABLE',
                'debug'      => [
                    'error'    => $e->getMessage(),
                    'host'     => $host,
                    'port'     => $port,
                    'database' => $dbname,
                ],
            ], 503);
        }
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

/**
 * Resolve a valid farm_id for the current request.
 * If $requestedFarmId is provided and exists in `farms`, returns it.
 * Otherwise resolves the authenticated user's primary farm, or the first farm in the database.
 */
function resolveFarmId($requestedFarmId = null): int
{
    $pdo = getPdo();
    $candidate = (int) ($requestedFarmId ?? ($_GET['farm_id'] ?? 0));

    if ($candidate > 0) {
        $stmt = $pdo->prepare('SELECT id FROM farms WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $candidate]);
        if ($stmt->fetchColumn()) {
            return $candidate;
        }
    }

    require_once __DIR__ . '/Modules/security/JwtHelper.php';
    $token = JwtHelper::fromHeader();
    if ($token !== null) {
        $payload = JwtHelper::verify($token);
        if ($payload !== null && !empty($payload['sub'])) {
            $userId = (int) $payload['sub'];
            if (!empty($payload['farm_id'])) {
                $jwtFarmId = (int) $payload['farm_id'];
                $stmt = $pdo->prepare('SELECT id FROM farms WHERE id = :id LIMIT 1');
                $stmt->execute([':id' => $jwtFarmId]);
                if ($stmt->fetchColumn()) {
                    return $jwtFarmId;
                }
            }
            try {
                $stmt = $pdo->prepare(
                    'SELECT f.id FROM farms f
                     LEFT JOIN farm_members fm ON fm.farm_id = f.id AND fm.user_id = :u1 AND fm.status = "active"
                     WHERE f.owner_id = :u2 OR fm.user_id = :u3
                     ORDER BY f.id ASC LIMIT 1'
                );
                $stmt->execute([':u1' => $userId, ':u2' => $userId, ':u3' => $userId]);
                $userFarmId = $stmt->fetchColumn();
                if ($userFarmId) {
                    return (int) $userFarmId;
                }
            } catch (\Throwable) {
                $stmt = $pdo->prepare('SELECT id FROM farms WHERE owner_id = :u1 ORDER BY id ASC LIMIT 1');
                $stmt->execute([':u1' => $userId]);
                $userFarmId = $stmt->fetchColumn();
                if ($userFarmId) {
                    return (int) $userFarmId;
                }
            }
        }
    }

    $first = $pdo->query('SELECT id FROM farms ORDER BY id ASC LIMIT 1')->fetchColumn();
    return $first ? (int) $first : 1;
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

