<?php
// backend/src/Modules/livestock/HealthModel.php

class HealthModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // VACCINATIONS
    // =========================================================================

    public function getVaccinationsByAnimal(int $animalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT v.*, u.name AS administered_by_name
             FROM vaccinations v
             JOIN users u ON u.id = v.administered_by
             WHERE v.animal_id = :animal_id
             ORDER BY v.vaccination_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getVaccinationById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM vaccinations WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createVaccination(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO vaccinations
                (animal_id, administered_by, vaccine_name, disease_target,
                 dose_ml, vaccination_date, next_due_date, batch_number, notes)
             VALUES
                (:animal_id, :administered_by, :vaccine_name, :disease_target,
                 :dose_ml, :vaccination_date, :next_due_date, :batch_number, :notes)'
        );
        $stmt->execute([
            ':animal_id'       => $data['animal_id'],
            ':administered_by' => $data['administered_by'],
            ':vaccine_name'    => $data['vaccine_name'],
            ':disease_target'  => $data['disease_target']  ?? null,
            ':dose_ml'         => $data['dose_ml']         ?? null,
            ':vaccination_date'=> $data['vaccination_date'],
            ':next_due_date'   => $data['next_due_date']   ?? null,
            ':batch_number'    => $data['batch_number']    ?? null,
            ':notes'           => $data['notes']           ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Fetch upcoming vaccinations due within $days days — useful for alerts. */
    public function getUpcomingDue(int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT v.*, a.tag_number, a.name AS animal_name, a.farm_id
             FROM vaccinations v
             JOIN animals a ON a.id = v.animal_id
             WHERE v.next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
             ORDER BY v.next_due_date ASC'
        );
        $stmt->execute([':days' => $days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // TREATMENTS
    // =========================================================================

    public function getTreatmentsByAnimal(int $animalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.*, u.name AS administered_by_name
             FROM treatments t
             JOIN users u ON u.id = t.administered_by
             WHERE t.animal_id = :animal_id
             ORDER BY t.treatment_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTreatmentById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM treatments WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createTreatment(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO treatments
                (animal_id, administered_by, diagnosis, treatment_name, medication,
                 dose, treatment_date, follow_up_date, outcome, cost, notes)
             VALUES
                (:animal_id, :administered_by, :diagnosis, :treatment_name, :medication,
                 :dose, :treatment_date, :follow_up_date, :outcome, :cost, :notes)'
        );
        $stmt->execute([
            ':animal_id'       => $data['animal_id'],
            ':administered_by' => $data['administered_by'],
            ':diagnosis'       => $data['diagnosis'],
            ':treatment_name'  => $data['treatment_name'],
            ':medication'      => $data['medication']     ?? null,
            ':dose'            => $data['dose']           ?? null,
            ':treatment_date'  => $data['treatment_date'],
            ':follow_up_date'  => $data['follow_up_date'] ?? null,
            ':outcome'         => $data['outcome']        ?? 'ongoing',
            ':cost'            => $data['cost']           ?? null,
            ':notes'           => $data['notes']          ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateTreatmentOutcome(int $id, string $outcome): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE treatments SET outcome = :outcome WHERE id = :id'
        );
        return $stmt->execute([':outcome' => $outcome, ':id' => $id]);
    }
}
