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
        $sql = 'SELECT i.*, u.name AS recorded_by_name, i.date_received AS transaction_date, COALESCE(i.payer_name, i.reference_type) AS reference_number
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
        $rawCat = strtolower(trim((string) ($data['category'] ?? 'crop_sales')));
        $catMap = [
            'crop sales'             => 'crop_sales',
            'livestock sales'        => 'livestock_sales',
            'agri-tourism'           => 'agritourism',
            'agritourism'            => 'agritourism',
            'consultancy & services' => 'consulting',
            'consulting'             => 'consulting',
            'government subsidies'   => 'subsidies',
            'subsidies'              => 'subsidies',
        ];
        $category = $catMap[$rawCat] ?? str_replace(' ', '_', $rawCat);
        $validCategories = ['crop_sales', 'livestock_sales', 'byproducts', 'subsidies', 'grants', 'machinery_rental', 'agritourism', 'consulting', 'other'];
        if (!in_array($category, $validCategories, true)) {
            $category = 'crop_sales';
        }

        $paymentMethod = strtolower(str_replace(' ', '_', trim((string) ($data['payment_method'] ?? 'bank_transfer'))));
        $validMethods = ['bank_transfer', 'cash', 'mobile_money', 'cheque', 'other'];
        if (!in_array($paymentMethod, $validMethods, true)) {
            $paymentMethod = 'bank_transfer';
        }

        $dateReceived = !empty($data['date_received'])
            ? $data['date_received']
            : (!empty($data['transaction_date']) ? $data['transaction_date'] : date('Y-m-d'));

        $payerName = $data['payer_name'] ?? ($data['reference_number'] ?? null);
        if ($payerName === '') {
            $payerName = null;
        }

        $referenceType = !empty($data['reference_type']) ? $data['reference_type'] : null;
        $referenceId   = ($data['reference_id'] ?? '') !== '' ? (int) $data['reference_id'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO income_records (farm_id, recorded_by, category, amount, date_received, payment_method, reference_type, reference_id, payer_name, description)
             VALUES (:farm_id, :recorded_by, :category, :amount, :date_received, :payment_method, :reference_type, :reference_id, :payer_name, :description)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':category'       => $category,
            ':amount'         => (float) $data['amount'],
            ':date_received'  => $dateReceived,
            ':payment_method' => $paymentMethod,
            ':reference_type' => $referenceType,
            ':reference_id'   => $referenceId,
            ':payer_name'     => $payerName,
            ':description'    => $data['description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // -------------------------------------------------------------
    // Expenses
    // -------------------------------------------------------------

    public function findExpenses(int $farmId, ?string $category = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = 'SELECT e.*, u.name AS recorded_by_name, e.date_incurred AS transaction_date
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
        $rawCat = strtolower(trim((string) ($data['category'] ?? 'other')));
        $catMap = [
            'fertilizer & seeds'     => 'fertilizers',
            'fuel & energy'          => 'fuel',
            'equipment maintenance'  => 'equipment_maintenance',
            'labour & payroll'       => 'labour_wages',
            'pesticides & chemicals' => 'chemicals',
            'packaging & logistics'  => 'packaging',
            'utilities & rent'       => 'utilities',
        ];
        $category = $catMap[$rawCat] ?? str_replace(' ', '_', $rawCat);
        $validCategories = ['seeds', 'fertilizers', 'chemicals', 'animal_feed', 'veterinary', 'fuel', 'labour_wages', 'equipment_maintenance', 'machinery_repairs', 'irrigation_water', 'utilities', 'land_lease', 'insurance', 'packaging', 'transport', 'other'];
        if (!in_array($category, $validCategories, true)) {
            $category = 'other';
        }

        $paymentMethod = strtolower(str_replace(' ', '_', trim((string) ($data['payment_method'] ?? 'bank_transfer'))));
        $validMethods = ['bank_transfer', 'cash', 'mobile_money', 'cheque', 'credit_card', 'other'];
        if (!in_array($paymentMethod, $validMethods, true)) {
            $paymentMethod = 'bank_transfer';
        }

        $dateIncurred = !empty($data['date_incurred'])
            ? $data['date_incurred']
            : (!empty($data['transaction_date']) ? $data['transaction_date'] : date('Y-m-d'));

        $referenceType = !empty($data['reference_type']) ? $data['reference_type'] : null;
        $referenceId   = ($data['reference_id'] ?? '') !== '' ? (int) $data['reference_id'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO expense_records (farm_id, recorded_by, category, amount, date_incurred, payment_method, vendor_name, reference_type, reference_id, description)
             VALUES (:farm_id, :recorded_by, :category, :amount, :date_incurred, :payment_method, :vendor_name, :reference_type, :reference_id, :description)'
        );
        $stmt->execute([
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':category'       => $category,
            ':amount'         => (float) $data['amount'],
            ':date_incurred'  => $dateIncurred,
            ':payment_method' => $paymentMethod,
            ':vendor_name'    => $data['vendor_name'] ?? null,
            ':reference_type' => $referenceType,
            ':reference_id'   => $referenceId,
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
            'SELECT l.*, u.name AS recorded_by_name,
                    l.interest_rate_pct AS interest_rate,
                    l.loan_term_months AS tenor_months,
                    l.notes AS purpose
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
        $stmt = $this->pdo->prepare(
            'SELECT *, interest_rate_pct AS interest_rate, loan_term_months AS tenor_months, notes AS purpose
             FROM loans WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createLoan(int $farmId, int $userId, array $data): int
    {
        $interestRatePct = ($data['interest_rate_pct'] ?? ($data['interest_rate'] ?? '')) !== ''
            ? (float) ($data['interest_rate_pct'] ?? $data['interest_rate'])
            : 0.00;
        $loanTermMonths = ($data['loan_term_months'] ?? ($data['tenor_months'] ?? '')) !== ''
            ? (int) ($data['loan_term_months'] ?? $data['tenor_months'])
            : 12;
        $startDate = !empty($data['start_date']) ? $data['start_date'] : date('Y-m-d');
        $endDate   = !empty($data['end_date']) ? $data['end_date'] : date('Y-m-d', strtotime($startDate . " +{$loanTermMonths} months"));
        $monthlyPayment = ($data['monthly_payment'] ?? '') !== '' ? (float) $data['monthly_payment'] : 0.00;
        $balanceRemaining = ($data['balance_remaining'] ?? '') !== '' ? (float) $data['balance_remaining'] : (float) $data['principal_amount'];

        $status = $data['status'] ?? 'active';
        if (!in_array($status, ['active', 'paid_off', 'defaulted', 'restructured'], true)) {
            $status = 'active';
        }
        $notes = $data['notes'] ?? ($data['purpose'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO loans (farm_id, recorded_by, lender_name, principal_amount, interest_rate_pct, loan_term_months, start_date, end_date, monthly_payment, balance_remaining, status, notes)
             VALUES (:farm_id, :recorded_by, :lender_name, :principal_amount, :interest_rate_pct, :loan_term_months, :start_date, :end_date, :monthly_payment, :balance_remaining, :status, :notes)'
        );
        $stmt->execute([
            ':farm_id'           => $farmId,
            ':recorded_by'       => $userId,
            ':lender_name'       => $data['lender_name'],
            ':principal_amount'  => (float) $data['principal_amount'],
            ':interest_rate_pct' => $interestRatePct,
            ':loan_term_months'  => $loanTermMonths,
            ':start_date'        => $startDate,
            ':end_date'          => $endDate,
            ':monthly_payment'   => $monthlyPayment,
            ':balance_remaining' => $balanceRemaining,
            ':status'            => $status,
            ':notes'             => $notes,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateLoan(int $id, array $data): bool
    {
        if (array_key_exists('interest_rate', $data) && !array_key_exists('interest_rate_pct', $data)) {
            $data['interest_rate_pct'] = $data['interest_rate'];
        }
        if (array_key_exists('tenor_months', $data) && !array_key_exists('loan_term_months', $data)) {
            $data['loan_term_months'] = $data['tenor_months'];
        }
        if (array_key_exists('purpose', $data) && !array_key_exists('notes', $data)) {
            $data['notes'] = $data['purpose'];
        }

        $allowed = ['interest_rate_pct', 'loan_term_months', 'start_date', 'end_date', 'monthly_payment', 'balance_remaining', 'status', 'notes'];
        $fields  = [];
        $params  = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (in_array($field, ['interest_rate_pct', 'monthly_payment', 'balance_remaining'], true)) {
                    $val = $val !== '' && $val !== null ? (float) $val : 0.00;
                } elseif ($field === 'loan_term_months') {
                    $val = $val !== '' && $val !== null ? (int) $val : 12;
                } elseif (in_array($field, ['start_date', 'end_date'], true)) {
                    if ($val === '' || $val === null) {
                        continue;
                    }
                } elseif ($field === 'status') {
                    if (!in_array($val, ['active', 'paid_off', 'defaulted', 'restructured'], true)) {
                        $val = 'active';
                    }
                }
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $val;
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
        $fiscalYear     = ($data['fiscal_year'] ?? '') !== '' ? (int) $data['fiscal_year'] : (int) date('Y');
        $budgetedAmount = ($data['budgeted_amount'] ?? '') !== '' ? (float) $data['budgeted_amount'] : 0.00;
        $actualAmount   = ($data['actual_amount'] ?? '') !== '' ? (float) $data['actual_amount'] : 0.00;

        $stmt = $this->pdo->prepare(
            'INSERT INTO budgets (farm_id, created_by, fiscal_year, period_name, category, budgeted_amount, actual_amount, notes)
             VALUES (:farm_id, :created_by, :fiscal_year, :period_name, :category, :budgeted_amount, :actual_amount, :notes)'
        );
        $stmt->execute([
            ':farm_id'         => $farmId,
            ':created_by'      => $userId,
            ':fiscal_year'     => $fiscalYear,
            ':period_name'     => !empty($data['period_name']) ? $data['period_name'] : 'Annual',
            ':category'        => $data['category'],
            ':budgeted_amount' => $budgetedAmount,
            ':actual_amount'   => $actualAmount,
            ':notes'           => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateBudget(int $id, array $data): bool
    {
        $allowed = ['fiscal_year', 'budgeted_amount', 'actual_amount', 'notes', 'period_name'];
        $fields  = [];
        $params  = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (in_array($field, ['budgeted_amount', 'actual_amount'], true)) {
                    $val = $val !== '' && $val !== null ? (float) $val : 0.00;
                } elseif ($field === 'fiscal_year') {
                    $val = $val !== '' && $val !== null ? (int) $val : (int) date('Y');
                }
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $val;
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
