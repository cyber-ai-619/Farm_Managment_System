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
        $stmt = $this->pdo->query('SELECT * FROM pests_diseases ORDER BY type ASC, name ASC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createPest(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO pests_diseases (name, scientific_name, type, affected_crops, symptoms_description, prevention_measures, recommended_control)
             VALUES (:name, :scientific_name, :type, :affected_crops, :symptoms_description, :prevention_measures, :recommended_control)'
        );
        $stmt->execute([
            ':name'                 => $data['name'],
            ':scientific_name'      => $data['scientific_name'] ?? null,
            ':type'                 => $data['type'] ?? 'pest',
            ':affected_crops'       => $data['affected_crops'] ?? null,
            ':symptoms_description' => $data['symptoms_description'] ?? null,
            ':prevention_measures'  => $data['prevention_measures'] ?? null,
            ':recommended_control'  => $data['recommended_control'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findScoutingRecords(int $farmId, ?int $fieldId = null): array
    {
        $sql = 'SELECT s.*, f.name AS field_name, c.name AS crop_name, p.name AS pest_name, p.type AS pest_type, u.name AS scouted_by_name
                FROM scouting_records s
                JOIN fields f ON f.id = s.field_id
                LEFT JOIN crops c ON c.id = s.crop_id
                LEFT JOIN pests_diseases p ON p.id = s.pest_disease_id
                JOIN users u ON u.id = s.scouted_by
                WHERE s.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($fieldId !== null) {
            $sql .= ' AND s.field_id = :field_id';
            $params[':field_id'] = $fieldId;
        }

        $sql .= ' ORDER BY s.observation_date DESC, s.severity DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createScoutingRecord(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO scouting_records (farm_id, field_id, crop_id, pest_disease_id, scouted_by, severity, affected_area_pct, observation_date, symptoms_found, action_required, photo_url, notes)
             VALUES (:farm_id, :field_id, :crop_id, :pest_disease_id, :scouted_by, :severity, :affected_area_pct, :observation_date, :symptoms_found, :action_required, :photo_url, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':field_id'          => $data['field_id'],
            ':crop_id'           => $data['crop_id'] ?? null,
            ':pest_disease_id'   => $data['pest_disease_id'] ?? null,
            ':scouted_by'        => $userId,
            ':severity'          => $data['severity'] ?? 'low',
            ':affected_area_pct' => $data['affected_area_pct'] ?? null,
            ':observation_date'  => $data['observation_date'] ?? date('Y-m-d'),
            ':symptoms_found'    => $data['symptoms_found'] ?? null,
            ':action_required'   => (int) ($data['action_required'] ?? 0),
            ':photo_url'         => $data['photo_url'] ?? null,
            ':notes'             => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
