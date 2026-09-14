<?php
// backend/src/Modules/farm_field/FarmController.php

require_once __DIR__ . '/FarmModel.php';

class FarmController
{
    private FarmModel $model;

    public function __construct(PDO $pdo)
    {
        $this->model = new FarmModel($pdo);
    }

    // -------------------------------------------------------------------------
    // GET /api/farms
    // Admins see all farms; farm_owners see only their own.
    // -------------------------------------------------------------------------
    public function index(): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'accountant']);

        $ownerId = in_array($user['role'], ['admin']) ? null : (int) $user['sub'];
        $farms   = $this->model->getAll($ownerId);

        respond(['success' => true, 'data' => $farms]);
    }

    // -------------------------------------------------------------------------
    // POST /api/farms
    // Only admin and farm_owner may create farms.
    // -------------------------------------------------------------------------
    public function store(): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Farm name is required.'], 422);
        }

        // farm_owner always owns the farm they create; admin can specify owner_id
        $ownerId = ($user['role'] === 'admin' && !empty($body['owner_id']))
            ? (int) $body['owner_id']
            : (int) $user['sub'];

        $id = $this->model->create([
            'owner_id'      => $ownerId,
            'name'          => trim($body['name']),
            'location'      => $body['location']      ?? null,
            'latitude'      => $body['latitude']      ?? null,
            'longitude'     => $body['longitude']     ?? null,
            'total_area_ha' => $body['total_area_ha'] ?? null,
            'description'   => $body['description']   ?? null,
        ]);

        $farm = $this->model->getById($id);
        respond(['success' => true, 'message' => 'Farm created.', 'data' => $farm], 201);
    }

    // -------------------------------------------------------------------------
    // GET /api/farms/{id}
    // -------------------------------------------------------------------------
    public function show(int $id): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'accountant']);

        $farm = $this->model->getById($id);
        if (!$farm) {
            respond(['success' => false, 'message' => 'Farm not found.'], 404);
        }

        // Non-admins must own the farm
        if ($user['role'] !== 'admin' && (int) $farm['owner_id'] !== (int) $user['sub']) {
            respond(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        respond(['success' => true, 'data' => $farm]);
    }

    // -------------------------------------------------------------------------
    // PUT /api/farms/{id}
    // -------------------------------------------------------------------------
    public function update(int $id): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        $farm = $this->model->getById($id);
        if (!$farm) {
            respond(['success' => false, 'message' => 'Farm not found.'], 404);
        }

        if ($user['role'] !== 'admin' && (int) $farm['owner_id'] !== (int) $user['sub']) {
            respond(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Farm name is required.'], 422);
        }

        $this->model->update($id, [
            'name'          => trim($body['name']),
            'location'      => $body['location']      ?? $farm['location'],
            'latitude'      => $body['latitude']      ?? $farm['latitude'],
            'longitude'     => $body['longitude']     ?? $farm['longitude'],
            'total_area_ha' => $body['total_area_ha'] ?? $farm['total_area_ha'],
            'description'   => $body['description']   ?? $farm['description'],
            'is_active'     => $body['is_active']     ?? $farm['is_active'],
        ]);

        respond(['success' => true, 'message' => 'Farm updated.', 'data' => $this->model->getById($id)]);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/farms/{id}
    // -------------------------------------------------------------------------
    public function destroy(int $id): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner']);

        $farm = $this->model->getById($id);
        if (!$farm) {
            respond(['success' => false, 'message' => 'Farm not found.'], 404);
        }

        if ($user['role'] !== 'admin' && (int) $farm['owner_id'] !== (int) $user['sub']) {
            respond(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $this->model->delete($id);
        respond(['success' => true, 'message' => 'Farm deleted.']);
    }
}
