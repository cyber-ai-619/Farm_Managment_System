# 📋 Phase 2 Completion Report — Farm, Crop & Livestock Management

> **Status**: Complete  
> **Depends on**: Phase 1 (Security & User Management — `users`, `roles` tables)

---

## Executive Summary

Phase 2 implements the three core farm entity modules:

| Module | Folder | Tables |
|---|---|---|
| Farm & Field | `backend/src/Modules/farm_field/` | `farms`, `fields`, `plots` |
| Crop | `backend/src/Modules/crop/` | `crops`, `crop_varieties`, `planting_schedules`, `fertilizer_records`, `spraying_schedules` |
| Livestock | `backend/src/Modules/livestock/` | `breeds`, `animals`, `vaccinations`, `treatments`, `feed_records`, `breeding_records`, `livestock_production` |

These entities form the foundation for Phase 3 (operations) and Phase 4 (harvest, sales, finance).

---

## Files Created

### Migrations
| File | Tables |
|---|---|
| `database/migrations/002_farms_fields.sql` | `farms`, `fields`, `plots` |
| `database/migrations/003_crops.sql` | `crops`, `crop_varieties`, `planting_schedules`, `fertilizer_records`, `spraying_schedules` |
| `database/migrations/004_livestock.sql` | `breeds`, `animals`, `vaccinations`, `treatments`, `feed_records`, `breeding_records`, `livestock_production` |

### Backend Classes
| File | Purpose |
|---|---|
| `backend/src/Modules/farm_field/FarmModel.php` | CRUD for `farms` |
| `backend/src/Modules/farm_field/FieldModel.php` | CRUD for `fields` and `plots` |
| `backend/src/Modules/farm_field/FarmController.php` | Farm endpoints |
| `backend/src/Modules/farm_field/FieldController.php` | Field & plot endpoints |
| `backend/src/Modules/crop/CropModel.php` | CRUD for `crops` and `crop_varieties` |
| `backend/src/Modules/crop/PlantingModel.php` | CRUD for `planting_schedules`, `fertilizer_records`, `spraying_schedules` |
| `backend/src/Modules/crop/CropController.php` | All crop endpoints |
| `backend/src/Modules/livestock/LivestockModel.php` | CRUD for `animals`, `breeds`, `feed_records`, `livestock_production` |
| `backend/src/Modules/livestock/HealthModel.php` | CRUD for `vaccinations`, `treatments` |
| `backend/src/Modules/livestock/LivestockController.php` | All livestock endpoints |

---

## API Endpoint Reference

### 🏡 Farm & Field Endpoints

