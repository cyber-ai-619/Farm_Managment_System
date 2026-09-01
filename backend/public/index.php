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

$requestUri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---------------------------------------------------------------
// Root + utility routes
// ---------------------------------------------------------------

if ($requestUri === '/' || $requestUri === '') {
    respond([
        'success' => true,
        'message' => 'Farm Management System API',
        'endpoints' => [
            'GET  /api/health',
            'GET  /api/modules',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET  /api/auth/me',
            'POST /api/auth/logout',
        ],
    ]);
}

if ($requestUri === '/api/health' && $requestMethod === 'GET') {
    respond([
        'success'   => true,
        'status'    => 'ok',
        'timestamp' => date(DATE_ATOM),
    ]);
}

if ($requestUri === '/api/modules' && $requestMethod === 'GET') {
    $modules = farm_module_catalog();
    respond([
        'success' => true,
        'count'   => count($modules),
        'modules' => $modules,
    ]);
}

// ---------------------------------------------------------------
// Auth routes  (Phase 1 — Security & User Management)
// ---------------------------------------------------------------

require_once __DIR__ . '/../src/Modules/security/AuthController.php';

if ($requestUri === '/api/auth/register' && $requestMethod === 'POST') {
    $ctrl = new AuthController(getPdo());
    $ctrl->register();
}

if ($requestUri === '/api/auth/login' && $requestMethod === 'POST') {
    $ctrl = new AuthController(getPdo());
    $ctrl->login();
}

if ($requestUri === '/api/auth/me' && $requestMethod === 'GET') {
    $ctrl = new AuthController(getPdo());
    $ctrl->me();
}

if ($requestUri === '/api/auth/logout' && $requestMethod === 'POST') {
    $ctrl = new AuthController(getPdo());
    $ctrl->logout();
}

// ---------------------------------------------------------------
// 404 fallback — keep at the very bottom
// ---------------------------------------------------------------

http_response_code(404);
respond([
    'success' => false,
    'message' => 'Route not found',
    'path'    => $requestUri,
]);


