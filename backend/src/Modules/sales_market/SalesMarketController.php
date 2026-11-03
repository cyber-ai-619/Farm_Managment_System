<?php

declare(strict_types=1);

require_once __DIR__ . '/SalesModel.php';
require_once __DIR__ . '/MarketModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * SalesMarketController
 *
 * REST API controller for customers, sales orders, invoices, payments,
 * and market commodity prices.
 */
class SalesMarketController
{
    private SalesModel  $salesModel;
    private MarketModel $marketModel;
    private AuditLogger $audit;

    public function __construct(PDO $pdo)
    {
        $this->salesModel  = new SalesModel($pdo);
        $this->marketModel = new MarketModel($pdo);
        $this->audit       = new AuditLogger($pdo);
    }

    // -------------------------------------------------------------
    // Customers
    // -------------------------------------------------------------

    public function indexCustomers(): void
    {
        requireAuth();
        $farmId = resolveFarmId($_GET['farm_id'] ?? null);
        $customers = $this->salesModel->findCustomers($farmId);
        respond(['success' => true, 'count' => count($customers), 'data' => $customers]);
    }

    public function showCustomer(int $id): void
    {
        requireAuth();
        $customer = $this->salesModel->findCustomerById($id);
        if (!$customer) {
            respond(['success' => false, 'message' => 'Customer not found.'], 404);
        }
        respond(['success' => true, 'data' => $customer]);
    }

    public function storeCustomer(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Customer name is required.'], 422);
        }

        $farmId = resolveFarmId($body['farm_id'] ?? null);
        $id = $this->salesModel->createCustomer($farmId, $body);
        $this->audit->log('customer.created', (int) $user['sub'], 'customers', $id);

        respond(['success' => true, 'message' => 'Customer created successfully.', 'id' => $id], 201);
    }

    public function updateCustomer(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        $existing = $this->salesModel->findCustomerById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $this->salesModel->updateCustomer($id, $body);
        $this->audit->log('customer.updated', (int) $user['sub'], 'customers', $id);

        respond(['success' => true, 'message' => 'Customer updated successfully.']);
    }

    // -------------------------------------------------------------
    // Sales Orders
    // -------------------------------------------------------------

    public function indexOrders(): void
    {
        requireAuth();
        $farmId = resolveFarmId($_GET['farm_id'] ?? null);
        $status = $_GET['status'] ?? null;

        $orders = $this->salesModel->findOrders($farmId, $status);
        respond(['success' => true, 'count' => count($orders), 'data' => $orders]);
    }

    public function showOrder(int $id): void
    {
        requireAuth();
        $order = $this->salesModel->findOrderById($id);
        if (!$order) {
            respond(['success' => false, 'message' => 'Sales order not found.'], 404);
        }
        respond(['success' => true, 'data' => $order]);
    }

    public function storeOrder(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['customer_id'])) {
            respond(['success' => false, 'message' => 'customer_id is required.'], 422);
        }

        $farmId = resolveFarmId($body['farm_id'] ?? null);
        $items  = $body['items'] ?? [];

        try {
            $id = $this->salesModel->createOrder($farmId, (int) $user['sub'], $body, $items);
            $this->audit->log('sales_order.created', (int) $user['sub'], 'sales_orders', $id);
            respond(['success' => true, 'message' => 'Sales order created with invoice.', 'id' => $id], 201);
        } catch (Throwable $e) {
            respond(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function updateOrderStatus(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['status'])) {
            respond(['success' => false, 'message' => 'status is required.'], 422);
        }

        $existing = $this->salesModel->findOrderById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Sales order not found.'], 404);
        }

        $this->salesModel->updateOrderStatus($id, (string) $body['status']);
        $this->audit->log('sales_order.status_updated', (int) $user['sub'], 'sales_orders', $id);

        respond(['success' => true, 'message' => 'Sales order status updated.']);
    }

    // -------------------------------------------------------------
    // Invoices & Payments
    // -------------------------------------------------------------

    public function indexInvoices(): void
    {
        requireAuth();
        $farmId = resolveFarmId($_GET['farm_id'] ?? null);
        $status = $_GET['status'] ?? null;

        $invoices = $this->salesModel->findInvoices($farmId, $status);
        respond(['success' => true, 'count' => count($invoices), 'data' => $invoices]);
    }

    public function showInvoice(int $id): void
    {
        requireAuth();
        $invoice = $this->salesModel->findInvoiceById($id);
        if (!$invoice) {
            respond(['success' => false, 'message' => 'Invoice not found.'], 404);
        }
        respond(['success' => true, 'data' => $invoice]);
    }

    public function storePayment(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['invoice_id']) || !isset($body['amount'])) {
            respond(['success' => false, 'message' => 'invoice_id and amount are required.'], 422);
        }

        try {
            $paymentId = $this->salesModel->recordPayment((int) $body['invoice_id'], (int) $user['sub'], $body);
            $this->audit->log('payment.recorded', (int) $user['sub'], 'payments', $paymentId);
            respond(['success' => true, 'message' => 'Payment recorded successfully.', 'id' => $paymentId], 201);
        } catch (Throwable $e) {
            respond(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // -------------------------------------------------------------
    // Market Commodity Prices
    // -------------------------------------------------------------

    public function indexPrices(): void
    {
        requireAuth();
        $commodity = $_GET['commodity'] ?? null;
        $location  = $_GET['location'] ?? null;

        $prices = $this->marketModel->getPrices($commodity, $location);
        respond(['success' => true, 'count' => count($prices), 'data' => $prices]);
    }

    public function storePrice(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant', 'agronomist']);
        $body = $this->jsonBody();

        $hasCommodity = !empty($body['commodity_name']) || !empty($body['crop_id']);
        $hasLocation  = !empty($body['market_location']) || !empty($body['market_name']);
        $hasPrice     = (isset($body['price_per_unit']) && $body['price_per_unit'] !== '') || (isset($body['price']) && $body['price'] !== '');

        if (!$hasCommodity || !$hasLocation || !$hasPrice) {
            respond(['success' => false, 'message' => 'commodity_name (or crop_id), market_location (or market_name), and price_per_unit (or price) are required.'], 422);
        }

        $id = $this->marketModel->createPrice($body);
        $this->audit->log('market_price.recorded', (int) $user['sub'], 'market_prices', $id);

        respond(['success' => true, 'message' => 'Market price recorded successfully.', 'id' => $id], 201);
    }

    public function trends(): void
    {
        requireAuth();
        $commodity = trim($_GET['commodity'] ?? '');
        if ($commodity === '') {
            $commodity = 'Maize';
        }

        $trends = $this->marketModel->getTrends($commodity);
        respond(['success' => true, 'commodity' => $commodity, 'count' => count($trends), 'data' => $trends]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
