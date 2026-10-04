<?php

declare(strict_types=1);

/**
 * TreatmentModel
 *
 * Database operations for chemical applications, spraying schedules,
 * and pest/disease treatment effectiveness records.
 */
class TreatmentModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByField(int $fieldId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.*, u.name AS applied_by_name
             FROM pest_treatments t
             JOIN users u ON u.id = t.applied_by
             WHERE t.field_id = :field_id
             ORDER BY t.application_date DESC'
        );
        $stmt->execute([':field_id' => $fieldId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(int $fieldId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO pest_treatments (scouting_id, field_id, applied_by, treatment_type, chemical_product, active_ingredient, dosage_rate, total_quantity_used, unit, application_date, pre_harvest_interval_days, re_entry_interval_hours, effectiveness, notes)
             VALUES (:scouting_id, :field_id, :applied_by, :treatment_type, :chemical_product, :active_ingredient, :dosage_rate, :total_quantity_used, :unit, :application_date, :phi, :rei, :effectiveness, :notes)'
        );
        $stmt->execute([
            ':scouting_id'          => $data['scouting_id'] ?? null,
            ':field_id'             => $fieldId,
            ':applied_by'           => $userId,
            ':treatment_type'       => $data['treatment_type'] ?? 'chemical_spray',
            ':chemical_product'     => $data['chemical_product'],
            ':active_ingredient'    => $data['active_ingredient'] ?? null,
            ':dosage_rate'          => $data['dosage_rate'],
            ':total_quantity_used'  => $data['total_quantity_used'] ?? null,
            ':unit'                 => $data['unit'] ?? 'litres',
            ':application_date'     => $data['application_date'] ?? date('Y-m-d'),
            ':phi'                  => (int) ($data['pre_harvest_interval_days'] ?? 0),
            ':rei'                  => (int) ($data['re_entry_interval_hours'] ?? 24),
            ':effectiveness'        => $data['effectiveness'] ?? 'pending',
            ':notes'                => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateEffectiveness(int $id, string $effectiveness, ?string $notes = null): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE pest_treatments SET effectiveness = :effectiveness, notes = COALESCE(:notes, notes) WHERE id = :id'
        );
        return $stmt->execute([
            ':effectiveness' => $effectiveness,
            ':notes'         => $notes,
            ':id'            => $id,
        ]);
    }
}
