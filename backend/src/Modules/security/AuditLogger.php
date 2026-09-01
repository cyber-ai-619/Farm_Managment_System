<?php

declare(strict_types=1);

/**
 * AuditLogger
 *
 * Writes timestamped action records to the audit_logs table.
 * Call AuditLogger::log() after any significant create/update/delete.
 */
class AuditLogger
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Write an audit log entry.
     *
     * @param string      $action     Human-readable event key, e.g. 'user.login'
     * @param int|null    $userId     The authenticated user's ID (null for public actions)
     * @param string|null $tableName  DB table affected, if applicable
     * @param int|null    $recordId   Primary key of the affected row, if applicable
     */
    public function log(
        string $action,
        ?int   $userId    = null,
        ?string $tableName = null,
        ?int   $recordId  = null
    ): void {
        $stmt = $this->pdo->prepare(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, user_agent)
             VALUES (:user_id, :action, :table_name, :record_id, :ip, :ua)'
        );

        $stmt->execute([
            ':user_id'    => $userId,
            ':action'     => $action,
            ':table_name' => $tableName,
            ':record_id'  => $recordId,
            ':ip'         => $_SERVER['REMOTE_ADDR']       ?? null,
            ':ua'         => $_SERVER['HTTP_USER_AGENT']   ?? null,
        ]);
    }
}
