import api from "./api";

/**
 * Farm Inventory & Stock Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST /api/inventory
 *   GET/PUT  /api/inventory/{id}
 *   GET      /api/inventory/low-stock
 *   POST     /api/inventory/{id}/stock-in
 *   POST     /api/inventory/{id}/stock-out
 */
export const inventoryService = {
  async getItems() {
    const res = await api.get("/api/inventory");
    return res.data || [];
  },

  async getItemById(id) {
    const res = await api.get(`/api/inventory/${id}`);
    return res.data;
  },

  async createItem(data) {
    const res = await api.post("/api/inventory", data);
    return res.data;
  },

  async updateItem(id, data) {
    const res = await api.put(`/api/inventory/${id}`, data);
    return res.data;
  },

  async getLowStock() {
    const res = await api.get("/api/inventory/low-stock");
    return res.data || [];
  },

  async stockIn(itemId, data) {
    const res = await api.post(`/api/inventory/${itemId}/stock-in`, data);
    return res.data;
  },

  async stockOut(itemId, data) {
    const res = await api.post(`/api/inventory/${itemId}/stock-out`, data);
    return res.data;
  },
};

export default inventoryService;
