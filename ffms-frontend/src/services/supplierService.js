import api from "./api";

/**
 * Supplier & Procurement Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/suppliers
 *   GET/PUT        /api/suppliers/{id}
 *   GET/POST       /api/suppliers/{id}/quotations
 *   GET/POST       /api/purchase-orders
 *   GET            /api/purchase-orders/{id}
 *   PUT/PATCH      /api/purchase-orders/{id}
 */
export const supplierService = {
  // --- Suppliers ---
  async getSuppliers(farmId, category = null) {
    let url = `/api/suppliers?farm_id=${farmId || 1}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async getSupplierById(id) {
    const res = await api.get(`/api/suppliers/${id}`);
    return res.data;
  },

  async createSupplier(data) {
    const res = await api.post("/api/suppliers", data);
    return res.data;
  },

  async updateSupplier(id, data) {
    const res = await api.put(`/api/suppliers/${id}`, data);
    return res.data;
  },

  // --- Quotations ---
  async getQuotations(supplierId) {
    const res = await api.get(`/api/suppliers/${supplierId}/quotations`);
    return res.data || [];
  },

  async createQuotation(supplierId, data) {
    const res = await api.post(`/api/suppliers/${supplierId}/quotations`, data);
    return res.data;
  },

  // --- Purchase Orders ---
  async getPurchaseOrders(farmId, status = null) {
    let url = `/api/purchase-orders?farm_id=${farmId || 1}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async getPurchaseOrderById(id) {
    const res = await api.get(`/api/purchase-orders/${id}`);
    return res.data;
  },

  async createPurchaseOrder(data) {
    const res = await api.post("/api/purchase-orders", data);
    return res.data;
  },

  async updatePurchaseOrderStatus(id, status) {
    const res = await api.patch(`/api/purchase-orders/${id}`, { status });
    return res.data;
  },
};

export default supplierService;
