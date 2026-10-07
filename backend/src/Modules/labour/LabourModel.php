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
            'SELECT * FROM workers WHERE farm_id = :farm_id ORDER BY status ASC, first_name ASC'
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

    public function create(int $farmId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO workers (farm_id, user_id, first_name, last_name, id_national_number, phone, email, role, employment_type, daily_rate, hire_date, status, emergency_contact, notes)
             VALUES (:farm_id, :user_id, :first_name, :last_name, :id_national_number, :phone, :email, :role, :employment_type, :daily_rate, :hire_date, :status, :emergency_contact, :notes)'
        );
        $stmt->execute([
            ':farm_id'            => $farmId,
            ':user_id'            => $data['user_id'] ?? null,
            ':first_name'         => $data['first_name'],
            ':last_name'          => $data['last_name'],
            ':id_national_number' => $data['id_national_number'] ?? null,
            ':phone'              => $data['phone'] ?? null,
            ':email'              => $data['email'] ?? null,
            ':role'               => $data['role'] ?? 'field_worker',
            ':employment_type'    => $data['employment_type'] ?? 'permanent',
            ':daily_rate'         => $data['daily_rate'] ?? 0.00,
            ':hire_date'          => $data['hire_date'] ?? date('Y-m-d'),
            ':status'             => $data['status'] ?? 'active',
            ':emergency_contact'  => $data['emergency_contact'] ?? null,
            ':notes'              => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
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
            ':phone'             => $data['phone'] ?? null,
            ':email'             => $data['email'] ?? null,
            ':role'              => $data['role'] ?? 'field_worker',
            ':employment_type'   => $data['employment_type'] ?? 'permanent',
            ':daily_rate'        => $data['daily_rate'] ?? 0.00,
            ':status'            => $data['status'] ?? 'active',
            ':emergency_contact' => $data['emergency_contact'] ?? null,
            ':notes'             => $data['notes'] ?? null,
        ]);
    }

    // =========================================================================
    // ATTENDANCE
    // =========================================================================

    public function recordAttendance(int $workerId, int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, status, hours_worked, overtime_hours, notes)
             VALUES (:worker_id, :farm_id, :recorded_by, :work_date, :status, :hours_worked, :overtime_hours, :notes)
             ON DUPLICATE KEY UPDATE status = VALUES(status), hours_worked = VALUES(hours_worked), overtime_hours = VALUES(overtime_hours), notes = VALUES(notes)'
        );
        $stmt->execute([
            ':worker_id'      => $workerId,
            ':farm_id'        => $farmId,
            ':recorded_by'    => $userId,
            ':work_date'      => $data['work_date'] ?? date('Y-m-d'),
            ':status'         => $data['status'] ?? 'present',
            ':hours_worked'   => $data['hours_worked'] ?? 8.00,
            ':overtime_hours' => $data['overtime_hours'] ?? 0.00,
            ':notes'          => $data['notes'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findAttendanceByFarm(int $farmId, ?string $date = null): array
    {
        $sql = 'SELECT a.*, w.first_name, w.last_name, w.role AS worker_role
                FROM worker_attendance a
                JOIN workers w ON w.id = a.worker_id
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

    // =========================================================================
    // TASKS
    // =========================================================================

    public function findTasksByFarm(int $farmId, ?string $status = null): array
    {
        $sql = 'SELECT t.*, w.first_name AS worker_first_name, w.last_name AS worker_last_name, f.name AS field_name
                FROM task_assignments t
                LEFT JOIN workers w ON w.id = t.worker_id
                LEFT JOIN fields f ON f.id = t.field_id
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

    public function createTask(int $farmId, int $userId, array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO task_assignments (farm_id, field_id, worker_id, assigned_by, title, description, priority, due_date, status)
             VALUES (:farm_id, :field_id, :worker_id, :assigned_by, :title, :description, :priority, :due_date, :status)'
        );
        $stmt->execute([
            ':farm_id'     => $farmId,
            ':field_id'    => $data['field_id'] ?? null,
            ':worker_id'   => $data['worker_id'] ?? null,
            ':assigned_by' => $userId,
            ':title'       => $data['title'],
            ':description' => $data['description'] ?? null,
            ':priority'    => $data['priority'] ?? 'medium',
            ':due_date'    => $data['due_date'] ?? null,
            ':status'      => $data['status'] ?? 'pending',
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateTaskStatus(int $taskId, string $status): bool
    {
        $completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
        $stmt = $this->pdo->prepare(
            'UPDATE task_assignments SET status = :status, completed_at = :completed_at WHERE id = :id'
        );
        return $stmt->execute([
            ':status'       => $status,
            ':completed_at' => $completedAt,
            ':id'           => $taskId,
        ]);
    }
}
