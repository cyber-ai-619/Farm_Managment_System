<?php

declare(strict_types=1);

require_once __DIR__ . '/AlertModel.php';

/**
 * AlertTriggerService
 *
 * Automated rule-based system scanner that inspects database states across modules
 * and generates alerts for low inventory, maintenance deadlines, weather risks,
 * task delays, pest outbreaks, upcoming harvests, and batch expiries.
 */
class AlertTriggerService
{
    private PDO        $pdo;
    private AlertModel $alertModel;

    public function __construct(PDO $pdo)
    {
        $this->pdo        = $pdo;
        $this->alertModel = new AlertModel($pdo);
    }

    public function runAutomatedChecks(int $farmId): array
    {
        $generated = [];

        // 1. Low Inventory Scan
        $lowStockStmt = $this->pdo->prepare(
            'SELECT name, quantity_on_hand, reorder_level, unit_of_measure 
             FROM inventory_items 
             WHERE farm_id = :farm_id AND is_active = 1 AND quantity_on_hand <= reorder_level'
        );
        $lowStockStmt->execute([':farm_id' => $farmId]);
        $lowStockItems = $lowStockStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($lowStockItems as $item) {
            $title = "Low Stock: {$item['name']}";
            if (!$this->alertModel->alertExists($farmId, 'inventory_low', $title)) {
                $msg = "Item '{$item['name']}' is below reorder level. Current: {$item['quantity_on_hand']} {$item['unit_of_measure']} (Threshold: {$item['reorder_level']}).";
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'inventory_low',
                    'title'      => $title,
                    'message'    => $msg,
                    'severity'   => 'warning',
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        // 2. Overdue Equipment Maintenance Scan
        $maintStmt = $this->pdo->prepare(
            'SELECT ms.id, e.name AS equipment_name, ms.service_type, ms.due_date 
             FROM maintenance_schedules ms
             JOIN equipment e ON e.id = ms.equipment_id
             WHERE e.farm_id = :farm_id AND ms.status = "scheduled" AND ms.due_date < CURDATE()'
        );
        $maintStmt->execute([':farm_id' => $farmId]);
        $overdueMaint = $maintStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($overdueMaint as $m) {
            $title = "Overdue Service: {$m['equipment_name']}";
            if (!$this->alertModel->alertExists($farmId, 'maintenance_due', $title)) {
                $msg = "Scheduled '{$m['service_type']}' for {$m['equipment_name']} was due on {$m['due_date']} and requires attention.";
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'maintenance_due',
                    'title'      => $title,
                    'message'    => $msg,
                    'severity'   => 'warning',
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        // 3. Active Weather Risk Scan
        $weathStmt = $this->pdo->prepare(
            'SELECT title, alert_type, severity, description 
             FROM weather_alerts 
             WHERE farm_id = :farm_id AND is_active = 1 AND valid_until >= NOW()'
        );
        $weathStmt->execute([':farm_id' => $farmId]);
        $weatherAlerts = $weathStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($weatherAlerts as $w) {
            $title = "Weather Alert: {$w['title']}";
            if (!$this->alertModel->alertExists($farmId, 'weather_risk', $title)) {
                $sev = ($w['severity'] === 'emergency' || $w['severity'] === 'warning') ? 'critical' : 'warning';
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'weather_risk',
                    'title'      => $title,
                    'message'    => $w['description'],
                    'severity'   => $sev,
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        // 4. Overdue Farm Tasks Scan
        $taskStmt = $this->pdo->prepare(
            'SELECT ta.title, ta.due_date, w.name AS worker_name 
             FROM task_assignments ta
             LEFT JOIN workers w ON w.id = ta.worker_id
             WHERE ta.farm_id = :farm_id AND ta.status != "completed" AND ta.due_date < CURDATE()'
        );
        $taskStmt->execute([':farm_id' => $farmId]);
        $overdueTasks = $taskStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($overdueTasks as $t) {
            $title = "Overdue Task: {$t['title']}";
            if (!$this->alertModel->alertExists($farmId, 'task_overdue', $title)) {
                $worker = $t['worker_name'] ? " (Assigned to {$t['worker_name']})" : '';
                $msg = "Task '{$t['title']}'{$worker} was due on {$t['due_date']}.";
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'task_overdue',
                    'title'      => $title,
                    'message'    => $msg,
                    'severity'   => 'info',
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        // 5. Severe Pest / Disease Outbreak Scan
        $pestStmt = $this->pdo->prepare(
            'SELECT sr.id, f.name AS field_name, sr.severity, pd.name AS pest_name, sr.observation_date 
             FROM scouting_records sr
             JOIN fields f ON f.id = sr.field_id
             LEFT JOIN pests_diseases pd ON pd.id = sr.pest_disease_id
             WHERE sr.farm_id = :farm_id AND sr.severity IN ("severe", "critical") AND sr.observation_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)'
        );
        $pestStmt->execute([':farm_id' => $farmId]);
        $outbreaks = $pestStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($outbreaks as $o) {
            $pest = $o['pest_name'] ?: 'Pest/Disease';
            $title = "Pest Alert: {$pest} in {$o['field_name']}";
            if (!$this->alertModel->alertExists($farmId, 'pest_outbreak', $title)) {
                $msg = "Severe infestation of {$pest} detected in {$o['field_name']} on {$o['observation_date']}. Immediate chemical or cultural treatment required.";
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'pest_outbreak',
                    'title'      => $title,
                    'message'    => $msg,
                    'severity'   => 'critical',
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        // 6. Upcoming Harvest Window Scan (Next 7 Days)
        $harvStmt = $this->pdo->prepare(
            'SELECT ps.id, c.name AS crop_name, f.name AS field_name, ps.expected_harvest_date 
             FROM planting_schedules ps
             JOIN crops c ON c.id = ps.crop_id
             JOIN fields f ON f.id = ps.field_id
             WHERE f.farm_id = :farm_id 
               AND ps.status IN ("planted", "growing")
               AND ps.expected_harvest_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'
        );
        $harvStmt->execute([':farm_id' => $farmId]);
        $upcomingHarvests = $harvStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($upcomingHarvests as $h) {
            $title = "Upcoming Harvest: {$h['crop_name']} in {$h['field_name']}";
            if (!$this->alertModel->alertExists($farmId, 'harvest_due', $title)) {
                $msg = "Crop '{$h['crop_name']}' in field '{$h['field_name']}' is expected for harvest on {$h['expected_harvest_date']}. Prepare labour and storage.";
                $id = $this->alertModel->createAlert($farmId, null, [
                    'alert_type' => 'harvest_due',
                    'title'      => $title,
                    'message'    => $msg,
                    'severity'   => 'info',
                ]);
                $generated[] = ['id' => $id, 'title' => $title];
            }
        }

        return $generated;
    }
}
