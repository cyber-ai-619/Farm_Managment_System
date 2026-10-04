<?php
// backend/src/Modules/crop/CropModel.php

class CropModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // CROPS
    // =========================================================================

    public function getAll(): array
    {
        return $this->pdo
            ->query('SELECT * FROM crops ORDER BY name ASC')
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM crops WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO crops (name, scientific_name, category, description)
             VALUES (:name, :scientific_name, :category, :description)'
        );
        $stmt->execute([
            ':name'            => $data['name'],
            ':scientific_name' => $data['scientific_name'] ?? null,
            ':category'        => $data['category']        ?? 'other',
            ':description'     => $data['description']     ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE crops SET
                name            = :name,
                scientific_name = :scientific_name,
                category        = :category,
                description     = :description
             WHERE id = :id'
        );
        return $stmt->execute([
            ':name'            => $data['name'],
            ':scientific_name' => $data['scientific_name'] ?? null,
            ':category'        => $data['category']        ?? 'other',
            ':description'     => $data['description']     ?? null,
            ':id'              => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM crops WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // =========================================================================
    // VARIETIES
    // =========================================================================

    public function getVarietiesByCrop(int $cropId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM crop_varieties WHERE crop_id = :crop_id ORDER BY variety_name ASC'
        );
        $stmt->execute([':crop_id' => $cropId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getVarietyById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM crop_varieties WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createVariety(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO crop_varieties
                (crop_id, variety_name, days_to_maturity, planting_density,
                 row_spacing_cm, plant_spacing_cm, expected_yield_t_ha, notes)
             VALUES
                (:crop_id, :variety_name, :days_to_maturity, :planting_density,
                 :row_spacing_cm, :plant_spacing_cm, :expected_yield_t_ha, :notes)'
        );
        $stmt->execute([
            ':crop_id'              => $data['crop_id'],
            ':variety_name'         => $data['variety_name'],
            ':days_to_maturity'     => $data['days_to_maturity']     ?? null,
            ':planting_density'     => $data['planting_density']     ?? null,
            ':row_spacing_cm'       => $data['row_spacing_cm']       ?? null,
            ':plant_spacing_cm'     => $data['plant_spacing_cm']     ?? null,
            ':expected_yield_t_ha'  => $data['expected_yield_t_ha']  ?? null,
            ':notes'                => $data['notes']                ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
