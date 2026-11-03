<?php

declare(strict_types=1);

/**
 * LabourModel
 *
 * Database queries for farm workers, attendance records,
 * task assignments, and payroll calculations.
 */
class LabourModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // =========================================================================
    // WORKERS
    // =========================================================================

    public function findByFarm(int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT w.*, u.email AS account_email, u.name AS account_name, u.is_active AS account_active
             FROM workers w
             LEFT JOIN users u ON u.id = w.user_id
             WHERE w.farm_id = :farm_id
             ORDER BY w.status ASC, w.first_name ASC'
        );
        $stmt->execute([':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM workers WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findWorkerByUserId(int $userId, ?int $farmId = null): ?array
    {
        if ($farmId !== null) {
            $stmt = $this->pdo->prepare('SELECT * FROM workers WHERE user_id = :user_id AND farm_id = :farm_id LIMIT 1');
            $stmt->execute([':user_id' => $userId, ':farm_id' => $farmId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) return $row;
        }

        $stmt = $this->pdo->prepare('SELECT * FROM workers WHERE user_id = :user_id LIMIT 1');
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function linkUserToWorker(int $workerId, int $userId): bool
    {
        $stmt = $this->pdo->prepare('UPDATE workers SET user_id = :user_id WHERE id = :id');
        return $stmt->execute([':user_id' => $userId, ':id' => $workerId]);
    }

    public function create(int $farmId, array $data): int
    {
        $role = $data['role'] ?? null;
        if (!$role && !empty($data['job_title'])) {
            $jt = strtolower(trim((string)$data['job_title']));
            if (str_contains($jt, 'vet')) $role = 'veterinarian';
            elseif (str_contains($jt, 'supervis')) $role = 'supervisor';
            elseif (str_contains($jt, 'tractor') || str_contains($jt, 'driver')) $role = 'tractor_driver';
            elseif (str_contains($jt, 'agronom')) $role = 'agronomist';
            elseif (str_contains($jt, 'tech')) $role = 'technician';
            elseif (str_contains($jt, 'harvest')) $role = 'harvester';
            else $role = 'field_worker';
        }
        $validRoles = ['field_worker','supervisor','tractor_driver','harvester','agronomist','technician','general_labour','veterinarian','other'];
        if (!in_array($role, $validRoles)) {
            $role = 'field_worker';
        }

        $userId = !empty($data['user_id']) ? (int) $data['user_id'] : null;
        $dailyRate = ($data['daily_rate'] ?? '') !== '' ? (float) $data['daily_rate'] : 0.00;
        $hireDate = !empty($data['hire_date']) ? $data['hire_date'] : date('Y-m-d');

        $stmt = $this->pdo->prepare(
            'INSERT INTO workers (farm_id, user_id, first_name, last_name, id_national_number, phone, email, role, employment_type, daily_rate, hire_date, status, emergency_contact, notes)
             VALUES (:farm_id, :user_id, :first_name, :last_name, :id_national_number, :phone, :email, :role, :employment_type, :daily_rate, :hire_date, :status, :emergency_contact, :notes)'
        );
        $stmt->execute([
            ':farm_id'            => $farmId,
            ':user_id'            => $userId,
            ':first_name'         => $data['first_name'],
            ':last_name'          => $data['last_name'],
            ':id_national_number' => !empty($data['id_national_number']) ? $data['id_national_number'] : null,
            ':phone'              => !empty($data['phone']) ? $data['phone'] : null,
            ':email'              => !empty($data['email']) ? $data['email'] : null,
            ':role'               => $role,
            ':employment_type'    => !empty($data['employment_type']) ? $data['employment_type'] : 'permanent',
            ':daily_rate'         => $dailyRate,
            ':hire_date'          => $hireDate,
            ':status'             => !empty($data['status']) ? $data['status'] : 'active',
            ':emergency_contact'  => !empty($data['emergency_contact']) ? $data['emergency_contact'] : null,
            ':notes'              => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $dailyRate = ($data['daily_rate'] ?? '') !== '' ? (float) $data['daily_rate'] : 0.00;

        $stmt = $this->pdo->prepare(
            'UPDATE workers
             SET first_name = :first_name, last_name = :last_name, phone = :phone, email = :email,
                 role = :role, employment_type = :employment_type, daily_rate = :daily_rate,
                 status = :status, emergency_contact = :emergency_contact, notes = :notes
             WHERE id = :id'
        );
        return $stmt->execute([
            ':id'                => $id,
            ':first_name'        => $data['first_name'],
            ':last_name'         => $data['last_name'],
            ':phone'             => !empty($data['phone']) ? $data['phone'] : null,
            ':email'             => !empty($data['email']) ? $data['email'] : null,
            ':role'              => !empty($data['role']) ? $data['role'] : 'field_worker',
            ':employment_type'   => !empty($data['employment_type']) ? $data['employment_type'] : 'permanent',
            ':daily_rate'        => $dailyRate,
            ':status'            => !empty($data['status']) ? $data['status'] : 'active',
            ':emergency_contact' => !empty($data['emergency_contact']) ? $data['emergency_contact'] : null,
            ':notes'             => !empty($data['notes']) ? $data['notes'] : null,
        ]);
    }

    // =========================================================================
    // ATTENDANCE & SHIFTS
    // =========================================================================

    public function recordAttendance(int $workerId, int $farmId, int $userId, array $data): int
    {
        $clockIn = !empty($data['clock_in_time']) ? $data['clock_in_time'] : null;
        $clockOut = !empty($data['clock_out_time']) ? $data['clock_out_time'] : null;
        $hoursWorked = ($data['hours_worked'] ?? '') !== '' ? (float) $data['hours_worked'] : 8.00;
        $overtimeHours = ($data['overtime_hours'] ?? '') !== '' ? (float) $data['overtime_hours'] : 0.00;

        $stmt = $this->pdo->prepare(
            'INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, clock_in_time, clock_out_time, status, hours_worked, overtime_hours, is_verified, notes)
             VALUES (:worker_id, :farm_id, :recorded_by, :work_date, :clock_in_time, :clock_out_time, :status, :hours_worked, :overtime_hours, :is_verified, :notes)
             ON DUPLICATE KEY UPDATE
                 clock_in_time = COALESCE(VALUES(clock_in_time), clock_in_time),
                 clock_out_time = COALESCE(VALUES(clock_out_time), clock_out_time),
                 status = VALUES(status),
                 hours_worked = VALUES(hours_worked),
                 overtime_hours = VALUES(overtime_hours),
                 is_verified = VALUES(is_verified),
                 notes = VALUES(notes)'
        );
        $stmt->execute([
            ':worker_id'      => $workerId,
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':work_date'      => !empty($data['work_date']) ? $data['work_date'] : date('Y-m-d'),
            ':clock_in_time'  => $clockIn,
            ':clock_out_time' => $clockOut,
            ':status'         => !empty($data['status']) ? $data['status'] : 'present',
            ':hours_worked'   => $hoursWorked,
            ':overtime_hours' => $overtimeHours,
            ':is_verified'    => isset($data['is_verified']) ? (int) $data['is_verified'] : 0,
            ':notes'          => !empty($data['notes']) ? $data['notes'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function recordSelfClockIn(int $workerId, int $farmId, int $userId): int
    {
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');

        $stmt = $this->pdo->prepare(
            'INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, clock_in_time, status, hours_worked, is_verified)
             VALUES (:worker_id, :farm_id, :recorded_by, :work_date, :clock_in_time, "present", 8.00, 0)
             ON DUPLICATE KEY UPDATE
                 clock_in_time = IF(clock_in_time IS NULL, VALUES(clock_in_time), clock_in_time),
                 status = "present"'
        );
        $stmt->execute([
            ':worker_id'     => $workerId,
            ':farm_id'       => $farmId,
            ':recorded_by'   => $userId,
            ':work_date'     => $today,
            ':clock_in_time' => $currentTime,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function recordSelfClockOut(int $workerId, int $farmId): bool
    {
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');

        $stmt = $this->pdo->prepare(
            'UPDATE worker_attendance
             SET clock_out_time = :clock_out_time,
                 hours_worked = ROUND(GREATEST(1.0, TIMESTAMPDIFF(MINUTE, CONCAT(work_date, " ", IFNULL(clock_in_time, "08:00:00")), CONCAT(work_date, " ", :clock_out_time2)) / 60.0), 2)
             WHERE worker_id = :worker_id AND farm_id = :farm_id AND work_date = :work_date'
        );
        return $stmt->execute([
            ':clock_out_time'  => $currentTime,
            ':clock_out_time2' => $currentTime,
            ':worker_id'       => $workerId,
            ':farm_id'         => $farmId,
            ':work_date'       => $today,
        ]);
    }

    public function verifyAttendance(int $attendanceId, int $verifiedBy): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE worker_attendance
             SET is_verified = 1, verified_by = :verified_by, verified_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        return $stmt->execute([':verified_by' => $verifiedBy, ':id' => $attendanceId]);
    }

    public function bulkRecordAttendance(int $farmId, int $recorderId, string $date, array $records): bool
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, status, hours_worked, overtime_hours, is_verified, notes)
                 VALUES (:worker_id, :farm_id, :recorded_by, :work_date, :status, :hours_worked, :overtime_hours, 1, :notes)
                 ON DUPLICATE KEY UPDATE
                     status = VALUES(status),
                     hours_worked = VALUES(hours_worked),
                     overtime_hours = VALUES(overtime_hours),
                     is_verified = 1,
                     notes = VALUES(notes)'
            );

            foreach ($records as $r) {
                if (empty($r['worker_id'])) continue;
                $stmt->execute([
                    ':worker_id'      => (int) $r['worker_id'],
                    ':farm_id'        => $farmId,
                    ':recorded_by'    => $recorderId,
                    ':work_date'      => $date,
                    ':status'         => $r['status'] ?? 'present',
                    ':hours_worked'   => (float) ($r['hours_worked'] ?? 8.0),
                    ':overtime_hours' => (float) ($r['overtime_hours'] ?? 0.0),
                    ':notes'          => $r['notes'] ?? null,
                ]);
            }

            $this->pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function findAttendanceByFarm(int $farmId, ?string $date = null): array
    {
        $sql = 'SELECT a.*, w.first_name, w.last_name, w.role AS worker_role, w.daily_rate,
                       u_ver.name AS verified_by_name
                FROM worker_attendance a
                JOIN workers w ON w.id = a.worker_id
                LEFT JOIN users u_ver ON u_ver.id = a.verified_by
                WHERE a.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($date !== null && $date !== '') {
            $sql .= ' AND a.work_date = :date';
            $params[':date'] = $date;
        }

        $sql .= ' ORDER BY a.work_date DESC, w.first_name ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findMyAttendance(int $workerId, int $farmId, int $limit = 30): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.*, u_ver.name AS verified_by_name
             FROM worker_attendance a
             LEFT JOIN users u_ver ON u_ver.id = a.verified_by
             WHERE a.worker_id = :worker_id AND a.farm_id = :farm_id
             ORDER BY a.work_date DESC
             LIMIT :lim'
        );
        $stmt->bindValue(':worker_id', $workerId, PDO::PARAM_INT);
        $stmt->bindValue(':farm_id', $farmId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // TASKS & WORKFLOWS
    // =========================================================================

    public function findTasksByFarm(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT t.*, w.first_name AS worker_first_name, w.last_name AS worker_last_name, f.name AS field_name,
                       u_ass.name AS assigned_by_name, u_ver.name AS verified_by_name
                FROM task_assignments t
                LEFT JOIN workers w ON w.id = t.worker_id
                LEFT JOIN fields f ON f.id = t.field_id
                LEFT JOIN users u_ass ON u_ass.id = t.assigned_by
                LEFT JOIN users u_ver ON u_ver.id = t.verified_by
                WHERE t.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null && $status !== '') {
            $sql .= ' AND t.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY t.due_date ASC, t.priority DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findMyTasks(int $workerId, int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT t.*, f.name AS field_name, u_ass.name AS assigned_by_name, u_ver.name AS verified_by_name
                FROM task_assignments t
                LEFT JOIN fields f ON f.id = t.field_id
                LEFT JOIN users u_ass ON u_ass.id = t.assigned_by
                LEFT JOIN users u_ver ON u_ver.id = t.verified_by
                WHERE t.worker_id = :worker_id AND t.farm_id = :farm_id';
        $params = [':worker_id' => $workerId, ':farm_id' => $farmId];

        if ($status !== null && $status !== '') {
            $sql .= ' AND t.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY FIELD(t.status, "in_progress", "pending", "completed", "cancelled"), t.due_date ASC, t.priority DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTask(int $farmId, int $userId, array $data): int
    {
        $fieldId = !empty($data['field_id']) ? (int) $data['field_id'] : null;
        $workerId = !empty($data['worker_id']) ? (int) $data['worker_id'] : null;
        $dueDate = !empty($data['due_date']) ? $data['due_date'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO task_assignments (farm_id, field_id, worker_id, assigned_by, title, description, priority, due_date, status)
             VALUES (:farm_id, :field_id, :worker_id, :assigned_by, :title, :description, :priority, :due_date, :status)'
        );
        $stmt->execute([
            ':farm_id'     => $farmId,
            ':field_id'    => $fieldId,
            ':worker_id'   => $workerId,
            ':assigned_by' => $userId,
            ':title'       => $data['title'],
            ':description' => !empty($data['description']) ? $data['description'] : null,
            ':priority'    => !empty($data['priority']) ? $data['priority'] : 'medium',
            ':due_date'    => $dueDate,
            ':status'      => !empty($data['status']) ? $data['status'] : 'pending',
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateTaskStatus(int $taskId, string $status): bool
    {
        $completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
        $startedAt   = $status === 'in_progress' ? date('Y-m-d H:i:s') : null;

        $stmt = $this->pdo->prepare(
            'UPDATE task_assignments
             SET status = :status,
                 completed_at = COALESCE(completed_at, :completed_at),
                 started_at = COALESCE(started_at, :started_at)
             WHERE id = :id'
        );
        return $stmt->execute([
            ':status'       => $status,
            ':completed_at' => $completedAt,
            ':started_at'   => $startedAt,
            ':id'           => $taskId,
        ]);
    }

    public function updateWorkerTaskProgress(int $taskId, int $workerId, string $status, ?string $completionNotes = null): bool
    {
        $completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
        $startedAt   = $status === 'in_progress' ? date('Y-m-d H:i:s') : null;

        $stmt = $this->pdo->prepare(
            'UPDATE task_assignments
             SET status = :status,
                 started_at = COALESCE(started_at, :started_at),
                 completed_at = COALESCE(completed_at, :completed_at),
                 completion_notes = COALESCE(:completion_notes, completion_notes)
             WHERE id = :task_id AND worker_id = :worker_id'
        );
        return $stmt->execute([
            ':status'           => $status,
            ':started_at'       => $startedAt,
            ':completed_at'     => $completedAt,
            ':completion_notes' => ($completionNotes !== '') ? $completionNotes : null,
            ':task_id'          => $taskId,
            ':worker_id'        => $workerId,
        ]);
    }

    public function verifyTask(int $taskId, int $verifiedBy): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE task_assignments
             SET verified_by = :verified_by, verified_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        return $stmt->execute([':verified_by' => $verifiedBy, ':id' => $taskId]);
    }

    // =========================================================================
    // PAYROLL & COMPENSATION
    // =========================================================================

    public function calculateAndGeneratePayroll(int $farmId, int $recorderId, string $startDate, string $endDate): array
    {
        // 1. Fetch active workers with daily rates
        $workersStmt = $this->pdo->prepare(
            'SELECT id, first_name, last_name, daily_rate, role
             FROM workers
             WHERE farm_id = :farm_id AND status != "terminated"'
        );
        $workersStmt->execute([':farm_id' => $farmId]);
        $workers = $workersStmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];

        foreach ($workers as $w) {
            $workerId = (int) $w['id'];
            $dailyRate = (float) $w['daily_rate'];
            $hourlyRate = $dailyRate > 0 ? ($dailyRate / 8.0) : 0.0;

            // Tally attendance
            $attStmt = $this->pdo->prepare(
                'SELECT
                     SUM(CASE WHEN status = "present" THEN 1.0 WHEN status = "half_day" THEN 0.5 WHEN status = "paid_leave" THEN 1.0 ELSE 0.0 END) AS days_worked,
                     SUM(COALESCE(overtime_hours, 0.0)) AS overtime_hours
                 FROM worker_attendance
                 WHERE worker_id = :worker_id AND farm_id = :farm_id AND work_date BETWEEN :start AND :end'
            );
            $attStmt->execute([
                ':worker_id' => $workerId,
                ':farm_id'   => $farmId,
                ':start'     => $startDate,
                ':end'       => $endDate,
            ]);
            $tallies = $attStmt->fetch(PDO::FETCH_ASSOC);

            $daysWorked = (float) ($tallies['days_worked'] ?? 0.0);
            $overtimeHours = (float) ($tallies['overtime_hours'] ?? 0.0);

            $baseSalary = round($daysWorked * $dailyRate, 2);
            $overtimeAmount = round($overtimeHours * ($hourlyRate * 1.5), 2);
            $bonusAmount = 0.00;
            $deductions = 0.00;
            $netPayable = round($baseSalary + $overtimeAmount + $bonusAmount - $deductions, 2);

            // Check if a payroll record already exists for (worker_id, period_start, period_end)
            $checkStmt = $this->pdo->prepare(
                'SELECT id FROM payroll_records WHERE worker_id = :worker_id AND period_start = :period_start AND period_end = :period_end LIMIT 1'
            );
            $checkStmt->execute([
                ':worker_id'    => $workerId,
                ':period_start' => $startDate,
                ':period_end'   => $endDate,
            ]);
            $existingId = $checkStmt->fetchColumn();

            if ($existingId) {
                $updateStmt = $this->pdo->prepare(
                    'UPDATE payroll_records
                     SET days_worked = :days_worked,
                         base_salary = :base_salary,
                         overtime_amount = :overtime_amount,
                         net_payable = :net_payable
                     WHERE id = :id'
                );
                $updateStmt->execute([
                    ':days_worked'     => $daysWorked,
                    ':base_salary'     => $baseSalary,
                    ':overtime_amount' => $overtimeAmount,
                    ':net_payable'     => $netPayable,
                    ':id'              => (int) $existingId,
                ]);
            } else {
                $insertStmt = $this->pdo->prepare(
                    'INSERT INTO payroll_records (worker_id, farm_id, recorded_by, period_start, period_end, days_worked, base_salary, overtime_amount, bonus_amount, deductions, net_payable, payment_status)
                     VALUES (:worker_id, :farm_id, :recorded_by, :period_start, :period_end, :days_worked, :base_salary, :overtime_amount, :bonus_amount, :deductions, :net_payable, "pending")'
                );
                $insertStmt->execute([
                    ':worker_id'       => $workerId,
                    ':farm_id'         => $farmId,
                    ':recorded_by'     => $recorderId,
                    ':period_start'    => $startDate,
                    ':period_end'      => $endDate,
                    ':days_worked'     => $daysWorked,
                    ':base_salary'     => $baseSalary,
                    ':overtime_amount' => $overtimeAmount,
                    ':bonus_amount'    => $bonusAmount,
                    ':deductions'      => $deductions,
                    ':net_payable'     => $netPayable,
                ]);
            }

            $results[] = [
                'worker_id'       => $workerId,
                'worker_name'     => $w['first_name'] . ' ' . $w['last_name'],
                'role'            => $w['role'],
                'daily_rate'      => $dailyRate,
                'days_worked'     => $daysWorked,
                'overtime_hours'  => $overtimeHours,
                'base_salary'     => $baseSalary,
                'overtime_amount' => $overtimeAmount,
                'net_payable'     => $netPayable,
            ];
        }

        return $results;
    }

    public function findPayrollByFarm(int $farmId, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = 'SELECT p.*, w.first_name, w.last_name, w.role AS worker_role, w.daily_rate, w.phone,
                       u_rec.name AS recorded_by_name
                FROM payroll_records p
                JOIN workers w ON w.id = p.worker_id
                LEFT JOIN users u_rec ON u_rec.id = p.recorded_by
                WHERE p.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($startDate && $endDate) {
            $sql .= ' AND p.period_start >= :start AND p.period_end <= :end';
            $params[':start'] = $startDate;
            $params[':end']   = $endDate;
        }

        $sql .= ' ORDER BY p.period_start DESC, p.created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findPayrollByWorker(int $workerId, int $farmId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, w.first_name, w.last_name, w.role AS worker_role
             FROM payroll_records p
             JOIN workers w ON w.id = p.worker_id
             WHERE p.worker_id = :worker_id AND p.farm_id = :farm_id
             ORDER BY p.period_end DESC'
        );
        $stmt->execute([':worker_id' => $workerId, ':farm_id' => $farmId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updatePayrollPayment(int $payrollId, string $status, ?string $method = null, ?string $paymentDate = null, ?string $notes = null): bool
    {
        $cleanMethod = ($method !== null && $method !== '') ? $method : null;
        $cleanNotes = ($notes !== null && $notes !== '') ? $notes : null;

        $stmt = $this->pdo->prepare(
            'UPDATE payroll_records
             SET payment_status = :status,
                 payment_method = COALESCE(:method, payment_method),
                 payment_date = COALESCE(:payment_date, CURRENT_DATE),
                 notes = COALESCE(:notes, notes)
             WHERE id = :id'
        );
        return $stmt->execute([
            ':status'       => $status,
            ':method'       => $cleanMethod,
            ':payment_date' => $paymentDate ?: ($status === 'paid' ? date('Y-m-d') : null),
            ':notes'        => $cleanNotes,
            ':id'           => $payrollId,
        ]);
    }

    // =========================================================================
    // FIELD INCIDENTS & HAZARDS
    // =========================================================================

    public function recordIncident(int $farmId, ?int $workerId, int $reportedBy, array $data): int
    {
        $fieldId = !empty($data['field_id']) ? (int) $data['field_id'] : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO field_incidents (farm_id, worker_id, reported_by, field_id, type, severity, title, description, status)
             VALUES (:farm_id, :worker_id, :reported_by, :field_id, :type, :severity, :title, :description, "open")'
        );
        $stmt->execute([
            ':farm_id'      => $farmId,
            ':worker_id'    => $workerId,
            ':reported_by'  => $reportedBy,
            ':field_id'     => $fieldId,
            ':type'         => !empty($data['type']) ? $data['type'] : 'hazard',
            ':severity'     => !empty($data['severity']) ? $data['severity'] : 'medium',
            ':title'        => $data['title'],
            ':description'  => !empty($data['description']) ? $data['description'] : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findIncidents(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT i.*, w.first_name AS worker_first_name, w.last_name AS worker_last_name,
                       u_rep.name AS reported_by_name, f.name AS field_name,
                       u_res.name AS resolved_by_name
                FROM field_incidents i
                LEFT JOIN workers w ON w.id = i.worker_id
                JOIN users u_rep ON u_rep.id = i.reported_by
                LEFT JOIN fields f ON f.id = i.field_id
                LEFT JOIN users u_res ON u_res.id = i.resolved_by
                WHERE i.farm_id = :farm_id';
        $params = [':farm_id' => $farmId];

        if ($status !== null && $status !== '') {
            $sql .= ' AND i.status = :status';
            $params[':status'] = $status;
        }

        $sql .= ' ORDER BY FIELD(i.status, "open", "investigating", "resolved"), i.created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function resolveIncident(int $id, int $resolvedBy, string $status, ?string $resolutionNotes = null): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE field_incidents
             SET status = :status,
                 resolution_notes = :resolution_notes,
                 resolved_by = :resolved_by,
                 resolved_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        return $stmt->execute([
            ':status'           => $status,
            ':resolution_notes' => $resolutionNotes,
            ':resolved_by'      => $resolvedBy,
            ':id'               => $id,
        ]);
    }
}
