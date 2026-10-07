-- Add persistent contact details and profile image data to authenticated users.
SET @profile_column_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone') = 0,
    'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL',
    'SELECT 1'
);
PREPARE profile_column_stmt FROM @profile_column_sql;
EXECUTE profile_column_stmt;
DEALLOCATE PREPARE profile_column_stmt;

SET @profile_column_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'location') = 0,
    'ALTER TABLE users ADD COLUMN location VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE profile_column_stmt FROM @profile_column_sql;
EXECUTE profile_column_stmt;
DEALLOCATE PREPARE profile_column_stmt;

SET @profile_column_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_photo') = 0,
    'ALTER TABLE users ADD COLUMN profile_photo MEDIUMTEXT NULL',
    'SELECT 1'
);
PREPARE profile_column_stmt FROM @profile_column_sql;
EXECUTE profile_column_stmt;
DEALLOCATE PREPARE profile_column_stmt;