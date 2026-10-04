import api from "./api";

/**
 * Labour & Workforce Management Service
 *
 * Communicates with backend endpoints:
 *   GET/POST       /api/workers
 *   GET/PUT        /api/workers/{id}
 *   GET/POST       /api/labour/attendance
 *   POST           /api/workers/{id}/attendance
 *   GET/POST       /api/labour/tasks
 *   PATCH          /api/labour/tasks/{id}/status
 */
export const labourService = {
  async getWorkers() {
    const res = await api.get("/api/workers");
    return res.data || [];
  },

  async getWorkerById(id) {
    const res = await api.get(`/api/workers/${id}`);
    return res.data;
  },

  async createWorker(data) {
    const res = await api.post("/api/workers", data);
    return res.data;
  },

  async updateWorker(id, data) {
    const res = await api.put(`/api/workers/${id}`, data);
    return res.data;
  },

  async getAttendance() {
    const res = await api.get("/api/labour/attendance");
    return res.data || [];
  },

  async logAttendance(workerId, data) {
    const res = await api.post(`/api/workers/${workerId}/attendance`, data);
    return res.data;
  },

  async getTasks() {
    const res = await api.get("/api/labour/tasks");
    return res.data || [];
  },

  async createTask(data) {
    const res = await api.post("/api/labour/tasks", data);
    return res.data;
  },

  async updateTaskStatus(taskId, status) {
    const res = await api.patch(`/api/labour/tasks/${taskId}/status`, { status });
    return res.data;
  },
};

export default labourService;
