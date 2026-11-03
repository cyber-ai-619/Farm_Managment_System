<?php
// backend/src/Modules/crop/CropController.php

require_once __DIR__ . '/CropModel.php';
require_once __DIR__ . '/PlantingModel.php';

class CropController
{
    private PDO           $pdo;
    private CropModel     $cropModel;
    private PlantingModel $plantingModel;

    public function __construct(PDO $pdo)
    {
        $this->pdo           = $pdo;
        $this->cropModel     = new CropModel($pdo);
        $this->plantingModel = new PlantingModel($pdo);
    }

    // =========================================================================
    // CROPS
    // =========================================================================

    // GET /api/crops
    public function index(): void
    {
        requireAuth();
        respond(['success' => true, 'data' => $this->cropModel->getAll()]);
    }

    // POST /api/crops
    public function store(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Crop name is required.'], 422);
        }

        $id   = $this->cropModel->create($body);
        $crop = $this->cropModel->getById($id);
        respond(['success' => true, 'message' => 'Crop created.', 'data' => $crop], 201);
    }

    // GET /api/crops/{id}
    public function show(int $id): void
    {
        requireAuth();
        $crop = $this->cropModel->getById($id);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }
        $crop['varieties'] = $this->cropModel->getVarietiesByCrop($id);
        respond(['success' => true, 'data' => $crop]);
    }

    // PUT /api/crops/{id}
    public function update(int $id): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $crop = $this->cropModel->getById($id);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Crop name is required.'], 422);
        }

        $this->cropModel->update($id, $body);
        respond(['success' => true, 'message' => 'Crop updated.', 'data' => $this->cropModel->getById($id)]);
    }

    // DELETE /api/crops/{id}
    public function destroy(int $id): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner']);

        $crop = $this->cropModel->getById($id);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }

        $this->cropModel->delete($id);
        respond(['success' => true, 'message' => 'Crop deleted.']);
    }

    // =========================================================================
    // VARIETIES
    // =========================================================================

    // GET /api/crops/{id}/varieties
    public function varieties(int $cropId): void
    {
        requireAuth();
        $crop = $this->cropModel->getById($cropId);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }
        respond(['success' => true, 'data' => $this->cropModel->getVarietiesByCrop($cropId)]);
    }

    // POST /api/crops/{id}/varieties
    public function storeVariety(int $cropId): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $crop = $this->cropModel->getById($cropId);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $body['variety_name'] = $body['variety_name'] ?? ($body['name'] ?? '');
        if (empty($body['variety_name'])) {
            respond(['success' => false, 'message' => 'variety_name is required.'], 422);
        }

        $id      = $this->cropModel->createVariety(array_merge($body, ['crop_id' => $cropId]));
        $variety = $this->cropModel->getVarietyById($id);
        respond(['success' => true, 'message' => 'Variety created.', 'data' => $variety], 201);
    }

    // =========================================================================
    // PLANTING SCHEDULES
    // =========================================================================

    // GET /api/crops/{id}/plantings
    public function plantings(int $cropId): void
    {
        requireAuth();
        respond(['success' => true, 'data' => $this->plantingModel->getAllByCrop($cropId)]);
    }

    // POST /api/crops/{id}/plantings
    public function storePlanting(int $cropId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $crop = $this->cropModel->getById($cropId);
        if (!$crop) {
            respond(['success' => false, 'message' => 'Crop not found.'], 404);
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['field_id']) || empty($body['planting_date'])) {
            respond(['success' => false, 'message' => 'field_id and planting_date are required.'], 422);
        }

        $id       = $this->plantingModel->create(array_merge($body, [
            'crop_id'    => $cropId,
            'planted_by' => (int) $user['sub'],
        ]));
        $planting = $this->plantingModel->getById($id);
        respond(['success' => true, 'message' => 'Planting scheduled.', 'data' => $planting], 201);
    }

    // =========================================================================
    // FERTILIZER RECORDS
    // =========================================================================

    // GET /api/crops/{id}/fertilizer-records  →  optional planting_id query param
    // POST /api/crops/{crop_id}/fertilizer-records
    public function fertilizerRecords(int $cropId): void
    {
        requireAuth();
        $plantingId = (int) ($_GET['planting_id'] ?? 0);
        if ($plantingId > 0) {
            respond(['success' => true, 'data' => $this->plantingModel->getFertilizersByPlanting($plantingId)]);
        } else {
            respond(['success' => true, 'data' => $this->plantingModel->getFertilizersByCrop($cropId)]);
        }
    }

    public function storeFertilizerRecord(int $cropId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['planting_id']) && !empty($body['field_id'])) {
            $fieldId = (int) $body['field_id'];
            $stmt = $this->pdo->prepare(
                'SELECT id FROM planting_schedules WHERE crop_id = :crop_id AND field_id = :field_id ORDER BY planting_date DESC, id DESC LIMIT 1'
            );
            $stmt->execute([':crop_id' => $cropId, ':field_id' => $fieldId]);
            $foundId = $stmt->fetchColumn();

            if (!$foundId) {
                $stmt2 = $this->pdo->prepare(
                    'SELECT id FROM planting_schedules WHERE crop_id = :crop_id ORDER BY planting_date DESC, id DESC LIMIT 1'
                );
                $stmt2->execute([':crop_id' => $cropId]);
                $foundId = $stmt2->fetchColumn();
            }

            if (!$foundId) {
                $foundId = $this->plantingModel->create([
                    'field_id'      => $fieldId,
                    'crop_id'       => $cropId,
                    'planted_by'    => (int) $user['sub'],
                    'planting_date' => date('Y-m-d'),
                    'status'        => 'planted',
                ]);
            }

            $body['planting_id'] = (int) $foundId;
        }

        $required = ['planting_id', 'fertilizer_name', 'quantity_kg', 'application_date'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                respond(['success' => false, 'message' => "$field is required."], 422);
            }
        }

        $id = $this->plantingModel->createFertilizerRecord(array_merge($body, [
            'applied_by' => (int) $user['sub'],
        ]));
        respond(['success' => true, 'message' => 'Fertilizer record saved.', 'data' => ['id' => $id]], 201);
    }
}
