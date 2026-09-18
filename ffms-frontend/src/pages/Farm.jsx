import { useState, useEffect, useCallback } from "react";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Farm() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // Form states
  const [farmForm, setFarmForm] = useState({
    name: "",
    location: "",
    total_area_ha: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [fieldForm, setFieldForm] = useState({
    name: "",
    size_ha: "",
    soil_type: "Loam",
    current_condition: "Good",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarm) {
        setSelectedFarm(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load farms.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarm]);

  const fetchFields = useCallback(async (farmId) => {
    try {
      setLoadingFields(true);
      const data = await farmService.getFields(farmId);
      setFields(data);
    } catch (err) {
      console.error("Failed to load fields:", err);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarm?.id) {
      fetchFields(selectedFarm.id);
    } else {
      setFields([]);
    }
  }, [selectedFarm, fetchFields]);

  const handleOpenFarmModal = (farm = null) => {
    if (farm) {
      setEditingFarm(farm);
      setFarmForm({
        name: farm.name || "",
        location: farm.location || "",
        total_area_ha: farm.total_area_ha || "",
        latitude: farm.latitude || "",
        longitude: farm.longitude || "",
        description: farm.description || "",
      });
    } else {
      setEditingFarm(null);
      setFarmForm({
        name: "",
        location: "",
        total_area_ha: "",
        latitude: "",
        longitude: "",
        description: "",
      });
    }
    setIsFarmModalOpen(true);
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    if (!farmForm.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingFarm) {
        await farmService.updateFarm(editingFarm.id, farmForm);
      } else {
        await farmService.createFarm(farmForm);
      }
      setIsFarmModalOpen(false);
      await fetchFarms();
    } catch (err) {
      alert(err.message || "Failed to save farm.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm("Are you sure you want to delete this farm? All fields and plots will be deleted.")) return;
    try {
      await farmService.deleteFarm(farmId);
      if (selectedFarm?.id === farmId) setSelectedFarm(null);
      await fetchFarms();
    } catch (err) {
      alert(err.message || "Failed to delete farm.");
    }
  };

  const handleOpenFieldModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        name: field.name || "",
        size_ha: field.size_ha || "",
        soil_type: field.soil_type || "Loam",
        current_condition: field.current_condition || "Good",
      });
    } else {
      setEditingField(null);
      setFieldForm({
        name: "",
        size_ha: "",
        soil_type: "Loam",
        current_condition: "Good",
      });
    }
    setIsFieldModalOpen(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!fieldForm.name.trim() || !selectedFarm) return;

    try {
      setSubmitting(true);
      if (editingField) {
        await farmService.updateField(editingField.id, fieldForm);
      } else {
        await farmService.createField(selectedFarm.id, fieldForm);
      }
      setIsFieldModalOpen(false);
      await fetchFields(selectedFarm.id);
    } catch (err) {
      alert(err.message || "Failed to save field.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field?")) return;
    try {
      await farmService.deleteField(fieldId);
      await fetchFields(selectedFarm.id);
    } catch (err) {
      alert(err.message || "Failed to delete field.");
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager"].includes(role);

  if (loading && farms.length === 0) {
    return <Loading message="Loading farm properties..." />;
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Farm & Land Management</h1>
          <p>Register and manage your farm properties, parcels, fields, and soil health.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => handleOpenFarmModal()}
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
            + Register New Farm
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {farms.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
          <h4>No Farms Registered Yet</h4>
          <p>Get started by clicking "+ Register New Farm" to register your first farm estate.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Farms Sidebar List */}
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--color-forest)", marginBottom: "12px" }}>Your Farm Estates ({farms.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {farms.map((f) => {
                const isSelected = selectedFarm?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFarm(f)}
                    className="content-card"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "var(--color-gold, #D4A54A)" : "rgba(212,165,74,0.2)",
                      backgroundColor: isSelected ? "rgba(245, 234, 208, 0.45)" : "#FFF",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ margin: 0 }}>{f.name}</h4>
                      {canManage && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFarmModal(f);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#2C5A3F", fontSize: "0.85rem" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFarm(f.id);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#7A4A52", fontSize: "0.85rem" }}
                          >
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                    <p style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                      📍 {f.location || "Location not specified"}
                    </p>
                    <p style={{ marginTop: "4px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-farm-green)" }}>
                      📐 {f.total_area_ha ? `${f.total_area_ha} ha` : "Area not set"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Farm & Fields Detail */}
          <div>
            {selectedFarm ? (
              <div>
                <div className="content-card" style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: 0, color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                        {selectedFarm.name}
                      </h2>
                      <p style={{ marginTop: "4px", color: "var(--color-charcoal-60)" }}>
                        {selectedFarm.description || "Active production farm property."}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenFieldModal()}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--color-wine, #7A4A52)",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        + Add Field
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(30,70,50,0.1)" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Total Estate Area</span>
                      <p style={{ fontWeight: 700, margin: 0, color: "var(--color-forest)" }}>{selectedFarm.total_area_ha ? `${selectedFarm.total_area_ha} ha` : "N/A"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>GPS Coordinates</span>
                      <p style={{ fontWeight: 700, margin: 0, color: "var(--color-forest)" }}>
                        {selectedFarm.latitude && selectedFarm.longitude ? `${selectedFarm.latitude}, ${selectedFarm.longitude}` : "Not logged"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Cultivated Fields</span>
                      <p style={{ fontWeight: 700, margin: 0, color: "var(--color-forest)" }}>{fields.length} Fields</p>
                    </div>
                  </div>
                </div>

                {/* Fields Section */}
                <h3 style={{ color: "var(--color-forest)", marginBottom: "14px" }}>Fields & Parcels</h3>
                {loadingFields ? (
                  <Loading message="Loading fields..." />
                ) : fields.length === 0 ? (
                  <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                    <p>No fields recorded under this farm estate yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                    {fields.map((field) => (
                      <div key={field.id} className="content-card" style={{ position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <h4>{field.name}</h4>
                          {canManage && (
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenFieldModal(field)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#2C5A3F", marginRight: "4px" }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteField(field.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#7A4A52" }}
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                        <p style={{ marginTop: "6px" }}>Size: <strong>{field.size_ha} ha</strong></p>
                        <p style={{ marginTop: "2px" }}>Soil Type: <strong>{field.soil_type || "Loam"}</strong></p>
                        <p style={{ marginTop: "2px" }}>Condition: <span style={{ color: "var(--color-farm-green)", fontWeight: 600 }}>{field.current_condition || "Good"}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="content-card" style={{ padding: "40px", textAlign: "center" }}>
                <p>Select a farm to view its fields and parcels.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Farm Modal */}
      <Modal
        isOpen={isFarmModalOpen}
        onClose={() => setIsFarmModalOpen(false)}
        title={editingFarm ? "Edit Farm Estate" : "Register New Farm"}
      >
        <form onSubmit={handleSaveFarm} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Farm Name *</label>
            <input
              type="text"
              required
              value={farmForm.name}
              onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
              placeholder="e.g. Green Valley Farm"
            />
          </div>

          <div className="form-field">
            <label>Location / Address</label>
            <input
              type="text"
              value={farmForm.location}
              onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
              placeholder="e.g. Central Valley, Plot 44"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div className="form-field">
              <label>Total Area (ha)</label>
              <input
                type="number"
                step="0.01"
                value={farmForm.total_area_ha}
                onChange={(e) => setFarmForm({ ...farmForm, total_area_ha: e.target.value })}
                placeholder="45.5"
              />
            </div>
            <div className="form-field">
              <label>Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={farmForm.latitude}
                onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })}
                placeholder="-1.286389"
              />
            </div>
            <div className="form-field">
              <label>Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={farmForm.longitude}
                onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })}
                placeholder="36.817223"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Description / Notes</label>
            <input
              type="text"
              value={farmForm.description}
              onChange={(e) => setFarmForm({ ...farmForm, description: e.target.value })}
              placeholder="Primary grain and livestock production"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "10px",
              padding: "12px",
              backgroundColor: "var(--color-forest)",
              color: "#FFF",
              border: "1px solid var(--color-gold)",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "Saving Farm..." : editingFarm ? "Update Farm" : "Create Farm"}
          </button>
        </form>
      </Modal>

      {/* Add / Edit Field Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={editingField ? "Edit Field" : `Add Field to ${selectedFarm?.name}`}
      >
        <form onSubmit={handleSaveField} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Field Name / Identifier *</label>
            <input
              type="text"
              required
              value={fieldForm.name}
              onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
              placeholder="e.g. North Ridge Field A"
            />
          </div>

          <div className="form-field">
            <label>Field Size (ha) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={fieldForm.size_ha}
              onChange={(e) => setFieldForm({ ...fieldForm, size_ha: e.target.value })}
              placeholder="12.5"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Soil Type</label>
              <select
                value={fieldForm.soil_type}
                onChange={(e) => setFieldForm({ ...fieldForm, soil_type: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Loam">Loam</option>
                <option value="Clay">Clay</option>
                <option value="Sandy">Sandy</option>
                <option value="Silt">Silt</option>
                <option value="Peat">Peat</option>
                <option value="Chalky">Chalky</option>
              </select>
            </div>

            <div className="form-field">
              <label>Current Condition</label>
              <select
                value={fieldForm.current_condition}
                onChange={(e) => setFieldForm({ ...fieldForm, current_condition: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Good">Good</option>
                <option value="Fallow">Fallow</option>
                <option value="Tilled">Tilled</option>
                <option value="Planted">Planted</option>
                <option value="Harvested">Harvested</option>
                <option value="Needs Rest">Needs Rest</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "10px",
              padding: "12px",
              backgroundColor: "var(--color-forest)",
              color: "#FFF",
              border: "1px solid var(--color-gold)",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "Saving Field..." : editingField ? "Update Field" : "Add Field"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Farm;