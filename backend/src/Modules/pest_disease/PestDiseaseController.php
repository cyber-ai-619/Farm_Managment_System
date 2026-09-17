<?php

declare(strict_types=1);

require_once __DIR__ . '/PestModel.php';
require_once __DIR__ . '/TreatmentModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * PestDiseaseController
 *
 * REST API handler for /api/pest-disease/*, /api/scouting/*, and /api/treatments/* routes
 */
class PestDiseaseController
{
    private PestModel      $pestModel;
    private TreatmentModel $treatmentModel;
    private AuditLogger    $audit;

    public function __construct(PDO $pdo)
    {
        $this->pestModel      = new PestModel($pdo);
        $this->treatmentModel = new TreatmentModel($pdo);
        $this->audit          = new AuditLogger($pdo);
    }

    public function indexPests(): void
    {
        requireAuth();
        $pests = $this->pestModel->allPests();
        respond(['success' => true, 'count' => count($pests), 'data' => $pests]);
    }

    public function storePest(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'name is required.'], 422);
        }

        $id = $this->pestModel->createPest($body);
        $this->audit->log('pest.catalog_added', (int) $user['sub'], 'pests_diseases', $id);

        respond(['success' => true, 'message' => 'Pest/Disease catalog entry added.', 'id' => $id], 201);
    }

    public function indexScouting(): void
    {
        requireAuth();
        $farmId  = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $fieldId = isset($_GET['field_id']) ? (int) $_GET['field_id'] : null;

        $records = $this->pestModel->findScoutingRecords($farmId, $fieldId);
        respond(['success' => true, 'count' => count($records), 'data' => $records]);
    }

    public function storeScouting(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist', 'worker']);
        $body = $this->jsonBody();

        if (empty($body['farm_id']) || empty($body['field_id'])) {
            respond(['success' => false, 'message' => 'farm_id and field_id are required.'], 422);
        }

        $id = $this->pestModel->createScoutingRecord((int) $body['farm_id'], (int) $user['sub'], $body);
        $this->audit->log('pest.scouting_recorded', (int) $user['sub'], 'scouting_records', $id);

        respond(['success' => true, 'message' => 'Field scouting record logged.', 'id' => $id], 201);
    }

    public function indexTreatments(int $fieldId): void
    {
        requireAuth();
        $treatments = $this->treatmentModel->findByField($fieldId);
        respond(['success' => true, 'count' => count($treatments), 'data' => $treatments]);
    }

    public function storeTreatment(int $fieldId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['chemical_product']) || empty($body['dosage_rate'])) {
            respond(['success' => false, 'message' => 'chemical_product and dosage_rate are required.'], 422);
        }

        $id = $this->treatmentModel->create($fieldId, (int) $user['sub'], $body);
        $this->audit->log('pest.treatment_applied', (int) $user['sub'], 'pest_treatments', $id);

        respond(['success' => true, 'message' => 'Pest treatment application logged.', 'id' => $id], 201);
    }

    public function updateEffectiveness(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $body = $this->jsonBody();

        if (empty($body['effectiveness'])) {
            respond(['success' => false, 'message' => 'effectiveness rating is required.'], 422);
        }

        $this->treatmentModel->updateEffectiveness($id, (string) $body['effectiveness'], $body['notes'] ?? null);
        $this->audit->log('pest.treatment_effectiveness_evaluated', (int) $user['sub'], 'pest_treatments', $id);

        respond(['success' => true, 'message' => 'Treatment effectiveness recorded.']);
    }

    public function outbreaks(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $records = $this->pestModel->findScoutingRecords($farmId);

        // Filter severe or critical observations
        $outbreaks = array_values(array_filter($records, fn($r) => in_array($r['severity'], ['severe', 'critical'], true)));
        respond(['success' => true, 'count' => count($outbreaks), 'data' => $outbreaks]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
