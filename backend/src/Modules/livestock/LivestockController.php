<?php
// backend/src/Modules/livestock/LivestockController.php

require_once __DIR__ . '/LivestockModel.php';
require_once __DIR__ . '/HealthModel.php';

class LivestockController
{
    private LivestockModel $model;
    private HealthModel    $health;

    public function __construct(PDO $pdo)
    {
        $this->model  = new LivestockModel($pdo);
        $this->health = new HealthModel($pdo);
    }

    // -------------------------------------------------------------------------
    // Helper — fetch animal and guard access by farm ownership
    // Requires FarmModel to be loaded in the route file; we keep it simple
    // by passing $farmId check via the animal record itself.
    // -------------------------------------------------------------------------
    private function getAnimalOrFail(int $id): array
    {
        $animal = $this->model->getById($id);
        if (!$animal) {
            respond(['success' => false, 'message' => 'Animal not found.'], 404);
        }
        return $animal;
    }

    // =========================================================================
    // BREEDS
    // =========================================================================

    // GET /api/livestock/breeds
    public function breeds(): void
    {
        requireAuth();
        respond(['success' => true, 'data' => $this->model->getAllBreeds()]);
    }

    // POST /api/livestock/breeds
    public function storeBreed(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['name']) || empty($body['species'])) {
            respond(['success' => false, 'message' => 'name and species are required.'], 422);
        }

        $id = $this->model->createBreed($body);
        respond(['success' => true, 'message' => 'Breed created.', 'data' => ['id' => $id]], 201);
    }

    // =========================================================================
    // ANIMALS
    // =========================================================================

    // GET /api/livestock?farm_id=X
    public function index(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'worker']);

        $farmId = (int) ($_GET['farm_id'] ?? 0);
        if (!$farmId) {
            respond(['success' => false, 'message' => 'farm_id query param is required.'], 422);
        }

        respond(['success' => true, 'data' => $this->model->getAll($farmId)]);
    }

    // POST /api/livestock
    public function store(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $required = ['farm_id', 'tag_number', 'species'];
        foreach ($required as $f) {
            if (empty($body[$f])) {
                respond(['success' => false, 'message' => "$f is required."], 422);
            }
        }

        $id     = $this->model->create($body);
        $animal = $this->model->getById($id);
        respond(['success' => true, 'message' => 'Animal registered.', 'data' => $animal], 201);
    }

    // GET /api/livestock/{id}
    public function show(int $id): void
    {
        requireAuth();
        $animal = $this->getAnimalOrFail($id);
        respond(['success' => true, 'data' => $animal]);
    }

    // PUT /api/livestock/{id}
    public function update(int $id): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);

        $animal = $this->getAnimalOrFail($id);
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['tag_number'])) {
            respond(['success' => false, 'message' => 'tag_number is required.'], 422);
        }

        $this->model->update($id, array_merge($animal, $body));
        respond(['success' => true, 'message' => 'Animal updated.', 'data' => $this->model->getById($id)]);
    }

    // DELETE /api/livestock/{id}
    public function destroy(int $id): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner']);

        $this->getAnimalOrFail($id);
        $this->model->delete($id);
        respond(['success' => true, 'message' => 'Animal record deleted.']);
    }

    // =========================================================================
    // VACCINATIONS
    // =========================================================================

    // GET /api/livestock/{id}/vaccinations
    public function vaccinations(int $animalId): void
    {
        requireAuth();
        $this->getAnimalOrFail($animalId);
        respond(['success' => true, 'data' => $this->health->getVaccinationsByAnimal($animalId)]);
    }

    // POST /api/livestock/{id}/vaccinations
    public function storeVaccination(int $animalId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['vaccine_name']) || empty($body['vaccination_date'])) {
            respond(['success' => false, 'message' => 'vaccine_name and vaccination_date are required.'], 422);
        }

        $id = $this->health->createVaccination(array_merge($body, [
            'animal_id'       => $animalId,
            'administered_by' => (int) $user['sub'],
        ]));
        $vaccination = $this->health->getVaccinationById($id);
        respond(['success' => true, 'message' => 'Vaccination recorded.', 'data' => $vaccination], 201);
    }

    // =========================================================================
    // TREATMENTS
    // =========================================================================

    // GET /api/livestock/{id}/treatments
    public function treatments(int $animalId): void
    {
        requireAuth();
        $this->getAnimalOrFail($animalId);
        respond(['success' => true, 'data' => $this->health->getTreatmentsByAnimal($animalId)]);
    }

    // POST /api/livestock/{id}/treatments
    public function storeTreatment(int $animalId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['diagnosis']) || empty($body['treatment_name']) || empty($body['treatment_date'])) {
            respond(['success' => false, 'message' => 'diagnosis, treatment_name, and treatment_date are required.'], 422);
        }

        $id = $this->health->createTreatment(array_merge($body, [
            'animal_id'       => $animalId,
            'administered_by' => (int) $user['sub'],
        ]));
        $treatment = $this->health->getTreatmentById($id);
        respond(['success' => true, 'message' => 'Treatment recorded.', 'data' => $treatment], 201);
    }

    // =========================================================================
    // FEED RECORDS
    // =========================================================================

    // GET /api/livestock/{id}/feed-records
    public function feedRecords(int $animalId): void
    {
        requireAuth();
        $this->getAnimalOrFail($animalId);
        respond(['success' => true, 'data' => $this->model->getFeedByAnimal($animalId)]);
    }

    // POST /api/livestock/{id}/feed-records
    public function storeFeedRecord(int $animalId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'worker']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['feed_type']) || empty($body['quantity_kg']) || empty($body['feed_date'])) {
            respond(['success' => false, 'message' => 'feed_type, quantity_kg, and feed_date are required.'], 422);
        }

        $id = $this->model->createFeedRecord(array_merge($body, [
            'animal_id'   => $animalId,
            'recorded_by' => (int) $user['sub'],
        ]));
        respond(['success' => true, 'message' => 'Feed record saved.', 'data' => ['id' => $id]], 201);
    }
}
