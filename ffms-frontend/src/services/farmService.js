import api from "./api";

/**
 * Farm & Field Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/farms
 *   GET/PUT/DELETE /api/farms/{id}
 *   GET/POST       /api/farms/{id}/fields
 *   GET/PUT/DELETE /api/fields/{id}
 *   GET/POST       /api/fields/{id}/plots
 */
export const farmService = {
  // --- Farms ---
  async getFarms() {
    const res = await api.get("/api/farms");
    return res.data || [];
  },

  async getFarmById(id) {
    const res = await api.get(`/api/farms/${id}`);
    return res.data;
  },

  async createFarm(data) {
    const res = await api.post("/api/farms", data);
    return res.data;
  },

  async updateFarm(id, data) {
    const res = await api.put(`/api/farms/${id}`, data);
    return res.data;
  },

  async deleteFarm(id) {
    const res = await api.delete(`/api/farms/${id}`);
    return res;
  },

  // --- Fields under a Farm ---
  async getFields(farmId) {
    const res = await api.get(`/api/farms/${farmId}/fields`);
    return res.data || [];
  },

  async createField(farmId, data) {
    const res = await api.post(`/api/farms/${farmId}/fields`, data);
    return res.data;
  },

  async getFieldById(id) {
    const res = await api.get(`/api/fields/${id}`);
    return res.data;
  },

  async updateField(id, data) {
    const res = await api.put(`/api/fields/${id}`, data);
    return res.data;
  },

  async deleteField(id) {
    const res = await api.delete(`/api/fields/${id}`);
    return res;
  },

  // --- Plots under a Field ---
  async getPlots(fieldId) {
    const res = await api.get(`/api/fields/${fieldId}/plots`);
    return res.data || [];
  },

  async createPlot(fieldId, data) {
    const res = await api.post(`/api/fields/${fieldId}/plots`, data);
    return res.data;
  },
};

export default farmService;
