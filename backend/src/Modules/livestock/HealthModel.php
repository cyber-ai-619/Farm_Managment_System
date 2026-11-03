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
            'SELECT v.*, u.name AS administered_by_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_worker_name,
                    COALESCE(v.veterinarian_name, CONCAT(w.first_name, " ", w.last_name), u.name) AS attending_vet,
                    v.vaccination_date AS administered_date
             FROM vaccinations v
             JOIN users u ON u.id = v.administered_by
             LEFT JOIN workers w ON w.id = v.veterinarian_id
             WHERE v.animal_id = :animal_id
             ORDER BY v.vaccination_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getVaccinationById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT v.*, u.name AS administered_by_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_worker_name,
                    COALESCE(v.veterinarian_name, CONCAT(w.first_name, " ", w.last_name), u.name) AS attending_vet,
                    v.vaccination_date AS administered_date
             FROM vaccinations v
             JOIN users u ON u.id = v.administered_by
             LEFT JOIN workers w ON w.id = v.veterinarian_id
             WHERE v.id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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

    private function normalizeOutcome(mixed $val): string
    {
        $outcome = strtolower(trim((string) ($val ?? 'ongoing')));
        if ($outcome === 'recovering') {
            $outcome = 'ongoing';
        }
        $allowed = ['recovered', 'ongoing', 'deceased', 'referred'];
        return in_array($outcome, $allowed, true) ? $outcome : 'ongoing';
    }

    public function createVaccination(array $data): int
    {
        $vetId = $this->resolveWorkerVetId($data['veterinarian_id'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO vaccinations
                (animal_id, administered_by, veterinarian_name, veterinarian_id,
                 vaccine_name, disease_target, dose_ml, dosage, route,
                 vaccination_date, next_due_date, batch_number,
                 withdrawal_days_meat, withdrawal_days_milk, manufacturer, cost, notes)
             VALUES
                (:animal_id, :administered_by, :veterinarian_name, :veterinarian_id,
                 :vaccine_name, :disease_target, :dose_ml, :dosage, :route,
                 :vaccination_date, :next_due_date, :batch_number,
                 :withdrawal_days_meat, :withdrawal_days_milk, :manufacturer, :cost, :notes)'
        );
        $stmt->execute([
            ':animal_id'            => $data['animal_id'],
            ':administered_by'      => $data['administered_by'],
            ':veterinarian_name'    => $data['veterinarian_name']    ?? null,
            ':veterinarian_id'      => $vetId,
            ':vaccine_name'         => $data['vaccine_name'],
            ':disease_target'       => $data['disease_target']       ?? null,
            ':dose_ml'              => !empty($data['dose_ml']) ? (float) $data['dose_ml'] : null,
            ':dosage'               => $data['dosage']               ?? (!empty($data['dose_ml']) ? $data['dose_ml'] . ' ml' : null),
            ':route'                => $data['route']                ?? 'intramuscular',
            ':vaccination_date'     => $data['vaccination_date']     ?? ($data['administered_date'] ?? date('Y-m-d')),
            ':next_due_date'        => ($data['next_due_date'] ?? '') !== '' ? $data['next_due_date'] : null,
            ':batch_number'         => ($data['batch_number'] ?? '') !== '' ? $data['batch_number'] : null,
            ':withdrawal_days_meat' => ($data['withdrawal_days_meat'] ?? '') !== '' ? (int) $data['withdrawal_days_meat'] : 0,
            ':withdrawal_days_milk' => ($data['withdrawal_days_milk'] ?? '') !== '' ? (int) $data['withdrawal_days_milk'] : 0,
            ':manufacturer'         => $data['manufacturer']         ?? null,
            ':cost'                 => ($data['cost'] ?? '') !== '' ? (float) $data['cost'] : 0.00,
            ':notes'                => $data['notes']                ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Fetch upcoming vaccinations due within $days days — useful for alerts. */
    public function getUpcomingDue(int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT v.*, a.tag_number, a.name AS animal_name, a.farm_id,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_worker_name,
                    COALESCE(v.veterinarian_name, CONCAT(w.first_name, " ", w.last_name)) AS attending_vet
             FROM vaccinations v
             JOIN animals a ON a.id = v.animal_id
             LEFT JOIN workers w ON w.id = v.veterinarian_id
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
            'SELECT t.*, u.name AS administered_by_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_worker_name,
                    COALESCE(t.veterinarian_name, CONCAT(w.first_name, " ", w.last_name), u.name) AS attending_vet,
                    t.diagnosis AS disease_diagnosed
             FROM treatments t
             JOIN users u ON u.id = t.administered_by
             LEFT JOIN workers w ON w.id = t.veterinarian_id
             WHERE t.animal_id = :animal_id
             ORDER BY t.treatment_date DESC'
        );
        $stmt->execute([':animal_id' => $animalId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTreatmentById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.*, u.name AS administered_by_name,
                    CONCAT(w.first_name, " ", w.last_name) AS vet_worker_name,
                    COALESCE(t.veterinarian_name, CONCAT(w.first_name, " ", w.last_name), u.name) AS attending_vet,
                    t.diagnosis AS disease_diagnosed
             FROM treatments t
             JOIN users u ON u.id = t.administered_by
             LEFT JOIN workers w ON w.id = t.veterinarian_id
             WHERE t.id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createTreatment(array $data): int
    {
        $vetId = $this->resolveWorkerVetId($data['veterinarian_id'] ?? null);
        $outcome = $this->normalizeOutcome($data['outcome'] ?? 'ongoing');

        $stmt = $this->pdo->prepare(
            'INSERT INTO treatments
                (animal_id, administered_by, veterinarian_name, veterinarian_id,
                 diagnosis, treatment_name, medication, dose, route,
                 treatment_date, follow_up_date, outcome, withdrawal_days, clinic_name, cost, notes)
             VALUES
                (:animal_id, :administered_by, :veterinarian_name, :veterinarian_id,
                 :diagnosis, :treatment_name, :medication, :dose, :route,
                 :treatment_date, :follow_up_date, :outcome, :withdrawal_days, :clinic_name, :cost, :notes)'
        );
        $stmt->execute([
            ':animal_id'         => $data['animal_id'],
            ':administered_by'   => $data['administered_by'],
            ':veterinarian_name' => $data['veterinarian_name'] ?? null,
            ':veterinarian_id'   => $vetId,
            ':diagnosis'         => $data['diagnosis']         ?? ($data['disease_diagnosed'] ?? 'General Veterinary Exam'),
            ':treatment_name'    => $data['treatment_name']    ?? ($data['procedure_name'] ?? ($data['medication'] ?? 'Medical Therapy')),
            ':medication'        => $data['medication']        ?? null,
            ':dose'              => $data['dose']              ?? ($data['dosage'] ?? null),
            ':route'             => $data['route']             ?? 'intramuscular',
            ':treatment_date'    => $data['treatment_date']    ?? date('Y-m-d'),
            ':follow_up_date'    => ($data['follow_up_date'] ?? '') !== '' ? $data['follow_up_date'] : null,
            ':outcome'           => $outcome,
            ':withdrawal_days'   => ($data['withdrawal_days'] ?? '') !== '' ? (int) $data['withdrawal_days'] : 0,
            ':clinic_name'       => $data['clinic_name']       ?? null,
            ':cost'              => ($data['cost'] ?? '') !== '' ? (float) $data['cost'] : 0.00,
            ':notes'             => $data['notes']             ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateTreatmentOutcome(int $id, string $outcome): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE treatments SET outcome = :outcome WHERE id = :id'
        );
        return $stmt->execute([':outcome' => $this->normalizeOutcome($outcome), ':id' => $id]);
    }
}
