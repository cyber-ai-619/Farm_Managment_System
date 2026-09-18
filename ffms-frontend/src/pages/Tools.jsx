import { useState, useEffect, useCallback } from "react";
import equipmentService from "../services/equipmentService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Tools() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEq, setSelectedEq] = useState(null);
  const [activeTab, setActiveTab] = useState("maintenance"); // 'maintenance' | 'fuel' | 'repairs'
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);

  // Forms
  const [eqForm, setEqForm] = useState({
    farm_id: "",
    name: "",
    type: "Tractor",
    model: "John Deere 5075E",
    serial_number: "",
    status: "operational",
    purchase_price: 35000,
  });

  const [maintForm, setMaintForm] = useState({
    service_type: "50-Hour Oil & Filter Change",
    scheduled_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [fuelForm, setFuelForm] = useState({
    liters: 45,
    cost: 75.0,
    log_date: new Date().toISOString().split("T")[0],
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !eqForm.farm_id) {
        setEqForm((prev) => ({ ...prev, farm_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [eqForm.farm_id]);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await equipmentService.getEquipment();
      setEquipmentList(data);
      if (data.length > 0 && !selectedEq) {
        setSelectedEq(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load equipment fleet.");
    } finally {
      setLoading(false);
    }
  }, [selectedEq]);

  const fetchEqDetails = useCallback(async (eqId) => {
    try {
      const [mLog, fLog, rLog] = await Promise.all([
        equipmentService.getMaintenance(eqId),
        equipmentService.getFuelLogs(eqId),
        equipmentService.getRepairs(eqId),
      ]);
      setMaintenanceLogs(mLog);
      setFuelLogs(fLog);
      setRepairs(rLog);
    } catch (err) {
      console.error("Failed to load machinery service logs:", err);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
    fetchEquipment();
  }, [fetchFarms, fetchEquipment]);

  useEffect(() => {
    if (selectedEq?.id) {
      fetchEqDetails(selectedEq.id);
    }
  }, [selectedEq, fetchEqDetails]);

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!eqForm.name.trim()) return;

    try {
      setSubmitting(true);
      await equipmentService.createEquipment(eqForm);
      setIsEqModalOpen(false);
      await fetchEquipment();
    } catch (err) {
      alert(err.message || "Failed to add machinery.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedEq) return;

    try {
      setSubmitting(true);
      await equipmentService.createMaintenance(selectedEq.id, maintForm);
      setIsMaintModalOpen(false);
      await fetchEqDetails(selectedEq.id);
    } catch (err) {
      alert(err.message || "Failed to log maintenance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFuel = async (e) => {
    e.preventDefault();
    if (!selectedEq) return;

    try {
      setSubmitting(true);
      await equipmentService.createFuelLog(selectedEq.id, fuelForm);
      setIsFuelModalOpen(false);
      await fetchEqDetails(selectedEq.id);
    } catch (err) {
      alert(err.message || "Failed to log fuel.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Equipment & Machinery Fleet</h1>
          <p>Manage tractors, harvesters, implements, fuel logs, and scheduled maintenance.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsEqModalOpen(true)}
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
            + Register Machinery
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && equipmentList.length === 0 ? (
        <Loading message="Loading equipment fleet..." />
      ) : equipmentList.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
          <h4>No Equipment Registered</h4>
          <p>Click "+ Register Machinery" to log tractors, plows, and harvesters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Machinery List */}
          <div>
            <h3 style={{ color: "var(--color-forest)", marginBottom: "12px" }}>Equipment Fleet ({equipmentList.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {equipmentList.map((eq) => {
                const isSelected = selectedEq?.id === eq.id;
                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEq(eq)}
                    className="content-card"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "var(--color-gold, #D4A54A)" : "rgba(212,165,74,0.2)",
                      backgroundColor: isSelected ? "rgba(245, 234, 208, 0.45)" : "#FFF",
                      padding: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "var(--color-forest)" }}>🚜 {eq.name}</h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: eq.status === "operational" ? "#E8F5E9" : "#FFEBEE",
                          color: eq.status === "operational" ? "#2E7D32" : "#C62828",
                          textTransform: "uppercase",
                        }}
                      >
                        {eq.status || "Operational"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                      {eq.type} &bull; {eq.model || "Standard Model"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machinery Details */}
          <div>
            {selectedEq && (
              <div>
                <div className="content-card" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: 0, color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{selectedEq.name}</h2>
                      <p style={{ margin: "4px 0 0", color: "var(--color-charcoal-60)" }}>
                        {selectedEq.type} &bull; Model: <strong>{selectedEq.model || "N/A"}</strong> &bull; S/N: <strong>{selectedEq.serial_number || "Not logged"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderBottom: "1px solid rgba(30,70,50,0.1)" }}>
                    {[
                      { id: "maintenance", label: `Maintenance (${maintenanceLogs.length})` },
                      { id: "fuel", label: `Fuel Usage (${fuelLogs.length})` },
                      { id: "repairs", label: `Repairs (${repairs.length})` },
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

                {/* Tab: Maintenance */}
                {activeTab === "maintenance" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsMaintModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Maintenance
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {maintenanceLogs.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No maintenance records logged for this machine.</p>
                        </div>
                      ) : (
                        maintenanceLogs.map((m) => (
                          <div key={m.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>🛠️ {m.service_type || "Routine Service"}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Scheduled Date: <strong>{m.scheduled_date}</strong> {m.notes ? `| ${m.notes}` : ""}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Fuel */}
                {activeTab === "fuel" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsFuelModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Fuel Refill
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {fuelLogs.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No fuel refill records recorded.</p>
                        </div>
                      ) : (
                        fuelLogs.map((f) => (
                          <div key={f.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>⛽ {f.liters} Liters Refueled</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Cost: <strong>${f.cost || "0.00"}</strong> &bull; Date: <strong>{f.log_date}</strong>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Repairs */}
                {activeTab === "repairs" && (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {repairs.length === 0 ? (
                      <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                        <p>No repair history recorded.</p>
                      </div>
                    ) : (
                      repairs.map((r) => (
                        <div key={r.id} className="content-card">
                          <h4 style={{ margin: "0 0 4px" }}>🔧 {r.repair_description || "Repair Job"}</h4>
                          <p style={{ fontSize: "0.85rem", margin: 0 }}>
                            Cost: <strong>${r.cost || "0.00"}</strong> &bull; Date: <strong>{r.repair_date}</strong>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Register Equipment */}
      <Modal isOpen={isEqModalOpen} onClose={() => setIsEqModalOpen(false)} title="Register Farm Equipment">
        <form onSubmit={handleSaveEquipment} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Farm Estate</label>
            <select
              value={eqForm.farm_id}
              onChange={(e) => setEqForm({ ...eqForm, farm_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Machinery Name *</label>
            <input
              type="text"
              required
              value={eqForm.name}
              onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
              placeholder="e.g. Primary John Deere Tractor"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Type</label>
              <select
                value={eqForm.type}
                onChange={(e) => setEqForm({ ...eqForm, type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Tractor">Tractor</option>
                <option value="Harvester">Harvester</option>
                <option value="Planter">Planter</option>
                <option value="Plow">Plow</option>
                <option value="Sprayer">Sprayer</option>
                <option value="Trailer">Trailer</option>
                <option value="Generator">Generator</option>
              </select>
            </div>
            <div className="form-field">
              <label>Model</label>
              <input
                type="text"
                value={eqForm.model}
                onChange={(e) => setEqForm({ ...eqForm, model: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Register Machinery"}
          </button>
        </form>
      </Modal>

      {/* Modal: Maintenance */}
      <Modal isOpen={isMaintModalOpen} onClose={() => setIsMaintModalOpen(false)} title="Log Scheduled Maintenance">
        <form onSubmit={handleSaveMaintenance} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Service Description *</label>
            <input
              type="text"
              required
              value={maintForm.service_type}
              onChange={(e) => setMaintForm({ ...maintForm, service_type: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Date</label>
            <input
              type="date"
              value={maintForm.scheduled_date}
              onChange={(e) => setMaintForm({ ...maintForm, scheduled_date: e.target.value })}
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Maintenance"}
          </button>
        </form>
      </Modal>

      {/* Modal: Fuel */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel Refill">
        <form onSubmit={handleSaveFuel} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Liters Refueled *</label>
              <input
                type="number"
                required
                value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={fuelForm.cost}
                onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Fuel"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Tools;