#### `GET /api/farms`
Returns farms. Admins see all; `farm_owner` sees only their own.
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 1,
      "owner_id": 2,
      "owner_name": "John Banda",
      "name": "Sunrise Farm",
      "location": "Lusaka, Zambia",
      "latitude": "-15.4167",
      "longitude": "28.2833",
      "total_area_ha": "120.50",
      "is_active": 1,
      "created_at": "2026-09-01 10:00:00"
    }
  ]
}
```

#### `POST /api/farms`
Roles: `admin`, `farm_owner`
```json
// Request body
{
  "name": "Sunrise Farm",
  "location": "Lusaka, Zambia",
  "latitude": -15.4167,
  "longitude": 28.2833,
  "total_area_ha": 120.50,
  "description": "Mixed crop and livestock farm"
}
// Response 201
{ "success": true, "message": "Farm created.", "data": { ...farm } }
```

#### `GET /api/farms/{id}` · `PUT /api/farms/{id}` · `DELETE /api/farms/{id}`
Standard show / update / delete. Non-admins may only touch their own farm.

#### `GET /api/farms/{farm_id}/fields`
Returns all fields for a farm.

#### `POST /api/farms/{farm_id}/fields`
Roles: `admin`, `farm_owner`, `farm_manager`
```json
// Request body
{
  "name": "North Block",
  "area_ha": 15.5,
  "soil_type": "loam",
  "soil_condition": "good",
  "soil_ph": 6.5,
  "latitude": -15.410,
  "longitude": 28.280
}
```

#### `GET /api/fields/{id}` · `PUT /api/fields/{id}` · `DELETE /api/fields/{id}`

#### `GET /api/fields/{field_id}/plots` · `POST /api/fields/{field_id}/plots`
```json
// POST body
{ "name": "Bed A", "area_ha": 0.25, "description": "Raised bed" }
```

---

### 🌱 Crop Endpoints

#### `GET /api/crops`
Returns the full crop catalogue. All authenticated roles.

#### `POST /api/crops`
Roles: `admin`, `farm_owner`, `farm_manager`, `agronomist`
```json
{ "name": "Maize", "scientific_name": "Zea mays", "category": "cereal", "description": "..." }
```

#### `GET /api/crops/{id}` · `PUT /api/crops/{id}` · `DELETE /api/crops/{id}`

#### `GET /api/crops/{id}/varieties`
#### `POST /api/crops/{id}/varieties`
```json
{
  "variety_name": "SC403",
  "days_to_maturity": 120,
  "planting_density": "25000 plants/ha",
  "row_spacing_cm": 75,
  "plant_spacing_cm": 25,
  "expected_yield_t_ha": 8.5
}
```

#### `GET /api/crops/{id}/plantings`
#### `POST /api/crops/{id}/plantings`
```json
{
  "field_id": 1,
  "plot_id": null,
  "variety_id": 1,
  "planting_date": "2026-10-01",
  "expected_harvest_date": "2027-01-28",
  "area_planted_ha": 10.0,
  "seed_quantity_kg": 25.0,
  "status": "planned"
}
```

#### `GET /api/crops/{id}/fertilizer-records?planting_id=X`
#### `POST /api/crops/{id}/fertilizer-records`
```json
{
  "planting_id": 1,
  "fertilizer_name": "CAN",
  "fertilizer_type": "top_dress",
  "quantity_kg": 200,
  "application_date": "2026-11-15"
}
```

---

### 🐄 Livestock Endpoints

#### `GET /api/livestock/breeds` · `POST /api/livestock/breeds`
```json
// POST body
{ "name": "Angus", "species": "cattle", "description": "..." }
```

#### `GET /api/livestock?farm_id=X`
Returns all animals for a farm. Query param `farm_id` is required.

#### `POST /api/livestock`
Roles: `admin`, `farm_owner`, `farm_manager`
```json
{
  "farm_id": 1,
  "breed_id": 2,
  "tag_number": "ZM-001",
  "name": "Bessie",
  "species": "cattle",
  "gender": "female",
  "date_of_birth": "2024-03-10",
  "weight_kg": 320.5,
  "status": "active"
}
```

#### `GET /api/livestock/{id}` · `PUT /api/livestock/{id}` · `DELETE /api/livestock/{id}`

#### `GET /api/livestock/{id}/vaccinations`
#### `POST /api/livestock/{id}/vaccinations`
```json
{
  "vaccine_name": "FMD Vaccine",
  "disease_target": "Foot and Mouth Disease",
  "dose_ml": 2.0,
  "vaccination_date": "2026-09-01",
  "next_due_date": "2027-03-01",
  "batch_number": "VAC-2026-001"
}
```

#### `GET /api/livestock/{id}/treatments`
#### `POST /api/livestock/{id}/treatments`
```json
{
  "diagnosis": "Mastitis",
  "treatment_name": "Penicillin course",
  "medication": "Penicillin G",
  "dose": "10ml IM",
  "treatment_date": "2026-09-02",
  "follow_up_date": "2026-09-09",
  "outcome": "ongoing",
  "cost": 45.00
}
```

#### `GET /api/livestock/{id}/feed-records`
#### `POST /api/livestock/{id}/feed-records`
```json
{
  "feed_type": "silage",
  "quantity_kg": 12.5,
  "cost": 3.50,
  "feed_date": "2026-09-02"
}
```

---

## Role Permission Matrix

| Endpoint group | admin | farm_owner | farm_manager | agronomist | worker | accountant |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Read farms/fields/crops/livestock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/update farms | ✅ | ✅ | — | — | — | — |
| Create/update fields & plots | ✅ | ✅ | ✅ | — | — | — |
| Create/update crops & varieties | ✅ | ✅ | ✅ | ✅ | — | — |
| Log plantings & fertilizer | ✅ | ✅ | ✅ | ✅ | — | — |
| Register animals | ✅ | ✅ | ✅ | — | — | — |
| Log vaccinations & treatments | ✅ | ✅ | ✅ | ✅ | — | — |
| Log feed records | ✅ | ✅ | ✅ | — | ✅ | — |
| Delete farms/animals | ✅ | ✅ | — | — | — | — |

---

## Teammate Integration Guide

### Running the migrations
```bash
# From your MySQL client or phpMyAdmin, run in order:
# 1. database/migrations/002_farms_fields.sql
# 2. database/migrations/003_crops.sql
# 3. database/migrations/004_livestock.sql
```

### Adding routes to index.php
Copy all route blocks from `routes_phase2.php` into `backend/public/index.php` after the existing Phase 1 auth routes.

### Frontend Axios examples
```js
// Get all farms for current user
const { data } = await axios.get('/api/farms');

// Create a farm
await axios.post('/api/farms', { name: 'My Farm', location: 'Lusaka' });

// Get fields for farm ID 1
const { data } = await axios.get('/api/farms/1/fields');

// Register livestock (requires farm_id query param to list)
await axios.post('/api/livestock', { farm_id: 1, tag_number: 'ZM-001', species: 'cattle' });
```

### Testing checklist (Postman / Thunder Client)
- [ ] `POST /api/auth/login` → get token
- [ ] `POST /api/farms` → create farm, note `id`
- [ ] `POST /api/farms/{id}/fields` → create field, note `id`
- [ ] `POST /api/fields/{id}/plots` → create plot
- [ ] `GET /api/farms/{id}/fields` → verify field appears
- [ ] `POST /api/crops` → create crop
- [ ] `POST /api/crops/{id}/varieties` → add variety
- [ ] `POST /api/crops/{id}/plantings` → schedule planting on the field
- [ ] `POST /api/livestock` → register animal on farm
- [ ] `POST /api/livestock/{id}/vaccinations` → log vaccination
- [ ] `POST /api/livestock/{id}/treatments` → log treatment
- [ ] `POST /api/livestock/{id}/feed-records` → log feed

---

## Notes for Phase 3

Phase 3 modules that depend on Phase 2:
- **Irrigation** → references `fields`
- **Pest & Disease** → `scouting_records` references `fields` and `planting_schedules`
- **Harvest** → `harvest_records` references `fields`, `crops`, and `planting_schedules`
