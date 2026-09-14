-- =============================================================================
-- Migration 004: Livestock Management
-- Tables: breeds, animals, vaccinations, treatments, feed_records,
--         breeding_records, livestock_production
-- Depends on: farms (Migration 002), users (Migration 001)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. breeds
--    Master breed catalogue (e.g. "Angus", "Holstein Friesian")
-- -----------------------------------------------------------------------------
CREATE TABLE breeds (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    species     ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_breed_species_name (species, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. animals
--    Individual animal registry. Tied to a farm, optional breed.
-- -----------------------------------------------------------------------------
CREATE TABLE animals (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farm_id         INT UNSIGNED NOT NULL,
    breed_id        INT UNSIGNED NULL,
    tag_number      VARCHAR(50) NOT NULL COMMENT 'Ear tag / RFID / unique identifier',
    name            VARCHAR(100) NULL COMMENT 'Optional name',
    species         ENUM('cattle','goat','sheep','pig','poultry','rabbit','other') NOT NULL,
    gender          ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown',
    date_of_birth   DATE NULL,
    date_of_death   DATE NULL,
    cause_of_death  VARCHAR(255) NULL,
    weight_kg       DECIMAL(8, 2) NULL COMMENT 'Most recent recorded weight',
    purchase_price  DECIMAL(10, 2) NULL,
    purchase_date   DATE NULL,
    source          VARCHAR(150) NULL COMMENT 'Where the animal came from',
    status          ENUM('active','sold','deceased','quarantine') NOT NULL DEFAULT 'active',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_animals_farm  FOREIGN KEY (farm_id)  REFERENCES farms (id)  ON DELETE CASCADE,
    CONSTRAINT fk_animals_breed FOREIGN KEY (breed_id) REFERENCES breeds (id) ON DELETE SET NULL,
    UNIQUE KEY uq_animals_farm_tag (farm_id, tag_number),
    INDEX idx_animals_farm   (farm_id),
    INDEX idx_animals_status (status),
    INDEX idx_animals_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. vaccinations
--    Vaccination events per animal
-- -----------------------------------------------------------------------------
CREATE TABLE vaccinations (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL COMMENT 'User who recorded / gave the vaccine',
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

-- -----------------------------------------------------------------------------
-- 4. treatments
--    Disease / health treatment events per animal
-- -----------------------------------------------------------------------------
CREATE TABLE treatments (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id        INT UNSIGNED NOT NULL,
    administered_by  INT UNSIGNED NOT NULL,
    diagnosis        VARCHAR(255) NOT NULL,
    treatment_name   VARCHAR(150) NOT NULL,
    medication       VARCHAR(150) NULL,
    dose             VARCHAR(100) NULL COMMENT 'e.g. 10ml, 2 tablets',
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

-- -----------------------------------------------------------------------------
-- 5. feed_records
--    Daily / per-event feed consumption logs
-- -----------------------------------------------------------------------------
CREATE TABLE feed_records (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id    INT UNSIGNED NOT NULL,
    recorded_by  INT UNSIGNED NOT NULL,
    feed_type    VARCHAR(150) NOT NULL COMMENT 'e.g. hay, silage, concentrates',
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

-- -----------------------------------------------------------------------------
-- 6. breeding_records
--    Mating events and pregnancy outcomes
-- -----------------------------------------------------------------------------
CREATE TABLE breeding_records (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dam_id          INT UNSIGNED NOT NULL  COMMENT 'Female animal',
    sire_id         INT UNSIGNED NULL      COMMENT 'Male animal (null = artificial insemination)',
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

-- -----------------------------------------------------------------------------
-- 7. livestock_production
--    Periodic production records (milk, eggs, wool) per animal
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_production (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT UNSIGNED NOT NULL,
    recorded_by     INT UNSIGNED NOT NULL,
    product_type    ENUM('milk','eggs','wool','meat','honey','other') NOT NULL,
    quantity        DECIMAL(10, 2) NOT NULL,
    unit            VARCHAR(20) NOT NULL COMMENT 'e.g. litres, kg, units',
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
