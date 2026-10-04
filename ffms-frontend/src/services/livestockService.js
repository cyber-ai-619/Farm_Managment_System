import api from "./api";

/**
 * Livestock Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/livestock
 *   GET/PUT/DELETE /api/livestock/{id}
 *   GET/POST       /api/livestock/breeds
 *   GET/POST       /api/livestock/{id}/vaccinations
 *   GET/POST       /api/livestock/{id}/treatments
 *   GET/POST       /api/livestock/{id}/feed-records
 */
export const livestockService = {
  // --- Animals ---
  async getAnimals(farmId) {
    const query = farmId ? `?farm_id=${farmId}` : "";
    const res = await api.get(`/api/livestock${query}`);
    return res.data || [];
  },

  async getAnimalById(id) {
    const res = await api.get(`/api/livestock/${id}`);
    return res.data;
  },

  async createAnimal(data) {
    const res = await api.post("/api/livestock", data);
    return res.data;
  },

  async updateAnimal(id, data) {
    const res = await api.put(`/api/livestock/${id}`, data);
    return res.data;
  },

  async deleteAnimal(id) {
    const res = await api.delete(`/api/livestock/${id}`);
    return res;
  },

  // --- Breeds ---
  async getBreeds() {
    const res = await api.get("/api/livestock/breeds");
    return res.data || [];
  },

  async createBreed(data) {
    const res = await api.post("/api/livestock/breeds", data);
    return res.data;
  },

  // --- Medical & Health Records ---
  async getVaccinations(animalId) {
    const res = await api.get(`/api/livestock/${animalId}/vaccinations`);
    return res.data || [];
  },

  async createVaccination(animalId, data) {
    const res = await api.post(`/api/livestock/${animalId}/vaccinations`, data);
    return res.data;
  },

  async getTreatments(animalId) {
    const res = await api.get(`/api/livestock/${animalId}/treatments`);
    return res.data || [];
  },

  async createTreatment(animalId, data) {
    const res = await api.post(`/api/livestock/${animalId}/treatments`, data);
    return res.data;
  },

  async getFeedRecords(animalId) {
    const res = await api.get(`/api/livestock/${animalId}/feed-records`);
    return res.data || [];
  },

  async createFeedRecord(animalId, data) {
    const res = await api.post(`/api/livestock/${animalId}/feed-records`, data);
    return res.data;
  },
};

export default livestockService;
