<?php

declare(strict_types=1);

/**
 * HarvestModel
 *
 * Database operations for crop harvesting records, yield tracking,
 * post-harvest losses, and quality inspection metrics.
 */
class HarvestModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT h.*, f.name AS field_name, c.name AS crop_name, cv.variety_name, u.name AS harvested_by_name
             FROM harvest_records h
             JOIN fields f ON f.id = h.field_id
             JOIN crops c ON c.id = h.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = h.variety_id
             JOIN users u ON u.id = h.harvested_by
             WHERE h.farm_id = :farm_id
             ORDER BY h.harvest_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByField(int $fieldId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT h.*, f.name AS field_name, c.name AS crop_name, cv.variety_name, u.name AS harvested_by_name
             FROM harvest_records h
             JOIN fields f ON f.id = h.field_id
             JOIN crops c ON c.id = h.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = h.variety_id
             JOIN users u ON u.id = h.harvested_by
             WHERE h.field_id = :field_id
             ORDER BY h.harvest_date DESC'
        );
        $stmt->execute([':field_id' => $fieldId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT h.*, f.name AS field_name, c.name AS crop_name, cv.variety_name, u.name AS harvested_by_name
             FROM harvest_records h
             JOIN fields f ON f.id = h.field_id
             JOIN crops c ON c.id = h.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = h.variety_id
             JOIN users u ON u.id = h.harvested_by
             WHERE h.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function normalizeQualityGrade(string $raw): string
    {
        $map = [
            'premium'    => 'A',
            'grade a'    => 'A',
            'a'          => 'A',
            'grade b'    => 'B',
            'b'          => 'B',
            'grade c'    => 'C',
            'c'          => 'C',
            'feed grade' => 'rejected',
            'rejected'   => 'rejected',
        ];
        $key = strtolower(trim($raw));
        return $map[$key] ?? 'A';
    }

    public function create(int $farmId, int $userId, array $data): int
    {
        $varietyId = !empty($data['variety_id']) ? (int) $data['variety_id'] : null;
        $harvestDate = !empty($data['harvest_date']) ? $data['harvest_date'] : date('Y-m-d');
        $expectedYieldKg = ($data['expected_yield_kg'] ?? '') !== '' ? (float) $data['expected_yield_kg'] : null;
        $lossKg = ($data['loss_kg'] ?? '') !== '' ? (float) $data['loss_kg'] : 0.00;
        $qualityGrade = $this->normalizeQualityGrade((string) ($data['quality_grade'] ?? 'A'));

        $stmt = $this->pdo->prepare(
            'INSERT INTO harvest_records (farm_id, field_id, crop_id, variety_id, harvested_by, harvest_date, quantity_kg, expected_yield_kg, loss_kg, quality_grade, storage_location, notes)
             VALUES (:farm_id, :field_id, :crop_id, :variety_id, :harvested_by, :harvest_date, :quantity_kg, :expected_yield_kg, :loss_kg, :quality_grade, :storage_location, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':field_id'          => (int) $data['field_id'],
            ':crop_id'           => (int) $data['crop_id'],
            ':variety_id'        => $varietyId,
            ':harvested_by'      => $userId,
            ':harvest_date'      => $harvestDate,
            ':quantity_kg'       => (float) $data['quantity_kg'],
            ':expected_yield_kg' => $expectedYieldKg,
            ':loss_kg'           => $lossKg,
            ':quality_grade'     => $qualityGrade,
            ':storage_location'  => !empty($data['storage_location']) ? $data['storage_location'] : null,
            ':notes'             => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $harvestDate = !empty($data['harvest_date']) ? $data['harvest_date'] : date('Y-m-d');
        $expectedYieldKg = ($data['expected_yield_kg'] ?? '') !== '' ? (float) $data['expected_yield_kg'] : null;
        $lossKg = ($data['loss_kg'] ?? '') !== '' ? (float) $data['loss_kg'] : 0.00;
        $qualityGrade = $this->normalizeQualityGrade((string) ($data['quality_grade'] ?? 'A'));

        $stmt = $this->pdo->prepare(
            'UPDATE harvest_records
             SET harvest_date = :harvest_date, quantity_kg = :quantity_kg,
                 expected_yield_kg = :expected_yield_kg, loss_kg = :loss_kg,
                 quality_grade = :quality_grade, storage_location = :storage_location, notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'                => $id,
            ':harvest_date'      => $harvestDate,
            ':quantity_kg'       => (float) $data['quantity_kg'],
            ':expected_yield_kg' => $expectedYieldKg,
            ':loss_kg'           => $lossKg,
            ':quality_grade'     => $qualityGrade,
            ':storage_location'  => !empty($data['storage_location']) ? $data['storage_location'] : null,
            ':notes'             => !empty($data['notes']) ? $data['notes'] : null,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM harvest_records WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function getYieldReport(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT c.name AS crop_name,
                    SUM(h.quantity_kg) AS total_actual_kg,
                    SUM(COALESCE(h.expected_yield_kg, 0)) AS total_expected_kg,
                    SUM(h.loss_kg) AS total_loss_kg,
                    ROUND(AVG(CASE WHEN h.expected_yield_kg > 0 THEN (h.quantity_kg / h.expected_yield_kg) * 100 ELSE 100 END), 2) AS yield_efficiency_pct
             FROM harvest_records h
             JOIN crops c ON c.id = h.crop_id
             WHERE h.farm_id = :farm_id
             GROUP BY c.id, c.name'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
