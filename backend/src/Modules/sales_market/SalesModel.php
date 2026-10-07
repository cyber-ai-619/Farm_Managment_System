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

    public function findCustomers(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM customers WHERE farm_id = :farm_id ORDER BY name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findCustomerById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM customers WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createCustomer(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO customers (farm_id, name, type, contact_person, phone, email, address, tax_number, credit_limit, is_active, notes)
             VALUES (:farm_id, :name, :type, :contact_person, :phone, :email, :address, :tax_number, :credit_limit, :is_active, :notes)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':name'           => $data['name'],
            ':type'           => $data['type'] ?? 'wholesaler',
            ':contact_person' => $data['contact_person'] ?? null,
            ':phone'          => $data['phone'] ?? null,
            ':email'          => $data['email'] ?? null,
            ':address'        => $data['address'] ?? null,
            ':tax_number'     => $data['tax_number'] ?? null,
            ':credit_limit'   => $data['credit_limit'] ?? 0.00,
            ':is_active'      => isset($data['is_active']) ? (int) $data['is_active'] : 1,
            ':notes'          => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateCustomer(int $id, array $data): bool
    {
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
            $orderNumber = $data['order_number'] ?? ('ORD-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3))));
            $totalAmount = 0.00;

            // Calculate total from items
            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 0);
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $totalAmount += ($qty * $unitPrice);
            }
            if (isset($data['total_amount']) && (float)$data['total_amount'] > 0) {
                $totalAmount = (float)$data['total_amount'];
            }

            $stmt = $this->pdo->prepare(
                'INSERT INTO sales_orders (farm_id, customer_id, created_by, order_number, order_date, delivery_date, status, total_amount, notes)
                 VALUES (:farm_id, :customer_id, :created_by, :order_number, :order_date, :delivery_date, :status, :total_amount, :notes)'
            );
            $stmt->execute([
                ':farm_id'       => $farmId,
                ':customer_id'   => $data['customer_id'],
                ':created_by'    => $userId,
                ':order_number'  => $orderNumber,
                ':order_date'    => $data['order_date'] ?? date('Y-m-d'),
                ':delivery_date' => $data['delivery_date'] ?? null,
                ':status'        => $data['status'] ?? 'draft',
                ':total_amount'  => $totalAmount,
                ':notes'         => $data['notes'] ?? null,
            ]);
            $orderId = (int) $this->pdo->lastInsertId();

            // Insert line items
            $itemStmt = $this->pdo->prepare(
                'INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit, unit_price, total_price)
                 VALUES (:order_id, :item_type, :item_id, :item_name, :quantity, :unit, :unit_price, :total_price)'
            );
            foreach ($items as $item) {
                $qty = (float) ($item['quantity'] ?? 1);
                $price = (float) ($item['unit_price'] ?? 0);
                $lineTotal = (float) ($item['total_price'] ?? ($qty * $price));

                $itemStmt->execute([
                    ':order_id'    => $orderId,
                    ':item_type'   => $item['item_type'] ?? 'crop',
                    ':item_id'     => $item['item_id'] ?? null,
                    ':item_name'   => $item['item_name'],
                    ':quantity'    => $qty,
                    ':unit'        => $item['unit'] ?? 'kg',
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
                ':customer_id'    => $data['customer_id'],
                ':invoice_number' => $invNumber,
                ':issue_date'     => $data['order_date'] ?? date('Y-m-d'),
                ':due_date'       => $data['due_date'] ?? date('Y-m-d', strtotime('+30 days')),
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
        $stmt = $this->pdo->prepare('UPDATE sales_orders SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $orderId]);
    }

    // -------------------------------------------------------------
    // Invoices & Payments
    // -------------------------------------------------------------

    public function findInvoices(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT inv.*, c.name AS customer_name, so.order_number
                FROM invoices inv
                JOIN customers c ON c.id = inv.customer_id
                JOIN sales_orders so ON so.id = inv.order_id
                WHERE c.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null) {
            $sql .= ' AND inv.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY inv.issue_date DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findInvoiceById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT inv.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, so.order_number
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
        $stmt = $this->pdo->prepare('SELECT * FROM invoices WHERE order_id = :order_id LIMIT 1');
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

            $stmt = $this->pdo->prepare(
                'INSERT INTO payments (invoice_id, customer_id, recorded_by, amount, payment_method, payment_date, reference_number, notes)
                 VALUES (:invoice_id, :customer_id, :recorded_by, :amount, :payment_method, :payment_date, :reference_number, :notes)'
            );
            $stmt->execute([
                ':invoice_id'       => $invoiceId,
                ':customer_id'      => $invoice['customer_id'],
                ':recorded_by'      => $userId,
                ':amount'           => $amount,
                ':payment_method'   => $data['payment_method'] ?? 'bank_transfer',
                ':payment_date'     => $data['payment_date'] ?? date('Y-m-d'),
                ':reference_number' => $data['reference_number'] ?? null,
                ':notes'            => $data['notes'] ?? null,
            ]);
            $paymentId = (int) $this->pdo->lastInsertId();

            // Update invoice amount_paid & status
            $newPaid = (float)$invoice['amount_paid'] + $amount;
            $newStatus = ($newPaid >= (float)$invoice['total_amount']) ? 'paid' : 'partially_paid';

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
