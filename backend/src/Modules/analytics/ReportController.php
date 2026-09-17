<?php

declare(strict_types=1);

/**
 * ReportController
 *
 * REST API controller providing specialized, date-ranged cross-module reporting
 * and business intelligence exports.
 */
class ReportController
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    private function getFilterParams(): array
    {
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;
        $from   = $_GET['from'] ?? date('Y-01-01');
        $to     = $_GET['to'] ?? date('Y-12-31');
        return [$farmId, $from, $to];
    }

    public function cropProduction(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT ps.*, c.name AS crop_name, cv.variety_name, f.name AS field_name
             FROM planting_schedules ps
             JOIN crops c ON c.id = ps.crop_id
             LEFT JOIN crop_varieties cv ON cv.id = ps.variety_id
             JOIN fields f ON f.id = ps.field_id
             WHERE f.farm_id = :farm_id AND ps.planting_date BETWEEN :from AND :to
             ORDER BY ps.planting_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'crop_production', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function yieldReport(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT hr.*, c.name AS crop_name, f.name AS field_name, f.area_ha,
                    (hr.quantity_kg / NULLIF(f.area_ha, 0)) AS yield_kg_per_ha
             FROM harvest_records hr
             JOIN crops c ON c.id = hr.crop_id
             JOIN fields f ON f.id = hr.field_id
             WHERE hr.farm_id = :farm_id AND hr.harvest_date BETWEEN :from AND :to
             ORDER BY hr.harvest_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalKg = array_sum(array_column($rows, 'quantity_kg'));
        $totalLossKg = array_sum(array_column($rows, 'loss_kg'));

        respond([
            'success'       => true,
            'report'        => 'yield_summary',
            'from'          => $from,
            'to'            => $to,
            'total_yield_kg'=> round((float)$totalKg, 2),
            'total_loss_kg' => round((float)$totalLossKg, 2),
            'count'         => count($rows),
            'data'          => $rows,
        ]);
    }

    public function livestock(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT a.*, b.name AS breed_name, b.species,
                    (SELECT COUNT(*) FROM treatments t WHERE t.animal_id = a.id AND t.treatment_date BETWEEN :from AND :to) AS treatments_count,
                    (SELECT COUNT(*) FROM vaccinations v WHERE v.animal_id = a.id AND v.vaccination_date BETWEEN :from2 AND :to2) AS vaccinations_count
             FROM animals a
             JOIN breeds b ON b.id = a.breed_id
             WHERE a.farm_id = :farm_id
             ORDER BY a.tag_number ASC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to, ':from2' => $from, ':to2' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'livestock', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function financial(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $incStmt = $this->pdo->prepare('SELECT category, SUM(amount) AS total FROM income_records WHERE farm_id = :farm_id AND date_received BETWEEN :from AND :to GROUP BY category');
        $incStmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $income = $incStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $expStmt = $this->pdo->prepare('SELECT category, SUM(amount) AS total FROM expense_records WHERE farm_id = :farm_id AND date_incurred BETWEEN :from AND :to GROUP BY category');
        $expStmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $expenses = $expStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $totInc = array_sum(array_map('floatval', $income));
        $totExp = array_sum(array_map('floatval', $expenses));
        $net = $totInc - $totExp;
        $margin = ($totInc > 0) ? round(($net / $totInc) * 100, 2) : 0.0;

        respond([
            'success'       => true,
            'report'        => 'financial_p_and_l',
            'from'          => $from,
            'to'            => $to,
            'total_income'  => round($totInc, 2),
            'total_expense' => round($totExp, 2),
            'net_profit'    => round($net, 2),
            'margin_pct'    => $margin,
            'income'        => $income,
            'expenses'      => $expenses,
        ]);
    }

    public function expenses(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT e.*, u.name AS recorded_by_name
             FROM expense_records e
             JOIN users u ON u.id = e.recorded_by
             WHERE e.farm_id = :farm_id AND e.date_incurred BETWEEN :from AND :to
             ORDER BY e.date_incurred DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'expenses_detail', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function sales(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT so.*, c.name AS customer_name, inv.invoice_number, inv.amount_paid, inv.status AS invoice_status
             FROM sales_orders so
             JOIN customers c ON c.id = so.customer_id
             LEFT JOIN invoices inv ON inv.order_id = so.id
             WHERE so.farm_id = :farm_id AND so.order_date BETWEEN :from AND :to
             ORDER BY so.order_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'sales_summary', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function inventory(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        $stmt = $this->pdo->prepare(
            'SELECT i.*, (i.quantity_on_hand * i.unit_cost) AS total_item_value
             FROM inventory_items i
             WHERE i.farm_id = :farm_id
             ORDER BY i.category ASC, i.name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totVal = array_sum(array_column($items, 'total_item_value'));
        respond(['success' => true, 'report' => 'inventory_valuation', 'total_valuation' => round((float)$totVal, 2), 'count' => count($items), 'data' => $items]);
    }

    public function labour(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT w.id, w.name, w.role, w.daily_wage,
                    (SELECT COUNT(*) FROM worker_attendance wa WHERE wa.worker_id = w.id AND wa.attendance_date BETWEEN :from AND :to AND wa.status = "present") AS days_worked,
                    (SELECT COUNT(*) FROM task_assignments ta WHERE ta.worker_id = w.id AND ta.created_at BETWEEN :from2 AND :to2 AND ta.status = "completed") AS tasks_completed
             FROM workers w
             WHERE w.farm_id = :farm_id
             ORDER BY w.name ASC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to, ':from2' => $from, ':to2' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'labour_performance', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function irrigation(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT wc.*, isy.name AS system_name, isy.type AS system_type, f.name AS field_name
             FROM water_consumption wc
             JOIN irrigation_systems isy ON isy.id = wc.system_id
             LEFT JOIN fields f ON f.id = wc.field_id
             WHERE isy.farm_id = :farm_id AND wc.logged_date BETWEEN :from AND :to
             ORDER BY wc.logged_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalLitres = array_sum(array_column($rows, 'volume_litres'));
        respond(['success' => true, 'report' => 'irrigation_water', 'from' => $from, 'to' => $to, 'total_litres' => round((float)$totalLitres, 2), 'count' => count($rows), 'data' => $rows]);
    }

    public function pestDisease(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        $stmt = $this->pdo->prepare(
            'SELECT pt.*, sr.observation_date, sr.severity, f.name AS field_name, pd.name AS pest_name
             FROM pest_treatments pt
             LEFT JOIN scouting_records sr ON sr.id = pt.scouting_id
             LEFT JOIN pests_diseases pd ON pd.id = sr.pest_disease_id
             JOIN fields f ON f.id = pt.field_id
             WHERE f.farm_id = :farm_id AND pt.application_date BETWEEN :from AND :to
             ORDER BY pt.application_date DESC'
        );
        $stmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'pest_and_disease_management', 'from' => $from, 'to' => $to, 'count' => count($rows), 'data' => $rows]);
    }

    public function equipment(): void
    {
        requireAuth();
        $farmId = isset($_GET['farm_id']) ? (int) $_GET['farm_id'] : 1;

        $stmt = $this->pdo->prepare(
            'SELECT e.*,
                    (SELECT COALESCE(SUM(cost), 0) FROM repair_history rh WHERE rh.equipment_id = e.id) AS total_repair_costs,
                    (SELECT COALESCE(SUM(litres_added), 0) FROM fuel_logs fl WHERE fl.equipment_id = e.id) AS total_fuel_litres
             FROM equipment e
             WHERE e.farm_id = :farm_id
             ORDER BY e.name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'equipment_utilization', 'count' => count($rows), 'data' => $rows]);
    }

    public function profitability(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        // Crop profitability calculation: Sales Revenue vs Input/Fertilizer/Harvest Costs per crop
        $stmt = $this->pdo->prepare(
            'SELECT c.id AS crop_id, c.name AS crop_name,
                    COALESCE((SELECT SUM(oi.total_price) FROM order_items oi JOIN sales_orders so ON so.id = oi.order_id WHERE so.farm_id = :farm_id AND oi.item_id = c.id AND oi.item_type = "crop" AND so.order_date BETWEEN :from AND :to), 0) AS revenue,
                    COALESCE((SELECT SUM(hr.quantity_kg) FROM harvest_records hr WHERE hr.farm_id = :farm_id2 AND hr.crop_id = c.id AND hr.harvest_date BETWEEN :from2 AND :to2), 0) AS harvested_kg
             FROM crops c
             ORDER BY revenue DESC'
        );
        $stmt->execute([
            ':farm_id'  => $farmId,
            ':from'     => $from,
            ':to'       => $to,
            ':farm_id2' => $farmId,
            ':from2'    => $from,
            ':to2'      => $to,
        ]);
        $crops = $stmt->fetchAll(PDO::FETCH_ASSOC);

        respond(['success' => true, 'report' => 'crop_profitability', 'from' => $from, 'to' => $to, 'count' => count($crops), 'data' => $crops]);
    }

    public function farmPerformance(): void
    {
        requireAuth();
        [$farmId, $from, $to] = $this->getFilterParams();

        // Holistic Scorecard
        $farmStmt = $this->pdo->prepare('SELECT name, total_area_ha FROM farms WHERE id = :farm_id LIMIT 1');
        $farmStmt->execute([':farm_id' => $farmId]);
        $farm = $farmStmt->fetch(PDO::FETCH_ASSOC);

        $harvStmt = $this->pdo->prepare('SELECT COALESCE(SUM(quantity_kg), 0) AS yield_kg, COALESCE(SUM(loss_kg), 0) AS loss_kg FROM harvest_records WHERE farm_id = :farm_id AND harvest_date BETWEEN :from AND :to');
        $harvStmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $harv = $harvStmt->fetch(PDO::FETCH_ASSOC);

        $finStmt = $this->pdo->prepare('SELECT (SELECT COALESCE(SUM(amount), 0) FROM income_records WHERE farm_id = :farm_id AND date_received BETWEEN :from AND :to) AS income, (SELECT COALESCE(SUM(amount), 0) FROM expense_records WHERE farm_id = :farm_id AND date_incurred BETWEEN :from AND :to) AS expenses');
        $finStmt->execute([':farm_id' => $farmId, ':from' => $from, ':to' => $to]);
        $fin = $finStmt->fetch(PDO::FETCH_ASSOC);

        $inc = (float) $fin['income'];
        $exp = (float) $fin['expenses'];
        $net = $inc - $exp;

        respond([
            'success'    => true,
            'report'     => 'farm_performance_scorecard',
            'farm'       => $farm,
            'period'     => ['from' => $from, 'to' => $to],
            'production' => [
                'total_harvest_kg' => (float) $harv['yield_kg'],
                'total_loss_kg'    => (float) $harv['loss_kg'],
                'loss_rate_pct'    => ((float)$harv['yield_kg'] > 0) ? round(((float)$harv['loss_kg'] / ((float)$harv['yield_kg'] + (float)$harv['loss_kg'])) * 100, 2) : 0.0,
            ],
            'financial'  => [
                'revenue'    => round($inc, 2),
                'expenses'   => round($exp, 2),
                'net_profit' => round($net, 2),
                'margin_pct' => ($inc > 0) ? round(($net / $inc) * 100, 2) : 0.0,
            ],
        ]);
    }
}
