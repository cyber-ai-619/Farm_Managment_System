import api from "./api";

/**
 * Weather & Environmental Intelligence Service
 *
 * Communicates with backend endpoints:
 *   GET       /api/weather/current/{farmId}
 *   GET       /api/weather/forecast/{farmId}
 *   GET       /api/weather/history/{farmId}
 *   POST      /api/weather/observe/{farmId}
 *   GET/POST  /api/weather/alerts/{farmId}
 */
export const weatherService = {
  async getCurrent(farmId) {
    const res = await api.get(`/api/weather/current/${farmId}`);
    return res.data;
  },

  async getForecast(farmId) {
    const res = await api.get(`/api/weather/forecast/${farmId}`);
    return res.data || [];
  },

  async getHistory(farmId) {
    const res = await api.get(`/api/weather/history/${farmId}`);
    return res.data || [];
  },

  async logObservation(farmId, data) {
    const res = await api.post(`/api/weather/observe/${farmId}`, data);
    return res.data;
  },

  async getAlerts(farmId) {
    const res = await api.get(`/api/weather/alerts/${farmId}`);
    return res.data || [];
  },

  async createAlert(farmId, data) {
    const res = await api.post(`/api/weather/alerts/${farmId}`, data);
    return res.data;
  },
};

export default weatherService;
