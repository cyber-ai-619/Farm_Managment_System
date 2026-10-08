-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: farm_management
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
INSERT INTO `alerts` VALUES (20,7,5,'inventory_low','Low Stock Warning: Urea 46% Fertilizer','Remaining quantity is 18 bags in Mkushi Shed 1, which is below the threshold of 40 bags ahead of summer planting.','warning',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(21,7,5,'maintenance_due','Maintenance Due: John Deere 7200R Heavy Tractor','Operating meter hours reached 2,340 hrs. 2,350 hr engine oil, fuel filters and hydraulic check is due before land preparation.','warning',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,7,5,'weather_risk','Weather Alert: Intense Heatwave & Dry Spell in Central Province','Peak temperatures exceeding 34°C forecast by Zambia Met Dept in Mkushi farming block. Irrigation scheduled for night hours.','critical',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(23,8,5,'vaccination_due','Livestock Reminder: FMD Booster Due in Southern Province','Biannual Foot & Mouth booster inoculation scheduled for Mazabuka dairy herd in December 2026 under CVRI protocols.','info',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(24,7,5,'pest_outbreak','Scouting Alert: Fall Armyworm in Mkushi Maize Block B1','Moderate larval incidence observed. Ampligo 150 ZC boom spraying executed with 98% larval mortality.','warning',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(25,7,5,'loan_payment_due','Loan Notice: ZANACO Agri-Finance Combine Facility','Monthly installment of ZMW 58,800 is due on October 1st, 2026.','info',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(26,9,5,'harvest_due','Harvest Window: Anna F1 Greenhouse Tomatoes Peak Ripening','Flushes in Chisamba Tunnels 1-4 ready for morning harvest to fulfill Shoprite Freshmark weekly delivery.','info',0,0,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `animals`
--

LOCK TABLES `animals` WRITE;
/*!40000 ALTER TABLE `animals` DISABLE KEYS */;
INSERT INTO `animals` VALUES (1,2,1,'COW-101','Daisy','cattle','female',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,'2026-09-17 19:11:13','2026-09-17 19:11:13'),(24,8,2,'ZM-HF-001','Kafue Star','cattle','female','2022-03-10',NULL,NULL,640.00,35000.00,'2024-02-10','Zambeef Dairy Breeding Stock','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(25,8,2,'ZM-HF-002','Mazabuka Queen','cattle','female','2022-06-18',NULL,NULL,610.00,34000.00,'2024-02-10','Mazabuka Dairy Breeders','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(26,8,2,'ZM-HF-003','Chirundu Bella','cattle','female','2023-01-14',NULL,NULL,580.00,32000.00,'2024-02-10','Mazabuka Dairy Breeders','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(27,8,2,'ZM-HF-004','Victoria Daisy','cattle','female','2023-04-05',NULL,NULL,550.00,30000.00,'2024-02-10','Zambeef Dairy Breeding Stock','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(28,8,2,'ZM-HF-BULL-1','Titan Mazabuka','cattle','male','2021-09-12',NULL,NULL,920.00,55000.00,'2024-02-10','Batoka Artificial Insemination Stud','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(29,8,4,'ZM-BOR-101','Luangwa Bull','cattle','male','2021-05-15',NULL,NULL,780.00,38000.00,'2024-02-10','Kaleya Commercial Ranches','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(30,8,4,'ZM-BOR-102','Zambezi Rose','cattle','female','2022-08-20',NULL,NULL,540.00,26000.00,'2024-02-10','Kaleya Commercial Ranches','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(31,8,9,'ZM-BRH-201','Kalomo King','cattle','male','2022-01-10',NULL,NULL,840.00,45000.00,'2024-02-10','Southern Ranches Monze','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(32,7,10,'ZM-MSH-301','Muchinga Brave','cattle','female','2022-10-12',NULL,NULL,460.00,18000.00,'2024-02-10','Central Province Livestock Cooperative','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(33,7,5,'ZM-BG-401','Mkushi Ram','goat','male','2023-04-18',NULL,NULL,90.00,6500.00,'2024-02-10','Golden Valley Research Trust (GART)','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(34,7,5,'ZM-BG-402','Kabwe Doe','goat','female','2023-05-22',NULL,NULL,65.00,5200.00,'2024-02-10','Golden Valley Research Trust (GART)','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(35,7,7,'ZM-DP-501','Choma Ewe','sheep','female','2023-03-30',NULL,NULL,62.00,4800.00,'2024-02-10','Batoka Research Station','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(36,7,7,'ZM-DP-502','Gwembe Ram','sheep','male','2023-02-14',NULL,NULL,82.00,5800.00,'2024-02-10','Batoka Research Station','active','Registered commercial breeding & production stock in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `animals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'user.registered','users',1,'::1','Thunder Client (https://www.thunderclient.com)','2026-09-01 09:14:52'),(2,NULL,'user.login',NULL,NULL,'::1','Thunder Client (https://www.thunderclient.com)','2026-09-01 09:17:06'),(3,NULL,'user.login',NULL,NULL,'::1','Thunder Client (https://www.thunderclient.com)','2026-09-01 09:19:12'),(4,NULL,'user.login',NULL,NULL,'::1','Thunder Client (https://www.thunderclient.com)','2026-09-08 14:50:18'),(5,2,'user.registered','users',2,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:00:44'),(6,3,'user.registered','users',3,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:11:13'),(7,2,'user.login',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:16:31'),(8,2,'irrigation.source_created','water_sources',1,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:16:31'),(9,2,'equipment.created','equipment',1,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:16:32'),(10,2,'labour.worker_created','workers',1,'::1','Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-US) PowerShell/7.6.6','2026-09-17 19:16:32'),(11,NULL,'user.registered','users',4,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','2026-09-17 19:44:08'),(12,NULL,'user.logout',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','2026-09-17 19:57:57'),(13,5,'user.registered','users',5,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-09-30 06:32:28'),(14,5,'user.login',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-09-30 06:56:17'),(15,5,'user.login',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-10-01 18:55:03'),(16,5,'user.login',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','2026-10-08 06:16:48'),(17,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:20:25'),(18,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:20:52'),(19,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:23:22'),(20,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:33:49'),(21,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:35:17'),(22,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:39:00'),(23,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:39:06'),(24,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 06:39:25'),(25,5,'user.login',NULL,NULL,'127.0.0.1',NULL,'2026-10-08 08:37:13'),(26,5,'user.login',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-08 09:32:59'),(27,5,'weather.observation_logged','weather_observations',63,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-08 10:28:51');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `breeding_records`
--

LOCK TABLES `breeding_records` WRITE;
/*!40000 ALTER TABLE `breeding_records` DISABLE KEYS */;
INSERT INTO `breeding_records` VALUES (1,24,28,5,'2025-08-10','2026-05-18','2026-05-20',1,'successful','Healthy female Holstein dairy calf born, weight 41kg at birth.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(2,30,29,5,'2026-02-15','2026-11-25',NULL,0,'pending','Ultrasound pregnancy diagnosis confirmed positive at 60 days.','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `breeding_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `breeds`
--

LOCK TABLES `breeds` WRITE;
/*!40000 ALTER TABLE `breeds` DISABLE KEYS */;
INSERT INTO `breeds` VALUES (1,'Ayrshire','cattle','High yield dairy breed','2026-09-17 19:11:13'),(2,'Holstein Friesian','cattle','World premier dairy breed producing high volume milk','2026-09-30 10:42:54'),(3,'Ayrshire Commercial','cattle','Hardy dairy breed with rich butterfat milk content','2026-09-30 10:42:54'),(4,'Boran','cattle','Indigenous East African beef breed, highly tick and heat tolerant','2026-09-30 10:42:54'),(5,'Boer Goat','goat','Fast-growing meat goat with muscular conformation','2026-09-30 10:42:54'),(6,'Saanen Dairy Goat','goat','Top milk producing dairy goat breed','2026-09-30 10:42:54'),(7,'Dorper','sheep','Hardy mutton sheep with rapid lamb growth rates','2026-09-30 10:42:54'),(8,'Kuroiler Poultry','poultry','Dual-purpose high egg laying and meat chicken','2026-09-30 10:42:54'),(9,'Brahman Commercial','cattle','Heavy beef breed widely ranched across Central and Southern Provinces','2026-10-08 10:51:59'),(10,'Mashona (Angoni/Tonga)','cattle','Indigenous Zambian hardy cattle with high fertility and disease resilience','2026-10-08 10:51:59'),(11,'Black Australorp','poultry','Dual-purpose high egg laying and resilient free-range chicken','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `breeds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (9,7,5,2026,'Annual','Fertilizers & Soil Amendments',650000.00,480000.00,'Annual basal and top dressing budget for Mkushi cereal block','2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,7,5,2026,'Annual','Fuel & Fleet Energy',550000.00,395000.00,'Bulk diesel for tractors, combine, and transport','2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,7,5,2026,'Annual','Labour & Staff Wages',420000.00,310000.00,'Permanent staff and seasonal planting/harvest pickers','2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,8,5,2026,'Annual','Animal Feed & Nutrition',380000.00,260000.00,'Dairy meal concentrates and mineral supplements','2026-10-08 10:51:59','2026-10-08 10:51:59'),(13,9,5,2026,'Annual','Greenhouse Inputs & Packhouse',180000.00,125000.00,'Seeds, soluble fertigation, and crates','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `crop_varieties`
--

LOCK TABLES `crop_varieties` WRITE;
/*!40000 ALTER TABLE `crop_varieties` DISABLE KEYS */;
INSERT INTO `crop_varieties` VALUES (1,2,'DKC 80-33 Hybrid',135,'53,000 plants/ha',75.00,25.00,9.50,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(2,2,'SC Simba 61',140,'50,000 plants/ha',75.00,25.00,8.80,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(3,1,'Kenya Robin',110,'120 kg/ha seed',20.00,5.00,4.50,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(4,3,'Batian',270,'2,500 trees/ha',200.00,200.00,5.00,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(5,3,'Ruiru 11',270,'3,000 trees/ha',200.00,150.00,4.80,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(6,4,'Hass Grafted G6',240,'400 trees/ha',500.00,500.00,15.00,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(7,5,'Anna F1 Indeterminate',75,'30,000 plants/ha',60.00,45.00,45.00,NULL,'2026-09-30 10:42:54','2026-09-30 10:42:54'),(8,8,'Seed Co SC 719 Hybrid',145,'52,000 plants/ha',75.00,25.00,10.50,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,8,'Pannar PAN 53',135,'54,000 plants/ha',75.00,24.00,9.80,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,8,'Zamseed ZMS 606',130,'50,000 plants/ha',75.00,25.00,8.50,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,9,'MRI Safari Soya',115,'350,000 plants/ha',45.00,6.00,3.60,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,10,'Nduna Irrigated Wheat',115,'125 kg/ha seed',18.00,4.00,7.20,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(13,11,'Luangwa Confectionery',120,'110,000 plants/ha',60.00,15.00,2.40,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(14,6,'Commander F1 Sweet Pepper',85,'32,000 plants/ha',60.00,40.00,35.00,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(15,12,'Zambia Queen Paprika',130,'40,000 plants/ha',70.00,35.00,4.20,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `crop_varieties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
INSERT INTO `crops` VALUES (1,'Wheat','Triticum','',NULL,'2026-09-17 19:11:13','2026-09-17 19:11:13'),(2,'maize','','',NULL,'2026-09-30 06:34:24','2026-09-30 06:34:24'),(3,'Arabica Coffee','Coffea arabica','fruit','Premium high-altitude Arabica coffee','2026-09-30 10:42:53','2026-09-30 10:42:53'),(4,'Hass Avocado','Persea americana','fruit','Export-grade Hass avocado trees','2026-09-30 10:42:53','2026-09-30 10:42:53'),(5,'Beef Tomato','Solanum lycopersicum','vegetable','Greenhouse large beefsteak tomatoes','2026-09-30 10:42:53','2026-09-30 10:42:53'),(6,'Sweet Pepper','Capsicum annuum','vegetable','Coloured bell peppers for fresh market','2026-09-30 10:42:53','2026-09-30 10:42:53'),(7,'Rhodes Grass','Chloris gayana','fodder','Nutritious pasture and hay forage','2026-09-30 10:42:53','2026-09-30 10:42:53'),(8,'White Maize','Zea mays','cereal','Zambian national staple grain and animal feed','2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,'Soya Beans','Glycine max','legume','Commercial oilseed and high-protein cake staple','2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,'Winter Wheat','Triticum aestivum','cereal','Irrigated winter commercial wheat for local flour mills','2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,'Groundnuts','Arachis hypogaea','legume','High-yield confectionery groundnuts (Chalimbana & Luangwa)','2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,'Paprika','Capsicum annuum var. longum','vegetable','Export-grade dry red paprika and chili','2026-10-08 10:51:59','2026-10-08 10:51:59'),(13,'Sunflower','Helianthus annuus','oilseed','Drought-tolerant cooking oilseed crop','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (9,7,'Food Reserve Agency (FRA)','processor','Mwape Mwamba','+260211252655','tenders@fra.org.zm','Plot 1235, Lusaka National Silos',NULL,2000000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,7,'National Milling Corporation Ltd','processor','Brian Chilufya','+260211244455','grain@nmc.co.zm','Malambo Road, Industrial Area, Lusaka',NULL,1500000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,7,'Mount Meru Millers Zambia Ltd','processor','Rajesh Sharma','+260971223344','crushing@mountmeru.co.zm','Great North Road, Katuba',NULL,1200000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,8,'Parmalat Zambia (Lactalis Group)','processor','Catherine Lubinda','+260211245678','milk.intake@parmalat.co.zm','Heavy Industrial Area, Lusaka',NULL,800000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(13,8,'Zambeef Products Plc','processor','Felix Sichone','+260211369000','livestock@zambeef.com.zm','Huntley Farm, Chisamba / Lusaka HQ',NULL,1500000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(14,9,'Shoprite Zambia Freshmark Depot','supermarket','Agnes Kalunga','+260211256789','freshmark@shoprite.co.zm','Manda Hill / Cairo Road, Lusaka',NULL,450000.00,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `dispatch_records`
--

LOCK TABLES `dispatch_records` WRITE;
/*!40000 ALTER TABLE `dispatch_records` DISABLE KEYS */;
INSERT INTO `dispatch_records` VALUES (5,7,7,5,200000.00,'National Milling Silos Malambo Road','ALB 4492 / T 881','Webster Lungu','2026-06-15','Weighbridge slip #WB-09941 attached','2026-10-08 10:51:59'),(6,8,8,5,100000.00,'Mount Meru Extraction Plant Katuba','BAH 3381 / T 902','Kennedy Mumba','2026-07-08','Delivered in 3 interlink super-link tippers','2026-10-08 10:51:59'),(7,7,9,5,200000.00,'FRA Regional Silos Mkushi Depot','BLC 9901 / T 114','Collins Sitali','2026-08-20','FRA Official Intake Certificate #FRA-MKU-881','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `dispatch_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `equipment`
--

LOCK TABLES `equipment` WRITE;
/*!40000 ALTER TABLE `equipment` DISABLE KEYS */;
INSERT INTO `equipment` VALUES (1,2,'Massey Ferguson 240','tractor',NULL,'MF240',NULL,NULL,0.00,0.00,0.00,'diesel','',NULL,'2026-09-17 19:16:32','2026-09-17 19:16:32'),(14,7,'John Deere 7200R Heavy 4WD Tractor (200HP)','tractor','John Deere','7200R','JD-7200R-MKUSHI-01','2023-01-20',1250000.00,1050000.00,2340.00,'diesel','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(15,7,'Claas Lexion 670 Grain Combine Harvester','harvester','Claas','Lexion 670','CLS-LEX670-2023','2023-01-20',2600000.00,2350000.00,680.00,'diesel','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(16,7,'Monosem 8-Row Precision Vacuum Planter','planter','Monosem','NG Plus 4 (8-Row)','MNS-8R-MKU-44','2023-01-20',520000.00,460000.00,380.00,'none','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,7,'Jacto Advance 3000L Field Boom Sprayer','sprayer','Jacto','Advance 3000','JCT-ADV3000-ZM','2023-01-20',340000.00,295000.00,490.00,'none','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(18,8,'Massey Ferguson MF 385 4WD Heavy Tractor','tractor','Massey Ferguson','MF 385','MF-385-MAZA-02','2023-01-20',680000.00,520000.00,3120.00,'diesel','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(19,8,'Welger AP 630 High Density Square Baler','implement','Welger','AP 630','WLG-AP630-01','2023-01-20',280000.00,240000.00,410.00,'none','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(20,8,'DeLaval 2x8 Herringbone Milking Parlour Unit','pump','DeLaval','MidiLine 2x8','DLV-ML28-MAZ','2023-01-20',450000.00,380000.00,5400.00,'electric','in_use','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(21,9,'Sonalika Tiger DI 50 Utility Tractor','tractor','Sonalika (SARO)','Tiger DI 50','SARO-SON-50-CHIS','2023-01-20',320000.00,280000.00,840.00,'diesel','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,9,'Cummins 35kVA Standby Diesel Generator','generator','Cummins','C35D5','CUM-GEN-35KVA','2023-01-20',220000.00,195000.00,290.00,'diesel','available','Operational farm machinery in Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `expense_records`
--

LOCK TABLES `expense_records` WRITE;
/*!40000 ALTER TABLE `expense_records` DISABLE KEYS */;
INSERT INTO `expense_records` VALUES (21,7,5,'fertilizers',285000.00,'2026-01-15','bank_transfer','Nitrogen Chemicals of Zambia',NULL,NULL,'Urea top dressing procurement for Mkushi maize block','2026-10-08 10:51:59'),(22,7,5,'fuel',145000.00,'2026-02-20','bank_transfer','TotalEnergies Marketing Zambia',NULL,NULL,'Bulk diesel delivery for fleet cultivation & spraying','2026-10-08 10:51:59'),(23,7,5,'labour_wages',64000.00,'2026-03-31','bank_transfer','Farm Payroll Staff',NULL,NULL,'March labour and supervisor payroll','2026-10-08 10:51:59'),(24,7,5,'machinery_repairs',48000.00,'2026-04-10','bank_transfer','AFGRI Equipment Zambia',NULL,NULL,'Combine harvester pre-season servicing and belt replacements','2026-10-08 10:51:59'),(25,7,5,'seeds',125000.00,'2026-05-18','bank_transfer','Zamseed Zambia',NULL,NULL,'Winter wheat certified seed procurement for pivot','2026-10-08 10:51:59'),(26,8,5,'animal_feed',52000.00,'2026-06-25','bank_transfer','Tiger Feeds Zambia',NULL,NULL,'Monthly dairy concentrate meal delivery in Mazabuka','2026-10-08 10:51:59'),(27,8,5,'labour_wages',68000.00,'2026-07-31','bank_transfer','Farm Payroll Staff',NULL,NULL,'July staff wages across dairy and pasture units','2026-10-08 10:51:59'),(28,7,5,'fuel',165000.00,'2026-08-10','bank_transfer','TotalEnergies Marketing Zambia',NULL,NULL,'Tractor fuel refill for early tillage and discing','2026-10-08 10:51:59'),(29,7,5,'labour_wages',72000.00,'2026-08-31','bank_transfer','Farm Payroll Staff',NULL,NULL,'August harvest staff wages and overtime','2026-10-08 10:51:59'),(30,9,5,'chemicals',38000.00,'2026-09-12','bank_transfer','Arysta LifeScience Zambia',NULL,NULL,'Greenhouse protectant fungicides and soluble foliar feeds','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `expense_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `farms`
--

LOCK TABLES `farms` WRITE;
/*!40000 ALTER TABLE `farms` DISABLE KEYS */;
INSERT INTO `farms` VALUES (2,3,'Green Acres Farm','Nairobi County',NULL,NULL,150.50,'Commercial cereal and dairy farm',1,'2026-09-17 19:11:13','2026-09-17 19:11:13'),(7,5,'Mkushi Commercial Farming Hub','Mkushi Farming Block, Central Province',-14.2000000,29.4333000,350.00,'Premier mechanized grain production estate in Zambia\'s central breadbasket. Large-scale white maize, commercial soya beans, center-pivot winter wheat, and extensive grain silos.',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,5,'Mazabuka Valley Estate','Mazabuka, Southern Province',-15.8560000,27.7480000,180.00,'Integrated commercial dairy and livestock ranch on the Kafue plains. Intensive Holstein zero-grazing dairy, commercial Boran breeding herd, and Rhodes grass irrigated pasture.',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,5,'Chisamba Agri-Hub','Chisamba, Central Province',-14.9780000,28.2540000,75.00,'High-tech peri-urban horticulture hub supplying Lusaka supermarkets. Computerized greenhouses for beef tomatoes, sweet peppers, certified seed plots, and drip-irrigated paprika.',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `farms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `feed_records`
--

LOCK TABLES `feed_records` WRITE;
/*!40000 ALTER TABLE `feed_records` DISABLE KEYS */;
INSERT INTO `feed_records` VALUES (13,24,5,'Tiger Feeds High Milk Dairy 18% Concentrate',9.00,68.00,'2026-10-07','Concentrate split ration at milking parlour','2026-10-08 10:51:59'),(14,24,5,'Katambora Rhodes Grass Silage + Molasses',38.00,45.00,'2026-10-07','Total mixed ration (TMR) ad libitum feeding','2026-10-08 10:51:59'),(15,25,5,'Tiger Feeds High Milk Dairy 18% Concentrate',9.00,68.00,'2026-10-07','Concentrate split ration at milking parlour','2026-10-08 10:51:59'),(16,25,5,'Katambora Rhodes Grass Silage + Molasses',38.00,45.00,'2026-10-07','Total mixed ration (TMR) ad libitum feeding','2026-10-08 10:51:59'),(17,26,5,'Tiger Feeds High Milk Dairy 18% Concentrate',9.00,68.00,'2026-10-07','Concentrate split ration at milking parlour','2026-10-08 10:51:59'),(18,26,5,'Katambora Rhodes Grass Silage + Molasses',38.00,45.00,'2026-10-07','Total mixed ration (TMR) ad libitum feeding','2026-10-08 10:51:59'),(19,27,5,'Tiger Feeds High Milk Dairy 18% Concentrate',9.00,68.00,'2026-10-07','Concentrate split ration at milking parlour','2026-10-08 10:51:59'),(20,27,5,'Katambora Rhodes Grass Silage + Molasses',38.00,45.00,'2026-10-07','Total mixed ration (TMR) ad libitum feeding','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `feed_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fertilizer_records`
--

LOCK TABLES `fertilizer_records` WRITE;
/*!40000 ALTER TABLE `fertilizer_records` DISABLE KEYS */;
INSERT INTO `fertilizer_records` VALUES (11,13,5,'Compound D Basal (10-20-10) NCZ','basal',14000.00,'2025-11-26','Standard basal placement at 200kg/ha','2026-10-08 10:51:59'),(12,13,5,'Urea 46% N Top Dressing','top_dress',10500.00,'2026-01-05','Knee-high vegetative top-dress prior to tasseling','2026-10-08 10:51:59'),(13,15,5,'Omnia Wheat Special Compound','basal',9000.00,'2026-05-21','Precision drill applied with winter wheat seed','2026-10-08 10:51:59'),(14,15,5,'Ammonium Nitrate CAN 27%','top_dress',6750.00,'2026-07-10','Fertigation through center pivot nozzle package','2026-10-08 10:51:59'),(15,14,5,'Single Super Phosphate (SSP) + Inoculant','basal',4500.00,'2025-12-10','Rhizobium inoculated seed drill placement','2026-10-08 10:51:59'),(16,18,5,'Omnia Hydroponic Calcium Nitrate','foliar',120.00,'2026-09-12','Continuous greenhouse drip fertigation pulse','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `fertilizer_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fields`
--

LOCK TABLES `fields` WRITE;
/*!40000 ALTER TABLE `fields` DISABLE KEYS */;
INSERT INTO `fields` VALUES (2,2,'North Block A',NULL,'loam','good',NULL,NULL,NULL,NULL,NULL,1,'2026-09-17 19:11:13','2026-09-17 19:11:13'),(15,7,'North Pivot Sector A (Wheat & Soya)',85.00,'loam','excellent',6.20,-14.1950000,29.4310000,NULL,'High-yield center-pivot irrigated sector rotated between winter wheat and summer soya',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(16,7,'Central Rainfed Block B (White Maize)',120.00,'clay_loam','good',5.90,-14.2020000,29.4350000,NULL,'Deep arable red soils dedicated to high-density commercial Seed Co SC 719 hybrid maize',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,7,'East Soya Rotation Block C',75.00,'sandy_loam','good',6.10,-14.2080000,29.4390000,NULL,'Mechanized oilseed rotation field boosting soil nitrogen',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(18,7,'South Riverbank Groundnut Section',40.00,'sandy_loam','good',6.00,-14.2140000,29.4280000,NULL,'Well-drained light loams ideal for Luangwa confectionery groundnuts',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(19,8,'Kafue Flats Grazing Paddock 1',60.00,'clay','good',6.80,-15.8520000,27.7420000,NULL,'Fertile black cotton valley soils supporting natural perennial grazing grasses',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(20,8,'Irrigated Rhodes Grass Silage Field',45.00,'clay_loam','excellent',6.50,-15.8580000,27.7510000,NULL,'Sprinkler-irrigated Katambora Rhodes grass for dairy silage and hay production',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(21,8,'Dairy Zero-Grazing Meadow Block',35.00,'loam','good',6.40,-15.8610000,27.7460000,NULL,'Exercise paddocks and intensive dairy housing units',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,9,'Greenhouse Horticulture Complex',15.00,'sandy_loam','excellent',6.60,-14.9750000,28.2520000,NULL,'12 multi-span automated greenhouses for indeterminate Anna F1 tomatoes and sweet peppers',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(23,9,'Paprika & Chili Drip Field',25.00,'loam','good',6.30,-14.9810000,28.2570000,NULL,'Drip-irrigated commercial paprika for export drying',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(24,9,'Certified Breeder Seed Nursery',10.00,'loam','excellent',6.50,-14.9720000,28.2590000,NULL,'Quarantine nursery and hybrid demonstration plots',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fuel_logs`
--

LOCK TABLES `fuel_logs` WRITE;
/*!40000 ALTER TABLE `fuel_logs` DISABLE KEYS */;
INSERT INTO `fuel_logs` VALUES (5,14,5,320.00,9120.00,2335.00,'2026-10-05','Diesel fill-up from farm depot for land discing and harrowing','2026-10-08 10:51:59'),(6,18,5,150.00,4275.00,3115.00,'2026-10-03','Tractor fuel for Rhodes hay cutting and baler tow','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `fuel_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `harvest_quality`
--

LOCK TABLES `harvest_quality` WRITE;
/*!40000 ALTER TABLE `harvest_quality` DISABLE KEYS */;
INSERT INTO `harvest_quality` VALUES (5,9,5,12.80,0.60,0.90,NULL,'standard','2026-05-20','Food Reserve Agency (FRA) Grade 1 White Maize standard certified.','2026-10-08 10:51:59'),(6,10,5,11.50,0.80,0.50,NULL,'standard','2026-04-26','Mount Meru Millers oilseed intake test: oil content 20.8%, protein 38.5%.','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `harvest_quality` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `harvest_records`
--

LOCK TABLES `harvest_records` WRITE;
/*!40000 ALTER TABLE `harvest_records` DISABLE KEYS */;
INSERT INTO `harvest_records` VALUES (9,7,16,8,8,5,'2026-05-18',685000.00,700000.00,4500.00,'A','Mkushi Silo Complex Bin #1','Full combine run across Block B1. Excellent test weight, average moisture 12.8%.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,7,17,9,11,5,'2026-04-24',158000.00,162000.00,1800.00,'A','Grain Silo Complex Bin #2','Clean harvested oilseed delivered to on-farm aerated storage.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,7,18,11,13,5,'2026-05-05',92000.00,96000.00,950.00,'A','Mkushi Dry Warehouse Shed','Mechanically dug, sun dried on racks, and machine shelled.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,9,23,12,15,5,'2026-06-30',88000.00,92000.00,600.00,'A','Chisamba Ventilated Dry Shed','Export color ASTA 140 grade paprika, baled in 50kg poly-lined jute.','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `harvest_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `income_records`
--

LOCK TABLES `income_records` WRITE;
/*!40000 ALTER TABLE `income_records` DISABLE KEYS */;
INSERT INTO `income_records` VALUES (17,8,5,'byproducts',78000.00,'2026-02-28','bank_transfer',NULL,NULL,'Parmalat Zambia','February bulk chilled milk payout from Mazabuka dairy','2026-10-08 10:51:59'),(18,8,5,'byproducts',84000.00,'2026-03-31','bank_transfer',NULL,NULL,'Parmalat Zambia','March commercial milk deliveries','2026-10-08 10:51:59'),(19,8,5,'byproducts',86500.00,'2026-04-30','bank_transfer',NULL,NULL,'Parmalat Zambia','April commercial milk deliveries','2026-10-08 10:51:59'),(20,7,5,'crop_sales',620000.00,'2026-05-15','bank_transfer',NULL,NULL,'Mount Meru Millers','Advance deposit for 2026 soya bean harvest','2026-10-08 10:51:59'),(21,7,5,'crop_sales',1160000.00,'2026-06-28','bank_transfer',NULL,NULL,'National Milling Corporation','Full settlement for 200MT commercial white maize','2026-10-08 10:51:59'),(22,7,5,'crop_sales',1120000.00,'2026-07-20','bank_transfer',NULL,NULL,'Mount Meru Millers','Balance settlement for 100MT commercial soya beans','2026-10-08 10:51:59'),(23,9,5,'crop_sales',125000.00,'2026-08-15','bank_transfer',NULL,NULL,'Shoprite Freshmark','Fortnightly fresh beef tomato & sweet pepper supply','2026-10-08 10:51:59'),(24,7,5,'crop_sales',1000000.00,'2026-09-02','bank_transfer',NULL,NULL,'Food Reserve Agency (FRA)','First tranche payment for national strategic maize reserve','2026-10-08 10:51:59'),(25,8,5,'livestock_sales',95000.00,'2026-09-25','bank_transfer',NULL,NULL,'Zambeef Products Plc','Sale of 3 culled Boran bulls and finished steers','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `income_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (21,7,'Compound D Basal Fertilizer 50kg','fertilizers','FERT-CMPD-50KG',120.00,'bags (50kg)',50.00,850.00,'Central Shed 1',NULL,'Nitrogen Chemicals of Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,7,'Urea 46% Nitrogen Fertilizer 50kg','fertilizers','FERT-UREA-50KG',18.00,'bags (50kg)',40.00,920.00,'Central Shed 1',NULL,'Omnia Fertilizer Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(23,7,'Seed Co SC 719 Hybrid Maize Seed 25kg','seeds','SEED-SC719-25KG',45.00,'pockets (25kg)',20.00,950.00,'Cold Seed Store',NULL,'Seed Co Zambia Ltd',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(24,7,'MRI Safari Soya Seed 50kg','seeds','SEED-SOYA-50KG',60.00,'bags (50kg)',25.00,1100.00,'Cold Seed Store',NULL,'Syngenta / MRI Agro Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(25,7,'Ampligo 150 ZC Insecticide 1L','chemicals','CHEM-AMP-1L',8.00,'litres',15.00,480.00,'Agrochemical Vault',NULL,'Arysta LifeScience Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(26,7,'Low Sulfur Automotive Diesel Fuel','fuel','FUEL-DSL-MKUSHI',4500.00,'litres',1500.00,28.50,'Bunkered 10,000L Fuel Depot',NULL,'TotalEnergies Marketing Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(27,8,'Tiger Feeds Dairy 18% Meal 50kg','animal_feed','FEED-TGR-50KG',110.00,'bags (50kg)',30.00,380.00,'Dairy Feed Shed',NULL,'Tiger Feeds Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(28,8,'Bovivax Blackquarter & Anthrax 100ml','vet_medicine','VET-BOV-100ML',15.00,'vials',5.00,260.00,'Veterinary Fridge',NULL,'Afrivet Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(29,8,'Katambora Rhodes Grass Seed 10kg','seeds','SEED-RHD-10KG',25.00,'packets (10kg)',10.00,420.00,'Pasture Store',NULL,'Zamseed Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(30,9,'Anna F1 Tomato Seed (10,000 seeds)','seeds','SEED-TOM-ANNA',6.00,'packets',2.00,850.00,'Greenhouse Office Safe',NULL,'Simlaw Seeds / Syngenta Zambia',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(31,9,'Heavy-Duty 10kg Tomato Export Crates','packaging','PACK-CRT-10KG',850.00,'crates',200.00,24.00,'Packaging Store',NULL,'Polypack Zambia Ltd',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (7,7,10,'INV-ZM-2026-001','2026-06-15','2026-07-15',1160000.00,0.00,1160000.00,1160000.00,'paid','Zero-rated agricultural grain produce','2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,8,11,'INV-ZM-2026-002','2026-07-08','2026-08-08',1120000.00,0.00,1120000.00,1120000.00,'paid','Settled in full','2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,9,9,'INV-ZM-2026-003','2026-08-20','2026-09-20',1320000.00,0.00,1320000.00,1000000.00,'partially_paid','Initial tranche paid; balance in 14 days','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `irrigation_schedules`
--

LOCK TABLES `irrigation_schedules` WRITE;
/*!40000 ALTER TABLE `irrigation_schedules` DISABLE KEYS */;
INSERT INTO `irrigation_schedules` VALUES (5,7,15,5,'18:00:00',360,864000.00,'alternate_days','Mon,Wed,Fri',1,'Night irrigation run for winter wheat to maximize electrical off-peak tariff (ZESCO)','2026-10-08 10:51:59','2026-10-08 10:51:59'),(6,9,22,5,'07:00:00',40,12800.00,'daily','Daily',1,'Morning nutrient fertigation cycle for Anna F1 tomatoes','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `irrigation_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `irrigation_systems`
--

LOCK TABLES `irrigation_systems` WRITE;
/*!40000 ALTER TABLE `irrigation_systems` DISABLE KEYS */;
INSERT INTO `irrigation_systems` VALUES (7,7,15,9,'Valley 4-Span Center Pivot (North Sector)','center_pivot',2400.00,'active','2023-04-10','Covers 85 hectares wheat and seed rotation; low-pressure rotator drops','2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,8,20,10,'Kafue Semi-Permanent Sprinkler Grid','sprinkler',1600.00,'active','2022-08-20','Impact sprinkler system for Rhodes grass pasture and silage','2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,9,22,11,'Netafim Automated Greenhouse Drip System','drip',320.00,'active','2024-01-15','Pressure compensated drip emitters with EC/pH sensor injection manifold','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `irrigation_systems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `livestock_production`
--

LOCK TABLES `livestock_production` WRITE;
/*!40000 ALTER TABLE `livestock_production` DISABLE KEYS */;
INSERT INTO `livestock_production` VALUES (241,24,5,'milk',27.30,'litres','2026-09-09','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(242,25,5,'milk',23.40,'litres','2026-09-09','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(243,26,5,'milk',21.90,'litres','2026-09-09','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(244,27,5,'milk',19.40,'litres','2026-09-09','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(245,24,5,'milk',26.90,'litres','2026-09-10','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(246,25,5,'milk',23.50,'litres','2026-09-10','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(247,26,5,'milk',21.50,'litres','2026-09-10','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(248,27,5,'milk',19.80,'litres','2026-09-10','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(249,24,5,'milk',27.00,'litres','2026-09-11','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(250,25,5,'milk',23.70,'litres','2026-09-11','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(251,26,5,'milk',22.00,'litres','2026-09-11','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(252,27,5,'milk',19.80,'litres','2026-09-11','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(253,24,5,'milk',27.10,'litres','2026-09-12','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(254,25,5,'milk',23.60,'litres','2026-09-12','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(255,26,5,'milk',21.90,'litres','2026-09-12','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(256,27,5,'milk',19.50,'litres','2026-09-12','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(257,24,5,'milk',27.40,'litres','2026-09-13','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(258,25,5,'milk',23.90,'litres','2026-09-13','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(259,26,5,'milk',22.60,'litres','2026-09-13','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(260,27,5,'milk',19.90,'litres','2026-09-13','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(261,24,5,'milk',27.90,'litres','2026-09-14','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(262,25,5,'milk',24.40,'litres','2026-09-14','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(263,26,5,'milk',23.40,'litres','2026-09-14','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(264,27,5,'milk',20.60,'litres','2026-09-14','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(265,24,5,'milk',29.00,'litres','2026-09-15','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(266,25,5,'milk',25.60,'litres','2026-09-15','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(267,26,5,'milk',23.80,'litres','2026-09-15','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(268,27,5,'milk',21.80,'litres','2026-09-15','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(269,24,5,'milk',29.50,'litres','2026-09-16','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(270,25,5,'milk',26.30,'litres','2026-09-16','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(271,26,5,'milk',24.10,'litres','2026-09-16','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(272,27,5,'milk',21.50,'litres','2026-09-16','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(273,24,5,'milk',30.00,'litres','2026-09-17','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(274,25,5,'milk',26.40,'litres','2026-09-17','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(275,26,5,'milk',25.00,'litres','2026-09-17','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(276,27,5,'milk',22.10,'litres','2026-09-17','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(277,24,5,'milk',30.20,'litres','2026-09-18','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(278,25,5,'milk',26.30,'litres','2026-09-18','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(279,26,5,'milk',25.50,'litres','2026-09-18','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(280,27,5,'milk',22.30,'litres','2026-09-18','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(281,24,5,'milk',30.20,'litres','2026-09-19','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(282,25,5,'milk',26.90,'litres','2026-09-19','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(283,26,5,'milk',25.40,'litres','2026-09-19','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(284,27,5,'milk',22.60,'litres','2026-09-19','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(285,24,5,'milk',29.60,'litres','2026-09-20','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(286,25,5,'milk',26.60,'litres','2026-09-20','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(287,26,5,'milk',24.60,'litres','2026-09-20','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(288,27,5,'milk',22.10,'litres','2026-09-20','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(289,24,5,'milk',29.20,'litres','2026-09-21','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(290,25,5,'milk',25.60,'litres','2026-09-21','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(291,26,5,'milk',24.50,'litres','2026-09-21','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(292,27,5,'milk',22.10,'litres','2026-09-21','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(293,24,5,'milk',28.30,'litres','2026-09-22','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(294,25,5,'milk',25.60,'litres','2026-09-22','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(295,26,5,'milk',24.10,'litres','2026-09-22','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(296,27,5,'milk',21.10,'litres','2026-09-22','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(297,24,5,'milk',28.30,'litres','2026-09-23','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(298,25,5,'milk',24.30,'litres','2026-09-23','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(299,26,5,'milk',23.40,'litres','2026-09-23','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(300,27,5,'milk',20.20,'litres','2026-09-23','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(301,24,5,'milk',27.10,'litres','2026-09-24','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(302,25,5,'milk',24.10,'litres','2026-09-24','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(303,26,5,'milk',22.60,'litres','2026-09-24','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(304,27,5,'milk',20.20,'litres','2026-09-24','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(305,24,5,'milk',26.90,'litres','2026-09-25','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(306,25,5,'milk',23.20,'litres','2026-09-25','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(307,26,5,'milk',22.00,'litres','2026-09-25','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(308,27,5,'milk',19.80,'litres','2026-09-25','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(309,24,5,'milk',26.50,'litres','2026-09-26','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(310,25,5,'milk',23.50,'litres','2026-09-26','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(311,26,5,'milk',21.90,'litres','2026-09-26','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(312,27,5,'milk',19.20,'litres','2026-09-26','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(313,24,5,'milk',26.60,'litres','2026-09-27','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(314,25,5,'milk',23.30,'litres','2026-09-27','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(315,26,5,'milk',22.10,'litres','2026-09-27','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(316,27,5,'milk',19.50,'litres','2026-09-27','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(317,24,5,'milk',27.70,'litres','2026-09-28','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(318,25,5,'milk',24.10,'litres','2026-09-28','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(319,26,5,'milk',22.60,'litres','2026-09-28','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(320,27,5,'milk',19.80,'litres','2026-09-28','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(321,24,5,'milk',27.50,'litres','2026-09-29','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(322,25,5,'milk',24.20,'litres','2026-09-29','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(323,26,5,'milk',22.60,'litres','2026-09-29','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(324,27,5,'milk',20.00,'litres','2026-09-29','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(325,24,5,'milk',28.10,'litres','2026-09-30','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(326,25,5,'milk',24.50,'litres','2026-09-30','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(327,26,5,'milk',23.00,'litres','2026-09-30','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(328,27,5,'milk',20.80,'litres','2026-09-30','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(329,24,5,'milk',28.80,'litres','2026-10-01','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(330,25,5,'milk',25.80,'litres','2026-10-01','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(331,26,5,'milk',24.30,'litres','2026-10-01','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(332,27,5,'milk',21.80,'litres','2026-10-01','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(333,24,5,'milk',29.90,'litres','2026-10-02','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(334,25,5,'milk',26.30,'litres','2026-10-02','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(335,26,5,'milk',24.70,'litres','2026-10-02','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(336,27,5,'milk',22.00,'litres','2026-10-02','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(337,24,5,'milk',29.80,'litres','2026-10-03','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(338,25,5,'milk',26.10,'litres','2026-10-03','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(339,26,5,'milk',24.70,'litres','2026-10-03','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(340,27,5,'milk',22.20,'litres','2026-10-03','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(341,24,5,'milk',30.50,'litres','2026-10-04','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(342,25,5,'milk',27.00,'litres','2026-10-04','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(343,26,5,'milk',25.30,'litres','2026-10-04','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(344,27,5,'milk',22.80,'litres','2026-10-04','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(345,24,5,'milk',30.30,'litres','2026-10-05','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(346,25,5,'milk',26.20,'litres','2026-10-05','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(347,26,5,'milk',25.00,'litres','2026-10-05','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(348,27,5,'milk',22.40,'litres','2026-10-05','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(349,24,5,'milk',29.80,'litres','2026-10-06','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(350,25,5,'milk',26.20,'litres','2026-10-06','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(351,26,5,'milk',24.70,'litres','2026-10-06','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(352,27,5,'milk',21.90,'litres','2026-10-06','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(353,24,5,'milk',29.50,'litres','2026-10-07','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(354,25,5,'milk',25.80,'litres','2026-10-07','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(355,26,5,'milk',23.80,'litres','2026-10-07','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(356,27,5,'milk',21.80,'litres','2026-10-07','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(357,24,5,'milk',28.70,'litres','2026-10-08','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(358,25,5,'milk',24.70,'litres','2026-10-08','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(359,26,5,'milk',23.40,'litres','2026-10-08','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59'),(360,27,5,'milk',20.90,'litres','2026-10-08','A','Chilled in bulk dairy milk tank at 3.8°C; picked up by Parmalat / Lactalis Zambia','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `livestock_production` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `loans`
--

LOCK TABLES `loans` WRITE;
/*!40000 ALTER TABLE `loans` DISABLE KEYS */;
INSERT INTO `loans` VALUES (3,7,5,'Zambia National Commercial Bank (ZANACO Agri-Finance)',2500000.00,14.50,60,'2024-01-01','2028-12-31',58800.00,1650000.00,'active','Asset finance facility for Claas combine harvester and center pivot irrigation rig','2026-10-08 10:51:59','2026-10-08 10:51:59'),(4,8,5,'Development Bank of Zambia (DBZ) Livestock Facility',800000.00,12.00,36,'2024-06-01','2027-05-31',26500.00,480000.00,'active','Dairy infrastructure development loan for DeLaval parlour upgrade','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `maintenance_schedules`
--

LOCK TABLES `maintenance_schedules` WRITE;
/*!40000 ALTER TABLE `maintenance_schedules` DISABLE KEYS */;
INSERT INTO `maintenance_schedules` VALUES (5,14,'250-Hour Engine Oil, Fuel & Hydraulic Filter Service',250.00,NULL,'2026-07-20','2026-10-10',2100.00,2350.00,'due','Service scheduled prior to 2026/2027 summer planting season; filters supplied by AFGRI Zambia','2026-10-08 10:51:59','2026-10-08 10:51:59'),(6,15,'Pre-Harvest Threshing Drum & Cutter Bar Servicing',500.00,NULL,'2026-09-15','2026-10-12',650.00,700.00,'scheduled','Preparation for winter wheat combine harvesting in Mkushi','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `maintenance_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `market_prices`
--

LOCK TABLES `market_prices` WRITE;
/*!40000 ALTER TABLE `market_prices` DISABLE KEYS */;
INSERT INTO `market_prices` VALUES (1,'Maize White Grain','Nairobi Grain Exchange',49.50,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-09-30 10:42:54'),(2,'Maize White Grain','Nakuru Wholesale Market',47.00,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','stable','2026-09-30 10:42:54'),(3,'Hard Bread Wheat','Eldoret Grain Board',59.00,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','stable','2026-09-30 10:42:54'),(4,'Hass Avocado (Export)','Nairobi International Terminal',135.00,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-09-30 10:42:54'),(5,'Raw Chilled Milk','KCC Ruiru Intake Hub',52.00,'litre','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-09-30 10:42:54'),(6,'Beef Tomato Fresh','Wakulima Market Nairobi',85.00,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','falling','2026-09-30 10:42:54'),(7,'Arabica Coffee AA','Nairobi Coffee Exchange',420.00,'kg','2026-09-30','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-09-30 10:42:54'),(8,'Maize White Grain','Nairobi Grain Exchange',49.50,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-10-08 10:39:20'),(9,'Maize White Grain','Nakuru Wholesale Market',47.00,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','stable','2026-10-08 10:39:20'),(10,'Hard Bread Wheat','Eldoret Grain Board',59.00,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','stable','2026-10-08 10:39:20'),(11,'Hass Avocado (Export)','Nairobi International Terminal',135.00,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-10-08 10:39:20'),(12,'Raw Chilled Milk','KCC Ruiru Intake Hub',52.00,'litre','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-10-08 10:39:20'),(13,'Beef Tomato Fresh','Wakulima Market Nairobi',85.00,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','falling','2026-10-08 10:39:20'),(14,'Arabica Coffee AA','Nairobi Coffee Exchange',420.00,'kg','2026-10-08','Kenya Agricultural Commodity Exchange (KACE)','rising','2026-10-08 10:39:20'),(15,'White Maize (50kg bag)','Lusaka Grain Market (Soweto)',330.00,'bag','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','rising','2026-10-08 10:51:59'),(16,'White Maize (Commercial MT)','Zambia Commodity Exchange (ZAMACE)',6600.00,'tonne','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','rising','2026-10-08 10:51:59'),(17,'Soya Beans (Commercial MT)','ZAMACE Lusaka Central',11400.00,'tonne','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','stable','2026-10-08 10:51:59'),(18,'Winter Wheat (Commercial MT)','Millers Association of Zambia',9800.00,'tonne','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','rising','2026-10-08 10:51:59'),(19,'Raw Chilled Milk','Dairy Association of Zambia (Mazabuka)',11.50,'litre','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','stable','2026-10-08 10:51:59'),(20,'Beef Carcass (Choice Grade)','Zambeef Lusaka Abattoir',65.00,'kg','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','rising','2026-10-08 10:51:59'),(21,'Beef Tomato (10kg crate)','Soweto Wholesale Market Lusaka',180.00,'crate','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','falling','2026-10-08 10:51:59'),(22,'Luangwa Groundnuts (50kg bag)','Lusaka Commercial Trading Mart',850.00,'bag','2026-10-08','Zambia Commodity Exchange (ZAMACE) / CSO','rising','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `market_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
INSERT INTO `notification_logs` VALUES (20,20,'in_app','sent','2026-10-08 10:51:59'),(21,21,'in_app','sent','2026-10-08 10:51:59'),(22,22,'in_app','sent','2026-10-08 10:51:59'),(23,23,'in_app','sent','2026-10-08 10:51:59'),(24,24,'in_app','sent','2026-10-08 10:51:59'),(25,25,'in_app','sent','2026-10-08 10:51:59'),(26,26,'in_app','sent','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (7,7,'crop',NULL,'Commercial White Maize Grade 1',200000.00,'kg',5.80,1160000.00),(8,8,'crop',NULL,'Commercial Soya Beans Grade A',100000.00,'kg',11.20,1120000.00),(9,9,'crop',NULL,'FRA Grade 1 White Maize Reserve',200000.00,'kg',6.60,1320000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (7,7,10,5,1160000.00,'bank_transfer','2026-06-28','ZANACO-EFT-889921','Full payment through Zanaco Bank Zambia','2026-10-08 10:51:59'),(8,8,11,5,1120000.00,'bank_transfer','2026-07-20','STANCHART-ZM-5544','Standard Chartered Bank transfer','2026-10-08 10:51:59'),(9,9,9,5,1000000.00,'bank_transfer','2026-09-02','BOZ-FRA-PAY-00918','Bank of Zambia settlement account','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `payroll_records`
--

LOCK TABLES `payroll_records` WRITE;
/*!40000 ALTER TABLE `payroll_records` DISABLE KEYS */;
INSERT INTO `payroll_records` VALUES (15,16,7,5,'2026-08-01','2026-08-31',26.00,6500.00,1500.00,500.00,350.00,8150.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(16,17,7,5,'2026-08-01','2026-08-31',26.00,8320.00,1920.00,500.00,350.00,10390.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(17,18,7,5,'2026-08-01','2026-08-31',26.00,5720.00,1320.00,500.00,350.00,7190.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(18,19,7,5,'2026-08-01','2026-08-31',26.00,6240.00,1440.00,500.00,350.00,7830.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(19,20,8,5,'2026-08-01','2026-08-31',26.00,6760.00,1560.00,500.00,350.00,8470.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(20,21,8,5,'2026-08-01','2026-08-31',26.00,4160.00,960.00,500.00,350.00,5270.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(21,22,8,5,'2026-08-01','2026-08-31',26.00,5980.00,1380.00,500.00,350.00,7510.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(22,23,9,5,'2026-08-01','2026-08-31',26.00,6240.00,1440.00,500.00,350.00,7830.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(23,24,9,5,'2026-08-01','2026-08-31',26.00,3900.00,900.00,500.00,350.00,4950.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59'),(24,25,9,5,'2026-08-01','2026-08-31',26.00,3900.00,900.00,500.00,350.00,4950.00,'paid','2026-08-31','bank_transfer',NULL,'2026-10-08 10:51:59');
/*!40000 ALTER TABLE `payroll_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `pest_treatments`
--

LOCK TABLES `pest_treatments` WRITE;
/*!40000 ALTER TABLE `pest_treatments` DISABLE KEYS */;
INSERT INTO `pest_treatments` VALUES (3,5,16,5,'chemical_spray','Ampligo 150 ZC','Chlorantraniliprole 100g/L + Lambda-cyhalothrin 50g/L','150 ml / ha',10.50,'litres','2026-09-20',14,24,'highly_effective','High mortality observed; follow-up scouting recorded zero live larvae.','2026-10-08 10:51:59'),(4,6,22,5,'chemical_spray','Ridomil Gold MZ 68WG','Mefenoxam 40g/kg + Mancozeb 640g/kg','2.5 kg / ha',2.50,'litres','2026-10-01',14,24,'highly_effective','Greenhouse foliar washdown; infection successfully halted.','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `pest_treatments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `pests_diseases`
--

LOCK TABLES `pests_diseases` WRITE;
/*!40000 ALTER TABLE `pests_diseases` DISABLE KEYS */;
INSERT INTO `pests_diseases` VALUES (1,'Fall Armyworm','Spodoptera frugiperda','pest','Maize, Sorghum, Wheat','Windowing of leaves, skeletonized foliage, frass in whorls, chewed cobs','Early planting, pheromone traps, field sanitation','Application of Emamectin benzoate or Belt 480SC','2026-09-30 10:42:54'),(2,'Coffee Berry Disease (CBD)','Colletotrichum kahawae','fungal_disease','Arabica Coffee','Dark sunken necrotic anthracnose lesions on young green pinhead berries','Canopy pruning for air circulation, planting resistant Batian variety','Preventive Copper oxychloride sprays and systemic pyraclostrobin','2026-09-30 10:42:54'),(3,'Tomato Late Blight','Phytophthora infestans','fungal_disease','Beef Tomato, Potato','Water-soaked pale spots turning brown/black with white mycelium in humid conditions','Drip irrigation instead of overhead spray, adequate plant spacing','Mancozeb 80WP or Metalaxyl-M (Ridomil Gold)','2026-09-30 10:42:54'),(4,'Avocado Anthracnose','Colletotrichum gloeosporioides','fungal_disease','Hass Avocado','Circular black spots on skin penetrating into pulp as fruit ripens','Pruning dead twigs, fruit bagging','Azoxystrobin or copper hydroxide spray regime','2026-09-30 10:42:54'),(5,'Maize Stalk Borer','Busseola fusca','pest','White Maize, Sorghum','Dead hearts in young shoots, boreholes along lower stems with frass deposits','Destruction of stubble post-harvest, crop rotation with legumes','Granular Chlorpyrifos or cypermethrin whorl placement','2026-10-08 10:51:59'),(6,'Soybean Rust','Phakopsora pachyrhizi','fungal_disease','Soya Beans','Small chlorotic brown spots on lower leaves producing pustules that cause defoliation','Resistant cultivars, field aeration, fungicide timing at flowering','Triazole fungicides such as Folicur (tebuconazole) or Amistar Top','2026-10-08 10:51:59'),(7,'Groundnut Rosette Disease','Groundnut rosette virus (GRV)','viral_disease','Groundnuts','Stunted bush growth, severe leaf mottling and yellowing transmitted by aphids','Early close-spacing planting, vector aphid management','Imidacloprid systemic aphicide seed treatment and foliar spray','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `pests_diseases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `planting_schedules`
--

LOCK TABLES `planting_schedules` WRITE;
/*!40000 ALTER TABLE `planting_schedules` DISABLE KEYS */;
INSERT INTO `planting_schedules` VALUES (13,16,17,8,8,5,'2025-11-25','2026-05-10','2026-05-15',70.00,1750.00,'harvested','Record commercial yield delivered to Food Reserve Agency (FRA) and National Milling.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(14,17,19,9,11,5,'2025-12-10','2026-04-20','2026-04-22',45.00,3600.00,'harvested','Mechanized harvest, delivered to Mount Meru Millers for crushing.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(15,15,15,10,12,5,'2026-05-20','2026-10-15',NULL,45.00,5625.00,'growing','Winter irrigated wheat crop in golden grain stage; combine harvesters scheduled for mid-October.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(16,18,NULL,11,13,5,'2025-12-05','2026-04-30','2026-05-02',40.00,3200.00,'harvested','High-grade confectionery nuts cleaned and bagged in 50kg sacks.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,20,20,7,NULL,5,'2025-09-15','2026-11-30',NULL,25.00,250.00,'growing','High-protein perennial forage, regularly cut and wrapped for dairy silage pit.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(18,22,21,5,7,5,'2026-07-15','2026-11-20',NULL,5.00,3.50,'growing','First commercial flushes currently picked daily for Lusaka fresh markets.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(19,22,22,6,14,5,'2026-08-01','2026-11-30',NULL,5.00,3.00,'growing','High color break on sweet yellow and red bell peppers; export packaging ready.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(20,23,NULL,12,15,5,'2026-01-10','2026-06-25','2026-06-28',25.00,35.00,'harvested','Sun-dried and baled for export extraction.','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `planting_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `plots`
--

LOCK TABLES `plots` WRITE;
/*!40000 ALTER TABLE `plots` DISABLE KEYS */;
INSERT INTO `plots` VALUES (15,15,'Plot A1 - Valley Pivot Circle 1',45.0000,'Center pivot circle under winter wheat',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(16,15,'Plot A2 - Valley Pivot Circle 2',40.0000,'Second center pivot circle',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,16,'Plot B1 - Commercial Hybrid Grain Block',70.0000,'High-yield Seed Co SC 719 block',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(18,16,'Plot B2 - Early Maturity Maize Block',50.0000,'Pannar PAN 53 block',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(19,17,'Plot C1 - Safari Soya Certified Stand',45.0000,'Export oilseed standard',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(20,20,'Plot R1 - First Cut Rhodes Hay Stand',25.0000,'Dense Rhodes grass pasture for baling',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(21,22,'Plot H1 - Tunnels 1-6 Beef Tomatoes',5.0000,'Anna F1 trellis setup',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,22,'Plot H2 - Tunnels 7-12 Sweet Peppers',5.0000,'Commander F1 bell peppers',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `plots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (5,5,'Urea 46% Granular Top Dressing (50kg)',200.00,'bags',890.00,178000.00),(6,6,'Commercial Automotive Gasoil (Diesel)',5000.00,'litres',27.80,139000.00);
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (5,7,12,5,5,'PO-ZM-2026-001','2026-08-15','2026-08-20','received',178000.00,'200 bags bulk urea delivery','2026-10-08 10:51:59','2026-10-08 10:51:59'),(6,7,14,5,5,'PO-ZM-2026-002','2026-09-05','2026-09-08','received',139000.00,'5,000 litres bulk diesel for tractor discing','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `repair_history`
--

LOCK TABLES `repair_history` WRITE;
/*!40000 ALTER TABLE `repair_history` DISABLE KEYS */;
INSERT INTO `repair_history` VALUES (1,18,5,'Hydraulic lift cylinder seal overhaul and power steering hose replacement',8500.00,'Patrick Tembo (SARO Agro Mechanics)','2026-08-14','Hydraulic seal kit, high-pressure steering hose, SAE 40 hydraulic oil 20L','2026-10-08 10:51:59'),(2,21,5,'Radiator flush and water pump replacement due to thermal overheating',4200.00,'Godfrey Mwansa','2026-09-02','Sonalika OEM water pump, thermostat gasket, anti-freeze coolant','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `repair_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','2026-09-01 08:55:15'),(2,'farm_owner','2026-09-01 08:55:15'),(3,'farm_manager','2026-09-01 08:55:15'),(4,'agronomist','2026-09-01 08:55:15'),(5,'worker','2026-09-01 08:55:15'),(6,'accountant','2026-09-01 08:55:15');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
INSERT INTO `sales_orders` VALUES (7,7,10,5,'SO-ZM-2026-001','2026-06-10','2026-06-15','delivered',1160000.00,'Commercial delivery of 200MT Grade 1 white maize in bulk','2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,7,11,5,'SO-ZM-2026-002','2026-07-02','2026-07-08','delivered',1120000.00,'High protein oilseed soya delivery','2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,7,9,5,'SO-ZM-2026-003','2026-08-12','2026-08-20','delivered',1320000.00,'Contracted national strategic food grain delivery','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `scouting_records`
--

LOCK TABLES `scouting_records` WRITE;
/*!40000 ALTER TABLE `scouting_records` DISABLE KEYS */;
INSERT INTO `scouting_records` VALUES (5,7,16,8,1,5,'moderate',6.50,'2026-09-18','Windowing in whorls and young larvae detected on 12% of surveyed maize plants.',1,NULL,'Early economic threshold reached; knapsack and boom spraying ordered.','2026-10-08 10:51:59'),(6,9,22,5,3,5,'low',1.50,'2026-09-30','Isolated greasy foliar lesions on greenhouse edge rows near ventilation intake.',1,NULL,'Treated immediately with Ridomil Gold; humidity extracted.','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `scouting_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `spraying_schedules`
--

LOCK TABLES `spraying_schedules` WRITE;
/*!40000 ALTER TABLE `spraying_schedules` DISABLE KEYS */;
INSERT INTO `spraying_schedules` VALUES (7,13,5,'Ampligo 150 ZC','insecticide',25.00,'1:500','2025-12-28','Fall Armyworm','Tractor boom spray directed at central whorls','2026-10-08 10:51:59'),(8,15,5,'Folicur 430 SC','fungicide',30.00,'1:400','2026-07-28','Stem & Leaf Rust','Protective flag leaf fungicide spray','2026-10-08 10:51:59'),(9,14,5,'Amistar Top','fungicide',22.00,'1:500','2026-02-15','Soybean Rust','Preventative application at canopy closure','2026-10-08 10:51:59'),(10,18,5,'Ridomil Gold MZ','fungicide',12.00,'1:350','2026-09-18','Tomato Late Blight','Greenhouse weekly maintenance spray','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `spraying_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (21,21,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(22,22,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(23,23,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(24,24,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(25,25,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(26,26,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(27,27,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(28,28,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(29,29,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(30,30,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59'),(31,31,5,'stock_in',50.00,500.00,'Initial Stock Purchase',NULL,'Consignment received into central inventory','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `storage_batches`
--

LOCK TABLES `storage_batches` WRITE;
/*!40000 ALTER TABLE `storage_batches` DISABLE KEYS */;
INSERT INTO `storage_batches` VALUES (7,7,9,8,'BATCH-MAZ-ZM-2026-01',685000.00,285000.00,4.20,'A','2026-05-19',NULL,'partially_dispatched',120.00,'Bulk white grain in Silo Bin 1; treated with Actellic Gold dust.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,7,10,9,'BATCH-SOYA-ZM-2026-01',158000.00,58000.00,7.80,'A','2026-04-25',NULL,'partially_dispatched',50.00,'High-protein grain awaiting contracted mill extraction.','2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,8,11,11,'BATCH-GNUT-ZM-2026-01',92000.00,42000.00,14.50,'A','2026-05-06',NULL,'partially_dispatched',40.00,'Bagged in 50kg branded polypropylene sacks.','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `storage_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `storage_movements`
--

LOCK TABLES `storage_movements` WRITE;
/*!40000 ALTER TABLE `storage_movements` DISABLE KEYS */;
INSERT INTO `storage_movements` VALUES (9,7,5,'intake',685000.00,'Post-harvest silo intake','2026-10-08 10:51:59'),(10,7,5,'dispatch',200000.00,'Dispatched 200MT to National Milling Corporation Lusaka','2026-10-08 10:51:59'),(11,7,5,'dispatch',200000.00,'Dispatched 200MT to Food Reserve Agency (FRA) Strategic Reserve','2026-10-08 10:51:59'),(12,8,5,'dispatch',100000.00,'Dispatched 100MT to Mount Meru Millers Katuba Plant','2026-10-08 10:51:59'),(13,9,5,'dispatch',50000.00,'Dispatched 50MT to Zambeef Products Retail Division','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `storage_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `supplier_quotations`
--

LOCK TABLES `supplier_quotations` WRITE;
/*!40000 ALTER TABLE `supplier_quotations` DISABLE KEYS */;
INSERT INTO `supplier_quotations` VALUES (5,12,7,'Urea 46% Granular Top Dressing 50kg bag',890.00,'bag','2026-11-22','Early pre-season booking rate for bulk orders over 200 bags','2026-10-08 10:51:59'),(6,14,7,'Bulk Low Sulfur Automotive Diesel Delivery',27.80,'litre','2026-11-07','Direct depot delivery into farm tanker in Mkushi block','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `supplier_quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (11,7,'Nitrogen Chemicals of Zambia (NCZ)','fertilizers','Chanda Musonda','+260211273000','sales@ncz.co.zm','Kafue Industrial Estate, Kafue',NULL,4.80,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(12,7,'Omnia Fertilizer Zambia Ltd','fertilizers','David Van der Merwe','+260211242333','orders@omnia.co.zm','Plot 5032, Great North Road, Lusaka',NULL,4.90,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(13,7,'Seed Co Zambia Ltd','seeds','Grace Mwansa','+260211272000','commercial@seedco.co.zm','Seed Co Complex, Lusaka West',NULL,4.95,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(14,7,'TotalEnergies Marketing Zambia Plc','fuel','Bwalya Kangwa','+260211228800','commercial@totalenergies.co.zm','Kafue Road, Lusaka',NULL,4.90,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(15,7,'AFGRI Equipment Zambia','machinery','Johan Pretorius','+260211273400','machinery@afgri.co.zm','Kafue Road Depot, Lusaka',NULL,4.85,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(16,8,'Tiger Feeds Zambia Ltd','feed','Brian Lubasi','+260211246600','sales@tigerfeeds.co.zm','Industrial Area, Lusaka',NULL,4.80,15,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,9,'SARO Agro Industrial Ltd','machinery','Satish Patel','+260211241477','saro@saroagri.co.zm','Buyantanshi Road, Heavy Industrial, Lusaka',NULL,4.75,30,1,NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `task_assignments`
--

LOCK TABLES `task_assignments` WRITE;
/*!40000 ALTER TABLE `task_assignments` DISABLE KEYS */;
INSERT INTO `task_assignments` VALUES (7,7,15,17,5,'Calibrate Combine Header for Winter Wheat Harvest in Sector A','Inspect knife drive sections, reel speed, and concave clearance for Claas Lexion.','urgent','2026-10-10','in_progress',NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,7,16,18,5,'Pre-Season Tillage & Ripper Pass on Commercial Maize Block B','Execute conservation ripping to 35cm depth ahead of onset of summer rains.','high','2026-10-13','pending',NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,8,20,20,5,'Bale and Stack Rhodes Grass Hay in Mazabuka Fodder Shed','Run Welger baler across 25ha cut stand; target 1,200 rectangular bales for dairy herd.','high','2026-10-11','in_progress',NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,9,22,23,5,'Tomato Crop Trellising and De-leafing in Greenhouses 1-4','Prune side shoots and lower old foliage to improve air circulation and prevent blight.','medium','2026-10-12','in_progress',NULL,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `task_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `treatments`
--

LOCK TABLES `treatments` WRITE;
/*!40000 ALTER TABLE `treatments` DISABLE KEYS */;
INSERT INTO `treatments` VALUES (5,25,5,'Mild bovine mastitis left front quarter','Intramammary antibacterial therapy','Spectramast LC + Metacam','1 tube daily for 3 days','2026-09-24','2026-10-01','recovered',650.00,'Milk withheld during withdrawal period. Somatic cell count returned to Grade A.','2026-10-08 10:51:59'),(6,33,5,'Heartwater tick-borne infection early stage','Oxytetracycline systemic injection','Engemycin 10% Long Acting','20 ml intramuscular','2026-09-13','2026-09-20','recovered',380.00,'Rapid diagnosis and treatment prevented neurological stage. Flock plunge dip refreshed.','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `treatments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'Phase One Test User','phase1_test_2045681812@farm.com','$2y$10$bJLwj0oUgiiWLWA9XBehN.JNQPMrOqff2Mbmgp89cAMzf4.gncCE2',2,1,'2026-09-17 19:00:44','2026-09-17 19:00:44',NULL,NULL,NULL),(3,'Green Acres Owner','owner_phase2_1062772229@farm.com','$2y$10$sQ6JHRn8NNBBQlGfp6QPYO53oZfK/woSbyrlGEuKsNjckJN7dbWDu',2,1,'2026-09-17 19:11:13','2026-09-17 19:11:13',NULL,NULL,NULL),(5,'Timon Chisanga','timon@farm.com','$2y$10$/u72johPFUUNIlZTVPN2WO2/GgZZvBI7UQzcV6fwA4dUzQO76vyh.',2,1,'2026-09-30 06:32:28','2026-10-08 06:01:24',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `vaccinations`
--

LOCK TABLES `vaccinations` WRITE;
/*!40000 ALTER TABLE `vaccinations` DISABLE KEYS */;
INSERT INTO `vaccinations` VALUES (17,24,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(18,24,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59'),(19,25,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(20,25,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59'),(21,26,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(22,26,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59'),(23,27,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(24,27,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59'),(25,29,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(26,29,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59'),(27,31,5,'FMD Quadrivalent Booster','Foot & Mouth Disease Types SAT1, SAT2, SAT3, O',5.00,'2026-06-10','2026-12-10','CVRI-FMD-ZM-2026-03','Administered under Central Veterinary Research Institute (CVRI) protocols','2026-10-08 10:51:59'),(28,31,5,'Bovivax Blackquarter & Anthrax','Blackquarter and Anthrax spore bacteria',2.00,'2026-04-15','2027-04-15','BOV-ZM-9921','Routine annual subcutaneous vaccination in Southern Province','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `vaccinations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (7,7,'Mkushi Commercial Steel Silo Complex','silo',12000.00,19.50,45.00,'Dual 5,000MT steel silos with continuous aeration blowers and grain bucket elevator',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(8,7,'Mkushi Central Bagged Crop Shed','dry_shed',2500.00,21.00,48.00,'Ventilated concrete warehouse for bagged groundnuts and seed',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,9,'Chisamba Cold Storage & Packhouse','cold_storage',600.00,8.50,85.00,'Insulated packhouse with pre-cooling staging area for supermarket deliveries',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `water_consumption`
--

LOCK TABLES `water_consumption` WRITE;
/*!40000 ALTER TABLE `water_consumption` DISABLE KEYS */;
INSERT INTO `water_consumption` VALUES (29,7,15,5,860000.00,360,620.00,'2026-10-01','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(30,9,22,5,12600.00,40,45.00,'2026-10-01','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(31,7,15,5,860000.00,360,620.00,'2026-10-02','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(32,9,22,5,12600.00,40,45.00,'2026-10-02','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(33,7,15,5,860000.00,360,620.00,'2026-10-03','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(34,9,22,5,12600.00,40,45.00,'2026-10-03','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(35,7,15,5,860000.00,360,620.00,'2026-10-04','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(36,9,22,5,12600.00,40,45.00,'2026-10-04','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(37,7,15,5,860000.00,360,620.00,'2026-10-05','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(38,9,22,5,12600.00,40,45.00,'2026-10-05','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(39,7,15,5,860000.00,360,620.00,'2026-10-06','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(40,9,22,5,12600.00,40,45.00,'2026-10-06','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59'),(41,7,15,5,860000.00,360,620.00,'2026-10-07','Center pivot full rotation logged; ZESCO power tariff','2026-10-08 10:51:59'),(42,9,22,5,12600.00,40,45.00,'2026-10-07','Greenhouse pulse fertigation cycle','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `water_consumption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `water_sources`
--

LOCK TABLES `water_sources` WRITE;
/*!40000 ALTER TABLE `water_sources` DISABLE KEYS */;
INSERT INTO `water_sources` VALUES (1,2,'Main Borehole','borehole',NULL,NULL,NULL,NULL,1,'2026-09-17 19:16:31','2026-09-17 19:16:31'),(8,7,'Lunsemfwa River Extraction Weir','river',3500000.00,3100000.00,7.00,'Water Resources Management Authority (WARMA) licensed pump station on Lunsemfwa tributary',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(9,7,'Mkushi Estate Earth Dam Reservoir','dam',8500000.00,7200000.00,7.20,'Primary gravity earthen dam with 120ML storage capacity',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(10,8,'Kafue River Main Irrigation Canal','canal',6000000.00,5400000.00,7.10,'Joint agricultural water intake canal from Kafue flats',1,'2026-10-08 10:51:59','2026-10-08 10:51:59'),(11,9,'Chisamba Commercial Solar Borehole #1','borehole',800000.00,740000.00,6.80,'120m deep dolomite aquifer borehole with 15kW solar array',1,'2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `water_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `weather_alerts`
--

LOCK TABLES `weather_alerts` WRITE;
/*!40000 ALTER TABLE `weather_alerts` DISABLE KEYS */;
INSERT INTO `weather_alerts` VALUES (5,7,5,'heatwave','warning','High Temperature & Dry Spell Advisory for Mkushi Block','Zambia Meteorological Department forecasts daytime peak temperatures reaching 34°C with relative humidity below 30% across Central Province.','Schedule center pivot irrigation during evening hours (18:00 - 06:00) to minimize evaporative losses and avoid crop water stress.','2026-10-08 12:51:59','2026-10-12 12:51:59',1,'2026-10-08 10:51:59'),(6,8,5,'strong_winds','advisory','Gusty Winds Advisory in Southern Province Kafue Basin','Sustained south-easterly gusts up to 45 km/h predicted, elevating bushfire risks.','Ensure perimeter firebreaks are cleared and maintain sprinkler pressure along pasture borders.','2026-10-08 12:51:59','2026-10-11 12:51:59',1,'2026-10-08 10:51:59');
/*!40000 ALTER TABLE `weather_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `weather_observations`
--

LOCK TABLES `weather_observations` WRITE;
/*!40000 ALTER TABLE `weather_observations` DISABLE KEYS */;
INSERT INTO `weather_observations` VALUES (126,7,5,29.70,38.00,0.00,14.00,'ENE',840.00,28.70,18.00,'Hot & Sunny Dry Season','station','2026-09-08 14:00:00','2026-10-08 10:51:59'),(127,8,5,33.10,32.00,0.00,11.50,'SE',880.00,32.60,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-08 14:00:00','2026-10-08 10:51:59'),(128,9,5,28.70,40.00,0.00,12.00,'E',810.00,27.90,20.00,'Partly Cloudy & Warm','station','2026-09-08 14:00:00','2026-10-08 10:51:59'),(129,7,5,30.50,38.00,0.00,14.00,'ENE',840.00,29.50,18.00,'Hot & Sunny Dry Season','station','2026-09-09 14:00:00','2026-10-08 10:51:59'),(130,8,5,32.80,32.00,0.00,11.50,'SE',880.00,32.30,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-09 14:00:00','2026-10-08 10:51:59'),(131,9,5,29.50,40.00,0.00,12.00,'E',810.00,28.70,20.00,'Partly Cloudy & Warm','station','2026-09-09 14:00:00','2026-10-08 10:51:59'),(132,7,5,31.10,38.00,0.00,14.00,'ENE',840.00,30.10,18.00,'Hot & Sunny Dry Season','station','2026-09-10 14:00:00','2026-10-08 10:51:59'),(133,8,5,32.30,32.00,0.00,11.50,'SE',880.00,31.80,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-10 14:00:00','2026-10-08 10:51:59'),(134,9,5,30.10,40.00,0.00,12.00,'E',810.00,29.30,20.00,'Partly Cloudy & Warm','station','2026-09-10 14:00:00','2026-10-08 10:51:59'),(135,7,5,31.40,38.00,0.00,14.00,'ENE',840.00,30.40,18.00,'Hot & Sunny Dry Season','station','2026-09-11 14:00:00','2026-10-08 10:51:59'),(136,8,5,31.80,32.00,0.00,11.50,'SE',880.00,31.30,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-11 14:00:00','2026-10-08 10:51:59'),(137,9,5,30.40,40.00,0.00,12.00,'E',810.00,29.60,20.00,'Partly Cloudy & Warm','station','2026-09-11 14:00:00','2026-10-08 10:51:59'),(138,7,5,31.50,38.00,0.00,14.00,'ENE',840.00,30.50,18.00,'Hot & Sunny Dry Season','station','2026-09-12 14:00:00','2026-10-08 10:51:59'),(139,8,5,31.10,32.00,0.00,11.50,'SE',880.00,30.60,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-12 14:00:00','2026-10-08 10:51:59'),(140,9,5,30.50,40.00,0.00,12.00,'E',810.00,29.70,20.00,'Partly Cloudy & Warm','station','2026-09-12 14:00:00','2026-10-08 10:51:59'),(141,7,5,31.30,38.00,0.00,14.00,'ENE',840.00,30.30,18.00,'Hot & Sunny Dry Season','station','2026-09-13 14:00:00','2026-10-08 10:51:59'),(142,8,5,30.40,32.00,0.00,11.50,'SE',880.00,29.90,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-13 14:00:00','2026-10-08 10:51:59'),(143,9,5,30.30,40.00,0.00,12.00,'E',810.00,29.50,20.00,'Partly Cloudy & Warm','station','2026-09-13 14:00:00','2026-10-08 10:51:59'),(144,7,5,30.90,38.00,0.00,14.00,'ENE',840.00,29.90,18.00,'Hot & Sunny Dry Season','station','2026-09-14 14:00:00','2026-10-08 10:51:59'),(145,8,5,29.70,32.00,0.00,11.50,'SE',880.00,29.20,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-14 14:00:00','2026-10-08 10:51:59'),(146,9,5,29.90,40.00,0.00,12.00,'E',810.00,29.10,20.00,'Partly Cloudy & Warm','station','2026-09-14 14:00:00','2026-10-08 10:51:59'),(147,7,5,30.20,38.00,0.00,14.00,'ENE',840.00,29.20,18.00,'Hot & Sunny Dry Season','station','2026-09-15 14:00:00','2026-10-08 10:51:59'),(148,8,5,29.10,32.00,0.00,11.50,'SE',880.00,28.60,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-15 14:00:00','2026-10-08 10:51:59'),(149,9,5,29.20,40.00,0.00,12.00,'E',810.00,28.40,20.00,'Partly Cloudy & Warm','station','2026-09-15 14:00:00','2026-10-08 10:51:59'),(150,7,5,29.40,38.00,0.00,14.00,'ENE',840.00,28.40,18.00,'Hot & Sunny Dry Season','station','2026-09-16 14:00:00','2026-10-08 10:51:59'),(151,8,5,28.50,32.00,0.00,11.50,'SE',880.00,28.00,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-16 14:00:00','2026-10-08 10:51:59'),(152,9,5,28.40,40.00,0.00,12.00,'E',810.00,27.60,20.00,'Partly Cloudy & Warm','station','2026-09-16 14:00:00','2026-10-08 10:51:59'),(153,7,5,28.60,38.00,0.00,14.00,'ENE',840.00,27.60,18.00,'Hot & Sunny Dry Season','station','2026-09-17 14:00:00','2026-10-08 10:51:59'),(154,8,5,28.10,32.00,0.00,11.50,'SE',880.00,27.60,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-17 14:00:00','2026-10-08 10:51:59'),(155,9,5,27.60,40.00,0.00,12.00,'E',810.00,26.80,20.00,'Partly Cloudy & Warm','station','2026-09-17 14:00:00','2026-10-08 10:51:59'),(156,7,5,27.70,38.00,0.00,14.00,'ENE',840.00,26.70,18.00,'Hot & Sunny Dry Season','station','2026-09-18 14:00:00','2026-10-08 10:51:59'),(157,8,5,27.80,32.00,0.00,11.50,'SE',880.00,27.30,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-18 14:00:00','2026-10-08 10:51:59'),(158,9,5,26.70,40.00,0.00,12.00,'E',810.00,25.90,20.00,'Partly Cloudy & Warm','station','2026-09-18 14:00:00','2026-10-08 10:51:59'),(159,7,5,26.80,38.00,0.00,14.00,'ENE',840.00,25.80,18.00,'Hot & Sunny Dry Season','station','2026-09-19 14:00:00','2026-10-08 10:51:59'),(160,8,5,27.70,32.00,0.00,11.50,'SE',880.00,27.20,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-19 14:00:00','2026-10-08 10:51:59'),(161,9,5,25.80,40.00,0.00,12.00,'E',810.00,25.00,20.00,'Partly Cloudy & Warm','station','2026-09-19 14:00:00','2026-10-08 10:51:59'),(162,7,5,26.20,38.00,0.00,14.00,'ENE',840.00,25.20,18.00,'Hot & Sunny Dry Season','station','2026-09-20 14:00:00','2026-10-08 10:51:59'),(163,8,5,27.80,32.00,0.00,11.50,'SE',880.00,27.30,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-20 14:00:00','2026-10-08 10:51:59'),(164,9,5,25.20,40.00,0.00,12.00,'E',810.00,24.40,20.00,'Partly Cloudy & Warm','station','2026-09-20 14:00:00','2026-10-08 10:51:59'),(165,7,5,25.70,38.00,0.00,14.00,'ENE',840.00,24.70,18.00,'Hot & Sunny Dry Season','station','2026-09-21 14:00:00','2026-10-08 10:51:59'),(166,8,5,28.00,32.00,0.00,11.50,'SE',880.00,27.50,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-21 14:00:00','2026-10-08 10:51:59'),(167,9,5,24.70,40.00,0.00,12.00,'E',810.00,23.90,20.00,'Partly Cloudy & Warm','station','2026-09-21 14:00:00','2026-10-08 10:51:59'),(168,7,5,25.50,38.00,0.00,14.00,'ENE',840.00,24.50,18.00,'Hot & Sunny Dry Season','station','2026-09-22 14:00:00','2026-10-08 10:51:59'),(169,8,5,28.40,32.00,0.00,11.50,'SE',880.00,27.90,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-22 14:00:00','2026-10-08 10:51:59'),(170,9,5,24.50,40.00,0.00,12.00,'E',810.00,23.70,20.00,'Partly Cloudy & Warm','station','2026-09-22 14:00:00','2026-10-08 10:51:59'),(171,7,5,25.60,38.00,0.00,14.00,'ENE',840.00,24.60,18.00,'Hot & Sunny Dry Season','station','2026-09-23 14:00:00','2026-10-08 10:51:59'),(172,8,5,28.90,32.00,0.00,11.50,'SE',880.00,28.40,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-23 14:00:00','2026-10-08 10:51:59'),(173,9,5,24.60,40.00,0.00,12.00,'E',810.00,23.80,20.00,'Partly Cloudy & Warm','station','2026-09-23 14:00:00','2026-10-08 10:51:59'),(174,7,5,25.90,38.00,0.00,14.00,'ENE',840.00,24.90,18.00,'Hot & Sunny Dry Season','station','2026-09-24 14:00:00','2026-10-08 10:51:59'),(175,8,5,29.50,32.00,0.00,11.50,'SE',880.00,29.00,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-24 14:00:00','2026-10-08 10:51:59'),(176,9,5,24.90,40.00,0.00,12.00,'E',810.00,24.10,20.00,'Partly Cloudy & Warm','station','2026-09-24 14:00:00','2026-10-08 10:51:59'),(177,7,5,26.40,38.00,0.00,14.00,'ENE',840.00,25.40,18.00,'Hot & Sunny Dry Season','station','2026-09-25 14:00:00','2026-10-08 10:51:59'),(178,8,5,30.20,32.00,0.00,11.50,'SE',880.00,29.70,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-25 14:00:00','2026-10-08 10:51:59'),(179,9,5,25.40,40.00,0.00,12.00,'E',810.00,24.60,20.00,'Partly Cloudy & Warm','station','2026-09-25 14:00:00','2026-10-08 10:51:59'),(180,7,5,27.20,38.00,0.00,14.00,'ENE',840.00,26.20,18.00,'Hot & Sunny Dry Season','station','2026-09-26 14:00:00','2026-10-08 10:51:59'),(181,8,5,30.90,32.00,0.00,11.50,'SE',880.00,30.40,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-26 14:00:00','2026-10-08 10:51:59'),(182,9,5,26.20,40.00,0.00,12.00,'E',810.00,25.40,20.00,'Partly Cloudy & Warm','station','2026-09-26 14:00:00','2026-10-08 10:51:59'),(183,7,5,28.00,38.00,0.00,14.00,'ENE',840.00,27.00,18.00,'Hot & Sunny Dry Season','station','2026-09-27 14:00:00','2026-10-08 10:51:59'),(184,8,5,31.60,32.00,0.00,11.50,'SE',880.00,31.10,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-27 14:00:00','2026-10-08 10:51:59'),(185,9,5,27.00,40.00,0.00,12.00,'E',810.00,26.20,20.00,'Partly Cloudy & Warm','station','2026-09-27 14:00:00','2026-10-08 10:51:59'),(186,7,5,28.90,38.00,0.00,14.00,'ENE',840.00,27.90,18.00,'Hot & Sunny Dry Season','station','2026-09-28 14:00:00','2026-10-08 10:51:59'),(187,8,5,32.20,32.00,0.00,11.50,'SE',880.00,31.70,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-28 14:00:00','2026-10-08 10:51:59'),(188,9,5,27.90,40.00,0.00,12.00,'E',810.00,27.10,20.00,'Partly Cloudy & Warm','station','2026-09-28 14:00:00','2026-10-08 10:51:59'),(189,7,5,29.80,38.00,0.00,14.00,'ENE',840.00,28.80,18.00,'Hot & Sunny Dry Season','station','2026-09-29 14:00:00','2026-10-08 10:51:59'),(190,8,5,32.70,32.00,0.00,11.50,'SE',880.00,32.20,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-29 14:00:00','2026-10-08 10:51:59'),(191,9,5,28.80,40.00,0.00,12.00,'E',810.00,28.00,20.00,'Partly Cloudy & Warm','station','2026-09-29 14:00:00','2026-10-08 10:51:59'),(192,7,5,30.50,38.00,0.00,14.00,'ENE',840.00,29.50,18.00,'Hot & Sunny Dry Season','station','2026-09-30 14:00:00','2026-10-08 10:51:59'),(193,8,5,33.00,32.00,0.00,11.50,'SE',880.00,32.50,16.50,'Clear Sky & Hot Dry Spell','station','2026-09-30 14:00:00','2026-10-08 10:51:59'),(194,9,5,29.50,40.00,0.00,12.00,'E',810.00,28.70,20.00,'Partly Cloudy & Warm','station','2026-09-30 14:00:00','2026-10-08 10:51:59'),(195,7,5,31.10,38.00,0.00,14.00,'ENE',840.00,30.10,18.00,'Hot & Sunny Dry Season','station','2026-10-01 14:00:00','2026-10-08 10:51:59'),(196,8,5,33.30,32.00,0.00,11.50,'SE',880.00,32.80,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-01 14:00:00','2026-10-08 10:51:59'),(197,9,5,30.10,40.00,0.00,12.00,'E',810.00,29.30,20.00,'Partly Cloudy & Warm','station','2026-10-01 14:00:00','2026-10-08 10:51:59'),(198,7,5,31.40,38.00,0.00,14.00,'ENE',840.00,30.40,18.00,'Hot & Sunny Dry Season','station','2026-10-02 14:00:00','2026-10-08 10:51:59'),(199,8,5,33.30,32.00,0.00,11.50,'SE',880.00,32.80,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-02 14:00:00','2026-10-08 10:51:59'),(200,9,5,30.40,40.00,0.00,12.00,'E',810.00,29.60,20.00,'Partly Cloudy & Warm','station','2026-10-02 14:00:00','2026-10-08 10:51:59'),(201,7,5,31.50,38.00,0.00,14.00,'ENE',840.00,30.50,18.00,'Hot & Sunny Dry Season','station','2026-10-03 14:00:00','2026-10-08 10:51:59'),(202,8,5,33.20,32.00,0.00,11.50,'SE',880.00,32.70,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-03 14:00:00','2026-10-08 10:51:59'),(203,9,5,30.50,40.00,0.00,12.00,'E',810.00,29.70,20.00,'Partly Cloudy & Warm','station','2026-10-03 14:00:00','2026-10-08 10:51:59'),(204,7,5,31.30,38.00,0.00,14.00,'ENE',840.00,30.30,18.00,'Hot & Sunny Dry Season','station','2026-10-04 14:00:00','2026-10-08 10:51:59'),(205,8,5,32.90,32.00,0.00,11.50,'SE',880.00,32.40,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-04 14:00:00','2026-10-08 10:51:59'),(206,9,5,30.30,40.00,0.00,12.00,'E',810.00,29.50,20.00,'Partly Cloudy & Warm','station','2026-10-04 14:00:00','2026-10-08 10:51:59'),(207,7,5,30.80,38.00,0.00,14.00,'ENE',840.00,29.80,18.00,'Hot & Sunny Dry Season','station','2026-10-05 14:00:00','2026-10-08 10:51:59'),(208,8,5,32.40,32.00,0.00,11.50,'SE',880.00,31.90,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-05 14:00:00','2026-10-08 10:51:59'),(209,9,5,29.80,40.00,0.00,12.00,'E',810.00,29.00,20.00,'Partly Cloudy & Warm','station','2026-10-05 14:00:00','2026-10-08 10:51:59'),(210,7,5,30.20,63.00,4.50,14.00,'ENE',840.00,29.20,24.00,'Isolated Early Shower','station','2026-10-06 14:00:00','2026-10-08 10:51:59'),(211,8,5,31.80,32.00,0.00,11.50,'SE',880.00,31.30,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-06 14:00:00','2026-10-08 10:51:59'),(212,9,5,29.20,40.00,0.00,12.00,'E',810.00,28.40,20.00,'Partly Cloudy & Warm','station','2026-10-06 14:00:00','2026-10-08 10:51:59'),(213,7,5,29.40,38.00,0.00,14.00,'ENE',840.00,28.40,18.00,'Hot & Sunny Dry Season','station','2026-10-07 14:00:00','2026-10-08 10:51:59'),(214,8,5,31.20,32.00,0.00,11.50,'SE',880.00,30.70,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-07 14:00:00','2026-10-08 10:51:59'),(215,9,5,28.40,40.00,0.00,12.00,'E',810.00,27.60,20.00,'Partly Cloudy & Warm','station','2026-10-07 14:00:00','2026-10-08 10:51:59'),(216,7,5,28.50,38.00,0.00,14.00,'ENE',840.00,27.50,18.00,'Hot & Sunny Dry Season','station','2026-10-08 14:00:00','2026-10-08 10:51:59'),(217,8,5,30.50,32.00,0.00,11.50,'SE',880.00,30.00,16.50,'Clear Sky & Hot Dry Spell','station','2026-10-08 14:00:00','2026-10-08 10:51:59'),(218,9,5,27.50,40.00,0.00,12.00,'E',810.00,26.70,20.00,'Partly Cloudy & Warm','station','2026-10-08 14:00:00','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `weather_observations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `worker_attendance`
--

LOCK TABLES `worker_attendance` WRITE;
/*!40000 ALTER TABLE `worker_attendance` DISABLE KEYS */;
INSERT INTO `worker_attendance` VALUES (99,16,7,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(100,17,7,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(101,18,7,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(102,19,7,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(103,20,8,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(104,21,8,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(105,22,8,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(106,23,9,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(107,24,9,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(108,25,9,5,'2026-10-02','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(109,16,7,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(110,17,7,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(111,18,7,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(112,19,7,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(113,20,8,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(114,21,8,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(115,22,8,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(116,23,9,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(117,24,9,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(118,25,9,5,'2026-10-03','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(119,16,7,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(120,17,7,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(121,18,7,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(122,19,7,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(123,20,8,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(124,21,8,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(125,22,8,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(126,23,9,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(127,24,9,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(128,25,9,5,'2026-10-04','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(129,16,7,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(130,17,7,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(131,18,7,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(132,19,7,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(133,20,8,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(134,21,8,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(135,22,8,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(136,23,9,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(137,24,9,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(138,25,9,5,'2026-10-05','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(139,16,7,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(140,17,7,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(141,18,7,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(142,19,7,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(143,20,8,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(144,21,8,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(145,22,8,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(146,23,9,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(147,24,9,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(148,25,9,5,'2026-10-06','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(149,16,7,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(150,17,7,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(151,18,7,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(152,19,7,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(153,20,8,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(154,21,8,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(155,22,8,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(156,23,9,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(157,24,9,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(158,25,9,5,'2026-10-07','present',8.00,0.00,'Standard daily shift','2026-10-08 10:51:59'),(159,16,7,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(160,17,7,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(161,18,7,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(162,19,7,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(163,20,8,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(164,21,8,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(165,22,8,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(166,23,9,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(167,24,9,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59'),(168,25,9,5,'2026-10-08','present',8.00,1.50,'Standard daily shift','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `worker_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `workers`
--

LOCK TABLES `workers` WRITE;
/*!40000 ALTER TABLE `workers` DISABLE KEYS */;
INSERT INTO `workers` VALUES (1,2,NULL,'David','Kiprono',NULL,'+254712345678',NULL,'field_worker','permanent',30.00,'2026-09-17','active',NULL,NULL,'2026-09-17 19:16:32','2026-09-17 19:16:32'),(16,7,NULL,'Mubanga','Chanda','284910/11/1','+260977112233','mubanga.chanda@chisangafarms.co.zm','supervisor','permanent',250.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(17,7,NULL,'Kondwani','Phiri','301928/67/1','+260978223344','kondwani.phiri@chisangafarms.co.zm','agronomist','permanent',320.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(18,7,NULL,'Emmanuel','Banda','274819/10/1','+260979334455','emmanuel.banda@chisangafarms.co.zm','tractor_driver','permanent',220.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(19,7,NULL,'Natasha','Mulenga','310293/88/1','+260971445566','natasha.mulenga@chisangafarms.co.zm','technician','permanent',240.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(20,8,NULL,'Given','Hachileka','293847/72/1','+260976556677','given.hachileka@chisangafarms.co.zm','supervisor','permanent',260.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(21,8,NULL,'Mainza','Mweene','339102/54/1','+260975667788','mainza.mweene@chisangafarms.co.zm','field_worker','permanent',160.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(22,8,NULL,'Mutinta','Simukonda','329182/43/1','+260974778899','mutinta.simukonda@chisangafarms.co.zm','technician','permanent',230.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(23,9,NULL,'Kelvin','Lupiya','318291/22/1','+260973889900','kelvin.lupiya@chisangafarms.co.zm','supervisor','permanent',240.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(24,9,NULL,'Chileshe','Mwape','349182/15/1','+260972990011','chileshe.mwape@chisangafarms.co.zm','field_worker','seasonal',150.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59'),(25,9,NULL,'Lombe','Sampa','358291/31/1','+260971001122','lombe.sampa@chisangafarms.co.zm','harvester','seasonal',150.00,'2023-01-15','active',NULL,'Certified experienced staff member','2026-10-08 10:51:59','2026-10-08 10:51:59');
/*!40000 ALTER TABLE `workers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-08 12:52:18
