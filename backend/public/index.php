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
$pdo           = getPdo();

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


// PHASE 2 ROUTES
// =============================================================================
// MODULE 2 — FARM & FIELD MANAGEMENT
// =============================================================================

// --- Farms ---

if ($requestUri === '/api/farms' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    (new FarmController($pdo))->index();
}

if ($requestUri === '/api/farms' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    (new FarmController($pdo))->store();
}

if (preg_match('#^/api/farms/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/farm_field/FarmController.php';
    $ctrl = new FarmController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}

// --- Fields under a farm ---

if (preg_match('#^/api/farms/(\d+)/fields$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/farm_field/FieldController.php';
    $ctrl   = new FieldController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexByFarm($farmId);
    if ($requestMethod === 'POST') $ctrl->storeUnderFarm($farmId);
}

// --- Individual field ---

if (preg_match('#^/api/fields/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/farm_field/FieldController.php';
    $ctrl = new FieldController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}

// --- Plots under a field ---

if (preg_match('#^/api/fields/(\d+)/plots$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/farm_field/FieldController.php';
    $ctrl    = new FieldController($pdo);
    $fieldId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexPlots($fieldId);
    if ($requestMethod === 'POST') $ctrl->storePlot($fieldId);
}

// =============================================================================
// MODULE 3 — CROP MANAGEMENT
// =============================================================================

if ($requestUri === '/api/crops' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    (new CropController($pdo))->index();
}

if ($requestUri === '/api/crops' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    (new CropController($pdo))->store();
}

if (preg_match('#^/api/crops/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    $ctrl = new CropController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}

if (preg_match('#^/api/crops/(\d+)/varieties$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    $ctrl   = new CropController($pdo);
    $cropId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->varieties($cropId);
    if ($requestMethod === 'POST') $ctrl->storeVariety($cropId);
}

if (preg_match('#^/api/crops/(\d+)/plantings$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    $ctrl   = new CropController($pdo);
    $cropId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->plantings($cropId);
    if ($requestMethod === 'POST') $ctrl->storePlanting($cropId);
}

if (preg_match('#^/api/crops/(\d+)/fertilizer-records$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/crop/CropController.php';
    $ctrl   = new CropController($pdo);
    $cropId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->fertilizerRecords($cropId);
    if ($requestMethod === 'POST') $ctrl->storeFertilizerRecord($cropId);
}

// =============================================================================
// MODULE 4 — LIVESTOCK MANAGEMENT
// =============================================================================

if ($requestUri === '/api/livestock/breeds' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    (new LivestockController($pdo))->breeds();
}

if ($requestUri === '/api/livestock/breeds' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    (new LivestockController($pdo))->storeBreed();
}

if ($requestUri === '/api/livestock' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    (new LivestockController($pdo))->index();
}

if ($requestUri === '/api/livestock' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    (new LivestockController($pdo))->store();
}

if (preg_match('#^/api/livestock/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    $ctrl = new LivestockController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}

if (preg_match('#^/api/livestock/(\d+)/vaccinations$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    $ctrl = new LivestockController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->vaccinations($id);
    if ($requestMethod === 'POST') $ctrl->storeVaccination($id);
}

if (preg_match('#^/api/livestock/(\d+)/treatments$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    $ctrl = new LivestockController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->treatments($id);
    if ($requestMethod === 'POST') $ctrl->storeTreatment($id);
}

if (preg_match('#^/api/livestock/(\d+)/feed-records$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/livestock/LivestockController.php';
    $ctrl = new LivestockController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->feedRecords($id);
    if ($requestMethod === 'POST') $ctrl->storeFeedRecord($id);
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


