<?php

declare(strict_types=1);

/**
 * AnalyticsController
 *
 * REST API controller for high-level KPI dashboard metrics,
 * multi-year crop yield analytics, financial trends, and weather vs yield correlations.
 */
class AnalyticsController
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function dashboard(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        // 1. Farm & Land Overview
        $farmStmt = $this->pdo->prepare(
            'SELECT f.id, f.name, f.total_area_ha,
                    (SELECT COUNT(*) FROM fields WHERE farm_id = f.id) AS fields_count,
                    (SELECT COUNT(*) FROM plots p JOIN fields fl ON fl.id = p.field_id WHERE fl.farm_id = f.id) AS plots_count
             FROM farms f
             WHERE f.id = :farm_id
             LIMIT 1'
        );
        $farmStmt->execute([':farm_id' => $farmId]);
        $farmData = $farmStmt->fetch(PDO::FETCH_ASSOC) ?: [
            'id' => $farmId, 'name' => 'Farm', 'total_area_ha' => 0, 'fields_count' => 0, 'plots_count' => 0
        ];

        // 2. Crops & Harvest Summary
        $cropStmt = $this->pdo->prepare(
            'SELECT 
                (SELECT COUNT(*) FROM planting_schedules ps JOIN fields f ON f.id = ps.field_id WHERE f.farm_id = :farm_id AND ps.status IN ("planted","growing")) AS active_plantings,
                (SELECT COALESCE(SUM(quantity_kg), 0) FROM harvest_records WHERE farm_id = :farm_id AND YEAR(harvest_date) = YEAR(CURDATE())) AS ytd_harvest_kg,
                (SELECT COALESCE(SUM(loss_kg), 0) FROM harvest_records WHERE farm_id = :farm_id AND YEAR(harvest_date) = YEAR(CURDATE())) AS ytd_harvest_loss_kg'
        );
        $cropStmt->execute([':farm_id' => $farmId]);
        $cropData = $cropStmt->fetch(PDO::FETCH_ASSOC);

        // 3. Livestock Summary
        $lsStmt = $this->pdo->prepare(
            'SELECT 
                (SELECT COUNT(*) FROM animals WHERE farm_id = :farm_id AND status = "healthy") AS active_animals,
                (SELECT COUNT(*) FROM treatments t JOIN animals a ON a.id = t.animal_id WHERE a.farm_id = :farm_id AND t.treatment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS recent_treatments'
        );
        $lsStmt->execute([':farm_id' => $farmId]);
        $lsData = $lsStmt->fetch(PDO::FETCH_ASSOC);

        // 4. Financial Summary (YTD)
        $finStmt = $this->pdo->prepare(
            'SELECT 
                (SELECT COALESCE(SUM(amount), 0) FROM income_records WHERE farm_id = :farm_id AND YEAR(date_received) = YEAR(CURDATE())) AS total_income,
                (SELECT COALESCE(SUM(amount), 0) FROM expense_records WHERE farm_id = :farm_id AND YEAR(date_incurred) = YEAR(CURDATE())) AS total_expenses,
                (SELECT COALESCE(SUM(balance_remaining), 0) FROM loans WHERE farm_id = :farm_id AND status = "active") AS active_loans_balance'
        );
        $finStmt->execute([':farm_id' => $farmId]);
        $finData = $finStmt->fetch(PDO::FETCH_ASSOC);
        $income = (float) $finData['total_income'];
        $expenses = (float) $finData['total_expenses'];
        $netProfit = $income - $expenses;
        $profitMargin = ($income > 0) ? round(($netProfit / $income) * 100, 2) : 0.0;

        // 5. Inventory & Equipment
        $invStmt = $this->pdo->prepare(
            'SELECT 
                (SELECT COUNT(*) FROM inventory_items WHERE farm_id = :farm_id AND is_active = 1) AS total_inventory_items,
                (SELECT COUNT(*) FROM inventory_items WHERE farm_id = :farm_id AND is_active = 1 AND quantity_on_hand <= reorder_level) AS low_stock_items,
                (SELECT COUNT(*) FROM equipment WHERE farm_id = :farm_id) AS total_equipment,
                (SELECT COUNT(*) FROM equipment WHERE farm_id = :farm_id AND status IN ("maintenance","repair")) AS equipment_in_service'
        );
        $invStmt->execute([':farm_id' => $farmId]);
        $invData = $invStmt->fetch(PDO::FETCH_ASSOC);

        // 6. Labour Summary
        $labStmt = $this->pdo->prepare(
            'SELECT 
                (SELECT COUNT(*) FROM workers WHERE farm_id = :farm_id AND is_active = 1) AS active_workers,
                (SELECT COUNT(*) FROM task_assignments WHERE farm_id = :farm_id AND status != "completed") AS pending_tasks'
        );
        $labStmt->execute([':farm_id' => $farmId]);
        $labData = $labStmt->fetch(PDO::FETCH_ASSOC);

        // 7. Storage Batches Summary
        $stStmt = $this->pdo->prepare(
            'SELECT 
                COALESCE(SUM(sb.quantity_remaining_kg), 0) AS total_stored_kg,
                COALESCE(SUM(sb.quantity_remaining_kg * sb.unit_cost_estimated), 0) AS total_storage_value,
                COALESCE(SUM(sb.spoilage_kg), 0) AS total_storage_spoilage_kg
             FROM storage_batches sb
             JOIN warehouses w ON w.id = sb.warehouse_id
             WHERE w.farm_id = :farm_id AND sb.quantity_remaining_kg > 0'
        );
        $stStmt->execute([':farm_id' => $farmId]);
        $stData = $stStmt->fetch(PDO::FETCH_ASSOC);

        // 8. Latest Weather Observation
        $weathStmt = $this->pdo->prepare(
            'SELECT temperature_c, humidity_pct, rainfall_mm, condition_summary, observed_at
             FROM weather_observations
             WHERE farm_id = :farm_id
             ORDER BY observed_at DESC
             LIMIT 1'
        );
        $weathStmt->execute([':farm_id' => $farmId]);
        $weathData = $weathStmt->fetch(PDO::FETCH_ASSOC);

        // 9. Active Alerts
        $altStmt = $this->pdo->prepare(
            'SELECT COUNT(*) AS total_alerts,
                    SUM(CASE WHEN severity = "critical" THEN 1 ELSE 0 END) AS critical_alerts,
                    SUM(CASE WHEN severity = "warning" THEN 1 ELSE 0 END) AS warning_alerts
             FROM alerts
             WHERE farm_id = :farm_id AND is_dismissed = 0'
        );
        $altStmt->execute([':farm_id' => $farmId]);
        $altData = $altStmt->fetch(PDO::FETCH_ASSOC);

        respond([
            'success' => true,
            'farm_id' => $farmId,
            'data'    => [
                'farm'        => $farmData,
                'crops'       => [
                    'active_plantings'    => (int) $cropData['active_plantings'],
                    'ytd_harvest_kg'      => (float) $cropData['ytd_harvest_kg'],
                    'ytd_harvest_loss_kg' => (float) $cropData['ytd_harvest_loss_kg'],
                ],
                'livestock'   => [
                    'active_animals'    => (int) $lsData['active_animals'],
                    'recent_treatments' => (int) $lsData['recent_treatments'],
                ],
                'finances'    => [
                    'ytd_income'           => $income,
                    'ytd_expenses'         => $expenses,
                    'ytd_net_profit'       => round($netProfit, 2),
                    'profit_margin_pct'    => $profitMargin,
                    'active_loans_balance' => (float) $finData['active_loans_balance'],
                ],
                'operations'  => [
                    'total_inventory_items' => (int) $invData['total_inventory_items'],
                    'low_stock_items'       => (int) $invData['low_stock_items'],
                    'total_equipment'       => (int) $invData['total_equipment'],
                    'equipment_in_service'  => (int) $invData['equipment_in_service'],
                    'active_workers'        => (int) $labData['active_workers'],
                    'pending_tasks'         => (int) $labData['pending_tasks'],
                ],
                'storage'     => [
                    'total_stored_kg'          => (float) $stData['total_stored_kg'],
                    'total_storage_value'      => round((float) $stData['total_storage_value'], 2),
                    'total_spoilage_kg'        => (float) $stData['total_storage_spoilage_kg'],
                ],
                'weather'     => $weathData ?: null,
                'alerts'      => [
                    'total'    => (int) ($altData['total_alerts'] ?? 0),
                    'critical' => (int) ($altData['critical_alerts'] ?? 0),
                    'warning'  => (int) ($altData['warning_alerts'] ?? 0),
                ],
            ],
        ]);
    }

    public function yieldAnalytics(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        $stmt = $this->pdo->prepare(
            'SELECT c.name AS crop_name,
                    YEAR(hr.harvest_date) AS harvest_year,
                    SUM(hr.quantity_kg) AS total_yield_kg,
                    SUM(hr.expected_yield_kg) AS total_expected_kg,
                    SUM(hr.loss_kg) AS total_loss_kg,
                    AVG(hr.quantity_kg / NULLIF(f.area_ha, 0)) AS avg_yield_kg_per_ha,
                    COUNT(hr.id) AS harvest_events_count
             FROM harvest_records hr
             JOIN crops c ON c.id = hr.crop_id
             JOIN fields f ON f.id = hr.field_id
             WHERE hr.farm_id = :farm_id
             GROUP BY c.name, YEAR(hr.harvest_date)
             ORDER BY harvest_year DESC, total_yield_kg DESC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $trends = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'count' => count($trends), 'data' => $trends]);
    }

    public function financeAnalytics(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $year   = isset($_GET['year']) ? (int) $_GET['year'] : (int) date('Y');

        $incStmt = $this->pdo->prepare(
            'SELECT MONTH(date_received) AS month_num, SUM(amount) AS monthly_income
             FROM income_records
             WHERE farm_id = :farm_id AND YEAR(date_received) = :year
             GROUP BY MONTH(date_received)'
        );
        $incStmt->execute([':farm_id' => $farmId, ':year' => $year]);
        $incomeMonths = $incStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $expStmt = $this->pdo->prepare(
            'SELECT MONTH(date_incurred) AS month_num, SUM(amount) AS monthly_expense
             FROM expense_records
             WHERE farm_id = :farm_id AND YEAR(date_incurred) = :year
             GROUP BY MONTH(date_incurred)'
        );
        $expStmt->execute([':farm_id' => $farmId, ':year' => $year]);
        $expenseMonths = $expStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $inc = (float) ($incomeMonths[$m] ?? 0.0);
            $exp = (float) ($expenseMonths[$m] ?? 0.0);
            $months[] = [
                'month'       => date('M', mktime(0, 0, 0, $m, 1)),
                'month_num'   => $m,
                'income'      => round($inc, 2),
                'expenses'    => round($exp, 2),
                'net_profit'  => round($inc - $exp, 2),
            ];
        }

        respond(['success' => true, 'fiscal_year' => $year, 'data' => $months]);
    }

    public function weatherVsYield(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        $stmt = $this->pdo->prepare(
            'SELECT c.name AS crop_name,
                    f.name AS field_name,
                    hr.harvest_date,
                    hr.quantity_kg,
                    (SELECT AVG(wo.temperature_c) 
                     FROM weather_observations wo 
                     WHERE wo.farm_id = hr.farm_id 
                       AND wo.observed_at BETWEEN DATE_SUB(hr.harvest_date, INTERVAL 90 DAY) AND hr.harvest_date) AS avg_season_temp_c,
                    (SELECT SUM(wo.rainfall_mm) 
                     FROM weather_observations wo 
                     WHERE wo.farm_id = hr.farm_id 
                       AND wo.observed_at BETWEEN DATE_SUB(hr.harvest_date, INTERVAL 90 DAY) AND hr.harvest_date) AS total_season_rainfall_mm
             FROM harvest_records hr
             JOIN crops c ON c.id = hr.crop_id
             JOIN fields f ON f.id = hr.field_id
             WHERE hr.farm_id = :farm_id
             ORDER BY hr.harvest_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $correlation = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'count' => count($correlation), 'data' => $correlation]);
    }
}
