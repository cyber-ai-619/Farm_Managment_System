<?php

declare(strict_types=1);

/**
 * InventoryModel
 *
 * Database queries for farm inventory items, tracking on-hand stock,
 * recording stock-in/stock-out transactions, and flagging low stock.
 */
class InventoryModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByFarm(int $farmId, ?string $category = null): array
    {
        $sql = 'SELECT * FROM inventory_items WHERE farm_id = :farm_id AND is_active = 1';
        $params = [':farm_id' => $farmId];

        if ($category !== null && $category !== '') {
            $sql .= ' AND category = :category';
            $params[':category'] = $category;
        }

        $sql .= ' ORDER BY category ASC, name ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM inventory_items WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findLowStock(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM inventory_items
             WHERE farm_id = :farm_id AND is_active = 1 AND quantity_on_hand <= reorder_level
             ORDER BY quantity_on_hand ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO inventory_items (farm_id, name, category, sku, quantity_on_hand, unit_of_measure, reorder_level, unit_cost, storage_location, expiry_date, supplier_name)
             VALUES (:farm_id, :name, :category, :sku, :quantity_on_hand, :unit_of_measure, :reorder_level, :unit_cost, :storage_location, :expiry_date, :supplier_name)'
        );
        $stmt->execute([
            ':farm_id'          => $farmId,
            ':name'             => $data['name'],
            ':category'         => $data['category'] ?? 'other',
            ':sku'              => $data['sku'] ?? null,
            ':quantity_on_hand' => $data['quantity_on_hand'] ?? 0.00,
            ':unit_of_measure'  => $data['unit_of_measure'] ?? 'units',
            ':reorder_level'    => $data['reorder_level'] ?? 10.00,
            ':unit_cost'        => $data['unit_cost'] ?? 0.00,
            ':storage_location' => $data['storage_location'] ?? null,
            ':expiry_date'      => $data['expiry_date'] ?? null,
            ':supplier_name'    => $data['supplier_name'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE inventory_items
             SET name = :name, category = :category, sku = :sku, unit_of_measure = :unit_of_measure,
                 reorder_level = :reorder_level, unit_cost = :unit_cost, storage_location = :storage_location,
                 expiry_date = :expiry_date, supplier_name = :supplier_name
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'               => $id,
            ':name'             => $data['name'],
            ':category'         => $data['category'] ?? 'other',
            ':sku'              => $data['sku'] ?? null,
            ':unit_of_measure'  => $data['unit_of_measure'] ?? 'units',
            ':reorder_level'    => $data['reorder_level'] ?? 10.00,
            ':unit_cost'        => $data['unit_cost'] ?? 0.00,
            ':storage_location' => $data['storage_location'] ?? null,
            ':expiry_date'      => $data['expiry_date'] ?? null,
            ':supplier_name'    => $data['supplier_name'] ?? null,
        ]);
    }

    public function recordMovement(int $itemId, int $userId, string $type, float $qty, ?float $unitPrice = null, ?string $notes = null): int
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO stock_movements (item_id, recorded_by, movement_type, quantity, unit_price, notes)
                 VALUES (:item_id, :recorded_by, :type, :qty, :unit_price, :notes)'
            );
            $stmt->execute([
                ':item_id'     => $itemId,
                ':recorded_by' => $userId,
                ':type'        => $type,
                ':qty'         => $qty,
                ':unit_price'  => $unitPrice,
                ':notes'       => $notes,
            ]);
            $movementId = (int) $this->pdo->lastInsertId();

            // Adjust quantity_on_hand
            $delta = in_array($type, ['stock_in', 'adjustment'], true) ? $qty : -$qty;
            $updateStmt = $this->pdo->prepare(
                'UPDATE inventory_items SET quantity_on_hand = GREATEST(0, quantity_on_hand + :delta) WHERE id = :id'
            );
            $updateStmt->execute([':delta' => $delta, ':id' => $itemId]);

            $this->pdo->commit();
            return $movementId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function findMovements(int $itemId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT m.*, u.name AS recorded_by_name
             FROM stock_movements m
             JOIN users u ON u.id = m.recorded_by
             WHERE m.item_id = :item_id
             ORDER BY m.created_at DESC'
        );
        $stmt->execute([':item_id' => $itemId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
