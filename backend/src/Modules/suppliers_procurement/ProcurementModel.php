<?php

declare(strict_types=1);

/**
 * ProcurementModel
 *
 * Database operations for purchase orders and purchase order items.
 */
class ProcurementModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findAll(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT po.*, s.name AS supplier_name, u.name AS created_by_name, a.name AS approved_by_name
                FROM purchase_orders po
                JOIN suppliers s ON s.id = po.supplier_id
                JOIN users u ON u.id = po.created_by
                LEFT JOIN users a ON a.id = po.approved_by
                WHERE po.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null && $status !== '') {
            $sql .= ' AND po.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY po.order_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone, s.email AS supplier_email,
                    u.name AS created_by_name, a.name AS approved_by_name
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             JOIN users u ON u.id = po.created_by
             LEFT JOIN users a ON a.id = po.approved_by
             WHERE po.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $po = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$po) {
            return null;
        }
        $po['items'] = $this->findItems($id);
        return $po;
    }

    public function findItems(int $poId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = :po_id');
        $stmt->execute([':po_id' => $poId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(int $farmId, int $userId, array $data, array $items = []): int
    {
        $this->pdo->beginTransaction();
        try {
            $poNumber = $data['po_number'] ?? ('PO-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3))));
            $totalAmount = 0.00;

            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['unit_price'] ?? 0);
                $totalAmount += ($qty * $price);
            }
            if (isset($data['total_amount']) && (float)$data['total_amount'] > 0) {
                $totalAmount = (float)$data['total_amount'];
            }

            $stmt = $this->pdo->prepare(
                'INSERT INTO purchase_orders (farm_id, supplier_id, created_by, po_number, order_date, expected_delivery_date, status, total_amount, notes)
                 VALUES (:farm_id, :supplier_id, :created_by, :po_number, :order_date, :expected_delivery_date, :status, :total_amount, :notes)'
            );
            $stmt->execute([
                ':farm_id'                => $farmId,
                ':supplier_id'            => $data['supplier_id'],
                ':created_by'             => $userId,
                ':po_number'              => $poNumber,
                ':order_date'             => $data['order_date'] ?? date('Y-m-d'),
                ':expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                ':status'                 => $data['status'] ?? 'draft',
                ':total_amount'           => $totalAmount,
                ':notes'                  => $data['notes'] ?? null,
            ]);
            $poId = (int) $this->pdo->lastInsertId();

            $itemStmt = $this->pdo->prepare(
                'INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit, unit_price, total_price)
                 VALUES (:po_id, :description, :quantity, :unit, :unit_price, :total_price)'
            );
            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 1);
                $price = (float) ($item['unit_price'] ?? 0);
                $lineTotal = (float) ($item['total_price'] ?? ($qty * $price));

                $itemStmt->execute([
                    ':po_id'       => $poId,
                    ':description' => $item['description'],
                    ':quantity'    => $qty,
                    ':unit'        => $item['unit'] ?? 'units',
                    ':unit_price'  => $price,
                    ':total_price' => $lineTotal,
                ]);
            }

            $this->pdo->commit();
            return $poId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function updateStatus(int $id, string $status, ?int $approvedBy = null): bool
    {
        if ($status === 'approved' && $approvedBy !== null) {
            $stmt = $this->pdo->prepare('UPDATE purchase_orders SET status = :status, approved_by = :approved_by WHERE id = :id');
            return $stmt->execute([':status' => $status, ':approved_by' => $approvedBy, ':id' => $id]);
        }
        $stmt = $this->pdo->prepare('UPDATE purchase_orders SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }
}
