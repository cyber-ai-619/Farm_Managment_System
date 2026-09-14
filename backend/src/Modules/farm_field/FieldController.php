<?php
// backend/src/Modules/farm_field/FieldController.php

require_once __DIR__ . '/FieldModel.php';
require_once __DIR__ . '/FarmModel.php';

class FieldController
{
    private FieldModel $fieldModel;
    private FarmModel  $farmModel;

    public function __construct(PDO $pdo)
    {
        $this->fieldModel = new FieldModel($pdo);
        $this->farmModel  = new FarmModel($pdo);
    }

    // -------------------------------------------------------------------------
    // Helper — fetch & authorise parent farm
    // -------------------------------------------------------------------------
    private function authorisedFarm(int $farmId, array $user): array
    {
        $farm = $this->farmModel->getById($farmId);
        if (!$farm) {
            respond(['success' => false, 'message' => 'Farm not found.'], 404);
        }
        if ($user['role'] !== 'admin' && (int) $farm['owner_id'] !== (int) $user['sub']) {
            respond(['success' => false, 'message' => 'Forbidden.'], 403);
        }
        return $farm;
    }

    // =========================================================================
    // FIELDS UNDER A FARM
    // =========================================================================

    // GET /api/farms/{farm_id}/fields
    public function indexByFarm(int $farmId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $this->authorisedFarm($farmId, $user);

        $fields = $this->fieldModel->getAllByFarm($farmId);
        respond(['success' => true, 'data' => $fields]);
    }

    // POST /api/farms/{farm_id}/fields
    public function storeUnderFarm(int $farmId): void
    {
        $user = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);
        $this->authorisedFarm($farmId, $user);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Field name is required.'], 422);
        }

        $id    = $this->fieldModel->createField(array_merge($body, ['farm_id' => $farmId]));
        $field = $this->fieldModel->getFieldById($id);
        respond(['success' => true, 'message' => 'Field created.', 'data' => $field], 201);
    }

    // =========================================================================
    // INDIVIDUAL FIELD OPERATIONS
    // =========================================================================

    // GET /api/fields/{id}
    public function show(int $id): void
    {
        $user  = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $field = $this->fieldModel->getFieldById($id);
        if (!$field) {
            respond(['success' => false, 'message' => 'Field not found.'], 404);
        }
        $this->authorisedFarm((int) $field['farm_id'], $user);
        respond(['success' => true, 'data' => $field]);
    }

    // PUT /api/fields/{id}
    public function update(int $id): void
    {
        $user  = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);
        $field = $this->fieldModel->getFieldById($id);
        if (!$field) {
            respond(['success' => false, 'message' => 'Field not found.'], 404);
        }
        $this->authorisedFarm((int) $field['farm_id'], $user);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Field name is required.'], 422);
        }

        $this->fieldModel->updateField($id, array_merge($field, $body));
        respond(['success' => true, 'message' => 'Field updated.', 'data' => $this->fieldModel->getFieldById($id)]);
    }

    // DELETE /api/fields/{id}
    public function destroy(int $id): void
    {
        $user  = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);
        $field = $this->fieldModel->getFieldById($id);
        if (!$field) {
            respond(['success' => false, 'message' => 'Field not found.'], 404);
        }
        $this->authorisedFarm((int) $field['farm_id'], $user);
        $this->fieldModel->deleteField($id);
        respond(['success' => true, 'message' => 'Field deleted.']);
    }

    // =========================================================================
    // PLOTS UNDER A FIELD
    // =========================================================================

    // GET /api/fields/{field_id}/plots
    public function indexPlots(int $fieldId): void
    {
        $user  = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager', 'agronomist']);
        $field = $this->fieldModel->getFieldById($fieldId);
        if (!$field) {
            respond(['success' => false, 'message' => 'Field not found.'], 404);
        }
        $this->authorisedFarm((int) $field['farm_id'], $user);
        respond(['success' => true, 'data' => $this->fieldModel->getPlotsByField($fieldId)]);
    }

    // POST /api/fields/{field_id}/plots
    public function storePlot(int $fieldId): void
    {
        $user  = requireAuth();
        requireRole(['admin', 'farm_owner', 'farm_manager']);
        $field = $this->fieldModel->getFieldById($fieldId);
        if (!$field) {
            respond(['success' => false, 'message' => 'Field not found.'], 404);
        }
        $this->authorisedFarm((int) $field['farm_id'], $user);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Plot name is required.'], 422);
        }

        $id   = $this->fieldModel->createPlot(array_merge($body, ['field_id' => $fieldId]));
        $plot = $this->fieldModel->getPlotById($id);
        respond(['success' => true, 'message' => 'Plot created.', 'data' => $plot], 201);
    }
}
