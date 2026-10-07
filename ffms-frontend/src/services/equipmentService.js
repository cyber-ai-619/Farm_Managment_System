import api from "./api";

/**
 * Farm Equipment & Machinery Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/equipment
 *   GET/PUT/DELETE /api/equipment/{id}
 *   GET/POST       /api/equipment/{id}/maintenance
 *   GET/POST       /api/equipment/{id}/repairs
 *   GET/POST       /api/equipment/{id}/fuel-log
 */
export const equipmentService = {
  async getEquipment() {
    const res = await api.get("/api/equipment");
    return res.data || [];
  },

  async getEquipmentById(id) {
    const res = await api.get(`/api/equipment/${id}`);
    return res.data;
  },

  async createEquipment(data) {
    const res = await api.post("/api/equipment", data);
    return res.data;
  },

  async updateEquipment(id, data) {
    const res = await api.put(`/api/equipment/${id}`, data);
    return res.data;
  },

  async deleteEquipment(id) {
    const res = await api.delete(`/api/equipment/${id}`);
    return res;
  },

  async getMaintenance(equipmentId) {
    const res = await api.get(`/api/equipment/${equipmentId}/maintenance`);
    return res.data || [];
  },

  async createMaintenance(equipmentId, data) {
    const res = await api.post(`/api/equipment/${equipmentId}/maintenance`, data);
    return res.data;
  },

  async getRepairs(equipmentId) {
    const res = await api.get(`/api/equipment/${equipmentId}/repairs`);
    return res.data || [];
  },

  async createRepair(equipmentId, data) {
    const res = await api.post(`/api/equipment/${equipmentId}/repairs`, data);
    return res.data;
  },

  async getFuelLogs(equipmentId) {
    const res = await api.get(`/api/equipment/${equipmentId}/fuel-log`);
    return res.data || [];
  },

  async createFuelLog(equipmentId, data) {
    const res = await api.post(`/api/equipment/${equipmentId}/fuel-log`, data);
    return res.data;
  },
};

export default equipmentService;
