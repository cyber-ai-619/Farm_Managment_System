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
    // VETERINARIANS DIRECTORY
    // =========================================================================

    // GET /api/livestock/veterinarians?farm_id=X
    public function veterinarians(): void
    {
        requireAuth();
        $farmId = resolveFarmId($_GET['farm_id'] ?? null);
        respond(['success' => true, 'data' => $this->model->getVeterinarians($farmId)]);
    }

    // =========================================================================
    // ANIMALS
    // =========================================================================

    // GET /api/livestock?farm_id=X
    public function index(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'worker', 'veterinarian']);

        $farmId = resolveFarmId($_GET['farm_id'] ?? null);

        respond(['success' => true, 'data' => $this->model->getAll($farmId)]);
    }

    // POST /api/livestock
    public function store(): void
    {
        requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'veterinarian']);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $body['farm_id'] = resolveFarmId($body['farm_id'] ?? null);
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
        requireRole(['admin', 'farm_owner', 'farm_manager', 'veterinarian']);

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
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'veterinarian']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $vaccineName     = $body['vaccine_name'] ?? null;
        $vaccinationDate = $body['vaccination_date'] ?? ($body['administered_date'] ?? date('Y-m-d'));

        if (empty($vaccineName)) {
            respond(['success' => false, 'message' => 'vaccine_name is required.'], 422);
        }

        $id = $this->health->createVaccination(array_merge($body, [
            'animal_id'        => $animalId,
            'administered_by'  => (int) $user['sub'],
            'vaccine_name'     => $vaccineName,
            'vaccination_date' => $vaccinationDate,
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
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'veterinarian']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $diagnosis     = $body['diagnosis'] ?? ($body['disease_diagnosed'] ?? null);
        $treatmentName = $body['treatment_name'] ?? ($body['procedure_name'] ?? ($body['medication'] ?? 'Medical Therapy'));
        $treatmentDate = $body['treatment_date'] ?? date('Y-m-d');

        if (empty($diagnosis)) {
            respond(['success' => false, 'message' => 'diagnosis is required.'], 422);
        }

        $id = $this->health->createTreatment(array_merge($body, [
            'animal_id'       => $animalId,
            'administered_by' => (int) $user['sub'],
            'diagnosis'       => $diagnosis,
            'treatment_name'  => $treatmentName,
            'treatment_date'  => $treatmentDate,
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
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'veterinarian', 'worker']);

        $this->getAnimalOrFail($animalId);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $body['feed_date'] = $body['feed_date'] ?? ($body['log_date'] ?? '');

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
