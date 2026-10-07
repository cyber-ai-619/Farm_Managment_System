<?php

declare(strict_types=1);

/**
 * FinanceModel
 *
 * Database operations for income, expense tracking, loans, budgets,
 * and profit & loss calculation.
 */
class FinanceModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // -------------------------------------------------------------
    // Income
    // -------------------------------------------------------------

    public function findIncome(int $farmId, ?string $category = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = 'SELECT i.*, u.name AS recorded_by_name
                FROM income_records i
                JOIN users u ON u.id = i.recorded_by
                WHERE i.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($category !== null && $category !== '') {
            $sql .= ' AND i.category = :category';
            $params[':category'] = $category;
        }
        if ($startDate !== null && $startDate !== '') {
            $sql .= ' AND i.date_received >= :start_date';
            $params[':start_date'] = $startDate;
        }
        if ($endDate !== null && $endDate !== '') {
            $sql .= ' AND i.date_received <= :end_date';
            $params[':end_date'] = $endDate;
        }

        $sql .= ' ORDER BY i.date_received DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createIncome(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO income_records (farm_id, recorded_by, category, amount, date_received, payment_method, reference_type, reference_id, payer_name, description)
             VALUES (:farm_id, :recorded_by, :category, :amount, :date_received, :payment_method, :reference_type, :reference_id, :payer_name, :description)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':category'       => $data['category'] ?? 'crop_sales',
            ':amount'         => $data['amount'],
            ':date_received'  => $data['date_received'] ?? date('Y-m-d'),
            ':payment_method' => $data['payment_method'] ?? 'bank_transfer',
            ':reference_type' => $data['reference_type'] ?? null,
            ':reference_id'   => $data['reference_id'] ?? null,
            ':payer_name'     => $data['payer_name'] ?? null,
            ':description'    => $data['description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // -------------------------------------------------------------
    // Expenses
    // -------------------------------------------------------------

    public function findExpenses(int $farmId, ?string $category = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = 'SELECT e.*, u.name AS recorded_by_name
                FROM expense_records e
                JOIN users u ON u.id = e.recorded_by
                WHERE e.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($category !== null && $category !== '') {
            $sql .= ' AND e.category = :category';
            $params[':category'] = $category;
        }
        if ($startDate !== null && $startDate !== '') {
            $sql .= ' AND e.date_incurred >= :start_date';
            $params[':start_date'] = $startDate;
        }
        if ($endDate !== null && $endDate !== '') {
            $sql .= ' AND e.date_incurred <= :end_date';
            $params[':end_date'] = $endDate;
        }

        $sql .= ' ORDER BY e.date_incurred DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createExpense(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO expense_records (farm_id, recorded_by, category, amount, date_incurred, payment_method, vendor_name, reference_type, reference_id, description)
             VALUES (:farm_id, :recorded_by, :category, :amount, :date_incurred, :payment_method, :vendor_name, :reference_type, :reference_id, :description)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':category'       => $data['category'],
            ':amount'         => $data['amount'],
            ':date_incurred'  => $data['date_incurred'] ?? date('Y-m-d'),
            ':payment_method' => $data['payment_method'] ?? 'bank_transfer',
            ':vendor_name'    => $data['vendor_name'] ?? null,
            ':reference_type' => $data['reference_type'] ?? null,
            ':reference_id'   => $data['reference_id'] ?? null,
            ':description'    => $data['description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // -------------------------------------------------------------
    // Profit & Loss Aggregation
    // -------------------------------------------------------------

    public function getProfitLoss(int $farmId, ?string $startDate = null, ?string $endDate = null): array
    {
        $incSql = 'SELECT category, SUM(amount) AS total FROM income_records WHERE farm_id = :farm_id';
        $expSql = 'SELECT category, SUM(amount) AS total FROM expense_records WHERE farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($startDate !== null && $startDate !== '') {
            $incSql .= ' AND date_received >= :start_date';
            $expSql .= ' AND date_incurred >= :start_date';
            $params[':start_date'] = $startDate;
        }
        if ($endDate !== null && $endDate !== '') {
            $incSql .= ' AND date_received <= :end_date';
            $expSql .= ' AND date_incurred <= :end_date';
            $params[':end_date'] = $endDate;
        }

        $incSql .= ' GROUP BY category';
        $expSql .= ' GROUP BY category';

        $incStmt = $this->pdo->prepare($incSql);
        $incStmt->execute($params);
        $incomeBreakdown = $incStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $expStmt = $this->pdo->prepare($expSql);
        $expStmt->execute($params);
        $expenseBreakdown = $expStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $totalIncome = array_sum(array_map('floatval', $incomeBreakdown));
        $totalExpense = array_sum(array_map('floatval', $expenseBreakdown));
        $netProfit = $totalIncome - $totalExpense;
        $profitMarginPct = ($totalIncome > 0) ? round(($netProfit / $totalIncome) * 100, 2) : 0.0;

        return [
            'farm_id'             => $farmId,
            'start_date'          => $startDate,
            'end_date'            => $endDate,
            'total_income'        => round($totalIncome, 2),
            'total_expense'       => round($totalExpense, 2),
            'net_profit'          => round($netProfit, 2),
            'profit_margin_pct'   => $profitMarginPct,
            'income_by_category'  => $incomeBreakdown,
            'expense_by_category' => $expenseBreakdown,
        ];
    }

    // -------------------------------------------------------------
    // Loans
    // -------------------------------------------------------------

    public function findLoans(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT l.*, u.name AS recorded_by_name
             FROM loans l
             JOIN users u ON u.id = l.recorded_by
             WHERE l.farm_id = :farm_id
             ORDER BY l.start_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findLoanById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM loans WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createLoan(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO loans (farm_id, recorded_by, lender_name, principal_amount, interest_rate_pct, loan_term_months, start_date, end_date, monthly_payment, balance_remaining, status, notes)
             VALUES (:farm_id, :recorded_by, :lender_name, :principal_amount, :interest_rate_pct, :loan_term_months, :start_date, :end_date, :monthly_payment, :balance_remaining, :status, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':recorded_by'       => $userId,
            ':lender_name'       => $data['lender_name'],
            ':principal_amount'  => $data['principal_amount'],
            ':interest_rate_pct' => $data['interest_rate_pct'] ?? 0.00,
            ':loan_term_months'  => $data['loan_term_months'] ?? 12,
            ':start_date'        => $data['start_date'] ?? date('Y-m-d'),
            ':end_date'          => $data['end_date'] ?? date('Y-m-d', strtotime('+12 months')),
            ':monthly_payment'   => $data['monthly_payment'] ?? 0.00,
            ':balance_remaining' => $data['balance_remaining'] ?? $data['principal_amount'],
            ':status'            => $data['status'] ?? 'active',
            ':notes'             => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateLoan(int $id, array $data): bool
    {
        $allowed = ['monthly_payment', 'balance_remaining', 'status', 'notes'];
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

        $sql = 'UPDATE loans SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    // -------------------------------------------------------------
    // Budgets
    // -------------------------------------------------------------

    public function findBudgets(int $farmId, ?int $fiscalYear = null): array
    {
        $sql = 'SELECT b.*, u.name AS created_by_name
                FROM budgets b
                JOIN users u ON u.id = b.created_by
                WHERE b.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($fiscalYear !== null) {
            $sql .= ' AND b.fiscal_year = :fiscal_year';
            $params[':fiscal_year'] = $fiscalYear;
        }

        $sql .= ' ORDER BY b.fiscal_year DESC, b.category ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createBudget(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO budgets (farm_id, created_by, fiscal_year, period_name, category, budgeted_amount, actual_amount, notes)
             VALUES (:farm_id, :created_by, :fiscal_year, :period_name, :category, :budgeted_amount, :actual_amount, :notes)'
        );
        $stmt->execute([
            ':farm_id'         => $farmId,
            ':created_by'      => $userId,
            ':fiscal_year'     => $data['fiscal_year'] ?? (int) date('Y'),
            ':period_name'     => $data['period_name'] ?? 'Annual',
            ':category'        => $data['category'],
            ':budgeted_amount' => $data['budgeted_amount'],
            ':actual_amount'   => $data['actual_amount'] ?? 0.00,
            ':notes'           => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateBudget(int $id, array $data): bool
    {
        $allowed = ['budgeted_amount', 'actual_amount', 'notes', 'period_name'];
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

        $sql = 'UPDATE budgets SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
}
