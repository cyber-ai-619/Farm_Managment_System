<?php
// backend/src/Modules/crop/PlantingModel.php

class PlantingModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // PLANTING SCHEDULES
    // =========================================================================

    public function getAllByCrop(int $cropId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT ps.*,
                    f.name  AS field_name,
                    p.name  AS plot_name,
                    cv.variety_name,
                    u.name  AS planted_by_name
             FROM planting_schedules ps
             JOIN fields f         ON f.id  = ps.field_id
             LEFT JOIN plots p     ON p.id  = ps.plot_id
             LEFT JOIN crop_varieties cv ON cv.id = ps.variety_id
             JOIN users u          ON u.id  = ps.planted_by
             WHERE ps.crop_id = :crop_id
             ORDER BY ps.planting_date DESC'
        );
        $stmt->execute([':crop_id' => $cropId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllByField(int $fieldId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT ps.*,
                    c.name  AS crop_name,
                    cv.variety_name,
                    u.name  AS planted_by_name
             FROM planting_schedules ps
             JOIN crops c               ON c.id  = ps.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = ps.variety_id
             JOIN users u               ON u.id  = ps.planted_by
             WHERE ps.field_id = :field_id
             ORDER BY ps.planting_date DESC'
        );
        $stmt->execute([':field_id' => $fieldId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT ps.*,
                    c.name  AS crop_name,
                    cv.variety_name,
                    f.name  AS field_name,
                    u.name  AS planted_by_name
             FROM planting_schedules ps
             JOIN crops c               ON c.id  = ps.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = ps.variety_id
             JOIN fields f              ON f.id  = ps.field_id
             JOIN users u               ON u.id  = ps.planted_by
             WHERE ps.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO planting_schedules
                (field_id, plot_id, crop_id, variety_id, planted_by,
                 planting_date, expected_harvest_date, area_planted_ha,
                 seed_quantity_kg, status, notes)
             VALUES
                (:field_id, :plot_id, :crop_id, :variety_id, :planted_by,
                 :planting_date, :expected_harvest_date, :area_planted_ha,
                 :seed_quantity_kg, :status, :notes)'
        );
        $stmt->execute([
            ':field_id'             => $data['field_id'],
            ':plot_id'              => $data['plot_id']               ?? null,
            ':crop_id'              => $data['crop_id'],
            ':variety_id'           => $data['variety_id']            ?? null,
            ':planted_by'           => $data['planted_by'],
            ':planting_date'        => $data['planting_date'],
            ':expected_harvest_date'=> $data['expected_harvest_date'] ?? null,
            ':area_planted_ha'      => $data['area_planted_ha']       ?? null,
            ':seed_quantity_kg'     => $data['seed_quantity_kg']      ?? null,
            ':status'               => $data['status']                ?? 'planned',
            ':notes'                => $data['notes']                 ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE planting_schedules SET status = :status WHERE id = :id'
        );
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    // =========================================================================
    // FERTILIZER RECORDS
    // =========================================================================

    public function getFertilizersByPlanting(int $plantingId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT fr.*, u.name AS applied_by_name
             FROM fertilizer_records fr
             JOIN users u ON u.id = fr.applied_by
             WHERE fr.planting_id = :planting_id
             ORDER BY fr.application_date DESC'
        );
        $stmt->execute([':planting_id' => $plantingId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createFertilizerRecord(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO fertilizer_records
                (planting_id, applied_by, fertilizer_name, fertilizer_type,
                 quantity_kg, application_date, notes)
             VALUES
                (:planting_id, :applied_by, :fertilizer_name, :fertilizer_type,
                 :quantity_kg, :application_date, :notes)'
        );
        $stmt->execute([
            ':planting_id'     => $data['planting_id'],
            ':applied_by'      => $data['applied_by'],
            ':fertilizer_name' => $data['fertilizer_name'],
            ':fertilizer_type' => $data['fertilizer_type'] ?? 'other',
            ':quantity_kg'     => $data['quantity_kg'],
            ':application_date'=> $data['application_date'],
            ':notes'           => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // SPRAYING SCHEDULES
    // =========================================================================

    public function getSprayingByPlanting(int $plantingId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT ss.*, u.name AS applied_by_name
             FROM spraying_schedules ss
             JOIN users u ON u.id = ss.applied_by
             WHERE ss.planting_id = :planting_id
             ORDER BY ss.spray_date DESC'
        );
        $stmt->execute([':planting_id' => $plantingId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createSprayingRecord(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO spraying_schedules
                (planting_id, applied_by, chemical_name, chemical_type,
                 quantity_litres, dilution_ratio, spray_date, target_pest, notes)
             VALUES
                (:planting_id, :applied_by, :chemical_name, :chemical_type,
                 :quantity_litres, :dilution_ratio, :spray_date, :target_pest, :notes)'
        );
        $stmt->execute([
            ':planting_id'    => $data['planting_id'],
            ':applied_by'     => $data['applied_by'],
            ':chemical_name'  => $data['chemical_name'],
            ':chemical_type'  => $data['chemical_type']   ?? 'other',
            ':quantity_litres'=> $data['quantity_litres'],
            ':dilution_ratio' => $data['dilution_ratio']  ?? null,
            ':spray_date'     => $data['spray_date'],
            ':target_pest'    => $data['target_pest']     ?? null,
            ':notes'          => $data['notes']           ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
