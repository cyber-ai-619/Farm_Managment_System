import { useState, useEffect, useCallback } from "react";
import storageService from "../services/storageService";
import farmService from "../services/farmService";
import cropService from "../services/cropService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Storage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("batches"); // "batches" | "warehouses" | "dispatches" | "valuation"

  // Data states
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [crops, setCrops] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSpoilageModalOpen, setIsSpoilageModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Forms
  const [warehouseForm, setWarehouseForm] = useState({
    farm_id: "",
    name: "",
    storage_type: "Cold Storage",
    capacity_kg: 50000,
    temperature_celsius: 4.0,
    humidity_percent: 85.0,
    location: "Sector B - Central Barn",
  });

  const [batchForm, setBatchForm] = useState({
    warehouse_id: "",
    crop_id: "",
    batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
    quantity_stored_kg: 1000,
    unit_cost: 1.5,
    storage_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    notes: "",
  });

  const [spoilageForm, setSpoilageForm] = useState({
    batch_id: "",
    spoilage_kg: 50,
    notes: "Rotting / humidity condensation",
  });

  const [dispatchForm, setDispatchForm] = useState({
    batch_id: "",
    destination: "Wholesale Supermarket Distribution Center",
    quantity_kg: 200,
    vehicle_number: "KBA 432Y",
    driver_name: "John Kamau",
    dispatch_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Load farms & crops
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [farmList, cropList] = await Promise.all([
        farmService.getFarms().catch(() => []),
        cropService.getCrops().catch(() => []),
      ]);
      setFarms(farmList);
      setCrops(cropList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
        setWarehouseForm((prev) => ({ ...prev, farm_id: farmList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load auxiliary storage data:", err);
    }
  }, [selectedFarmId]);

  // Load storage data
  const loadStorageData = useCallback(async (farmId) => {
    if (!farmId) return;
    setLoading(true);
    setError("");
    try {
      const [whRes, bthRes, dspRes, valRes] = await Promise.all([
        storageService.getWarehouses(farmId).catch(() => []),
        storageService.getBatches(farmId).catch(() => []),
        storageService.getDispatches(farmId).catch(() => []),
        storageService.getValuation(farmId).catch(() => null),
      ]);
      setWarehouses(whRes);
      setBatches(bthRes);
      setDispatches(dspRes);
      setValuation(valRes);
      if (whRes.length > 0) {
        setBatchForm((prev) => ({ ...prev, warehouse_id: prev.warehouse_id || whRes[0].id }));
      }
      if (crops.length > 0) {
        setBatchForm((prev) => ({ ...prev, crop_id: prev.crop_id || crops[0].id }));
      }
    } catch (err) {
      setError(err.message || "Failed to load storage management data.");
    } finally {
      setLoading(false);
    }
  }, [crops]);

  useEffect(() => {
    fetchAuxiliary();
  }, [fetchAuxiliary]);

  useEffect(() => {
    if (selectedFarmId) {
      loadStorageData(selectedFarmId);
    }
  }, [selectedFarmId, loadStorageData]);

  // Submit Handlers
  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!warehouseForm.name.trim()) return;
    try {
      setSubmitting(true);
      await storageService.createWarehouse({ ...warehouseForm, farm_id: selectedFarmId });
      setIsWarehouseModalOpen(false);
      await loadStorageData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to create warehouse.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.warehouse_id || !batchForm.crop_id) {
      alert("Please select warehouse and crop.");
      return;
    }
    try {
      setSubmitting(true);
      await storageService.createBatch(batchForm);
      setIsBatchModalOpen(false);
      await loadStorageData(selectedFarmId);
      // Reset batch number
      setBatchForm((prev) => ({
        ...prev,
        batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
      }));
    } catch (err) {
      alert(err.message || "Failed to store batch.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSpoilage = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await storageService.recordSpoilage(spoilageForm);
      setIsSpoilageModalOpen(false);
      await loadStorageData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to log spoilage.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await storageService.createDispatch(dispatchForm);
      setIsDispatchModalOpen(false);
      await loadStorageData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to dispatch batch.");
    } finally {
      setSubmitting(false);
    }
  };

  const openSpoilageModal = (batch) => {
    setSelectedBatch(batch);
    setSpoilageForm({
      batch_id: batch.id,
      spoilage_kg: 10,
      notes: "Post-harvest deterioration",
    });
    setIsSpoilageModalOpen(true);
  };

  const openDispatchModal = (batch) => {
    setSelectedBatch(batch);
    setDispatchForm({
      batch_id: batch.id,
      destination: "Central Market / Wholesale Customer",
      quantity_kg: Number(batch.quantity_available_kg || batch.quantity_stored_kg || 100),
      vehicle_number: "",
      driver_name: "",
      dispatch_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsDispatchModalOpen(true);
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  // Key metrics
  const totalStoredKg = batches.reduce(
    (sum, b) => sum + Number(b.quantity_available_kg || b.quantity_stored_kg || 0),
    0
  );
  const totalValuation = batches.reduce(
    (sum, b) =>
      sum +
      Number(b.quantity_available_kg || b.quantity_stored_kg || 0) *
        Number(b.unit_cost || 2.0),
    0
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Storage & Post-Harvest Management</h1>
          <p>Warehouse climate facilities, lot batch tracking, spoilage write-offs, and stock dispatches.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#FFF",
                color: "var(--color-forest, #1E4632)",
                border: "1px solid var(--color-forest, #1E4632)",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Facility
            </button>
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--color-forest, #1E4632)",
                color: "#FFF",
                border: "1px solid var(--color-gold, #D4A54A)",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Store New Batch
            </button>
          </div>
        )}
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #1E4632" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Stored Stock Volume
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E4632", marginTop: "4px" }}>
            {totalStoredKg.toLocaleString()} kg
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Across {batches.length} active batches</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Estimated Valuation
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#B8860B", marginTop: "4px" }}>
            ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Asset inventory in warehouses</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #3498DB" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Storage Facilities
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3498DB", marginTop: "4px" }}>
            {warehouses.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Silos, Cold Rooms & Sheds</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #27AE60" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Total Dispatches
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#27AE60", marginTop: "4px" }}>
            {dispatches.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Outbound fulfillment runs</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E0E0E0", marginBottom: "20px" }}>
        {[
          { id: "batches", label: `Storage Batches (${batches.length})` },
          { id: "warehouses", label: `Warehouses & Silos (${warehouses.length})` },
          { id: "dispatches", label: `Dispatches (${dispatches.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--color-forest, #1E4632)" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab.id ? "var(--color-forest, #1E4632)" : "#666",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading message="Loading warehouse inventory..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: BATCHES */}
          {activeTab === "batches" && (
            <div className="page-content-section">
              {batches.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No stored produce batches currently logged.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Batch #</th>
                        <th style={{ padding: "12px 16px" }}>Crop</th>
                        <th style={{ padding: "12px 16px" }}>Warehouse</th>
                        <th style={{ padding: "12px 16px" }}>Stored (kg)</th>
                        <th style={{ padding: "12px 16px" }}>Available (kg)</th>
                        <th style={{ padding: "12px 16px" }}>Stored Date</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E4632" }}>
                            {b.batch_number || `BAT-${b.id}`}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{b.crop_name || "Crop #" + b.crop_id}</td>
                          <td style={{ padding: "12px 16px" }}>{b.warehouse_name || "Warehouse #" + b.warehouse_id}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {Number(b.quantity_stored_kg).toLocaleString()} kg
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2E7D32" }}>
                            {Number(b.quantity_available_kg || b.quantity_stored_kg).toLocaleString()} kg
                          </td>
                          <td style={{ padding: "12px 16px" }}>{b.storage_date}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: b.status === "in_storage" ? "#E8F5E9" : "#FFF8E1",
                                color: b.status === "in_storage" ? "#2E7D32" : "#F57F17",
                              }}
                            >
                              {b.status || "in_storage"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {canManage && (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  onClick={() => openDispatchModal(b)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    backgroundColor: "var(--color-forest, #1E4632)",
                                    color: "#FFF",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Dispatch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSpoilageModal(b)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    backgroundColor: "#C0392B",
                                    color: "#FFF",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Spoilage
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WAREHOUSES */}
          {activeTab === "warehouses" && (
            <div className="page-content-section">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {warehouses.map((wh) => (
                  <div key={wh.id} className="content-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ margin: 0, color: "#1E4632" }}>{wh.name}</h4>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: "#E8F5E9",
                          color: "#1E4632",
                        }}
                      >
                        {wh.storage_type}
                      </span>
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#555", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>
                        <strong>Capacity:</strong> {Number(wh.capacity_kg).toLocaleString()} kg
                      </div>
                      <div>
                        <strong>Target Temp:</strong> {wh.temperature_celsius ? `${wh.temperature_celsius}°C` : "Ambient"}
                      </div>
                      <div>
                        <strong>Humidity:</strong> {wh.humidity_percent ? `${wh.humidity_percent}%` : "Ambient"}
                      </div>
                      <div>
                        <strong>Location:</strong> {wh.location || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCHES */}
          {activeTab === "dispatches" && (
            <div className="page-content-section">
              {dispatches.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No storage dispatches recorded yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Dispatch ID</th>
                        <th style={{ padding: "12px 16px" }}>Batch</th>
                        <th style={{ padding: "12px 16px" }}>Destination</th>
                        <th style={{ padding: "12px 16px" }}>Quantity</th>
                        <th style={{ padding: "12px 16px" }}>Vehicle / Driver</th>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatches.map((d) => (
                        <tr key={d.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                            DSP-{String(d.id).padStart(4, "0")}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{d.batch_number || "Batch #" + d.batch_id}</td>
                          <td style={{ padding: "12px 16px" }}>{d.destination}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E4632" }}>
                            {Number(d.quantity_kg).toLocaleString()} kg
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#666" }}>
                            {d.vehicle_number ? `${d.vehicle_number} (${d.driver_name || "Driver"})` : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{d.dispatch_date || d.created_at?.split(" ")[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warehouse Modal */}
      <Modal isOpen={isWarehouseModalOpen} onClose={() => setIsWarehouseModalOpen(false)} title="Add Storage Facility">
        <form onSubmit={handleCreateWarehouse} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Facility Name *</label>
            <input
              type="text"
              required
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Storage Type</label>
              <select
                value={warehouseForm.storage_type}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, storage_type: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Cold Storage">Cold Storage</option>
                <option value="Grain Silo">Grain Silo</option>
                <option value="Dry Storage Shed">Dry Storage Shed</option>
                <option value="Root Cellar">Root Cellar</option>
                <option value="Packaging Hall">Packaging Hall</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Capacity (kg) *</label>
              <input
                type="number"
                required
                value={warehouseForm.capacity_kg}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity_kg: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Target Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={warehouseForm.temperature_celsius}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, temperature_celsius: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                value={warehouseForm.humidity_percent}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, humidity_percent: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Location</label>
            <input
              type="text"
              value={warehouseForm.location}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Facility"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Modal */}
      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Store Produce Batch">
        <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Warehouse *</label>
              <select
                required
                value={batchForm.warehouse_id}
                onChange={(e) => setBatchForm({ ...batchForm, warehouse_id: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.storage_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Crop *</label>
              <select
                required
                value={batchForm.crop_id}
                onChange={(e) => setBatchForm({ ...batchForm, crop_id: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="">Select Crop</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Batch Code</label>
              <input
                type="text"
                value={batchForm.batch_number}
                onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Quantity (kg) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={batchForm.quantity_stored_kg}
                onChange={(e) => setBatchForm({ ...batchForm, quantity_stored_kg: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Unit Cost ($/kg)</label>
              <input
                type="number"
                step="0.01"
                value={batchForm.unit_cost}
                onChange={(e) => setBatchForm({ ...batchForm, unit_cost: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Storage Date</label>
              <input
                type="date"
                value={batchForm.storage_date}
                onChange={(e) => setBatchForm({ ...batchForm, storage_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Storing..." : "Record Storage Batch"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Spoilage Modal */}
      <Modal isOpen={isSpoilageModalOpen} onClose={() => setIsSpoilageModalOpen(false)} title="Record Spoilage Write-Off">
        <form onSubmit={handleRecordSpoilage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            Deduct spoiled or deteriorated produce from batch: <strong>{selectedBatch?.batch_number}</strong>
          </p>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Spoilage Quantity (kg) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={spoilageForm.spoilage_kg}
              onChange={(e) => setSpoilageForm({ ...spoilageForm, spoilage_kg: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Reason / Notes</label>
            <textarea
              rows="2"
              value={spoilageForm.notes}
              onChange={(e) => setSpoilageForm({ ...spoilageForm, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsSpoilageModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "#C0392B", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Writing off..." : "Confirm Spoilage Write-Off"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Create Outbound Dispatch">
        <form onSubmit={handleCreateDispatch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Destination *</label>
            <input
              type="text"
              required
              value={dispatchForm.destination}
              onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Dispatch Qty (kg) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={dispatchForm.quantity_kg}
                onChange={(e) => setDispatchForm({ ...dispatchForm, quantity_kg: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Vehicle Reg #</label>
              <input
                type="text"
                value={dispatchForm.vehicle_number}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicle_number: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Driver Name</label>
              <input
                type="text"
                value={dispatchForm.driver_name}
                onChange={(e) => setDispatchForm({ ...dispatchForm, driver_name: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Dispatch Date</label>
              <input
                type="date"
                value={dispatchForm.dispatch_date}
                onChange={(e) => setDispatchForm({ ...dispatchForm, dispatch_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Processing..." : "Confirm Dispatch"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Storage;