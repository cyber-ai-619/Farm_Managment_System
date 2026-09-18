import api from "./api";

/**
 * Pest & Disease Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/pests
 *   GET/POST       /api/scouting
 *   GET            /api/pest-disease/outbreaks
 *   GET/POST       /api/fields/{id}/treatments
 *   PATCH          /api/treatments/{id}/effectiveness
 */
export const pestDiseaseService = {
  async getPests() {
    const res = await api.get("/api/pests");
    return res.data || [];
  },

  async createPest(data) {
    const res = await api.post("/api/pests", data);
    return res.data;
  },

  async getScoutingLogs() {
    const res = await api.get("/api/scouting");
    return res.data || [];
  },

  async createScoutingLog(data) {
    const res = await api.post("/api/scouting", data);
    return res.data;
  },

  async getOutbreaks() {
    const res = await api.get("/api/pest-disease/outbreaks");
    return res.data || [];
  },

  async getTreatments(fieldId) {
    const res = await api.get(`/api/fields/${fieldId}/treatments`);
    return res.data || [];
  },

  async createTreatment(fieldId, data) {
    const res = await api.post(`/api/fields/${fieldId}/treatments`, data);
    return res.data;
  },

  async updateEffectiveness(treatmentId, status) {
    const res = await api.patch(`/api/treatments/${treatmentId}/effectiveness`, { status });
    return res.data;
  },
};

export default pestDiseaseService;
