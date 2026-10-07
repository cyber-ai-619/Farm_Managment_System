<?php

declare(strict_types=1);

/**
 * SupplierModel
 *
 * Database operations for farm suppliers catalog and price quotations.
 */
class SupplierModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findAll(int $farmId, ?string $category = null): array
    {
        $sql = 'SELECT * FROM suppliers WHERE farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($category !== null && $category !== '') {
            $sql .= ' AND category = :category';
            $params[':category'] = $category;
        }

        $sql .= ' ORDER BY name ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM suppliers WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$supplier) {
            return null;
        }
        $supplier['quotations'] = $this->findQuotations($id);
        return $supplier;
    }

    public function create(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO suppliers (farm_id, name, category, contact_person, phone, email, address, tax_id, rating, payment_terms_days, is_active, notes)
             VALUES (:farm_id, :name, :category, :contact_person, :phone, :email, :address, :tax_id, :rating, :payment_terms_days, :is_active, :notes)'
        );
        $stmt->execute([
            ':farm_id'            => $farmId,
            ':name'               => $data['name'],
            ':category'           => $data['category'] ?? 'general',
            ':contact_person'     => $data['contact_person'] ?? null,
            ':phone'              => $data['phone'] ?? null,
            ':email'              => $data['email'] ?? null,
            ':address'            => $data['address'] ?? null,
            ':tax_id'             => $data['tax_id'] ?? null,
            ':rating'             => $data['rating'] ?? 5.00,
            ':payment_terms_days' => $data['payment_terms_days'] ?? 30,
            ':is_active'          => isset($data['is_active']) ? (int) $data['is_active'] : 1,
            ':notes'              => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $allowed = ['name', 'category', 'contact_person', 'phone', 'email', 'address', 'tax_id', 'rating', 'payment_terms_days', 'is_active', 'notes'];
        $fields  = [];
        $params  = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = 'UPDATE suppliers SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    // -------------------------------------------------------------
    // Quotations
    // -------------------------------------------------------------

    public function findQuotations(int $supplierId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM supplier_quotations WHERE supplier_id = :supplier_id ORDER BY created_at DESC'
        );
        $stmt->execute([':supplier_id' => $supplierId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createQuotation(int $supplierId, int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO supplier_quotations (supplier_id, farm_id, item_description, quoted_price, unit, valid_until, notes)
             VALUES (:supplier_id, :farm_id, :item_description, :quoted_price, :unit, :valid_until, :notes)'
        );
        $stmt->execute([
            ':supplier_id'      => $supplierId,
            ':farm_id'          => $farmId,
            ':item_description' => $data['item_description'],
            ':quoted_price'     => $data['quoted_price'],
            ':unit'             => $data['unit'] ?? 'units',
            ':valid_until'      => $data['valid_until'] ?? null,
            ':notes'            => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
