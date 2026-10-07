import api from "./api";

/**
 * Irrigation & Water Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/farms/{id}/irrigation-sources
 *   GET/POST       /api/farms/{id}/irrigation-systems
 *   GET/PUT/DELETE /api/irrigation/systems/{id}
 *   GET/POST       /api/irrigation/systems/{id}/schedules
 *   GET/POST       /api/irrigation/systems/{id}/consumption
 *   GET            /api/irrigation/recommendations/{fieldId}
 */
export const irrigationService = {
  async getSources(farmId) {
    const res = await api.get(`/api/farms/${farmId}/irrigation-sources`);
    return res.data || [];
  },

  async createSource(farmId, data) {
    const res = await api.post(`/api/farms/${farmId}/irrigation-sources`, data);
    return res.data;
  },

  async getSystems(farmId) {
    const res = await api.get(`/api/farms/${farmId}/irrigation-systems`);
    return res.data || [];
  },

  async createSystem(farmId, data) {
    const res = await api.post(`/api/farms/${farmId}/irrigation-systems`, data);
    return res.data;
  },

  async getSystemById(id) {
    const res = await api.get(`/api/irrigation/systems/${id}`);
    return res.data;
  },

  async updateSystem(id, data) {
    const res = await api.put(`/api/irrigation/systems/${id}`, data);
    return res.data;
  },

  async deleteSystem(id) {
    const res = await api.delete(`/api/irrigation/systems/${id}`);
    return res;
  },

  async getSchedules(systemId) {
    const res = await api.get(`/api/irrigation/systems/${systemId}/schedules`);
    return res.data || [];
  },

  async createSchedule(systemId, data) {
    const res = await api.post(`/api/irrigation/systems/${systemId}/schedules`, data);
    return res.data;
  },

  async getConsumption(systemId) {
    const res = await api.get(`/api/irrigation/systems/${systemId}/consumption`);
    return res.data || [];
  },

  async logConsumption(systemId, data) {
    const res = await api.post(`/api/irrigation/systems/${systemId}/consumption`, data);
    return res.data;
  },

  async getRecommendations(fieldId) {
    const res = await api.get(`/api/irrigation/recommendations/${fieldId}`);
    return res.data;
  },
};

export default irrigationService;
