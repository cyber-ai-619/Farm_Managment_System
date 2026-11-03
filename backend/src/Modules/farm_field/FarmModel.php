<?php
// backend/src/Modules/farm_field/FarmModel.php

class FarmModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // -------------------------------------------------------------------------
    // READ
    // -------------------------------------------------------------------------

    /** Return all farms (admin) or only farms owned by a specific user. */
    public function getAll(?int $ownerId = null): array
    {
        if ($ownerId !== null) {
            $stmt = $this->pdo->prepare(
                'SELECT f.*, u.name AS owner_name
                 FROM farms f
                 JOIN users u ON u.id = f.owner_id
                 WHERE f.owner_id = :owner_id
                 ORDER BY f.created_at DESC'
            );
            $stmt->execute([':owner_id' => $ownerId]);
        } else {
            $stmt = $this->pdo->query(
                'SELECT f.*, u.name AS owner_name
                 FROM farms f
                 JOIN users u ON u.id = f.owner_id
                 ORDER BY f.created_at DESC'
            );
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Return all farms accessible by a user (admin sees all, staff/owners see assigned farms). */
    public function getForUser(int $userId, string $role): array
    {
        if ($role === 'admin') {
            return $this->getAll(null);
        }

        try {
            $stmt = $this->pdo->prepare(
                'SELECT DISTINCT f.*, u.name AS owner_name
                 FROM farms f
                 JOIN users u ON u.id = f.owner_id
                 LEFT JOIN farm_members fm ON fm.farm_id = f.id AND fm.user_id = :uid1 AND fm.status = "active"
                 WHERE f.owner_id = :uid2 OR fm.user_id = :uid3
                 ORDER BY f.created_at DESC'
            );
            $stmt->execute([':uid1' => $userId, ':uid2' => $userId, ':uid3' => $userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            // Fallback if farm_members table has not been migrated yet
            return $this->getAll($userId);
        }
    }

    /** Return a single farm by ID (includes owner name). */
    public function getById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT f.*, u.name AS owner_name
             FROM farms f
             JOIN users u ON u.id = f.owner_id
             WHERE f.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $r = $this->getById($id);
        return $r ?: null;
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO farms
                (owner_id, name, location, latitude, longitude, total_area_ha, description)
             VALUES
                (:owner_id, :name, :location, :latitude, :longitude, :total_area_ha, :description)'
        );
        $stmt->execute([
            ':owner_id'      => $data['owner_id'],
            ':name'          => $data['name'],
            ':location'      => $data['location']      ?? null,
            ':latitude'      => ($data['latitude'] ?? '') !== '' ? (float) $data['latitude'] : null,
            ':longitude'     => ($data['longitude'] ?? '') !== '' ? (float) $data['longitude'] : null,
            ':total_area_ha' => ($data['total_area_ha'] ?? '') !== '' ? (float) $data['total_area_ha'] : null,
            ':description'   => $data['description']   ?? null,
        ]);
        $farmId = (int) $this->pdo->lastInsertId();

        // Also record owner in farm_members junction table
        try {
            $memberStmt = $this->pdo->prepare(
                'INSERT IGNORE INTO farm_members (farm_id, user_id, role_id, status)
                 VALUES (:farm_id, :user_id, 2, "active")'
            );
            $memberStmt->execute([':farm_id' => $farmId, ':user_id' => $data['owner_id']]);
        } catch (\Throwable) {
            // Table may not exist yet in unmigrated environments
        }

        return $farmId;
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE farms SET
                name          = :name,
                location      = :location,
                latitude      = :latitude,
                longitude     = :longitude,
                total_area_ha = :total_area_ha,
                description   = :description,
                is_active     = :is_active
             WHERE id = :id'
        );
        return $stmt->execute([
            ':name'          => $data['name'],
            ':location'      => $data['location']      ?? null,
            ':latitude'      => ($data['latitude'] ?? '') !== '' ? (float) $data['latitude'] : null,
            ':longitude'     => ($data['longitude'] ?? '') !== '' ? (float) $data['longitude'] : null,
            ':total_area_ha' => ($data['total_area_ha'] ?? '') !== '' ? (float) $data['total_area_ha'] : null,
            ':description'   => $data['description']   ?? null,
            ':is_active'     => $data['is_active']     ?? 1,
            ':id'            => $id,
        ]);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM farms WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // -------------------------------------------------------------------------
    // OWNERSHIP & ACCESS CHECK
    // -------------------------------------------------------------------------

    /** Returns true if the given user owns this farm. */
    public function ownedBy(int $farmId, int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM farms WHERE id = :farm_id AND owner_id = :user_id LIMIT 1'
        );
        $stmt->execute([':farm_id' => $farmId, ':user_id' => $userId]);
        return (bool) $stmt->fetch();
    }

    /** Returns true if user has access to farm (owner, staff member, or admin). */
    public function hasAccess(int $farmId, int $userId, string $role): bool
    {
        if ($role === 'admin') {
            return true;
        }
        if ($this->ownedBy($farmId, $userId)) {
            return true;
        }

        try {
            $stmt = $this->pdo->prepare(
                'SELECT id FROM farm_members WHERE farm_id = :farm_id AND user_id = :user_id AND status = "active" LIMIT 1'
            );
            $stmt->execute([':farm_id' => $farmId, ':user_id' => $userId]);
            return (bool) $stmt->fetch();
        } catch (\Throwable) {
            return false;
        }
    }
}
