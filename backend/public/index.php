<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$modules = farm_module_catalog();

if ($requestUri === '/' || $requestUri === '') {
    respond([
        'success' => true,
        'message' => 'Farm Management System API scaffold',
        'endpoints' => [
            '/api/health',
            '/api/modules',
        ],
    ]);
}

if ($requestUri === '/api/health' && $requestMethod === 'GET') {
    respond([
        'success' => true,
        'status' => 'ok',
        'timestamp' => date(DATE_ATOM),
    ]);
}

if ($requestUri === '/api/modules' && $requestMethod === 'GET') {
    respond([
        'success' => true,
        'count' => count($modules),
        'modules' => $modules,
    ]);
}

http_response_code(404);
respond([
    'success' => false,
    'message' => 'Route not found',
    'path' => $requestUri,
]);

