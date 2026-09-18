import { useState, useEffect, useCallback } from "react";
import pestDiseaseService from "../services/pestDiseaseService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function PestDisease() {
  const { role } = useAuth();
  const [pests, setPests] = useState([]);
  const [scoutingLogs, setScoutingLogs] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [activeTab, setActiveTab] = useState("scouting"); // 'scouting' | 'catalog' | 'outbreaks'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isPestModalOpen, setIsPestModalOpen] = useState(false);
  const [isScoutingModalOpen, setIsScoutingModalOpen] = useState(false);

  // Forms
  const [pestForm, setPestForm] = useState({
    name: "Fall Armyworm",
    scientific_name: "Spodoptera frugiperda",
    type: "Pest",
    symptoms: "Window pane damage on leaves, ragged holes in maize whorls",
    treatment_recommendation: "Apply Emamectin benzoate or Neem oil spray",
  });

  const [scoutingForm, setScoutingForm] = useState({
    field_id: "",
    pest_id: "",
    scouting_date: new Date().toISOString().split("T")[0],
    severity: "medium",
    affected_area_percentage: 15,
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchPestData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [pData, sData, oData, fData] = await Promise.all([
        pestDiseaseService.getPests(),
        pestDiseaseService.getScoutingLogs(),
        pestDiseaseService.getOutbreaks().catch(() => []),
        farmService.getFarms().catch(() => []),
      ]);
      setPests(pData);
      setScoutingLogs(sData);
      setOutbreaks(oData);
      setFarms(fData);

      if (pData.length > 0 && !scoutingForm.pest_id) {
        setScoutingForm((prev) => ({ ...prev, pest_id: pData[0].id }));
      }

      if (fData.length > 0) {
        const fieldsData = await farmService.getFields(fData[0].id);
        setFields(fieldsData);
        if (fieldsData.length > 0 && !scoutingForm.field_id) {
          setScoutingForm((prev) => ({ ...prev, field_id: fieldsData[0].id }));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load pest & disease logs.");
    } finally {
      setLoading(false);
    }
  }, [scoutingForm.pest_id, scoutingForm.field_id]);

  useEffect(() => {
    fetchPestData();
  }, [fetchPestData]);

  const handleSavePest = async (e) => {
    e.preventDefault();
    if (!pestForm.name.trim()) return;

    try {
      setSubmitting(true);
      await pestDiseaseService.createPest(pestForm);
      setIsPestModalOpen(false);
      await fetchPestData();
    } catch (err) {
      alert(err.message || "Failed to register pest/disease.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveScouting = async (e) => {
    e.preventDefault();
    if (!scoutingForm.field_id || !scoutingForm.pest_id) return;

    try {
      setSubmitting(true);
      await pestDiseaseService.createScoutingLog(scoutingForm);
      setIsScoutingModalOpen(false);
      await fetchPestData();
    } catch (err) {
      alert(err.message || "Failed to record scouting report.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Pest & Plant Disease Management</h1>
          <p>Scout field infestations, diagnose fungal/viral infections, and record chemical and bio-control treatments.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsPestModalOpen(true)}
              style={{ padding: "8px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Add to Pest Catalog
            </button>
            <button
              type="button"
              onClick={() => setIsScoutingModalOpen(true)}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest)", color: "#FFF", border: "1px solid var(--color-gold)", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Log Scouting Report
            </button>
          </div>
        )}
      </div>

      {outbreaks.length > 0 && (
        <div style={{ padding: "14px 20px", backgroundColor: "#FFEBEE", color: "#C62828", border: "1px solid #FFCDD2", borderRadius: "8px", marginBottom: "20px" }}>
          🚨 <strong>Outbreak Alert:</strong> High pest severity detected in {outbreaks.length} field(s)!
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="content-card" style={{ padding: "8px 16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { id: "scouting", label: `Field Scouting Reports (${scoutingLogs.length})` },
            { id: "catalog", label: `Pest & Disease Catalog (${pests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "8px 14px",
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

      {loading && scoutingLogs.length === 0 && pests.length === 0 ? (
        <Loading message="Loading pest & scouting records..." />
      ) : (
        <>
          {/* Tab 1: Scouting */}
          {activeTab === "scouting" && (
            <div style={{ display: "grid", gap: "12px" }}>
              {scoutingLogs.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                  <p>No scouting inspections logged yet. Click "+ Log Scouting Report" to record an inspection.</p>
                </div>
              ) : (
                scoutingLogs.map((s) => (
                  <div key={s.id} className="content-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px" }}>🐛 {s.pest_name || `Pest #${s.pest_id}`}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                        Field: <strong>{s.field_name || `Field #${s.field_id}`}</strong> &bull; Date: {s.scouting_date} &bull; Affected Area: <strong>{s.affected_area_percentage}%</strong>
                      </p>
                      {s.notes && <p style={{ margin: "2px 0 0", fontSize: "0.8rem", fontStyle: "italic" }}>"{s.notes}"</p>}
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: s.severity === "high" || s.severity === "critical" ? "#FFEBEE" : "#FFF3E0",
                        color: s.severity === "high" || s.severity === "critical" ? "#C62828" : "#E65100",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.severity || "Medium"} Severity
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Catalog */}
          {activeTab === "catalog" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {pests.length === 0 ? (
                <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px" }}>
                  <p>No pests or diseases in the catalog yet.</p>
                </div>
              ) : (
                pests.map((p) => (
                  <div key={p.id} className="content-card">
                    <h4 style={{ margin: 0, color: "var(--color-forest)" }}>{p.name}</h4>
                    <p style={{ margin: "2px 0 0", fontSize: "0.85rem", fontStyle: "italic" }}>{p.scientific_name || "Species"}</p>
                    <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
                      Type: <strong>{p.type || "Pest"}</strong>
                    </p>
                    {p.symptoms && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>
                        <strong>Symptoms:</strong> {p.symptoms}
                      </p>
                    )}
                    {p.treatment_recommendation && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--color-farm-green)" }}>
                        <strong>Recommended:</strong> {p.treatment_recommendation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Add Pest */}
      <Modal isOpen={isPestModalOpen} onClose={() => setIsPestModalOpen(false)} title="Add Pest or Disease to Catalog">
        <form onSubmit={handleSavePest} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Pest / Disease Name *</label>
            <input
              type="text"
              required
              value={pestForm.name}
              onChange={(e) => setPestForm({ ...pestForm, name: e.target.value })}
              placeholder="e.g. Fall Armyworm / Late Blight"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Scientific Name</label>
              <input
                type="text"
                value={pestForm.scientific_name}
                onChange={(e) => setPestForm({ ...pestForm, scientific_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={pestForm.type}
                onChange={(e) => setPestForm({ ...pestForm, type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Pest">Insect / Pest</option>
                <option value="Fungal">Fungal Disease</option>
                <option value="Bacterial">Bacterial Disease</option>
                <option value="Viral">Viral Disease</option>
                <option value="Weed">Invasive Weed</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Symptoms Description</label>
            <textarea
              rows={2}
              value={pestForm.symptoms}
              onChange={(e) => setPestForm({ ...pestForm, symptoms: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)", width: "100%", fontFamily: "inherit" }}
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add to Catalog"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add Scouting Log */}
      <Modal isOpen={isScoutingModalOpen} onClose={() => setIsScoutingModalOpen(false)} title="Log Field Scouting Inspection">
        <form onSubmit={handleSaveScouting} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Field *</label>
            <select
              value={scoutingForm.field_id}
              onChange={(e) => setScoutingForm({ ...scoutingForm, field_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              required
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Detected Pest / Disease *</label>
            <select
              value={scoutingForm.pest_id}
              onChange={(e) => setScoutingForm({ ...scoutingForm, pest_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              required
            >
              {pests.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Severity</label>
              <select
                value={scoutingForm.severity}
                onChange={(e) => setScoutingForm({ ...scoutingForm, severity: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="low">Low (Trace)</option>
                <option value="medium">Medium (Manageable)</option>
                <option value="high">High (Threatening)</option>
                <option value="critical">Critical (Outbreak)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Affected Area (%)</label>
              <input
                type="number"
                value={scoutingForm.affected_area_percentage}
                onChange={(e) => setScoutingForm({ ...scoutingForm, affected_area_percentage: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Scout Notes</label>
            <input
              type="text"
              value={scoutingForm.notes}
              onChange={(e) => setScoutingForm({ ...scoutingForm, notes: e.target.value })}
              placeholder="Concentrated in south-western corner of the plot"
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Save Scouting Report"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default PestDisease;