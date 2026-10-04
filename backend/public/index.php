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


// =============================================================================
// PHASE 3 — OPERATIONS
// =============================================================================

// -----------------------------------------------------------------------------
// MODULE 5 — IRRIGATION & WATER MANAGEMENT
// -----------------------------------------------------------------------------

if (preg_match('#^/api/farms/(\d+)/irrigation-sources$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl   = new IrrigationController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexSources($farmId);
    if ($requestMethod === 'POST') $ctrl->storeSource($farmId);
}

if (preg_match('#^/api/farms/(\d+)/irrigation-systems$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl   = new IrrigationController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexSystems($farmId);
    if ($requestMethod === 'POST') $ctrl->storeSystem($farmId);
}

if (preg_match('#^/api/irrigation/systems/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl = new IrrigationController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->showSystem($id);
    if ($requestMethod === 'PUT')    $ctrl->updateSystem($id);
    if ($requestMethod === 'DELETE') $ctrl->destroySystem($id);
}

if (preg_match('#^/api/irrigation/systems/(\d+)/schedules$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl     = new IrrigationController($pdo);
    $systemId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->schedules($systemId);
    if ($requestMethod === 'POST') $ctrl->storeSchedule($systemId);
}

if (preg_match('#^/api/irrigation/systems/(\d+)/consumption$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl     = new IrrigationController($pdo);
    $systemId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->consumption($systemId);
    if ($requestMethod === 'POST') $ctrl->logConsumption($systemId);
}

if (preg_match('#^/api/irrigation/recommendations/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/irrigation/IrrigationController.php';
    $ctrl    = new IrrigationController($pdo);
    $fieldId = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->recommendations($fieldId);
}

// -----------------------------------------------------------------------------
// MODULE 6 — FARM INVENTORY & INPUTS
// -----------------------------------------------------------------------------

if ($requestUri === '/api/inventory/low-stock' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    (new InventoryController($pdo))->lowStock();
}

if ($requestUri === '/api/inventory' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    (new InventoryController($pdo))->index();
}

if ($requestUri === '/api/inventory' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    (new InventoryController($pdo))->store();
}

if (preg_match('#^/api/inventory/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    $ctrl = new InventoryController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->show($id);
    if ($requestMethod === 'PUT') $ctrl->update($id);
}

if (preg_match('#^/api/inventory/(\d+)/stock-in$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    $ctrl = new InventoryController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'POST') $ctrl->stockIn($id);
}

if (preg_match('#^/api/inventory/(\d+)/stock-out$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/inventory/InventoryController.php';
    $ctrl = new InventoryController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'POST') $ctrl->stockOut($id);
}

// -----------------------------------------------------------------------------
// MODULE 7 — FARM EQUIPMENT & MACHINERY
// -----------------------------------------------------------------------------

if ($requestUri === '/api/equipment' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    (new EquipmentController($pdo))->index();
}

if ($requestUri === '/api/equipment' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    (new EquipmentController($pdo))->store();
}

if (preg_match('#^/api/equipment/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    $ctrl = new EquipmentController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')    $ctrl->show($id);
    if ($requestMethod === 'PUT')    $ctrl->update($id);
    if ($requestMethod === 'DELETE') $ctrl->destroy($id);
}

if (preg_match('#^/api/equipment/(\d+)/maintenance$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    $ctrl = new EquipmentController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->maintenance($id);
    if ($requestMethod === 'POST') $ctrl->storeMaintenance($id);
}

if (preg_match('#^/api/equipment/(\d+)/repairs$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    $ctrl = new EquipmentController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->repairs($id);
    if ($requestMethod === 'POST') $ctrl->storeRepair($id);
}

if (preg_match('#^/api/equipment/(\d+)/fuel-log$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/equipment/EquipmentController.php';
    $ctrl = new EquipmentController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->fuelLogs($id);
    if ($requestMethod === 'POST') $ctrl->storeFuelLog($id);
}

// -----------------------------------------------------------------------------
// MODULE 8 — LABOUR & EMPLOYEE MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/workers' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    (new LabourController($pdo))->indexWorkers();
}

if ($requestUri === '/api/workers' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    (new LabourController($pdo))->storeWorker();
}

if (preg_match('#^/api/workers/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    $ctrl = new LabourController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showWorker($id);
    if ($requestMethod === 'PUT') $ctrl->updateWorker($id);
}

if ($requestUri === '/api/labour/attendance' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    (new LabourController($pdo))->indexAttendance();
}

if (preg_match('#^/api/workers/(\d+)/attendance$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    $ctrl = new LabourController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'POST') $ctrl->storeAttendance($id);
}

if ($requestUri === '/api/labour/tasks' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    (new LabourController($pdo))->indexTasks();
}

if ($requestUri === '/api/labour/tasks' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    (new LabourController($pdo))->storeTask();
}

if (preg_match('#^/api/labour/tasks/(\d+)/status$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/labour/LabourController.php';
    $ctrl = new LabourController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PATCH' || $requestMethod === 'PUT') $ctrl->updateTaskStatus($id);
}

// -----------------------------------------------------------------------------
// MODULE 9 — PEST & DISEASE MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/pests' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    (new PestDiseaseController($pdo))->indexPests();
}

if ($requestUri === '/api/pests' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    (new PestDiseaseController($pdo))->storePest();
}

if ($requestUri === '/api/scouting' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    (new PestDiseaseController($pdo))->indexScouting();
}

if ($requestUri === '/api/scouting' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    (new PestDiseaseController($pdo))->storeScouting();
}

if ($requestUri === '/api/pest-disease/outbreaks' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    (new PestDiseaseController($pdo))->outbreaks();
}

if (preg_match('#^/api/fields/(\d+)/treatments$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    $ctrl    = new PestDiseaseController($pdo);
    $fieldId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexTreatments($fieldId);
    if ($requestMethod === 'POST') $ctrl->storeTreatment($fieldId);
}

if (preg_match('#^/api/treatments/(\d+)/effectiveness$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/pest_disease/PestDiseaseController.php';
    $ctrl = new PestDiseaseController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PATCH' || $requestMethod === 'PUT') $ctrl->updateEffectiveness($id);
}

// -----------------------------------------------------------------------------
// MODULE 10 — WEATHER & ENVIRONMENTAL MONITORING
// -----------------------------------------------------------------------------

if (preg_match('#^/api/weather/current/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/weather/WeatherController.php';
    $ctrl   = new WeatherController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->current($farmId);
}

if (preg_match('#^/api/weather/forecast/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/weather/WeatherController.php';
    $ctrl   = new WeatherController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->forecast($farmId);
}

if (preg_match('#^/api/weather/history/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/weather/WeatherController.php';
    $ctrl   = new WeatherController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->history($farmId);
}

if (preg_match('#^/api/weather/observe/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/weather/WeatherController.php';
    $ctrl   = new WeatherController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'POST') $ctrl->logObservation($farmId);
}

if (preg_match('#^/api/weather/alerts/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/weather/WeatherController.php';
    $ctrl   = new WeatherController($pdo);
    $farmId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->alerts($farmId);
    if ($requestMethod === 'POST') $ctrl->storeAlert($farmId);
}

// -----------------------------------------------------------------------------
// MODULE 11 — HARVEST MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/harvest' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/harvest/HarvestController.php';
    (new HarvestController($pdo))->index();
}

if ($requestUri === '/api/harvest' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/harvest/HarvestController.php';
    (new HarvestController($pdo))->store();
}

if ($requestUri === '/api/harvest/summary' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/harvest/HarvestController.php';
    (new HarvestController($pdo))->summary();
}

if (preg_match('#^/api/harvest/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/harvest/HarvestController.php';
    $ctrl = new HarvestController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->show($id);
    if ($requestMethod === 'PUT') $ctrl->update($id);
}

if (preg_match('#^/api/harvest/field/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/harvest/HarvestController.php';
    $ctrl    = new HarvestController($pdo);
    $fieldId = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->indexByField($fieldId);
}

// -----------------------------------------------------------------------------
// MODULE 12 — MARKET & SALES MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/customers' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->indexCustomers();
}

if ($requestUri === '/api/customers' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->storeCustomer();
}

if (preg_match('#^/api/customers/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    $ctrl = new SalesMarketController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showCustomer($id);
    if ($requestMethod === 'PUT') $ctrl->updateCustomer($id);
}

if ($requestUri === '/api/sales-orders' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->indexOrders();
}

if ($requestUri === '/api/sales-orders' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->storeOrder();
}

if (preg_match('#^/api/sales-orders/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    $ctrl = new SalesMarketController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showOrder($id);
    if ($requestMethod === 'PUT' || $requestMethod === 'PATCH') $ctrl->updateOrderStatus($id);
}

if ($requestUri === '/api/invoices' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->indexInvoices();
}

if (preg_match('#^/api/invoices/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    $ctrl = new SalesMarketController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showInvoice($id);
}

if ($requestUri === '/api/payments' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->storePayment();
}

if ($requestUri === '/api/market-prices' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->indexPrices();
}

if ($requestUri === '/api/market-prices' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->storePrice();
}

if ($requestUri === '/api/market-prices/trends' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/sales_market/SalesMarketController.php';
    (new SalesMarketController($pdo))->trends();
}

// -----------------------------------------------------------------------------
// MODULE 13 — FINANCIAL MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/finance/income' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->indexIncome();
}

if ($requestUri === '/api/finance/income' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->storeIncome();
}

if ($requestUri === '/api/finance/expenses' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->indexExpenses();
}

if ($requestUri === '/api/finance/expenses' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->storeExpense();
}

if ($requestUri === '/api/finance/profit-loss' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->profitLoss();
}

if ($requestUri === '/api/finance/loans' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->indexLoans();
}

if ($requestUri === '/api/finance/loans' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->storeLoan();
}

if (preg_match('#^/api/finance/loans/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    $ctrl = new FinanceController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PUT' || $requestMethod === 'PATCH') $ctrl->updateLoan($id);
}

if ($requestUri === '/api/finance/budgets' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->indexBudgets();
}

if ($requestUri === '/api/finance/budgets' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    (new FinanceController($pdo))->storeBudget();
}

if (preg_match('#^/api/finance/budgets/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/finance/FinanceController.php';
    $ctrl = new FinanceController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PUT' || $requestMethod === 'PATCH') $ctrl->updateBudget($id);
}

// -----------------------------------------------------------------------------
// MODULE 14 — SUPPLIER & PROCUREMENT MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/suppliers' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    (new SuppliersProcurementController($pdo))->indexSuppliers();
}

if ($requestUri === '/api/suppliers' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    (new SuppliersProcurementController($pdo))->storeSupplier();
}

if (preg_match('#^/api/suppliers/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    $ctrl = new SuppliersProcurementController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showSupplier($id);
    if ($requestMethod === 'PUT') $ctrl->updateSupplier($id);
}

if (preg_match('#^/api/suppliers/(\d+)/quotations$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    $ctrl       = new SuppliersProcurementController($pdo);
    $supplierId = (int) $m[1];
    if ($requestMethod === 'GET')  $ctrl->indexQuotations($supplierId);
    if ($requestMethod === 'POST') $ctrl->storeQuotation($supplierId);
}

if ($requestUri === '/api/purchase-orders' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    (new SuppliersProcurementController($pdo))->indexOrders();
}

if ($requestUri === '/api/purchase-orders' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    (new SuppliersProcurementController($pdo))->storeOrder();
}

if (preg_match('#^/api/purchase-orders/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/suppliers_procurement/SuppliersProcurementController.php';
    $ctrl = new SuppliersProcurementController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showOrder($id);
    if ($requestMethod === 'PUT' || $requestMethod === 'PATCH') $ctrl->updateStatus($id);
}

// -----------------------------------------------------------------------------
// MODULE 15 — STORAGE & POST-HARVEST MANAGEMENT
// -----------------------------------------------------------------------------

if ($requestUri === '/api/warehouses' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->indexWarehouses();
}

if ($requestUri === '/api/warehouses' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->storeWarehouse();
}

if (preg_match('#^/api/warehouses/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    $ctrl = new StorageController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showWarehouse($id);
    if ($requestMethod === 'PUT') $ctrl->updateWarehouse($id);
}

if ($requestUri === '/api/storage/batches' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->indexBatches();
}

if ($requestUri === '/api/storage/batches' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->storeBatch();
}

if (preg_match('#^/api/storage/batches/(\d+)$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    $ctrl = new StorageController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'GET') $ctrl->showBatch($id);
}

if ($requestUri === '/api/storage/valuation' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->valuation();
}

if ($requestUri === '/api/storage/spoilage' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->storeSpoilage();
}

if ($requestUri === '/api/storage/dispatches' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->indexDispatches();
}

if ($requestUri === '/api/storage/dispatches' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/storage/StorageController.php';
    (new StorageController($pdo))->storeDispatch();
}

// -----------------------------------------------------------------------------
// MODULE 16 — DASHBOARD & ANALYTICS
// -----------------------------------------------------------------------------

if ($requestUri === '/api/dashboard' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/AnalyticsController.php';
    (new AnalyticsController($pdo))->dashboard();
}

if ($requestUri === '/api/analytics/yield' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/AnalyticsController.php';
    (new AnalyticsController($pdo))->yieldAnalytics();
}

if ($requestUri === '/api/analytics/finance' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/AnalyticsController.php';
    (new AnalyticsController($pdo))->financeAnalytics();
}

if ($requestUri === '/api/analytics/weather-vs-yield' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/AnalyticsController.php';
    (new AnalyticsController($pdo))->weatherVsYield();
}

// -----------------------------------------------------------------------------
// MODULE 17 — NOTIFICATIONS & SYSTEM ALERTS
// -----------------------------------------------------------------------------

if ($requestUri === '/api/alerts' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    (new NotificationController($pdo))->index();
}

if ($requestUri === '/api/alerts' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    (new NotificationController($pdo))->store();
}

if ($requestUri === '/api/alerts/history' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    (new NotificationController($pdo))->history();
}

if ($requestUri === '/api/alerts/scan' && $requestMethod === 'POST') {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    (new NotificationController($pdo))->runScan();
}

if (preg_match('#^/api/alerts/(\d+)/dismiss$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    $ctrl = new NotificationController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PATCH' || $requestMethod === 'POST' || $requestMethod === 'PUT') {
        $ctrl->dismiss($id);
    }
}

if (preg_match('#^/api/alerts/(\d+)/read$#', $requestUri, $m)) {
    require_once __DIR__ . '/../src/Modules/notifications/NotificationController.php';
    $ctrl = new NotificationController($pdo);
    $id   = (int) $m[1];
    if ($requestMethod === 'PATCH' || $requestMethod === 'POST' || $requestMethod === 'PUT') {
        $ctrl->markRead($id);
    }
}

// -----------------------------------------------------------------------------
// MODULE 18 — REPORTS & BUSINESS INTELLIGENCE
// -----------------------------------------------------------------------------

if ($requestUri === '/api/reports/crop-production' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->cropProduction();
}

if ($requestUri === '/api/reports/yield' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->yieldReport();
}

if ($requestUri === '/api/reports/livestock' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->livestock();
}

if ($requestUri === '/api/reports/financial' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->financial();
}

if ($requestUri === '/api/reports/expenses' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->expenses();
}

if ($requestUri === '/api/reports/sales' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->sales();
}

if ($requestUri === '/api/reports/inventory' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->inventory();
}

if ($requestUri === '/api/reports/labour' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->labour();
}

if ($requestUri === '/api/reports/irrigation' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->irrigation();
}

if ($requestUri === '/api/reports/pest-disease' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->pestDisease();
}

if ($requestUri === '/api/reports/equipment' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->equipment();
}

if ($requestUri === '/api/reports/profitability' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->profitability();
}

if ($requestUri === '/api/reports/farm-performance' && $requestMethod === 'GET') {
    require_once __DIR__ . '/../src/Modules/analytics/ReportController.php';
    (new ReportController($pdo))->farmPerformance();
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




