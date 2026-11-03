<?php

declare(strict_types=1);

/**
 * PestModel
 *
 * Database operations for pest and disease catalogs and field scouting logs.
 */
class PestModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function allPests(): array
    {
        $stmt = $this->pdo->query(
            'SELECT *, symptoms_description AS symptoms, recommended_control AS treatment_recommendation FROM pests_diseases ORDER BY type ASC, name ASC'
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findAll(): array
    {
        return $this->allPests();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT *, symptoms_description AS symptoms, recommended_control AS treatment_recommendation FROM pests_diseases WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createPest(array $data): int
    {
        $rawType = strtolower(trim((string) ($data['type'] ?? 'pest')));
        $typeMap = [
            'pest'              => 'pest',
            'fungal'            => 'fungal_disease',
            'fungal_disease'    => 'fungal_disease',
            'bacterial'         => 'bacterial_disease',
            'bacterial_disease' => 'bacterial_disease',
            'viral'             => 'viral_disease',
            'viral_disease'     => 'viral_disease',
            'weed'              => 'weed',
            'nematode'          => 'nematode',
            'deficiency'        => 'deficiency',
        ];
        $type = $typeMap[$rawType] ?? 'other';

        $symptoms = $data['symptoms_description'] ?? ($data['symptoms'] ?? null);
        $control = $data['recommended_control'] ?? ($data['treatment_recommendation'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO pests_diseases (name, scientific_name, type, affected_crops, symptoms_description, prevention_measures, recommended_control)
             VALUES (:name, :scientific_name, :type, :affected_crops, :symptoms_description, :prevention_measures, :recommended_control)'
        );
        $stmt->execute([
            ':name'                 => $data['name'],
            ':scientific_name'      => !empty($data['scientific_name']) ? $data['scientific_name'] : null,
            ':type'                 => $type,
            ':affected_crops'       => !empty($data['affected_crops']) ? $data['affected_crops'] : null,
            ':symptoms_description' => ($symptoms !== '') ? $symptoms : null,
            ':prevention_measures'  => !empty($data['prevention_measures']) ? $data['prevention_measures'] : null,
            ':recommended_control'  => ($control !== '') ? $control : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function create(array $data): int
    {
        return $this->createPest($data);
    }

    public function findScoutingRecords(int $farmId, ?int $fieldId = null): array
    {
        $sql = 'SELECT sr.*, f.name AS field_name, c.name AS crop_name, pd.name AS pest_name, pd.type AS pest_type, u.name AS scouted_by_name,
                       sr.pest_disease_id AS pest_id, sr.observation_date AS scouting_date, sr.affected_area_pct AS affected_area_percentage
                FROM scouting_records sr
                JOIN fields f ON f.id = sr.field_id
                LEFT JOIN crops c ON c.id = sr.crop_id
                LEFT JOIN pests_diseases pd ON pd.id = sr.pest_disease_id
                LEFT JOIN users u ON u.id = sr.scouted_by
                WHERE sr.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($fieldId !== null) {
            $sql .= ' AND sr.field_id = :field_id';
            $params[':field_id'] = $fieldId;
        }

        $sql .= ' ORDER BY sr.observation_date DESC, sr.severity DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findScoutingByFarm(int $farmId, ?int $fieldId = null): array
    {
        return $this->findScoutingRecords($farmId, $fieldId);
    }

    public function createScoutingRecord(int $farmId, int $userId, array $data): int
    {
        $rawSeverity = strtolower(trim((string) ($data['severity'] ?? 'low')));
        $severityMap = [
            'low'      => 'low',
            'medium'   => 'moderate',
            'moderate' => 'moderate',
            'high'     => 'severe',
            'severe'   => 'severe',
            'critical' => 'critical',
        ];
        $severity = $severityMap[$rawSeverity] ?? 'low';

        $pestDiseaseId = !empty($data['pest_disease_id']) ? (int) $data['pest_disease_id'] : (!empty($data['pest_id']) ? (int) $data['pest_id'] : null);
        $cropId = !empty($data['crop_id']) ? (int) $data['crop_id'] : null;
        $affectedAreaPct = ($data['affected_area_pct'] ?? ($data['affected_area_percentage'] ?? '')) !== ''
            ? (float) ($data['affected_area_pct'] ?? $data['affected_area_percentage'])
            : null;
        $observationDate = !empty($data['observation_date'])
            ? $data['observation_date']
            : (!empty($data['scouting_date']) ? $data['scouting_date'] : date('Y-m-d'));

        $stmt = $this->pdo->prepare(
            'INSERT INTO scouting_records (farm_id, field_id, crop_id, pest_disease_id, scouted_by, severity, affected_area_pct, observation_date, symptoms_found, action_required, photo_url, notes)
             VALUES (:farm_id, :field_id, :crop_id, :pest_disease_id, :scouted_by, :severity, :affected_area_pct, :observation_date, :symptoms_found, :action_required, :photo_url, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':field_id'          => (int) $data['field_id'],
            ':crop_id'           => $cropId,
            ':pest_disease_id'   => $pestDiseaseId,
            ':scouted_by'        => $userId,
            ':severity'          => $severity,
            ':affected_area_pct' => $affectedAreaPct,
            ':observation_date'  => $observationDate,
            ':symptoms_found'    => !empty($data['symptoms_found']) ? $data['symptoms_found'] : null,
            ':action_required'   => (int) ($data['action_required'] ?? 0),
            ':photo_url'         => !empty($data['photo_url']) ? $data['photo_url'] : null,
            ':notes'             => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
