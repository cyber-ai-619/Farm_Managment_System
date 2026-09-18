import api from "./api";

/**
 * Storage & Post-Harvest Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/warehouses
 *   GET/PUT        /api/warehouses/{id}
 *   GET/POST       /api/storage/batches
 *   GET            /api/storage/batches/{id}
 *   GET            /api/storage/valuation
 *   POST           /api/storage/spoilage
 *   GET/POST       /api/storage/dispatches
 */
export const storageService = {
  // --- Warehouses ---
  async getWarehouses(farmId) {
    const res = await api.get(`/api/warehouses?farm_id=${farmId || 1}`);
    return res.data || [];
  },

  async getWarehouseById(id) {
    const res = await api.get(`/api/warehouses/${id}`);
    return res.data;
  },

  async createWarehouse(data) {
    const res = await api.post("/api/warehouses", data);
    return res.data;
  },

  async updateWarehouse(id, data) {
    const res = await api.put(`/api/warehouses/${id}`, data);
    return res.data;
  },

  // --- Batches ---
  async getBatches(farmId, warehouseId = null, status = null) {
    let url = `/api/storage/batches?farm_id=${farmId || 1}`;
    if (warehouseId) url += `&warehouse_id=${warehouseId}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async getBatchById(id) {
    const res = await api.get(`/api/storage/batches/${id}`);
    return res.data;
  },

  async createBatch(data) {
    const res = await api.post("/api/storage/batches", data);
    return res.data;
  },

  // --- Valuation ---
  async getValuation(farmId) {
    const res = await api.get(`/api/storage/valuation?farm_id=${farmId || 1}`);
    return res.data;
  },

  // --- Spoilage ---
  async recordSpoilage(data) {
    const res = await api.post("/api/storage/spoilage", data);
    return res.data;
  },

  // --- Dispatches ---
  async getDispatches(farmId, batchId = null) {
    let url = `/api/storage/dispatches?farm_id=${farmId || 1}`;
    if (batchId) url += `&batch_id=${batchId}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async createDispatch(data) {
    const res = await api.post("/api/storage/dispatches", data);
    return res.data;
  },
};

export default storageService;
