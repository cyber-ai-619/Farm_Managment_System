<?php

declare(strict_types=1);

/**
 * SalesModel
 *
 * Database operations for customers, sales orders, order line items,
 * invoices, and payment tracking.
 */
class SalesModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // -------------------------------------------------------------
    // Customers
    // -------------------------------------------------------------

    private function normalizeCustomerType(string $raw): string
    {
        $map = [
            'wholesale'       => 'wholesaler',
            'wholesaler'      => 'wholesaler',
            'retail'          => 'retailer',
            'retailer'        => 'retailer',
            'supermarket'     => 'supermarket',
            'food processor'  => 'processor',
            'processor'       => 'processor',
            'direct_consumer' => 'direct_consumer',
            'export'          => 'export',
        ];
        $key = strtolower(trim($raw));
        return $map[$key] ?? 'other';
    }

    private function normalizeOrderStatus(string $raw): string
    {
        $key = strtolower(trim($raw));
        if ($key === 'pending') {
            $key = 'draft';
        } elseif ($key === 'completed') {
            $key = 'delivered';
        }
        $valid = ['draft', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];
        return in_array($key, $valid, true) ? $key : 'draft';
    }

    public function findCustomers(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT *, type AS customer_type FROM customers WHERE farm_id = :farm_id ORDER BY name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findCustomerById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT *, type AS customer_type FROM customers WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createCustomer(int $farmId, array $data): int
    {
        $type = $this->normalizeCustomerType((string) ($data['type'] ?? ($data['customer_type'] ?? 'wholesaler')));
        $creditLimit = ($data['credit_limit'] ?? '') !== '' ? (float) $data['credit_limit'] : 0.00;

        $stmt = $this->pdo->prepare(
            'INSERT INTO customers (farm_id, name, type, contact_person, phone, email, address, tax_number, credit_limit, is_active, notes)
             VALUES (:farm_id, :name, :type, :contact_person, :phone, :email, :address, :tax_number, :credit_limit, :is_active, :notes)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':name'           => $data['name'],
            ':type'           => $type,
            ':contact_person' => !empty($data['contact_person']) ? $data['contact_person'] : null,
            ':phone'          => !empty($data['phone']) ? $data['phone'] : null,
            ':email'          => !empty($data['email']) ? $data['email'] : null,
            ':address'        => !empty($data['address']) ? $data['address'] : null,
            ':tax_number'     => !empty($data['tax_number']) ? $data['tax_number'] : null,
            ':credit_limit'   => $creditLimit,
            ':is_active'      => isset($data['is_active']) ? (int) $data['is_active'] : 1,
            ':notes'          => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateCustomer(int $id, array $data): bool
    {
        if (!isset($data['type']) && isset($data['customer_type'])) {
            $data['type'] = $data['customer_type'];
        }
        if (isset($data['type'])) {
            $data['type'] = $this->normalizeCustomerType((string) $data['type']);
        }
        if (array_key_exists('credit_limit', $data)) {
            $data['credit_limit'] = ($data['credit_limit'] !== '' && $data['credit_limit'] !== null) ? (float) $data['credit_limit'] : 0.00;
        }

        $allowed = ['name', 'type', 'contact_person', 'phone', 'email', 'address', 'tax_number', 'credit_limit', 'is_active', 'notes'];
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

        $sql = 'UPDATE customers SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    // -------------------------------------------------------------
    // Sales Orders & Items
    // -------------------------------------------------------------

    public function findOrders(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT so.*, c.name AS customer_name, c.email AS customer_email, u.name AS created_by_name
                FROM sales_orders so
                JOIN customers c ON c.id = so.customer_id
                JOIN users u ON u.id = so.created_by
                WHERE so.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null) {
            $sql .= ' AND so.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY so.order_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findOrderById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT so.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address, u.name AS created_by_name
             FROM sales_orders so
             JOIN customers c ON c.id = so.customer_id
             JOIN users u ON u.id = so.created_by
             WHERE so.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            return null;
        }

        $order['items'] = $this->findOrderItems($id);
        $order['invoice'] = $this->findInvoiceByOrderId($id);
        return $order;
    }

    public function findOrderItems(int $orderId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM order_items WHERE order_id = :order_id');
        $stmt->execute([':order_id' => $orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createOrder(int $farmId, int $userId, array $data, array $items = []): int
    {
        $this->pdo->beginTransaction();
        try {
            $orderNumber = !empty($data['order_number']) ? $data['order_number'] : ('ORD-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3))));
            $orderDate = !empty($data['order_date']) ? $data['order_date'] : date('Y-m-d');
            $deliveryDate = !empty($data['delivery_date']) ? $data['delivery_date'] : null;
            $status = $this->normalizeOrderStatus((string) ($data['status'] ?? 'draft'));
            $totalAmount = 0.00;

            // Calculate total from items
            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 0);
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $totalAmount += ($qty * $unitPrice);
            }
            if (isset($data['total_amount']) && (float) $data['total_amount'] > 0) {
                $totalAmount = (float) $data['total_amount'];
            }

            $stmt = $this->pdo->prepare(
                'INSERT INTO sales_orders (farm_id, customer_id, created_by, order_number, order_date, delivery_date, status, total_amount, notes)
                 VALUES (:farm_id, :customer_id, :created_by, :order_number, :order_date, :delivery_date, :status, :total_amount, :notes)'
            );
            $stmt->execute([
                ':farm_id'       => $farmId,
                ':customer_id'   => (int) $data['customer_id'],
                ':created_by'    => $userId,
                ':order_number'  => $orderNumber,
                ':order_date'    => $orderDate,
                ':delivery_date' => $deliveryDate,
                ':status'        => $status,
                ':total_amount'  => $totalAmount,
                ':notes'         => !empty($data['notes']) ? $data['notes'] : null,
            ]);
            $orderId = (int) $this->pdo->lastInsertId();

            // Insert line items
            $itemStmt = $this->pdo->prepare(
                'INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit, unit_price, total_price)
                 VALUES (:order_id, :item_type, :item_id, :item_name, :quantity, :unit, :unit_price, :total_price)'
            );
            $cropLookupStmt = $this->pdo->prepare('SELECT name FROM crops WHERE id = :id LIMIT 1');

            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 1);
                $price = (float) ($item['unit_price'] ?? 0);
                $lineTotal = (float) ($item['total_price'] ?? ($qty * $price));
                $itemId = !empty($item['item_id']) ? (int) $item['item_id'] : (!empty($item['crop_id']) ? (int) $item['crop_id'] : null);
                $itemName = trim((string) ($item['item_name'] ?? ''));

                if ($itemName === '') {
                    if ($itemId !== null) {
                        $cropLookupStmt->execute([':id' => $itemId]);
                        $foundName = $cropLookupStmt->fetchColumn();
                        $itemName = $foundName ? (string) $foundName : "Crop #{$itemId}";
                    } else {
                        $itemName = 'Farm Produce';
                    }
                }

                $itemStmt->execute([
                    ':order_id'    => $orderId,
                    ':item_type'   => !empty($item['item_type']) ? $item['item_type'] : 'crop',
                    ':item_id'     => $itemId,
                    ':item_name'   => $itemName,
                    ':quantity'    => $qty,
                    ':unit'        => !empty($item['unit']) ? $item['unit'] : 'kg',
                    ':unit_price'  => $price,
                    ':total_price' => $lineTotal,
                ]);
            }

            // Automatically create invoice record for this order
            $invNumber = 'INV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
            $invStmt = $this->pdo->prepare(
                'INSERT INTO invoices (order_id, customer_id, invoice_number, issue_date, due_date, subtotal, tax_amount, total_amount, amount_paid, status, notes)
                 VALUES (:order_id, :customer_id, :invoice_number, :issue_date, :due_date, :subtotal, :tax_amount, :total_amount, :amount_paid, :status, :notes)'
            );
            $invStmt->execute([
                ':order_id'       => $orderId,
                ':customer_id'    => (int) $data['customer_id'],
                ':invoice_number' => $invNumber,
                ':issue_date'     => $orderDate,
                ':due_date'       => !empty($data['due_date']) ? $data['due_date'] : date('Y-m-d', strtotime('+30 days')),
                ':subtotal'       => $totalAmount,
                ':tax_amount'     => 0.00,
                ':total_amount'   => $totalAmount,
                ':amount_paid'    => 0.00,
                ':status'         => 'unpaid',
                ':notes'          => 'Generated automatically for order ' . $orderNumber,
            ]);

            $this->pdo->commit();
            return $orderId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function updateOrderStatus(int $orderId, string $status): bool
    {
        $cleanStatus = $this->normalizeOrderStatus($status);
        $stmt = $this->pdo->prepare('UPDATE sales_orders SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $cleanStatus, ':id' => $orderId]);
    }

    // -------------------------------------------------------------
    // Invoices & Payments
    // -------------------------------------------------------------

    public function findInvoices(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT i.*, so.order_number, c.name AS customer_name, i.order_id AS sales_order_id, i.amount_paid AS paid_amount, i.status AS payment_status
                FROM invoices i
                JOIN customers c ON c.id = i.customer_id
                JOIN sales_orders so ON so.id = i.order_id
                WHERE c.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null) {
            $sql .= ' AND i.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY i.issue_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findInvoiceById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT inv.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, so.order_number,
                    inv.order_id AS sales_order_id, inv.amount_paid AS paid_amount, inv.status AS payment_status
             FROM invoices inv
             JOIN customers c ON c.id = inv.customer_id
             JOIN sales_orders so ON so.id = inv.order_id
             WHERE inv.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        $row['payments'] = $this->findPaymentsByInvoice($id);
        return $row;
    }

    public function findInvoiceByOrderId(int $orderId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT *, order_id AS sales_order_id, amount_paid AS paid_amount, status AS payment_status FROM invoices WHERE order_id = :order_id LIMIT 1');
        $stmt->execute([':order_id' => $orderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findPaymentsByInvoice(int $invoiceId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, u.name AS recorded_by_name
             FROM payments p
             JOIN users u ON u.id = p.recorded_by
             WHERE p.invoice_id = :invoice_id
             ORDER BY p.payment_date DESC'
        );
        $stmt->execute([':invoice_id' => $invoiceId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function recordPayment(int $invoiceId, int $userId, array $data): int
    {
        $this->pdo->beginTransaction();
        try {
            $invoice = $this->findInvoiceById($invoiceId);
            if (!$invoice) {
                throw new InvalidArgumentException('Invoice not found.');
            }

            $amount = (float) ($data['amount'] ?? 0);
            if ($amount <= 0) {
                throw new InvalidArgumentException('Payment amount must be greater than zero.');
            }

            $rawMethod = strtolower(str_replace(' ', '_', trim((string) ($data['payment_method'] ?? 'bank_transfer'))));
            $validMethods = ['bank_transfer', 'cash', 'mobile_money', 'cheque', 'credit_card'];
            $paymentMethod = in_array($rawMethod, $validMethods, true) ? $rawMethod : 'bank_transfer';
            $paymentDate = !empty($data['payment_date']) ? $data['payment_date'] : date('Y-m-d');

            $stmt = $this->pdo->prepare(
                'INSERT INTO payments (invoice_id, customer_id, recorded_by, amount, payment_method, payment_date, reference_number, notes)
                 VALUES (:invoice_id, :customer_id, :recorded_by, :amount, :payment_method, :payment_date, :reference_number, :notes)'
            );
            $stmt->execute([
                ':invoice_id'       => $invoiceId,
                ':customer_id'      => $invoice['customer_id'],
                ':recorded_by'      => $userId,
                ':amount'           => $amount,
                ':payment_method'   => $paymentMethod,
                ':payment_date'     => $paymentDate,
                ':reference_number' => !empty($data['reference_number']) ? $data['reference_number'] : null,
                ':notes'            => !empty($data['notes']) ? $data['notes'] : null,
            ]);
            $paymentId = (int) $this->pdo->lastInsertId();

            // Update invoice amount_paid & status
            $newPaid = (float) $invoice['amount_paid'] + $amount;
            $newStatus = ($newPaid >= (float) $invoice['total_amount']) ? 'paid' : 'partially_paid';

            $upStmt = $this->pdo->prepare(
                'UPDATE invoices SET amount_paid = :paid, status = :status WHERE id = :id'
            );
            $upStmt->execute([
                ':paid'   => $newPaid,
                ':status' => $newStatus,
                ':id'     => $invoiceId,
            ]);

            $this->pdo->commit();
            return $paymentId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
