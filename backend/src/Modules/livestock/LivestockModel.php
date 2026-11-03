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

    private function normalizeSpecies(mixed $val): string
    {
        $species = strtolower(trim((string) ($val ?? 'other')));
        $allowed = ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'rabbit', 'other'];
        return in_array($species, $allowed, true) ? $species : 'other';
    }

    private function normalizeStatus(mixed $val): string
    {
        $status = strtolower(trim((string) ($val ?? 'active')));
        if ($status === 'healthy') {
            $status = 'active';
        }
        $allowed = ['active', 'sold', 'deceased', 'quarantine'];
        return in_array($status, $allowed, true) ? $status : 'active';
    }

    private function resolveWorkerVetId(mixed $val): ?int
    {
        if ($val === '' || $val === null) {
            return null;
        }
        $vetId = (int) $val;
        if ($vetId <= 0) {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT id FROM workers WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $vetId]);
        return $stmt->fetchColumn() ? $vetId : null;
    }

    public function createBreed(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO breeds (name, species, description)
             VALUES (:name, :species, :description)'
        );
        $stmt->execute([
            ':name'        => $data['name'],
            ':species'     => $this->normalizeSpecies($data['species'] ?? 'other'),
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
            'SELECT a.*, b.name AS breed_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_staff_name,
                    COALESCE(a.veterinarian_name, CONCAT(w.first_name, " ", w.last_name)) AS attending_veterinarian,
                    COALESCE(a.veterinarian_phone, w.phone) AS attending_veterinarian_phone
             FROM animals a
             LEFT JOIN breeds b ON b.id = a.breed_id
             LEFT JOIN workers w ON w.id = a.veterinarian_id
             WHERE a.farm_id = :farm_id
             ORDER BY a.species, a.tag_number ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.*, b.name AS breed_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_staff_name,
                    COALESCE(a.veterinarian_name, CONCAT(w.first_name, " ", w.last_name)) AS attending_veterinarian,
                    COALESCE(a.veterinarian_phone, w.phone) AS attending_veterinarian_phone
             FROM animals a
             LEFT JOIN breeds b ON b.id = a.breed_id
             LEFT JOIN workers w ON w.id = a.veterinarian_id
             WHERE a.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $dob = ($data['date_of_birth'] ?? '') !== ''
            ? $data['date_of_birth']
            : (($data['birth_date'] ?? '') !== '' ? $data['birth_date'] : null);
        $acqDate = ($data['purchase_date'] ?? '') !== ''
            ? $data['purchase_date']
            : (($data['acquisition_date'] ?? '') !== '' ? $data['acquisition_date'] : null);
        $acqCost = ($data['purchase_price'] ?? '') !== ''
            ? (float) $data['purchase_price']
            : (($data['acquisition_cost'] ?? '') !== '' ? (float) $data['acquisition_cost'] : null);
        $vetId = $this->resolveWorkerVetId($data['veterinarian_id'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO animals
                (farm_id, breed_id, tag_number, name, species, gender,
                 date_of_birth, weight_kg, purchase_price, purchase_date, source, status,
                 veterinarian_name, veterinarian_phone, veterinarian_id, notes)
             VALUES
                (:farm_id, :breed_id, :tag_number, :name, :species, :gender,
                 :date_of_birth, :weight_kg, :purchase_price, :purchase_date, :source, :status,
                 :veterinarian_name, :veterinarian_phone, :veterinarian_id, :notes)'
        );
        $stmt->execute([
            ':farm_id'            => $data['farm_id'],
            ':breed_id'           => ($data['breed_id'] ?? '') !== '' ? (int) $data['breed_id'] : null,
            ':tag_number'         => $data['tag_number'],
            ':name'               => $data['name']               ?? null,
            ':species'            => $this->normalizeSpecies($data['species'] ?? 'other'),
            ':gender'             => strtolower($data['gender'] ?? 'unknown'),
            ':date_of_birth'      => $dob,
            ':weight_kg'          => ($data['weight_kg'] ?? '') !== '' ? (float) $data['weight_kg'] : null,
            ':purchase_price'     => $acqCost,
            ':purchase_date'      => $acqDate,
            ':source'             => $data['source']             ?? null,
            ':status'             => $this->normalizeStatus($data['status'] ?? 'active'),
            ':veterinarian_name'  => $data['veterinarian_name']  ?? null,
            ':veterinarian_phone' => $data['veterinarian_phone'] ?? null,
            ':veterinarian_id'    => $vetId,
            ':notes'              => $data['notes']              ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $dob = ($data['date_of_birth'] ?? '') !== ''
            ? $data['date_of_birth']
            : (($data['birth_date'] ?? '') !== '' ? $data['birth_date'] : null);
        $vetId = $this->resolveWorkerVetId($data['veterinarian_id'] ?? null);

        $stmt = $this->pdo->prepare(
            'UPDATE animals SET
                breed_id           = :breed_id,
                tag_number         = :tag_number,
                name               = :name,
                gender             = :gender,
                date_of_birth      = :date_of_birth,
                date_of_death      = :date_of_death,
                cause_of_death     = :cause_of_death,
                weight_kg          = :weight_kg,
                status             = :status,
                veterinarian_name  = :veterinarian_name,
                veterinarian_phone = :veterinarian_phone,
                veterinarian_id    = :veterinarian_id,
                notes              = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':breed_id'           => ($data['breed_id'] ?? '') !== '' ? (int) $data['breed_id'] : null,
            ':tag_number'         => $data['tag_number'],
            ':name'               => $data['name']           ?? null,
            ':gender'             => strtolower($data['gender'] ?? 'unknown'),
            ':date_of_birth'      => $dob,
            ':date_of_death'      => ($data['date_of_death'] ?? '') !== '' ? $data['date_of_death'] : null,
            ':cause_of_death'     => $data['cause_of_death'] ?? null,
            ':weight_kg'          => ($data['weight_kg'] ?? '') !== '' ? (float) $data['weight_kg'] : null,
            ':status'             => $this->normalizeStatus($data['status'] ?? 'active'),
            ':veterinarian_name'  => $data['veterinarian_name']  ?? null,
            ':veterinarian_phone' => $data['veterinarian_phone'] ?? null,
            ':veterinarian_id'    => $vetId,
            ':notes'              => $data['notes']          ?? null,
            ':id'                 => $id,
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

    public function findFeedByAnimal(int $animalId): array
    {
        return $this->getFeedByAnimal($animalId);
    }

    public function getFeedByAnimal(int $animalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT fr.*, fr.feed_date AS log_date, u.name AS recorded_by_name
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
        $feedDate = !empty($data['feed_date'])
            ? $data['feed_date']
            : (!empty($data['log_date']) ? $data['log_date'] : date('Y-m-d'));

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
            ':quantity_kg'=> (float) $data['quantity_kg'],
            ':cost'       => ($data['cost'] ?? '') !== '' ? (float) $data['cost'] : null,
            ':feed_date'  => $feedDate,
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

    public function getVeterinarians(int $farmId): array
    {
        $vets = [];

        // 1. From workers table with veterinarian role
        $stmt = $this->pdo->prepare(
            'SELECT id AS id, CONCAT(first_name, " ", last_name) AS name, phone, email, "staff_worker" AS type
             FROM workers
             WHERE farm_id = :farm_id AND role = "veterinarian" AND status = "active"
             ORDER BY first_name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $workerVets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($workerVets as $wv) {
            $vets[] = $wv;
        }

        // 2. From users table with veterinarian role
        $stmtUsers = $this->pdo->query(
            'SELECT u.id AS id, u.name, "" AS phone, u.email, "user_account" AS type
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE r.name = "veterinarian" AND u.is_active = 1
             ORDER BY u.name ASC'
        );
        $userVets = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
        foreach ($userVets as $uv) {
            $vets[] = $uv;
        }

        return $vets;
    }
}

