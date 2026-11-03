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
        $rawType = strtolower(trim((string) ($data['treatment_type'] ?? 'chemical')));
        if ($rawType === 'chemical_spray') {
            $rawType = 'chemical';
        }
        $validTypes = ['chemical', 'biological', 'cultural', 'mechanical', 'organic'];
        $treatmentType = in_array($rawType, $validTypes, true) ? $rawType : 'chemical';

        $rawEff = strtolower(trim((string) ($data['effectiveness'] ?? 'pending')));
        $validEff = ['pending', 'effective', 'partially_effective', 'ineffective'];
        $effectiveness = in_array($rawEff, $validEff, true) ? $rawEff : 'pending';

        $scoutingId = !empty($data['scouting_id']) ? (int) $data['scouting_id'] : null;
        $totalQtyUsed = ($data['total_quantity_used'] ?? '') !== '' ? (float) $data['total_quantity_used'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO pest_treatments (scouting_id, field_id, applied_by, treatment_type, chemical_product, active_ingredient, dosage_rate, total_quantity_used, unit, application_date, pre_harvest_interval_days, re_entry_interval_hours, effectiveness, notes)
             VALUES (:scouting_id, :field_id, :applied_by, :treatment_type, :chemical_product, :active_ingredient, :dosage_rate, :total_quantity_used, :unit, :application_date, :phi, :rei, :effectiveness, :notes)'
        );
        $stmt->execute([
            ':scouting_id'          => $scoutingId,
            ':field_id'             => $fieldId,
            ':applied_by'           => $userId,
            ':treatment_type'       => $treatmentType,
            ':chemical_product'     => $data['chemical_product'],
            ':active_ingredient'    => !empty($data['active_ingredient']) ? $data['active_ingredient'] : null,
            ':dosage_rate'          => $data['dosage_rate'],
            ':total_quantity_used'  => $totalQtyUsed,
            ':unit'                 => !empty($data['unit']) ? $data['unit'] : 'litres',
            ':application_date'     => !empty($data['application_date']) ? $data['application_date'] : date('Y-m-d'),
            ':phi'                  => ($data['pre_harvest_interval_days'] ?? '') !== '' ? (int) $data['pre_harvest_interval_days'] : 0,
            ':rei'                  => ($data['re_entry_interval_hours'] ?? '') !== '' ? (int) $data['re_entry_interval_hours'] : 24,
            ':effectiveness'        => $effectiveness,
            ':notes'                => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateEffectiveness(int $id, string $effectiveness, ?string $notes = null): bool
    {
        $rawEff = strtolower(trim($effectiveness));
        $validEff = ['pending', 'effective', 'partially_effective', 'ineffective'];
        $cleanEff = in_array($rawEff, $validEff, true) ? $rawEff : 'pending';

        $stmt = $this->pdo->prepare(
            'UPDATE pest_treatments SET effectiveness = :effectiveness, notes = COALESCE(:notes, notes) WHERE id = :id'
        );
        return $stmt->execute([
            ':effectiveness' => $cleanEff,
            ':notes'         => ($notes !== '') ? $notes : null,
            ':id'            => $id,
        ]);
    }
}
