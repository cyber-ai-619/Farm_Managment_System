import { useState, useEffect, useCallback } from "react";
import livestockService from "../services/livestockService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Livestock() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [animals, setAnimals] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [animalTab, setAnimalTab] = useState("vaccines"); // 'vaccines' | 'treatments' | 'feed'
  const [vaccines, setVaccines] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [feedLogs, setFeedLogs] = useState([]);
  const [error, setError] = useState("");

  // Modals
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);

  // Forms
  const [animalForm, setAnimalForm] = useState({
    tag_number: "",
    name: "",
    species: "Cattle",
    breed_id: "",
    gender: "female",
    birth_date: "",
    status: "healthy",
  });

  const [breedForm, setBreedForm] = useState({
    name: "",
    species: "Cattle",
    description: "",
  });

  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: "Anthrax Spore Vaccine",
    administered_date: new Date().toISOString().split("T")[0],
    next_due_date: "",
    administered_by: "",
    batch_number: "",
  });

  const [treatmentForm, setTreatmentForm] = useState({
    disease_diagnosed: "Mastitis",
    treatment_date: new Date().toISOString().split("T")[0],
    medication: "Oxytetracycline",
    dosage: "20ml",
    outcome: "recovering",
  });

  const [feedForm, setFeedForm] = useState({
    feed_type: "Silage & Concentrates",
    quantity_kg: "15",
    log_date: new Date().toISOString().split("T")[0],
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

  const fetchBreeds = useCallback(async () => {
    try {
      const data = await livestockService.getBreeds();
      setBreeds(data);
      if (data.length > 0 && !animalForm.breed_id) {
        setAnimalForm((prev) => ({ ...prev, breed_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load breeds:", err);
    }
  }, [animalForm.breed_id]);

  const fetchAnimals = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError("");
      const data = await livestockService.getAnimals(farmId);
      setAnimals(data);
      if (data.length > 0) {
        setSelectedAnimal(data[0]);
      } else {
        setSelectedAnimal(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load livestock.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnimalHealth = useCallback(async (animalId) => {
    try {
      const [vData, tData, fData] = await Promise.all([
        livestockService.getVaccinations(animalId),
        livestockService.getTreatments(animalId),
        livestockService.getFeedRecords(animalId),
      ]);
      setVaccines(vData);
      setTreatments(tData);
      setFeedLogs(fData);
    } catch (err) {
      console.error("Failed to load animal health records:", err);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
    fetchBreeds();
  }, [fetchFarms, fetchBreeds]);

  useEffect(() => {
    if (selectedFarmId) {
      fetchAnimals(selectedFarmId);
    }
  }, [selectedFarmId, fetchAnimals]);

  useEffect(() => {
    if (selectedAnimal?.id) {
      fetchAnimalHealth(selectedAnimal.id);
    }
  }, [selectedAnimal, fetchAnimalHealth]);

  const handleSaveAnimal = async (e) => {
    e.preventDefault();
    if (!selectedFarmId || !animalForm.tag_number.trim()) return;

    try {
      setSubmitting(true);
      await livestockService.createAnimal({
        ...animalForm,
        farm_id: selectedFarmId,
      });
      setIsAnimalModalOpen(false);
      await fetchAnimals(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to register animal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBreed = async (e) => {
    e.preventDefault();
    if (!breedForm.name.trim()) return;

    try {
      setSubmitting(true);
      await livestockService.createBreed(breedForm);
      setIsBreedModalOpen(false);
      await fetchBreeds();
    } catch (err) {
      alert(err.message || "Failed to create breed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveVaccine = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    try {
      setSubmitting(true);
      await livestockService.createVaccination(selectedAnimal.id, vaccineForm);
      setIsVaccineModalOpen(false);
      await fetchAnimalHealth(selectedAnimal.id);
    } catch (err) {
      alert(err.message || "Failed to log vaccination.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    try {
      setSubmitting(true);
      await livestockService.createTreatment(selectedAnimal.id, treatmentForm);
      setIsTreatmentModalOpen(false);
      await fetchAnimalHealth(selectedAnimal.id);
    } catch (err) {
      alert(err.message || "Failed to log medical treatment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFeed = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    try {
      setSubmitting(true);
      await livestockService.createFeedRecord(selectedAnimal.id, feedForm);
      setIsFeedModalOpen(false);
      await fetchAnimalHealth(selectedAnimal.id);
    } catch (err) {
      alert(err.message || "Failed to log feed.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Livestock Herd & Health</h1>
          <p>Track herd registry, breeding genetics, medical treatments, and vaccinations.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsBreedModalOpen(true)}
              style={{ padding: "8px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Add Breed
            </button>
            <button
              type="button"
              onClick={() => setIsAnimalModalOpen(true)}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest)", color: "#FFF", border: "1px solid var(--color-gold)", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Register Animal
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
        <span style={{ fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
          Active Animals: <strong>{animals.length}</strong>
        </span>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && animals.length === 0 ? (
        <Loading message="Loading livestock registry..." />
      ) : animals.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
          <h4>No Animals Registered under this Farm</h4>
          <p>Click "+ Register Animal" above to add your first animal to this farm herd.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Herd List */}
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--color-forest)", marginBottom: "12px" }}>Herd Registry</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {animals.map((a) => {
                const isSelected = selectedAnimal?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAnimal(a)}
                    className="content-card"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "var(--color-gold, #D4A54A)" : "rgba(212,165,74,0.2)",
                      backgroundColor: isSelected ? "rgba(245, 234, 208, 0.45)" : "#FFF",
                      padding: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "var(--color-forest)" }}>🏷️ {a.tag_number}</h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: a.status === "healthy" ? "#E8F5E9" : "#FFEBEE",
                          color: a.status === "healthy" ? "#2E7D32" : "#C62828",
                          textTransform: "uppercase",
                        }}
                      >
                        {a.status || "Healthy"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                      {a.species} &bull; {a.breed_name || "Standard Breed"} &bull; {a.gender}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Animal Detail & Health Tabs */}
          <div>
            {selectedAnimal && (
              <div>
                <div className="content-card" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: 0, color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                        Tag #{selectedAnimal.tag_number} {selectedAnimal.name ? `(${selectedAnimal.name})` : ""}
                      </h2>
                      <p style={{ margin: "4px 0 0", color: "var(--color-charcoal-60)" }}>
                        {selectedAnimal.species} &bull; {selectedAnimal.breed_name || "Breed not assigned"} &bull; Gender: <strong>{selectedAnimal.gender}</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(30,70,50,0.1)" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Birth Date</span>
                      <p style={{ fontWeight: 700, margin: 0 }}>{selectedAnimal.birth_date || "Not logged"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Health Status</span>
                      <p style={{ fontWeight: 700, margin: 0, color: selectedAnimal.status === "healthy" ? "#2E7D32" : "#C62828" }}>
                        {selectedAnimal.status || "Healthy"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Vaccine Logs</span>
                      <p style={{ fontWeight: 700, margin: 0 }}>{vaccines.length} Logged</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderBottom: "1px solid rgba(30,70,50,0.1)" }}>
                    {[
                      { id: "vaccines", label: `Vaccinations (${vaccines.length})` },
                      { id: "treatments", label: `Treatments (${treatments.length})` },
                      { id: "feed", label: `Feed Logs (${feedLogs.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAnimalTab(tab.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "8px 16px",
                          fontWeight: animalTab === tab.id ? 700 : 500,
                          color: animalTab === tab.id ? "var(--color-forest)" : "var(--color-charcoal-60)",
                          borderBottom: animalTab === tab.id ? "2px solid var(--color-gold)" : "2px solid transparent",
                          cursor: "pointer",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab: Vaccines */}
                {animalTab === "vaccines" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsVaccineModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Vaccination
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {vaccines.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No vaccination history recorded for this animal.</p>
                        </div>
                      ) : (
                        vaccines.map((v) => (
                          <div key={v.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>💉 {v.vaccine_name}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Administered: <strong>{v.administered_date}</strong> {v.next_due_date ? `| Next Due: ${v.next_due_date}` : ""}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Treatments */}
                {animalTab === "treatments" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsTreatmentModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Treatment
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {treatments.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No medical illness or disease treatments recorded.</p>
                        </div>
                      ) : (
                        treatments.map((t) => (
                          <div key={t.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>🩺 Diagnosis: {t.disease_diagnosed}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Medication: <strong>{t.medication} ({t.dosage})</strong> &bull; Date: <strong>{t.treatment_date}</strong> &bull; Outcome: <span style={{ color: "#E65100", fontWeight: 700 }}>{t.outcome}</span>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Feed */}
                {animalTab === "feed" && (
                  <div>
                    {canManage && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setIsFeedModalOpen(true)}
                          style={{ padding: "6px 14px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Log Daily Feed
                        </button>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: "10px" }}>
                      {feedLogs.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "20px" }}>
                          <p>No feed records logged yet.</p>
                        </div>
                      ) : (
                        feedLogs.map((f) => (
                          <div key={f.id} className="content-card">
                            <h4 style={{ margin: "0 0 4px" }}>🌾 {f.feed_type}</h4>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                              Quantity: <strong>{f.quantity_kg} kg</strong> &bull; Date: <strong>{f.log_date}</strong>
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

      {/* Modal: Register Animal */}
      <Modal isOpen={isAnimalModalOpen} onClose={() => setIsAnimalModalOpen(false)} title="Register New Livestock Animal">
        <form onSubmit={handleSaveAnimal} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Ear Tag Number / ID *</label>
            <input
              type="text"
              required
              value={animalForm.tag_number}
              onChange={(e) => setAnimalForm({ ...animalForm, tag_number: e.target.value })}
              placeholder="e.g. COW-042"
            />
          </div>
          <div className="form-field">
            <label>Animal Name (Optional)</label>
            <input
              type="text"
              value={animalForm.name}
              onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })}
              placeholder="e.g. Bessie"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Species</label>
              <select
                value={animalForm.species}
                onChange={(e) => setAnimalForm({ ...animalForm, species: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Cattle">Cattle</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
                <option value="Pig">Pig</option>
                <option value="Poultry">Poultry</option>
              </select>
            </div>
            <div className="form-field">
              <label>Breed</label>
              <select
                value={animalForm.breed_id}
                onChange={(e) => setAnimalForm({ ...animalForm, breed_id: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="">-- Select Breed --</option>
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.species})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Gender</label>
              <select
                value={animalForm.gender}
                onChange={(e) => setAnimalForm({ ...animalForm, gender: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div className="form-field">
              <label>Birth Date</label>
              <input
                type="date"
                value={animalForm.birth_date}
                onChange={(e) => setAnimalForm({ ...animalForm, birth_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Registering..." : "Register Animal"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add Breed */}
      <Modal isOpen={isBreedModalOpen} onClose={() => setIsBreedModalOpen(false)} title="Add Livestock Breed">
        <form onSubmit={handleSaveBreed} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Breed Name *</label>
            <input
              type="text"
              required
              value={breedForm.name}
              onChange={(e) => setBreedForm({ ...breedForm, name: e.target.value })}
              placeholder="e.g. Holstein Friesian / Boer"
            />
          </div>
          <div className="form-field">
            <label>Species *</label>
            <select
              value={breedForm.species}
              onChange={(e) => setBreedForm({ ...breedForm, species: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              <option value="Cattle">Cattle</option>
              <option value="Goat">Goat</option>
              <option value="Sheep">Sheep</option>
              <option value="Pig">Pig</option>
              <option value="Poultry">Poultry</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Breed"}
          </button>
        </form>
      </Modal>

      {/* Modal: Vaccine */}
      <Modal isOpen={isVaccineModalOpen} onClose={() => setIsVaccineModalOpen(false)} title={`Log Vaccination for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveVaccine} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Vaccine Name *</label>
            <input
              type="text"
              required
              value={vaccineForm.vaccine_name}
              onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Date Administered</label>
              <input
                type="date"
                value={vaccineForm.administered_date}
                onChange={(e) => setVaccineForm({ ...vaccineForm, administered_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Next Due Date</label>
              <input
                type="date"
                value={vaccineForm.next_due_date}
                onChange={(e) => setVaccineForm({ ...vaccineForm, next_due_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Vaccine"}
          </button>
        </form>
      </Modal>

      {/* Modal: Treatment */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} title={`Log Medical Treatment for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveTreatment} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Diagnosed Illness / Condition *</label>
            <input
              type="text"
              required
              value={treatmentForm.disease_diagnosed}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, disease_diagnosed: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Medication Prescribed</label>
              <input
                type="text"
                value={treatmentForm.medication}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, medication: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Dosage</label>
              <input
                type="text"
                value={treatmentForm.dosage}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, dosage: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Treatment"}
          </button>
        </form>
      </Modal>

      {/* Modal: Feed */}
      <Modal isOpen={isFeedModalOpen} onClose={() => setIsFeedModalOpen(false)} title={`Log Feed for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveFeed} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Feed Formulation *</label>
            <input
              type="text"
              required
              value={feedForm.feed_type}
              onChange={(e) => setFeedForm({ ...feedForm, feed_type: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Quantity (kg)</label>
              <input
                type="number"
                value={feedForm.quantity_kg}
                onChange={(e) => setFeedForm({ ...feedForm, quantity_kg: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Date</label>
              <input
                type="date"
                value={feedForm.log_date}
                onChange={(e) => setFeedForm({ ...feedForm, log_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Log Feed"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Livestock;