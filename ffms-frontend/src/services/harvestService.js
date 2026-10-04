import api from "./api";

/**
 * Harvest Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST /api/harvest
 *   GET/PUT  /api/harvest/{id}
 *   GET      /api/harvest/summary
 *   GET      /api/harvest/field/{fieldId}
 */
export const harvestService = {
  async getHarvests(farmId) {
    const query = farmId ? `?farm_id=${farmId}` : "";
    const res = await api.get(`/api/harvest${query}`);
    return res.data || [];
  },

  async getHarvestById(id) {
    const res = await api.get(`/api/harvest/${id}`);
    return res.data;
  },

  async createHarvest(data) {
    const res = await api.post("/api/harvest", data);
    return res.data;
  },

  async updateHarvest(id, data) {
    const res = await api.put(`/api/harvest/${id}`, data);
    return res.data;
  },

  async getSummary(farmId) {
    const query = farmId ? `?farm_id=${farmId}` : "";
    const res = await api.get(`/api/harvest/summary${query}`);
    return res.data;
  },

  async getByField(fieldId) {
    const res = await api.get(`/api/harvest/field/${fieldId}`);
    return res.data || [];
  },
};

export default harvestService;
