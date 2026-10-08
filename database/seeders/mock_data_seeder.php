<?php

declare(strict_types=1);

/**
 * Mock Data Seeder for Farm Management System (FFMS) - Localised for Zambia
 * 
 * Populates comprehensive, realistic relational demo data for user Timon Chisanga (id: 5)
 * across all 18 farm management modules localized to Zambia:
 * - 3 Zambian Commercial Farms:
 *     1. Mkushi Farming Block (Mkushi, Central Province) - Mechanized Cereal & Soya Block
 *     2. Mazabuka Valley Estate (Mazabuka, Southern Province) - Dairy, Wheat & Fodder
 *     3. Chisamba Agri-Hub (Chisamba, Central Province) - Commercial Horticulture & Seed Plot
 * - Zambian agricultural staples (White Maize, Soya Beans, Winter Wheat, Groundnuts, Macadamia, Paprika/Chili, Rhodes Grass)
 * - Zambian seed varieties (Seed Co SC 719, Pannar PAN 53, MRI 514, etc.)
 * - Zambian livestock breeds (Boran, Brahman, Mashona, Boer Goat, Dorper, Black Australorp)
 * - Local institutions & agribusinesses (FRA, Zambeef, Parmalat/Lactalis, Mount Meru Millers, Zamchick, Omnia, Arysta, SARO, CAMCO, ZANACO)
 * - Zambian Kwacha (ZMW) currency and regional coordinates across Central and Southern Provinces.
 */

require_once __DIR__ . '/../../backend/src/bootstrap.php';

