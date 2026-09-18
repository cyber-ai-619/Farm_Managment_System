import api from "./api";

/**
 * Sales, Orders & Market Prices Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/customers
 *   GET/PUT        /api/customers/{id}
 *   GET/POST       /api/sales-orders
 *   GET/PUT/PATCH  /api/sales-orders/{id}
 *   GET            /api/invoices
 *   POST           /api/payments
 *   GET/POST       /api/market-prices
 *   GET            /api/market-prices/trends
 */
export const salesService = {
  // --- Customers ---
  async getCustomers() {
    const res = await api.get("/api/customers");
    return res.data || [];
  },

  async createCustomer(data) {
    const res = await api.post("/api/customers", data);
    return res.data;
  },

  // --- Sales Orders ---
  async getOrders() {
    const res = await api.get("/api/sales-orders");
    return res.data || [];
  },

  async getOrderById(id) {
    const res = await api.get(`/api/sales-orders/${id}`);
    return res.data;
  },

  async createOrder(data) {
    const res = await api.post("/api/sales-orders", data);
    return res.data;
  },

  async updateOrderStatus(id, status) {
    const res = await api.patch(`/api/sales-orders/${id}`, { status });
    return res.data;
  },

  // --- Invoices & Payments ---
  async getInvoices() {
    const res = await api.get("/api/invoices");
    return res.data || [];
  },

  async createPayment(data) {
    const res = await api.post("/api/payments", data);
    return res.data;
  },

  // --- Market Prices ---
  async getMarketPrices() {
    const res = await api.get("/api/market-prices");
    return res.data || [];
  },

  async createMarketPrice(data) {
    const res = await api.post("/api/market-prices", data);
    return res.data;
  },

  async getTrends() {
    const res = await api.get("/api/market-prices/trends");
    return res.data || [];
  },
};

export default salesService;
