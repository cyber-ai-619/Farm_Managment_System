<?php
// backend/src/Modules/livestock/LivestockModel.php

class LivestockModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // BREEDS
    // =========================================================================

    public function getAllBreeds(): array
    {
        return $this->pdo
            ->query('SELECT * FROM breeds ORDER BY species, name ASC')
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createBreed(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO breeds (name, species, description)
             VALUES (:name, :species, :description)'
        );
        $stmt->execute([
            ':name'        => $data['name'],
            ':species'     => $data['species'],
            ':description' => $data['description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // ANIMALS
    // =========================================================================

    public function getAll(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.*, b.name AS breed_name
             FROM animals a
             LEFT JOIN breeds b ON b.id = a.breed_id
             WHERE a.farm_id = :farm_id
             ORDER BY a.species, a.tag_number ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.*, b.name AS breed_name
             FROM animals a
             LEFT JOIN breeds b ON b.id = a.breed_id
             WHERE a.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO animals
                (farm_id, breed_id, tag_number, name, species, gender,
                 date_of_birth, weight_kg, purchase_price, purchase_date, source, status, notes)
             VALUES
                (:farm_id, :breed_id, :tag_number, :name, :species, :gender,
                 :date_of_birth, :weight_kg, :purchase_price, :purchase_date, :source, :status, :notes)'
        );
        $stmt->execute([
            ':farm_id'        => $data['farm_id'],
            ':breed_id'       => $data['breed_id']       ?? null,
            ':tag_number'     => $data['tag_number'],
            ':name'           => $data['name']           ?? null,
            ':species'        => $data['species'],
            ':gender'         => $data['gender']         ?? 'unknown',
            ':date_of_birth'  => $data['date_of_birth']  ?? null,
            ':weight_kg'      => $data['weight_kg']      ?? null,
            ':purchase_price' => $data['purchase_price'] ?? null,
            ':purchase_date'  => $data['purchase_date']  ?? null,
            ':source'         => $data['source']         ?? null,
            ':status'         => $data['status']         ?? 'active',
            ':notes'          => $data['notes']          ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE animals SET
                breed_id       = :breed_id,
                tag_number     = :tag_number,
                name           = :name,
                gender         = :gender,
                date_of_birth  = :date_of_birth,
                date_of_death  = :date_of_death,
                cause_of_death = :cause_of_death,
                weight_kg      = :weight_kg,
                status         = :status,
                notes          = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':breed_id'       => $data['breed_id']       ?? null,
            ':tag_number'     => $data['tag_number'],
            ':name'           => $data['name']           ?? null,
            ':gender'         => $data['gender']         ?? 'unknown',
            ':date_of_birth'  => $data['date_of_birth']  ?? null,
            ':date_of_death'  => $data['date_of_death']  ?? null,
            ':cause_of_death' => $data['cause_of_death'] ?? null,
            ':weight_kg'      => $data['weight_kg']      ?? null,
            ':status'         => $data['status']         ?? 'active',
            ':notes'          => $data['notes']          ?? null,
            ':id'             => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM animals WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // =========================================================================
    // FEED RECORDS
    // =========================================================================

    public function getFeedByAnimal(int $animalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT fr.*, u.name AS recorded_by_name
             FROM feed_records fr
             JOIN users u ON u.id = fr.recorded_by
             WHERE fr.animal_id = :animal_id
             ORDER BY fr.feed_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createFeedRecord(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO feed_records
                (animal_id, recorded_by, feed_type, quantity_kg, cost, feed_date, notes)
             VALUES
                (:animal_id, :recorded_by, :feed_type, :quantity_kg, :cost, :feed_date, :notes)'
        );
        $stmt->execute([
            ':animal_id'  => $data['animal_id'],
            ':recorded_by'=> $data['recorded_by'],
            ':feed_type'  => $data['feed_type'],
            ':quantity_kg'=> $data['quantity_kg'],
            ':cost'       => $data['cost']       ?? null,
            ':feed_date'  => $data['feed_date'],
            ':notes'      => $data['notes']      ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // =========================================================================
    // PRODUCTION RECORDS
    // =========================================================================

    public function getProductionByAnimal(int $animalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT lp.*, u.name AS recorded_by_name
             FROM livestock_production lp
             JOIN users u ON u.id = lp.recorded_by
             WHERE lp.animal_id = :animal_id
             ORDER BY lp.production_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createProductionRecord(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO livestock_production
                (animal_id, recorded_by, product_type, quantity, unit,
                 production_date, quality_grade, notes)
             VALUES
                (:animal_id, :recorded_by, :product_type, :quantity, :unit,
                 :production_date, :quality_grade, :notes)'
        );
        $stmt->execute([
            ':animal_id'       => $data['animal_id'],
            ':recorded_by'     => $data['recorded_by'],
            ':product_type'    => $data['product_type'],
            ':quantity'        => $data['quantity'],
            ':unit'            => $data['unit'],
            ':production_date' => $data['production_date'],
            ':quality_grade'   => $data['quality_grade'] ?? 'A',
            ':notes'           => $data['notes']         ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
