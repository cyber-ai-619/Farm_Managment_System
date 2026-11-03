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
  const [veterinarians, setVeterinarians] = useState([]);
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
  const [isAssignVetModalOpen, setIsAssignVetModalOpen] = useState(false);

  // Forms
  const [animalForm, setAnimalForm] = useState({
    tag_number: "",
    name: "",
    species: "Cattle",
    breed_id: "",
    gender: "female",
    birth_date: "",
    weight_kg: "",
    status: "active",
    veterinarian_name: "",
    veterinarian_phone: "",
    veterinarian_id: "",
    notes: "",
  });

  const [breedForm, setBreedForm] = useState({
    name: "",
    species: "Cattle",
    description: "",
  });

  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: "Anthrax Spore Vaccine",
    disease_target: "Anthrax (Bacillus anthracis)",
    vaccination_date: new Date().toISOString().split("T")[0],
    next_due_date: "",
    batch_number: "LOT-2026-AX04",
    dosage: "2 ml",
    route: "subcutaneous",
    veterinarian_id: "",
    veterinarian_name: "",
    withdrawal_days_meat: 21,
    withdrawal_days_milk: 3,
    manufacturer: "CVRI (Central Veterinary Research Institute)",
    cost: 45.0,
    notes: "",
  });

  const [treatmentForm, setTreatmentForm] = useState({
    diagnosis: "Clinical Mastitis",
    treatment_name: "Intramammary Antibiotic Infusion",
    medication: "Oxytetracycline 20% L.A.",
    dose: "20 ml",
    route: "intramuscular",
    treatment_date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    veterinarian_id: "",
    veterinarian_name: "",
    clinic_name: "Lusaka District Veterinary Clinic",
    withdrawal_days: 14,
    outcome: "ongoing",
    cost: 180.0,
    notes: "Swelling reduced after initial dose. Animal isolated in observation pen.",
  });

  const [feedForm, setFeedForm] = useState({
    feed_type: "Rhodes Grass Hay & Dairy Meal",
    quantity_kg: "18",
    feed_date: new Date().toISOString().split("T")[0],
    log_date: new Date().toISOString().split("T")[0],
  });

  const [vetAssignForm, setVetAssignForm] = useState({
    veterinarian_id: "",
    veterinarian_name: "",
    veterinarian_phone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const reloadAnimals = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      const data = await livestockService.getAnimals(farmId);
      setAnimals(data);
      if (data.length > 0) {
        setSelectedAnimal((current) => {
          if (!current) return data[0];
          const matched = data.find((a) => a.id === current.id);
          return matched || data[0];
        });
      } else {
        setSelectedAnimal(null);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load livestock.");
      setLoading(false);
    }
  }, []);

  const reloadAnimalHealth = useCallback(async (animalId) => {
    try {
      const [vData, tData, fData] = await Promise.all([
        livestockService.getVaccinations(animalId).catch(() => []),
        livestockService.getTreatments(animalId).catch(() => []),
        livestockService.getFeedRecords(animalId).catch(() => []),
      ]);
      const dueThreshold = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const processedVaccines = vData.map((v) => ({
        ...v,
        is_due_soon: Boolean(v.next_due_date && v.next_due_date <= dueThreshold),
      }));
      setVaccines(processedVaccines);
      setTreatments(tData);
      setFeedLogs(fData);
    } catch (err) {
      console.error("Failed to load animal health records:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [farmData, breedData] = await Promise.all([
          farmService.getFarms().catch(() => []),
          livestockService.getBreeds().catch(() => []),
        ]);
        if (!ignore) {
          setFarms(farmData);
          if (farmData.length > 0 && !selectedFarmId) {
            setSelectedFarmId(farmData[0].id);
          }
          setBreeds(breedData);
          if (breedData.length > 0) {
            setAnimalForm((prev) => ({ ...prev, breed_id: prev.breed_id || breedData[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load init livestock metadata:", err);
      }
    })();
    return () => { ignore = true; };
  }, [selectedFarmId]);

  useEffect(() => {
    let ignore = false;
    if (!selectedFarmId) return;
    (async () => {
      try {
        const [animalData, vetData] = await Promise.all([
          livestockService.getAnimals(selectedFarmId).catch(() => []),
          livestockService.getVeterinarians(selectedFarmId).catch(() => []),
        ]);
        if (!ignore) {
          setAnimals(animalData);
          setVeterinarians(vetData);
          if (animalData.length > 0) {
            setSelectedAnimal((current) => {
              if (!current) return animalData[0];
              const matched = animalData.find((a) => a.id === current.id);
              return matched || animalData[0];
            });
          } else {
            setSelectedAnimal(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load livestock.");
          setLoading(false);
        }
      }
    })();
    return () => { ignore = true; };
  }, [selectedFarmId]);

  useEffect(() => {
    let ignore = false;
    if (!selectedAnimal?.id) return;
    (async () => {
      try {
        const [vData, tData, fData] = await Promise.all([
          livestockService.getVaccinations(selectedAnimal.id).catch(() => []),
          livestockService.getTreatments(selectedAnimal.id).catch(() => []),
          livestockService.getFeedRecords(selectedAnimal.id).catch(() => []),
        ]);
        if (!ignore) {
          const dueThreshold = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
          const processedVaccines = vData.map((v) => ({
            ...v,
            is_due_soon: Boolean(v.next_due_date && v.next_due_date <= dueThreshold),
          }));
          setVaccines(processedVaccines);
          setTreatments(tData);
          setFeedLogs(fData);
          setVetAssignForm({
            veterinarian_id: selectedAnimal.veterinarian_id || "",
            veterinarian_name: selectedAnimal.veterinarian_name || selectedAnimal.attending_veterinarian || "",
            veterinarian_phone: selectedAnimal.veterinarian_phone || selectedAnimal.attending_veterinarian_phone || "",
          });
        }
      } catch (err) {
        console.error("Failed to load animal health records:", err);
      }
    })();
    return () => { ignore = true; };
  }, [selectedAnimal]);

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
      setAnimalForm({
        tag_number: "",
        name: "",
        species: "Cattle",
        breed_id: breeds[0]?.id || "",
        gender: "female",
        birth_date: "",
        weight_kg: "",
        status: "active",
        veterinarian_name: "",
        veterinarian_phone: "",
        veterinarian_id: "",
        notes: "",
      });
      await reloadAnimals(selectedFarmId);
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
      setBreedForm({ name: "", species: "Cattle", description: "" });
      const data = await livestockService.getBreeds();
      setBreeds(data);
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
      await livestockService.createVaccination(selectedAnimal.id, {
        ...vaccineForm,
        withdrawal_days_meat: Number(vaccineForm.withdrawal_days_meat || 0),
        withdrawal_days_milk: Number(vaccineForm.withdrawal_days_milk || 0),
        cost: Number(vaccineForm.cost || 0),
      });
      setIsVaccineModalOpen(false);
      await reloadAnimalHealth(selectedAnimal.id);
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
      await livestockService.createTreatment(selectedAnimal.id, {
        ...treatmentForm,
        withdrawal_days: Number(treatmentForm.withdrawal_days || 0),
        cost: Number(treatmentForm.cost || 0),
      });
      setIsTreatmentModalOpen(false);
      await reloadAnimalHealth(selectedAnimal.id);
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
      await reloadAnimalHealth(selectedAnimal.id);
    } catch (err) {
      alert(err.message || "Failed to log feed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignVeterinarian = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    try {
      setSubmitting(true);
      await livestockService.updateAnimal(selectedAnimal.id, {
        ...selectedAnimal,
        veterinarian_id: vetAssignForm.veterinarian_id || null,
        veterinarian_name: vetAssignForm.veterinarian_name || null,
        veterinarian_phone: vetAssignForm.veterinarian_phone || null,
      });
      setIsAssignVetModalOpen(false);
      await reloadAnimals(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to update attending veterinarian.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist", "veterinarian"].includes(role);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Livestock Herd & Veterinary Care</h1>
          <p>Complete individual animal registries, attending veterinarian links, and veterinary vaccination histories.</p>
        </div>
        {canManage && (
          <div className="page-header-actions">
            <button
              type="button"
              onClick={() => setIsBreedModalOpen(true)}
              className="btn-secondary"
            >
              + Add Breed
            </button>
            <button
              type="button"
              onClick={() => setIsAnimalModalOpen(true)}
              className="btn-primary"
            >
              + Register Animal
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
            Registered Animals: <strong>{animals.length}</strong>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
          <span style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
            🩺 {veterinarians.length} Staff/Visiting Veterinarians On File
          </span>
        </div>
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
          <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🐄</div>
          <h4>No Animals Registered under this Farm</h4>
          <p style={{ color: "var(--color-charcoal-60)", maxWidth: "450px", margin: "8px auto 20px" }}>
            Add individual livestock cattle, goats, pigs, or sheep with breed lineage, weight, and assign an attending veterinarian.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsAnimalModalOpen(true)}
              className="btn-primary"
            >
              + Register First Animal
            </button>
          )}
        </div>
      ) : (
        <div className="master-detail-layout" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px" }}>
          {/* Herd List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--color-forest)", margin: 0 }}>Herd Registry</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>{animals.length} Animals</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "4px" }}>
              {animals.map((a) => {
                const isSelected = selectedAnimal?.id === a.id;
                const attendingVet = a.attending_veterinarian || a.veterinarian_name || (a.veterinarian_id ? `Staff Vet #${a.veterinarian_id}` : null);
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAnimal(a)}
                    className="content-card"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "var(--color-gold, #D4A54A)" : "rgba(30,70,50,0.12)",
                      backgroundColor: isSelected ? "rgba(245, 234, 208, 0.45)" : "#FFF",
                      padding: "14px",
                      borderRadius: "10px",
                      transition: "all 0.15s ease",
                      borderLeft: isSelected ? "4px solid var(--color-gold, #D4A54A)" : "4px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "var(--color-forest)", fontSize: "0.95rem" }}>
                        🏷️ {a.tag_number} {a.name ? `(${a.name})` : ""}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: (a.status === "active" || a.status === "healthy") ? "#E8F5E9" : a.status === "quarantine" ? "#FFF3E0" : "#FFEBEE",
                          color: (a.status === "active" || a.status === "healthy") ? "#2E7D32" : a.status === "quarantine" ? "#E65100" : "#C62828",
                          textTransform: "uppercase",
                        }}
                      >
                        {a.status || "active"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-80)" }}>
                      <strong>{a.species}</strong> &bull; {a.breed_name || "Standard Breed"} &bull; {a.gender}
                    </p>
                    <div style={{ marginTop: "6px", fontSize: "0.8rem", color: attendingVet ? "#1565C0" : "var(--color-charcoal-60)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>🩺 {attendingVet ? `Vet: Dr. ${attendingVet}` : "No Vet Assigned"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Animal Detail & Health Tabs */}
          <div>
            {selectedAnimal && (
              <div>
                <div className="content-card" style={{ marginBottom: "20px", borderRadius: "12px", border: "1px solid rgba(30,70,50,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h2 style={{ margin: 0, color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                          Animal #{selectedAnimal.tag_number}
                        </h2>
                        {selectedAnimal.name && (
                          <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-charcoal-60)" }}>
                            "{selectedAnimal.name}"
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "12px",
                            backgroundColor: (selectedAnimal.status === "active" || selectedAnimal.status === "healthy") ? "#E8F5E9" : "#FFEBEE",
                            color: (selectedAnimal.status === "active" || selectedAnimal.status === "healthy") ? "#2E7D32" : "#C62828",
                            textTransform: "uppercase",
                          }}
                        >
                          {selectedAnimal.status || "active"}
                        </span>
                      </div>
                      <p style={{ margin: "6px 0 0", color: "var(--color-charcoal-60)", fontSize: "0.9rem" }}>
                        Species: <strong>{selectedAnimal.species}</strong> &bull; Breed: <strong>{selectedAnimal.breed_name || "Not assigned"}</strong> &bull; Gender: <strong style={{ textTransform: "capitalize" }}>{selectedAnimal.gender}</strong>
                        {selectedAnimal.weight_kg ? ` • Weight: ${selectedAnimal.weight_kg} kg` : ""}
                      </p>
                    </div>

                    {/* Attending Veterinarian Card Header */}
                    <div style={{ backgroundColor: "#F4F8F5", padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(44,90,63,0.15)", minWidth: "260px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-forest)", textTransform: "uppercase" }}>
                          Attending Veterinarian
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setIsAssignVetModalOpen(true)}
                            style={{ background: "none", border: "none", color: "#1565C0", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "var(--color-forest)" }}>
                        🩺 {selectedAnimal.attending_veterinarian || selectedAnimal.veterinarian_name ? `Dr. ${selectedAnimal.attending_veterinarian || selectedAnimal.veterinarian_name}` : "Not Assigned"}
                      </p>
                      {(selectedAnimal.attending_veterinarian_phone || selectedAnimal.veterinarian_phone) && (
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>
                          📞 {selectedAnimal.attending_veterinarian_phone || selectedAnimal.veterinarian_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(30,70,50,0.1)" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Birth Date</span>
                      <p style={{ fontWeight: 700, margin: "2px 0 0" }}>{selectedAnimal.date_of_birth || selectedAnimal.birth_date || "Not logged"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Weight</span>
                      <p style={{ fontWeight: 700, margin: "2px 0 0" }}>{selectedAnimal.weight_kg ? `${selectedAnimal.weight_kg} kg` : "N/A"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Vaccine Records</span>
                      <p style={{ fontWeight: 700, margin: "2px 0 0", color: vaccines.length > 0 ? "var(--color-forest)" : "inherit" }}>
                        💉 {vaccines.length} Recorded
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>Medical Treatments</span>
                      <p style={{ fontWeight: 700, margin: "2px 0 0", color: treatments.length > 0 ? "#C62828" : "inherit" }}>
                        🩺 {treatments.length} Recorded
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderBottom: "1px solid rgba(30,70,50,0.1)" }}>
                    {[
                      { id: "vaccines", label: `💉 Vaccinations (${vaccines.length})` },
                      { id: "treatments", label: `🩺 Medical Treatments (${treatments.length})` },
                      { id: "feed", label: `🌾 Feed Records (${feedLogs.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAnimalTab(tab.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "10px 18px",
                          fontWeight: animalTab === tab.id ? 700 : 500,
                          color: animalTab === tab.id ? "var(--color-forest)" : "var(--color-charcoal-60)",
                          borderBottom: animalTab === tab.id ? "3px solid var(--color-gold, #D4A54A)" : "3px solid transparent",
                          cursor: "pointer",
                          fontSize: "0.95rem",
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-forest)" }}>Vaccination Records</h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                          Immunization registry, batch traceability, booster schedules, and food safety withdrawal limits.
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setIsVaccineModalOpen(true)}
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          + Log Vaccination
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {vaccines.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                          <p style={{ margin: 0, color: "var(--color-charcoal-60)" }}>
                            No vaccination history recorded for animal #{selectedAnimal.tag_number}. Click "+ Log Vaccination" to add an immunization record.
                          </p>
                        </div>
                      ) : (
                        vaccines.map((v) => {
                          const isNextDueSoon = Boolean(v.is_due_soon);
                          return (
                            <div key={v.id} className="content-card" style={{ borderLeft: "4px solid #2E7D32", padding: "16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-forest)" }}>
                                      💉 {v.vaccine_name}
                                    </h4>
                                    {v.disease_target && (
                                      <span style={{ fontSize: "0.75rem", backgroundColor: "#E3F2FD", color: "#1565C0", padding: "2px 8px", borderRadius: "8px", fontWeight: 600 }}>
                                        Target: {v.disease_target}
                                      </span>
                                    )}
                                    {v.route && (
                                      <span style={{ fontSize: "0.75rem", backgroundColor: "#EDE7F6", color: "#512DA8", padding: "2px 8px", borderRadius: "8px", fontWeight: 600, textTransform: "capitalize" }}>
                                        Route: {v.route}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "0.85rem", margin: "6px 0 0", color: "var(--color-charcoal-80)" }}>
                                    Administered: <strong>{v.vaccination_date || v.administered_date}</strong>
                                    {v.dosage && ` • Dose: ${v.dosage}`}
                                    {v.batch_number && ` • Batch: ${v.batch_number}`}
                                    {v.manufacturer && ` • Lab: ${v.manufacturer}`}
                                  </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  {v.next_due_date && (
                                    <div style={{ fontSize: "0.85rem" }}>
                                      Next Booster Due:{" "}
                                      <strong style={{ color: isNextDueSoon ? "#C62828" : "#2E7D32" }}>
                                        {v.next_due_date} {isNextDueSoon ? "⚠️ (Due Soon)" : ""}
                                      </strong>
                                    </div>
                                  )}
                                  {Number(v.cost || 0) > 0 && (
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-forest)" }}>
                                      Cost: ZMW {Number(v.cost).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Withdrawal & Vet Linkage Footer */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(30,70,50,0.12)", fontSize: "0.8rem", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ display: "flex", gap: "16px", color: "var(--color-charcoal-80)" }}>
                                  <span>
                                    🥩 Meat Withdrawal: <strong>{v.withdrawal_days_meat || 0} days</strong>
                                  </span>
                                  <span>
                                    🥛 Milk Withdrawal: <strong>{v.withdrawal_days_milk || 0} days</strong>
                                  </span>
                                </div>
                                <div style={{ color: "var(--color-forest)", fontWeight: 600 }}>
                                  🩺 Attending Vet: {v.attending_vet || v.veterinarian_name || v.administered_by_name || "Farm Veterinarian"}
                                </div>
                              </div>
                              {v.notes && (
                                <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)", fontStyle: "italic" }}>
                                  Notes: {v.notes}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Treatments */}
                {animalTab === "treatments" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-forest)" }}>Medical Treatments & Prescriptions</h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                          Clinical diagnoses, prescribed veterinary drugs, follow-ups, and withdrawal observations.
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setIsTreatmentModalOpen(true)}
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.9rem", backgroundColor: "#7A4A52" }}
                        >
                          + Log Medical Treatment
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {treatments.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                          <p style={{ margin: 0, color: "var(--color-charcoal-60)" }}>
                            No illness or clinical disease treatments recorded for animal #{selectedAnimal.tag_number}.
                          </p>
                        </div>
                      ) : (
                        treatments.map((t) => (
                          <div key={t.id} className="content-card" style={{ borderLeft: "4px solid #7A4A52", padding: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#501D28" }}>
                                    🩺 Diagnosis: {t.diagnosis || t.disease_diagnosed}
                                  </h4>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      padding: "2px 8px",
                                      borderRadius: "8px",
                                      backgroundColor: t.outcome === "recovered" ? "#E8F5E9" : (t.outcome === "ongoing" || t.outcome === "recovering") ? "#FFF3E0" : "#FFEBEE",
                                      color: t.outcome === "recovered" ? "#2E7D32" : (t.outcome === "ongoing" || t.outcome === "recovering") ? "#E65100" : "#C62828",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Outcome: {t.outcome || "ongoing"}
                                  </span>
                                </div>
                                <p style={{ fontSize: "0.85rem", margin: "6px 0 0", color: "var(--color-charcoal-80)" }}>
                                  Procedure: <strong>{t.treatment_name || "Clinical Intervention"}</strong> &bull; Date: <strong>{t.treatment_date}</strong>
                                  {t.follow_up_date && ` • Next Review: ${t.follow_up_date}`}
                                </p>
                                <p style={{ fontSize: "0.85rem", margin: "4px 0 0", color: "var(--color-forest)" }}>
                                  Medication: <strong>{t.medication || "None recorded"}</strong> ({t.dose || t.dosage || "Standard Dose"})
                                  {t.route && ` • Route: ${t.route}`}
                                </p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                {Number(t.cost || 0) > 0 && (
                                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-forest)" }}>
                                    ZMW {Number(t.cost).toFixed(2)}
                                  </div>
                                )}
                                {t.withdrawal_days > 0 && (
                                  <span style={{ fontSize: "0.75rem", color: "#E65100", fontWeight: 600 }}>
                                    ⚠️ Withdrawal: {t.withdrawal_days} days
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(30,70,50,0.12)", fontSize: "0.8rem", flexWrap: "wrap", gap: "8px" }}>
                              <div style={{ color: "var(--color-forest)", fontWeight: 600 }}>
                                🩺 Attending Vet: {t.attending_vet || t.veterinarian_name || "Farm Veterinarian"}
                                {t.clinic_name && ` (${t.clinic_name})`}
                              </div>
                            </div>
                            {t.notes && (
                              <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)", fontStyle: "italic" }}>
                                Clinical Notes: {t.notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Feed */}
                {animalTab === "feed" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-forest)" }}>Feed & Nutrition Logs</h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                          Daily silage, concentrates, and forage feed consumption.
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setIsFeedModalOpen(true)}
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          + Log Daily Feed
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {feedLogs.length === 0 ? (
                        <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                          <p style={{ margin: 0, color: "var(--color-charcoal-60)" }}>
                            No feed records logged for animal #{selectedAnimal.tag_number}.
                          </p>
                        </div>
                      ) : (
                        feedLogs.map((f) => (
                          <div key={f.id} className="content-card" style={{ padding: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem" }}>🌾 {f.feed_type}</h4>
                              <span style={{ fontWeight: 700, color: "var(--color-forest)" }}>{f.quantity_kg} kg</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--color-charcoal-60)" }}>
                              Recorded Date: <strong>{f.feed_date || f.log_date}</strong>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Ear Tag / Identification Number *</label>
              <input
                type="text"
                required
                value={animalForm.tag_number}
                onChange={(e) => setAnimalForm({ ...animalForm, tag_number: e.target.value })}
                placeholder="e.g. ZM-COW-104"
              />
            </div>
            <div className="form-field">
              <label>Animal Name (Optional)</label>
              <input
                type="text"
                value={animalForm.name}
                onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })}
                placeholder="e.g. Bessie / Big Bull"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Species *</label>
              <select
                value={animalForm.species}
                onChange={(e) => setAnimalForm({ ...animalForm, species: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Cattle">Cattle (Bovine)</option>
                <option value="Goat">Goat (Caprine)</option>
                <option value="Sheep">Sheep (Ovine)</option>
                <option value="Pig">Pig (Porcine)</option>
                <option value="Poultry">Poultry</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Breed Catalogue</label>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Gender</label>
              <select
                value={animalForm.gender}
                onChange={(e) => setAnimalForm({ ...animalForm, gender: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unknown">Unknown</option>
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
            <div className="form-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={animalForm.weight_kg}
                onChange={(e) => setAnimalForm({ ...animalForm, weight_kg: e.target.value })}
                placeholder="e.g. 420.5"
              />
            </div>
          </div>

          {/* Veterinarian Association */}
          <div style={{ padding: "12px", backgroundColor: "#F4F8F5", borderRadius: "8px", border: "1px solid rgba(44,90,63,0.15)" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--color-forest)" }}>
              🩺 Attending Veterinarian Linkage
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-field">
                <label>Assigned Staff Veterinarian</label>
                <select
                  value={animalForm.veterinarian_id}
                  onChange={(e) => {
                    const vetId = e.target.value;
                    const selected = veterinarians.find((v) => String(v.id) === String(vetId));
                    setAnimalForm({
                      ...animalForm,
                      veterinarian_id: vetId,
                      veterinarian_name: selected ? selected.name : animalForm.veterinarian_name,
                      veterinarian_phone: selected?.phone || animalForm.veterinarian_phone,
                    });
                  }}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
                >
                  <option value="">-- Choose from Staff/Registered Vets --</option>
                  {veterinarians.map((v) => (
                    <option key={`${v.type || 'vet'}-${v.id}`} value={v.id}>{v.name} ({v.type === "staff_worker" ? "Farm Staff" : "User"})</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Or External Veterinarian Name</label>
                <input
                  type="text"
                  value={animalForm.veterinarian_name}
                  onChange={(e) => setAnimalForm({ ...animalForm, veterinarian_name: e.target.value })}
                  placeholder="e.g. Dr. Mulenga Banda"
                />
              </div>
            </div>
            <div className="form-field" style={{ marginTop: "10px" }}>
              <label>Veterinarian Phone / Emergency Hotline</label>
              <input
                type="tel"
                value={animalForm.veterinarian_phone}
                onChange={(e) => setAnimalForm({ ...animalForm, veterinarian_phone: e.target.value })}
                placeholder="e.g. +260 97 1234567"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Registering Animal..." : "Complete Registration"}
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
              placeholder="e.g. Boran / Brahman / Boer Goat"
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
              <option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Breed Characteristics / Description</label>
            <textarea
              rows="3"
              value={breedForm.description}
              onChange={(e) => setBreedForm({ ...breedForm, description: e.target.value })}
              placeholder="e.g. High tick resistance, drought tolerant, indigenous beef breed."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Breed"}
          </button>
        </form>
      </Modal>

      {/* Modal: Assign / Edit Veterinarian */}
      <Modal isOpen={isAssignVetModalOpen} onClose={() => setIsAssignVetModalOpen(false)} title={`Assign Attending Veterinarian for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleAssignVeterinarian} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Select Staff / Registered Veterinarian</label>
            <select
              value={vetAssignForm.veterinarian_id}
              onChange={(e) => {
                const vid = e.target.value;
                const found = veterinarians.find((v) => String(v.id) === String(vid));
                setVetAssignForm({
                  ...vetAssignForm,
                  veterinarian_id: vid,
                  veterinarian_name: found ? found.name : vetAssignForm.veterinarian_name,
                  veterinarian_phone: found?.phone || vetAssignForm.veterinarian_phone,
                });
              }}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              <option value="">-- Or enter external clinician below --</option>
              {veterinarians.map((v) => (
                <option key={`${v.type || 'vet'}-${v.id}`} value={v.id}>{v.name} ({v.type === "staff_worker" ? "Farm Staff" : "User"})</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Veterinarian Name *</label>
            <input
              type="text"
              required
              value={vetAssignForm.veterinarian_name}
              onChange={(e) => setVetAssignForm({ ...vetAssignForm, veterinarian_name: e.target.value })}
              placeholder="e.g. Dr. Jane Musonda"
            />
          </div>
          <div className="form-field">
            <label>Veterinarian Phone / Emergency Contact</label>
            <input
              type="tel"
              value={vetAssignForm.veterinarian_phone}
              onChange={(e) => setVetAssignForm({ ...vetAssignForm, veterinarian_phone: e.target.value })}
              placeholder="e.g. +260 96 9876543"
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Veterinarian Link..." : "Save Veterinarian"}
          </button>
        </form>
      </Modal>

      {/* Modal: Log Vaccine */}
      <Modal isOpen={isVaccineModalOpen} onClose={() => setIsVaccineModalOpen(false)} title={`Log Veterinary Vaccination for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveVaccine} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Vaccine Name *</label>
              <input
                type="text"
                required
                value={vaccineForm.vaccine_name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
                placeholder="e.g. Anthrax Spore Vaccine / Blackquarter Vaccine"
              />
            </div>
            <div className="form-field">
              <label>Target Disease</label>
              <input
                type="text"
                value={vaccineForm.disease_target}
                onChange={(e) => setVaccineForm({ ...vaccineForm, disease_target: e.target.value })}
                placeholder="e.g. Anthrax / Blackleg / FMD / CBPP"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Date Administered *</label>
              <input
                type="date"
                required
                value={vaccineForm.vaccination_date}
                onChange={(e) => setVaccineForm({ ...vaccineForm, vaccination_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Next Booster Due Date</label>
              <input
                type="date"
                value={vaccineForm.next_due_date}
                onChange={(e) => setVaccineForm({ ...vaccineForm, next_due_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Batch / Lot Number</label>
              <input
                type="text"
                value={vaccineForm.batch_number}
                onChange={(e) => setVaccineForm({ ...vaccineForm, batch_number: e.target.value })}
                placeholder="e.g. LOT-2026-B4"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Dosage</label>
              <input
                type="text"
                value={vaccineForm.dosage}
                onChange={(e) => setVaccineForm({ ...vaccineForm, dosage: e.target.value })}
                placeholder="e.g. 2 ml"
              />
            </div>
            <div className="form-field">
              <label>Administration Route</label>
              <select
                value={vaccineForm.route}
                onChange={(e) => setVaccineForm({ ...vaccineForm, route: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="subcutaneous">Subcutaneous (SC)</option>
                <option value="intramuscular">Intramuscular (IM)</option>
                <option value="oral">Oral</option>
                <option value="intranasal">Intranasal</option>
                <option value="eye_drop">Eye Drop</option>
                <option value="spray">Spray</option>
                <option value="topical">Topical</option>
              </select>
            </div>
            <div className="form-field">
              <label>Cost (ZMW)</label>
              <input
                type="number"
                step="0.01"
                value={vaccineForm.cost}
                onChange={(e) => setVaccineForm({ ...vaccineForm, cost: e.target.value })}
                placeholder="e.g. 45.00"
              />
            </div>
          </div>

          {/* Attending Veterinarian */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Attending Veterinarian</label>
              <select
                value={vaccineForm.veterinarian_id}
                onChange={(e) => {
                  const vid = e.target.value;
                  const vet = veterinarians.find((v) => String(v.id) === String(vid));
                  setVaccineForm({
                    ...vaccineForm,
                    veterinarian_id: vid,
                    veterinarian_name: vet ? vet.name : vaccineForm.veterinarian_name,
                  });
                }}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="">-- Choose Veterinarian / Staff --</option>
                {veterinarians.map((v) => (
                  <option key={`${v.type || 'vet'}-${v.id}`} value={v.id}>{v.name} ({v.type === "staff_worker" ? "Farm Staff" : "User"})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Or Clinician / Doctor Name</label>
              <input
                type="text"
                value={vaccineForm.veterinarian_name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian_name: e.target.value })}
                placeholder="e.g. Dr. Mulenga Banda"
              />
            </div>
          </div>

          {/* Food Safety & Withdrawal */}
          <div style={{ padding: "12px", backgroundColor: "#FFF8E1", borderRadius: "8px", border: "1px solid rgba(212,165,74,0.3)" }}>
            <h5 style={{ margin: "0 0 8px", color: "#F57F17", fontSize: "0.85rem" }}>
              ⚠️ Food Safety Compliance (Withdrawal Periods)
            </h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div className="form-field">
                <label>Meat Withdrawal (Days)</label>
                <input
                  type="number"
                  value={vaccineForm.withdrawal_days_meat}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, withdrawal_days_meat: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Milk Withdrawal (Days)</label>
                <input
                  type="number"
                  value={vaccineForm.withdrawal_days_milk}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, withdrawal_days_milk: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Manufacturer / Lab</label>
                <input
                  type="text"
                  value={vaccineForm.manufacturer}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, manufacturer: e.target.value })}
                  placeholder="e.g. CVRI / Onderstepoort"
                />
              </div>
            </div>
          </div>

          <div className="form-field">
            <label>Clinical Notes / Observation</label>
            <textarea
              rows="2"
              value={vaccineForm.notes}
              onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
              placeholder="e.g. Administered in left neck fold, no immediate adverse reaction observed."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            />
          </div>

          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Vaccination Record..." : "Log Vaccination"}
          </button>
        </form>
      </Modal>

      {/* Modal: Log Treatment */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} title={`Log Medical Treatment for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveTreatment} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Diagnosed Illness / Condition *</label>
              <input
                type="text"
                required
                value={treatmentForm.diagnosis}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
                placeholder="e.g. Clinical Mastitis / East Coast Fever / Foot Rot"
              />
            </div>
            <div className="form-field">
              <label>Procedure / Treatment Name</label>
              <input
                type="text"
                value={treatmentForm.treatment_name}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, treatment_name: e.target.value })}
                placeholder="e.g. Antibiotic Infusion / Wound Dressing"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Medication Prescribed</label>
              <input
                type="text"
                value={treatmentForm.medication}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, medication: e.target.value })}
                placeholder="e.g. Oxytetracycline 20% L.A."
              />
            </div>
            <div className="form-field">
              <label>Dosage</label>
              <input
                type="text"
                value={treatmentForm.dose}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, dose: e.target.value })}
                placeholder="e.g. 20 ml"
              />
            </div>
            <div className="form-field">
              <label>Route</label>
              <select
                value={treatmentForm.route}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, route: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="intramuscular">Intramuscular (IM)</option>
                <option value="intravenous">Intravenous (IV)</option>
                <option value="subcutaneous">Subcutaneous (SC)</option>
                <option value="oral">Oral</option>
                <option value="topical">Topical</option>
                <option value="intramammary">Intramammary</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Treatment Date *</label>
              <input
                type="date"
                required
                value={treatmentForm.treatment_date}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, treatment_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Follow-up Review Date</label>
              <input
                type="date"
                value={treatmentForm.follow_up_date}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, follow_up_date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Current Outcome</label>
              <select
                value={treatmentForm.outcome}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, outcome: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="ongoing">Ongoing / Recovering</option>
                <option value="recovered">Recovered</option>
                <option value="referred">Referred to Specialist</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Attending Veterinarian</label>
              <select
                value={treatmentForm.veterinarian_id}
                onChange={(e) => {
                  const vid = e.target.value;
                  const vet = veterinarians.find((v) => String(v.id) === String(vid));
                  setTreatmentForm({
                    ...treatmentForm,
                    veterinarian_id: vid,
                    veterinarian_name: vet ? vet.name : treatmentForm.veterinarian_name,
                  });
                }}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="">-- Choose Veterinarian --</option>
                {veterinarians.map((v) => (
                  <option key={`${v.type || 'vet'}-${v.id}`} value={v.id}>{v.name} ({v.type === "staff_worker" ? "Farm Staff" : "User"})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Withdrawal Days</label>
              <input
                type="number"
                value={treatmentForm.withdrawal_days}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, withdrawal_days: e.target.value })}
                placeholder="e.g. 14"
              />
            </div>
            <div className="form-field">
              <label>Cost (ZMW)</label>
              <input
                type="number"
                step="0.01"
                value={treatmentForm.cost}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
                placeholder="e.g. 180.00"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Veterinary Clinic / Practice Name</label>
            <input
              type="text"
              value={treatmentForm.clinic_name}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, clinic_name: e.target.value })}
              placeholder="e.g. Central Veterinary Clinic, Lusaka"
            />
          </div>

          <div className="form-field">
            <label>Clinical Notes</label>
            <textarea
              rows="2"
              value={treatmentForm.notes}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
              placeholder="Clinical observations, dosage course, recovery milestones..."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            />
          </div>

          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Treatment..." : "Log Treatment"}
          </button>
        </form>
      </Modal>

      {/* Modal: Log Feed */}
      <Modal isOpen={isFeedModalOpen} onClose={() => setIsFeedModalOpen(false)} title={`Log Feed for #${selectedAnimal?.tag_number}`}>
        <form onSubmit={handleSaveFeed} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Feed Formulation / Forage *</label>
            <input
              type="text"
              required
              value={feedForm.feed_type}
              onChange={(e) => setFeedForm({ ...feedForm, feed_type: e.target.value })}
              placeholder="e.g. Rhodes Grass Hay / Maize Silage / High Protein Concentrates"
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
                value={feedForm.feed_date || feedForm.log_date}
                onChange={(e) => setFeedForm({ ...feedForm, feed_date: e.target.value, log_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving Feed Log..." : "Log Feed"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Livestock;