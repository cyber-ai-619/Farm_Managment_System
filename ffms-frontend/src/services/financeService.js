import api from "./api";

/**
 * Financial Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/finance/income
 *   GET/POST       /api/finance/expenses
 *   GET            /api/finance/profit-loss
 *   GET/POST       /api/finance/loans
 *   PUT/PATCH      /api/finance/loans/{id}
 *   GET/POST       /api/finance/budgets
 *   PUT/PATCH      /api/finance/budgets/{id}
 */
export const financeService = {
  // --- Income ---
  async getIncome(farmId, category = null, startDate = null, endDate = null) {
    let url = `/api/finance/income?farm_id=${farmId || 1}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async createIncome(data) {
    const res = await api.post("/api/finance/income", data);
    return res.data;
  },

  // --- Expenses ---
  async getExpenses(farmId, category = null, startDate = null, endDate = null) {
    let url = `/api/finance/expenses?farm_id=${farmId || 1}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async createExpense(data) {
    const res = await api.post("/api/finance/expenses", data);
    return res.data;
  },

  // --- Profit & Loss ---
  async getProfitLoss(farmId, startDate = null, endDate = null) {
    let url = `/api/finance/profit-loss?farm_id=${farmId || 1}`;
    if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
    const res = await api.get(url);
    return res.data;
  },

  // --- Loans ---
  async getLoans(farmId) {
    const res = await api.get(`/api/finance/loans?farm_id=${farmId || 1}`);
    return res.data || [];
  },

  async createLoan(data) {
    const res = await api.post("/api/finance/loans", data);
    return res.data;
  },

  async updateLoan(id, data) {
    const res = await api.put(`/api/finance/loans/${id}`, data);
    return res.data;
  },

  // --- Budgets ---
  async getBudgets(farmId, fiscalYear = null) {
    let url = `/api/finance/budgets?farm_id=${farmId || 1}`;
    if (fiscalYear) url += `&fiscal_year=${fiscalYear}`;
    const res = await api.get(url);
    return res.data || [];
  },

  async createBudget(data) {
    const res = await api.post("/api/finance/budgets", data);
    return res.data;
  },

  async updateBudget(id, data) {
    const res = await api.put(`/api/finance/budgets/${id}`, data);
    return res.data;
  },
};

export default financeService;
