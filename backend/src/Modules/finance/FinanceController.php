<?php

declare(strict_types=1);

require_once __DIR__ . '/FinanceModel.php';
require_once __DIR__ . '/../security/AuditLogger.php';

/**
 * FinanceController
 *
 * REST API controller for income, expenses, profit/loss statements,
 * loan obligations, and budget management.
 */
class FinanceController
{
    private FinanceModel $financeModel;
    private AuditLogger  $audit;

    public function __construct(PDO $pdo)
    {
        $this->financeModel = new FinanceModel($pdo);
        $this->audit        = new AuditLogger($pdo);
    }

    // -------------------------------------------------------------
    // Income
    // -------------------------------------------------------------

    public function indexIncome(): void
    {
        requireAuth();
        $farmId    = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $category  = $_GET['category'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate   = $_GET['end_date'] ?? null;

        $income = $this->financeModel->findIncome($farmId, $category, $startDate, $endDate);
        respond(['success' => true, 'count' => count($income), 'data' => $income]);
    }

    public function storeIncome(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (!isset($body['amount']) || (float)$body['amount'] <= 0) {
            respond(['success' => false, 'message' => 'amount must be greater than zero.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->financeModel->createIncome($farmId, (int) $user['sub'], $body);
        $this->audit->log('finance.income_recorded', (int) $user['sub'], 'income_records', $id);

        respond(['success' => true, 'message' => 'Income record created successfully.', 'id' => $id], 201);
    }

    // -------------------------------------------------------------
    // Expenses
    // -------------------------------------------------------------

    public function indexExpenses(): void
    {
        requireAuth();
        $farmId    = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $category  = $_GET['category'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate   = $_GET['end_date'] ?? null;

        $expenses = $this->financeModel->findExpenses($farmId, $category, $startDate, $endDate);
        respond(['success' => true, 'count' => count($expenses), 'data' => $expenses]);
    }

    public function storeExpense(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['category']) || !isset($body['amount']) || (float)$body['amount'] <= 0) {
            respond(['success' => false, 'message' => 'category and positive amount are required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->financeModel->createExpense($farmId, (int) $user['sub'], $body);
        $this->audit->log('finance.expense_recorded', (int) $user['sub'], 'expense_records', $id);

        respond(['success' => true, 'message' => 'Expense record created successfully.', 'id' => $id], 201);
    }

    // -------------------------------------------------------------
    // Profit & Loss
    // -------------------------------------------------------------

    public function profitLoss(): void
    {
        requireAuth();
        $farmId    = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $startDate = $_GET['start_date'] ?? null;
        $endDate   = $_GET['end_date'] ?? null;

        $report = $this->financeModel->getProfitLoss($farmId, $startDate, $endDate);
        respond(['success' => true, 'data' => $report]);
    }

    // -------------------------------------------------------------
    // Loans
    // -------------------------------------------------------------

    public function indexLoans(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $loans  = $this->financeModel->findLoans($farmId);
        respond(['success' => true, 'count' => count($loans), 'data' => $loans]);
    }

    public function storeLoan(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['lender_name']) || !isset($body['principal_amount'])) {
            respond(['success' => false, 'message' => 'lender_name and principal_amount are required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->financeModel->createLoan($farmId, (int) $user['sub'], $body);
        $this->audit->log('loan.created', (int) $user['sub'], 'loans', $id);

        respond(['success' => true, 'message' => 'Loan record created successfully.', 'id' => $id], 201);
    }

    public function updateLoan(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        $existing = $this->financeModel->findLoanById($id);
        if (!$existing) {
            respond(['success' => false, 'message' => 'Loan not found.'], 404);
        }

        $this->financeModel->updateLoan($id, $body);
        $this->audit->log('loan.updated', (int) $user['sub'], 'loans', $id);

        respond(['success' => true, 'message' => 'Loan record updated successfully.']);
    }

    // -------------------------------------------------------------
    // Budgets
    // -------------------------------------------------------------

    public function indexBudgets(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $year   = isset($_GET['fiscal_year']) ? (int) $_GET['fiscal_year'] : null;

        $budgets = $this->financeModel->findBudgets($farmId, $year);
        respond(['success' => true, 'count' => count($budgets), 'data' => $budgets]);
    }

    public function storeBudget(): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        if (empty($body['category']) || !isset($body['budgeted_amount'])) {
            respond(['success' => false, 'message' => 'category and budgeted_amount are required.'], 422);
        }

        $farmId = (int) ($body['farm_id'] ?? 1);
        $id = $this->financeModel->createBudget($farmId, (int) $user['sub'], $body);
        $this->audit->log('budget.created', (int) $user['sub'], 'budgets', $id);

        respond(['success' => true, 'message' => 'Budget entry created successfully.', 'id' => $id], 201);
    }

    public function updateBudget(int $id): void
    {
        $user = requireRole(['admin', 'farm_owner', 'farm_manager', 'accountant']);
        $body = $this->jsonBody();

        $this->financeModel->updateBudget($id, $body);
        $this->audit->log('budget.updated', (int) $user['sub'], 'budgets', $id);

        respond(['success' => true, 'message' => 'Budget entry updated successfully.']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }
}
