import { useState, useEffect, useCallback } from "react";
import irrigationService from "../services/irrigationService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Irrigation() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [sources, setSources] = useState([]);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // Forms
  const [sourceForm, setSourceForm] = useState({
    name: "",
    source_type: "Borehole",
    capacity_liters: 50000,
    current_level_liters: 45000,
  });

  const [systemForm, setSystemForm] = useState({
    name: "",
    system_type: "Drip",
    source_id: "",
    coverage_area_ha: 10,
    status: "active",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  const fetchIrrigationData = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError("");
      const [sourcesData, systemsData] = await Promise.all([
        irrigationService.getSources(farmId),
        irrigationService.getSystems(farmId),
      ]);
      setSources(sourcesData);
      setSystems(systemsData);
      if (sourcesData.length > 0 && !systemForm.source_id) {
        setSystemForm((prev) => ({ ...prev, source_id: sourcesData[0].id }));
      }
    } catch (err) {
      setError(err.message || "Failed to load irrigation data.");
    } finally {
      setLoading(false);
    }
  }, [systemForm.source_id]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      fetchIrrigationData(selectedFarmId);
    }
  }, [selectedFarmId, fetchIrrigationData]);

  const handleSaveSource = async (e) => {
    e.preventDefault();
    if (!selectedFarmId || !sourceForm.name.trim()) return;

    try {
      setSubmitting(true);
      await irrigationService.createSource(selectedFarmId, sourceForm);
      setIsSourceModalOpen(false);
      await fetchIrrigationData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to save water source.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSystem = async (e) => {
    e.preventDefault();
    if (!selectedFarmId || !systemForm.name.trim()) return;

    try {
      setSubmitting(true);
      await irrigationService.createSystem(selectedFarmId, systemForm);
      setIsSystemModalOpen(false);
      await fetchIrrigationData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to save irrigation system.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Irrigation & Water Management</h1>
          <p>Monitor water reservoirs, boreholes, drip lines, and irrigation delivery systems.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsSourceModalOpen(true)}
              style={{ padding: "8px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Add Water Source
            </button>
            <button
              type="button"
              onClick={() => setIsSystemModalOpen(true)}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest)", color: "#FFF", border: "1px solid var(--color-gold)", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Add Irrigation Line
            </button>
          </div>
        )}
      </div>

      {/* Farm Selector Bar */}
      <div className="content-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", marginBottom: "20px" }}>
        <label style={{ fontWeight: 700, color: "var(--color-forest)" }}>Select Farm Estate:</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)", minWidth: "220px" }}
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && sources.length === 0 && systems.length === 0 ? (
        <Loading message="Loading water management systems..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Water Sources */}
          <div>
            <h3 style={{ color: "var(--color-forest)", marginBottom: "12px" }}>💧 Water Sources ({sources.length})</h3>
            {sources.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                <p>No water reservoirs or boreholes recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sources.map((s) => (
                  <div key={s.id} className="content-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h4 style={{ margin: 0 }}>{s.name}</h4>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-farm-green)" }}>{s.source_type}</span>
                    </div>
                    <p style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                      Capacity: <strong>{Number(s.capacity_liters || 0).toLocaleString()} L</strong>
                    </p>
                    <p style={{ marginTop: "2px", fontSize: "0.85rem" }}>
                      Current Level: <strong>{Number(s.current_level_liters || 0).toLocaleString()} L</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Irrigation Systems */}
          <div>
            <h3 style={{ color: "var(--color-forest)", marginBottom: "12px" }}>🚿 Irrigation Systems ({systems.length})</h3>
            {systems.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                <p>No irrigation lines or sprinklers active.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {systems.map((sys) => (
                  <div key={sys.id} className="content-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h4 style={{ margin: 0 }}>{sys.name}</h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: sys.status === "active" ? "#E8F5E9" : "#FFF3E0",
                          color: sys.status === "active" ? "#2E7D32" : "#E65100",
                          textTransform: "uppercase",
                        }}
                      >
                        {sys.status || "Active"}
                      </span>
                    </div>
                    <p style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                      Type: <strong>{sys.system_type}</strong> &bull; Coverage: <strong>{sys.coverage_area_ha ? `${sys.coverage_area_ha} ha` : "N/A"}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Source */}
      <Modal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} title="Add Water Source">
        <form onSubmit={handleSaveSource} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Source Name *</label>
            <input
              type="text"
              required
              value={sourceForm.name}
              onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
              placeholder="e.g. South Borehole #1 / Main Reservoir"
            />
          </div>
          <div className="form-field">
            <label>Source Type</label>
            <select
              value={sourceForm.source_type}
              onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              <option value="Borehole">Borehole</option>
              <option value="Reservoir">Reservoir</option>
              <option value="River">River</option>
              <option value="Rainwater Tank">Rainwater Tank</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Capacity (Liters)</label>
              <input
                type="number"
                value={sourceForm.capacity_liters}
                onChange={(e) => setSourceForm({ ...sourceForm, capacity_liters: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Current Level (Liters)</label>
              <input
                type="number"
                value={sourceForm.current_level_liters}
                onChange={(e) => setSourceForm({ ...sourceForm, current_level_liters: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Source"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add System */}
      <Modal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} title="Add Irrigation System">
        <form onSubmit={handleSaveSystem} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>System Name *</label>
            <input
              type="text"
              required
              value={systemForm.name}
              onChange={(e) => setSystemForm({ ...systemForm, name: e.target.value })}
              placeholder="e.g. North Ridge Drip Line"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>System Type</label>
              <select
                value={systemForm.system_type}
                onChange={(e) => setSystemForm({ ...systemForm, system_type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Drip">Drip</option>
                <option value="Sprinkler">Sprinkler</option>
                <option value="Pivot">Center Pivot</option>
                <option value="Furrow">Furrow</option>
                <option value="Sub-surface">Sub-surface</option>
              </select>
            </div>
            <div className="form-field">
              <label>Coverage Area (ha)</label>
              <input
                type="number"
                value={systemForm.coverage_area_ha}
                onChange={(e) => setSystemForm({ ...systemForm, coverage_area_ha: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add System"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Irrigation;