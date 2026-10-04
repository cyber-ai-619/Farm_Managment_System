<?php

declare(strict_types=1);

/**
 * Mock Data Seeder for Farm Management System (FFMS)
 * 
 * Populates complete, realistic relational demo data for user Timon Chisanga (id: 5)
 * across all 18 farm management modules.
 */

require_once __DIR__ . '/../../backend/src/bootstrap.php';

echo "========================================================\n";
echo "FFMS Database Mock Data Seeder\n";
echo "========================================================\n\n";

$pdo = getPdo();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Resolve Target User
$userId = 5;
$stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = :id");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    // Fallback to first farm owner if user 5 doesn't exist
    $user = $pdo->query("SELECT id, name, email FROM users WHERE role_id = 2 ORDER BY id ASC LIMIT 1")->fetch();
    if (!$user) {
        die("Error: No Farm Owner user found in users table.\n");
    }
    $userId = (int)$user['id'];
}

echo "Target User: {$user['name']} (ID: {$userId}, Email: {$user['email']})\n\n";

// Disable foreign key checks for clean cleanup if re-running
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

try {
    $pdo->beginTransaction();

    // -------------------------------------------------------------
    // Clean existing records for this user's farms to prevent duplicates
    // -------------------------------------------------------------
    echo "1. Checking and preparing existing farm records...\n";
    $farmStmt = $pdo->prepare("SELECT id FROM farms WHERE owner_id = :owner_id");
    $farmStmt->execute([':owner_id' => $userId]);
    $existingFarmIds = $farmStmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($existingFarmIds)) {
        $inFarms = implode(',', array_map('intval', $existingFarmIds));
        echo "   Cleaning up previous mock data for farm IDs: {$inFarms}...\n";

        // Get fields
        $fields = $pdo->query("SELECT id FROM fields WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inFields = !empty($fields) ? implode(',', array_map('intval', $fields)) : '0';

        // Get plantings
        $plantings = $pdo->query("SELECT id FROM planting_schedules WHERE field_id IN ({$inFields})")->fetchAll(PDO::FETCH_COLUMN);
        $inPlantings = !empty($plantings) ? implode(',', array_map('intval', $plantings)) : '0';

        // Get animals
        $animals = $pdo->query("SELECT id FROM animals WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inAnimals = !empty($animals) ? implode(',', array_map('intval', $animals)) : '0';

        // Get equipment
        $equipment = $pdo->query("SELECT id FROM equipment WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inEquipment = !empty($equipment) ? implode(',', array_map('intval', $equipment)) : '0';

        // Get warehouses
        $warehouses = $pdo->query("SELECT id FROM warehouses WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inWarehouses = !empty($warehouses) ? implode(',', array_map('intval', $warehouses)) : '0';

        // Get storage batches
        $batches = $pdo->query("SELECT id FROM storage_batches WHERE warehouse_id IN ({$inWarehouses})")->fetchAll(PDO::FETCH_COLUMN);
        $inBatches = !empty($batches) ? implode(',', array_map('intval', $batches)) : '0';

        // Get sales orders
        $orders = $pdo->query("SELECT id FROM sales_orders WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inOrders = !empty($orders) ? implode(',', array_map('intval', $orders)) : '0';

        // Get invoices
        $invoices = $pdo->query("SELECT id FROM invoices WHERE order_id IN ({$inOrders})")->fetchAll(PDO::FETCH_COLUMN);
        $inInvoices = !empty($invoices) ? implode(',', array_map('intval', $invoices)) : '0';

        // Get purchase orders
        $pos = $pdo->query("SELECT id FROM purchase_orders WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inPos = !empty($pos) ? implode(',', array_map('intval', $pos)) : '0';

        // Get irrigation systems
        $irrSystems = $pdo->query("SELECT id FROM irrigation_systems WHERE farm_id IN ({$inFarms})")->fetchAll(PDO::FETCH_COLUMN);
        $inIrrSystems = !empty($irrSystems) ? implode(',', array_map('intval', $irrSystems)) : '0';

        // Clean dependent tables
        $pdo->exec("DELETE FROM payments WHERE invoice_id IN ({$inInvoices})");
        $pdo->exec("DELETE FROM invoices WHERE id IN ({$inInvoices})");
        $pdo->exec("DELETE FROM order_items WHERE order_id IN ({$inOrders})");
        $pdo->exec("DELETE FROM dispatch_records WHERE batch_id IN ({$inBatches})");
        $pdo->exec("DELETE FROM storage_movements WHERE batch_id IN ({$inBatches})");
        $pdo->exec("DELETE FROM storage_batches WHERE id IN ({$inBatches})");
        $pdo->exec("DELETE FROM warehouses WHERE id IN ({$inWarehouses})");
        $pdo->exec("DELETE FROM sales_orders WHERE id IN ({$inOrders})");
        $pdo->exec("DELETE FROM purchase_order_items WHERE purchase_order_id IN ({$inPos})");
        $pdo->exec("DELETE FROM purchase_orders WHERE id IN ({$inPos})");
        $pdo->exec("DELETE FROM supplier_quotations WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM suppliers WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM customers WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM income_records WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM expense_records WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM budgets WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM loans WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM harvest_quality WHERE harvest_id IN (SELECT id FROM harvest_records WHERE farm_id IN ({$inFarms}))");
        $pdo->exec("DELETE FROM harvest_records WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM pest_treatments WHERE field_id IN ({$inFields})");
        $pdo->exec("DELETE FROM scouting_records WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM fertilizer_records WHERE planting_id IN ({$inPlantings})");
        $pdo->exec("DELETE FROM spraying_schedules WHERE planting_id IN ({$inPlantings})");
        $pdo->exec("DELETE FROM planting_schedules WHERE id IN ({$inPlantings})");
        $pdo->exec("DELETE FROM plots WHERE field_id IN ({$inFields})");
        $pdo->exec("DELETE FROM water_consumption WHERE system_id IN ({$inIrrSystems})");
        $pdo->exec("DELETE FROM irrigation_schedules WHERE system_id IN ({$inIrrSystems})");
        $pdo->exec("DELETE FROM irrigation_systems WHERE id IN ({$inIrrSystems})");
        $pdo->exec("DELETE FROM water_sources WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM fuel_logs WHERE equipment_id IN ({$inEquipment})");
        $pdo->exec("DELETE FROM repair_history WHERE equipment_id IN ({$inEquipment})");
        $pdo->exec("DELETE FROM maintenance_schedules WHERE equipment_id IN ({$inEquipment})");
        $pdo->exec("DELETE FROM equipment WHERE id IN ({$inEquipment})");
        $pdo->exec("DELETE FROM stock_movements WHERE item_id IN (SELECT id FROM inventory_items WHERE farm_id IN ({$inFarms}))");
        $pdo->exec("DELETE FROM inventory_items WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM payroll_records WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM worker_attendance WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM task_assignments WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM workers WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM livestock_production WHERE animal_id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM breeding_records WHERE dam_id IN ({$inAnimals}) OR sire_id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM vaccinations WHERE animal_id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM treatments WHERE animal_id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM feed_records WHERE animal_id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM animals WHERE id IN ({$inAnimals})");
        $pdo->exec("DELETE FROM weather_alerts WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM weather_observations WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM notification_logs WHERE alert_id IN (SELECT id FROM alerts WHERE farm_id IN ({$inFarms}))");
        $pdo->exec("DELETE FROM alerts WHERE farm_id IN ({$inFarms})");
        $pdo->exec("DELETE FROM fields WHERE id IN ({$inFields})");
        $pdo->exec("DELETE FROM farms WHERE id IN ({$inFarms})");
    }

    // -------------------------------------------------------------
    // 2. Insert Master Catalogues (Crops, Varieties, Breeds, Pests)
    // -------------------------------------------------------------
    echo "2. Populating master catalogues (Crops, Varieties, Breeds, Pests)...\n";

    // Crops
    $cropsData = [
        ['name' => 'Maize', 'scientific_name' => 'Zea mays', 'category' => 'cereal', 'description' => 'Staple white and yellow maize'],
        ['name' => 'Wheat', 'scientific_name' => 'Triticum aestivum', 'category' => 'cereal', 'description' => 'Hard red winter and spring wheat'],
        ['name' => 'Arabica Coffee', 'scientific_name' => 'Coffea arabica', 'category' => 'fruit', 'description' => 'Premium high-altitude Arabica coffee'],
        ['name' => 'Hass Avocado', 'scientific_name' => 'Persea americana', 'category' => 'fruit', 'description' => 'Export-grade Hass avocado trees'],
        ['name' => 'Beef Tomato', 'scientific_name' => 'Solanum lycopersicum', 'category' => 'vegetable', 'description' => 'Greenhouse large beefsteak tomatoes'],
        ['name' => 'Sweet Pepper', 'scientific_name' => 'Capsicum annuum', 'category' => 'vegetable', 'description' => 'Coloured bell peppers for fresh market'],
        ['name' => 'Rhodes Grass', 'scientific_name' => 'Chloris gayana', 'category' => 'fodder', 'description' => 'Nutritious pasture and hay forage'],
    ];

    $cropIds = [];
    foreach ($cropsData as $c) {
        $find = $pdo->prepare("SELECT id FROM crops WHERE LOWER(name) = LOWER(:name) LIMIT 1");
        $find->execute([':name' => $c['name']]);
        $existingId = $find->fetchColumn();
        if ($existingId) {
            $cropIds[$c['name']] = (int)$existingId;
        } else {
            $ins = $pdo->prepare("INSERT INTO crops (name, scientific_name, category, description) VALUES (:name, :scientific_name, :category, :description)");
            $ins->execute($c);
            $cropIds[$c['name']] = (int)$pdo->lastInsertId();
        }
    }

    // Varieties
    $varietyData = [
        ['crop' => 'Maize', 'name' => 'DKC 80-33 Hybrid', 'days' => 135, 'density' => '53,000 plants/ha', 'row' => 75.0, 'plant' => 25.0, 'yield' => 9.5],
        ['crop' => 'Maize', 'name' => 'SC Simba 61', 'days' => 140, 'density' => '50,000 plants/ha', 'row' => 75.0, 'plant' => 25.0, 'yield' => 8.8],
        ['crop' => 'Wheat', 'name' => 'Kenya Robin', 'days' => 110, 'density' => '120 kg/ha seed', 'row' => 20.0, 'plant' => 5.0, 'yield' => 4.5],
        ['crop' => 'Arabica Coffee', 'name' => 'Batian', 'days' => 270, 'density' => '2,500 trees/ha', 'row' => 200.0, 'plant' => 200.0, 'yield' => 5.0],
        ['crop' => 'Arabica Coffee', 'name' => 'Ruiru 11', 'days' => 270, 'density' => '3,000 trees/ha', 'row' => 200.0, 'plant' => 150.0, 'yield' => 4.8],
        ['crop' => 'Hass Avocado', 'name' => 'Hass Grafted G6', 'days' => 240, 'density' => '400 trees/ha', 'row' => 500.0, 'plant' => 500.0, 'yield' => 15.0],
        ['crop' => 'Beef Tomato', 'name' => 'Anna F1 Indeterminate', 'days' => 75, 'density' => '30,000 plants/ha', 'row' => 60.0, 'plant' => 45.0, 'yield' => 45.0],
    ];

    $varietyIds = [];
    foreach ($varietyData as $v) {
        $cId = $cropIds[$v['crop']] ?? null;
        if (!$cId) continue;
        $find = $pdo->prepare("SELECT id FROM crop_varieties WHERE crop_id = :crop_id AND variety_name = :vname LIMIT 1");
        $find->execute([':crop_id' => $cId, ':vname' => $v['name']]);
        $existingVId = $find->fetchColumn();
        if ($existingVId) {
            $varietyIds[$v['name']] = (int)$existingVId;
        } else {
            $ins = $pdo->prepare("INSERT INTO crop_varieties (crop_id, variety_name, days_to_maturity, planting_density, row_spacing_cm, plant_spacing_cm, expected_yield_t_ha) 
                VALUES (:cid, :vname, :days, :density, :row, :plant, :yield)");
            $ins->execute([
                ':cid' => $cId,
                ':vname' => $v['name'],
                ':days' => $v['days'],
                ':density' => $v['density'],
                ':row' => $v['row'],
                ':plant' => $v['plant'],
                ':yield' => $v['yield']
            ]);
            $varietyIds[$v['name']] = (int)$pdo->lastInsertId();
        }
    }

    // Breeds
    $breedsData = [
        ['name' => 'Holstein Friesian', 'species' => 'cattle', 'description' => 'World premier dairy breed producing high volume milk'],
        ['name' => 'Ayrshire Commercial', 'species' => 'cattle', 'description' => 'Hardy dairy breed with rich butterfat milk content'],
        ['name' => 'Boran', 'species' => 'cattle', 'description' => 'Indigenous East African beef breed, highly tick and heat tolerant'],
        ['name' => 'Boer Goat', 'species' => 'goat', 'description' => 'Fast-growing meat goat with muscular conformation'],
        ['name' => 'Saanen Dairy Goat', 'species' => 'goat', 'description' => 'Top milk producing dairy goat breed'],
        ['name' => 'Dorper', 'species' => 'sheep', 'description' => 'Hardy mutton sheep with rapid lamb growth rates'],
        ['name' => 'Kuroiler Poultry', 'species' => 'poultry', 'description' => 'Dual-purpose high egg laying and meat chicken'],
    ];

    $breedIds = [];
    foreach ($breedsData as $b) {
        $find = $pdo->prepare("SELECT id FROM breeds WHERE species = :species AND name = :name LIMIT 1");
        $find->execute([':species' => $b['species'], ':name' => $b['name']]);
        $existingBId = $find->fetchColumn();
        if ($existingBId) {
            $breedIds[$b['name']] = (int)$existingBId;
        } else {
            $ins = $pdo->prepare("INSERT INTO breeds (name, species, description) VALUES (:name, :species, :description)");
            $ins->execute($b);
            $breedIds[$b['name']] = (int)$pdo->lastInsertId();
        }
    }

    // Pests & Diseases Master
    $pestsData = [
        [
            'name' => 'Fall Armyworm',
            'scientific_name' => 'Spodoptera frugiperda',
            'type' => 'pest',
            'affected_crops' => 'Maize, Sorghum, Wheat',
            'symptoms_description' => 'Windowing of leaves, skeletonized foliage, frass in whorls, chewed cobs',
            'prevention_measures' => 'Early planting, pheromone traps, field sanitation',
            'recommended_control' => 'Application of Emamectin benzoate or Belt 480SC'
        ],
        [
            'name' => 'Coffee Berry Disease (CBD)',
            'scientific_name' => 'Colletotrichum kahawae',
            'type' => 'fungal_disease',
            'affected_crops' => 'Arabica Coffee',
            'symptoms_description' => 'Dark sunken necrotic anthracnose lesions on young green pinhead berries',
            'prevention_measures' => 'Canopy pruning for air circulation, planting resistant Batian variety',
            'recommended_control' => 'Preventive Copper oxychloride sprays and systemic pyraclostrobin'
        ],
        [
            'name' => 'Tomato Late Blight',
            'scientific_name' => 'Phytophthora infestans',
            'type' => 'fungal_disease',
            'affected_crops' => 'Beef Tomato, Potato',
            'symptoms_description' => 'Water-soaked pale spots turning brown/black with white mycelium in humid conditions',
            'prevention_measures' => 'Drip irrigation instead of overhead spray, adequate plant spacing',
            'recommended_control' => 'Mancozeb 80WP or Metalaxyl-M (Ridomil Gold)'
        ],
        [
            'name' => 'Avocado Anthracnose',
            'scientific_name' => 'Colletotrichum gloeosporioides',
            'type' => 'fungal_disease',
            'affected_crops' => 'Hass Avocado',
            'symptoms_description' => 'Circular black spots on skin penetrating into pulp as fruit ripens',
            'prevention_measures' => 'Pruning dead twigs, fruit bagging',
            'recommended_control' => 'Azoxystrobin or copper hydroxide spray regime'
        ],
    ];

    $pestIds = [];
    foreach ($pestsData as $p) {
        $find = $pdo->prepare("SELECT id FROM pests_diseases WHERE name = :name LIMIT 1");
        $find->execute([':name' => $p['name']]);
        $existingPId = $find->fetchColumn();
        if ($existingPId) {
            $pestIds[$p['name']] = (int)$existingPId;
        } else {
            $ins = $pdo->prepare("INSERT INTO pests_diseases (name, scientific_name, type, affected_crops, symptoms_description, prevention_measures, recommended_control) 
                VALUES (:name, :scientific_name, :type, :affected_crops, :symptoms_description, :prevention_measures, :recommended_control)");
            $ins->execute($p);
            $pestIds[$p['name']] = (int)$pdo->lastInsertId();
        }
    }

    // -------------------------------------------------------------
    // 3. Farms, Fields & Plots
    // -------------------------------------------------------------
    echo "3. Creating Farms, Fields & Plots for user {$userId}...\n";

    // Farm 1: Highland Estate Orchards (Limuru)
    $farm1Stmt = $pdo->prepare("INSERT INTO farms (owner_id, name, location, latitude, longitude, total_area_ha, description, is_active) 
        VALUES (:owner_id, :name, :location, :lat, :lng, :area, :desc, 1)");
    $farm1Stmt->execute([
        ':owner_id' => $userId,
        ':name' => 'Highland Estate Orchards',
        ':location' => 'Limuru, Kiambu County',
        ':lat' => -1.1130000,
        ':lng' => 36.6430000,
        ':area' => 45.50,
        ':desc' => 'Commercial high-altitude Arabica coffee estate, export Hass avocado orchards, and premium dairy unit.'
    ]);
    $farm1Id = (int)$pdo->lastInsertId();

    // Farm 2: Sun Valley Plains (Naivasha)
    $farm1Stmt->execute([
        ':owner_id' => $userId,
        ':name' => 'Sun Valley Plains',
        ':location' => 'Naivasha, Nakuru County',
        ':lat' => -0.7172000,
        ':lng' => 36.4310000,
        ':area' => 120.00,
        ':desc' => 'Mechanized cereal grain production (Maize & Wheat), commercial greenhouse horticulture, and livestock ranch.'
    ]);
    $farm2Id = (int)$pdo->lastInsertId();

    echo "   Farms created: #{$farm1Id} (Highland Estate Orchards) and #{$farm2Id} (Sun Valley Plains)\n";

    // Fields for Farm 1
    $fieldStmt = $pdo->prepare("INSERT INTO fields (farm_id, name, area_ha, soil_type, soil_condition, soil_ph, latitude, longitude, description, is_active) 
        VALUES (:farm_id, :name, :area, :soil_type, :soil_cond, :ph, :lat, :lng, :desc, 1)");

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'North Slope Block A (Coffee)',
        ':area' => 15.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'excellent',
        ':ph' => 6.20,
        ':lat' => -1.1121000,
        ':lng' => 36.6425000,
        ':desc' => 'Terraced volcanic red soil planted with Arabica coffee'
    ]);
    $field1Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'East Valley Avocado Grove',
        ':area' => 18.50,
        ':soil_type' => 'clay_loam',
        ':soil_cond' => 'good',
        ':ph' => 6.40,
        ':lat' => -1.1135000,
        ':lng' => 36.6440000,
        ':desc' => 'Drip-irrigated commercial Hass avocado orchard'
    ]);
    $field2Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'Dairy Pasture & Silage Meadow',
        ':area' => 12.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'good',
        ':ph' => 6.50,
        ':lat' => -1.1142000,
        ':lng' => 36.6418000,
        ':desc' => 'Rotational grazing paddocks and Rhodes grass for livestock feed'
    ]);
    $field3Id = (int)$pdo->lastInsertId();

    // Fields for Farm 2
    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Great Rift Maize Field 1',
        ':area' => 50.00,
        ':soil_type' => 'sandy_loam',
        ':soil_cond' => 'good',
        ':ph' => 6.80,
        ':lat' => -0.7165000,
        ':lng' => 36.4305000,
        ':desc' => 'Large mechanized block for commercial grain and silage maize'
    ]);
    $field4Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Pivot Green Wheat Section',
        ':area' => 45.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'excellent',
        ':ph' => 7.00,
        ':lat' => -0.7180000,
        ':lng' => 36.4320000,
        ':desc' => 'Center-pivot irrigated wheat zone'
    ]);
    $field5Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Horticulture Greenhouse Zone',
        ':area' => 25.00,
        ':soil_type' => 'sandy_loam',
        ':soil_cond' => 'good',
        ':ph' => 6.60,
        ':lat' => -0.7192000,
        ':lng' => 36.4290000,
        ':desc' => 'High-tunnel greenhouses for indeterminate beef tomatoes and sweet peppers'
    ]);
    $field6Id = (int)$pdo->lastInsertId();

    // Plots
    $plotStmt = $pdo->prepare("INSERT INTO plots (field_id, name, area_ha, description, is_active) VALUES (:field_id, :name, :area, :desc, 1)");
    $plotStmt->execute([':field_id' => $field1Id, ':name' => 'Plot A1 - Mature Batian Trees', ':area' => 7.50, ':desc' => 'Established coffee bushes']);
    $plotA1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field1Id, ':name' => 'Plot A2 - Ruiru 11 Grafted Block', ':area' => 7.50, ':desc' => 'Dense planting']);
    $plotA2 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field2Id, ':name' => 'Plot B1 - Primary Hass Orchard', ':area' => 12.00, ':desc' => 'Grafted Hass trees in peak production']);
    $plotB1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field2Id, ':name' => 'Plot B2 - Pollinator & Young Avocado', ':area' => 6.50, ':desc' => 'Interplanted Fuerte pollinator rows']);
    $plotB2 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field4Id, ':name' => 'Plot M1 - Hybrid Grain Block', ':area' => 30.00, ':desc' => 'Mechanized row crop']);
    $plotM1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field4Id, ':name' => 'Plot M2 - Livestock Silage Block', ':area' => 20.00, ':desc' => 'Dedicated dairy silage chop']);
    $plotM2 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field6Id, ':name' => 'Plot H1 - Anna F1 Tomato Greenhouses', ':area' => 2.50, ':desc' => 'Tunnel 1-5 beef tomatoes']);
    $plotH1 = (int)$pdo->lastInsertId();

    // -------------------------------------------------------------
    // 4. Planting Schedules & Crop Management
    // -------------------------------------------------------------
    echo "4. Seeding Planting Schedules, Fertilizer, and Spraying records...\n";

    $plantStmt = $pdo->prepare("INSERT INTO planting_schedules 
        (field_id, plot_id, crop_id, variety_id, planted_by, planting_date, expected_harvest_date, actual_harvest_date, area_planted_ha, seed_quantity_kg, status, notes)
        VALUES (:fid, :pid, :cid, :vid, :pby, :pdate, :edate, :adate, :area, :seeds, :status, :notes)");

    // Active Coffee planting (Highland)
    $plantStmt->execute([
        ':fid' => $field1Id, ':pid' => $plotA1, ':cid' => $cropIds['Arabica Coffee'], ':vid' => $varietyIds['Batian'],
        ':pby' => $userId, ':pdate' => '2024-03-15', ':edate' => '2026-11-20', ':adate' => null,
        ':area' => 7.50, ':seeds' => 18750.00, ':status' => 'growing',
        ':notes' => 'Coffee berry load is heavy; expected harvest late November.'
    ]);
    $plantCoffee = (int)$pdo->lastInsertId();

    // Active Avocado planting (Highland)
    $plantStmt->execute([
        ':fid' => $field2Id, ':pid' => $plotB1, ':cid' => $cropIds['Hass Avocado'], ':vid' => $varietyIds['Hass Grafted G6'],
        ':pby' => $userId, ':pdate' => '2023-10-10', ':edate' => '2026-12-05', ':adate' => null,
        ':area' => 12.00, ':seeds' => 4800.00, ':status' => 'growing',
        ':notes' => 'Export season harvest starting early December.'
    ]);
    $plantAvocado = (int)$pdo->lastInsertId();

    // Harvested Maize crop (Naivasha)
    $plantStmt->execute([
        ':fid' => $field4Id, ':pid' => $plotM1, ':cid' => $cropIds['Maize'], ':vid' => $varietyIds['DKC 80-33 Hybrid'],
        ':pby' => $userId, ':pdate' => '2026-03-20', ':edate' => '2026-08-10', ':adate' => '2026-08-15',
        ':area' => 30.00, ':seeds' => 750.00, ':status' => 'harvested',
        ':notes' => 'Successfully harvested with combine harvester; excellent yield.'
    ]);
    $plantMaizeHarvested = (int)$pdo->lastInsertId();

    // Active Second-season Maize (Naivasha)
    $plantStmt->execute([
        ':fid' => $field4Id, ':pid' => $plotM2, ':cid' => $cropIds['Maize'], ':vid' => $varietyIds['SC Simba 61'],
        ':pby' => $userId, ':pdate' => '2026-08-01', ':edate' => '2026-12-15', ':adate' => null,
        ':area' => 20.00, ':seeds' => 500.00, ':status' => 'growing',
        ':notes' => 'Vigorous vegetative stage, knee-high; top-dressing completed.'
    ]);
    $plantMaizeActive = (int)$pdo->lastInsertId();

    // Harvested Wheat section (Naivasha)
    $plantStmt->execute([
        ':fid' => $field5Id, ':pid' => null, ':cid' => $cropIds['Wheat'], ':vid' => $varietyIds['Kenya Robin'],
        ':pby' => $userId, ':pdate' => '2026-04-10', ':edate' => '2026-08-28', ':adate' => '2026-08-25',
        ':area' => 45.00, ':seeds' => 5400.00, ':status' => 'harvested',
        ':notes' => 'Milled quality grade 1 bread wheat delivered to local millers.'
    ]);
    $plantWheatHarvested = (int)$pdo->lastInsertId();

    // Active Greenhouse Tomatoes (Naivasha)
    $plantStmt->execute([
        ':fid' => $field6Id, ':pid' => $plotH1, ':cid' => $cropIds['Beef Tomato'], ':vid' => $varietyIds['Anna F1 Indeterminate'],
        ':pby' => $userId, ':pdate' => '2026-07-20', ':edate' => '2026-10-30', ':adate' => null,
        ':area' => 2.50, ':seeds' => 1.50, ':status' => 'growing',
        ':notes' => 'First trusses ripening nicely, trellised and pruned.'
    ]);
    $plantTomato = (int)$pdo->lastInsertId();

    // Fertilizer records
    $fertStmt = $pdo->prepare("INSERT INTO fertilizer_records (planting_id, applied_by, fertilizer_name, fertilizer_type, quantity_kg, application_date, notes)
        VALUES (:pid, :pby, :fname, :ftype, :qty, :fdate, :notes)");

    $fertStmt->execute([':pid' => $plantCoffee, ':pby' => $userId, ':fname' => 'YaraMila Complex NPK 17-17-17', ':ftype' => 'inorganic', ':qty' => 1200.00, ':fdate' => '2026-05-10', ':notes' => 'Spring basal dressing around drip lines']);
    $fertStmt->execute([':pid' => $plantAvocado, ':pby' => $userId, ':fname' => 'Well-cured Farmyard Manure', ':ftype' => 'organic', ':qty' => 5000.00, ':fdate' => '2026-06-15', ':notes' => 'Organic compost ring mulch under canopy']);
    $fertStmt->execute([':pid' => $plantMaizeHarvested, ':pby' => $userId, ':fname' => 'DAP (Di-Ammonium Phosphate)', ':ftype' => 'basal', ':qty' => 3000.00, ':fdate' => '2026-03-20', ':notes' => 'Placed 5cm below seed during planting']);
    $fertStmt->execute([':pid' => $plantMaizeActive, ':pby' => $userId, ':fname' => 'CAN (Calcium Ammonium Nitrate)', ':ftype' => 'top_dress', ':qty' => 2500.00, ':fdate' => '2026-09-02', ':notes' => 'Second vegetative stage top-dressing']);
    $fertStmt->execute([':pid' => $plantTomato, ':pby' => $userId, ':fname' => 'Calmax Calcium Boron Foliar', ':ftype' => 'foliar', ':qty' => 50.00, ':fdate' => '2026-09-18', ':notes' => 'Prevent blossom end rot in developing tomatoes']);

    // Spraying schedules
    $sprayStmt = $pdo->prepare("INSERT INTO spraying_schedules (planting_id, applied_by, chemical_name, chemical_type, quantity_litres, dilution_ratio, spray_date, target_pest, notes)
        VALUES (:pid, :pby, :cname, :ctype, :qty, :ratio, :sdate, :target, :notes)");

    $sprayStmt->execute([':pid' => $plantCoffee, ':pby' => $userId, ':cname' => 'Copper Nordox 75WG', ':ctype' => 'fungicide', ':qty' => 35.00, ':ratio' => '1:500', ':sdate' => '2026-06-20', ':target' => 'Coffee Berry Disease & Leaf Rust', ':notes' => 'Preventative berry protection']);
    $sprayStmt->execute([':pid' => $plantMaizeActive, ':pby' => $userId, ':cname' => 'Belt 480SC', ':ctype' => 'insecticide', ':qty' => 15.00, ':ratio' => '1:1000', ':sdate' => '2026-08-25', ':target' => 'Fall Armyworm', ':notes' => 'Directed nozzle spray into leaf whorls']);
    $sprayStmt->execute([':pid' => $plantTomato, ':pby' => $userId, ':cname' => 'Ridomil Gold MZ', ':ctype' => 'fungicide', ':qty' => 10.00, ':ratio' => '1:400', ':sdate' => '2026-09-15', ':target' => 'Tomato Late Blight', ':notes' => 'Routine greenhouse preventative protection']);

    // -------------------------------------------------------------
    // 5. Breeds & Animals (Livestock Registry)
    // -------------------------------------------------------------
    echo "5. Populating Livestock, Vaccinations, Treatments, Feed & Milk Production...\n";

    $animalsData = [
        // Farm 1: Dairy Cattle (Highland Estate)
        ['farm_id' => $farm1Id, 'breed' => 'Holstein Friesian', 'tag' => 'HF-001', 'name' => 'Bella Queen', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-04-12', 'weight' => 620.00, 'price' => 180000.00, 'source' => 'Naivasha Genetics Center', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Holstein Friesian', 'tag' => 'HF-002', 'name' => 'Daisy Buttercup', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-08-19', 'weight' => 580.00, 'price' => 175000.00, 'source' => 'Highland Dairy Breeders', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Holstein Friesian', 'tag' => 'HF-003', 'name' => 'Luna Star', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2023-01-05', 'weight' => 540.00, 'price' => 160000.00, 'source' => 'Highland Dairy Breeders', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Ayrshire Commercial', 'tag' => 'AYR-004', 'name' => 'Ruby Red', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2023-03-14', 'weight' => 490.00, 'price' => 150000.00, 'source' => 'Ol Jogi Stock', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Holstein Friesian', 'tag' => 'HF-BULL-01', 'name' => 'Titan Commander', 'species' => 'cattle', 'gender' => 'male', 'dob' => '2021-11-20', 'weight' => 890.00, 'price' => 250000.00, 'source' => 'Kenya Bull Stud Kabete', 'status' => 'active'],

        // Farm 2: Beef & Small Stock (Sun Valley Plains)
        ['farm_id' => $farm2Id, 'breed' => 'Boran', 'tag' => 'BOR-101', 'name' => 'Simba Bull', 'species' => 'cattle', 'gender' => 'male', 'dob' => '2021-06-10', 'weight' => 740.00, 'price' => 190000.00, 'source' => 'Laikipia Ranches', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Boran', 'tag' => 'BOR-102', 'name' => 'Kikao Cow', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-02-15', 'weight' => 520.00, 'price' => 135000.00, 'source' => 'Laikipia Ranches', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Boer Goat', 'tag' => 'BG-201', 'name' => 'Max Ram', 'species' => 'goat', 'gender' => 'male', 'dob' => '2023-05-10', 'weight' => 85.00, 'price' => 35000.00, 'source' => 'Kari Naivasha', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Boer Goat', 'tag' => 'BG-202', 'name' => 'Cleo Doe', 'species' => 'goat', 'gender' => 'female', 'dob' => '2023-06-14', 'weight' => 62.00, 'price' => 28000.00, 'source' => 'Kari Naivasha', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Dorper', 'tag' => 'DP-301', 'name' => 'Thunder Ewe', 'species' => 'sheep', 'gender' => 'female', 'dob' => '2023-04-18', 'weight' => 58.00, 'price' => 24000.00, 'source' => 'Narok Livestock Mart', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Dorper', 'tag' => 'DP-302', 'name' => 'Flash Ram', 'species' => 'sheep', 'gender' => 'male', 'dob' => '2023-03-02', 'weight' => 78.00, 'price' => 30000.00, 'source' => 'Narok Livestock Mart', 'status' => 'active'],
    ];

    $animalStmt = $pdo->prepare("INSERT INTO animals (farm_id, breed_id, tag_number, name, species, gender, date_of_birth, weight_kg, purchase_price, purchase_date, source, status, notes)
        VALUES (:farm_id, :breed_id, :tag, :name, :species, :gender, :dob, :weight, :price, '2024-01-15', :source, :status, :notes)");

    $animalIds = [];
    foreach ($animalsData as $a) {
        $bId = $breedIds[$a['breed']] ?? null;
        $animalStmt->execute([
            ':farm_id' => $a['farm_id'],
            ':breed_id' => $bId,
            ':tag' => $a['tag'],
            ':name' => $a['name'],
            ':species' => $a['species'],
            ':gender' => $a['gender'],
            ':dob' => $a['dob'],
            ':weight' => $a['weight'],
            ':price' => $a['price'],
            ':source' => $a['source'],
            ':status' => $a['status'],
            ':notes' => 'Registered healthy breeding and production stock'
        ]);
        $animalIds[$a['tag']] = (int)$pdo->lastInsertId();
    }

    // Vaccinations
    $vacStmt = $pdo->prepare("INSERT INTO vaccinations (animal_id, administered_by, vaccine_name, disease_target, dose_ml, vaccination_date, next_due_date, batch_number, notes)
        VALUES (:aid, :aby, :vname, :dtarget, :dose, :vdate, :ndate, :batch, :notes)");

    foreach (['HF-001', 'HF-002', 'HF-003', 'AYR-004'] as $tag) {
        $aId = $animalIds[$tag];
        $vacStmt->execute([
            ':aid' => $aId, ':aby' => $userId, ':vname' => 'Foot and Mouth Disease (FMD) Quadrivalent',
            ':dtarget' => 'FMD Types O, A, SAT1, SAT2', ':dose' => 5.00,
            ':vdate' => '2026-05-12', ':ndate' => '2026-11-12', ':batch' => 'KEVEVAPI-FMD-2026/04',
            ':notes' => 'Biannual routine livestock immunization'
        ]);
        $vacStmt->execute([
            ':aid' => $aId, ':aby' => $userId, ':vname' => 'Blanthrax Live Vaccine',
            ':dtarget' => 'Anthrax and Blackquarter', ':dose' => 2.00,
            ':vdate' => '2026-04-10', ':ndate' => '2027-04-10', ':batch' => 'BLAN-8891',
            ':notes' => 'Annual subcutaneous inoculation'
        ]);
    }

    // Treatments
    $treatStmt = $pdo->prepare("INSERT INTO treatments (animal_id, administered_by, diagnosis, treatment_name, medication, dose, treatment_date, follow_up_date, outcome, cost, notes)
        VALUES (:aid, :aby, :diag, :tname, :med, :dose, :tdate, :fdate, :outcome, :cost, :notes)");

    $treatStmt->execute([
        ':aid' => $animalIds['HF-002'], ':aby' => $userId, ':diag' => 'Mild clinical mastitis in rear right quarter',
        ':tname' => 'Intramammary antibiotic infusion', ':med' => 'Ubrolexin + Meloxicam Anti-inflammatory',
        ':dose' => '1 syringe BID for 3 days', ':tdate' => date('Y-m-d', strtotime('-12 days')),
        ':fdate' => date('Y-m-d', strtotime('-5 days')), ':outcome' => 'recovered', ':cost' => 3800.00,
        ':notes' => 'Milk withheld during 5-day withdrawal period. Cell count now normal.'
    ]);
    $treatStmt->execute([
        ':aid' => $animalIds['BG-201'], ':aby' => $userId, ':diag' => 'Internal gastrointestinal parasite burden',
        ':tname' => 'Broad-spectrum oral deworming', ':med' => 'Albendazole 10% Drench',
        ':dose' => '15 ml oral drench', ':tdate' => date('Y-m-d', strtotime('-20 days')),
        ':fdate' => null, ':outcome' => 'recovered', ':cost' => 1200.00,
        ':notes' => 'Routine flock deworming, weight gain restored.'
    ]);

    // Feed Records
    $feedStmt = $pdo->prepare("INSERT INTO feed_records (animal_id, recorded_by, feed_type, quantity_kg, cost, feed_date, notes)
        VALUES (:aid, :rby, :ftype, :qty, :cost, :fdate, :notes)");

    foreach (['HF-001', 'HF-002', 'HF-003'] as $tag) {
        $aId = $animalIds[$tag];
        $feedStmt->execute([
            ':aid' => $aId, ':rby' => $userId, ':ftype' => 'High Energy Dairy Meal 16% CP',
            ':qty' => 8.00, ':cost' => 320.00, ':fdate' => date('Y-m-d', strtotime('-1 day')),
            ':notes' => 'Divided in morning and evening milking rations'
        ]);
        $feedStmt->execute([
            ':aid' => $aId, ':rby' => $userId, ':ftype' => 'Fermented Maize Silage + Boma Rhodes Hay',
            ':qty' => 35.00, ':cost' => 280.00, ':fdate' => date('Y-m-d', strtotime('-1 day')),
            ':notes' => 'Total mixed ration (TMR) ad libitum'
        ]);
    }

    // Livestock Production (Daily Milk for cows across past 30 days)
    $prodStmt = $pdo->prepare("INSERT INTO livestock_production (animal_id, recorded_by, product_type, quantity, unit, production_date, quality_grade, notes)
        VALUES (:aid, :rby, 'milk', :qty, 'litres', :pdate, 'A', :notes)");

    $cows = [
        'HF-001' => ['base' => 26.5],
        'HF-002' => ['base' => 24.0],
        'HF-003' => ['base' => 22.5],
        'AYR-004' => ['base' => 18.0]
    ];

    for ($d = 29; $d >= 0; $d--) {
        $prodDate = date('Y-m-d', strtotime("-{$d} days"));
        foreach ($cows as $tag => $data) {
            $aId = $animalIds[$tag];
            // slight realistic variation +/- 1.5 L
            $variation = (sin($d * 0.5) * 1.5) + (mt_rand(-5, 5) / 10.0);
            $qty = round($data['base'] + $variation, 1);
            $prodStmt->execute([
                ':aid' => $aId,
                ':rby' => $userId,
                ':qty' => $qty,
                ':pdate' => $prodDate,
                ':notes' => 'Morning and evening bulked milk, butterfat 4.2%'
            ]);
        }
    }

    // -------------------------------------------------------------
    // 6. Water Sources, Irrigation Systems & Schedules
    // -------------------------------------------------------------
    echo "6. Seeding Water Sources, Irrigation Systems, and Consumption...\n";

    $wsStmt = $pdo->prepare("INSERT INTO water_sources (farm_id, name, type, capacity_litres, current_level_litres, ph_level, location_description, is_active)
        VALUES (:farm_id, :name, :type, :cap, :curr, :ph, :loc, 1)");

    $wsStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Limuru Deep Aquifer Borehole', ':type' => 'borehole',
        ':cap' => 600000.00, ':curr' => 540000.00, ':ph' => 6.80,
        ':loc' => 'Northern boundary pump station with solar submersible pump'
    ]);
    $ws1Id = (int)$pdo->lastInsertId();

    $wsStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Chania River Pumping Station', ':type' => 'river',
        ':cap' => 1200000.00, ':curr' => 980000.00, ':ph' => 7.10,
        ':loc' => 'Riparian extraction point with licensed water meter'
    ]);
    $ws2Id = (int)$pdo->lastInsertId();

    $wsStmt->execute([
        ':farm_id' => $farm2Id, ':name' => 'Naivasha Agricultural Dam Basin', ':type' => 'dam',
        ':cap' => 4500000.00, ':curr' => 3800000.00, ':ph' => 7.20,
        ':loc' => 'Earthen containment reservoir fed by seasonal rain runoff and boreholes'
    ]);
    $ws3Id = (int)$pdo->lastInsertId();

    // Irrigation Systems
    $isStmt = $pdo->prepare("INSERT INTO irrigation_systems (farm_id, field_id, water_source_id, name, type, flow_rate_lpm, status, installation_date, notes)
        VALUES (:farm_id, :field_id, :ws_id, :name, :type, :flow, 'active', :idate, :notes)");

    $isStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':ws_id' => $ws1Id,
        ':name' => 'East Orchard Drip Line System', ':type' => 'drip', ':flow' => 280.00,
        ':idate' => '2023-08-15', ':notes' => 'Pressure-compensating inline emitters spaced at 1m for avocados'
    ]);
    $is1Id = (int)$pdo->lastInsertId();

    $isStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field5Id, ':ws_id' => $ws3Id,
        ':name' => 'Sector 1 Center Pivot Rig', ':type' => 'center_pivot', ':flow' => 1500.00,
        ':idate' => '2022-03-10', ':notes' => 'Valmont 3-span center pivot covering 45ha wheat'
    ]);
    $is2Id = (int)$pdo->lastInsertId();

    $isStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field6Id, ':ws_id' => $ws3Id,
        ':name' => 'Greenhouse Automated Misting & Drip', ':type' => 'micro_spray', ':flow' => 150.00,
        ':idate' => '2023-11-20', ':notes' => 'Computerized fertigation manifold for beef tomatoes'
    ]);
    $is3Id = (int)$pdo->lastInsertId();

    // Irrigation Schedules & Consumption
    $ischStmt = $pdo->prepare("INSERT INTO irrigation_schedules (system_id, field_id, created_by, start_time, duration_minutes, target_volume_litres, frequency, days_of_week, is_active, notes)
        VALUES (:sys_id, :fid, :cby, :stime, :dur, :vol, :freq, :days, 1, :notes)");

    $ischStmt->execute([
        ':sys_id' => $is1Id, ':fid' => $field2Id, ':cby' => $userId,
        ':stime' => '06:00:00', ':dur' => 90, ':vol' => 25200.00, ':freq' => 'alternate_days',
        ':days' => 'Mon,Wed,Fri', ':notes' => 'Early morning avocado drip to avoid midday evaporation'
    ]);

    $ischStmt->execute([
        ':sys_id' => $is3Id, ':fid' => $field6Id, ':cby' => $userId,
        ':stime' => '07:30:00', ':dur' => 45, ':vol' => 6750.00, ':freq' => 'daily',
        ':days' => 'Daily', ':notes' => 'Split pulse fertigation cycle for tomatoes'
    ]);

    // Water consumption logs
    $wcStmt = $pdo->prepare("INSERT INTO water_consumption (system_id, field_id, recorded_by, volume_litres, duration_minutes, cost_amount, logged_date, notes)
        VALUES (:sys_id, :fid, :rby, :vol, :dur, :cost, :ldate, :notes)");

    for ($w = 7; $w >= 1; $w--) {
        $wcDate = date('Y-m-d', strtotime("-{$w} days"));
        $wcStmt->execute([
            ':sys_id' => $is1Id, ':fid' => $field2Id, ':rby' => $userId,
            ':vol' => 24500.00, ':dur' => 90, ':cost' => 450.00, ':ldate' => $wcDate,
            ':notes' => 'Regular orchard drip run, electricity from solar borehole'
        ]);
        $wcStmt->execute([
            ':sys_id' => $is3Id, ':fid' => $field6Id, ':rby' => $userId,
            ':vol' => 6700.00, ':dur' => 45, ':cost' => 180.00, ':ldate' => $wcDate,
            ':notes' => 'Greenhouse fertigation cycle logged'
        ]);
    }

    // -------------------------------------------------------------
    // 7. Inventory Items & Stock Movements
    // -------------------------------------------------------------
    echo "7. Seeding Inventory & Stock Movements...\n";

    $inventoryData = [
        ['farm_id' => $farm1Id, 'name' => 'YaraMila Complex NPK 17-17-17', 'category' => 'fertilizers', 'sku' => 'FERT-NPK-01', 'qty' => 6.00, 'unit' => 'bags (50kg)', 'reorder' => 15.00, 'cost' => 4200.00, 'loc' => 'Chemical Store Shed A', 'supp' => 'Yara East Africa Ltd'],
        ['farm_id' => $farm1Id, 'name' => 'CAN Calcium Ammonium Nitrate', 'category' => 'fertilizers', 'sku' => 'FERT-CAN-02', 'qty' => 45.00, 'unit' => 'bags (50kg)', 'reorder' => 20.00, 'cost' => 2950.00, 'loc' => 'Main Fertilizer Store', 'supp' => 'Yara East Africa Ltd'],
        ['farm_id' => $farm1Id, 'name' => 'Dairy Cattle Feed Pellets 16%', 'category' => 'animal_feed', 'sku' => 'FEED-DRY-01', 'qty' => 85.00, 'unit' => 'bags (50kg)', 'reorder' => 25.00, 'cost' => 1950.00, 'loc' => 'Dairy Feed Silo Room', 'supp' => 'Unga Farm Care Feeds'],
        ['farm_id' => $farm1Id, 'name' => 'Copper Nordox 75WG 1kg', 'category' => 'chemicals', 'sku' => 'CHEM-COP-01', 'qty' => 4.00, 'unit' => 'packets (1kg)', 'reorder' => 10.00, 'cost' => 1650.00, 'loc' => 'Agrochemical Vault', 'supp' => 'Bayer CropScience Kenya'],
        ['farm_id' => $farm1Id, 'name' => 'Avocado Corrugated Export Boxes', 'category' => 'packaging', 'sku' => 'PACK-AVO-4KG', 'qty' => 1400.00, 'unit' => 'cartons (4kg)', 'reorder' => 300.00, 'cost' => 75.00, 'loc' => 'Packaging Warehouse', 'supp' => 'Allpack Industries Ltd'],
        ['farm_id' => $farm1Id, 'name' => 'Low Sulfur Automotive Diesel', 'category' => 'fuel', 'sku' => 'FUEL-DSL-01', 'qty' => 1850.00, 'unit' => 'litres', 'reorder' => 500.00, 'cost' => 182.50, 'loc' => 'Bunkered Fuel Tank #1', 'supp' => 'TotalEnergies Kenya'],

        ['farm_id' => $farm2Id, 'name' => 'Hybrid Maize Seed DKC 80-33', 'category' => 'seeds', 'sku' => 'SEED-MAZ-8033', 'qty' => 30.00, 'unit' => 'packets (10kg)', 'reorder' => 10.00, 'cost' => 2600.00, 'loc' => 'Naivasha Seed Store', 'supp' => 'Bayer CropScience Kenya'],
        ['farm_id' => $farm2Id, 'name' => 'DAP Fertilizer 50kg', 'category' => 'fertilizers', 'sku' => 'FERT-DAP-01', 'qty' => 55.00, 'unit' => 'bags (50kg)', 'reorder' => 20.00, 'cost' => 3600.00, 'loc' => 'Cereal Barn Store #2', 'supp' => 'Yara East Africa Ltd'],
        ['farm_id' => $farm2Id, 'name' => 'Belt 480SC Insecticide 1L', 'category' => 'chemicals', 'sku' => 'CHEM-BLT-01', 'qty' => 12.00, 'unit' => 'litres', 'reorder' => 5.00, 'cost' => 4500.00, 'loc' => 'Naivasha Spray Depot', 'supp' => 'Bayer CropScience Kenya'],
        ['farm_id' => $farm2Id, 'name' => 'Low Sulfur Automotive Diesel', 'category' => 'fuel', 'sku' => 'FUEL-DSL-02', 'qty' => 3200.00, 'unit' => 'litres', 'reorder' => 1000.00, 'cost' => 182.50, 'loc' => 'Underground Bulk Tank', 'supp' => 'TotalEnergies Kenya'],
    ];

    $invStmt = $pdo->prepare("INSERT INTO inventory_items (farm_id, name, category, sku, quantity_on_hand, unit_of_measure, reorder_level, unit_cost, storage_location, supplier_name, is_active)
        VALUES (:farm_id, :name, :cat, :sku, :qty, :unit, :reorder, :cost, :loc, :supp, 1)");

    $invIds = [];
    foreach ($inventoryData as $i) {
        $invStmt->execute([
            ':farm_id' => $i['farm_id'],
            ':name' => $i['name'],
            ':cat' => $i['category'],
            ':sku' => $i['sku'],
            ':qty' => $i['qty'],
            ':unit' => $i['unit'],
            ':reorder' => $i['reorder'],
            ':cost' => $i['cost'],
            ':loc' => $i['loc'],
            ':supp' => $i['supp'],
        ]);
        $invIds[$i['sku']] = (int)$pdo->lastInsertId();
    }

    // Stock Movements
    $smStmt = $pdo->prepare("INSERT INTO stock_movements (item_id, recorded_by, movement_type, quantity, unit_price, reference_type, notes)
        VALUES (:item_id, :rby, :mtype, :qty, :price, 'Initial Stock Purchase', :notes)");

    foreach ($invIds as $sku => $itemId) {
        $smStmt->execute([
            ':item_id' => $itemId,
            ':rby' => $userId,
            ':mtype' => 'stock_in',
            ':qty' => 50.00,
            ':price' => 2500.00,
            ':notes' => 'Received from commercial supplier into central inventory'
        ]);
    }

    // -------------------------------------------------------------
    // 8. Equipment, Maintenance Schedules & Fuel Logs
    // -------------------------------------------------------------
    echo "8. Seeding Equipment, Maintenance, and Fuel Logs...\n";

    $equipmentData = [
        ['farm_id' => $farm1Id, 'name' => 'John Deere 5075E 4WD Utility Tractor', 'type' => 'tractor', 'brand' => 'John Deere', 'model' => '5075E', 'sn' => '1PY5075EEPM12401', 'hours' => 1480.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 3800000.00, 'val' => 3200000.00],
        ['farm_id' => $farm1Id, 'name' => 'Jacto Arbus 1000L Orchard Sprayer', 'type' => 'sprayer', 'brand' => 'Jacto', 'model' => 'Arbus 1000', 'sn' => 'JCT-ARB-9921', 'hours' => 350.00, 'fuel' => 'none', 'status' => 'available', 'cost' => 950000.00, 'val' => 820000.00],
        ['farm_id' => $farm1Id, 'name' => 'Perkins 45kVA Standby Diesel Generator', 'type' => 'generator', 'brand' => 'Perkins', 'model' => '404D-22G', 'sn' => 'PRK-GEN-4501', 'hours' => 580.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 1400000.00, 'val' => 1150000.00],

        ['farm_id' => $farm2Id, 'name' => 'Massey Ferguson MF 385 4WD Heavy Tractor', 'type' => 'tractor', 'brand' => 'Massey Ferguson', 'model' => 'MF 385', 'sn' => 'MF-385-NAIV-02', 'hours' => 2940.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 4200000.00, 'val' => 3100000.00],
        ['farm_id' => $farm2Id, 'name' => 'New Holland TC5.30 Grain Combine Harvester', 'type' => 'harvester', 'brand' => 'New Holland', 'model' => 'TC5.30', 'sn' => 'NH-TC530-2022', 'hours' => 720.00, 'fuel' => 'diesel', 'status' => 'maintenance', 'cost' => 9800000.00, 'val' => 8400000.00],
        ['farm_id' => $farm2Id, 'name' => 'Monosem 6-Row Precision Pneumatic Planter', 'type' => 'planter', 'brand' => 'Monosem', 'model' => 'NG Plus 4', 'sn' => 'MNS-P6R-881', 'hours' => 410.00, 'fuel' => 'none', 'status' => 'available', 'cost' => 2400000.00, 'val' => 2050000.00],
    ];

    $eqStmt = $pdo->prepare("INSERT INTO equipment (farm_id, name, type, brand, model, serial_number, operating_hours, fuel_type, status, purchase_date, purchase_cost, current_value, notes)
        VALUES (:farm_id, :name, :type, :brand, :model, :sn, :hours, :fuel, :status, '2022-04-10', :cost, :val, 'Operational farm machinery')");

    $eqIds = [];
    foreach ($equipmentData as $eq) {
        $eqStmt->execute([
            ':farm_id' => $eq['farm_id'],
            ':name' => $eq['name'],
            ':type' => $eq['type'],
            ':brand' => $eq['brand'],
            ':model' => $eq['model'],
            ':sn' => $eq['sn'],
            ':hours' => $eq['hours'],
            ':fuel' => $eq['fuel'],
            ':status' => $eq['status'],
            ':cost' => $eq['cost'],
            ':val' => $eq['val'],
        ]);
        $eqIds[$eq['sn']] = (int)$pdo->lastInsertId();
    }

    // Maintenance Schedules
    $maintStmt = $pdo->prepare("INSERT INTO maintenance_schedules (equipment_id, service_type, interval_hours, last_service_date, next_service_date, last_service_hours, next_service_hours, status, notes)
        VALUES (:eq_id, :stype, :ihours, :lsdate, :nsdate, :lshours, :nshours, :status, :notes)");

    $maintStmt->execute([
        ':eq_id' => $eqIds['1PY5075EEPM12401'],
        ':stype' => '250-Hour Engine Oil, Fuel & Hydraulic Filter Service',
        ':ihours' => 250.00,
        ':lsdate' => '2026-06-15',
        ':nsdate' => '2026-10-05',
        ':lshours' => 1250.00,
        ':nshours' => 1500.00,
        ':status' => 'due',
        ':notes' => 'Approaching 1500 hours; 15W-40 CI-4 engine oil & OEM filters prepared in stock'
    ]);

    $maintStmt->execute([
        ':eq_id' => $eqIds['NH-TC530-2022'],
        ':stype' => 'Post-Harvest Threshing Drum & Concave Overhaul',
        ':ihours' => 500.00,
        ':lsdate' => '2026-09-01',
        ':nsdate' => '2026-10-01',
        ':lshours' => 700.00,
        ':nshours' => 750.00,
        ':status' => 'due',
        ':notes' => 'Currently in workshop: replacing knife drive belt and auger bearings'
    ]);

    // Fuel Logs
    $fuelStmt = $pdo->prepare("INSERT INTO fuel_logs (equipment_id, recorded_by, litres_added, cost_amount, current_meter_hours, logged_date, notes)
        VALUES (:eq_id, :rby, :litres, :cost, :hours, :ldate, :notes)");

    $fuelStmt->execute([
        ':eq_id' => $eqIds['1PY5075EEPM12401'],
        ':rby' => $userId,
        ':litres' => 120.00,
        ':cost' => 21900.00,
        ':hours' => 1475.00,
        ':ldate' => date('Y-m-d', strtotime('-2 days')),
        ':notes' => 'Full tank diesel for orchard mowing and fertilizer transport'
    ]);

    $fuelStmt->execute([
        ':eq_id' => $eqIds['MF-385-NAIV-02'],
        ':rby' => $userId,
        ':litres' => 180.00,
        ':cost' => 32850.00,
        ':hours' => 2930.00,
        ':ldate' => date('Y-m-d', strtotime('-4 days')),
        ':notes' => 'Fuel refill for deep ripping and tillage in Block M2'
    ]);

    // -------------------------------------------------------------
    // 9. Labour & Workers
    // -------------------------------------------------------------
    echo "9. Seeding Farm Workers, Attendance, Tasks & Payroll...\n";

    $workersData = [
        ['farm_id' => $farm1Id, 'first' => 'Samuel', 'last' => 'Mwangi', 'role' => 'supervisor', 'type' => 'permanent', 'rate' => 1600.00, 'phone' => '+254712345601', 'id_nat' => '28491021'],
        ['farm_id' => $farm1Id, 'first' => 'Grace', 'last' => 'Wanjiku', 'role' => 'agronomist', 'type' => 'permanent', 'rate' => 2200.00, 'phone' => '+254712345602', 'id_nat' => '30192833'],
        ['farm_id' => $farm1Id, 'first' => 'Peter', 'last' => 'Otieno', 'role' => 'tractor_driver', 'type' => 'permanent', 'rate' => 1400.00, 'phone' => '+254712345603', 'id_nat' => '27481920'],
        ['farm_id' => $farm1Id, 'first' => 'Mary', 'last' => 'Chebet', 'role' => 'technician', 'type' => 'permanent', 'rate' => 1500.00, 'phone' => '+254712345604', 'id_nat' => '31029384'],

        ['farm_id' => $farm2Id, 'first' => 'Joseph', 'last' => 'Kiprono', 'role' => 'supervisor', 'type' => 'permanent', 'rate' => 1800.00, 'phone' => '+254722345605', 'id_nat' => '29384712'],
        ['farm_id' => $farm2Id, 'first' => 'Faith', 'last' => 'Achieng', 'role' => 'field_worker', 'type' => 'seasonal', 'rate' => 900.00, 'phone' => '+254722345606', 'id_nat' => '33910283'],
        ['farm_id' => $farm2Id, 'first' => 'David', 'last' => 'Mutua', 'role' => 'harvester', 'type' => 'seasonal', 'rate' => 950.00, 'phone' => '+254722345607', 'id_nat' => '32918273'],
    ];

    $wStmt = $pdo->prepare("INSERT INTO workers (farm_id, first_name, last_name, id_national_number, phone, email, role, employment_type, daily_rate, hire_date, status, notes)
        VALUES (:farm_id, :first, :last, :id_nat, :phone, :email, :role, :type, :rate, '2023-01-15', 'active', 'Certified experienced staff member')");

    $workerIds = [];
    foreach ($workersData as $w) {
        $email = strtolower($w['first'] . '.' . $w['last'] . '@highlandfarms.co.ke');
        $wStmt->execute([
            ':farm_id' => $w['farm_id'],
            ':first' => $w['first'],
            ':last' => $w['last'],
            ':id_nat' => $w['id_nat'],
            ':phone' => $w['phone'],
            ':email' => $email,
            ':role' => $w['role'],
            ':type' => $w['type'],
            ':rate' => $w['rate'],
        ]);
        $workerIds[] = (int)$pdo->lastInsertId();
    }

    // Worker attendance (last 7 days)
    $attStmt = $pdo->prepare("INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, status, hours_worked, overtime_hours, notes)
        VALUES (:wid, :farm_id, :rby, :wdate, 'present', 8.00, :ot, 'Standard daily shift')");

    for ($d = 6; $d >= 0; $d--) {
        $wDate = date('Y-m-d', strtotime("-{$d} days"));
        foreach ($workerIds as $wid) {
            $ot = ($d % 3 === 0) ? 1.50 : 0.00;
            $attStmt->execute([
                ':wid' => $wid,
                ':farm_id' => $farm1Id,
                ':rby' => $userId,
                ':wdate' => $wDate,
                ':ot' => $ot
            ]);
        }
    }

    // Tasks
    $taskStmt = $pdo->prepare("INSERT INTO task_assignments (farm_id, field_id, worker_id, assigned_by, title, description, priority, due_date, status)
        VALUES (:farm_id, :field_id, :wid, :aby, :title, :desc, :pri, :due, :status)");

    $taskStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field1Id, ':wid' => $workerIds[0], ':aby' => $userId,
        ':title' => 'Pruning and De-suckering Arabica Coffee Trees in Plot A1',
        ':desc' => 'Remove deadwood and water suckers ahead of primary berry ripening.',
        ':pri' => 'high', ':due' => date('Y-m-d', strtotime('+3 days')), ':status' => 'in_progress'
    ]);

    $taskStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':wid' => $workerIds[1], ':aby' => $userId,
        ':title' => 'Calibrate Drip Emitter Flow Rates in Avocado Grove',
        ':desc' => 'Inspect pressure regulators and flush manifold lines.',
        ':pri' => 'medium', ':due' => date('Y-m-d', strtotime('+5 days')), ':status' => 'pending'
    ]);

    $taskStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field6Id, ':wid' => $workerIds[4], ':aby' => $userId,
        ':title' => 'Greenhouse Beef Tomato Trellising and De-leafing',
        ':desc' => 'Clip vertical twine to support heavy fruit bunches in tunnels 1-3.',
        ':pri' => 'urgent', ':due' => date('Y-m-d', strtotime('+1 day')), ':status' => 'in_progress'
    ]);

    // Payroll records for previous month (August 2026)
    $payStmt = $pdo->prepare("INSERT INTO payroll_records (worker_id, farm_id, recorded_by, period_start, period_end, days_worked, base_salary, overtime_amount, bonus_amount, deductions, net_payable, payment_status, payment_date, payment_method)
        VALUES (:wid, :farm_id, :rby, '2026-08-01', '2026-08-31', 26.00, :base, :ot, 2000.00, 1500.00, :net, 'paid', '2026-08-31', 'bank_transfer')");

    foreach ($workersData as $idx => $w) {
        $wid = $workerIds[$idx];
        $base = $w['rate'] * 26.00;
        $ot = $w['rate'] * 1.5 * 4.0; // 4 overtime hours
        $net = $base + $ot + 2000.00 - 1500.00;
        $payStmt->execute([
            ':wid' => $wid,
            ':farm_id' => $w['farm_id'],
            ':rby' => $userId,
            ':base' => $base,
            ':ot' => $ot,
            ':net' => $net
        ]);
    }

    // -------------------------------------------------------------
    // 10. Scouting Records & Pest Treatments
    // -------------------------------------------------------------
    echo "10. Seeding Scouting Records & Pest Treatments...\n";

    $scoutStmt = $pdo->prepare("INSERT INTO scouting_records (farm_id, field_id, crop_id, pest_disease_id, scouted_by, severity, affected_area_pct, observation_date, symptoms_found, action_required, notes)
        VALUES (:farm_id, :field_id, :cid, :pid, :sby, :sev, :area, :odate, :symp, :act, :notes)");

    $scoutStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field4Id, ':cid' => $cropIds['Maize'], ':pid' => $pestIds['Fall Armyworm'],
        ':sby' => $userId, ':sev' => 'moderate', ':area' => 8.50, ':odate' => date('Y-m-d', strtotime('-15 days')),
        ':symp' => 'Young larvae detected in central whorls of 15% surveyed plants.',
        ':act' => 1, ':notes' => 'Economic threshold crossed; targeted chemical spray recommended immediately.'
    ]);
    $scoutMaizeId = (int)$pdo->lastInsertId();

    $scoutStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field1Id, ':cid' => $cropIds['Arabica Coffee'], ':pid' => $pestIds['Coffee Berry Disease (CBD)'],
        ':sby' => $userId, ':sev' => 'low', ':area' => 2.00, ':odate' => date('Y-m-d', strtotime('-8 days')),
        ':symp' => 'Isolated dark spotting on early green cherries on lower shaded branches.',
        ':act' => 0, ':notes' => 'Low incidence under control following protective copper spray.'
    ]);

    // Pest Treatments
    $ptStmt = $pdo->prepare("INSERT INTO pest_treatments (scouting_id, field_id, applied_by, treatment_type, chemical_product, active_ingredient, dosage_rate, total_quantity_used, unit, application_date, pre_harvest_interval_days, re_entry_interval_hours, effectiveness, notes)
        VALUES (:scout_id, :fid, :aby, 'chemical_spray', :product, :ai, :rate, :qty, 'litres', :adate, 14, 24, 'highly_effective', :notes)");

    $ptStmt->execute([
        ':scout_id' => $scoutMaizeId,
        ':fid' => $field4Id,
        ':aby' => $userId,
        ':product' => 'Belt 480SC',
        ':ai' => 'Flubendiamide 480 g/L',
        ':rate' => '100 ml / ha',
        ':qty' => 3.00,
        ':adate' => date('Y-m-d', strtotime('-13 days')),
        ':notes' => 'Boom sprayer tractor application. Follow-up scout found >95% larval mortality.'
    ]);

    // -------------------------------------------------------------
    // 11. Weather Observations & Weather Alerts
    // -------------------------------------------------------------
    echo "11. Seeding Weather Observations & Alerts...\n";

    $weathStmt = $pdo->prepare("INSERT INTO weather_observations 
        (farm_id, recorded_by, temperature_c, humidity_pct, rainfall_mm, wind_speed_kmh, wind_direction, solar_radiation_wm2, soil_temperature_c, soil_moisture_pct, condition_summary, source, observed_at)
        VALUES (:farm_id, :rby, :temp, :hum, :rain, :wind, :wdir, :solar, :stemp, :smoist, :cond, 'station', :obs_at)");

    // Past 30 days weather for Farm 1 and Farm 2
    for ($w = 30; $w >= 0; $w--) {
        $dateStr = date('Y-m-d', strtotime("-{$w} days"));
        $obsTime = $dateStr . ' 14:00:00';

        // Farm 1: Limuru (cooler, highlands, 17-23 C)
        $rain1 = ($w % 4 === 0) ? mt_rand(5, 22) : 0.00;
        $temp1 = 19.5 + (sin($w * 0.4) * 2.5);
        $weathStmt->execute([
            ':farm_id' => $farm1Id, ':rby' => $userId,
            ':temp' => round($temp1, 1),
            ':hum' => 68.0 + ($rain1 > 0 ? 18.0 : 0.0),
            ':rain' => $rain1,
            ':wind' => 12.5,
            ':wdir' => 'ENE',
            ':solar' => 620.0,
            ':stemp' => round($temp1 - 1.5, 1),
            ':smoist' => 28.5 + ($rain1 > 0 ? 8.0 : 0.0),
            ':cond' => $rain1 > 0 ? 'Scattered Showers' : 'Partly Cloudy',
            ':obs_at' => $obsTime
        ]);

        // Farm 2: Naivasha (warmer, Rift Valley, 22-29 C)
        $rain2 = ($w % 6 === 0) ? mt_rand(4, 18) : 0.00;
        $temp2 = 25.0 + (sin($w * 0.3) * 3.0);
        $weathStmt->execute([
            ':farm_id' => $farm2Id, ':rby' => $userId,
            ':temp' => round($temp2, 1),
            ':hum' => 54.0 + ($rain2 > 0 ? 15.0 : 0.0),
            ':rain' => $rain2,
            ':wind' => 16.0,
            ':wdir' => 'NE',
            ':solar' => 780.0,
            ':stemp' => round($temp2 - 2.0, 1),
            ':smoist' => 22.0 + ($rain2 > 0 ? 6.0 : 0.0),
            ':cond' => $rain2 > 0 ? 'Thunderstorm Warning' : 'Sunny Clear',
            ':obs_at' => $obsTime
        ]);
    }

    // Weather Alerts
    $waltStmt = $pdo->prepare("INSERT INTO weather_alerts (farm_id, created_by, alert_type, severity, title, description, recommended_action, valid_from, valid_until, is_active)
        VALUES (:farm_id, :cby, :atype, :sev, :title, :desc, :act, :vfrom, :vuntil, 1)");

    $waltStmt->execute([
        ':farm_id' => $farm2Id, ':cby' => $userId,
        ':atype' => 'heavy_rain', ':sev' => 'warning',
        ':title' => 'Heavy Rainfall & Rift Valley Flash Flood Watch',
        ':desc' => 'Kenya Meteorological Department forecasts localized storms exceeding 40mm in the Naivasha catchment basin.',
        ':act' => 'Clear field drainage trenches, secure greenhouse poly-sheets, and halt scheduled agrochemical spray runs.',
        ':vfrom' => date('Y-m-d H:i:s'), ':vuntil' => date('Y-m-d H:i:s', strtotime('+4 days'))
    ]);

    $waltStmt->execute([
        ':farm_id' => $farm1Id, ':cby' => $userId,
        ':atype' => 'frost', ':sev' => 'advisory',
        ':title' => 'Highland Overnight Radiation Frost Risk',
        ':desc' => 'Clear skies and calm winds expected to drop ground temperatures to 4°C in low-lying valley areas.',
        ':act' => 'Run light irrigation cycles in coffee and avocado nurseries before dawn to elevate ground air temperature.',
        ':vfrom' => date('Y-m-d H:i:s'), ':vuntil' => date('Y-m-d H:i:s', strtotime('+2 days'))
    ]);

    // -------------------------------------------------------------
    // 12. Harvest Records & Harvest Quality
    // -------------------------------------------------------------
    echo "12. Seeding Harvest Records & Harvest Quality...\n";

    $harvStmt = $pdo->prepare("INSERT INTO harvest_records (farm_id, field_id, crop_id, variety_id, harvested_by, harvest_date, quantity_kg, expected_yield_kg, loss_kg, quality_grade, storage_location, notes)
        VALUES (:farm_id, :field_id, :cid, :vid, :hby, :hdate, :qty, :eqty, :loss, :grade, :loc, :notes)");

    // Maize harvest in Naivasha (Field 4)
    $harvStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field4Id, ':cid' => $cropIds['Maize'], ':vid' => $varietyIds['DKC 80-33 Hybrid'],
        ':hby' => $userId, ':hdate' => '2026-08-18', ':qty' => 96500.00, ':eqty' => 100000.00, ':loss' => 1400.00,
        ':grade' => 'A', ':loc' => 'Naivasha Grain Silo #1',
        ':notes' => 'Mechanized combine harvest in Block M1. Moisture content 13.5% at storage entry.'
    ]);
    $harvMaizeId = (int)$pdo->lastInsertId();

    // Wheat harvest in Naivasha (Field 5)
    $harvStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field5Id, ':cid' => $cropIds['Wheat'], ':vid' => $varietyIds['Kenya Robin'],
        ':hby' => $userId, ':hdate' => '2026-08-26', ':qty' => 48200.00, ':eqty' => 50000.00, ':loss' => 850.00,
        ':grade' => 'A', ':loc' => 'Grain Silo #2',
        ':notes' => 'Clean combine run; high test weight and premium milling grade.'
    ]);
    $harvWheatId = (int)$pdo->lastInsertId();

    // Avocado harvest in Limuru (Field 2)
    $harvStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':cid' => $cropIds['Hass Avocado'], ':vid' => $varietyIds['Hass Grafted G6'],
        ':hby' => $userId, ':hdate' => '2026-07-25', ':qty' => 14800.00, ':eqty' => 15000.00, ':loss' => 220.00,
        ':grade' => 'A', ':loc' => 'Highland Cold Storage #1',
        ':notes' => 'Export pick, dry matter tested >23%, packed in 4kg cartons.'
    ]);
    $harvAvoId = (int)$pdo->lastInsertId();

    // Arabica Coffee harvest in Limuru (Field 1)
    $harvStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field1Id, ':cid' => $cropIds['Arabica Coffee'], ':vid' => $varietyIds['Batian'],
        ':hby' => $userId, ':hdate' => '2026-06-30', ':qty' => 8900.00, ':eqty' => 9200.00, ':loss' => 110.00,
        ':grade' => 'A', ':loc' => 'Estate Wet Mill & Parchment Store',
        ':notes' => 'Early fly crop cherry picked and pulped on the same day.'
    ]);
    $harvCoffeeId = (int)$pdo->lastInsertId();

    // Harvest Quality Inspections
    $hqStmt = $pdo->prepare("INSERT INTO harvest_quality (harvest_id, inspected_by, moisture_content_pct, foreign_matter_pct, defect_rate_pct, sugar_brix, certification_status, inspection_date, notes)
        VALUES (:hid, :iby, :moist, :foreign, :defect, :brix, :cert, :idate, :notes)");

    $hqStmt->execute([
        ':hid' => $harvMaizeId, ':iby' => $userId, ':moist' => 13.20, ':foreign' => 0.80, ':defect' => 1.20,
        ':brix' => null, ':cert' => 'standard', ':idate' => '2026-08-19',
        ':notes' => 'KEPHIS grade 1 white maize compliance certification passed.'
    ]);

    $hqStmt->execute([
        ':hid' => $harvAvoId, ':iby' => $userId, ':moist' => 68.50, ':foreign' => 0.10, ':defect' => 0.50,
        ':brix' => 6.50, ':cert' => 'global_gap', ':idate' => '2026-07-26',
        ':notes' => 'GlobalG.A.P. export audit passed. Excellent fruit caliber.'
    ]);

    // -------------------------------------------------------------
    // 13. Warehouses, Storage Batches & Dispatches
    // -------------------------------------------------------------
    echo "13. Seeding Warehouses, Storage Batches & Dispatches...\n";

    $whStmt = $pdo->prepare("INSERT INTO warehouses (farm_id, name, type, capacity_cubic_metres, current_temperature_c, current_humidity_pct, location_description, is_active)
        VALUES (:farm_id, :name, :type, :cap, :temp, :hum, :loc, 1)");

    $whStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Highland Climate Controlled Cold Room', ':type' => 'cold_storage',
        ':cap' => 450.00, ':temp' => 4.50, ':hum' => 88.00,
        ':loc' => 'Cold chain dispatch facility with pre-cooling dock'
    ]);
    $wh1Id = (int)$pdo->lastInsertId();

    $whStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Central Coffee Dry Parchment Shed', ':type' => 'dry_shed',
        ':cap' => 650.00, ':temp' => 19.00, ':hum' => 58.00,
        ':loc' => 'Raised wooden pallets ventilated store for parchment coffee'
    ]);
    $wh2Id = (int)$pdo->lastInsertId();

    $whStmt->execute([
        ':farm_id' => $farm2Id, ':name' => 'Naivasha Commercial Grain Silo Complex', ':type' => 'silo',
        ':cap' => 3500.00, ':temp' => 18.50, ':hum' => 52.00,
        ':loc' => 'Dual galvanized steel silos with continuous aeration fans'
    ]);
    $wh3Id = (int)$pdo->lastInsertId();

    // Storage Batches
    $sbStmt = $pdo->prepare("INSERT INTO storage_batches (warehouse_id, harvest_id, crop_id, batch_code, quantity_stored_kg, quantity_remaining_kg, unit_cost_estimated, quality_grade, entry_date, status, spoilage_kg, notes)
        VALUES (:wh_id, :hid, :cid, :bcode, :qstored, :qrem, :ucost, 'A', :edate, :status, :spoil, :notes)");

    // Maize batch (Silo)
    $sbStmt->execute([
        ':wh_id' => $wh3Id, ':hid' => $harvMaizeId, ':cid' => $cropIds['Maize'],
        ':bcode' => 'BATCH-MAZ-2026-01', ':qstored' => 96500.00, ':qrem' => 46500.00,
        ':ucost' => 38.00, ':edate' => '2026-08-19', ':status' => 'partially_dispatched', ':spoil' => 50.00,
        ':notes' => 'Aerated bulk grain stored under sealed conditions.'
    ]);
    $batchMaizeId = (int)$pdo->lastInsertId();

    // Wheat batch (Silo)
    $sbStmt->execute([
        ':wh_id' => $wh3Id, ':hid' => $harvWheatId, ':cid' => $cropIds['Wheat'],
        ':bcode' => 'BATCH-WHT-2026-01', ':qstored' => 48200.00, ':qrem' => 28200.00,
        ':ucost' => 48.00, ':edate' => '2026-08-27', ':status' => 'partially_dispatched', ':spoil' => 20.00,
        ':notes' => 'Grade 1 milling wheat awaiting scheduled collection.'
    ]);
    $batchWheatId = (int)$pdo->lastInsertId();

    // Avocado batch (Cold Room)
    $sbStmt->execute([
        ':wh_id' => $wh1Id, ':hid' => $harvAvoId, ':cid' => $cropIds['Hass Avocado'],
        ':bcode' => 'BATCH-AVO-2026-01', ':qstored' => 14800.00, ':qrem' => 3800.00,
        ':ucost' => 85.00, ':edate' => '2026-07-26', ':status' => 'partially_dispatched', ':spoil' => 15.00,
        ':notes' => 'Pre-cooled to 5.5°C for sea container shipment.'
    ]);
    $batchAvoId = (int)$pdo->lastInsertId();

    // Storage movements
    $smovStmt = $pdo->prepare("INSERT INTO storage_movements (batch_id, recorded_by, movement_type, quantity_kg, notes)
        VALUES (:bid, :rby, :mtype, :qty, :notes)");

    $smovStmt->execute([':bid' => $batchMaizeId, ':rby' => $userId, ':mtype' => 'intake', ':qty' => 96500.00, ':notes' => 'Full combine grain delivery intake']);
    $smovStmt->execute([':bid' => $batchMaizeId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 50000.00, ':notes' => 'Dispatched 50MT to Unga Millers Nakuru']);
    $smovStmt->execute([':bid' => $batchWheatId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 20000.00, ':notes' => 'Dispatched 20MT to Premier Flour Mills']);
    $smovStmt->execute([':bid' => $batchAvoId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 11000.00, ':notes' => 'Dispatched refrigerated reefer container to Mombasa port']);

    // -------------------------------------------------------------
    // 14. Customers, Sales Orders, Order Items, Invoices & Payments
    // -------------------------------------------------------------
    echo "14. Seeding Customers, Sales Orders, Invoices, Payments & Market Prices...\n";

    $customersData = [
        ['farm_id' => $farm2Id, 'name' => 'Kenya Highland Grain Millers Ltd', 'type' => 'processor', 'contact' => 'David Kimani', 'phone' => '+254722112233', 'email' => 'procurement@highlandmillers.co.ke', 'addr' => 'Industrial Area, Nakuru', 'credit' => 5000000.00],
        ['farm_id' => $farm1Id, 'name' => 'AfriFresh Export Horticultural Logistics', 'type' => 'export', 'contact' => 'Claire Dupont', 'phone' => '+254733445566', 'email' => 'exports@afrifresh.com', 'addr' => 'JKIA Cargo Village, Nairobi', 'credit' => 3000000.00],
        ['farm_id' => $farm1Id, 'name' => 'Brookside Dairy Processors Ltd', 'type' => 'processor', 'contact' => 'Peter Njoroge', 'phone' => '+254711889900', 'email' => 'intake@brookside.co.ke', 'addr' => 'Ruiru Processing Plant, Kiambu', 'credit' => 2000000.00],
        ['farm_id' => $farm2Id, 'name' => 'Naivasha Fresh Produce Supermarkets', 'type' => 'supermarket', 'contact' => 'Susan Maina', 'phone' => '+254720998877', 'email' => 'orders@naivashafresh.co.ke', 'addr' => 'Kenyatta Avenue, Naivasha', 'credit' => 500000.00],
    ];

    $custStmt = $pdo->prepare("INSERT INTO customers (farm_id, name, type, contact_person, phone, email, address, credit_limit, is_active)
        VALUES (:farm_id, :name, :type, :contact, :phone, :email, :addr, :credit, 1)");

    $custIds = [];
    foreach ($customersData as $c) {
        $custStmt->execute($c);
        $custIds[$c['name']] = (int)$pdo->lastInsertId();
    }

    // Sales Orders
    $soStmt = $pdo->prepare("INSERT INTO sales_orders (farm_id, customer_id, created_by, order_number, order_date, delivery_date, status, total_amount, notes)
        VALUES (:farm_id, :cid, :cby, :onum, :odate, :ddate, :status, :tot, :notes)");

    $soItemStmt = $pdo->prepare("INSERT INTO order_items (order_id, item_type, item_name, quantity, unit, unit_price, total_price)
        VALUES (:oid, :itype, :iname, :qty, :unit, :price, :tot)");

    $invcStmt = $pdo->prepare("INSERT INTO invoices (order_id, customer_id, invoice_number, issue_date, due_date, subtotal, tax_amount, total_amount, amount_paid, status, notes)
        VALUES (:oid, :cid, :inum, :idate, :ddate, :sub, :tax, :tot, :paid, :status, :notes)");

    $payStmt = $pdo->prepare("INSERT INTO payments (invoice_id, customer_id, recorded_by, amount, payment_method, payment_date, reference_number, notes)
        VALUES (:iid, :cid, :rby, :amt, :method, :pdate, :ref, :notes)");

    $dispStmt = $pdo->prepare("INSERT INTO dispatch_records (batch_id, order_id, dispatched_by, quantity_kg, destination, vehicle_registration, driver_name, dispatch_date, notes)
        VALUES (:bid, :oid, :dby, :qty, :dest, :vreg, :dname, :ddate, :notes)");

    // Order 1: 50MT Grain Maize to Highland Millers
    $soStmt->execute([
        ':farm_id' => $farm2Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'], ':cby' => $userId,
        ':onum' => 'SO-2026-001', ':odate' => '2026-08-20', ':ddate' => '2026-08-22',
        ':status' => 'delivered', ':tot' => 2400000.00, ':notes' => 'Bulk delivery of 50 tonnes white commercial grain'
    ]);
    $so1Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so1Id, ':itype' => 'crop', ':iname' => 'Commercial White Maize Grain Grade 1', ':qty' => 50000.00, ':unit' => 'kg', ':price' => 48.00, ':tot' => 2400000.00]);

    $invcStmt->execute([
        ':oid' => $so1Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'],
        ':inum' => 'INV-2026-001', ':idate' => '2026-08-22', ':ddate' => '2026-09-21',
        ':sub' => 2400000.00, ':tax' => 0.00, ':tot' => 2400000.00, ':paid' => 2400000.00,
        ':status' => 'paid', ':notes' => 'Zero-rated agricultural food produce'
    ]);
    $inv1Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv1Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'], ':rby' => $userId,
        ':amt' => 2400000.00, ':method' => 'bank_transfer', ':pdate' => '2026-09-05',
        ':ref' => 'EFT-STANBIC-998811', ':notes' => 'Full settlement via Stanbic Bank Kenya'
    ]);

    $dispStmt->execute([
        ':bid' => $batchMaizeId, ':oid' => $so1Id, ':dby' => $userId,
        ':qty' => 50000.00, ':dest' => 'Highland Millers Silos Nakuru',
        ':vreg' => 'KBZ 489X / ZF 1120', ':dname' => 'Harrison Karanja',
        ':ddate' => '2026-08-22', ':notes' => 'Weighbridge slip #88921 attached'
    ]);

    // Order 2: 11,000 kg Export Hass Avocado to AfriFresh
    $soStmt->execute([
        ':farm_id' => $farm1Id, ':cid' => $custIds['AfriFresh Export Horticultural Logistics'], ':cby' => $userId,
        ':onum' => 'SO-2026-002', ':odate' => '2026-08-05', ':ddate' => '2026-08-08',
        ':status' => 'delivered', ':tot' => 1430000.00, ':notes' => 'Export packed Hass avocados in 4kg cartons'
    ]);
    $so2Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so2Id, ':itype' => 'crop', ':iname' => 'Fresh Hass Avocado Export Grade', ':qty' => 11000.00, ':unit' => 'kg', ':price' => 130.00, ':tot' => 1430000.00]);

    $invcStmt->execute([
        ':oid' => $so2Id, ':cid' => $custIds['AfriFresh Export Horticultural Logistics'],
        ':inum' => 'INV-2026-002', ':idate' => '2026-08-08', ':ddate' => '2026-09-08',
        ':sub' => 1430000.00, ':tax' => 0.00, ':tot' => 1430000.00, ':paid' => 1430000.00,
        ':status' => 'paid', ':notes' => 'Pre-cooling and phytosanitary certificate verified'
    ]);
    $inv2Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv2Id, ':cid' => $custIds['AfriFresh Export Horticultural Logistics'], ':rby' => $userId,
        ':amt' => 1430000.00, ':method' => 'bank_transfer', ':pdate' => '2026-08-20',
        ':ref' => 'CITI-EXPORT-3321', ':notes' => 'Payment from Citibank Kenya N.A.'
    ]);

    $dispStmt->execute([
        ':bid' => $batchAvoId, ':oid' => $so2Id, ':dby' => $userId,
        ':qty' => 11000.00, ':dest' => 'Mombasa Port Container Terminal (Reefer)',
        ':vreg' => 'KDG 119P / REEFER-44', ':dname' => 'Bernard Ochieng',
        ':ddate' => '2026-08-08', ':notes' => 'Cold chain data logger #LOG-889 placed in pallet 1'
    ]);

    // Order 3: 20MT Wheat to Grain Millers
    $soStmt->execute([
        ':farm_id' => $farm2Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'], ':cby' => $userId,
        ':onum' => 'SO-2026-003', ':odate' => '2026-09-10', ':ddate' => '2026-09-15',
        ':status' => 'dispatched', ':tot' => 1160000.00, ':notes' => 'Premium hard milling wheat'
    ]);
    $so3Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so3Id, ':itype' => 'crop', ':iname' => 'Hard Red Milling Wheat Grade 1', ':qty' => 20000.00, ':unit' => 'kg', ':price' => 58.00, ':tot' => 1160000.00]);

    $invcStmt->execute([
        ':oid' => $so3Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'],
        ':inum' => 'INV-2026-003', ':idate' => '2026-09-15', ':ddate' => '2026-10-15',
        ':sub' => 1160000.00, ':tax' => 0.00, ':tot' => 1160000.00, ':paid' => 500000.00,
        ':status' => 'partially_paid', ':notes' => 'Deposit received, balance due in 30 days'
    ]);
    $inv3Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv3Id, ':cid' => $custIds['Kenya Highland Grain Millers Ltd'], ':rby' => $userId,
        ':amt' => 500000.00, ':method' => 'bank_transfer', ':pdate' => '2026-09-16',
        ':ref' => 'EFT-STANBIC-999401', ':notes' => 'Part payment deposit'
    ]);

    // Market Prices (Master Benchmark Prices)
    $mpData = [
        ['Maize White Grain', 'Nairobi Grain Exchange', 49.50, 'kg', 'rising'],
        ['Maize White Grain', 'Nakuru Wholesale Market', 47.00, 'kg', 'stable'],
        ['Hard Bread Wheat', 'Eldoret Grain Board', 59.00, 'kg', 'stable'],
        ['Hass Avocado (Export)', 'Nairobi International Terminal', 135.00, 'kg', 'rising'],
        ['Raw Chilled Milk', 'KCC Ruiru Intake Hub', 52.00, 'litre', 'rising'],
        ['Beef Tomato Fresh', 'Wakulima Market Nairobi', 85.00, 'kg', 'falling'],
        ['Arabica Coffee AA', 'Nairobi Coffee Exchange', 420.00, 'kg', 'rising'],
    ];

    $mpStmt = $pdo->prepare("INSERT INTO market_prices (commodity_name, market_location, price_per_unit, unit, recorded_date, source, trend)
        VALUES (:cname, :loc, :price, :unit, :rdate, 'Kenya Agricultural Commodity Exchange (KACE)', :trend)");

    foreach ($mpData as $mp) {
        $mpStmt->execute([
            ':cname' => $mp[0],
            ':loc' => $mp[1],
            ':price' => $mp[2],
            ':unit' => $mp[3],
            ':rdate' => date('Y-m-d'),
            ':trend' => $mp[4]
        ]);
    }

    // -------------------------------------------------------------
    // 15. Finances: Income, Expenses, Budgets, Loans
    // -------------------------------------------------------------
    echo "15. Seeding Financial Income, Expense Records, Budgets, and Loans...\n";

    $incStmt = $pdo->prepare("INSERT INTO income_records (farm_id, recorded_by, category, amount, date_received, payment_method, payer_name, description)
        VALUES (:farm_id, :rby, :cat, :amt, :drec, :method, :payer, :desc)");

    $expStmt = $pdo->prepare("INSERT INTO expense_records (farm_id, recorded_by, category, amount, date_incurred, payment_method, vendor_name, description)
        VALUES (:farm_id, :rby, :cat, :amt, :dinc, :method, :vendor, :desc)");

    // Historical monthly income entries (Past 8 months of 2026)
    $monthlyIncomeData = [
        ['month' => '2026-02-15', 'cat' => 'livestock_sales', 'amt' => 280000.00, 'farm' => $farm1Id, 'desc' => 'Sale of 2 breeding dairy heifers'],
        ['month' => '2026-03-25', 'cat' => 'byproducts', 'amt' => 310000.00, 'farm' => $farm1Id, 'desc' => 'Bulked raw chilled milk sales to Brookside Dairy'],
        ['month' => '2026-04-20', 'cat' => 'byproducts', 'amt' => 345000.00, 'farm' => $farm1Id, 'desc' => 'Monthly bulked dairy milk sales'],
        ['month' => '2026-05-18', 'cat' => 'byproducts', 'amt' => 360000.00, 'farm' => $farm1Id, 'desc' => 'Monthly bulked dairy milk sales'],
        ['month' => '2026-06-25', 'cat' => 'crop_sales', 'amt' => 780000.00, 'farm' => $farm1Id, 'desc' => 'Early coffee parchment fly crop dispatch'],
        ['month' => '2026-07-28', 'cat' => 'crop_sales', 'amt' => 1430000.00, 'farm' => $farm1Id, 'desc' => 'Export Hass Avocado dispatch to AfriFresh'],
        ['month' => '2026-08-25', 'cat' => 'crop_sales', 'amt' => 2400000.00, 'farm' => $farm2Id, 'desc' => '50MT Commercial White Maize delivery to Highland Millers'],
        ['month' => '2026-09-18', 'cat' => 'crop_sales', 'amt' => 500000.00, 'farm' => $farm2Id, 'desc' => 'Deposit payment for 20MT Wheat delivery'],
    ];

    foreach ($monthlyIncomeData as $inc) {
        $incStmt->execute([
            ':farm_id' => $inc['farm'],
            ':rby' => $userId,
            ':cat' => $inc['cat'],
            ':amt' => $inc['amt'],
            ':drec' => $inc['month'],
            ':method' => 'bank_transfer',
            ':payer' => 'Commercial Buyer',
            ':desc' => $inc['desc']
        ]);
    }

    // Historical monthly expenses (Past 8 months of 2026)
    $monthlyExpenseData = [
        ['month' => '2026-02-10', 'cat' => 'seeds', 'amt' => 240000.00, 'farm' => $farm2Id, 'vendor' => 'Bayer CropScience', 'desc' => 'Pre-season hybrid maize and wheat seed procurement'],
        ['month' => '2026-03-05', 'cat' => 'fertilizers', 'amt' => 520000.00, 'farm' => $farm2Id, 'vendor' => 'Yara East Africa', 'desc' => 'Bulk DAP and basal fertilizer order'],
        ['month' => '2026-03-31', 'cat' => 'labour_wages', 'amt' => 210000.00, 'farm' => $farm1Id, 'vendor' => 'Farm Staff Payroll', 'desc' => 'March labour and supervisor payroll'],
        ['month' => '2026-04-15', 'cat' => 'fuel', 'amt' => 185000.00, 'farm' => $farm2Id, 'vendor' => 'TotalEnergies Kenya', 'desc' => 'Bulk diesel delivery for plowing and planting'],
        ['month' => '2026-05-10', 'cat' => 'chemicals', 'amt' => 145000.00, 'farm' => $farm1Id, 'vendor' => 'Bayer CropScience', 'desc' => 'Fungicides and protective copper sprays for coffee'],
        ['month' => '2026-06-12', 'cat' => 'animal_feed', 'amt' => 195000.00, 'farm' => $farm1Id, 'vendor' => 'Unga Farm Care', 'desc' => 'Monthly dairy meal and mineral licks'],
        ['month' => '2026-07-20', 'cat' => 'packaging', 'amt' => 105000.00, 'farm' => $farm1Id, 'vendor' => 'Allpack Industries', 'desc' => 'Avocado export cartons and pallet wraps'],
        ['month' => '2026-08-15', 'cat' => 'machinery_repairs', 'amt' => 165000.00, 'farm' => $farm2Id, 'vendor' => 'CFAO Agri Machinery', 'desc' => 'Combine harvester cutter bar overhaul and servicing'],
        ['month' => '2026-08-31', 'cat' => 'labour_wages', 'amt' => 235000.00, 'farm' => $farm1Id, 'vendor' => 'Farm Staff Payroll', 'desc' => 'August harvest labour and staff wages'],
        ['month' => '2026-09-10', 'cat' => 'fuel', 'amt' => 198000.00, 'farm' => $farm2Id, 'vendor' => 'TotalEnergies Kenya', 'desc' => 'Bulk tractor diesel refill'],
    ];

    foreach ($monthlyExpenseData as $exp) {
        $expStmt->execute([
            ':farm_id' => $exp['farm'],
            ':rby' => $userId,
            ':cat' => $exp['cat'],
            ':amt' => $exp['amt'],
            ':dinc' => $exp['month'],
            ':method' => 'bank_transfer',
            ':vendor' => $exp['vendor'],
            ':desc' => $exp['desc']
        ]);
    }

    // Budgets for 2026
    $budgStmt = $pdo->prepare("INSERT INTO budgets (farm_id, created_by, fiscal_year, period_name, category, budgeted_amount, actual_amount, notes)
        VALUES (:farm_id, :cby, 2026, 'Annual', :cat, :bamt, :aamt, :notes)");

    $budgStmt->execute([':farm_id' => $farm1Id, ':cby' => $userId, ':cat' => 'Fertilizers & Nutrients', ':bamt' => 1200000.00, ':aamt' => 840000.00, ':notes' => 'Annual soil amendment and fertigation budget']);
    $budgStmt->execute([':farm_id' => $farm1Id, ':cby' => $userId, ':cat' => 'Labour & Wages', ':bamt' => 2800000.00, ':aamt' => 1950000.00, ':notes' => 'Permanent staff and seasonal picking']);
    $budgStmt->execute([':farm_id' => $farm2Id, ':cby' => $userId, ':cat' => 'Fuel & Energy', ':bamt' => 2400000.00, ':aamt' => 1720000.00, ':notes' => 'Machinery diesel and center pivot pump power']);
    $budgStmt->execute([':farm_id' => $farm2Id, ':cby' => $userId, ':cat' => 'Machinery Maintenance & Repairs', ':bamt' => 1500000.00, ':aamt' => 980000.00, ':notes' => 'Scheduled equipment servicing and replacement parts']);

    // Loans
    $loanStmt = $pdo->prepare("INSERT INTO loans (farm_id, recorded_by, lender_name, principal_amount, interest_rate_pct, loan_term_months, start_date, end_date, monthly_payment, balance_remaining, status, notes)
        VALUES (:farm_id, :rby, :lender, :prin, :rate, :term, :sdate, :edate, :mpay, :bal, 'active', :notes)");

    $loanStmt->execute([
        ':farm_id' => $farm2Id, ':rby' => $userId,
        ':lender' => 'Agricultural Finance Corporation (AFC Kenya)',
        ':prin' => 5000000.00, ':rate' => 10.00, ':term' => 48,
        ':sdate' => '2024-01-01', ':edate' => '2027-12-31',
        ':mpay' => 126800.00, ':bal' => 2150000.00,
        ':notes' => 'Mechanization asset finance loan secured against farm title deed'
    ]);

    // -------------------------------------------------------------
    // 16. Suppliers, Quotations & Purchase Orders
    // -------------------------------------------------------------
    echo "16. Seeding Suppliers, Quotations, and Purchase Orders...\n";

    $suppliersData = [
        ['farm_id' => $farm1Id, 'name' => 'Yara East Africa Ltd', 'category' => 'fertilizers', 'contact' => 'Mark Mwangi', 'phone' => '+254700112233', 'email' => 'sales.ke@yara.com', 'addr' => 'Rhapta Road, Westlands, Nairobi', 'rating' => 4.90, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'Bayer CropScience Kenya', 'category' => 'chemicals', 'contact' => 'Dr. Alice Kariuki', 'phone' => '+254700445566', 'email' => 'cropscience.ke@bayer.com', 'addr' => 'Outering Road, Nairobi', 'rating' => 4.85, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'Unga Farm Care Feeds Ltd', 'category' => 'feed', 'contact' => 'John Kamau', 'phone' => '+254700778899', 'email' => 'orders@unga.com', 'addr' => 'Commercial Street, Industrial Area, Nairobi', 'rating' => 4.70, 'terms' => 15],
        ['farm_id' => $farm2Id, 'name' => 'TotalEnergies Marketing Kenya Plc', 'category' => 'fuel', 'contact' => 'Caroline Njeri', 'phone' => '+254722556677', 'email' => 'commercial@totalenergies.ke', 'addr' => 'Regal Iris Plaza, Parklands, Nairobi', 'rating' => 4.95, 'terms' => 30],
        ['farm_id' => $farm2Id, 'name' => 'CFAO Agri Equipment Kenya Ltd', 'category' => 'machinery', 'contact' => 'Evans Kiptoo', 'phone' => '+254722889900', 'email' => 'machinery@cfaoagri.co.ke', 'addr' => 'Enterprise Road, Nairobi', 'rating' => 4.80, 'terms' => 30],
    ];

    $suppStmt = $pdo->prepare("INSERT INTO suppliers (farm_id, name, category, contact_person, phone, email, address, rating, payment_terms_days, is_active)
        VALUES (:farm_id, :name, :category, :contact, :phone, :email, :addr, :rating, :terms, 1)");

    $suppIds = [];
    foreach ($suppliersData as $s) {
        $suppStmt->execute($s);
        $suppIds[$s['name']] = (int)$pdo->lastInsertId();
    }

    // Quotations
    $quotStmt = $pdo->prepare("INSERT INTO supplier_quotations (supplier_id, farm_id, item_description, quoted_price, unit, valid_until, notes)
        VALUES (:sid, :farm_id, :desc, :price, :unit, :valid, :notes)");

    $quotStmt->execute([
        ':sid' => $suppIds['Yara East Africa Ltd'], ':farm_id' => $farm1Id,
        ':desc' => 'YaraMila Complex NPK 17:17:17 50kg bag',
        ':price' => 4150.00, ':unit' => 'bag', ':valid' => date('Y-m-d', strtotime('+45 days')),
        ':notes' => 'Bulk volume discounted rate for orders over 100 bags'
    ]);

    $quotStmt->execute([
        ':sid' => $suppIds['TotalEnergies Marketing Kenya Plc'], ':farm_id' => $farm2Id,
        ':desc' => 'Automotive Gasoil Low Sulfur Bulk Delivery',
        ':price' => 179.50, ':unit' => 'litre', ':valid' => date('Y-m-d', strtotime('+30 days')),
        ':notes' => 'Delivered into farm underground storage tank at Naivasha'
    ]);

    // Purchase Orders
    $poStmt = $pdo->prepare("INSERT INTO purchase_orders (farm_id, supplier_id, created_by, approved_by, po_number, order_date, expected_delivery_date, status, total_amount, notes)
        VALUES (:farm_id, :sid, :cby, :aby, :ponum, :odate, :edate, :status, :tot, :notes)");

    $poItemStmt = $pdo->prepare("INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit, unit_price, total_price)
        VALUES (:poid, :desc, :qty, :unit, :uprice, :tot)");

    $poStmt->execute([
        ':farm_id' => $farm1Id, ':sid' => $suppIds['Yara East Africa Ltd'], ':cby' => $userId, ':aby' => $userId,
        ':ponum' => 'PO-2026-001', ':odate' => '2026-08-10', ':edate' => '2026-08-14',
        ':status' => 'received', ':tot' => 415000.00, ':notes' => '100 bags NPK fertilizer for second season application'
    ]);
    $po1Id = (int)$pdo->lastInsertId();

    $poItemStmt->execute([':poid' => $po1Id, ':desc' => 'YaraMila Complex NPK 17-17-17 (50kg)', ':qty' => 100.00, ':unit' => 'bags', ':uprice' => 4150.00, ':tot' => 415000.00]);

    $poStmt->execute([
        ':farm_id' => $farm2Id, ':sid' => $suppIds['TotalEnergies Marketing Kenya Plc'], ':cby' => $userId, ':aby' => $userId,
        ':ponum' => 'PO-2026-002', ':odate' => '2026-09-01', ':edate' => '2026-09-04',
        ':status' => 'received', ':tot' => 359000.00, ':notes' => '2,000 litres low sulfur diesel fuel replenishment'
    ]);
    $po2Id = (int)$pdo->lastInsertId();

    $poItemStmt->execute([':poid' => $po2Id, ':desc' => 'Commercial Automotive Gasoil (Diesel)', ':qty' => 2000.00, ':unit' => 'litres', ':uprice' => 179.50, ':tot' => 359000.00]);

    // -------------------------------------------------------------
    // 17. Operational Alerts & Notifications
    // -------------------------------------------------------------
    echo "17. Seeding Real-time System Alerts & Notifications...\n";

    $altStmt = $pdo->prepare("INSERT INTO alerts (farm_id, user_id, alert_type, title, message, severity, is_read, is_dismissed)
        VALUES (:farm_id, :uid, :atype, :title, :msg, :sev, 0, 0)");

    $notifStmt = $pdo->prepare("INSERT INTO notification_logs (alert_id, channel, status) VALUES (:aid, 'in_app', 'sent')");

    $alertsData = [
        ['farm_id' => $farm1Id, 'type' => 'inventory_low', 'title' => 'Low Stock Warning: NPK 17:17:17 Fertilizer', 'msg' => 'Remaining quantity is 6 bags, which is below the minimum reorder threshold of 15 bags.', 'sev' => 'warning'],
        ['farm_id' => $farm1Id, 'type' => 'maintenance_due', 'title' => 'Scheduled Maintenance Due: John Deere 5075E Tractor', 'msg' => 'Operating hours have reached 1,480 hrs. 1,500 hr engine oil and hydraulic filter replacement is due.', 'sev' => 'warning'],
        ['farm_id' => $farm2Id, 'type' => 'weather_risk', 'title' => 'Severe Weather Alert: Heavy Rainfall & Flash Flood Risk', 'msg' => 'Intense rainfall exceeding 40mm forecasted in Naivasha catchment basin over next 48 hours.', 'sev' => 'critical'],
        ['farm_id' => $farm1Id, 'type' => 'vaccination_due', 'title' => 'Livestock Vaccination Reminder: Foot & Mouth Disease', 'msg' => 'Biannual FMD booster vaccination is scheduled for dairy cattle herd next month (November 2026).', 'sev' => 'info'],
        ['farm_id' => $farm2Id, 'type' => 'pest_outbreak', 'title' => 'Scouting Alert: Fall Armyworm in Great Rift Maize Block M1', 'msg' => 'Moderate larval incidence detected in whorls. Belt 480SC application was executed.', 'sev' => 'warning'],
        ['farm_id' => $farm2Id, 'type' => 'loan_payment_due', 'title' => 'Loan Installment Notice: AFC Mechanization Facility', 'msg' => 'Monthly repayment of KSh 126,800 is due on October 1st, 2026.', 'sev' => 'info'],
    ];

    foreach ($alertsData as $a) {
        $altStmt->execute([
            ':farm_id' => $a['farm_id'],
            ':uid' => $userId,
            ':atype' => $a['type'],
            ':title' => $a['title'],
            ':msg' => $a['msg'],
            ':sev' => $a['sev']
        ]);
        $alertId = (int)$pdo->lastInsertId();
        $notifStmt->execute([':aid' => $alertId]);
    }

    $pdo->commit();
    echo "\n>>> Database seeding completed successfully! All transactions committed.\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "\n[ERROR] Seeding failed: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . " in " . $e->getFile() . "\n";
    exit(1);
} finally {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
}
