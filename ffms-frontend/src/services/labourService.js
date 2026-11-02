import api from "./api";

/**
 * Labour & Workforce Management Service
 *
 * Full API coverage for both Farm Owner workforce administration
 * and Worker self-service portal.
 */
export const labourService = {
  // Workers (Owner/Manager)
  async getWorkers(farmId) {
    const res = await api.get("/api/workers", { params: farmId ? { farm_id: farmId } : {} });
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

  async linkUserAccount(workerId, data) {
    const res = await api.post(`/api/workers/${workerId}/link-user`, data);
    return res.data;
  },

  // Attendance & Muster Roll (Owner/Manager)
  async getAttendance(farmId, date) {
    const params = {};
    if (farmId) params.farm_id = farmId;
    if (date) params.date = date;
    const res = await api.get("/api/labour/attendance", { params });
    return res.data || [];
  },

  async logAttendance(workerId, data) {
    const res = await api.post(`/api/workers/${workerId}/attendance`, data);
    return res.data;
  },

  async saveBulkAttendance(data) {
    const res = await api.post("/api/labour/bulk-attendance", data);
    return res.data;
  },

  async verifyAttendance(attendanceId) {
    const res = await api.patch(`/api/labour/attendance/${attendanceId}/verify`);
    return res.data;
  },

  // Tasks (Owner/Manager)
  async getTasks(farmId, status) {
    const params = {};
    if (farmId) params.farm_id = farmId;
    if (status) params.status = status;
    const res = await api.get("/api/labour/tasks", { params });
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

  async verifyTask(taskId) {
    const res = await api.patch(`/api/labour/tasks/${taskId}/verify`);
    return res.data;
  },

  // Payroll (Owner/Manager/Accountant)
  async getPayroll(farmId, startDate, endDate) {
    const params = {};
    if (farmId) params.farm_id = farmId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get("/api/labour/payroll", { params });
    return res.data || [];
  },

  async generatePayroll(data) {
    const res = await api.post("/api/labour/payroll/generate", data);
    return res.data;
  },

  async updatePayrollPayment(id, data) {
    const res = await api.patch(`/api/labour/payroll/${id}/payment`, data);
    return res.data;
  },

  // Field Incidents & Hazards
  async getIncidents(farmId, status) {
    const params = {};
    if (farmId) params.farm_id = farmId;
    if (status) params.status = status;
    const res = await api.get("/api/labour/incidents", { params });
    return res.data || [];
  },

  async reportIncident(data) {
    const res = await api.post("/api/labour/incidents", data);
    return res.data;
  },

  async resolveIncident(id, data) {
    const res = await api.patch(`/api/labour/incidents/${id}/resolve`, data);
    return res.data;
  },

  // Worker Self-Service Portal (/my-work)
  async getMyTasks(status) {
    const res = await api.get("/api/labour/my-tasks", { params: status ? { status } : {} });
    return res;
  },

  async updateMyTask(taskId, status, completionNotes) {
    const res = await api.patch(`/api/labour/my-tasks/${taskId}`, {
      status,
      completion_notes: completionNotes,
    });
    return res.data;
  },

  async clockIn() {
    const res = await api.post("/api/labour/my-clockin");
    return res.data;
  },

  async clockOut() {
    const res = await api.post("/api/labour/my-clockout");
    return res.data;
  },

  async getMyAttendance() {
    const res = await api.get("/api/labour/my-attendance");
    return res.data || [];
  },

  async getMyPayroll() {
    const res = await api.get("/api/labour/my-payroll");
    return res.data || [];
  },
};

export default labourService;
