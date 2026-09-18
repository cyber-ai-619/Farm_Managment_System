import { useState, useEffect, useCallback } from "react";
import labourService from "../services/labourService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Labour() {
  const { role } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [farms, setFarms] = useState([]);
  const [activeTab, setActiveTab] = useState("workers"); // 'workers' | 'tasks' | 'attendance'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Forms
  const [workerForm, setWorkerForm] = useState({
    farm_id: "",
    first_name: "",
    last_name: "",
    job_title: "Field Operator",
    phone: "",
    daily_rate: 25.0,
    status: "active",
  });

  const [taskForm, setTaskForm] = useState({
    farm_id: "",
    worker_id: "",
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    priority: "medium",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    worker_id: "",
    attendance_date: new Date().toISOString().split("T")[0],
    status: "present",
    hours_worked: 8,
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchLabourData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [wData, aData, tData, fData] = await Promise.all([
        labourService.getWorkers(),
        labourService.getAttendance().catch(() => []),
        labourService.getTasks().catch(() => []),
        farmService.getFarms().catch(() => []),
      ]);
      setWorkers(wData);
      setAttendance(aData);
      setTasks(tData);
      setFarms(fData);

      if (fData.length > 0 && !workerForm.farm_id) {
        setWorkerForm((prev) => ({ ...prev, farm_id: fData[0].id }));
        setTaskForm((prev) => ({ ...prev, farm_id: fData[0].id }));
      }
      if (wData.length > 0 && !attendanceForm.worker_id) {
        setAttendanceForm((prev) => ({ ...prev, worker_id: wData[0].id }));
        setTaskForm((prev) => ({ ...prev, worker_id: wData[0].id }));
      }
    } catch (err) {
      setError(err.message || "Failed to load workforce data.");
    } finally {
      setLoading(false);
    }
  }, [workerForm.farm_id, attendanceForm.worker_id]);

  useEffect(() => {
    fetchLabourData();
  }, [fetchLabourData]);

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!workerForm.first_name.trim()) return;

    try {
      setSubmitting(true);
      await labourService.createWorker(workerForm);
      setIsWorkerModalOpen(false);
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to add worker.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setSubmitting(true);
      await labourService.createTask(taskForm);
      setIsTaskModalOpen(false);
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.worker_id) return;

    try {
      setSubmitting(true);
      await labourService.logAttendance(attendanceForm.worker_id, attendanceForm);
      setIsAttendanceModalOpen(false);
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to log attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await labourService.updateTaskStatus(taskId, newStatus);
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to update task status.");
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Workforce & Labour Management</h1>
          <p>Manage farm personnel, track daily shift attendance, and assign field tasks.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              style={{ padding: "8px 14px", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Log Attendance
            </button>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              style={{ padding: "8px 14px", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Assign Task
            </button>
            <button
              type="button"
              onClick={() => setIsWorkerModalOpen(true)}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest)", color: "#FFF", border: "1px solid var(--color-gold)", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              + Add Worker
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="content-card" style={{ padding: "8px 16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { id: "workers", label: `Workers Directory (${workers.length})` },
            { id: "tasks", label: `Field Tasks (${tasks.length})` },
            { id: "attendance", label: `Daily Attendance (${attendance.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "8px 14px",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "var(--color-forest)" : "var(--color-charcoal-60)",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-gold)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && workers.length === 0 ? (
        <Loading message="Loading workforce records..." />
      ) : (
        <>
          {/* Tab 1: Workers Directory */}
          {activeTab === "workers" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {workers.length === 0 ? (
                <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px" }}>
                  <p>No workers registered yet. Click "+ Add Worker" to create employee profiles.</p>
                </div>
              ) : (
                workers.map((w) => (
                  <div key={w.id} className="content-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "var(--color-forest)" }}>{w.first_name} {w.last_name}</h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: w.status === "active" ? "#E8F5E9" : "#FFEBEE",
                          color: w.status === "active" ? "#2E7D32" : "#C62828",
                          textTransform: "uppercase",
                        }}
                      >
                        {w.status || "Active"}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
                      Role: <strong>{w.job_title || "Field Worker"}</strong>
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.85rem" }}>
                      📞 {w.phone || "No phone recorded"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-farm-green)", fontWeight: 600 }}>
                      Rate: ${w.daily_rate || "20.00"}/day
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Task Assignments */}
          {activeTab === "tasks" && (
            <div style={{ display: "grid", gap: "12px" }}>
              {tasks.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                  <p>No active tasks assigned.</p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="content-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px" }}>{t.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                        Assigned to: <strong>{t.worker_name || `Worker #${t.worker_id}`}</strong> &bull; Due: {t.due_date || "Open"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        value={t.status || "pending"}
                        onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(30,70,50,0.2)", fontSize: "0.85rem" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Attendance Logs */}
          {activeTab === "attendance" && (
            <div style={{ display: "grid", gap: "10px" }}>
              {attendance.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                  <p>No attendance logs recorded for this period.</p>
                </div>
              ) : (
                attendance.map((att) => (
                  <div key={att.id} className="content-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{att.worker_name || `Worker #${att.worker_id}`}</h4>
                      <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                        Date: {att.attendance_date} &bull; Hours: <strong>{att.hours_worked || 8} hrs</strong>
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, color: att.status === "present" ? "#2E7D32" : "#C62828", textTransform: "uppercase", fontSize: "0.8rem" }}>
                      {att.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Add Worker */}
      <Modal isOpen={isWorkerModalOpen} onClose={() => setIsWorkerModalOpen(false)} title="Add Farm Worker">
        <form onSubmit={handleSaveWorker} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>First Name *</label>
              <input
                type="text"
                required
                value={workerForm.first_name}
                onChange={(e) => setWorkerForm({ ...workerForm, first_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Last Name *</label>
              <input
                type="text"
                required
                value={workerForm.last_name}
                onChange={(e) => setWorkerForm({ ...workerForm, last_name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Job Title</label>
              <input
                type="text"
                value={workerForm.job_title}
                onChange={(e) => setWorkerForm({ ...workerForm, job_title: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Worker"}
          </button>
        </form>
      </Modal>

      {/* Modal: Assign Task */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Assign Farm Task">
        <form onSubmit={handleSaveTask} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Task Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Apply top-dressing fertilizer to Field B"
            />
          </div>
          <div className="form-field">
            <label>Assignee (Worker)</label>
            <select
              value={taskForm.worker_id}
              onChange={(e) => setTaskForm({ ...taskForm, worker_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.first_name} {w.last_name} ({w.job_title})</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Due Date</label>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Assign Task"}
          </button>
        </form>
      </Modal>

      {/* Modal: Attendance */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Log Daily Attendance">
        <form onSubmit={handleSaveAttendance} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Worker *</label>
            <select
              value={attendanceForm.worker_id}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, worker_id: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Status</label>
              <select
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
            <div className="form-field">
              <label>Hours Worked</label>
              <input
                type="number"
                value={attendanceForm.hours_worked}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, hours_worked: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Save Attendance"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Labour;