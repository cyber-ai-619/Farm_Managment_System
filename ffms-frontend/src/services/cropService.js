import api from "./api";

/**
 * Crop Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/crops
 *   GET/PUT/DELETE /api/crops/{id}
 *   GET/POST       /api/crops/{id}/varieties
 *   GET/POST       /api/crops/{id}/plantings
 *   GET/POST       /api/crops/{id}/fertilizer-records
 */
export const cropService = {
  // --- Crops ---
  async getCrops() {
    const res = await api.get("/api/crops");
    return res.data || [];
  },

  async getCropById(id) {
    const res = await api.get(`/api/crops/${id}`);
    return res.data;
  },

  async createCrop(data) {
    const res = await api.post("/api/crops", data);
    return res.data;
  },

  async updateCrop(id, data) {
    const res = await api.put(`/api/crops/${id}`, data);
    return res.data;
  },

  async deleteCrop(id) {
    const res = await api.delete(`/api/crops/${id}`);
    return res;
  },

  // --- Varieties ---
  async getVarieties(cropId) {
    const res = await api.get(`/api/crops/${cropId}/varieties`);
    return res.data || [];
  },

  async createVariety(cropId, data) {
    const res = await api.post(`/api/crops/${cropId}/varieties`, data);
    return res.data;
  },

  // --- Planting Schedules ---
  async getPlantings(cropId) {
    const res = await api.get(`/api/crops/${cropId}/plantings`);
    return res.data || [];
  },

  async createPlanting(cropId, data) {
    const res = await api.post(`/api/crops/${cropId}/plantings`, data);
    return res.data;
  },

  // --- Fertilizer Records ---
  async getFertilizerRecords(cropId) {
    const res = await api.get(`/api/crops/${cropId}/fertilizer-records`);
    return res.data || [];
  },

  async createFertilizerRecord(cropId, data) {
    const res = await api.post(`/api/crops/${cropId}/fertilizer-records`, data);
    return res.data;
  },
};

export default cropService;
