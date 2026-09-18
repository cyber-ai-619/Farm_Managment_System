import api from "./api";

/**
 * Reports & Analytics Service
 *
 * Communicates with backend endpoints:
 *   GET /api/dashboard
 *   GET /api/analytics/yield
 *   GET /api/analytics/finance
 *   GET /api/analytics/weather-vs-yield
 *   GET /api/reports/crop-production
 *   GET /api/reports/yield
 *   GET /api/reports/livestock
 *   GET /api/reports/financial
 *   GET /api/reports/expenses
 *   GET /api/reports/sales
 *   GET /api/reports/inventory
 *   GET /api/reports/labour
 *   GET /api/reports/irrigation
 *   GET /api/reports/pest-disease
 *   GET /api/reports/equipment
 *   GET /api/reports/profitability
 *   GET /api/reports/farm-performance
 */
export const reportService = {
  // --- High-Level Dashboard & Analytics ---
  async getDashboard(farmId = 1) {
    const res = await api.get(`/api/dashboard?farm_id=${farmId}`);
    return res.data;
  },

  async getYieldAnalytics(farmId = 1) {
    const res = await api.get(`/api/analytics/yield?farm_id=${farmId}`);
    return res.data;
  },

  async getFinanceAnalytics(farmId = 1) {
    const res = await api.get(`/api/analytics/finance?farm_id=${farmId}`);
    return res.data;
  },

  async getWeatherVsYield(farmId = 1) {
    const res = await api.get(`/api/analytics/weather-vs-yield?farm_id=${farmId}`);
    return res.data;
  },

  // --- 13 Specialized Reports ---
  async getCropProduction(farmId = 1, from = null, to = null) {
    let url = `/api/reports/crop-production?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getYieldReport(farmId = 1, from = null, to = null) {
    let url = `/api/reports/yield?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getLivestock(farmId = 1, from = null, to = null) {
    let url = `/api/reports/livestock?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getFinancial(farmId = 1, from = null, to = null) {
    let url = `/api/reports/financial?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getExpenses(farmId = 1, from = null, to = null) {
    let url = `/api/reports/expenses?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getSales(farmId = 1, from = null, to = null) {
    let url = `/api/reports/sales?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getInventory(farmId = 1) {
    return await api.get(`/api/reports/inventory?farm_id=${farmId}`);
  },

  async getLabour(farmId = 1, from = null, to = null) {
    let url = `/api/reports/labour?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getIrrigation(farmId = 1, from = null, to = null) {
    let url = `/api/reports/irrigation?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getPestDisease(farmId = 1, from = null, to = null) {
    let url = `/api/reports/pest-disease?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getEquipment(farmId = 1) {
    return await api.get(`/api/reports/equipment?farm_id=${farmId}`);
  },

  async getProfitability(farmId = 1, from = null, to = null) {
    let url = `/api/reports/profitability?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },

  async getFarmPerformance(farmId = 1, from = null, to = null) {
    let url = `/api/reports/farm-performance?farm_id=${farmId}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return await api.get(url);
  },
};

export default reportService;
