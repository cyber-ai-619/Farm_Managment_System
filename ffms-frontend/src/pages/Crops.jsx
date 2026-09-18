import { useState, useEffect, useCallback } from "react";
import cropService from "../services/cropService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Crops() {
  const { role } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [activeTab, setActiveTab] = useState("varieties"); // 'varieties' | 'plantings' | 'fertilizers'
  const [varieties, setVarieties] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [error, setError] = useState("");

  // Modals
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false);
  const [isPlantingModalOpen, setIsPlantingModalOpen] = useState(false);
  const [isFertilizerModalOpen, setIsFertilizerModalOpen] = useState(false);

  // Forms
  const [cropForm, setCropForm] = useState({
    name: "",
    scientific_name: "",
    category: "Grain",
    growth_cycle_days: 90,
    ideal_season: "Spring",
  });

  const [varietyForm, setVarietyForm] = useState({
    name: "",
    days_to_maturity: 90,
    yield_potential_kg_ha: 4500,
    disease_resistance: "",
  });

  const [plantingForm, setPlantingForm] = useState({
    farm_id: "",
    field_id: "",
    variety_id: "",
    planting_date: new Date().toISOString().split("T")[0],
    expected_harvest_date: "",
    area_planted_ha: "",
    status: "planted",
  });

  const [fertilizerForm, setFertilizerForm] = useState({
    field_id: "",
    fertilizer_name: "NPK 17:17:17",
    quantity_kg: "",
    application_date: new Date().toISOString().split("T")[0],
    application_method: "Broadcasting",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchCrops = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await cropService.getCrops();
      setCrops(data);
      if (data.length > 0 && !selectedCrop) {
        setSelectedCrop(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load crops catalog.");
    } finally {
      setLoading(false);
    }
  }, [selectedCrop]);

  const fetchFarmsAndFields = useCallback(async () => {
    try {
      const farmsData = await farmService.getFarms();
      setFarms(farmsData);
      if (farmsData.length > 0) {
        const fieldsData = await farmService.getFields(farmsData[0].id);
        setFields(fieldsData);
        setPlantingForm((prev) => ({ ...prev, farm_id: farmsData[0].id, field_id: fieldsData[0]?.id || "" }));
        setFertilizerForm((prev) => ({ ...prev, field_id: fieldsData[0]?.id || "" }));
      }
    } catch (err) {
      console.error("Failed to load farms/fields:", err);
    }
  }, []);

  const fetchCropDetails = useCallback(async (cropId) => {
    try {
      const [vData, pData, fData] = await Promise.all([
        cropService.getVarieties(cropId),
        cropService.getPlantings(cropId),
        cropService.getFertilizerRecords(cropId),
      ]);
      setVarieties(vData);
      setPlantings(pData);
      setFertilizers(fData);
    } catch (err) {
      console.error("Failed to load crop details:", err);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
    fetchFarmsAndFields();
  }, [fetchCrops, fetchFarmsAndFields]);

  useEffect(() => {
    if (selectedCrop?.id) {
      fetchCropDetails(selectedCrop.id);
    }
  }, [selectedCrop, fetchCropDetails]);

  const handleSaveCrop = async (e) => {
    e.preventDefault();
    if (!cropForm.name.trim()) return;

    try {
      setSubmitting(true);
      await cropService.createCrop(cropForm);
      setIsCropModalOpen(false);
      await fetchCrops();
    } catch (err) {
      alert(err.message || "Failed to create crop.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveVariety = async (e) => {
    e.preventDefault();
    if (!varietyForm.name.trim() || !selectedCrop) return;

    try {
      setSubmitting(true);
      await cropService.createVariety(selectedCrop.id, varietyForm);
      setIsVarietyModalOpen(false);
      await fetchCropDetails(selectedCrop.id);
    } catch (err) {
      alert(err.message || "Failed to add variety.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePlanting = async (e) => {
    e.preventDefault();
    if (!selectedCrop) return;

    try {
      setSubmitting(true);
      await cropService.createPlanting(selectedCrop.id, plantingForm);
      setIsPlantingModalOpen(false);
      await fetchCropDetails(selectedCrop.id);
    } catch (err) {
      alert(err.message || "Failed to record planting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFertilizer = async (e) => {
    e.preventDefault();
    if (!selectedCrop) return;

    try {
      setSubmitting(true);
      await cropService.createFertilizerRecord(selectedCrop.id, fertilizerForm);
      setIsFertilizerModalOpen(false);
      await fetchCropDetails(selectedCrop.id);
    } catch (err) {
      alert(err.message || "Failed to log fertilizer.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  if (loading && crops.length === 0) {
    return <Loading message="Loading crop registry..." />;
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Crop & Planting Management</h1>
          <p>Manage crop species, cultivars, planting schedules, and fertilizer applications.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsCropModalOpen(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--color-forest, #1E4632)",
              color: "#FFF",
              border: "1px solid var(--color-gold, #D4A54A)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Register New Crop
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {crops.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
          <h4>No Crops Registered</h4>
          <p>Click "+ Register New Crop" to add your first crop variety to the system.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Crops List */}
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--color-forest)", marginBottom: "12px" }}>Crop Catalog ({crops.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {crops.map((c) => {
                const isSelected = selectedCrop?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCrop(c)}
                    className="content-card"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "var(--color-gold, #D4A54A)" : "rgba(212,165,74,0.2)",
                      backgroundColor: isSelected ? "rgba(245, 234, 208, 0.45)" : "#FFF",
                      padding: "16px",
                    }}
                  >
                    <h4 style={{ margin: 0, color: "var(--color-forest)" }}>{c.name}</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", fontStyle: "italic" }}>{c.scientific_name || "Cultivated crop"}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>
                      <span>Category: <strong>{c.category || "Grain"}</strong></span>
                      <span>⏱️ {c.growth_cycle_days || 90}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Crop Details */}
          <div>
            {selectedCrop && (
              <div>
                <div className="content-card" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: 0, color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{selectedCrop.name}</h2>
                      <p style={{ margin: "4px 0 0", color: "var(--color-charcoal-60)", fontStyle: "italic" }}>
                        {selectedCrop.scientific_name || "Species"} &bull; Ideal Season: <strong>{selectedCrop.ideal_season || "All-year"}</strong>
                      </p>
                    </div>
                    {canManage && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setIsVarietyModalOpen(true)}
                          style={{ padding: "6px 12px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Add Variety
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPlantingModalOpen(true)}
                          style={{ padding: "6px 12px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Plant Crop
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderBottom: "1px solid rgba(30,70,50,0.1)" }}>
                    {[
                      { id: "varieties", label: `Varieties (${varieties.length})` },
                      { id: "plantings", label: `Planting Schedules (${plantings.length})` },
                      { id: "fertilizers", label: `Fertilizer Records (${fertilizers.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "8px 16px",
                          fontWeight: activeTab === tab.id ? 700 : 500,
                          color: activeTab === tab.id ? "var(--color-forest)" : "var(--color-charcoal-60)",
                          borderBottom: activeTab === tab.id ? "2px solid var(--color-gold)" : "2px solid transparent",
                          cursor: "pointer",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab 1: Varieties */}
                {activeTab === "varieties" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                    {varieties.length === 0 ? (
                      <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                        <p>No varieties registered yet for this crop.</p>
                      </div>
                    ) : (
                      varieties.map((v) => (
                        <div key={v.id} className="content-card">
                          <h4 style={{ margin: "0 0 6px" }}>{v.name}</h4>
                          <p style={{ fontSize: "0.85rem" }}>Maturity: <strong>{v.days_to_maturity || 90} days</strong></p>
                          <p style={{ fontSize: "0.85rem" }}>Yield Est: <strong>{v.yield_potential_kg_ha ? `${v.yield_potential_kg_ha} kg/ha` : "N/A"}</strong></p>
                          {v.disease_resistance && <p style={{ fontSize: "0.8rem", color: "var(--color-farm-green)" }}>🛡️ {v.disease_resistance}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 2: Plantings */}
                {activeTab === "plantings" && (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {plantings.length === 0 ? (
                      <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                        <p>No planting schedules recorded for this crop.</p>
                      </div>
                    ) : (
                      plantings.map((p) => (
                        <div key={p.id} className="content-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <h4 style={{ margin: "0 0 4px" }}>Field: {p.field_name || `Field #${p.field_id}`}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Planted: <strong>{p.planting_date}</strong> &bull; Area: <strong>{p.area_planted_ha ? `${p.area_planted_ha} ha` : "N/A"}</strong>
                            </p>
                            {p.expected_harvest_date && (
                              <p style={{ fontSize: "0.8rem", color: "var(--color-wine)", margin: "2px 0 0" }}>
                                Expected Harvest: {p.expected_harvest_date}
                              </p>
                            )}
                          </div>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: p.status === "harvested" ? "#E8F5E9" : "#FFF3E0",
                              color: p.status === "harvested" ? "#2E7D32" : "#E65100",
                              textTransform: "uppercase",
                            }}
                          >
                            {p.status || "Planted"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Fertilizer Logs */}
                {activeTab === "fertilizers" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsFertilizerModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Fertilizer Application
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {fertilizers.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No fertilizer applications logged yet.</p>
                        </div>
                      ) : (
                        fertilizers.map((f) => (
                          <div key={f.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>{f.fertilizer_name || f.fertilizer_type}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Amount: <strong>{f.quantity_kg} kg</strong> &bull; Date: <strong>{f.application_date}</strong> &bull; Method: <strong>{f.application_method || "Broadcast"}</strong>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Crop */}
      <Modal isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} title="Register New Crop">
        <form onSubmit={handleSaveCrop} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Crop Name *</label>
            <input
              type="text"
              required
              value={cropForm.name}
              onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })}
              placeholder="e.g. Maize / Corn"
            />
          </div>
          <div className="form-field">
            <label>Scientific Name</label>
            <input
              type="text"
              value={cropForm.scientific_name}
              onChange={(e) => setCropForm({ ...cropForm, scientific_name: e.target.value })}
              placeholder="Zea mays"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Category</label>
              <select
                value={cropForm.category}
                onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Grain">Grain</option>
                <option value="Vegetable">Vegetable</option>
                <option value="Fruit">Fruit</option>
                <option value="Legume">Legume</option>
                <option value="Tuber">Tuber</option>
                <option value="Cash Crop">Cash Crop</option>
              </select>
            </div>
            <div className="form-field">
              <label>Growth Cycle (Days)</label>
              <input
                type="number"
                value={cropForm.growth_cycle_days}
                onChange={(e) => setCropForm({ ...cropForm, growth_cycle_days: e.target.value })}
                placeholder="90"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Register Crop"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add Variety */}
      <Modal isOpen={isVarietyModalOpen} onClose={() => setIsVarietyModalOpen(false)} title={`Add Variety for ${selectedCrop?.name}`}>
        <form onSubmit={handleSaveVariety} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Variety Name *</label>
            <input
              type="text"
              required
              value={varietyForm.name}
              onChange={(e) => setVarietyForm({ ...varietyForm, name: e.target.value })}
              placeholder="e.g. Hybrid SC-719"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Days to Maturity</label>
              <input
                type="number"
                value={varietyForm.days_to_maturity}
                onChange={(e) => setVarietyForm({ ...varietyForm, days_to_maturity: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Yield Potential (kg/ha)</label>
              <input
                type="number"
                value={varietyForm.yield_potential_kg_ha}
                onChange={(e) => setVarietyForm({ ...varietyForm, yield_potential_kg_ha: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Disease / Drought Resistance</label>
            <input
              type="text"
              value={varietyForm.disease_resistance}
              onChange={(e) => setVarietyForm({ ...varietyForm, disease_resistance: e.target.value })}
              placeholder="e.g. High drought tolerance, rust resistant"
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Variety"}
          </button>
        </form>
      </Modal>

      {/* Modal: Schedule Planting */}
      <Modal isOpen={isPlantingModalOpen} onClose={() => setIsPlantingModalOpen(false)} title={`Schedule Planting: ${selectedCrop?.name}`}>
        <form onSubmit={handleSavePlanting} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Field *</label>
            <select
              value={plantingForm.field_id}
              onChange={(e) => setPlantingForm({ ...plantingForm, field_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              required
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.size_ha} ha)</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Planting Date *</label>
              <input
                type="date"
                required
                value={plantingForm.planting_date}
                onChange={(e) => setPlantingForm({ ...plantingForm, planting_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Expected Harvest Date</label>
              <input
                type="date"
                value={plantingForm.expected_harvest_date}
                onChange={(e) => setPlantingForm({ ...plantingForm, expected_harvest_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Area Planted (ha)</label>
            <input
              type="number"
              step="0.1"
              value={plantingForm.area_planted_ha}
              onChange={(e) => setPlantingForm({ ...plantingForm, area_planted_ha: e.target.value })}
              placeholder="5.0"
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Schedule Planting"}
          </button>
        </form>
      </Modal>

      {/* Modal: Fertilizer */}
      <Modal isOpen={isFertilizerModalOpen} onClose={() => setIsFertilizerModalOpen(false)} title="Log Fertilizer Application">
        <form onSubmit={handleSaveFertilizer} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Field *</label>
            <select
              value={fertilizerForm.field_id}
              onChange={(e) => setFertilizerForm({ ...fertilizerForm, field_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              required
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Fertilizer Product / Formula *</label>
            <input
              type="text"
              required
              value={fertilizerForm.fertilizer_name}
              onChange={(e) => setFertilizerForm({ ...fertilizerForm, fertilizer_name: e.target.value })}
              placeholder="e.g. NPK 17:17:17 / Urea 46%"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Quantity (kg) *</label>
              <input
                type="number"
                required
                value={fertilizerForm.quantity_kg}
                onChange={(e) => setFertilizerForm({ ...fertilizerForm, quantity_kg: e.target.value })}
                placeholder="250"
              />
            </div>
            <div className="form-field">
              <label>Application Date</label>
              <input
                type="date"
                value={fertilizerForm.application_date}
                onChange={(e) => setFertilizerForm({ ...fertilizerForm, application_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Application"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Crops;