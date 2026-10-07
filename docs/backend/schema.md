# 🗄️ Farm Management System — Database Schema

This document serves as the shared single source of truth for the database design across all backend development phases.

> [!TIP]
> **Consolidated Schema File**: [`database/full_schema.sql`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/database/full_schema.sql) contains the complete unified schema (59 tables) combining migrations 001 through 016 for single-step setup on local machines. Migration files remain available in [`database/migrations/`](file:///c:/Users/timon/Documents/GitHub/Farm_Managment_System/database/migrations/).

---

## 🟢 Implemented Schemas (Phase 1)

### 1. `roles`
Defines system access roles.
```sql
CREATE TABLE roles (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
**Default Roles Seeded**:
- `1` : `admin`
- `2` : `farm_owner`
- `3` : `farm_manager`
- `4` : `agronomist`
- `5` : `worker` (Default)
- `6` : `accountant`

---

### 2. `users`
System user accounts.
```sql
CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT UNSIGNED NOT NULL DEFAULT 5,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3. `audit_logs`
Security & operational audit log.
```sql
CREATE TABLE audit_logs (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NULL,
    action     VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id  INT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🟢 Implemented Schemas (Phase 2)

### 4. `farms`
Top-level farm entity. Owned by a user.
```sql
CREATE TABLE farms (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id      INT UNSIGNED NOT NULL,
    name          VARCHAR(150) NOT NULL,
    location      VARCHAR(255) NULL,
    latitude      DECIMAL(10, 7) NULL,
    longitude     DECIMAL(10, 7) NULL,
    total_area_ha DECIMAL(10, 2) NULL,
    description   TEXT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_farms_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_farms_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 5. `fields`
A farm is divided into fields. Each field has soil metadata and GPS data.
```sql
CREATE TABLE fields (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id         INT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    area_ha         DECIMAL(10, 2) NULL,
    soil_type       ENUM('clay','sandy','loam','silt','peat','chalk','clay_loam','sandy_loam') NULL,
    soil_condition  ENUM('excellent','good','fair','poor') NULL DEFAULT 'good',
    soil_ph         DECIMAL(4, 2) NULL,
    latitude        DECIMAL(10, 7) NULL,
    longitude       DECIMAL(10, 7) NULL,
    gps_boundary    TEXT NULL,
    description     TEXT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fields_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_fields_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 6. `plots`
Optional sub-division of a field (raised beds, blocks, zones).
```sql
CREATE TABLE plots (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    field_id    INT UNSIGNED NOT NULL,
    name        VARCHAR(100) NOT NULL,
    area_ha     DECIMAL(10, 4) NULL,
    description TEXT NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_plots_field FOREIGN KEY (field_id) REFERENCES fields (id) ON DELETE CASCADE,
    INDEX idx_plots_field (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 7. `crops`
Master crop catalogue (e.g. Maize, Tomato, Wheat).
```sql
CREATE TABLE crops (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    scientific_name  VARCHAR(150) NULL,
    category         ENUM('cereal','legume','vegetable','fruit','root','oilseed','fodder','other') NOT NULL DEFAULT 'other',
    description      TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_crops_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 8. `crop_varieties`
Specific varieties under each crop (e.g. SC403 under Maize).
```sql
CREATE TABLE crop_varieties (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    crop_id             INT UNSIGNED NOT NULL,
    variety_name        VARCHAR(150) NOT NULL,
    days_to_maturity    SMALLINT UNSIGNED NULL,
    planting_density    VARCHAR(100) NULL,
    row_spacing_cm      DECIMAL(6, 2) NULL,
    plant_spacing_cm    DECIMAL(6, 2) NULL,
    expected_yield_t_ha DECIMAL(8, 2) NULL,
    notes               TEXT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_varieties_crop FOREIGN KEY (crop_id) REFERENCES crops (id) ON DELETE CASCADE,
    INDEX idx_varieties_crop (crop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 9. `planting_schedules`
Records of actual planting events on a specific field/plot.
```sql
CREATE TABLE planting_schedules (
    id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    field_id              INT UNSIGNED NOT NULL,
    plot_id               INT UNSIGNED NULL,
    crop_id               INT UNSIGNED NOT NULL,
    variety_id            INT UNSIGNED NULL,
    planted_by            INT UNSIGNED NOT NULL,
    planting_date         DATE NOT NULL,
    expected_harvest_date DATE NULL,
    actual_harvest_date   DATE NULL,
    area_planted_ha       DECIMAL(10, 2) NULL,
    seed_quantity_kg      DECIMAL(10, 2) NULL,
    status                ENUM('planned','planted','growing','harvested','failed') NOT NULL DEFAULT 'planned',
    notes                 TEXT NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_planting_field   FOREIGN KEY (field_id)   REFERENCES fields (id)         ON DELETE CASCADE,
    CONSTRAINT fk_planting_plot    FOREIGN KEY (plot_id)    REFERENCES plots (id)           ON DELETE SET NULL,
    CONSTRAINT fk_planting_crop    FOREIGN KEY (crop_id)    REFERENCES crops (id)           ON DELETE CASCADE,
    CONSTRAINT fk_planting_variety FOREIGN KEY (variety_id) REFERENCES crop_varieties (id)  ON DELETE SET NULL,
    CONSTRAINT fk_planting_user    FOREIGN KEY (planted_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_planting_field  (field_id),
    INDEX idx_planting_crop   (crop_id),
    INDEX idx_planting_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 10. `fertilizer_records`
Fertilizer application events linked to a planting schedule.
```sql
CREATE TABLE fertilizer_records (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planting_id      INT UNSIGNED NOT NULL,
    applied_by       INT UNSIGNED NOT NULL,
    fertilizer_name  VARCHAR(150) NOT NULL,
    fertilizer_type  ENUM('organic','inorganic','foliar','basal','top_dress','other') NOT NULL DEFAULT 'other',
    quantity_kg      DECIMAL(10, 2) NOT NULL,
    application_date DATE NOT NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fertilizer_planting FOREIGN KEY (planting_id) REFERENCES planting_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_fertilizer_user     FOREIGN KEY (applied_by)  REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_fertilizer_planting (planting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 11. `spraying_schedules`
Chemical spray events per planting (pesticides, herbicides, fungicides).
```sql
CREATE TABLE spraying_schedules (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planting_id      INT UNSIGNED NOT NULL,
    applied_by       INT UNSIGNED NOT NULL,
    chemical_name    VARCHAR(150) NOT NULL,
    chemical_type    ENUM('pesticide','herbicide','fungicide','insecticide','other') NOT NULL DEFAULT 'other',
    quantity_litres  DECIMAL(10, 2) NOT NULL,
    dilution_ratio   VARCHAR(50) NULL,
    spray_date       DATE NOT NULL,
    target_pest      VARCHAR(150) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spraying_planting FOREIGN KEY (planting_id) REFERENCES planting_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_spraying_user     FOREIGN KEY (applied_by)  REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_spraying_planting (planting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 12. `breeds`
Master breed catalogue for livestock.
```sql
CREATE TABLE breeds (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    species     ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_breed_species_name (species, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 13. `animals`
Individual animal registry tied to a farm.
```sql
CREATE TABLE animals (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id         INT UNSIGNED NOT NULL,
    breed_id        INT UNSIGNED NULL,
    tag_number      VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NULL,
    species         ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    gender          ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown',
    date_of_birth   DATE NULL,
    date_of_death   DATE NULL,
    cause_of_death  VARCHAR(255) NULL,
    weight_kg       DECIMAL(8, 2) NULL,
    purchase_price  DECIMAL(10, 2) NULL,
    purchase_date   DATE NULL,
    source          VARCHAR(150) NULL,
    status          ENUM('active','sold','deceased','quarantine') NOT NULL DEFAULT 'active',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_animals_farm  FOREIGN KEY (farm_id)  REFERENCES farms (id)  ON DELETE CASCADE,
    CONSTRAINT fk_animals_breed FOREIGN KEY (breed_id) REFERENCES breeds (id) ON DELETE SET NULL,
    UNIQUE KEY uq_animals_farm_tag (farm_id, tag_number),
    INDEX idx_animals_farm    (farm_id),
    INDEX idx_animals_status  (status),
    INDEX idx_animals_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 14. `vaccinations`
Vaccination events per animal.
```sql
CREATE TABLE vaccinations (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL,
    vaccine_name     VARCHAR(150) NOT NULL,
    disease_target   VARCHAR(150) NULL,
    dose_ml          DECIMAL(8, 2) NULL,
    vaccination_date DATE NOT NULL,
    next_due_date    DATE NULL,
    batch_number     VARCHAR(100) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vaccinations_animal FOREIGN KEY (animal_id)       REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_vaccinations_user   FOREIGN KEY (administered_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_vaccinations_animal (animal_id),
    INDEX idx_vaccinations_date   (vaccination_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 15. `treatments`
Disease / health treatment events per animal.
```sql
CREATE TABLE treatments (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL,
    diagnosis        VARCHAR(255) NOT NULL,
    treatment_name   VARCHAR(150) NOT NULL,
    medication       VARCHAR(150) NULL,
    dose             VARCHAR(100) NULL,
    treatment_date   DATE NOT NULL,
    follow_up_date   DATE NULL,
    outcome          ENUM('recovered','ongoing','deceased','referred') NULL DEFAULT 'ongoing',
    cost             DECIMAL(10, 2) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_treatments_animal FOREIGN KEY (animal_id)       REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_treatments_user   FOREIGN KEY (administered_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_treatments_animal (animal_id),
    INDEX idx_treatments_date   (treatment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 16. `feed_records`
Daily / per-event feed consumption logs per animal.
```sql
CREATE TABLE feed_records (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id    INT UNSIGNED NOT NULL,
    recorded_by  INT UNSIGNED NOT NULL,
    feed_type    VARCHAR(150) NOT NULL,
    quantity_kg  DECIMAL(10, 2) NOT NULL,
    cost         DECIMAL(10, 2) NULL,
    feed_date    DATE NOT NULL,
    notes        TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feed_animal FOREIGN KEY (animal_id)   REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_feed_user   FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_feed_animal (animal_id),
    INDEX idx_feed_date   (feed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 17. `breeding_records`
Mating events and pregnancy outcomes.
```sql
CREATE TABLE breeding_records (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dam_id          INT UNSIGNED NOT NULL,
    sire_id         INT UNSIGNED NULL,
    recorded_by     INT UNSIGNED NOT NULL,
    mating_date     DATE NOT NULL,
    expected_birth  DATE NULL,
    actual_birth    DATE NULL,
    offspring_count TINYINT UNSIGNED NULL DEFAULT 0,
    outcome         ENUM('pending','successful','failed','miscarriage') NOT NULL DEFAULT 'pending',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_breeding_dam      FOREIGN KEY (dam_id)      REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_breeding_sire     FOREIGN KEY (sire_id)     REFERENCES animals (id) ON DELETE SET NULL,
    CONSTRAINT fk_breeding_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_breeding_dam (dam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 18. `livestock_production`
Periodic production records (milk, eggs, wool) per animal.
```sql
CREATE TABLE livestock_production (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT UNSIGNED NOT NULL,
    recorded_by     INT UNSIGNED NOT NULL,
    product_type    ENUM('milk','eggs','wool','meat','honey','other') NOT NULL,
    quantity        DECIMAL(10, 2) NOT NULL,
    unit            VARCHAR(20) NOT NULL,
    production_date DATE NOT NULL,
    quality_grade   ENUM('A','B','C','rejected') NULL DEFAULT 'A',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_production_animal   FOREIGN KEY (animal_id)   REFERENCES animals (id) ON DELETE CASCADE,
    CONSTRAINT fk_production_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_production_animal (animal_id),
    INDEX idx_production_date   (production_date),
    INDEX idx_production_type   (product_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🟢 Implemented Schemas (Phase 3)

### 19. `water_sources`
Water resources available to a farm.
```sql
CREATE TABLE water_sources (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('borehole','well','river','dam','municipal','rainwater','canal','other') NOT NULL,
    capacity_litres      DECIMAL(12, 2) NULL,
    current_level_litres DECIMAL(12, 2) NULL,
    ph_level             DECIMAL(4, 2) NULL,
    location_description TEXT NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_watersource_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_watersource_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 20. `irrigation_systems`
Irrigation hardware installed across fields.
```sql
CREATE TABLE irrigation_systems (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    water_source_id      INT UNSIGNED NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('drip','sprinkler','center_pivot','flood','micro_spray','manual','other') NOT NULL,
    flow_rate_lpm        DECIMAL(8, 2) NULL,
    status               ENUM('active','inactive','maintenance','faulty') NOT NULL DEFAULT 'active',
    installation_date    DATE NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_irrigsystem_farm   FOREIGN KEY (farm_id)         REFERENCES farms (id)         ON DELETE CASCADE,
    CONSTRAINT fk_irrigsystem_field  FOREIGN KEY (field_id)        REFERENCES fields (id)        ON DELETE SET NULL,
    CONSTRAINT fk_irrigsystem_source FOREIGN KEY (water_source_id) REFERENCES water_sources (id) ON DELETE SET NULL,
    INDEX idx_irrigsystem_farm  (farm_id),
    INDEX idx_irrigsystem_field (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 21. `irrigation_schedules`
Automated and planned watering schedules.
```sql
CREATE TABLE irrigation_schedules (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    system_id            INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    start_time           TIME NOT NULL,
    duration_minutes     INT UNSIGNED NOT NULL,
    target_volume_litres DECIMAL(10, 2) NULL,
    frequency            ENUM('daily','twice_daily','alternate_days','weekly','custom') NOT NULL DEFAULT 'daily',
    days_of_week         VARCHAR(50) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_irrigsched_system  FOREIGN KEY (system_id)  REFERENCES irrigation_systems (id) ON DELETE CASCADE,
    CONSTRAINT fk_irrigsched_field   FOREIGN KEY (field_id)   REFERENCES fields (id)             ON DELETE CASCADE,
    CONSTRAINT fk_irrigsched_creator FOREIGN KEY (created_by) REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_irrigsched_system (system_id),
    INDEX idx_irrigsched_field  (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 22. `water_consumption`
Logged water consumption per system and field.
```sql
CREATE TABLE water_consumption (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    system_id            INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    volume_litres        DECIMAL(10, 2) NOT NULL,
    duration_minutes     INT UNSIGNED NULL,
    cost_amount          DECIMAL(10, 2) NULL DEFAULT 0.00,
    logged_date          DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consumption_system   FOREIGN KEY (system_id)   REFERENCES irrigation_systems (id) ON DELETE CASCADE,
    CONSTRAINT fk_consumption_field    FOREIGN KEY (field_id)    REFERENCES fields (id)             ON DELETE SET NULL,
    CONSTRAINT fk_consumption_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)              ON DELETE CASCADE,
    INDEX idx_consumption_system (system_id),
    INDEX idx_consumption_field  (field_id),
    INDEX idx_consumption_date   (logged_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 23. `inventory_items`
Farm consumables, tools, seeds, fertilizers, and supplies.
```sql
CREATE TABLE inventory_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','animal_feed','vet_medicine','packaging','fuel','tools','equipment_parts','other') NOT NULL,
    sku                  VARCHAR(50) NULL,
    quantity_on_hand     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_of_measure      VARCHAR(20) NOT NULL DEFAULT 'units',
    reorder_level        DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    unit_cost            DECIMAL(10, 2) NULL DEFAULT 0.00,
    storage_location     VARCHAR(100) NULL,
    expiry_date          DATE NULL,
    supplier_name        VARCHAR(150) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invitem_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_invitem_farm     (farm_id),
    INDEX idx_invitem_category (category),
    INDEX idx_invitem_sku      (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 24. `stock_movements`
Ledger of stock adjustments, receipts, and consumption.
```sql
CREATE TABLE stock_movements (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    movement_type        ENUM('stock_in','stock_out','adjustment','wastage','transfer') NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit_price           DECIMAL(10, 2) NULL,
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stockmove_item     FOREIGN KEY (item_id)     REFERENCES inventory_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_stockmove_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_stockmove_item (item_id),
    INDEX idx_stockmove_type (movement_type),
    INDEX idx_stockmove_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 25. `equipment`
Farm machinery, implements, and asset registry.
```sql
CREATE TABLE equipment (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('tractor','harvester','planter','sprayer','tillage','trailer','pump','generator','vehicle','implement','hand_tool','other') NOT NULL,
    brand                VARCHAR(100) NULL,
    model                VARCHAR(100) NULL,
    serial_number        VARCHAR(100) NULL,
    purchase_date        DATE NULL,
    purchase_cost        DECIMAL(12, 2) NULL DEFAULT 0.00,
    current_value        DECIMAL(12, 2) NULL DEFAULT 0.00,
    operating_hours      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fuel_type            ENUM('diesel','petrol','electric','manual','none') NOT NULL DEFAULT 'diesel',
    status               ENUM('available','in_use','maintenance','repair','retired') NOT NULL DEFAULT 'available',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_equipment_farm   (farm_id),
    INDEX idx_equipment_type   (type),
    INDEX idx_equipment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 26. `maintenance_schedules`
Preventative maintenance intervals for equipment.
```sql
CREATE TABLE maintenance_schedules (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    service_type         VARCHAR(150) NOT NULL,
    interval_hours       DECIMAL(8, 2) NULL,
    interval_days        INT UNSIGNED NULL,
    last_service_date    DATE NULL,
    next_service_date    DATE NULL,
    last_service_hours   DECIMAL(10, 2) NULL,
    next_service_hours   DECIMAL(10, 2) NULL,
    status               ENUM('scheduled','due','overdue','completed') NOT NULL DEFAULT 'scheduled',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintsched_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    INDEX idx_maintsched_equipment (equipment_id),
    INDEX idx_maintsched_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 27. `repair_history`
Unscheduled repairs and technician service logs.
```sql
CREATE TABLE repair_history (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    description          TEXT NOT NULL,
    cost_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    technician_name      VARCHAR(150) NULL,
    repair_date          DATE NOT NULL,
    parts_replaced       TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repair_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_recorder  FOREIGN KEY (recorded_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_repair_equipment (equipment_id),
    INDEX idx_repair_date      (repair_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 28. `fuel_logs`
Fuel consumption and hour meter logs.
```sql
CREATE TABLE fuel_logs (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id         INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    litres_added         DECIMAL(8, 2) NOT NULL,
    cost_amount          DECIMAL(10, 2) NULL DEFAULT 0.00,
    current_meter_hours  DECIMAL(10, 2) NULL,
    logged_date          DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fuellog_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
    CONSTRAINT fk_fuellog_recorder  FOREIGN KEY (recorded_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_fuellog_equipment (equipment_id),
    INDEX idx_fuellog_date      (logged_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 29. `workers`
Farm employees and labour staff.
```sql
CREATE TABLE workers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    user_id              INT UNSIGNED NULL,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    id_national_number   VARCHAR(50) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    role                 ENUM('field_worker','supervisor','tractor_driver','harvester','agronomist','technician','general_labour','other') NOT NULL DEFAULT 'field_worker',
    employment_type      ENUM('permanent','seasonal','temporary','contract','daily') NOT NULL DEFAULT 'permanent',
    daily_rate           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    hire_date            DATE NULL,
    status               ENUM('active','on_leave','terminated','suspended') NOT NULL DEFAULT 'active',
    emergency_contact    VARCHAR(150) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_worker_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_worker_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_worker_farm   (farm_id),
    INDEX idx_worker_status (status),
    INDEX idx_worker_role   (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 30. `worker_attendance`
Daily attendance records per worker.
```sql
CREATE TABLE worker_attendance (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id            INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    work_date            DATE NOT NULL,
    status               ENUM('present','absent','half_day','sick_leave','paid_leave','unpaid_leave') NOT NULL DEFAULT 'present',
    hours_worked         DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
    overtime_hours       DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attend_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE CASCADE,
    CONSTRAINT fk_attend_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_attend_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    UNIQUE KEY uq_worker_date (worker_id, work_date),
    INDEX idx_attend_farm (farm_id),
    INDEX idx_attend_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 31. `task_assignments`
Daily work orders and field task dispatching.
```sql
CREATE TABLE task_assignments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NULL,
    worker_id            INT UNSIGNED NULL,
    assigned_by          INT UNSIGNED NOT NULL,
    title                VARCHAR(150) NOT NULL,
    description          TEXT NULL,
    priority             ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    due_date             DATE NULL,
    status               ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    completed_at         TIMESTAMP NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_task_field    FOREIGN KEY (field_id)    REFERENCES fields (id)  ON DELETE SET NULL,
    CONSTRAINT fk_task_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE SET NULL,
    CONSTRAINT fk_task_assigner FOREIGN KEY (assigned_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_task_farm   (farm_id),
    INDEX idx_task_worker (worker_id),
    INDEX idx_task_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 32. `payroll_records`
Worker wages and payroll disbursements.
```sql
CREATE TABLE payroll_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id            INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    period_start         DATE NOT NULL,
    period_end           DATE NOT NULL,
    days_worked          DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    base_salary          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    overtime_amount      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus_amount         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_payable          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status       ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
    payment_date         DATE NULL,
    payment_method       ENUM('cash','bank_transfer','mobile_money','cheque') NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payroll_worker   FOREIGN KEY (worker_id)   REFERENCES workers (id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)   ON DELETE CASCADE,
    CONSTRAINT fk_payroll_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)   ON DELETE CASCADE,
    INDEX idx_payroll_worker (worker_id),
    INDEX idx_payroll_farm   (farm_id),
    INDEX idx_payroll_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 33. `pests_diseases`
Agronomic pest, fungus, and disease database.
```sql
CREATE TABLE pests_diseases (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    scientific_name      VARCHAR(150) NULL,
    type                 ENUM('pest','fungal_disease','bacterial_disease','viral_disease','weed','nematode','deficiency','other') NOT NULL,
    affected_crops       TEXT NULL,
    symptoms_description TEXT NULL,
    prevention_measures  TEXT NULL,
    recommended_control  TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pest_type (type),
    INDEX idx_pest_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 34. `scouting_records`
Field observations and pest incidence reporting.
```sql
CREATE TABLE scouting_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    crop_id              INT UNSIGNED NULL,
    pest_disease_id      INT UNSIGNED NULL,
    scouted_by           INT UNSIGNED NOT NULL,
    severity             ENUM('low','moderate','severe','critical') NOT NULL DEFAULT 'low',
    affected_area_pct    DECIMAL(5, 2) NULL,
    observation_date     DATE NOT NULL,
    symptoms_found       TEXT NULL,
    action_required      TINYINT(1) NOT NULL DEFAULT 0,
    photo_url            VARCHAR(255) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scout_farm     FOREIGN KEY (farm_id)         REFERENCES farms (id)          ON DELETE CASCADE,
    CONSTRAINT fk_scout_field    FOREIGN KEY (field_id)        REFERENCES fields (id)         ON DELETE CASCADE,
    CONSTRAINT fk_scout_crop     FOREIGN KEY (crop_id)         REFERENCES crops (id)          ON DELETE SET NULL,
    CONSTRAINT fk_scout_pest     FOREIGN KEY (pest_disease_id) REFERENCES pests_diseases (id) ON DELETE SET NULL,
    CONSTRAINT fk_scout_recorder FOREIGN KEY (scouted_by)      REFERENCES users (id)          ON DELETE CASCADE,
    INDEX idx_scout_field    (field_id),
    INDEX idx_scout_severity (severity),
    INDEX idx_scout_date     (observation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 35. `pest_treatments`
Chemical application and spraying effectiveness logs.
```sql
CREATE TABLE pest_treatments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scouting_id          INT UNSIGNED NULL,
    field_id             INT UNSIGNED NOT NULL,
    applied_by           INT UNSIGNED NOT NULL,
    treatment_type       ENUM('chemical_spray','biological_control','organic_spray','cultural_control','pruning_removal','other') NOT NULL DEFAULT 'chemical_spray',
    chemical_product     VARCHAR(150) NOT NULL,
    active_ingredient    VARCHAR(150) NULL,
    dosage_rate          VARCHAR(100) NOT NULL,
    total_quantity_used  DECIMAL(10, 2) NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'litres',
    application_date     DATE NOT NULL,
    pre_harvest_interval_days INT UNSIGNED NULL DEFAULT 0,
    re_entry_interval_hours   INT UNSIGNED NULL DEFAULT 24,
    effectiveness        ENUM('pending','highly_effective','moderately_effective','ineffective') NOT NULL DEFAULT 'pending',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_treat_scout    FOREIGN KEY (scouting_id) REFERENCES scouting_records (id) ON DELETE SET NULL,
    CONSTRAINT fk_treat_field    FOREIGN KEY (field_id)    REFERENCES fields (id)           ON DELETE CASCADE,
    CONSTRAINT fk_treat_applier  FOREIGN KEY (applied_by)  REFERENCES users (id)            ON DELETE CASCADE,
    INDEX idx_treat_field (field_id),
    INDEX idx_treat_date  (application_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 36. `weather_observations`
Microclimate weather observations and sensor logs.
```sql
CREATE TABLE weather_observations (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NULL,
    temperature_c        DECIMAL(5, 2) NOT NULL,
    humidity_pct         DECIMAL(5, 2) NULL,
    rainfall_mm          DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    wind_speed_kmh       DECIMAL(5, 2) NULL,
    wind_direction       VARCHAR(10) NULL,
    solar_radiation_wm2  DECIMAL(7, 2) NULL,
    soil_temperature_c   DECIMAL(5, 2) NULL,
    soil_moisture_pct    DECIMAL(5, 2) NULL,
    condition_summary    VARCHAR(100) NULL,
    source               ENUM('manual','sensor','open_meteo_api','station') NOT NULL DEFAULT 'manual',
    observed_at          DATETIME NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weather_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_weather_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_weather_farm (farm_id),
    INDEX idx_weather_date (observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 37. `weather_alerts`
Active environmental risks, frost warnings, and severe weather advisories.
```sql
CREATE TABLE weather_alerts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NULL,
    alert_type           ENUM('frost','heatwave','heavy_rain','flood','drought','strong_winds','hail','storm','high_humidity') NOT NULL,
    severity             ENUM('advisory','watch','warning','emergency') NOT NULL DEFAULT 'warning',
    title                VARCHAR(150) NOT NULL,
    description          TEXT NOT NULL,
    recommended_action   TEXT NULL,
    valid_from           DATETIME NOT NULL,
    valid_until          DATETIME NOT NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weathalert_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_weathalert_creator  FOREIGN KEY (created_by)  REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_weathalert_farm   (farm_id),
    INDEX idx_weathalert_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

---

## 🟢 Implemented Schemas (Phase 4)

### 38. `harvest_records`
Harvest yields, quality grading, and post-harvest loss tracking.
```sql
CREATE TABLE harvest_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    field_id             INT UNSIGNED NOT NULL,
    crop_id              INT UNSIGNED NOT NULL,
    variety_id           INT UNSIGNED NULL,
    harvested_by         INT UNSIGNED NOT NULL,
    harvest_date         DATE NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    expected_yield_kg    DECIMAL(10, 2) NULL,
    loss_kg              DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quality_grade        ENUM('A','B','C','rejected') NOT NULL DEFAULT 'A',
    storage_location     VARCHAR(100) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_harvest_farm     FOREIGN KEY (farm_id)      REFERENCES farms (id)           ON DELETE CASCADE,
    CONSTRAINT fk_harvest_field    FOREIGN KEY (field_id)     REFERENCES fields (id)          ON DELETE CASCADE,
    CONSTRAINT fk_harvest_crop     FOREIGN KEY (crop_id)      REFERENCES crops (id)           ON DELETE CASCADE,
    CONSTRAINT fk_harvest_variety  FOREIGN KEY (variety_id)   REFERENCES crop_varieties (id)  ON DELETE SET NULL,
    CONSTRAINT fk_harvest_recorder FOREIGN KEY (harvested_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_harvest_farm  (farm_id),
    INDEX idx_harvest_field (field_id),
    INDEX idx_harvest_crop  (crop_id),
    INDEX idx_harvest_date  (harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 39. `customers`
Buyers, wholesale clients, and retailers.
```sql
CREATE TABLE customers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    type                 ENUM('wholesaler','retailer','processor','direct_consumer','supermarket','export','other') NOT NULL DEFAULT 'wholesaler',
    contact_person       VARCHAR(100) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    address              TEXT NULL,
    tax_number           VARCHAR(50) NULL,
    credit_limit         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_customer_farm (farm_id),
    INDEX idx_customer_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 40. `sales_orders`
Sales orders created for customers.
```sql
CREATE TABLE sales_orders (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    customer_id          INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    order_number         VARCHAR(50) NOT NULL UNIQUE,
    order_date           DATE NOT NULL,
    delivery_date        DATE NULL,
    status               ENUM('draft','confirmed','processing','dispatched','delivered','cancelled') NOT NULL DEFAULT 'draft',
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    CONSTRAINT fk_so_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_so_creator  FOREIGN KEY (created_by)  REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_so_farm     (farm_id),
    INDEX idx_so_customer (customer_id),
    INDEX idx_so_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 41. `order_items`
Line items attached to sales orders.
```sql
CREATE TABLE order_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id             INT UNSIGNED NOT NULL,
    item_type            ENUM('crop','livestock','value_added','other') NOT NULL DEFAULT 'crop',
    item_id              INT UNSIGNED NULL,
    item_name            VARCHAR(150) NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'kg',
    unit_price           DECIMAL(10, 2) NOT NULL,
    total_price          DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES sales_orders (id) ON DELETE CASCADE,
    INDEX idx_oi_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 42. `invoices`
Billing invoices generated from sales orders.
```sql
CREATE TABLE invoices (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id             INT UNSIGNED NOT NULL UNIQUE,
    customer_id          INT UNSIGNED NOT NULL,
    invoice_number       VARCHAR(50) NOT NULL UNIQUE,
    issue_date           DATE NOT NULL,
    due_date             DATE NOT NULL,
    subtotal             DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount           DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status               ENUM('unpaid','partially_paid','paid','overdue','cancelled') NOT NULL DEFAULT 'unpaid',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_order    FOREIGN KEY (order_id)    REFERENCES sales_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES customers (id)    ON DELETE CASCADE,
    INDEX idx_inv_customer (customer_id),
    INDEX idx_inv_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 43. `payments`
Payment receipts logged against invoices.
```sql
CREATE TABLE payments (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id           INT UNSIGNED NOT NULL,
    customer_id          INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    amount               DECIMAL(12, 2) NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','credit_card') NOT NULL DEFAULT 'bank_transfer',
    payment_date         DATE NOT NULL,
    reference_number     VARCHAR(100) NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices (id)  ON DELETE CASCADE,
    CONSTRAINT fk_pay_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)     ON DELETE CASCADE,
    INDEX idx_pay_invoice  (invoice_id),
    INDEX idx_pay_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 44. `market_prices`
Commodity price benchmark and historical trend records.
```sql
CREATE TABLE market_prices (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    commodity_name       VARCHAR(150) NOT NULL,
    market_location      VARCHAR(100) NOT NULL,
    price_per_unit       DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'kg',
    recorded_date        DATE NOT NULL,
    source               VARCHAR(100) NULL DEFAULT 'Agricultural Market Board',
    trend                ENUM('rising','stable','falling') NOT NULL DEFAULT 'stable',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mp_commodity (commodity_name),
    INDEX idx_mp_location  (market_location),
    INDEX idx_mp_date      (recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 45. `income_records`
Farm revenues, grants, subsidies, and income entries.
```sql
CREATE TABLE income_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    category             ENUM('crop_sales','livestock_sales','byproducts','subsidies','grants','machinery_rental','agritourism','consulting','other') NOT NULL DEFAULT 'crop_sales',
    amount               DECIMAL(12, 2) NOT NULL,
    date_received        DATE NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','other') NOT NULL DEFAULT 'bank_transfer',
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    payer_name           VARCHAR(150) NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inc_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_inc_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_inc_farm     (farm_id),
    INDEX idx_inc_category (category),
    INDEX idx_inc_date     (date_received)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 46. `expense_records`
Operational costs, inputs, wages, utilities, and expenditures.
```sql
CREATE TABLE expense_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','animal_feed','veterinary','fuel','labour_wages','equipment_maintenance','machinery_repairs','irrigation_water','utilities','land_lease','insurance','packaging','transport','other') NOT NULL,
    amount               DECIMAL(12, 2) NOT NULL,
    date_incurred        DATE NOT NULL,
    payment_method       ENUM('bank_transfer','cash','mobile_money','cheque','credit_card','other') NOT NULL DEFAULT 'bank_transfer',
    vendor_name          VARCHAR(150) NULL,
    reference_type       VARCHAR(50) NULL,
    reference_id         INT UNSIGNED NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_exp_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_exp_farm     (farm_id),
    INDEX idx_exp_category (category),
    INDEX idx_exp_date     (date_incurred)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 47. `loans`
Farm debt liabilities, bank financing, and repayment progress.
```sql
CREATE TABLE loans (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    lender_name          VARCHAR(150) NOT NULL,
    principal_amount     DECIMAL(12, 2) NOT NULL,
    interest_rate_pct    DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    loan_term_months     INT UNSIGNED NOT NULL,
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    monthly_payment      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_remaining    DECIMAL(12, 2) NOT NULL,
    status               ENUM('active','paid_off','defaulted','restructured') NOT NULL DEFAULT 'active',
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_loan_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_loan_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_loan_farm   (farm_id),
    INDEX idx_loan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 48. `budgets`
Financial budget allocations vs actual spending.
```sql
CREATE TABLE budgets (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    fiscal_year          INT UNSIGNED NOT NULL,
    period_name          VARCHAR(50) NOT NULL DEFAULT 'Annual',
    category             VARCHAR(100) NOT NULL,
    budgeted_amount      DECIMAL(12, 2) NOT NULL,
    actual_amount        DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_farm    FOREIGN KEY (farm_id)    REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_budget_farm (farm_id),
    INDEX idx_budget_year (fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 49. `suppliers`
Farm vendor registry with categories, terms, and ratings.
```sql
CREATE TABLE suppliers (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    category             ENUM('seeds','fertilizers','chemicals','machinery','feed','veterinary','packaging','fuel','tools','general','other') NOT NULL DEFAULT 'general',
    contact_person       VARCHAR(100) NULL,
    phone                VARCHAR(30) NULL,
    email                VARCHAR(150) NULL,
    address              TEXT NULL,
    tax_id               VARCHAR(50) NULL,
    rating               DECIMAL(3, 2) NULL DEFAULT 5.00,
    payment_terms_days   INT UNSIGNED NOT NULL DEFAULT 30,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_supp_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_supp_farm     (farm_id),
    INDEX idx_supp_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 50. `supplier_quotations`
Item quotes and pricing validity provided by suppliers.
```sql
CREATE TABLE supplier_quotations (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id          INT UNSIGNED NOT NULL,
    farm_id              INT UNSIGNED NOT NULL,
    item_description     VARCHAR(200) NOT NULL,
    quoted_price         DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'units',
    valid_until          DATE NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quote_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    INDEX idx_quote_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 51. `purchase_orders`
Procurement purchase orders and approval workflow.
```sql
CREATE TABLE purchase_orders (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    supplier_id          INT UNSIGNED NOT NULL,
    created_by           INT UNSIGNED NOT NULL,
    approved_by          INT UNSIGNED NULL,
    po_number            VARCHAR(50) NOT NULL UNIQUE,
    order_date           DATE NOT NULL,
    expected_delivery_date DATE NULL,
    status               ENUM('draft','submitted','approved','rejected','received','cancelled') NOT NULL DEFAULT 'draft',
    total_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_farm     FOREIGN KEY (farm_id)     REFERENCES farms (id)     ON DELETE CASCADE,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
    CONSTRAINT fk_po_creator  FOREIGN KEY (created_by)  REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT fk_po_approver FOREIGN KEY (approved_by) REFERENCES users (id)     ON DELETE SET NULL,
    INDEX idx_po_farm     (farm_id),
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 52. `purchase_order_items`
Line items under purchase orders.
```sql
CREATE TABLE purchase_order_items (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id    INT UNSIGNED NOT NULL,
    description          VARCHAR(200) NOT NULL,
    quantity             DECIMAL(10, 2) NOT NULL,
    unit                 VARCHAR(20) NOT NULL DEFAULT 'units',
    unit_price           DECIMAL(10, 2) NOT NULL,
    total_price          DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_poi_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE,
    INDEX idx_poi_order (purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 53. `warehouses`
Silos, cold storage facilities, sheds, and warehouses.
```sql
CREATE TABLE warehouses (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id                INT UNSIGNED NOT NULL,
    name                   VARCHAR(150) NOT NULL,
    type                   ENUM('silo','cold_storage','dry_shed','grain_bin','greenhouse','packing_shed','cellar','other') NOT NULL DEFAULT 'dry_shed',
    capacity_cubic_metres  DECIMAL(10, 2) NULL,
    current_temperature_c  DECIMAL(5, 2) NULL,
    current_humidity_pct   DECIMAL(5, 2) NULL,
    location_description   TEXT NULL,
    is_active              TINYINT(1) NOT NULL DEFAULT 1,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wh_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    INDEX idx_wh_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 54. `storage_batches`
Stored produce batches, remaining quantities, and spoilage.
```sql
CREATE TABLE storage_batches (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id           INT UNSIGNED NOT NULL,
    harvest_id             INT UNSIGNED NULL,
    crop_id                INT UNSIGNED NOT NULL,
    batch_code             VARCHAR(50) NOT NULL UNIQUE,
    quantity_stored_kg     DECIMAL(10, 2) NOT NULL,
    quantity_remaining_kg  DECIMAL(10, 2) NOT NULL,
    unit_cost_estimated    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quality_grade          ENUM('A','B','C','rejected') NOT NULL DEFAULT 'A',
    entry_date             DATE NOT NULL,
    expiry_date            DATE NULL,
    status                 ENUM('stored','partially_dispatched','dispatched','spoiled') NOT NULL DEFAULT 'stored',
    spoilage_kg            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes                  TEXT NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_wh      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)      ON DELETE CASCADE,
    CONSTRAINT fk_batch_harvest FOREIGN KEY (harvest_id)   REFERENCES harvest_records (id) ON DELETE SET NULL,
    CONSTRAINT fk_batch_crop    FOREIGN KEY (crop_id)      REFERENCES crops (id)            ON DELETE CASCADE,
    INDEX idx_batch_wh     (warehouse_id),
    INDEX idx_batch_crop   (crop_id),
    INDEX idx_batch_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 55. `storage_movements` & `dispatch_records`
Intake, dispatch, and spoilage ledger.
```sql
CREATE TABLE storage_movements (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_id             INT UNSIGNED NOT NULL,
    recorded_by          INT UNSIGNED NOT NULL,
    movement_type        ENUM('intake','dispatch','spoilage_writeoff','warehouse_transfer') NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sm_batch    FOREIGN KEY (batch_id)    REFERENCES storage_batches (id) ON DELETE CASCADE,
    CONSTRAINT fk_sm_recorder FOREIGN KEY (recorded_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_sm_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dispatch_records (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_id             INT UNSIGNED NOT NULL,
    order_id             INT UNSIGNED NULL,
    dispatched_by        INT UNSIGNED NOT NULL,
    quantity_kg          DECIMAL(10, 2) NOT NULL,
    destination          VARCHAR(150) NOT NULL,
    vehicle_registration VARCHAR(50) NULL,
    driver_name          VARCHAR(100) NULL,
    dispatch_date        DATE NOT NULL,
    notes                TEXT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disp_batch    FOREIGN KEY (batch_id)      REFERENCES storage_batches (id) ON DELETE CASCADE,
    CONSTRAINT fk_disp_order    FOREIGN KEY (order_id)      REFERENCES sales_orders (id)    ON DELETE SET NULL,
    CONSTRAINT fk_disp_recorder FOREIGN KEY (dispatched_by) REFERENCES users (id)           ON DELETE CASCADE,
    INDEX idx_disp_batch (batch_id),
    INDEX idx_disp_date  (dispatch_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

---

## 🟢 Implemented Schemas (Phase 5)

### 56. `alerts`
System alerts, diagnostics, risk warnings, and automated notification triggers.
```sql
CREATE TABLE alerts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id              INT UNSIGNED NOT NULL,
    user_id              INT UNSIGNED NULL,
    alert_type           ENUM('inventory_low','maintenance_due','weather_risk','vaccination_due','harvest_due','pest_outbreak','task_overdue','loan_payment_due','general') NOT NULL DEFAULT 'general',
    title                VARCHAR(150) NOT NULL,
    message              TEXT NOT NULL,
    severity             ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
    is_read              TINYINT(1) NOT NULL DEFAULT 0,
    is_dismissed         TINYINT(1) NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_alert_farm      (farm_id),
    INDEX idx_alert_user      (user_id),
    INDEX idx_alert_type      (alert_type),
    INDEX idx_alert_severity  (severity),
    INDEX idx_alert_dismissed (is_dismissed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 57. `notification_logs`
Delivery channel logging and dispatch history.
```sql
CREATE TABLE notification_logs (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_id             INT UNSIGNED NOT NULL,
    channel              ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
    status               ENUM('sent','delivered','failed') NOT NULL DEFAULT 'sent',
    sent_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
    INDEX idx_notif_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🏁 All Backend Schemas Implemented (Phases 1–5 Complete)

All planned database entities across all 18 feature modules are now implemented, migrated, indexed, and wired to the backend API.

---

## 📌 Schema Design Guidelines for Teammates

1. **Naming Conventions**:
   - Use `snake_case` for all table names and column names.
   - Use plural nouns for table names (`farms`, `users`, `harvests`).
   - Primary key must always be `id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.
2. **Foreign Keys**:
   - Foreign keys must end with `_id` (e.g. `farm_id`, `user_id`).
   - Explicitly define foreign key constraints with `CONSTRAINT fk_tablename_columnname`.
3. **Timestamps**:
   - Always include `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
   - Include `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` for mutable records.
4. **Migrations**:
   - Save SQL definitions in `database/migrations/00X_filename.sql` sequentially before writing backend models.


