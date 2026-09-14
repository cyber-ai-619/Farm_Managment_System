<?php
// backend/src/Modules/farm_field/FieldModel.php

class FieldModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // FIELDS
    // =========================================================================

    /** All fields belonging to a farm. */
    public function getAllByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM fields WHERE farm_id = :farm_id ORDER BY name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Single field by ID. */
    public function getFieldById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM fields WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createField(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO fields
                (farm_id, name, area_ha, soil_type, soil_condition, soil_ph,
                 latitude, longitude, gps_boundary, description)
             VALUES
                (:farm_id, :name, :area_ha, :soil_type, :soil_condition, :soil_ph,
                 :latitude, :longitude, :gps_boundary, :description)'
        );
        $stmt->execute([
            ':farm_id'       => $data['farm_id'],
            ':name'          => $data['name'],
            ':area_ha'       => $data['area_ha']       ?? null,
            ':soil_type'     => $data['soil_type']     ?? null,
            ':soil_condition'=> $data['soil_condition'] ?? 'good',
            ':soil_ph'       => $data['soil_ph']       ?? null,
            ':latitude'      => $data['latitude']      ?? null,
            ':longitude'     => $data['longitude']     ?? null,
            ':gps_boundary'  => $data['gps_boundary']  ?? null,
            ':description'   => $data['description']   ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateField(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE fields SET
                name           = :name,
                area_ha        = :area_ha,
                soil_type      = :soil_type,
                soil_condition = :soil_condition,
                soil_ph        = :soil_ph,
                latitude       = :latitude,
                longitude      = :longitude,
                gps_boundary   = :gps_boundary,
                description    = :description,
                is_active      = :is_active
             WHERE id = :id'
        );
        return $stmt->execute([
            ':name'          => $data['name'],
            ':area_ha'       => $data['area_ha']        ?? null,
            ':soil_type'     => $data['soil_type']      ?? null,
            ':soil_condition'=> $data['soil_condition']  ?? 'good',
            ':soil_ph'       => $data['soil_ph']        ?? null,
            ':latitude'      => $data['latitude']       ?? null,
            ':longitude'     => $data['longitude']      ?? null,
            ':gps_boundary'  => $data['gps_boundary']   ?? null,
            ':description'   => $data['description']    ?? null,
            ':is_active'     => $data['is_active']      ?? 1,
            ':id'            => $id,
        ]);
    }

    public function deleteField(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM fields WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // =========================================================================
    // PLOTS
    // =========================================================================

    public function getPlotsByField(int $fieldId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM plots WHERE field_id = :field_id ORDER BY name ASC'
        );
        $stmt->execute([':field_id' => $fieldId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPlotById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM plots WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createPlot(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO plots (field_id, name, area_ha, description)
             VALUES (:field_id, :name, :area_ha, :description)'
        );
        $stmt->execute([
            ':field_id'    => $data['field_id'],
            ':name'        => $data['name'],
            ':area_ha'     => $data['area_ha']     ?? null,
            ':description' => $data['description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updatePlot(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE plots SET
                name        = :name,
                area_ha     = :area_ha,
                description = :description,
                is_active   = :is_active
             WHERE id = :id'
        );
        return $stmt->execute([
            ':name'        => $data['name'],
            ':area_ha'     => $data['area_ha']     ?? null,
            ':description' => $data['description'] ?? null,
            ':is_active'   => $data['is_active']   ?? 1,
            ':id'          => $id,
        ]);
    }

    public function deletePlot(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM plots WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // -------------------------------------------------------------------------
    // HELPER — verify a field belongs to a farm (used in controllers)
    // -------------------------------------------------------------------------
    public function fieldBelongsToFarm(int $fieldId, int $farmId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM fields WHERE id = :field_id AND farm_id = :farm_id LIMIT 1'
        );
        $stmt->execute([':field_id' => $fieldId, ':farm_id' => $farmId]);
        return (bool) $stmt->fetch();
    }
}
