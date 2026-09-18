import api from "./api";

/**
 * Notifications & Alert Trigger Service
 *
 * Communicates with backend endpoints:
 *   GET       /api/alerts
 *   POST      /api/alerts
 *   GET       /api/alerts/history
 *   POST      /api/alerts/scan
 *   PATCH/PUT /api/alerts/{id}/dismiss
 *   PATCH/PUT /api/alerts/{id}/read
 */
export const alertService = {
  async getActiveAlerts(farmId = 1, skipScan = false) {
    const query = `?farm_id=${farmId}${skipScan ? "&skip_scan=1" : ""}`;
    const res = await api.get(`/api/alerts${query}`);
    return res.data || [];
  },

  async getAlertHistory(farmId = 1, limit = 50) {
    const res = await api.get(`/api/alerts/history?farm_id=${farmId}&limit=${limit}`);
    return res.data || [];
  },

  async createAlert(data) {
    const res = await api.post("/api/alerts", data);
    return res.data;
  },

  async dismissAlert(id) {
    const res = await api.patch(`/api/alerts/${id}/dismiss`);
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.patch(`/api/alerts/${id}/read`);
    return res.data;
  },

  async triggerScan(farmId = 1) {
    const res = await api.post("/api/alerts/scan", { farm_id: farmId });
    return res.data;
  },
};

export default alertService;