echo "========================================================\n";
echo "FFMS Database Mock Data Seeder (Zambia Localized)\n";
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

    // Crops - Localized to Zambia
    $cropsData = [
        ['name' => 'White Maize', 'scientific_name' => 'Zea mays', 'category' => 'cereal', 'description' => 'Zambian national staple grain and animal feed'],
        ['name' => 'Soya Beans', 'scientific_name' => 'Glycine max', 'category' => 'legume', 'description' => 'Commercial oilseed and high-protein cake staple'],
        ['name' => 'Winter Wheat', 'scientific_name' => 'Triticum aestivum', 'category' => 'cereal', 'description' => 'Irrigated winter commercial wheat for local flour mills'],
        ['name' => 'Groundnuts', 'scientific_name' => 'Arachis hypogaea', 'category' => 'legume', 'description' => 'High-yield confectionery groundnuts (Chalimbana & Luangwa)'],
        ['name' => 'Beef Tomato', 'scientific_name' => 'Solanum lycopersicum', 'category' => 'vegetable', 'description' => 'High-tunnel greenhouse fresh table tomatoes for Soweto & Lusaka markets'],
        ['name' => 'Sweet Pepper', 'scientific_name' => 'Capsicum annuum', 'category' => 'vegetable', 'description' => 'Coloured bell peppers for fresh supermarket retail'],
        ['name' => 'Paprika', 'scientific_name' => 'Capsicum annuum var. longum', 'category' => 'vegetable', 'description' => 'Export-grade dry red paprika and chili'],
        ['name' => 'Rhodes Grass', 'scientific_name' => 'Chloris gayana', 'category' => 'fodder', 'description' => 'High-protein pasture, hay bailing, and dairy forage'],
        ['name' => 'Sunflower', 'scientific_name' => 'Helianthus annuus', 'category' => 'oilseed', 'description' => 'Drought-tolerant cooking oilseed crop'],
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

    // Varieties - Seed Co, Pannar, Zamseed, MRI
    $varietyData = [
        ['crop' => 'White Maize', 'name' => 'Seed Co SC 719 Hybrid', 'days' => 145, 'density' => '52,000 plants/ha', 'row' => 75.0, 'plant' => 25.0, 'yield' => 10.5],
        ['crop' => 'White Maize', 'name' => 'Pannar PAN 53', 'days' => 135, 'density' => '54,000 plants/ha', 'row' => 75.0, 'plant' => 24.0, 'yield' => 9.8],
        ['crop' => 'White Maize', 'name' => 'Zamseed ZMS 606', 'days' => 130, 'density' => '50,000 plants/ha', 'row' => 75.0, 'plant' => 25.0, 'yield' => 8.5],
        ['crop' => 'Soya Beans', 'name' => 'MRI Safari Soya', 'days' => 115, 'density' => '350,000 plants/ha', 'row' => 45.0, 'plant' => 6.0, 'yield' => 3.6],
        ['crop' => 'Winter Wheat', 'name' => 'Nduna Irrigated Wheat', 'days' => 115, 'density' => '125 kg/ha seed', 'row' => 18.0, 'plant' => 4.0, 'yield' => 7.2],
        ['crop' => 'Groundnuts', 'name' => 'Luangwa Confectionery', 'days' => 120, 'density' => '110,000 plants/ha', 'row' => 60.0, 'plant' => 15.0, 'yield' => 2.4],
        ['crop' => 'Beef Tomato', 'name' => 'Anna F1 Indeterminate', 'days' => 75, 'density' => '30,000 plants/ha', 'row' => 60.0, 'plant' => 45.0, 'yield' => 48.0],
        ['crop' => 'Sweet Pepper', 'name' => 'Commander F1 Sweet Pepper', 'days' => 85, 'density' => '32,000 plants/ha', 'row' => 60.0, 'plant' => 40.0, 'yield' => 35.0],
        ['crop' => 'Paprika', 'name' => 'Zambia Queen Paprika', 'days' => 130, 'density' => '40,000 plants/ha', 'row' => 70.0, 'plant' => 35.0, 'yield' => 4.2],
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

    // Breeds - Localized to Zambian Livestock sector
    $breedsData = [
        ['name' => 'Holstein Friesian', 'species' => 'cattle', 'description' => 'High-volume commercial dairy cattle suited for intensive zero-grazing in Mazabuka'],
        ['name' => 'Boran', 'species' => 'cattle', 'description' => 'Hardy African beef breed, exceptional tick tolerance and heat resistance'],
        ['name' => 'Brahman Commercial', 'species' => 'cattle', 'description' => 'Heavy beef breed widely ranched across Central and Southern Provinces'],
        ['name' => 'Mashona (Angoni/Tonga)', 'species' => 'cattle', 'description' => 'Indigenous Zambian hardy cattle with high fertility and disease resilience'],
        ['name' => 'Boer Goat', 'species' => 'goat', 'description' => 'Fast-growing meat goat adapted to Zambian savannah browse'],
        ['name' => 'Dorper', 'species' => 'sheep', 'description' => 'Hardy mutton sheep thriving in Southern Province grasslands'],
        ['name' => 'Black Australorp', 'species' => 'poultry', 'description' => 'Dual-purpose high egg laying and resilient free-range chicken'],
        ['name' => 'Kuroiler Poultry', 'species' => 'poultry', 'description' => 'Robust dual-purpose village & commercial poultry'],
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

    // Pests & Diseases Master - Zambian agronomy
    $pestsData = [
        [
            'name' => 'Fall Armyworm',
            'scientific_name' => 'Spodoptera frugiperda',
            'type' => 'pest',
            'affected_crops' => 'White Maize, Winter Wheat, Sorghum',
            'symptoms_description' => 'Whorl windowing, pinhole leaf damage, ragged leaves with sawdust-like frass',
            'prevention_measures' => 'Early synchronized planting, crop scouting, pheromone trapping',
            'recommended_control' => 'Application of Ampligo 150 ZC or Belt 480SC'
        ],
        [
            'name' => 'Maize Stalk Borer',
            'scientific_name' => 'Busseola fusca',
            'type' => 'pest',
            'affected_crops' => 'White Maize, Sorghum',
            'symptoms_description' => 'Dead hearts in young shoots, boreholes along lower stems with frass deposits',
            'prevention_measures' => 'Destruction of stubble post-harvest, crop rotation with legumes',
            'recommended_control' => 'Granular Chlorpyrifos or cypermethrin whorl placement'
        ],
        [
            'name' => 'Soybean Rust',
            'scientific_name' => 'Phakopsora pachyrhizi',
            'type' => 'fungal_disease',
            'affected_crops' => 'Soya Beans',
            'symptoms_description' => 'Small chlorotic brown spots on lower leaves producing pustules that cause defoliation',
            'prevention_measures' => 'Resistant cultivars, field aeration, fungicide timing at flowering',
            'recommended_control' => 'Triazole fungicides such as Folicur (tebuconazole) or Amistar Top'
        ],
        [
            'name' => 'Tomato Late Blight',
            'scientific_name' => 'Phytophthora infestans',
            'type' => 'fungal_disease',
            'affected_crops' => 'Beef Tomato, Sweet Pepper',
            'symptoms_description' => 'Water-soaked greasy brown lesions on leaves and fruit during cool, humid spells',
            'prevention_measures' => 'Drip irrigation, greenhouse vent ventilation, staking to avoid soil splash',
            'recommended_control' => 'Ridomil Gold MZ 68WG or Mancozeb 80WP'
        ],
        [
            'name' => 'Groundnut Rosette Disease',
            'scientific_name' => 'Groundnut rosette virus (GRV)',
            'type' => 'viral_disease',
            'affected_crops' => 'Groundnuts',
            'symptoms_description' => 'Stunted bush growth, severe leaf mottling and yellowing transmitted by aphids',
            'prevention_measures' => 'Early close-spacing planting, vector aphid management',
            'recommended_control' => 'Imidacloprid systemic aphicide seed treatment and foliar spray'
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
    // 3. Farms, Fields & Plots (3 Distinct Zambian Commercial Farms)
    // -------------------------------------------------------------
    echo "3. Creating Zambian Commercial Farms, Fields & Plots for user {$userId}...\n";

    $farmStmt = $pdo->prepare("INSERT INTO farms (owner_id, name, location, latitude, longitude, total_area_ha, description, is_active) 
        VALUES (:owner_id, :name, :location, :lat, :lng, :area, :desc, 1)");

    // Farm 1: Mkushi Commercial Farming Hub (Central Province)
    $farmStmt->execute([
        ':owner_id' => $userId,
        ':name' => 'Mkushi Commercial Farming Hub',
        ':location' => 'Mkushi Farming Block, Central Province',
        ':lat' => -14.2000000,
        ':lng' => 29.4333000,
        ':area' => 350.00,
        ':desc' => 'Premier mechanized grain production estate in Zambia\'s central breadbasket. Large-scale white maize, commercial soya beans, center-pivot winter wheat, and extensive grain silos.'
    ]);
    $farm1Id = (int)$pdo->lastInsertId();

    // Farm 2: Mazabuka Valley Estate (Southern Province)
    $farmStmt->execute([
        ':owner_id' => $userId,
        ':name' => 'Mazabuka Valley Estate',
        ':location' => 'Mazabuka, Southern Province',
        ':lat' => -15.8560000,
        ':lng' => 27.7480000,
        ':area' => 180.00,
        ':desc' => 'Integrated commercial dairy and livestock ranch on the Kafue plains. Intensive Holstein zero-grazing dairy, commercial Boran breeding herd, and Rhodes grass irrigated pasture.'
    ]);
    $farm2Id = (int)$pdo->lastInsertId();

    // Farm 3: Chisamba Agri-Hub (Central Province, near Lusaka)
    $farmStmt->execute([
        ':owner_id' => $userId,
        ':name' => 'Chisamba Agri-Hub',
        ':location' => 'Chisamba, Central Province',
        ':lat' => -14.9780000,
        ':lng' => 28.2540000,
        ':area' => 75.00,
        ':desc' => 'High-tech peri-urban horticulture hub supplying Lusaka supermarkets. Computerized greenhouses for beef tomatoes, sweet peppers, certified seed plots, and drip-irrigated paprika.'
    ]);
    $farm3Id = (int)$pdo->lastInsertId();

    echo "   Farms created: #{$farm1Id} (Mkushi), #{$farm2Id} (Mazabuka), #{$farm3Id} (Chisamba)\n";

    // Fields & Plots
    $fieldStmt = $pdo->prepare("INSERT INTO fields (farm_id, name, area_ha, soil_type, soil_condition, soil_ph, latitude, longitude, description, is_active) 
        VALUES (:farm_id, :name, :area, :soil_type, :soil_cond, :ph, :lat, :lng, :desc, 1)");

    // Fields for Farm 1: Mkushi
    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'North Pivot Sector A (Wheat & Soya)',
        ':area' => 85.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'excellent',
        ':ph' => 6.20,
        ':lat' => -14.1950000,
        ':lng' => 29.4310000,
        ':desc' => 'High-yield center-pivot irrigated sector rotated between winter wheat and summer soya'
    ]);
    $field1Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'Central Rainfed Block B (White Maize)',
        ':area' => 120.00,
        ':soil_type' => 'clay_loam',
        ':soil_cond' => 'good',
        ':ph' => 5.90,
        ':lat' => -14.2020000,
        ':lng' => 29.4350000,
        ':desc' => 'Deep arable red soils dedicated to high-density commercial Seed Co SC 719 hybrid maize'
    ]);
    $field2Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'East Soya Rotation Block C',
        ':area' => 75.00,
        ':soil_type' => 'sandy_loam',
        ':soil_cond' => 'good',
        ':ph' => 6.10,
        ':lat' => -14.2080000,
        ':lng' => 29.4390000,
        ':desc' => 'Mechanized oilseed rotation field boosting soil nitrogen'
    ]);
    $field3Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm1Id,
        ':name' => 'South Riverbank Groundnut Section',
        ':area' => 40.00,
        ':soil_type' => 'sandy_loam',
        ':soil_cond' => 'good',
        ':ph' => 6.00,
        ':lat' => -14.2140000,
        ':lng' => 29.4280000,
        ':desc' => 'Well-drained light loams ideal for Luangwa confectionery groundnuts'
    ]);
    $field4Id = (int)$pdo->lastInsertId();

    // Fields for Farm 2: Mazabuka
    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Kafue Flats Grazing Paddock 1',
        ':area' => 60.00,
        ':soil_type' => 'clay',
        ':soil_cond' => 'good',
        ':ph' => 6.80,
        ':lat' => -15.8520000,
        ':lng' => 27.7420000,
        ':desc' => 'Fertile black cotton valley soils supporting natural perennial grazing grasses'
    ]);
    $field5Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Irrigated Rhodes Grass Silage Field',
        ':area' => 45.00,
        ':soil_type' => 'clay_loam',
        ':soil_cond' => 'excellent',
        ':ph' => 6.50,
        ':lat' => -15.8580000,
        ':lng' => 27.7510000,
        ':desc' => 'Sprinkler-irrigated Katambora Rhodes grass for dairy silage and hay production'
    ]);
    $field6Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm2Id,
        ':name' => 'Dairy Zero-Grazing Meadow Block',
        ':area' => 35.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'good',
        ':ph' => 6.40,
        ':lat' => -15.8610000,
        ':lng' => 27.7460000,
        ':desc' => 'Exercise paddocks and intensive dairy housing units'
    ]);
    $field7Id = (int)$pdo->lastInsertId();

    // Fields for Farm 3: Chisamba
    $fieldStmt->execute([
        ':farm_id' => $farm3Id,
        ':name' => 'Greenhouse Horticulture Complex',
        ':area' => 15.00,
        ':soil_type' => 'sandy_loam',
        ':soil_cond' => 'excellent',
        ':ph' => 6.60,
        ':lat' => -14.9750000,
        ':lng' => 28.2520000,
        ':desc' => '12 multi-span automated greenhouses for indeterminate Anna F1 tomatoes and sweet peppers'
    ]);
    $field8Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm3Id,
        ':name' => 'Paprika & Chili Drip Field',
        ':area' => 25.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'good',
        ':ph' => 6.30,
        ':lat' => -14.9810000,
        ':lng' => 28.2570000,
        ':desc' => 'Drip-irrigated commercial paprika for export drying'
    ]);
    $field9Id = (int)$pdo->lastInsertId();

    $fieldStmt->execute([
        ':farm_id' => $farm3Id,
        ':name' => 'Certified Breeder Seed Nursery',
        ':area' => 10.00,
        ':soil_type' => 'loam',
        ':soil_cond' => 'excellent',
        ':ph' => 6.50,
        ':lat' => -14.9720000,
        ':lng' => 28.2590000,
        ':desc' => 'Quarantine nursery and hybrid demonstration plots'
    ]);
    $field10Id = (int)$pdo->lastInsertId();

    // Plots
    $plotStmt = $pdo->prepare("INSERT INTO plots (field_id, name, area_ha, description, is_active) VALUES (:field_id, :name, :area, :desc, 1)");

    $plotStmt->execute([':field_id' => $field1Id, ':name' => 'Plot A1 - Valley Pivot Circle 1', ':area' => 45.00, ':desc' => 'Center pivot circle under winter wheat']);
    $plotA1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field1Id, ':name' => 'Plot A2 - Valley Pivot Circle 2', ':area' => 40.00, ':desc' => 'Second center pivot circle']);
    $plotA2 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field2Id, ':name' => 'Plot B1 - Commercial Hybrid Grain Block', ':area' => 70.00, ':desc' => 'High-yield Seed Co SC 719 block']);
    $plotB1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field2Id, ':name' => 'Plot B2 - Early Maturity Maize Block', ':area' => 50.00, ':desc' => 'Pannar PAN 53 block']);
    $plotB2 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field3Id, ':name' => 'Plot C1 - Safari Soya Certified Stand', ':area' => 45.00, ':desc' => 'Export oilseed standard']);
    $plotC1 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field6Id, ':name' => 'Plot R1 - First Cut Rhodes Hay Stand', ':area' => 25.00, ':desc' => 'Dense Rhodes grass pasture for baling']);
    $plotR1 = (int)$pdo->lastInsertId();

    $plotStmt->execute([':field_id' => $field8Id, ':name' => 'Plot H1 - Tunnels 1-6 Beef Tomatoes', ':area' => 5.00, ':desc' => 'Anna F1 trellis setup']);
    $plotH1 = (int)$pdo->lastInsertId();
    $plotStmt->execute([':field_id' => $field8Id, ':name' => 'Plot H2 - Tunnels 7-12 Sweet Peppers', ':area' => 5.00, ':desc' => 'Commander F1 bell peppers']);
    $plotH2 = (int)$pdo->lastInsertId();

    // -------------------------------------------------------------
    // 4. Planting Schedules & Crop Management (10 Active/Harvested Plantings)
    // -------------------------------------------------------------
    echo "4. Seeding Planting Schedules, Fertilizer, and Spraying records...\n";

    $plantStmt = $pdo->prepare("INSERT INTO planting_schedules 
        (field_id, plot_id, crop_id, variety_id, planted_by, planting_date, expected_harvest_date, actual_harvest_date, area_planted_ha, seed_quantity_kg, status, notes)
        VALUES (:fid, :pid, :cid, :vid, :pby, :pdate, :edate, :adate, :area, :seeds, :status, :notes)");

    // 1. Mkushi - Harvested White Maize Block B1
    $plantStmt->execute([
        ':fid' => $field2Id, ':pid' => $plotB1, ':cid' => $cropIds['White Maize'], ':vid' => $varietyIds['Seed Co SC 719 Hybrid'],
        ':pby' => $userId, ':pdate' => '2025-11-25', ':edate' => '2026-05-10', ':adate' => '2026-05-15',
        ':area' => 70.00, ':seeds' => 1750.00, ':status' => 'harvested',
        ':notes' => 'Record commercial yield delivered to Food Reserve Agency (FRA) and National Milling.'
    ]);
    $plantMaizeHarvested = (int)$pdo->lastInsertId();

    // 2. Mkushi - Harvested Soya Beans Block C1
    $plantStmt->execute([
        ':fid' => $field3Id, ':pid' => $plotC1, ':cid' => $cropIds['Soya Beans'], ':vid' => $varietyIds['MRI Safari Soya'],
        ':pby' => $userId, ':pdate' => '2025-12-10', ':edate' => '2026-04-20', ':adate' => '2026-04-22',
        ':area' => 45.00, ':seeds' => 3600.00, ':status' => 'harvested',
        ':notes' => 'Mechanized harvest, delivered to Mount Meru Millers for crushing.'
    ]);
    $plantSoyaHarvested = (int)$pdo->lastInsertId();

    // 3. Mkushi - Active Winter Wheat under Center Pivot (Harvesting imminent in Oct)
    $plantStmt->execute([
        ':fid' => $field1Id, ':pid' => $plotA1, ':cid' => $cropIds['Winter Wheat'], ':vid' => $varietyIds['Nduna Irrigated Wheat'],
        ':pby' => $userId, ':pdate' => '2026-05-20', ':edate' => '2026-10-15', ':adate' => null,
        ':area' => 45.00, ':seeds' => 5625.00, ':status' => 'growing',
        ':notes' => 'Winter irrigated wheat crop in golden grain stage; combine harvesters scheduled for mid-October.'
    ]);
    $plantWheatActive = (int)$pdo->lastInsertId();

    // 4. Mkushi - Groundnut field
    $plantStmt->execute([
        ':fid' => $field4Id, ':pid' => null, ':cid' => $cropIds['Groundnuts'], ':vid' => $varietyIds['Luangwa Confectionery'],
        ':pby' => $userId, ':pdate' => '2025-12-05', ':edate' => '2026-04-30', ':adate' => '2026-05-02',
        ':area' => 40.00, ':seeds' => 3200.00, ':status' => 'harvested',
        ':notes' => 'High-grade confectionery nuts cleaned and bagged in 50kg sacks.'
    ]);
    $plantGroundnut = (int)$pdo->lastInsertId();

    // 5. Mazabuka - Irrigated Rhodes Grass for Silage
    $plantStmt->execute([
        ':fid' => $field6Id, ':pid' => $plotR1, ':cid' => $cropIds['Rhodes Grass'], ':vid' => null,
        ':pby' => $userId, ':pdate' => '2025-09-15', ':edate' => '2026-11-30', ':adate' => null,
        ':area' => 25.00, ':seeds' => 250.00, ':status' => 'growing',
        ':notes' => 'High-protein perennial forage, regularly cut and wrapped for dairy silage pit.'
    ]);
    $plantRhodes = (int)$pdo->lastInsertId();

    // 6. Chisamba - Greenhouse Tomatoes Anna F1
    $plantStmt->execute([
        ':fid' => $field8Id, ':pid' => $plotH1, ':cid' => $cropIds['Beef Tomato'], ':vid' => $varietyIds['Anna F1 Indeterminate'],
        ':pby' => $userId, ':pdate' => '2026-07-15', ':edate' => '2026-11-20', ':adate' => null,
        ':area' => 5.00, ':seeds' => 3.50, ':status' => 'growing',
        ':notes' => 'First commercial flushes currently picked daily for Lusaka fresh markets.'
    ]);
    $plantTomato = (int)$pdo->lastInsertId();

    // 7. Chisamba - Greenhouse Sweet Peppers
    $plantStmt->execute([
        ':fid' => $field8Id, ':pid' => $plotH2, ':cid' => $cropIds['Sweet Pepper'], ':vid' => $varietyIds['Commander F1 Sweet Pepper'],
        ':pby' => $userId, ':pdate' => '2026-08-01', ':edate' => '2026-11-30', ':adate' => null,
        ':area' => 5.00, ':seeds' => 3.00, ':status' => 'growing',
        ':notes' => 'High color break on sweet yellow and red bell peppers; export packaging ready.'
    ]);
    $plantPepper = (int)$pdo->lastInsertId();

    // 8. Chisamba - Drip Paprika Field
    $plantStmt->execute([
        ':fid' => $field9Id, ':pid' => null, ':cid' => $cropIds['Paprika'], ':vid' => $varietyIds['Zambia Queen Paprika'],
        ':pby' => $userId, ':pdate' => '2026-01-10', ':edate' => '2026-06-25', ':adate' => '2026-06-28',
        ':area' => 25.00, ':seeds' => 35.00, ':status' => 'harvested',
        ':notes' => 'Sun-dried and baled for export extraction.'
    ]);
    $plantPaprika = (int)$pdo->lastInsertId();

    // Fertilizer Records - Omnia, Nitrogen Chemicals of Zambia (NCZ), Yara
    $fertStmt = $pdo->prepare("INSERT INTO fertilizer_records (planting_id, applied_by, fertilizer_name, fertilizer_type, quantity_kg, application_date, notes)
        VALUES (:pid, :pby, :fname, :ftype, :qty, :fdate, :notes)");

    $fertStmt->execute([':pid' => $plantMaizeHarvested, ':pby' => $userId, ':fname' => 'Compound D Basal (10-20-10) NCZ', ':ftype' => 'basal', ':qty' => 14000.00, ':fdate' => '2025-11-26', ':notes' => 'Standard basal placement at 200kg/ha']);
    $fertStmt->execute([':pid' => $plantMaizeHarvested, ':pby' => $userId, ':fname' => 'Urea 46% N Top Dressing', ':ftype' => 'top_dress', ':qty' => 10500.00, ':fdate' => '2026-01-05', ':notes' => 'Knee-high vegetative top-dress prior to tasseling']);
    $fertStmt->execute([':pid' => $plantWheatActive, ':pby' => $userId, ':fname' => 'Omnia Wheat Special Compound', ':ftype' => 'basal', ':qty' => 9000.00, ':fdate' => '2026-05-21', ':notes' => 'Precision drill applied with winter wheat seed']);
    $fertStmt->execute([':pid' => $plantWheatActive, ':pby' => $userId, ':fname' => 'Ammonium Nitrate CAN 27%', ':ftype' => 'top_dress', ':qty' => 6750.00, ':fdate' => '2026-07-10', ':notes' => 'Fertigation through center pivot nozzle package']);
    $fertStmt->execute([':pid' => $plantSoyaHarvested, ':pby' => $userId, ':fname' => 'Single Super Phosphate (SSP) + Inoculant', ':ftype' => 'basal', ':qty' => 4500.00, ':fdate' => '2025-12-10', ':notes' => 'Rhizobium inoculated seed drill placement']);
    $fertStmt->execute([':pid' => $plantTomato, ':pby' => $userId, ':fname' => 'Omnia Hydroponic Calcium Nitrate', ':ftype' => 'foliar', ':qty' => 120.00, ':fdate' => '2026-09-12', ':notes' => 'Continuous greenhouse drip fertigation pulse']);

    // Spraying Schedules
    $sprayStmt = $pdo->prepare("INSERT INTO spraying_schedules (planting_id, applied_by, chemical_name, chemical_type, quantity_litres, dilution_ratio, spray_date, target_pest, notes)
        VALUES (:pid, :pby, :cname, :ctype, :qty, :ratio, :sdate, :target, :notes)");

    $sprayStmt->execute([':pid' => $plantMaizeHarvested, ':pby' => $userId, ':cname' => 'Ampligo 150 ZC', ':ctype' => 'insecticide', ':qty' => 25.00, ':ratio' => '1:500', ':sdate' => '2025-12-28', ':target' => 'Fall Armyworm', ':notes' => 'Tractor boom spray directed at central whorls']);
    $sprayStmt->execute([':pid' => $plantWheatActive, ':pby' => $userId, ':cname' => 'Folicur 430 SC', ':ctype' => 'fungicide', ':qty' => 30.00, ':ratio' => '1:400', ':sdate' => '2026-07-28', ':target' => 'Stem & Leaf Rust', ':notes' => 'Protective flag leaf fungicide spray']);
    $sprayStmt->execute([':pid' => $plantSoyaHarvested, ':pby' => $userId, ':cname' => 'Amistar Top', ':ctype' => 'fungicide', ':qty' => 22.00, ':ratio' => '1:500', ':sdate' => '2026-02-15', ':target' => 'Soybean Rust', ':notes' => 'Preventative application at canopy closure']);
    $sprayStmt->execute([':pid' => $plantTomato, ':pby' => $userId, ':cname' => 'Ridomil Gold MZ', ':ctype' => 'fungicide', ':qty' => 12.00, ':ratio' => '1:350', ':sdate' => '2026-09-18', ':target' => 'Tomato Late Blight', ':notes' => 'Greenhouse weekly maintenance spray']);

    // -------------------------------------------------------------
    // 5. Breeds & Animals (Livestock Registry - Mazabuka & Mkushi)
    // -------------------------------------------------------------
    echo "5. Populating Zambian Livestock, Vaccinations, Treatments, Feed & Milk Production...\n";

    $animalsData = [
        // Farm 2: Mazabuka Commercial Dairy Herd (Holstein Friesian)
        ['farm_id' => $farm2Id, 'breed' => 'Holstein Friesian', 'tag' => 'ZM-HF-001', 'name' => 'Kafue Star', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-03-10', 'weight' => 640.00, 'price' => 35000.00, 'source' => 'Zambeef Dairy Breeding Stock', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Holstein Friesian', 'tag' => 'ZM-HF-002', 'name' => 'Mazabuka Queen', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-06-18', 'weight' => 610.00, 'price' => 34000.00, 'source' => 'Mazabuka Dairy Breeders', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Holstein Friesian', 'tag' => 'ZM-HF-003', 'name' => 'Chirundu Bella', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2023-01-14', 'weight' => 580.00, 'price' => 32000.00, 'source' => 'Mazabuka Dairy Breeders', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Holstein Friesian', 'tag' => 'ZM-HF-004', 'name' => 'Victoria Daisy', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2023-04-05', 'weight' => 550.00, 'price' => 30000.00, 'source' => 'Zambeef Dairy Breeding Stock', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Holstein Friesian', 'tag' => 'ZM-HF-BULL-1', 'name' => 'Titan Mazabuka', 'species' => 'cattle', 'gender' => 'male', 'dob' => '2021-09-12', 'weight' => 920.00, 'price' => 55000.00, 'source' => 'Batoka Artificial Insemination Stud', 'status' => 'active'],

        // Farm 2: Boran & Brahman Beef Herd (Mazabuka)
        ['farm_id' => $farm2Id, 'breed' => 'Boran', 'tag' => 'ZM-BOR-101', 'name' => 'Luangwa Bull', 'species' => 'cattle', 'gender' => 'male', 'dob' => '2021-05-15', 'weight' => 780.00, 'price' => 38000.00, 'source' => 'Kaleya Commercial Ranches', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Boran', 'tag' => 'ZM-BOR-102', 'name' => 'Zambezi Rose', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-08-20', 'weight' => 540.00, 'price' => 26000.00, 'source' => 'Kaleya Commercial Ranches', 'status' => 'active'],
        ['farm_id' => $farm2Id, 'breed' => 'Brahman Commercial', 'tag' => 'ZM-BRH-201', 'name' => 'Kalomo King', 'species' => 'cattle', 'gender' => 'male', 'dob' => '2022-01-10', 'weight' => 840.00, 'price' => 45000.00, 'source' => 'Southern Ranches Monze', 'status' => 'active'],

        // Farm 1: Small Stock & Indigenous Mashona (Mkushi)
        ['farm_id' => $farm1Id, 'breed' => 'Mashona (Angoni/Tonga)', 'tag' => 'ZM-MSH-301', 'name' => 'Muchinga Brave', 'species' => 'cattle', 'gender' => 'female', 'dob' => '2022-10-12', 'weight' => 460.00, 'price' => 18000.00, 'source' => 'Central Province Livestock Cooperative', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Boer Goat', 'tag' => 'ZM-BG-401', 'name' => 'Mkushi Ram', 'species' => 'goat', 'gender' => 'male', 'dob' => '2023-04-18', 'weight' => 90.00, 'price' => 6500.00, 'source' => 'Golden Valley Research Trust (GART)', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Boer Goat', 'tag' => 'ZM-BG-402', 'name' => 'Kabwe Doe', 'species' => 'goat', 'gender' => 'female', 'dob' => '2023-05-22', 'weight' => 65.00, 'price' => 5200.00, 'source' => 'Golden Valley Research Trust (GART)', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Dorper', 'tag' => 'ZM-DP-501', 'name' => 'Choma Ewe', 'species' => 'sheep', 'gender' => 'female', 'dob' => '2023-03-30', 'weight' => 62.00, 'price' => 4800.00, 'source' => 'Batoka Research Station', 'status' => 'active'],
        ['farm_id' => $farm1Id, 'breed' => 'Dorper', 'tag' => 'ZM-DP-502', 'name' => 'Gwembe Ram', 'species' => 'sheep', 'gender' => 'male', 'dob' => '2023-02-14', 'weight' => 82.00, 'price' => 5800.00, 'source' => 'Batoka Research Station', 'status' => 'active'],
    ];

    $animalStmt = $pdo->prepare("INSERT INTO animals (farm_id, breed_id, tag_number, name, species, gender, date_of_birth, weight_kg, purchase_price, purchase_date, source, status, notes)
        VALUES (:farm_id, :breed_id, :tag, :name, :species, :gender, :dob, :weight, :price, '2024-02-10', :source, 'active', :notes)");

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
            ':notes' => 'Registered commercial breeding & production stock in Zambia'
        ]);
        $animalIds[$a['tag']] = (int)$pdo->lastInsertId();
    }

    // Vaccinations - Zambian veterinary protocols (FMD, Contagious Bovine Pleuropneumonia, Anthrax, Blackquarter)
    $vacStmt = $pdo->prepare("INSERT INTO vaccinations (animal_id, administered_by, vaccine_name, disease_target, dose_ml, vaccination_date, next_due_date, batch_number, notes)
        VALUES (:aid, :aby, :vname, :dtarget, :dose, :vdate, :ndate, :batch, :notes)");

    foreach (['ZM-HF-001', 'ZM-HF-002', 'ZM-HF-003', 'ZM-HF-004', 'ZM-BOR-101', 'ZM-BRH-201'] as $tag) {
        $aId = $animalIds[$tag];
        $vacStmt->execute([
            ':aid' => $aId, ':aby' => $userId, ':vname' => 'FMD Quadrivalent Booster',
            ':dtarget' => 'Foot & Mouth Disease Types SAT1, SAT2, SAT3, O', ':dose' => 5.00,
            ':vdate' => '2026-06-10', ':ndate' => '2026-12-10', ':batch' => 'CVRI-FMD-ZM-2026-03',
            ':notes' => 'Administered under Central Veterinary Research Institute (CVRI) protocols'
        ]);
        $vacStmt->execute([
            ':aid' => $aId, ':aby' => $userId, ':vname' => 'Bovivax Blackquarter & Anthrax',
            ':dtarget' => 'Blackquarter and Anthrax spore bacteria', ':dose' => 2.00,
            ':vdate' => '2026-04-15', ':ndate' => '2027-04-15', ':batch' => 'BOV-ZM-9921',
            ':notes' => 'Routine annual subcutaneous vaccination in Southern Province'
        ]);
    }

    // Treatments
    $treatStmt = $pdo->prepare("INSERT INTO treatments (animal_id, administered_by, diagnosis, treatment_name, medication, dose, treatment_date, follow_up_date, outcome, cost, notes)
        VALUES (:aid, :aby, :diag, :tname, :med, :dose, :tdate, :fdate, :outcome, :cost, :notes)");

    $treatStmt->execute([
        ':aid' => $animalIds['ZM-HF-002'], ':aby' => $userId, ':diag' => 'Mild bovine mastitis left front quarter',
        ':tname' => 'Intramammary antibacterial therapy', ':med' => 'Spectramast LC + Metacam',
        ':dose' => '1 tube daily for 3 days', ':tdate' => date('Y-m-d', strtotime('-14 days')),
        ':fdate' => date('Y-m-d', strtotime('-7 days')), ':outcome' => 'recovered', ':cost' => 650.00,
        ':notes' => 'Milk withheld during withdrawal period. Somatic cell count returned to Grade A.'
    ]);
    $treatStmt->execute([
        ':aid' => $animalIds['ZM-BG-401'], ':aby' => $userId, ':diag' => 'Heartwater tick-borne infection early stage',
        ':tname' => 'Oxytetracycline systemic injection', ':med' => 'Engemycin 10% Long Acting',
        ':dose' => '20 ml intramuscular', ':tdate' => date('Y-m-d', strtotime('-25 days')),
        ':fdate' => date('Y-m-d', strtotime('-18 days')), ':outcome' => 'recovered', ':cost' => 380.00,
        ':notes' => 'Rapid diagnosis and treatment prevented neurological stage. Flock plunge dip refreshed.'
    ]);

    // Feed Records
    $feedStmt = $pdo->prepare("INSERT INTO feed_records (animal_id, recorded_by, feed_type, quantity_kg, cost, feed_date, notes)
        VALUES (:aid, :rby, :ftype, :qty, :cost, :fdate, :notes)");

    foreach (['ZM-HF-001', 'ZM-HF-002', 'ZM-HF-003', 'ZM-HF-004'] as $tag) {
        $aId = $animalIds[$tag];
        $feedStmt->execute([
            ':aid' => $aId, ':rby' => $userId, ':ftype' => 'Tiger Feeds High Milk Dairy 18% Concentrate',
            ':qty' => 9.00, ':cost' => 68.00, ':fdate' => date('Y-m-d', strtotime('-1 day')),
            ':notes' => 'Concentrate split ration at milking parlour'
        ]);
        $feedStmt->execute([
            ':aid' => $aId, ':rby' => $userId, ':ftype' => 'Katambora Rhodes Grass Silage + Molasses',
            ':qty' => 38.00, ':cost' => 45.00, ':fdate' => date('Y-m-d', strtotime('-1 day')),
            ':notes' => 'Total mixed ration (TMR) ad libitum feeding'
        ]);
    }

    // Breeding Records (Mating and pregnancy outcomes)
    $breedStmt = $pdo->prepare("INSERT INTO breeding_records (dam_id, sire_id, recorded_by, mating_date, expected_birth, actual_birth, offspring_count, outcome, notes)
        VALUES (:dam_id, :sire_id, :rby, :mdate, :ebirth, :abirth, :ocount, :outcome, :notes)");

    $breedStmt->execute([
        ':dam_id' => $animalIds['ZM-HF-001'],
        ':sire_id' => $animalIds['ZM-HF-BULL-1'],
        ':rby' => $userId,
        ':mdate' => '2025-08-10',
        ':ebirth' => '2026-05-18',
        ':abirth' => '2026-05-20',
        ':ocount' => 1,
        ':outcome' => 'successful',
        ':notes' => 'Healthy female Holstein dairy calf born, weight 41kg at birth.'
    ]);
    $breedStmt->execute([
        ':dam_id' => $animalIds['ZM-BOR-102'],
        ':sire_id' => $animalIds['ZM-BOR-101'],
        ':rby' => $userId,
        ':mdate' => '2026-02-15',
        ':ebirth' => '2026-11-25',
        ':abirth' => null,
        ':ocount' => 0,
        ':outcome' => 'pending',
        ':notes' => 'Ultrasound pregnancy diagnosis confirmed positive at 60 days.'
    ]);

    // Livestock Production (30 Days Daily Milk Production in Mazabuka)
    $prodStmt = $pdo->prepare("INSERT INTO livestock_production (animal_id, recorded_by, product_type, quantity, unit, production_date, quality_grade, notes)
        VALUES (:aid, :rby, 'milk', :qty, 'litres', :pdate, 'A', :notes)");

    $cows = [
        'ZM-HF-001' => ['base' => 28.5],
        'ZM-HF-002' => ['base' => 25.0],
        'ZM-HF-003' => ['base' => 23.5],
        'ZM-HF-004' => ['base' => 21.0]
    ];

    for ($d = 29; $d >= 0; $d--) {
        $prodDate = date('Y-m-d', strtotime("-{$d} days"));
        foreach ($cows as $tag => $data) {
            $aId = $animalIds[$tag];
            $variation = (sin($d * 0.4) * 1.6) + (mt_rand(-4, 4) / 10.0);
            $qty = round($data['base'] + $variation, 1);
            $prodStmt->execute([
                ':aid' => $aId,
                ':rby' => $userId,
                ':qty' => $qty,
                ':pdate' => $prodDate,
                ':notes' => 'Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia'
            ]);
        }
    }

    // -------------------------------------------------------------
    // 6. Water Sources, Irrigation Systems & Schedules
    // -------------------------------------------------------------
    echo "6. Seeding Water Sources, Irrigation Systems, and Consumption...\n";

    $wsStmt = $pdo->prepare("INSERT INTO water_sources (farm_id, name, type, capacity_litres, current_level_litres, ph_level, location_description, is_active)
        VALUES (:farm_id, :name, :type, :cap, :curr, :ph, :loc, 1)");

    // Mkushi water sources
    $wsStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Lunsemfwa River Extraction Weir', ':type' => 'river',
        ':cap' => 3500000.00, ':curr' => 3100000.00, ':ph' => 7.00,
        ':loc' => 'Water Resources Management Authority (WARMA) licensed pump station on Lunsemfwa tributary'
    ]);
    $ws1Id = (int)$pdo->lastInsertId();

    $wsStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Mkushi Estate Earth Dam Reservoir', ':type' => 'dam',
        ':cap' => 8500000.00, ':curr' => 7200000.00, ':ph' => 7.20,
        ':loc' => 'Primary gravity earthen dam with 120ML storage capacity'
    ]);
    $ws2Id = (int)$pdo->lastInsertId();

    // Mazabuka water sources
    $wsStmt->execute([
        ':farm_id' => $farm2Id, ':name' => 'Kafue River Main Irrigation Canal', ':type' => 'canal',
        ':cap' => 6000000.00, ':curr' => 5400000.00, ':ph' => 7.10,
        ':loc' => 'Joint agricultural water intake canal from Kafue flats'
    ]);
    $ws3Id = (int)$pdo->lastInsertId();

    // Chisamba water sources
    $wsStmt->execute([
        ':farm_id' => $farm3Id, ':name' => 'Chisamba Commercial Solar Borehole #1', ':type' => 'borehole',
        ':cap' => 800000.00, ':curr' => 740000.00, ':ph' => 6.80,
        ':loc' => '120m deep dolomite aquifer borehole with 15kW solar array'
    ]);
    $ws4Id = (int)$pdo->lastInsertId();

    // Irrigation Systems
    $isStmt = $pdo->prepare("INSERT INTO irrigation_systems (farm_id, field_id, water_source_id, name, type, flow_rate_lpm, status, installation_date, notes)
        VALUES (:farm_id, :field_id, :ws_id, :name, :type, :flow, 'active', :idate, :notes)");

    // Mkushi Center Pivot
    $isStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field1Id, ':ws_id' => $ws2Id,
        ':name' => 'Valley 4-Span Center Pivot (North Sector)', ':type' => 'center_pivot', ':flow' => 2400.00,
        ':idate' => '2023-04-10', ':notes' => 'Covers 85 hectares wheat and seed rotation; low-pressure rotator drops'
    ]);
    $is1Id = (int)$pdo->lastInsertId();

    // Mazabuka Sprinkler Line
    $isStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field6Id, ':ws_id' => $ws3Id,
        ':name' => 'Kafue Semi-Permanent Sprinkler Grid', ':type' => 'sprinkler', ':flow' => 1600.00,
        ':idate' => '2022-08-20', ':notes' => 'Impact sprinkler system for Rhodes grass pasture and silage'
    ]);
    $is2Id = (int)$pdo->lastInsertId();

    // Chisamba Greenhouse Drip & Misting
    $isStmt->execute([
        ':farm_id' => $farm3Id, ':field_id' => $field8Id, ':ws_id' => $ws4Id,
        ':name' => 'Netafim Automated Greenhouse Drip System', ':type' => 'drip', ':flow' => 320.00,
        ':idate' => '2024-01-15', ':notes' => 'Pressure compensated drip emitters with EC/pH sensor injection manifold'
    ]);
    $is3Id = (int)$pdo->lastInsertId();

    // Irrigation Schedules
    $ischStmt = $pdo->prepare("INSERT INTO irrigation_schedules (system_id, field_id, created_by, start_time, duration_minutes, target_volume_litres, frequency, days_of_week, is_active, notes)
        VALUES (:sys_id, :fid, :cby, :stime, :dur, :vol, :freq, :days, 1, :notes)");

    $ischStmt->execute([
        ':sys_id' => $is1Id, ':fid' => $field1Id, ':cby' => $userId,
        ':stime' => '18:00:00', ':dur' => 360, ':vol' => 864000.00, ':freq' => 'alternate_days',
        ':days' => 'Mon,Wed,Fri', ':notes' => 'Night irrigation run for winter wheat to maximize electrical off-peak tariff (ZESCO)'
    ]);
    $ischStmt->execute([
        ':sys_id' => $is3Id, ':fid' => $field8Id, ':cby' => $userId,
        ':stime' => '07:00:00', ':dur' => 40, ':vol' => 12800.00, ':freq' => 'daily',
        ':days' => 'Daily', ':notes' => 'Morning nutrient fertigation cycle for Anna F1 tomatoes'
    ]);

    // Water consumption logs (Past 7 days)
    $wcStmt = $pdo->prepare("INSERT INTO water_consumption (system_id, field_id, recorded_by, volume_litres, duration_minutes, cost_amount, logged_date, notes)
        VALUES (:sys_id, :fid, :rby, :vol, :dur, :cost, :ldate, :notes)");

    for ($w = 7; $w >= 1; $w--) {
        $wcDate = date('Y-m-d', strtotime("-{$w} days"));
        $wcStmt->execute([
            ':sys_id' => $is1Id, ':fid' => $field1Id, ':rby' => $userId,
            ':vol' => 860000.00, ':dur' => 360, ':cost' => 620.00, ':ldate' => $wcDate,
            ':notes' => 'Center pivot full rotation logged; ZESCO power tariff'
        ]);
        $wcStmt->execute([
            ':sys_id' => $is3Id, ':fid' => $field8Id, ':rby' => $userId,
            ':vol' => 12600.00, ':dur' => 40, ':cost' => 45.00, ':ldate' => $wcDate,
            ':notes' => 'Greenhouse pulse fertigation cycle'
        ]);
    }

    // -------------------------------------------------------------
    // 7. Inventory Items & Stock Movements (Zambian Agrochemicals, Seeds, Feed)
    // -------------------------------------------------------------
    echo "7. Seeding Inventory & Stock Movements...\n";

    $inventoryData = [
        // Mkushi Farm
        ['farm_id' => $farm1Id, 'name' => 'Compound D Basal Fertilizer 50kg', 'category' => 'fertilizers', 'sku' => 'FERT-CMPD-50KG', 'qty' => 120.00, 'unit' => 'bags (50kg)', 'reorder' => 50.00, 'cost' => 850.00, 'loc' => 'Central Shed 1', 'supp' => 'Nitrogen Chemicals of Zambia'],
        ['farm_id' => $farm1Id, 'name' => 'Urea 46% Nitrogen Fertilizer 50kg', 'category' => 'fertilizers', 'sku' => 'FERT-UREA-50KG', 'qty' => 18.00, 'unit' => 'bags (50kg)', 'reorder' => 40.00, 'cost' => 920.00, 'loc' => 'Central Shed 1', 'supp' => 'Omnia Fertilizer Zambia'],
        ['farm_id' => $farm1Id, 'name' => 'Seed Co SC 719 Hybrid Maize Seed 25kg', 'category' => 'seeds', 'sku' => 'SEED-SC719-25KG', 'qty' => 45.00, 'unit' => 'pockets (25kg)', 'reorder' => 20.00, 'cost' => 950.00, 'loc' => 'Cold Seed Store', 'supp' => 'Seed Co Zambia Ltd'],
        ['farm_id' => $farm1Id, 'name' => 'MRI Safari Soya Seed 50kg', 'category' => 'seeds', 'sku' => 'SEED-SOYA-50KG', 'qty' => 60.00, 'unit' => 'bags (50kg)', 'reorder' => 25.00, 'cost' => 1100.00, 'loc' => 'Cold Seed Store', 'supp' => 'Syngenta / MRI Agro Zambia'],
        ['farm_id' => $farm1Id, 'name' => 'Ampligo 150 ZC Insecticide 1L', 'category' => 'chemicals', 'sku' => 'CHEM-AMP-1L', 'qty' => 8.00, 'unit' => 'litres', 'reorder' => 15.00, 'cost' => 480.00, 'loc' => 'Agrochemical Vault', 'supp' => 'Arysta LifeScience Zambia'],
        ['farm_id' => $farm1Id, 'name' => 'Low Sulfur Automotive Diesel Fuel', 'category' => 'fuel', 'sku' => 'FUEL-DSL-MKUSHI', 'qty' => 4500.00, 'unit' => 'litres', 'reorder' => 1500.00, 'cost' => 28.50, 'loc' => 'Bunkered 10,000L Fuel Depot', 'supp' => 'TotalEnergies Marketing Zambia'],

        // Mazabuka Farm
        ['farm_id' => $farm2Id, 'name' => 'Tiger Feeds Dairy 18% Meal 50kg', 'category' => 'animal_feed', 'sku' => 'FEED-TGR-50KG', 'qty' => 110.00, 'unit' => 'bags (50kg)', 'reorder' => 30.00, 'cost' => 380.00, 'loc' => 'Dairy Feed Shed', 'supp' => 'Tiger Feeds Zambia'],
        ['farm_id' => $farm2Id, 'name' => 'Bovivax Blackquarter & Anthrax 100ml', 'category' => 'vet_medicine', 'sku' => 'VET-BOV-100ML', 'qty' => 15.00, 'unit' => 'vials', 'reorder' => 5.00, 'cost' => 260.00, 'loc' => 'Veterinary Fridge', 'supp' => 'Afrivet Zambia'],
        ['farm_id' => $farm2Id, 'name' => 'Katambora Rhodes Grass Seed 10kg', 'category' => 'seeds', 'sku' => 'SEED-RHD-10KG', 'qty' => 25.00, 'unit' => 'packets (10kg)', 'reorder' => 10.00, 'cost' => 420.00, 'loc' => 'Pasture Store', 'supp' => 'Zamseed Zambia'],

        // Chisamba Farm
        ['farm_id' => $farm3Id, 'name' => 'Anna F1 Tomato Seed (10,000 seeds)', 'category' => 'seeds', 'sku' => 'SEED-TOM-ANNA', 'qty' => 6.00, 'unit' => 'packets', 'reorder' => 2.00, 'cost' => 850.00, 'loc' => 'Greenhouse Office Safe', 'supp' => 'Simlaw Seeds / Syngenta Zambia'],
        ['farm_id' => $farm3Id, 'name' => 'Heavy-Duty 10kg Tomato Export Crates', 'category' => 'packaging', 'sku' => 'PACK-CRT-10KG', 'qty' => 850.00, 'unit' => 'crates', 'reorder' => 200.00, 'cost' => 24.00, 'loc' => 'Packaging Store', 'supp' => 'Polypack Zambia Ltd'],
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

    // Stock movements
    $smStmt = $pdo->prepare("INSERT INTO stock_movements (item_id, recorded_by, movement_type, quantity, unit_price, reference_type, notes)
        VALUES (:item_id, :rby, :mtype, :qty, :price, 'Initial Stock Purchase', :notes)");

    foreach ($invIds as $sku => $itemId) {
        $smStmt->execute([
            ':item_id' => $itemId,
            ':rby' => $userId,
            ':mtype' => 'stock_in',
            ':qty' => 50.00,
            ':price' => 500.00,
            ':notes' => 'Consignment received into central inventory'
        ]);
    }

    // -------------------------------------------------------------
    // 8. Equipment, Maintenance Schedules, Repair History & Fuel Logs
    // -------------------------------------------------------------
    echo "8. Seeding Equipment, Maintenance, and Fuel Logs...\n";

    $equipmentData = [
        // Mkushi Heavy Fleet
        ['farm_id' => $farm1Id, 'name' => 'John Deere 7200R Heavy 4WD Tractor (200HP)', 'type' => 'tractor', 'brand' => 'John Deere', 'model' => '7200R', 'sn' => 'JD-7200R-MKUSHI-01', 'hours' => 2340.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 1250000.00, 'val' => 1050000.00],
        ['farm_id' => $farm1Id, 'name' => 'Claas Lexion 670 Grain Combine Harvester', 'type' => 'harvester', 'brand' => 'Claas', 'model' => 'Lexion 670', 'sn' => 'CLS-LEX670-2023', 'hours' => 680.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 2600000.00, 'val' => 2350000.00],
        ['farm_id' => $farm1Id, 'name' => 'Monosem 8-Row Precision Vacuum Planter', 'type' => 'planter', 'brand' => 'Monosem', 'model' => 'NG Plus 4 (8-Row)', 'sn' => 'MNS-8R-MKU-44', 'hours' => 380.00, 'fuel' => 'none', 'status' => 'available', 'cost' => 520000.00, 'val' => 460000.00],
        ['farm_id' => $farm1Id, 'name' => 'Jacto Advance 3000L Field Boom Sprayer', 'type' => 'sprayer', 'brand' => 'Jacto', 'model' => 'Advance 3000', 'sn' => 'JCT-ADV3000-ZM', 'hours' => 490.00, 'fuel' => 'none', 'status' => 'available', 'cost' => 340000.00, 'val' => 295000.00],

        // Mazabuka Fleet
        ['farm_id' => $farm2Id, 'name' => 'Massey Ferguson MF 385 4WD Heavy Tractor', 'type' => 'tractor', 'brand' => 'Massey Ferguson', 'model' => 'MF 385', 'sn' => 'MF-385-MAZA-02', 'hours' => 3120.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 680000.00, 'val' => 520000.00],
        ['farm_id' => $farm2Id, 'name' => 'Welger AP 630 High Density Square Baler', 'type' => 'implement', 'brand' => 'Welger', 'model' => 'AP 630', 'sn' => 'WLG-AP630-01', 'hours' => 410.00, 'fuel' => 'none', 'status' => 'available', 'cost' => 280000.00, 'val' => 240000.00],
        ['farm_id' => $farm2Id, 'name' => 'DeLaval 2x8 Herringbone Milking Parlour Unit', 'type' => 'pump', 'brand' => 'DeLaval', 'model' => 'MidiLine 2x8', 'sn' => 'DLV-ML28-MAZ', 'hours' => 5400.00, 'fuel' => 'electric', 'status' => 'in_use', 'cost' => 450000.00, 'val' => 380000.00],

        // Chisamba Fleet
        ['farm_id' => $farm3Id, 'name' => 'Sonalika Tiger DI 50 Utility Tractor', 'type' => 'tractor', 'brand' => 'Sonalika (SARO)', 'model' => 'Tiger DI 50', 'sn' => 'SARO-SON-50-CHIS', 'hours' => 840.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 320000.00, 'val' => 280000.00],
        ['farm_id' => $farm3Id, 'name' => 'Cummins 35kVA Standby Diesel Generator', 'type' => 'generator', 'brand' => 'Cummins', 'model' => 'C35D5', 'sn' => 'CUM-GEN-35KVA', 'hours' => 290.00, 'fuel' => 'diesel', 'status' => 'available', 'cost' => 220000.00, 'val' => 195000.00],
    ];

    $eqStmt = $pdo->prepare("INSERT INTO equipment (farm_id, name, type, brand, model, serial_number, operating_hours, fuel_type, status, purchase_date, purchase_cost, current_value, notes)
        VALUES (:farm_id, :name, :type, :brand, :model, :sn, :hours, :fuel, :status, '2023-01-20', :cost, :val, 'Operational farm machinery in Zambia')");

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
        ':eq_id' => $eqIds['JD-7200R-MKUSHI-01'],
        ':stype' => '250-Hour Engine Oil, Fuel & Hydraulic Filter Service',
        ':ihours' => 250.00,
        ':lsdate' => '2026-07-20',
        ':nsdate' => '2026-10-10',
        ':lshours' => 2100.00,
        ':nshours' => 2350.00,
        ':status' => 'due',
        ':notes' => 'Service scheduled prior to 2026/2027 summer planting season; filters supplied by AFGRI Zambia'
    ]);

    $maintStmt->execute([
        ':eq_id' => $eqIds['CLS-LEX670-2023'],
        ':stype' => 'Pre-Harvest Threshing Drum & Cutter Bar Servicing',
        ':ihours' => 500.00,
        ':lsdate' => '2026-09-15',
        ':nsdate' => '2026-10-12',
        ':lshours' => 650.00,
        ':nshours' => 700.00,
        ':status' => 'scheduled',
        ':notes' => 'Preparation for winter wheat combine harvesting in Mkushi'
    ]);

    // Repair History (Equipment repairs)
    $repStmt = $pdo->prepare("INSERT INTO repair_history (equipment_id, recorded_by, description, cost_amount, technician_name, repair_date, parts_replaced)
        VALUES (:eq_id, :rby, :desc, :cost, :tech, :rdate, :parts)");

    $repStmt->execute([
        ':eq_id' => $eqIds['MF-385-MAZA-02'],
        ':rby' => $userId,
        ':desc' => 'Hydraulic lift cylinder seal overhaul and power steering hose replacement',
        ':cost' => 8500.00,
        ':tech' => 'Patrick Tembo (SARO Agro Mechanics)',
        ':rdate' => '2026-08-14',
        ':parts' => 'Hydraulic seal kit, high-pressure steering hose, SAE 40 hydraulic oil 20L'
    ]);
    $repStmt->execute([
        ':eq_id' => $eqIds['SARO-SON-50-CHIS'],
        ':rby' => $userId,
        ':desc' => 'Radiator flush and water pump replacement due to thermal overheating',
        ':cost' => 4200.00,
        ':tech' => 'Godfrey Mwansa',
        ':rdate' => '2026-09-02',
        ':parts' => 'Sonalika OEM water pump, thermostat gasket, anti-freeze coolant'
    ]);

    // Fuel Logs
    $fuelStmt = $pdo->prepare("INSERT INTO fuel_logs (equipment_id, recorded_by, litres_added, cost_amount, current_meter_hours, logged_date, notes)
        VALUES (:eq_id, :rby, :litres, :cost, :hours, :ldate, :notes)");

    $fuelStmt->execute([
        ':eq_id' => $eqIds['JD-7200R-MKUSHI-01'],
        ':rby' => $userId,
        ':litres' => 320.00,
        ':cost' => 9120.00,
        ':hours' => 2335.00,
        ':ldate' => date('Y-m-d', strtotime('-3 days')),
        ':notes' => 'Diesel fill-up from farm depot for land discing and harrowing'
    ]);
    $fuelStmt->execute([
        ':eq_id' => $eqIds['MF-385-MAZA-02'],
        ':rby' => $userId,
        ':litres' => 150.00,
        ':cost' => 4275.00,
        ':hours' => 3115.00,
        ':ldate' => date('Y-m-d', strtotime('-5 days')),
        ':notes' => 'Tractor fuel for Rhodes hay cutting and baler tow'
    ]);

    // -------------------------------------------------------------
    // 9. Labour & Workers (Zambian Staff Across 3 Farms)
    // -------------------------------------------------------------
    echo "9. Seeding Zambian Farm Workers, Attendance, Tasks & Payroll...\n";

    $workersData = [
        // Mkushi Staff
        ['farm_id' => $farm1Id, 'first' => 'Mubanga', 'last' => 'Chanda', 'role' => 'supervisor', 'type' => 'permanent', 'rate' => 250.00, 'phone' => '+260977112233', 'id_nat' => '284910/11/1'],
        ['farm_id' => $farm1Id, 'first' => 'Kondwani', 'last' => 'Phiri', 'role' => 'agronomist', 'type' => 'permanent', 'rate' => 320.00, 'phone' => '+260978223344', 'id_nat' => '301928/67/1'],
        ['farm_id' => $farm1Id, 'first' => 'Emmanuel', 'last' => 'Banda', 'role' => 'tractor_driver', 'type' => 'permanent', 'rate' => 220.00, 'phone' => '+260979334455', 'id_nat' => '274819/10/1'],
        ['farm_id' => $farm1Id, 'first' => 'Natasha', 'last' => 'Mulenga', 'role' => 'technician', 'type' => 'permanent', 'rate' => 240.00, 'phone' => '+260971445566', 'id_nat' => '310293/88/1'],

        // Mazabuka Staff
        ['farm_id' => $farm2Id, 'first' => 'Given', 'last' => 'Hachileka', 'role' => 'supervisor', 'type' => 'permanent', 'rate' => 260.00, 'phone' => '+260976556677', 'id_nat' => '293847/72/1'],
        ['farm_id' => $farm2Id, 'first' => 'Mainza', 'last' => 'Mweene', 'role' => 'field_worker', 'type' => 'permanent', 'rate' => 160.00, 'phone' => '+260975667788', 'id_nat' => '339102/54/1'],
        ['farm_id' => $farm2Id, 'first' => 'Mutinta', 'last' => 'Simukonda', 'role' => 'technician', 'type' => 'permanent', 'rate' => 230.00, 'phone' => '+260974778899', 'id_nat' => '329182/43/1'],

        // Chisamba Staff
        ['farm_id' => $farm3Id, 'first' => 'Kelvin', 'last' => 'Lupiya', 'role' => 'supervisor', 'type' => 'permanent', 'rate' => 240.00, 'phone' => '+260973889900', 'id_nat' => '318291/22/1'],
        ['farm_id' => $farm3Id, 'first' => 'Chileshe', 'last' => 'Mwape', 'role' => 'field_worker', 'type' => 'seasonal', 'rate' => 150.00, 'phone' => '+260972990011', 'id_nat' => '349182/15/1'],
        ['farm_id' => $farm3Id, 'first' => 'Lombe', 'last' => 'Sampa', 'role' => 'harvester', 'type' => 'seasonal', 'rate' => 150.00, 'phone' => '+260971001122', 'id_nat' => '358291/31/1'],
    ];

    $wStmt = $pdo->prepare("INSERT INTO workers (farm_id, first_name, last_name, id_national_number, phone, email, role, employment_type, daily_rate, hire_date, status, notes)
        VALUES (:farm_id, :first, :last, :id_nat, :phone, :email, :role, :type, :rate, '2023-01-15', 'active', 'Certified experienced staff member')");

    $workerIds = [];
    foreach ($workersData as $w) {
        $email = strtolower($w['first'] . '.' . $w['last'] . '@chisangafarms.co.zm');
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

    // Worker attendance (last 7 days across all farms)
    $attStmt = $pdo->prepare("INSERT INTO worker_attendance (worker_id, farm_id, recorded_by, work_date, status, hours_worked, overtime_hours, notes)
        VALUES (:wid, :farm_id, :rby, :wdate, 'present', 8.00, :ot, 'Standard daily shift')");

    for ($d = 6; $d >= 0; $d--) {
        $wDate = date('Y-m-d', strtotime("-{$d} days"));
        foreach ($workersData as $idx => $w) {
            $wid = $workerIds[$idx];
            $ot = ($d % 3 === 0) ? 1.50 : 0.00;
            $attStmt->execute([
                ':wid' => $wid,
                ':farm_id' => $w['farm_id'],
                ':rby' => $userId,
                ':wdate' => $wDate,
                ':ot' => $ot
            ]);
        }
    }

    // Tasks (Actionable farm tasks)
    $taskStmt = $pdo->prepare("INSERT INTO task_assignments (farm_id, field_id, worker_id, assigned_by, title, description, priority, due_date, status)
        VALUES (:farm_id, :field_id, :wid, :aby, :title, :desc, :pri, :due, :status)");

    $taskStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field1Id, ':wid' => $workerIds[1], ':aby' => $userId,
        ':title' => 'Calibrate Combine Header for Winter Wheat Harvest in Sector A',
        ':desc' => 'Inspect knife drive sections, reel speed, and concave clearance for Claas Lexion.',
        ':pri' => 'urgent', ':due' => date('Y-m-d', strtotime('+2 days')), ':status' => 'in_progress'
    ]);
    $taskStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':wid' => $workerIds[2], ':aby' => $userId,
        ':title' => 'Pre-Season Tillage & Ripper Pass on Commercial Maize Block B',
        ':desc' => 'Execute conservation ripping to 35cm depth ahead of onset of summer rains.',
        ':pri' => 'high', ':due' => date('Y-m-d', strtotime('+5 days')), ':status' => 'pending'
    ]);
    $taskStmt->execute([
        ':farm_id' => $farm2Id, ':field_id' => $field6Id, ':wid' => $workerIds[4], ':aby' => $userId,
        ':title' => 'Bale and Stack Rhodes Grass Hay in Mazabuka Fodder Shed',
        ':desc' => 'Run Welger baler across 25ha cut stand; target 1,200 rectangular bales for dairy herd.',
        ':pri' => 'high', ':due' => date('Y-m-d', strtotime('+3 days')), ':status' => 'in_progress'
    ]);
    $taskStmt->execute([
        ':farm_id' => $farm3Id, ':field_id' => $field8Id, ':wid' => $workerIds[7], ':aby' => $userId,
        ':title' => 'Tomato Crop Trellising and De-leafing in Greenhouses 1-4',
        ':desc' => 'Prune side shoots and lower old foliage to improve air circulation and prevent blight.',
        ':pri' => 'medium', ':due' => date('Y-m-d', strtotime('+4 days')), ':status' => 'in_progress'
    ]);

    // Payroll records for previous month (August 2026) in ZMW
    $payStmt = $pdo->prepare("INSERT INTO payroll_records (worker_id, farm_id, recorded_by, period_start, period_end, days_worked, base_salary, overtime_amount, bonus_amount, deductions, net_payable, payment_status, payment_date, payment_method)
        VALUES (:wid, :farm_id, :rby, '2026-08-01', '2026-08-31', 26.00, :base, :ot, 500.00, 350.00, :net, 'paid', '2026-08-31', 'bank_transfer')");

    foreach ($workersData as $idx => $w) {
        $wid = $workerIds[$idx];
        $base = $w['rate'] * 26.00;
        $ot = $w['rate'] * 1.5 * 4.0;
        $net = $base + $ot + 500.00 - 350.00;
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
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':cid' => $cropIds['White Maize'], ':pid' => $pestIds['Fall Armyworm'],
        ':sby' => $userId, ':sev' => 'moderate', ':area' => 6.50, ':odate' => date('Y-m-d', strtotime('-20 days')),
        ':symp' => 'Windowing in whorls and young larvae detected on 12% of surveyed maize plants.',
        ':act' => 1, ':notes' => 'Early economic threshold reached; knapsack and boom spraying ordered.'
    ]);
    $scoutMaizeId = (int)$pdo->lastInsertId();

    $scoutStmt->execute([
        ':farm_id' => $farm3Id, ':field_id' => $field8Id, ':cid' => $cropIds['Beef Tomato'], ':pid' => $pestIds['Tomato Late Blight'],
        ':sby' => $userId, ':sev' => 'low', ':area' => 1.50, ':odate' => date('Y-m-d', strtotime('-8 days')),
        ':symp' => 'Isolated greasy foliar lesions on greenhouse edge rows near ventilation intake.',
        ':act' => 1, ':notes' => 'Treated immediately with Ridomil Gold; humidity extracted.'
    ]);
    $scoutTomatoId = (int)$pdo->lastInsertId();

    // Pest Treatments
    $ptStmt = $pdo->prepare("INSERT INTO pest_treatments (scouting_id, field_id, applied_by, treatment_type, chemical_product, active_ingredient, dosage_rate, total_quantity_used, unit, application_date, pre_harvest_interval_days, re_entry_interval_hours, effectiveness, notes)
        VALUES (:scout_id, :fid, :aby, 'chemical_spray', :product, :ai, :rate, :qty, 'litres', :adate, 14, 24, 'highly_effective', :notes)");

    $ptStmt->execute([
        ':scout_id' => $scoutMaizeId,
        ':fid' => $field2Id,
        ':aby' => $userId,
        ':product' => 'Ampligo 150 ZC',
        ':ai' => 'Chlorantraniliprole 100g/L + Lambda-cyhalothrin 50g/L',
        ':rate' => '150 ml / ha',
        ':qty' => 10.50,
        ':adate' => date('Y-m-d', strtotime('-18 days')),
        ':notes' => 'High mortality observed; follow-up scouting recorded zero live larvae.'
    ]);
    $ptStmt->execute([
        ':scout_id' => $scoutTomatoId,
        ':fid' => $field8Id,
        ':aby' => $userId,
        ':product' => 'Ridomil Gold MZ 68WG',
        ':ai' => 'Mefenoxam 40g/kg + Mancozeb 640g/kg',
        ':rate' => '2.5 kg / ha',
        ':qty' => 2.50,
        ':adate' => date('Y-m-d', strtotime('-7 days')),
        ':notes' => 'Greenhouse foliar washdown; infection successfully halted.'
    ]);

    // -------------------------------------------------------------
    // 11. Weather Observations & Weather Alerts (Zambian Climate)
    // -------------------------------------------------------------
    echo "11. Seeding Zambian Weather Observations & Alerts...\n";

    $weathStmt = $pdo->prepare("INSERT INTO weather_observations 
        (farm_id, recorded_by, temperature_c, humidity_pct, rainfall_mm, wind_speed_kmh, wind_direction, solar_radiation_wm2, soil_temperature_c, soil_moisture_pct, condition_summary, source, observed_at)
        VALUES (:farm_id, :rby, :temp, :hum, :rain, :wind, :wdir, :solar, :stemp, :smoist, :cond, 'station', :obs_at)");

    // Past 30 days for Mkushi and Mazabuka
    for ($w = 30; $w >= 0; $w--) {
        $dateStr = date('Y-m-d', strtotime("-{$w} days"));
        $obsTime = $dateStr . ' 14:00:00';

        // Mkushi (Warm plateau sunny spring dry season, 25-31 C, low humidity)
        $rain1 = ($w === 2) ? 4.5 : 0.00;
        $temp1 = 28.5 + (sin($w * 0.3) * 3.0);
        $weathStmt->execute([
            ':farm_id' => $farm1Id, ':rby' => $userId,
            ':temp' => round($temp1, 1),
            ':hum' => 38.0 + ($rain1 > 0 ? 25.0 : 0.0),
            ':rain' => $rain1,
            ':wind' => 14.0,
            ':wdir' => 'ENE',
            ':solar' => 840.0,
            ':stemp' => round($temp1 - 1.0, 1),
            ':smoist' => 18.0 + ($rain1 > 0 ? 6.0 : 0.0),
            ':cond' => $rain1 > 0 ? 'Isolated Early Shower' : 'Hot & Sunny Dry Season',
            ':obs_at' => $obsTime
        ]);

        // Mazabuka (Southern Province warmer valley, 27-33 C)
        $rain2 = 0.00;
        $temp2 = 30.5 + (sin($w * 0.25) * 2.8);
        $weathStmt->execute([
            ':farm_id' => $farm2Id, ':rby' => $userId,
            ':temp' => round($temp2, 1),
            ':hum' => 32.0,
            ':rain' => $rain2,
            ':wind' => 11.5,
            ':wdir' => 'SE',
            ':solar' => 880.0,
            ':stemp' => round($temp2 - 0.5, 1),
            ':smoist' => 16.5,
            ':cond' => 'Clear Sky & Hot Dry Spell',
            ':obs_at' => $obsTime
        ]);

        // Chisamba (Central province peri-urban, 26-30 C)
        $weathStmt->execute([
            ':farm_id' => $farm3Id, ':rby' => $userId,
            ':temp' => round($temp1 - 1.0, 1),
            ':hum' => 40.0,
            ':rain' => 0.00,
            ':wind' => 12.0,
            ':wdir' => 'E',
            ':solar' => 810.0,
            ':stemp' => round($temp1 - 1.8, 1),
            ':smoist' => 20.0,
            ':cond' => 'Partly Cloudy & Warm',
            ':obs_at' => $obsTime
        ]);
    }

    // Weather Alerts - Zambia Meteorological Department (ZMD)
    $waltStmt = $pdo->prepare("INSERT INTO weather_alerts (farm_id, created_by, alert_type, severity, title, description, recommended_action, valid_from, valid_until, is_active)
        VALUES (:farm_id, :cby, :atype, :sev, :title, :desc, :act, :vfrom, :vuntil, 1)");

    $waltStmt->execute([
        ':farm_id' => $farm1Id, ':cby' => $userId,
        ':atype' => 'heatwave', ':sev' => 'warning',
        ':title' => 'High Temperature & Dry Spell Advisory for Mkushi Block',
        ':desc' => 'Zambia Meteorological Department forecasts daytime peak temperatures reaching 34°C with relative humidity below 30% across Central Province.',
        ':act' => 'Schedule center pivot irrigation during evening hours (18:00 - 06:00) to minimize evaporative losses and avoid crop water stress.',
        ':vfrom' => date('Y-m-d H:i:s'), ':vuntil' => date('Y-m-d H:i:s', strtotime('+4 days'))
    ]);

    $waltStmt->execute([
        ':farm_id' => $farm2Id, ':cby' => $userId,
        ':atype' => 'strong_winds', ':sev' => 'advisory',
        ':title' => 'Gusty Winds Advisory in Southern Province Kafue Basin',
        ':desc' => 'Sustained south-easterly gusts up to 45 km/h predicted, elevating bushfire risks.',
        ':act' => 'Ensure perimeter firebreaks are cleared and maintain sprinkler pressure along pasture borders.',
        ':vfrom' => date('Y-m-d H:i:s'), ':vuntil' => date('Y-m-d H:i:s', strtotime('+3 days'))
    ]);

    // -------------------------------------------------------------
    // 12. Harvest Records & Harvest Quality
    // -------------------------------------------------------------
    echo "12. Seeding Harvest Records & Harvest Quality...\n";

    $harvStmt = $pdo->prepare("INSERT INTO harvest_records (farm_id, field_id, crop_id, variety_id, harvested_by, harvest_date, quantity_kg, expected_yield_kg, loss_kg, quality_grade, storage_location, notes)
        VALUES (:farm_id, :field_id, :cid, :vid, :hby, :hdate, :qty, :eqty, :loss, :grade, :loc, :notes)");

    // Maize harvest in Mkushi (Field 2)
    $harvStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field2Id, ':cid' => $cropIds['White Maize'], ':vid' => $varietyIds['Seed Co SC 719 Hybrid'],
        ':hby' => $userId, ':hdate' => '2026-05-18', ':qty' => 685000.00, ':eqty' => 700000.00, ':loss' => 4500.00,
        ':grade' => 'A', ':loc' => 'Mkushi Silo Complex Bin #1',
        ':notes' => 'Full combine run across Block B1. Excellent test weight, average moisture 12.8%.'
    ]);
    $harvMaizeId = (int)$pdo->lastInsertId();

    // Soya Beans harvest in Mkushi (Field 3)
    $harvStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field3Id, ':cid' => $cropIds['Soya Beans'], ':vid' => $varietyIds['MRI Safari Soya'],
        ':hby' => $userId, ':hdate' => '2026-04-24', ':qty' => 158000.00, ':eqty' => 162000.00, ':loss' => 1800.00,
        ':grade' => 'A', ':loc' => 'Grain Silo Complex Bin #2',
        ':notes' => 'Clean harvested oilseed delivered to on-farm aerated storage.'
    ]);
    $harvSoyaId = (int)$pdo->lastInsertId();

    // Groundnuts harvest in Mkushi (Field 4)
    $harvStmt->execute([
        ':farm_id' => $farm1Id, ':field_id' => $field4Id, ':cid' => $cropIds['Groundnuts'], ':vid' => $varietyIds['Luangwa Confectionery'],
        ':hby' => $userId, ':hdate' => '2026-05-05', ':qty' => 92000.00, ':eqty' => 96000.00, ':loss' => 950.00,
        ':grade' => 'A', ':loc' => 'Mkushi Dry Warehouse Shed',
        ':notes' => 'Mechanically dug, sun dried on racks, and machine shelled.'
    ]);
    $harvGroundnutId = (int)$pdo->lastInsertId();

    // Paprika harvest in Chisamba (Field 9)
    $harvStmt->execute([
        ':farm_id' => $farm3Id, ':field_id' => $field9Id, ':cid' => $cropIds['Paprika'], ':vid' => $varietyIds['Zambia Queen Paprika'],
        ':hby' => $userId, ':hdate' => '2026-06-30', ':qty' => 88000.00, ':eqty' => 92000.00, ':loss' => 600.00,
        ':grade' => 'A', ':loc' => 'Chisamba Ventilated Dry Shed',
        ':notes' => 'Export color ASTA 140 grade paprika, baled in 50kg poly-lined jute.'
    ]);
    $harvPaprikaId = (int)$pdo->lastInsertId();

    // Harvest Quality Inspections
    $hqStmt = $pdo->prepare("INSERT INTO harvest_quality (harvest_id, inspected_by, moisture_content_pct, foreign_matter_pct, defect_rate_pct, sugar_brix, certification_status, inspection_date, notes)
        VALUES (:hid, :iby, :moist, :foreign, :defect, :brix, :cert, :idate, :notes)");

    $hqStmt->execute([
        ':hid' => $harvMaizeId, ':iby' => $userId, ':moist' => 12.80, ':foreign' => 0.60, ':defect' => 0.90,
        ':brix' => null, ':cert' => 'standard', ':idate' => '2026-05-20',
        ':notes' => 'Food Reserve Agency (FRA) Grade 1 White Maize standard certified.'
    ]);
    $hqStmt->execute([
        ':hid' => $harvSoyaId, ':iby' => $userId, ':moist' => 11.50, ':foreign' => 0.80, ':defect' => 0.50,
        ':brix' => null, ':cert' => 'standard', ':idate' => '2026-04-26',
        ':notes' => 'Mount Meru Millers oilseed intake test: oil content 20.8%, protein 38.5%.'
    ]);

    // -------------------------------------------------------------
    // 13. Warehouses, Storage Batches & Dispatches
    // -------------------------------------------------------------
    echo "13. Seeding Warehouses, Storage Batches & Dispatches...\n";

    $whStmt = $pdo->prepare("INSERT INTO warehouses (farm_id, name, type, capacity_cubic_metres, current_temperature_c, current_humidity_pct, location_description, is_active)
        VALUES (:farm_id, :name, :type, :cap, :temp, :hum, :loc, 1)");

    $whStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Mkushi Commercial Steel Silo Complex', ':type' => 'silo',
        ':cap' => 12000.00, ':temp' => 19.50, ':hum' => 45.00,
        ':loc' => 'Dual 5,000MT steel silos with continuous aeration blowers and grain bucket elevator'
    ]);
    $wh1Id = (int)$pdo->lastInsertId();

    $whStmt->execute([
        ':farm_id' => $farm1Id, ':name' => 'Mkushi Central Bagged Crop Shed', ':type' => 'dry_shed',
        ':cap' => 2500.00, ':temp' => 21.00, ':hum' => 48.00,
        ':loc' => 'Ventilated concrete warehouse for bagged groundnuts and seed'
    ]);
    $wh2Id = (int)$pdo->lastInsertId();

    $whStmt->execute([
        ':farm_id' => $farm3Id, ':name' => 'Chisamba Cold Storage & Packhouse', ':type' => 'cold_storage',
        ':cap' => 600.00, ':temp' => 8.50, ':hum' => 85.00,
        ':loc' => 'Insulated packhouse with pre-cooling staging area for supermarket deliveries'
    ]);
    $wh3Id = (int)$pdo->lastInsertId();

    // Storage Batches
    $sbStmt = $pdo->prepare("INSERT INTO storage_batches (warehouse_id, harvest_id, crop_id, batch_code, quantity_stored_kg, quantity_remaining_kg, unit_cost_estimated, quality_grade, entry_date, status, spoilage_kg, notes)
        VALUES (:wh_id, :hid, :cid, :bcode, :qstored, :qrem, :ucost, 'A', :edate, :status, :spoil, :notes)");

    // Maize batch (Silo)
    $sbStmt->execute([
        ':wh_id' => $wh1Id, ':hid' => $harvMaizeId, ':cid' => $cropIds['White Maize'],
        ':bcode' => 'BATCH-MAZ-ZM-2026-01', ':qstored' => 685000.00, ':qrem' => 285000.00,
        ':ucost' => 4.20, ':edate' => '2026-05-19', ':status' => 'partially_dispatched', ':spoil' => 120.00,
        ':notes' => 'Bulk white grain in Silo Bin 1; treated with Actellic Gold dust.'
    ]);
    $batchMaizeId = (int)$pdo->lastInsertId();

    // Soya batch (Silo)
    $sbStmt->execute([
        ':wh_id' => $wh1Id, ':hid' => $harvSoyaId, ':cid' => $cropIds['Soya Beans'],
        ':bcode' => 'BATCH-SOYA-ZM-2026-01', ':qstored' => 158000.00, ':qrem' => 58000.00,
        ':ucost' => 7.80, ':edate' => '2026-04-25', ':status' => 'partially_dispatched', ':spoil' => 50.00,
        ':notes' => 'High-protein grain awaiting contracted mill extraction.'
    ]);
    $batchSoyaId = (int)$pdo->lastInsertId();

    // Groundnut batch (Warehouse)
    $sbStmt->execute([
        ':wh_id' => $wh2Id, ':hid' => $harvGroundnutId, ':cid' => $cropIds['Groundnuts'],
        ':bcode' => 'BATCH-GNUT-ZM-2026-01', ':qstored' => 92000.00, ':qrem' => 42000.00,
        ':ucost' => 14.50, ':edate' => '2026-05-06', ':status' => 'partially_dispatched', ':spoil' => 40.00,
        ':notes' => 'Bagged in 50kg branded polypropylene sacks.'
    ]);
    $batchGnutId = (int)$pdo->lastInsertId();

    // Storage movements
    $smovStmt = $pdo->prepare("INSERT INTO storage_movements (batch_id, recorded_by, movement_type, quantity_kg, notes)
        VALUES (:bid, :rby, :mtype, :qty, :notes)");

    $smovStmt->execute([':bid' => $batchMaizeId, ':rby' => $userId, ':mtype' => 'intake', ':qty' => 685000.00, ':notes' => 'Post-harvest silo intake']);
    $smovStmt->execute([':bid' => $batchMaizeId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 200000.00, ':notes' => 'Dispatched 200MT to National Milling Corporation Lusaka']);
    $smovStmt->execute([':bid' => $batchMaizeId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 200000.00, ':notes' => 'Dispatched 200MT to Food Reserve Agency (FRA) Strategic Reserve']);
    $smovStmt->execute([':bid' => $batchSoyaId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 100000.00, ':notes' => 'Dispatched 100MT to Mount Meru Millers Katuba Plant']);
    $smovStmt->execute([':bid' => $batchGnutId, ':rby' => $userId, ':mtype' => 'dispatch', ':qty' => 50000.00, ':notes' => 'Dispatched 50MT to Zambeef Products Retail Division']);

    // -------------------------------------------------------------
    // 14. Customers, Sales Orders, Invoices, Payments & Market Prices (Zambia)
    // -------------------------------------------------------------
    echo "14. Seeding Zambian Customers, Sales Orders, Invoices, Payments & Market Prices...\n";

    $customersData = [
        ['farm_id' => $farm1Id, 'name' => 'Food Reserve Agency (FRA)', 'type' => 'processor', 'contact' => 'Mwape Mwamba', 'phone' => '+260211252655', 'email' => 'tenders@fra.org.zm', 'addr' => 'Plot 1235, Lusaka National Silos', 'credit' => 2000000.00],
        ['farm_id' => $farm1Id, 'name' => 'National Milling Corporation Ltd', 'type' => 'processor', 'contact' => 'Brian Chilufya', 'phone' => '+260211244455', 'email' => 'grain@nmc.co.zm', 'addr' => 'Malambo Road, Industrial Area, Lusaka', 'credit' => 1500000.00],
        ['farm_id' => $farm1Id, 'name' => 'Mount Meru Millers Zambia Ltd', 'type' => 'processor', 'contact' => 'Rajesh Sharma', 'phone' => '+260971223344', 'email' => 'crushing@mountmeru.co.zm', 'addr' => 'Great North Road, Katuba', 'credit' => 1200000.00],
        ['farm_id' => $farm2Id, 'name' => 'Parmalat Zambia (Lactalis Group)', 'type' => 'processor', 'contact' => 'Catherine Lubinda', 'phone' => '+260211245678', 'email' => 'milk.intake@parmalat.co.zm', 'addr' => 'Heavy Industrial Area, Lusaka', 'credit' => 800000.00],
        ['farm_id' => $farm2Id, 'name' => 'Zambeef Products Plc', 'type' => 'processor', 'contact' => 'Felix Sichone', 'phone' => '+260211369000', 'email' => 'livestock@zambeef.com.zm', 'addr' => 'Huntley Farm, Chisamba / Lusaka HQ', 'credit' => 1500000.00],
        ['farm_id' => $farm3Id, 'name' => 'Shoprite Zambia Freshmark Depot', 'type' => 'supermarket', 'contact' => 'Agnes Kalunga', 'phone' => '+260211256789', 'email' => 'freshmark@shoprite.co.zm', 'addr' => 'Manda Hill / Cairo Road, Lusaka', 'credit' => 450000.00],
    ];

    $custStmt = $pdo->prepare("INSERT INTO customers (farm_id, name, type, contact_person, phone, email, address, credit_limit, is_active)
        VALUES (:farm_id, :name, :type, :contact, :phone, :email, :addr, :credit, 1)");

    $custIds = [];
    foreach ($customersData as $c) {
        $custStmt->execute($c);
        $custIds[$c['name']] = (int)$pdo->lastInsertId();
    }

    // Sales Orders, Items, Invoices, Payments, Dispatches
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

    // Order 1: 200MT White Maize to National Milling Corporation
    $soStmt->execute([
        ':farm_id' => $farm1Id, ':cid' => $custIds['National Milling Corporation Ltd'], ':cby' => $userId,
        ':onum' => 'SO-ZM-2026-001', ':odate' => '2026-06-10', ':ddate' => '2026-06-15',
        ':status' => 'delivered', ':tot' => 1160000.00, ':notes' => 'Commercial delivery of 200MT Grade 1 white maize in bulk'
    ]);
    $so1Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so1Id, ':itype' => 'crop', ':iname' => 'Commercial White Maize Grade 1', ':qty' => 200000.00, ':unit' => 'kg', ':price' => 5.80, ':tot' => 1160000.00]);

    $invcStmt->execute([
        ':oid' => $so1Id, ':cid' => $custIds['National Milling Corporation Ltd'],
        ':inum' => 'INV-ZM-2026-001', ':idate' => '2026-06-15', ':ddate' => '2026-07-15',
        ':sub' => 1160000.00, ':tax' => 0.00, ':tot' => 1160000.00, ':paid' => 1160000.00,
        ':status' => 'paid', ':notes' => 'Zero-rated agricultural grain produce'
    ]);
    $inv1Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv1Id, ':cid' => $custIds['National Milling Corporation Ltd'], ':rby' => $userId,
        ':amt' => 1160000.00, ':method' => 'bank_transfer', ':pdate' => '2026-06-28',
        ':ref' => 'ZANACO-EFT-889921', ':notes' => 'Full payment through Zanaco Bank Zambia'
    ]);

    $dispStmt->execute([
        ':bid' => $batchMaizeId, ':oid' => $so1Id, ':dby' => $userId,
        ':qty' => 200000.00, ':dest' => 'National Milling Silos Malambo Road',
        ':vreg' => 'ALB 4492 / T 881', ':dname' => 'Webster Lungu',
        ':ddate' => '2026-06-15', ':notes' => 'Weighbridge slip #WB-09941 attached'
    ]);

    // Order 2: 100MT Soya Beans to Mount Meru Millers
    $soStmt->execute([
        ':farm_id' => $farm1Id, ':cid' => $custIds['Mount Meru Millers Zambia Ltd'], ':cby' => $userId,
        ':onum' => 'SO-ZM-2026-002', ':odate' => '2026-07-02', ':ddate' => '2026-07-08',
        ':status' => 'delivered', ':tot' => 1120000.00, ':notes' => 'High protein oilseed soya delivery'
    ]);
    $so2Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so2Id, ':itype' => 'crop', ':iname' => 'Commercial Soya Beans Grade A', ':qty' => 100000.00, ':unit' => 'kg', ':price' => 11.20, ':tot' => 1120000.00]);

    $invcStmt->execute([
        ':oid' => $so2Id, ':cid' => $custIds['Mount Meru Millers Zambia Ltd'],
        ':inum' => 'INV-ZM-2026-002', ':idate' => '2026-07-08', ':ddate' => '2026-08-08',
        ':sub' => 1120000.00, ':tax' => 0.00, ':tot' => 1120000.00, ':paid' => 1120000.00,
        ':status' => 'paid', ':notes' => 'Settled in full'
    ]);
    $inv2Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv2Id, ':cid' => $custIds['Mount Meru Millers Zambia Ltd'], ':rby' => $userId,
        ':amt' => 1120000.00, ':method' => 'bank_transfer', ':pdate' => '2026-07-20',
        ':ref' => 'STANCHART-ZM-5544', ':notes' => 'Standard Chartered Bank transfer'
    ]);

    $dispStmt->execute([
        ':bid' => $batchSoyaId, ':oid' => $so2Id, ':dby' => $userId,
        ':qty' => 100000.00, ':dest' => 'Mount Meru Extraction Plant Katuba',
        ':vreg' => 'BAH 3381 / T 902', ':dname' => 'Kennedy Mumba',
        ':ddate' => '2026-07-08', ':notes' => 'Delivered in 3 interlink super-link tippers'
    ]);

    // Order 3: 200MT White Maize to Food Reserve Agency (FRA)
    $soStmt->execute([
        ':farm_id' => $farm1Id, ':cid' => $custIds['Food Reserve Agency (FRA)'], ':cby' => $userId,
        ':onum' => 'SO-ZM-2026-003', ':odate' => '2026-08-12', ':ddate' => '2026-08-20',
        ':status' => 'delivered', ':tot' => 1320000.00, ':notes' => 'Contracted national strategic food grain delivery'
    ]);
    $so3Id = (int)$pdo->lastInsertId();

    $soItemStmt->execute([':oid' => $so3Id, ':itype' => 'crop', ':iname' => 'FRA Grade 1 White Maize Reserve', ':qty' => 200000.00, ':unit' => 'kg', ':price' => 6.60, ':tot' => 1320000.00]);

    $invcStmt->execute([
        ':oid' => $so3Id, ':cid' => $custIds['Food Reserve Agency (FRA)'],
        ':inum' => 'INV-ZM-2026-003', ':idate' => '2026-08-20', ':ddate' => '2026-09-20',
        ':sub' => 1320000.00, ':tax' => 0.00, ':tot' => 1320000.00, ':paid' => 1000000.00,
        ':status' => 'partially_paid', ':notes' => 'Initial tranche paid; balance in 14 days'
    ]);
    $inv3Id = (int)$pdo->lastInsertId();

    $payStmt->execute([
        ':iid' => $inv3Id, ':cid' => $custIds['Food Reserve Agency (FRA)'], ':rby' => $userId,
        ':amt' => 1000000.00, ':method' => 'bank_transfer', ':pdate' => '2026-09-02',
        ':ref' => 'BOZ-FRA-PAY-00918', ':notes' => 'Bank of Zambia settlement account'
    ]);

    $dispStmt->execute([
        ':bid' => $batchMaizeId, ':oid' => $so3Id, ':dby' => $userId,
        ':qty' => 200000.00, ':dest' => 'FRA Regional Silos Mkushi Depot',
        ':vreg' => 'BLC 9901 / T 114', ':dname' => 'Collins Sitali',
        ':ddate' => '2026-08-20', ':notes' => 'FRA Official Intake Certificate #FRA-MKU-881'
    ]);

    // Market Prices (Zambian Commodity Markets & Exchanges)
    $mpData = [
        ['White Maize (50kg bag)', 'Lusaka Grain Market (Soweto)', 330.00, 'bag', 'rising'],
        ['White Maize (Commercial MT)', 'Zambia Commodity Exchange (ZAMACE)', 6600.00, 'tonne', 'rising'],
        ['Soya Beans (Commercial MT)', 'ZAMACE Lusaka Central', 11400.00, 'tonne', 'stable'],
        ['Winter Wheat (Commercial MT)', 'Millers Association of Zambia', 9800.00, 'tonne', 'rising'],
        ['Raw Chilled Milk', 'Dairy Association of Zambia (Mazabuka)', 11.50, 'litre', 'stable'],
        ['Beef Carcass (Choice Grade)', 'Zambeef Lusaka Abattoir', 65.00, 'kg', 'rising'],
        ['Beef Tomato (10kg crate)', 'Soweto Wholesale Market Lusaka', 180.00, 'crate', 'falling'],
        ['Luangwa Groundnuts (50kg bag)', 'Lusaka Commercial Trading Mart', 850.00, 'bag', 'rising'],
    ];

    $mpStmt = $pdo->prepare("INSERT INTO market_prices (commodity_name, market_location, price_per_unit, unit, recorded_date, source, trend)
        VALUES (:cname, :loc, :price, :unit, :rdate, 'Zambia Commodity Exchange (ZAMACE) / CSO', :trend)");

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
    // 15. Finances: Income, Expenses, Budgets, Loans (in Zambian Kwacha ZMW)
    // -------------------------------------------------------------
    echo "15. Seeding Zambian Kwacha (ZMW) Financial Income, Expense Records, Budgets, and Loans...\n";

    $incStmt = $pdo->prepare("INSERT INTO income_records (farm_id, recorded_by, category, amount, date_received, payment_method, payer_name, description)
        VALUES (:farm_id, :rby, :cat, :amt, :drec, :method, :payer, :desc)");

    $expStmt = $pdo->prepare("INSERT INTO expense_records (farm_id, recorded_by, category, amount, date_incurred, payment_method, vendor_name, description)
        VALUES (:farm_id, :rby, :cat, :amt, :dinc, :method, :vendor, :desc)");

    // Historical monthly income entries (2026)
    $monthlyIncomeData = [
        ['month' => '2026-02-28', 'cat' => 'byproducts', 'amt' => 78000.00, 'farm' => $farm2Id, 'payer' => 'Parmalat Zambia', 'desc' => 'February bulk chilled milk payout from Mazabuka dairy'],
        ['month' => '2026-03-31', 'cat' => 'byproducts', 'amt' => 84000.00, 'farm' => $farm2Id, 'payer' => 'Parmalat Zambia', 'desc' => 'March commercial milk deliveries'],
        ['month' => '2026-04-30', 'cat' => 'byproducts', 'amt' => 86500.00, 'farm' => $farm2Id, 'payer' => 'Parmalat Zambia', 'desc' => 'April commercial milk deliveries'],
        ['month' => '2026-05-15', 'cat' => 'crop_sales', 'amt' => 620000.00, 'farm' => $farm1Id, 'payer' => 'Mount Meru Millers', 'desc' => 'Advance deposit for 2026 soya bean harvest'],
        ['month' => '2026-06-28', 'cat' => 'crop_sales', 'amt' => 1160000.00, 'farm' => $farm1Id, 'payer' => 'National Milling Corporation', 'desc' => 'Full settlement for 200MT commercial white maize'],
        ['month' => '2026-07-20', 'cat' => 'crop_sales', 'amt' => 1120000.00, 'farm' => $farm1Id, 'payer' => 'Mount Meru Millers', 'desc' => 'Balance settlement for 100MT commercial soya beans'],
        ['month' => '2026-08-15', 'cat' => 'crop_sales', 'amt' => 125000.00, 'farm' => $farm3Id, 'payer' => 'Shoprite Freshmark', 'desc' => 'Fortnightly fresh beef tomato & sweet pepper supply'],
        ['month' => '2026-09-02', 'cat' => 'crop_sales', 'amt' => 1000000.00, 'farm' => $farm1Id, 'payer' => 'Food Reserve Agency (FRA)', 'desc' => 'First tranche payment for national strategic maize reserve'],
        ['month' => '2026-09-25', 'cat' => 'livestock_sales', 'amt' => 95000.00, 'farm' => $farm2Id, 'payer' => 'Zambeef Products Plc', 'desc' => 'Sale of 3 culled Boran bulls and finished steers'],
    ];

    foreach ($monthlyIncomeData as $inc) {
        $incStmt->execute([
            ':farm_id' => $inc['farm'],
            ':rby' => $userId,
            ':cat' => $inc['cat'],
            ':amt' => $inc['amt'],
            ':drec' => $inc['month'],
            ':method' => 'bank_transfer',
            ':payer' => $inc['payer'],
            ':desc' => $inc['desc']
        ]);
    }

    // Historical monthly expenses (2026)
    $monthlyExpenseData = [
        ['month' => '2026-01-15', 'cat' => 'fertilizers', 'amt' => 285000.00, 'farm' => $farm1Id, 'vendor' => 'Nitrogen Chemicals of Zambia', 'desc' => 'Urea top dressing procurement for Mkushi maize block'],
        ['month' => '2026-02-20', 'cat' => 'fuel', 'amt' => 145000.00, 'farm' => $farm1Id, 'vendor' => 'TotalEnergies Marketing Zambia', 'desc' => 'Bulk diesel delivery for fleet cultivation & spraying'],
        ['month' => '2026-03-31', 'cat' => 'labour_wages', 'amt' => 64000.00, 'farm' => $farm1Id, 'vendor' => 'Farm Payroll Staff', 'desc' => 'March labour and supervisor payroll'],
        ['month' => '2026-04-10', 'cat' => 'machinery_repairs', 'amt' => 48000.00, 'farm' => $farm1Id, 'vendor' => 'AFGRI Equipment Zambia', 'desc' => 'Combine harvester pre-season servicing and belt replacements'],
        ['month' => '2026-05-18', 'cat' => 'seeds', 'amt' => 125000.00, 'farm' => $farm1Id, 'vendor' => 'Zamseed Zambia', 'desc' => 'Winter wheat certified seed procurement for pivot'],
        ['month' => '2026-06-25', 'cat' => 'animal_feed', 'amt' => 52000.00, 'farm' => $farm2Id, 'vendor' => 'Tiger Feeds Zambia', 'desc' => 'Monthly dairy concentrate meal delivery in Mazabuka'],
        ['month' => '2026-07-31', 'cat' => 'labour_wages', 'amt' => 68000.00, 'farm' => $farm2Id, 'vendor' => 'Farm Payroll Staff', 'desc' => 'July staff wages across dairy and pasture units'],
        ['month' => '2026-08-10', 'cat' => 'fuel', 'amt' => 165000.00, 'farm' => $farm1Id, 'vendor' => 'TotalEnergies Marketing Zambia', 'desc' => 'Tractor fuel refill for early tillage and discing'],
        ['month' => '2026-08-31', 'cat' => 'labour_wages', 'amt' => 72000.00, 'farm' => $farm1Id, 'vendor' => 'Farm Payroll Staff', 'desc' => 'August harvest staff wages and overtime'],
        ['month' => '2026-09-12', 'cat' => 'chemicals', 'amt' => 38000.00, 'farm' => $farm3Id, 'vendor' => 'Arysta LifeScience Zambia', 'desc' => 'Greenhouse protectant fungicides and soluble foliar feeds'],
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

    // Budgets for 2026 (ZMW)
    $budgStmt = $pdo->prepare("INSERT INTO budgets (farm_id, created_by, fiscal_year, period_name, category, budgeted_amount, actual_amount, notes)
        VALUES (:farm_id, :cby, 2026, 'Annual', :cat, :bamt, :aamt, :notes)");

    $budgStmt->execute([':farm_id' => $farm1Id, ':cby' => $userId, ':cat' => 'Fertilizers & Soil Amendments', ':bamt' => 650000.00, ':aamt' => 480000.00, ':notes' => 'Annual basal and top dressing budget for Mkushi cereal block']);
    $budgStmt->execute([':farm_id' => $farm1Id, ':cby' => $userId, ':cat' => 'Fuel & Fleet Energy', ':bamt' => 550000.00, ':aamt' => 395000.00, ':notes' => 'Bulk diesel for tractors, combine, and transport']);
    $budgStmt->execute([':farm_id' => $farm1Id, ':cby' => $userId, ':cat' => 'Labour & Staff Wages', ':bamt' => 420000.00, ':aamt' => 310000.00, ':notes' => 'Permanent staff and seasonal planting/harvest pickers']);
    $budgStmt->execute([':farm_id' => $farm2Id, ':cby' => $userId, ':cat' => 'Animal Feed & Nutrition', ':bamt' => 380000.00, ':aamt' => 260000.00, ':notes' => 'Dairy meal concentrates and mineral supplements']);
    $budgStmt->execute([':farm_id' => $farm3Id, ':cby' => $userId, ':cat' => 'Greenhouse Inputs & Packhouse', ':bamt' => 180000.00, ':aamt' => 125000.00, ':notes' => 'Seeds, soluble fertigation, and crates']);

    // Loans (ZANACO Agribusiness / Development Bank of Zambia)
    $loanStmt = $pdo->prepare("INSERT INTO loans (farm_id, recorded_by, lender_name, principal_amount, interest_rate_pct, loan_term_months, start_date, end_date, monthly_payment, balance_remaining, status, notes)
        VALUES (:farm_id, :rby, :lender, :prin, :rate, :term, :sdate, :edate, :mpay, :bal, 'active', :notes)");

    $loanStmt->execute([
        ':farm_id' => $farm1Id, ':rby' => $userId,
        ':lender' => 'Zambia National Commercial Bank (ZANACO Agri-Finance)',
        ':prin' => 2500000.00, ':rate' => 14.50, ':term' => 60,
        ':sdate' => '2024-01-01', ':edate' => '2028-12-31',
        ':mpay' => 58800.00, ':bal' => 1650000.00,
        ':notes' => 'Asset finance facility for Claas combine harvester and center pivot irrigation rig'
    ]);
    $loanStmt->execute([
        ':farm_id' => $farm2Id, ':rby' => $userId,
        ':lender' => 'Development Bank of Zambia (DBZ) Livestock Facility',
        ':prin' => 800000.00, ':rate' => 12.00, ':term' => 36,
        ':sdate' => '2024-06-01', ':edate' => '2027-05-31',
        ':mpay' => 26500.00, ':bal' => 480000.00,
        ':notes' => 'Dairy infrastructure development loan for DeLaval parlour upgrade'
    ]);

    // -------------------------------------------------------------
    // 16. Suppliers, Quotations & Purchase Orders (Zambian Agri-Dealers)
    // -------------------------------------------------------------
    echo "16. Seeding Zambian Suppliers, Quotations, and Purchase Orders...\n";

    $suppliersData = [
        ['farm_id' => $farm1Id, 'name' => 'Nitrogen Chemicals of Zambia (NCZ)', 'category' => 'fertilizers', 'contact' => 'Chanda Musonda', 'phone' => '+260211273000', 'email' => 'sales@ncz.co.zm', 'addr' => 'Kafue Industrial Estate, Kafue', 'rating' => 4.80, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'Omnia Fertilizer Zambia Ltd', 'category' => 'fertilizers', 'contact' => 'David Van der Merwe', 'phone' => '+260211242333', 'email' => 'orders@omnia.co.zm', 'addr' => 'Plot 5032, Great North Road, Lusaka', 'rating' => 4.90, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'Seed Co Zambia Ltd', 'category' => 'seeds', 'contact' => 'Grace Mwansa', 'phone' => '+260211272000', 'email' => 'commercial@seedco.co.zm', 'addr' => 'Seed Co Complex, Lusaka West', 'rating' => 4.95, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'TotalEnergies Marketing Zambia Plc', 'category' => 'fuel', 'contact' => 'Bwalya Kangwa', 'phone' => '+260211228800', 'email' => 'commercial@totalenergies.co.zm', 'addr' => 'Kafue Road, Lusaka', 'rating' => 4.90, 'terms' => 30],
        ['farm_id' => $farm1Id, 'name' => 'AFGRI Equipment Zambia', 'category' => 'machinery', 'contact' => 'Johan Pretorius', 'phone' => '+260211273400', 'email' => 'machinery@afgri.co.zm', 'addr' => 'Kafue Road Depot, Lusaka', 'rating' => 4.85, 'terms' => 30],
        ['farm_id' => $farm2Id, 'name' => 'Tiger Feeds Zambia Ltd', 'category' => 'feed', 'contact' => 'Brian Lubasi', 'phone' => '+260211246600', 'email' => 'sales@tigerfeeds.co.zm', 'addr' => 'Industrial Area, Lusaka', 'rating' => 4.80, 'terms' => 15],
        ['farm_id' => $farm3Id, 'name' => 'SARO Agro Industrial Ltd', 'category' => 'machinery', 'contact' => 'Satish Patel', 'phone' => '+260211241477', 'email' => 'saro@saroagri.co.zm', 'addr' => 'Buyantanshi Road, Heavy Industrial, Lusaka', 'rating' => 4.75, 'terms' => 30],
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
        ':sid' => $suppIds['Omnia Fertilizer Zambia Ltd'], ':farm_id' => $farm1Id,
        ':desc' => 'Urea 46% Granular Top Dressing 50kg bag',
        ':price' => 890.00, ':unit' => 'bag', ':valid' => date('Y-m-d', strtotime('+45 days')),
        ':notes' => 'Early pre-season booking rate for bulk orders over 200 bags'
    ]);
    $quotStmt->execute([
        ':sid' => $suppIds['TotalEnergies Marketing Zambia Plc'], ':farm_id' => $farm1Id,
        ':desc' => 'Bulk Low Sulfur Automotive Diesel Delivery',
        ':price' => 27.80, ':unit' => 'litre', ':valid' => date('Y-m-d', strtotime('+30 days')),
        ':notes' => 'Direct depot delivery into farm tanker in Mkushi block'
    ]);

    // Purchase Orders
    $poStmt = $pdo->prepare("INSERT INTO purchase_orders (farm_id, supplier_id, created_by, approved_by, po_number, order_date, expected_delivery_date, status, total_amount, notes)
        VALUES (:farm_id, :sid, :cby, :aby, :ponum, :odate, :edate, :status, :tot, :notes)");

    $poItemStmt = $pdo->prepare("INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit, unit_price, total_price)
        VALUES (:poid, :desc, :qty, :unit, :uprice, :tot)");

    $poStmt->execute([
        ':farm_id' => $farm1Id, ':sid' => $suppIds['Omnia Fertilizer Zambia Ltd'], ':cby' => $userId, ':aby' => $userId,
        ':ponum' => 'PO-ZM-2026-001', ':odate' => '2026-08-15', ':edate' => '2026-08-20',
        ':status' => 'received', ':tot' => 178000.00, ':notes' => '200 bags bulk urea delivery'
    ]);
    $po1Id = (int)$pdo->lastInsertId();

    $poItemStmt->execute([':poid' => $po1Id, ':desc' => 'Urea 46% Granular Top Dressing (50kg)', ':qty' => 200.00, ':unit' => 'bags', ':uprice' => 890.00, ':tot' => 178000.00]);

    $poStmt->execute([
        ':farm_id' => $farm1Id, ':sid' => $suppIds['TotalEnergies Marketing Zambia Plc'], ':cby' => $userId, ':aby' => $userId,
        ':ponum' => 'PO-ZM-2026-002', ':odate' => '2026-09-05', ':edate' => '2026-09-08',
        ':status' => 'received', ':tot' => 139000.00, ':notes' => '5,000 litres bulk diesel for tractor discing'
    ]);
    $po2Id = (int)$pdo->lastInsertId();

    $poItemStmt->execute([':poid' => $po2Id, ':desc' => 'Commercial Automotive Gasoil (Diesel)', ':qty' => 5000.00, ':unit' => 'litres', ':uprice' => 27.80, ':tot' => 139000.00]);

    // -------------------------------------------------------------
    // 17. Operational Alerts & Notifications (Zambia-localized)
    // -------------------------------------------------------------
    echo "17. Seeding Real-time System Alerts & Notifications...\n";

    $altStmt = $pdo->prepare("INSERT INTO alerts (farm_id, user_id, alert_type, title, message, severity, is_read, is_dismissed)
        VALUES (:farm_id, :uid, :atype, :title, :msg, :sev, 0, 0)");

    $notifStmt = $pdo->prepare("INSERT INTO notification_logs (alert_id, channel, status) VALUES (:aid, 'in_app', 'sent')");

    $alertsData = [
        ['farm_id' => $farm1Id, 'type' => 'inventory_low', 'title' => 'Low Stock Warning: Urea 46% Fertilizer', 'msg' => 'Remaining quantity is 18 bags in Mkushi Shed 1, which is below the threshold of 40 bags ahead of summer planting.', 'sev' => 'warning'],
        ['farm_id' => $farm1Id, 'type' => 'maintenance_due', 'title' => 'Maintenance Due: John Deere 7200R Heavy Tractor', 'msg' => 'Operating meter hours reached 2,340 hrs. 2,350 hr engine oil, fuel filters and hydraulic check is due before land preparation.', 'sev' => 'warning'],
        ['farm_id' => $farm1Id, 'type' => 'weather_risk', 'title' => 'Weather Alert: Intense Heatwave & Dry Spell in Central Province', 'msg' => 'Peak temperatures exceeding 34°C forecast by Zambia Met Dept in Mkushi farming block. Irrigation scheduled for night hours.', 'sev' => 'critical'],
        ['farm_id' => $farm2Id, 'type' => 'vaccination_due', 'title' => 'Livestock Reminder: FMD Booster Due in Southern Province', 'msg' => 'Biannual Foot & Mouth booster inoculation scheduled for Mazabuka dairy herd in December 2026 under CVRI protocols.', 'sev' => 'info'],
        ['farm_id' => $farm1Id, 'type' => 'pest_outbreak', 'title' => 'Scouting Alert: Fall Armyworm in Mkushi Maize Block B1', 'msg' => 'Moderate larval incidence observed. Ampligo 150 ZC boom spraying executed with 98% larval mortality.', 'sev' => 'warning'],
        ['farm_id' => $farm1Id, 'type' => 'loan_payment_due', 'title' => 'Loan Notice: ZANACO Agri-Finance Combine Facility', 'msg' => 'Monthly installment of ZMW 58,800 is due on October 1st, 2026.', 'sev' => 'info'],
        ['farm_id' => $farm3Id, 'type' => 'harvest_due', 'title' => 'Harvest Window: Anna F1 Greenhouse Tomatoes Peak Ripening', 'msg' => 'Flushes in Chisamba Tunnels 1-4 ready for morning harvest to fulfill Shoprite Freshmark weekly delivery.', 'sev' => 'info'],
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
    echo "\n>>> Zambia-localized database seeding completed successfully! All transactions committed.\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "\n[ERROR] Seeding failed: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . " in " . $e->getFile() . "\n";
    exit(1);
} finally {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
}
