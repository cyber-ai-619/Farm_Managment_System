<?php

declare(strict_types=1);

require_once __DIR__ . '/SupplierModel.php';
require_once __DIR__ . '/ProcurementModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * SuppliersProcurementController
 *
 * REST API controller for managing farm suppliers, price quotes,
 * purchase orders, and procurement workflows.
 */
class SuppliersProcurementController
{
    private SupplierModel    $supplierModel;
    private ProcurementModel $procurementModel;
    private AuditLogger      $audit;

    public function __construct(PDO $pdo)
    {
        $this->supplierModel    = new SupplierModel($pdo);
        $this->procurementModel = new ProcurementModel($pdo);
        $this->audit            = new AuditLogger($pdo);
    }

    // -------------------------------------------------------------
    // Suppliers
    // -------------------------------------------------------------

    public function indexSuppliers(): void
    {
        requireAuth();
        $farmId   = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $category = $_GET['category'] ?? null;

        $suppliers = $this->supplierModel->findAll($farmId, $category);
        respond(['success' => true, 'count' => count($suppliers), 'data' => $suppliers]);
    }

    public function showSupplier(int $id): void
    {
        requireAuth();
        $supplier = $this->supplierModel->findById($id);
        if (!$supplier) {
            respond(['success' => false, 'message' => 'Supplier not found.'], 404);
        }
        respond(['success' => true, 'data' => $supplier]);
    }

    public function storeSupplier(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['name'])) {
            respond(['success' => false, 'message' => 'Supplier name is required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->supplierModel->create($farmId, $body);
        $this->audit->log('supplier.created', (int) $user['sub'], 'suppliers', $id);

        respond(['success' => true, 'message' => 'Supplier created successfully.', 'id' => $id], 201);
    }

    public function updateSupplier(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        $existing = $this->supplierModel->findById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Supplier not found.'], 404);
        }

        $this->supplierModel->update($id, $body);
        $this->audit->log('supplier.updated', (int) $user['sub'], 'suppliers', $id);

        respond(['success' => true, 'message' => 'Supplier updated successfully.']);
    }

    public function indexQuotations(int $supplierId): void
    {
        requireAuth();
        $quotes = $this->supplierModel->findQuotations($supplierId);
        respond(['success' => true, 'count' => count($quotes), 'data' => $quotes]);
    }

    public function storeQuotation(int $supplierId): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['item_description']) || !isset($body['quoted_price'])) {
            respond(['success' => false, 'message' => 'item_description and quoted_price are required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->supplierModel->createQuotation($supplierId, $farmId, $body);
        $this->audit->log('quotation.created', (int) $user['sub'], 'supplier_quotations', $id);

        respond(['success' => true, 'message' => 'Quotation added successfully.', 'id' => $id], 201);
    }

    // -------------------------------------------------------------
    // Purchase Orders
    // -------------------------------------------------------------

    public function indexOrders(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $status = $_GET['status'] ?? null;

        $orders = $this->procurementModel->findAll($farmId, $status);
        respond(['success' => true, 'count' => count($orders), 'data' => $orders]);
    }

    public function showOrder(int $id): void
    {
        requireAuth();
        $order = $this->procurementModel->findById($id);
        if (!$order) {
            respond(['success' => false, 'message' => 'Purchase order not found.'], 404);
        }
        respond(['success' => true, 'data' => $order]);
    }

    public function storeOrder(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['supplier_id'])) {
            respond(['success' => false, 'message' => 'supplier_id is required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $items  = $body['items'] ?? [];

        try {
            $id = $this->procurementModel->create($farmId, (int) $user['sub'], $body, $items);
            $this->audit->log('purchase_order.created', (int) $user['sub'], 'purchase_orders', $id);
            respond(['success' => true, 'message' => 'Purchase order created successfully.', 'id' => $id], 201);
        } catch (Throwable $e) {
            respond(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function updateStatus(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['status'])) {
            respond(['success' => false, 'message' => 'status is required.'], 422);
        }

        $status = (string) $body['status'];
        $approvedBy = ($status === 'approved') ? (int) $user['sub'] : null;

        $existing = $this->procurementModel->findById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Purchase order not found.'], 404);
        }

        $this->procurementModel->updateStatus($id, $status, $approvedBy);
        $this->audit->log('purchase_order.status_updated', (int) $user['sub'], 'purchase_orders', $id);

        respond(['success' => true, 'message' => "Purchase order status updated to {$status}."]);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
