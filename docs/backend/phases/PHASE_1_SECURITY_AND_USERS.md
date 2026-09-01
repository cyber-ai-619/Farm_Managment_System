# 🔐 Phase 1 Completion Report — Security & User Management

> **Module Location**: `backend/src/Modules/security/`  
> **Phase Status**: Completed ✅  
> **Migration File**: `database/migrations/001_users_roles.sql`  

---

## 1. Executive Summary

Phase 1 establishes the **security, authentication, role-based access control (RBAC), and audit logging foundation** for the entire Farm Management System (FFMS). All subsequent module endpoints will leverage the authentication guards built in this phase.

### Key Deliverables Completed:
- Database tables: `roles`, `users`, and `audit_logs` created with relational constraints.
- Pre-seeded 6 system roles (`admin`, `farm_owner`, `farm_manager`, `agronomist`, `worker`, `accountant`).
- Password security using native PHP `PASSWORD_BCRYPT` hashing.
- Lightweight, zero-dependency `JwtHelper` using HMAC-SHA256 for state-free token authentication.
- Centralized auth guards (`requireAuth()` and `requireRole()`) integrated into `bootstrap.php`.
- Full user lifecycle API endpoints (`register`, `login`, `me`, `logout`).
- Automated activity auditing via `AuditLogger`.

---

## 2. Database Schema (Phase 1 Implemented)

The following tables are active in the database:

### `roles`
Stores application user access levels.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | Role ID |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Role name (`admin`, `farm_owner`, etc.) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Creation date |

### `users`
Stores system user accounts.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | User ID |
| `name` | `VARCHAR(150)` | `NOT NULL` | Full name |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Email / Login identifier |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt password hash |
| `role_id` | `INT UNSIGNED` | `FOREIGN KEY -> roles(id)` | User role ID (Defaults to `5` / `worker`) |
| `is_active` | `TINYINT(1)` | `DEFAULT 1` | Account status (1 = Active, 0 = Disabled) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account registration time |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

### `audit_logs`
Records critical security & data events across all modules.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | Log ID |
| `user_id` | `INT UNSIGNED` | `FOREIGN KEY -> users(id)` | User who triggered event (NULL for public) |
| `action` | `VARCHAR(100)` | `NOT NULL` | Event key (e.g., `user.login`, `user.registered`) |
| `table_name` | `VARCHAR(100)` | `NULL` | Affected database table |
| `record_id` | `INT UNSIGNED` | `NULL` | Primary key of affected record |
| `ip_address` | `VARCHAR(45)` | `NULL` | Client IP address |
| `user_agent` | `TEXT` | `NULL` | Client Browser / Device User-Agent |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Event timestamp |

---

## 3. Backend Architecture & Components

```
backend/src/
├── bootstrap.php                 # Global helpers (getPdo, requireAuth, requireRole, respond)
└── Modules/security/
    ├── JwtHelper.php             # JWT generation & validation (HMAC-SHA256)
    ├── UserModel.php             # Database queries for users table
    ├── AuthController.php        # Request handling for auth routes
    └── AuditLogger.php           # Event logging service
```

### Key Functions Reference:

#### Database Singleton (`bootstrap.php`)
```php
$pdo = getPdo(); // Returns shared PDO connection configured from .env / XAMPP defaults
```

#### Authentication Guard (`bootstrap.php`)
```php
$payload = requireAuth();
// Checks HTTP Authorization header for valid Bearer token.
// Returns token array ['sub' => userId, 'email' => ..., 'role' => ...]
// Halts request with 401 Unauthorized if invalid or missing.
```

#### Role Authorization Guard (`bootstrap.php`)
```php
$payload = requireRole(['admin', 'farm_owner']);
// Asserts authenticated user has one of the allowed roles.
// Halts request with 403 Forbidden if user role does not match.
```

---

## 4. API Endpoints Reference

### 1. Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "name": "Timon",
    "email": "timon@farm.com",
    "password": "secretpassword",
    "role_id": 2
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "name": "Timon",
      "email": "timon@farm.com",
      "role_id": 2,
      "is_active": 1,
      "created_at": "2026-09-01 11:14:52",
      "role_name": "farm_owner"
    }
  }
  ```

### 2. User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "timon@farm.com",
    "password": "secretpassword"
  }
  ```
- **Response (200 OK)**: Returns JWT token and user profile object.

### 3. Get User Profile (`/me`)
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Returns profile of current logged-in user.

### 4. User Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Confirms logout; client discards token.

---

## 5. Developer Guide for Team Members

When creating endpoints in future modules (e.g. `farm_field`, `crop`, `inventory`):

1. **Protect your route**:
   ```php
   // At the top of your controller method:
   $user = requireAuth();
   $userId = (int) $user['sub'];
   ```
2. **Restrict by Role (if necessary)**:
   ```php
   // Allow only farm owners or managers to perform action:
   $user = requireRole(['farm_owner', 'farm_manager']);
   ```
3. **Log Important Actions**:
   ```php
   $audit = new AuditLogger($pdo);
   $audit->log('farm.created', $userId, 'farms', $farmId);
   ```
