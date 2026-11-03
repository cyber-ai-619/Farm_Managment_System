import { useState, useEffect, useCallback, useMemo } from "react";
import irrigationService from "../services/irrigationService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Irrigation() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [fields, setFields] = useState([]);
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
    source_type: "borehole",
    capacity_litres: 60000,
    current_level_litres: 52000,
    ph_level: 6.8,
    location_description: "",
  });

  const [systemForm, setSystemForm] = useState({
    name: "",
    system_type: "drip",
    field_id: "",
    water_source_id: "",
    coverage_area_ha: 5.0,
    // Drip specific
    drip_lines_count: 50,
    drip_line_length_m: 100,
    line_spacing_m: 1.0,
    emitter_spacing_m: 0.3,
    emitter_flow_rate_lph: 1.6,
    filtration_type: "Disc Filter (120 Mesh)",
    // Sprinkler / Pivot specific
    sprinkler_heads_count: 24,
    sprinkler_radius_m: 12.0,
    operating_pressure_bar: 3.0,
    pivot_spans_count: 3,
    pivot_length_m: 150,
    pipe_diameter_mm: 63,
    flow_rate_lpm: 120,
    status: "active",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const reloadIrrigationData = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      const [sourcesData, systemsData, fieldsData] = await Promise.all([
        irrigationService.getSources(farmId).catch(() => []),
        irrigationService.getSystems(farmId).catch(() => []),
        farmService.getFields(farmId).catch(() => []),
      ]);
      setSources(sourcesData);
      setSystems(systemsData);
      setFields(fieldsData);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load irrigation data.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await farmService.getFarms();
        if (!ignore) {
          setFarms(data);
          if (data.length > 0 && !selectedFarmId) {
            setSelectedFarmId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load farms:", err);
      }
    })();
    return () => { ignore = true; };
  }, [selectedFarmId]);

  useEffect(() => {
    let ignore = false;
    if (!selectedFarmId) return;
    (async () => {
      try {
        const [sourcesData, systemsData, fieldsData] = await Promise.all([
          irrigationService.getSources(selectedFarmId).catch(() => []),
          irrigationService.getSystems(selectedFarmId).catch(() => []),
          farmService.getFields(selectedFarmId).catch(() => []),
        ]);
        if (!ignore) {
          setSources(sourcesData);
          setSystems(systemsData);
          setFields(fieldsData);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load irrigation data.");
          setLoading(false);
        }
      }
    })();
    return () => { ignore = true; };
  }, [selectedFarmId]);

  // Live calculations for the system form
  const modalCalculations = useMemo(() => {
    if (systemForm.system_type === "drip") {
      const lines = Number(systemForm.drip_lines_count) || 0;
      const length = Number(systemForm.drip_line_length_m) || 0;
      const spacing = Number(systemForm.emitter_spacing_m) || 0.3;
      const flowPerEmitter = Number(systemForm.emitter_flow_rate_lph) || 1.6;

      const totalTubingMeters = lines * length;
      const totalEmitters = spacing > 0 ? Math.round(totalTubingMeters / spacing) : 0;
      const totalWaterLph = Math.round(totalEmitters * flowPerEmitter);
      const totalWaterLpm = (totalWaterLph / 60).toFixed(1);

      return {
        totalTubingMeters,
        totalEmitters,
        totalWaterLph,
        totalWaterLpm,
      };
    }
    return null;
  }, [systemForm]);

  const handleSaveSource = async (e) => {
    e.preventDefault();
    if (!selectedFarmId || !sourceForm.name.trim()) return;

    try {
      setSubmitting(true);
      await irrigationService.createSource(selectedFarmId, {
        ...sourceForm,
        capacity_litres: Number(sourceForm.capacity_litres || 0),
        current_level_litres: Number(sourceForm.current_level_litres || 0),
        ph_level: sourceForm.ph_level ? Number(sourceForm.ph_level) : null,
      });
      setIsSourceModalOpen(false);
      setSourceForm({
        name: "",
        source_type: "borehole",
        capacity_litres: 60000,
        current_level_litres: 52000,
        ph_level: 6.8,
        location_description: "",
      });
      await reloadIrrigationData(selectedFarmId);
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
      await irrigationService.createSystem(selectedFarmId, {
        ...systemForm,
        type: systemForm.system_type,
        coverage_area_ha: Number(systemForm.coverage_area_ha || 0),
        drip_lines_count: systemForm.drip_lines_count ? Number(systemForm.drip_lines_count) : null,
        drip_line_length_m: systemForm.drip_line_length_m ? Number(systemForm.drip_line_length_m) : null,
        line_spacing_m: systemForm.line_spacing_m ? Number(systemForm.line_spacing_m) : null,
        emitter_spacing_m: systemForm.emitter_spacing_m ? Number(systemForm.emitter_spacing_m) : null,
        emitter_flow_rate_lph: systemForm.emitter_flow_rate_lph ? Number(systemForm.emitter_flow_rate_lph) : null,
        sprinkler_heads_count: systemForm.sprinkler_heads_count ? Number(systemForm.sprinkler_heads_count) : null,
        sprinkler_radius_m: systemForm.sprinkler_radius_m ? Number(systemForm.sprinkler_radius_m) : null,
        operating_pressure_bar: systemForm.operating_pressure_bar ? Number(systemForm.operating_pressure_bar) : null,
        pivot_spans_count: systemForm.pivot_spans_count ? Number(systemForm.pivot_spans_count) : null,
        pivot_length_m: systemForm.pivot_length_m ? Number(systemForm.pivot_length_m) : null,
        pipe_diameter_mm: systemForm.pipe_diameter_mm ? Number(systemForm.pipe_diameter_mm) : null,
        flow_rate_lpm: systemForm.flow_rate_lpm ? Number(systemForm.flow_rate_lpm) : null,
      });
      setIsSystemModalOpen(false);
      await reloadIrrigationData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to save irrigation system.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Irrigation & Water Infrastructure</h1>
          <p>Field coverage sizing, lateral drip line networks, center pivot engineering, and water reservoir monitoring.</p>
        </div>
        {canManage && (
          <div className="page-header-actions">
            <button
              type="button"
              onClick={() => setIsSourceModalOpen(true)}
              className="btn-secondary"
            >
              + Add Water Source
            </button>
            <button
              type="button"
              onClick={() => setIsSystemModalOpen(true)}
              className="btn-primary"
            >
              + Add Irrigation System
            </button>
          </div>
        )}
      </div>

      {/* Farm Selector Bar */}
      <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "14px 20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
          <span style={{ fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
            Fields Available: <strong>{fields.length}</strong>
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", fontSize: "0.85rem" }}>
          <span style={{ backgroundColor: "#E3F2FD", color: "#1565C0", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
            💧 {sources.length} Water Sources
          </span>
          <span style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
            🚿 {systems.length} Irrigation Systems
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && sources.length === 0 && systems.length === 0 ? (
        <Loading message="Loading water management systems..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: "24px" }}>
          {/* Water Sources Column */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ color: "var(--color-forest)", margin: 0, fontSize: "1.15rem" }}>
                💧 Water Reservoirs & Sources ({sources.length})
              </h3>
            </div>
            {sources.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                <p style={{ margin: 0, color: "var(--color-charcoal-60)" }}>No water reservoirs, boreholes, or river pumps recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sources.map((s) => {
                  const capacity = Number(s.capacity_litres || s.capacity_liters || 0);
                  const current = Number(s.current_level_litres || s.current_level_liters || 0);
                  const percent = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : 100;
                  return (
                    <div key={s.id} className="content-card" style={{ padding: "16px", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--color-forest)" }}>{s.name}</h4>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1565C0", textTransform: "uppercase" }}>
                            {s.type || s.source_type}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "1.05rem", fontWeight: 700, color: percent < 25 ? "#C62828" : "#2E7D32" }}>
                            {percent}%
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Level</div>
                        </div>
                      </div>

                      {/* Visual reservoir level bar */}
                      <div style={{ width: "100%", height: "8px", backgroundColor: "#E0E0E0", borderRadius: "4px", margin: "10px 0 8px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            backgroundColor: percent < 25 ? "#C62828" : percent < 50 ? "#FB8C00" : "#1E88E5",
                            borderRadius: "4px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-charcoal-80)" }}>
                        <span>Current: <strong>{current.toLocaleString()} L</strong></span>
                        <span>Capacity: <strong>{capacity.toLocaleString()} L</strong></span>
                      </div>
                      {s.ph_level && (
                        <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>
                          Water Quality pH: <strong>{s.ph_level}</strong>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Irrigation Systems Column */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ color: "var(--color-forest)", margin: 0, fontSize: "1.15rem" }}>
                🚿 Irrigation Systems & Drip Networks ({systems.length})
              </h3>
            </div>
            {systems.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🌱</div>
                <h4>No Irrigation Systems Installed</h4>
                <p style={{ color: "var(--color-charcoal-60)", maxWidth: "450px", margin: "8px auto 20px" }}>
                  Configure drip lateral networks, line numbers, emitter flow rates, or pivot sprinkler systems to monitor exact field coverage.
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsSystemModalOpen(true)}
                    className="btn-primary"
                  >
                    + Add Irrigation System
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {systems.map((sys) => {
                  const isDrip = sys.type === "drip" || sys.system_type === "drip";
                  const isPivot = sys.type === "center_pivot" || sys.system_type === "center_pivot" || sys.type === "pivot";
                  const isSprinkler = sys.type === "sprinkler" || sys.system_type === "sprinkler";

                  // Sizing calculations
                  const totalDripMeters = sys.total_drip_length_m || (sys.drip_lines_count && sys.drip_line_length_m ? (sys.drip_lines_count * sys.drip_line_length_m) : null);
                  const totalEmitters = totalDripMeters && sys.emitter_spacing_m ? Math.round(totalDripMeters / sys.emitter_spacing_m) : null;
                  const totalDeliveryLph = totalEmitters && sys.emitter_flow_rate_lph ? Math.round(totalEmitters * sys.emitter_flow_rate_lph) : null;

                  return (
                    <div key={sys.id} className="content-card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid rgba(30,70,50,0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-forest)" }}>
                              {isDrip ? "💧" : isPivot ? "🔄" : "🚿"} {sys.name}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "2px 10px",
                                borderRadius: "10px",
                                backgroundColor: isDrip ? "#E0F2F1" : isPivot ? "#EDE7F6" : "#E1F5FE",
                                color: isDrip ? "#00695C" : isPivot ? "#4527A0" : "#0277BD",
                                textTransform: "uppercase",
                              }}
                            >
                              {isDrip ? "Drip Line System" : isPivot ? "Center Pivot" : sys.type || sys.system_type}
                            </span>
                          </div>
                          <p style={{ marginTop: "4px", marginBottom: 0, fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                            Field Assigned: <strong>{sys.field_name ? `${sys.field_name} (${sys.field_area_ha ? `${sys.field_area_ha} ha` : ""})` : "General Farm Zone"}</strong>
                            {sys.source_name && ` • Source: ${sys.source_name}`}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "12px",
                              backgroundColor: sys.status === "active" ? "#E8F5E9" : "#FFF3E0",
                              color: sys.status === "active" ? "#2E7D32" : "#E65100",
                              textTransform: "uppercase",
                            }}
                          >
                            {sys.status || "Active"}
                          </span>
                        </div>
                      </div>

                      {/* Coverage and Technical Specification Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", margin: "14px 0", padding: "12px", backgroundColor: "#F9FAF9", borderRadius: "8px" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Coverage Area</span>
                          <p style={{ fontWeight: 700, margin: "2px 0 0", color: "var(--color-forest)", fontSize: "0.95rem" }}>
                            {sys.coverage_area_ha ? `${sys.coverage_area_ha} Hectares` : "Not specified"}
                          </p>
                        </div>

                        {/* Drip Details */}
                        {isDrip && (
                          <>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Drip Lateral Lines</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.drip_lines_count ? `${sys.drip_lines_count} Lines` : "N/A"}
                                {sys.drip_line_length_m ? ` @ ${sys.drip_line_length_m}m` : ""}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Total Tubing Length</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0", color: "#1565C0" }}>
                                {totalDripMeters ? `${totalDripMeters.toLocaleString()} m (${(totalDripMeters / 1000).toFixed(2)} km)` : "N/A"}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Emitter Spacing & Flow</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.emitter_spacing_m ? `${sys.emitter_spacing_m}m` : "0.3m"} &bull; {sys.emitter_flow_rate_lph ? `${sys.emitter_flow_rate_lph} L/h` : "1.6 L/h"}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Pivot Details */}
                        {isPivot && (
                          <>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Pivot Spans & Arm</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.pivot_spans_count ? `${sys.pivot_spans_count} Spans` : "N/A"}
                                {sys.pivot_length_m ? ` (${sys.pivot_length_m}m arm)` : ""}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Operating Pressure</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0", color: "#E65100" }}>
                                {sys.operating_pressure_bar ? `${sys.operating_pressure_bar} Bar` : "3.0 Bar"}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Flow Rate</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.flow_rate_lpm ? `${sys.flow_rate_lpm} L/min` : "Standard"}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Sprinkler Details */}
                        {isSprinkler && (
                          <>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Sprinkler Heads</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.sprinkler_heads_count ? `${sys.sprinkler_heads_count} Nozzles` : "N/A"}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Wetted Throw Radius</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0" }}>
                                {sys.sprinkler_radius_m ? `${sys.sprinkler_radius_m} m` : "N/A"}
                              </p>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Pressure & Flow</span>
                              <p style={{ fontWeight: 700, margin: "2px 0 0", color: "#1565C0" }}>
                                {sys.operating_pressure_bar ? `${sys.operating_pressure_bar} Bar` : "2.5 Bar"} &bull; {sys.flow_rate_lpm ? `${sys.flow_rate_lpm} LPM` : ""}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Technical Footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--color-charcoal-80)", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                          {sys.filtration_type && (
                            <span>🛡️ Filtration: <strong>{sys.filtration_type}</strong></span>
                          )}
                          {isDrip && totalEmitters && (
                            <span>💧 Approx. <strong>{totalEmitters.toLocaleString()}</strong> Dripper Outlets</span>
                          )}
                          {isDrip && totalDeliveryLph && (
                            <span>⚡ Delivery: <strong>{(totalDeliveryLph / 1000).toFixed(1)} m³/hr</strong></span>
                          )}
                        </div>
                        {sys.installation_date && (
                          <div style={{ color: "var(--color-charcoal-60)" }}>
                            Installed: {sys.installation_date}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Water Source */}
      <Modal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} title="Register Water Source / Reservoir">
        <form onSubmit={handleSaveSource} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Source Name *</label>
            <input
              type="text"
              required
              value={sourceForm.name}
              onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
              placeholder="e.g. South Borehole #1 / Kafue River Pump / Main Farm Dam"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Source Type</label>
              <select
                value={sourceForm.source_type}
                onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="borehole">Borehole / Deep Well</option>
                <option value="dam">Farm Dam / Reservoir</option>
                <option value="river">River Intake Pump</option>
                <option value="rainwater">Rainwater Harvesting Tank</option>
                <option value="canal">Irrigation Canal</option>
                <option value="municipal">Municipal / Utility</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Water pH Level</label>
              <input
                type="number"
                step="0.1"
                value={sourceForm.ph_level}
                onChange={(e) => setSourceForm({ ...sourceForm, ph_level: e.target.value })}
                placeholder="e.g. 6.8"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Total Capacity (Litres)</label>
              <input
                type="number"
                required
                value={sourceForm.capacity_litres}
                onChange={(e) => setSourceForm({ ...sourceForm, capacity_litres: e.target.value })}
                placeholder="e.g. 60000"
              />
            </div>
            <div className="form-field">
              <label>Current Water Level (Litres)</label>
              <input
                type="number"
                required
                value={sourceForm.current_level_litres}
                onChange={(e) => setSourceForm({ ...sourceForm, current_level_litres: e.target.value })}
                placeholder="e.g. 52000"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Location & Intake Notes</label>
            <input
              type="text"
              value={sourceForm.location_description}
              onChange={(e) => setSourceForm({ ...sourceForm, location_description: e.target.value })}
              placeholder="e.g. Located on East boundary, equipped with 7.5kW submersible pump"
            />
          </div>

          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Water Source..." : "Save Water Source"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add System */}
      <Modal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} title="Add Irrigation System & Sizing">
        <form onSubmit={handleSaveSystem} style={{ display: "grid", gap: "14px", maxHeight: "80vh", overflowY: "auto", paddingRight: "4px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>System Name *</label>
              <input
                type="text"
                required
                value={systemForm.name}
                onChange={(e) => setSystemForm({ ...systemForm, name: e.target.value })}
                placeholder="e.g. Block B Commercial Drip Network"
              />
            </div>
            <div className="form-field">
              <label>System Type *</label>
              <select
                value={systemForm.system_type}
                onChange={(e) => setSystemForm({ ...systemForm, system_type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="drip">Drip Irrigation (Lateral Tubing)</option>
                <option value="center_pivot">Center Pivot (Circular Arm)</option>
                <option value="sprinkler">Overhead Sprinkler System</option>
                <option value="micro_spray">Micro Spray / Jet</option>
                <option value="flood">Flood / Furrow</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Target Field *</label>
              <select
                value={systemForm.field_id}
                onChange={(e) => {
                  const fid = e.target.value;
                  const f = fields.find((item) => String(item.id) === String(fid));
                  setSystemForm({
                    ...systemForm,
                    field_id: fid,
                    coverage_area_ha: (f?.area_ha ?? f?.area_hectares) || systemForm.coverage_area_ha,
                  });
                }}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="">-- Select Field --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f?.area_ha ?? f?.area_hectares} ha)</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Water Supply Source</label>
              <select
                value={systemForm.water_source_id}
                onChange={(e) => setSystemForm({ ...systemForm, water_source_id: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="">-- Select Water Source --</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type || s.source_type})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Field Coverage Area (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={systemForm.coverage_area_ha}
                onChange={(e) => setSystemForm({ ...systemForm, coverage_area_ha: e.target.value })}
                placeholder="e.g. 5.5"
              />
            </div>
          </div>

          {/* Drip Irrigation Detailed Specifications */}
          {systemForm.system_type === "drip" && (
            <div style={{ padding: "14px", backgroundColor: "#E0F2F1", borderRadius: "8px", border: "1px solid rgba(0,105,92,0.2)" }}>
              <h4 style={{ margin: "0 0 10px", color: "#004D40", fontSize: "0.95rem" }}>
                💧 Drip Irrigation Lateral Engineering & Sizing
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label>Number of Drip Lateral Lines *</label>
                  <input
                    type="number"
                    value={systemForm.drip_lines_count}
                    onChange={(e) => setSystemForm({ ...systemForm, drip_lines_count: e.target.value })}
                    placeholder="e.g. 50 lines"
                  />
                </div>
                <div className="form-field">
                  <label>Average Drip Line Length (Meters) *</label>
                  <input
                    type="number"
                    value={systemForm.drip_line_length_m}
                    onChange={(e) => setSystemForm({ ...systemForm, drip_line_length_m: e.target.value })}
                    placeholder="e.g. 100 meters"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "10px" }}>
                <div className="form-field">
                  <label>Row / Line Spacing (Meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemForm.line_spacing_m}
                    onChange={(e) => setSystemForm({ ...systemForm, line_spacing_m: e.target.value })}
                    placeholder="e.g. 1.0"
                  />
                </div>
                <div className="form-field">
                  <label>Emitter Spacing (Meters)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={systemForm.emitter_spacing_m}
                    onChange={(e) => setSystemForm({ ...systemForm, emitter_spacing_m: e.target.value })}
                    placeholder="e.g. 0.3"
                  />
                </div>
                <div className="form-field">
                  <label>Emitter Flow Rate (Litres/Hour)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemForm.emitter_flow_rate_lph}
                    onChange={(e) => setSystemForm({ ...systemForm, emitter_flow_rate_lph: e.target.value })}
                    placeholder="e.g. 1.6"
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginTop: "10px" }}>
                <label>Filtration & Station Type</label>
                <select
                  value={systemForm.filtration_type}
                  onChange={(e) => setSystemForm({ ...systemForm, filtration_type: e.target.value })}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
                >
                  <option value="Disc Filter (120 Mesh)">Disc Filter (120 Mesh / 130 Micron)</option>
                  <option value="Screen Filter (120 Mesh)">Screen Filter (120 Mesh)</option>
                  <option value="Sand Media / Gravel Filter">Sand Media / Gravel Filter</option>
                  <option value="Hydrocyclone Sand Separator">Hydrocyclone Sand Separator</option>
                  <option value="Automatic Backwash Station">Automatic Self-Cleaning Station</option>
                </select>
              </div>

              {/* Dynamic Live Calculations */}
              {modalCalculations && (
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#FFF", borderRadius: "6px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Total Lateral Tubing</span>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#00695C" }}>
                      {modalCalculations.totalTubingMeters.toLocaleString()} m ({(modalCalculations.totalTubingMeters / 1000).toFixed(2)} km)
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Estimated Drippers</span>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#00695C" }}>
                      {modalCalculations.totalEmitters.toLocaleString()} Emitters
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Water Delivery Demand</span>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#00695C" }}>
                      {modalCalculations.totalWaterLpm} L/min ({(modalCalculations.totalWaterLph / 1000).toFixed(1)} m³/hr)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Center Pivot Detailed Specifications */}
          {systemForm.system_type === "center_pivot" && (
            <div style={{ padding: "14px", backgroundColor: "#EDE7F6", borderRadius: "8px", border: "1px solid rgba(81,45,168,0.2)" }}>
              <h4 style={{ margin: "0 0 10px", color: "#4527A0", fontSize: "0.95rem" }}>
                🔄 Center Pivot Engineering & Sizing
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label>Number of Spans</label>
                  <input
                    type="number"
                    value={systemForm.pivot_spans_count}
                    onChange={(e) => setSystemForm({ ...systemForm, pivot_spans_count: e.target.value })}
                    placeholder="e.g. 3 spans + overhang"
                  />
                </div>
                <div className="form-field">
                  <label>Total Arm Radius / Length (Meters)</label>
                  <input
                    type="number"
                    value={systemForm.pivot_length_m}
                    onChange={(e) => setSystemForm({ ...systemForm, pivot_length_m: e.target.value })}
                    placeholder="e.g. 150 meters"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                <div className="form-field">
                  <label>Operating Pressure (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemForm.operating_pressure_bar}
                    onChange={(e) => setSystemForm({ ...systemForm, operating_pressure_bar: e.target.value })}
                    placeholder="e.g. 3.0"
                  />
                </div>
                <div className="form-field">
                  <label>Mainline Pipe Diameter (mm)</label>
                  <input
                    type="number"
                    value={systemForm.pipe_diameter_mm}
                    onChange={(e) => setSystemForm({ ...systemForm, pipe_diameter_mm: e.target.value })}
                    placeholder="e.g. 168 mm / 6 inch"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sprinkler Detailed Specifications */}
          {(systemForm.system_type === "sprinkler" || systemForm.system_type === "micro_spray") && (
            <div style={{ padding: "14px", backgroundColor: "#E1F5FE", borderRadius: "8px", border: "1px solid rgba(2,119,189,0.2)" }}>
              <h4 style={{ margin: "0 0 10px", color: "#01579B", fontSize: "0.95rem" }}>
                🚿 Sprinkler Network Sizing
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label>Sprinkler Heads / Nozzles Count</label>
                  <input
                    type="number"
                    value={systemForm.sprinkler_heads_count}
                    onChange={(e) => setSystemForm({ ...systemForm, sprinkler_heads_count: e.target.value })}
                    placeholder="e.g. 36"
                  />
                </div>
                <div className="form-field">
                  <label>Wetted Throw Radius (Meters)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={systemForm.sprinkler_radius_m}
                    onChange={(e) => setSystemForm({ ...systemForm, sprinkler_radius_m: e.target.value })}
                    placeholder="e.g. 12.5"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                <div className="form-field">
                  <label>Operating Pressure (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemForm.operating_pressure_bar}
                    onChange={(e) => setSystemForm({ ...systemForm, operating_pressure_bar: e.target.value })}
                    placeholder="e.g. 2.5"
                  />
                </div>
                <div className="form-field">
                  <label>System Flow Rate (LPM)</label>
                  <input
                    type="number"
                    value={systemForm.flow_rate_lpm}
                    onChange={(e) => setSystemForm({ ...systemForm, flow_rate_lpm: e.target.value })}
                    placeholder="e.g. 180"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-field">
            <label>Installation & Operational Notes</label>
            <textarea
              rows="2"
              value={systemForm.notes}
              onChange={(e) => setSystemForm({ ...systemForm, notes: e.target.value })}
              placeholder="e.g. Pressure regulator set at 1.8 bar, installed with flush valves on end lines."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            />
          </div>

          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Irrigation System..." : "Save Irrigation System"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Irrigation;