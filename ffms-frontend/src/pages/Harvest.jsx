import { useState, useEffect, useCallback } from "react";
import harvestService from "../services/harvestService";
import farmService from "../services/farmService";
import cropService from "../services/cropService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Harvest() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    farm_id: "",
    field_id: "",
    crop_id: "",
    variety_id: "",
    harvest_date: new Date().toISOString().split("T")[0],
    quantity_kg: 500,
    expected_yield_kg: 550,
    loss_kg: 10,
    quality_grade: "Grade A",
    storage_location: "Barn A - Cold Storage",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Load farms
  const fetchFarms = useCallback(async () => {
    try {
      const farmList = await farmService.getFarms();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
        setFormData((prev) => ({ ...prev, farm_id: farmList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  // Load crops & fields
  const fetchCropsAndFields = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      const [cropsList, fieldsList] = await Promise.all([
        cropService.getCrops().catch(() => []),
        farmService.getFields(farmId).catch(() => []),
      ]);
      setCrops(cropsList);
      setFields(fieldsList);
      if (fieldsList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          field_id: prev.field_id || fieldsList[0].id,
        }));
      }
      if (cropsList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          crop_id: prev.crop_id || cropsList[0].id,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch auxiliary data:", err);
    }
  }, []);

  // Load harvest records and summary
  const fetchHarvestData = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError("");
      const [harvestList, summaryData] = await Promise.all([
        harvestService.getHarvests(farmId),
        harvestService.getSummary(farmId).catch(() => null),
      ]);
      setHarvests(harvestList);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Failed to load harvest records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      fetchCropsAndFields(selectedFarmId);
      fetchHarvestData(selectedFarmId);
    }
  }, [selectedFarmId, fetchCropsAndFields, fetchHarvestData]);

  const handleCreateHarvest = async (e) => {
    e.preventDefault();
    if (!formData.field_id || !formData.crop_id || !formData.quantity_kg) {
      alert("Please fill in all required fields (Field, Crop, Quantity).");
      return;
    }

    try {
      setSubmitting(true);
      await harvestService.createHarvest({
        ...formData,
        farm_id: selectedFarmId,
      });
      setIsModalOpen(false);
      await fetchHarvestData(selectedFarmId);
      // Reset form
      setFormData((prev) => ({
        ...prev,
        quantity_kg: 500,
        expected_yield_kg: 550,
        loss_kg: 10,
        notes: "",
      }));
    } catch (err) {
      alert(err.message || "Failed to record harvest.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  // Stats calculation
  const totalHarvestedKg = harvests.reduce((acc, h) => acc + Number(h.quantity_kg || 0), 0);
  const totalLossKg = harvests.reduce((acc, h) => acc + Number(h.loss_kg || 0), 0);
  const totalExpectedKg = harvests.reduce((acc, h) => acc + Number(h.expected_yield_kg || 0), 0);
  const yieldEfficiency = totalExpectedKg > 0 ? ((totalHarvestedKg / totalExpectedKg) * 100).toFixed(1) : 100;

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Produce & Harvest Operations</h1>
          <p>Record crop harvest sessions, compute yield efficiency, track losses and batch quality.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
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
            + Log Harvest Record
          </button>
        )}
      </div>

      {/* Farm Selector */}
      {farms.length > 1 && (
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: 600 }}>Active Farm:</label>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setFormData((prev) => ({ ...prev, farm_id: e.target.value }));
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #CCC",
              backgroundColor: "#FFF",
            }}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.location || "Primary"})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-forest, #1E4632)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Total Harvested
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E4632", marginTop: "4px" }}>
            {totalHarvestedKg.toLocaleString()} kg
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Across all recorded cycles</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Yield Efficiency
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#B8860B", marginTop: "4px" }}>
            {yieldEfficiency}%
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {totalExpectedKg.toLocaleString()} kg target
          </div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #C0392B" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Post-Harvest Losses
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#C0392B", marginTop: "4px" }}>
            {totalLossKg.toLocaleString()} kg
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {totalHarvestedKg > 0 ? ((totalLossKg / (totalHarvestedKg + totalLossKg)) * 100).toFixed(1) : 0}% loss rate
          </div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #2980B9" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Recorded Batches
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2980B9", marginTop: "4px" }}>
            {harvests.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Batches logged in system</div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="page-content-section">
        <h2>Harvest Records</h2>
        {loading ? (
          <Loading message="Loading harvest logs..." />
        ) : error ? (
          <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
            {error}
          </div>
        ) : harvests.length === 0 ? (
          <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
            <p>No harvest sessions recorded for this farm yet.</p>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  backgroundColor: "var(--color-forest, #1E4632)",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Log First Harvest
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Crop</th>
                  <th style={{ padding: "12px 16px" }}>Field</th>
                  <th style={{ padding: "12px 16px" }}>Harvested</th>
                  <th style={{ padding: "12px 16px" }}>Loss (kg)</th>
                  <th style={{ padding: "12px 16px" }}>Grade</th>
                  <th style={{ padding: "12px 16px" }}>Storage Location</th>
                  <th style={{ padding: "12px 16px" }}>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {harvests.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #EEE" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{item.harvest_date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 600, color: "#1E4632" }}>{item.crop_name || "Crop #" + item.crop_id}</span>
                      {item.variety_name && <span style={{ fontSize: "12px", color: "#666", display: "block" }}>{item.variety_name}</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{item.field_name || "Field #" + item.field_id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2E7D32" }}>
                      {Number(item.quantity_kg).toLocaleString()} kg
                    </td>
                    <td style={{ padding: "12px 16px", color: Number(item.loss_kg) > 0 ? "#C0392B" : "#888" }}>
                      {Number(item.loss_kg || 0).toLocaleString()} kg
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor:
                            item.quality_grade === "Premium" || item.quality_grade === "Grade A"
                              ? "#E8F5E9"
                              : item.quality_grade === "Grade B"
                              ? "#FFF8E1"
                              : "#FFEBEE",
                          color:
                            item.quality_grade === "Premium" || item.quality_grade === "Grade A"
                              ? "#2E7D32"
                              : item.quality_grade === "Grade B"
                              ? "#F57F17"
                              : "#C62828",
                        }}
                      >
                        {item.quality_grade || "Standard"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{item.storage_location || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#666" }}>
                      {item.harvested_by_name || "Staff"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Harvest Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Crop Harvest Record">
        <form onSubmit={handleCreateHarvest} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Field *
              </label>
              <select
                value={formData.field_id}
                onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="">Select Field</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.size_hectares || f.area_sqm || "0"} ha)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Crop *
              </label>
              <select
                value={formData.crop_id}
                onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="">Select Crop</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type || "Crop"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Harvest Date *
              </label>
              <input
                type="date"
                value={formData.harvest_date}
                onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Quality Grade
              </label>
              <select
                value={formData.quality_grade}
                onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Premium">Premium</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
                <option value="Feed Grade">Feed Grade</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Yield (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity_kg}
                onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Target Yield (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.expected_yield_kg}
                onChange={(e) => setFormData({ ...formData, expected_yield_kg: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Loss (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.loss_kg}
                onChange={(e) => setFormData({ ...formData, loss_kg: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
              Storage Location
            </label>
            <input
              type="text"
              placeholder="e.g. Silo 1, Cold Storage Room B"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
              Notes & Observations
            </label>
            <textarea
              rows="2"
              placeholder="Weather conditions, moisture content, packing notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: "8px 16px",
                border: "1px solid #CCC",
                borderRadius: "6px",
                backgroundColor: "#FFF",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--color-forest, #1E4632)",
                color: "#FFF",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save Harvest Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Harvest;