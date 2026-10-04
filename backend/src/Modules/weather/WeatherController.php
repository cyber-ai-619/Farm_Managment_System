<?php

declare(strict_types=1);

require_once __DIR__ . '/WeatherModel.php';
require_once __DIR__ . '/WeatherApiService.php';
require_once __DIR__ . '/../farm_field/FarmModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * WeatherController
 *
 * REST API handler for /api/weather/* routes
 */
class WeatherController
{
    private WeatherModel     $model;
    private WeatherApiService $apiService;
    private FarmModel        $farmModel;
    private AuditLogger      $audit;

    public function __construct(PDO $pdo)
    {
        $this->model      = new WeatherModel($pdo);
        $this->apiService = new WeatherApiService();
        $this->farmModel  = new FarmModel($pdo);
        $this->audit      = new AuditLogger($pdo);
    }

    public function current(int $farmId): void
    {
        requireAuth();
        $farm = $this->farmModel->findById($farmId);

        $latestDb = $this->model->findLatestByFarm($farmId);

        // If farm has GPS coordinates, fetch live weather from API
        $live = null;
        if ($farm && $farm['latitude'] !== null && $farm['longitude'] !== null) {
            $forecast = $this->apiService->getForecast((float) $farm['latitude'], (float) $farm['longitude']);
            $live = $forecast['current'] ?? null;
        }

        respond([
            'success' => true,
            'farm_id' => $farmId,
            'farm_name' => $farm['name'] ?? null,
            'live_api_current' => $live,
            'latest_logged_observation' => $latestDb,
        ]);
    }

    public function forecast(int $farmId): void
    {
        requireAuth();
        $farm = $this->farmModel->findById($farmId);

        $lat = ($farm && $farm['latitude'] !== null) ? (float) $farm['latitude'] : -26.2041; // Default to realistic regional coords if unset
        $lon = ($farm && $farm['longitude'] !== null) ? (float) $farm['longitude'] : 28.0473;

        $forecast = $this->apiService->getForecast($lat, $lon);
        respond(['success' => true, 'farm_id' => $farmId, 'forecast' => $forecast]);
    }

    public function history(int $farmId): void
    {
        requireAuth();
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 30;
        $history = $this->model->findHistoryByFarm($farmId, $limit);

        respond(['success' => true, 'count' => count($history), 'data' => $history]);
    }

    public function logObservation(int $farmId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'worker']);
        $body = $this->jsonBody();

        if (!isset($body['temperature_c'])) {
            respond(['success' => false, 'message' => 'temperature_c is required.'], 422);
        }

        $id = $this->model->logObservation($farmId, (int) $user['sub'], $body);
        $this->audit->log('weather.observation_logged', (int) $user['sub'], 'weather_observations', $id);

        respond(['success' => true, 'message' => 'Weather observation recorded.', 'id' => $id], 201);
    }

    public function alerts(int $farmId): void
    {
        requireAuth();
        $alerts = $this->model->findActiveAlerts($farmId);
        respond(['success' => true, 'count' => count($alerts), 'data' => $alerts]);
    }

    public function storeAlert(int $farmId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['alert_type']) || empty($body['title']) || empty($body['description'])) {
            respond(['success' => false, 'message' => 'alert_type, title, and description are required.'], 422);
        }

        $id = $this->model->createAlert($farmId, (int) $user['sub'], $body);
        $this->audit->log('weather.alert_created', (int) $user['sub'], 'weather_alerts', $id);

        respond(['success' => true, 'message' => 'Weather alert created.', 'id' => $id], 201);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
