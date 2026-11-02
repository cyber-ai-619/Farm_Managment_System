import { useState, useEffect, useCallback, useMemo } from "react";
import labourService from "../services/labourService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

const WORKER_ROLE_OPTIONS = [
  { value: "field_worker", label: "Field Worker / Operator" },
  { value: "supervisor", label: "Field Supervisor" },
  { value: "tractor_driver", label: "Tractor & Heavy Machinery Driver" },
  { value: "harvester", label: "Harvester & Post-Harvest Specialist" },
  { value: "agronomist", label: "Agronomist / Crop Scout" },
  { value: "technician", label: "Irrigation / Pump Technician" },
  { value: "veterinarian", label: "Veterinarian / Animal Care Specialist" },
  { value: "general_labour", label: "General Farm Labour" },
  { value: "other", label: "Other Specialist" },
];

const EMPLOYMENT_TYPES = [
  { value: "permanent", label: "Permanent Full-Time" },
  { value: "seasonal", label: "Seasonal Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "contract", label: "Fixed-Term Contract" },
  { value: "daily", label: "Daily / Piece-Rate Hand" },
];

function Labour() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  // Core Data
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState("roster"); // 'roster' | 'attendance' | 'tasks' | 'payroll' | 'incidents'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Attendance Date Filter & Bulk Matrix State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkAttendanceState, setBulkAttendanceState] = useState({});

  // Payroll Date Range State
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const [payrollStart, setPayrollStart] = useState(firstDayOfMonth);
  const [payrollEnd, setPayrollEnd] = useState(lastDayOfMonth);

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Modal Targets
  const [selectedWorkerForLink, setSelectedWorkerForLink] = useState(null);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Form States
  const [workerForm, setWorkerForm] = useState({
    first_name: "",
    last_name: "",
    role: "field_worker",
    employment_type: "permanent",
    daily_rate: 65.0,
    phone: "",
    id_national_number: "",
    emergency_contact: "",
    notes: "",
  });

  const [linkForm, setLinkForm] = useState({
    email: "",
    password: "",
  });

  const [taskForm, setTaskForm] = useState({
    worker_id: "",
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    priority: "medium",
  });

  const [payoutForm, setPayoutForm] = useState({
    payment_method: "mobile_money",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [resolveForm, setResolveForm] = useState({
    resolution_notes: "",
  });

  // 1. Load initial farms
  useEffect(() => {
    async function loadFarms() {
      try {
        const farmList = await farmService.getFarms();
        setFarms(farmList);
        if (farmList.length > 0) {
          setSelectedFarmId(farmList[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load farms.");
      }
    }
    loadFarms();
  }, []);

  // 2. Fetch all labour records for active farm
  const fetchLabourData = useCallback(async () => {
    if (!selectedFarmId) return;
    try {
      setLoading(true);
      setError("");
      const [wData, aData, tData, pData, iData] = await Promise.all([
        labourService.getWorkers(selectedFarmId).catch(() => []),
        labourService.getAttendance(selectedFarmId, attendanceDate).catch(() => []),
        labourService.getTasks(selectedFarmId).catch(() => []),
        labourService.getPayroll(selectedFarmId, payrollStart, payrollEnd).catch(() => []),
        labourService.getIncidents(selectedFarmId).catch(() => []),
      ]);
      setWorkers(wData);
      setAttendance(aData);
      setTasks(tData);
      setPayroll(pData);
      setIncidents(iData);

      // Initialize bulk attendance state with present defaults or existing logs
      const initialBulk = {};
      wData.forEach((w) => {
        const existing = aData.find((a) => a.worker_id === w.id);
        initialBulk[w.id] = {
          worker_id: w.id,
          status: existing ? existing.status : "present",
          hours_worked: existing ? existing.hours_worked : 8.0,
          overtime_hours: existing ? existing.overtime_hours : 0.0,
          is_verified: existing ? existing.is_verified : 1,
          notes: existing ? existing.notes || "" : "",
        };
      });
      setBulkAttendanceState(initialBulk);
    } catch (err) {
      setError(err.message || "Failed to load workforce information.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, attendanceDate, payrollStart, payrollEnd]);

  useEffect(() => {
    fetchLabourData();
  }, [fetchLabourData]);

  // Clear notices after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Stats computation
  const stats = useMemo(() => {
    const activeCrew = workers.filter((w) => w.status === "active").length;
    const digitalUsers = workers.filter((w) => Boolean(w.user_id)).length;
    const todayPresent = attendance.filter((a) => a.status === "present" || a.status === "half_day").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
    const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
    const totalWageBill = payroll.reduce((acc, curr) => acc + Number(curr.net_payable || 0), 0);
    return { activeCrew, digitalUsers, todayPresent, pendingTasks, openIncidents, totalWageBill };
  }, [workers, attendance, tasks, incidents, payroll]);

  // Handler: Add Worker
  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!workerForm.first_name.trim() || !workerForm.last_name.trim()) return;

    try {
      setSubmitting(true);
      await labourService.createWorker({
        ...workerForm,
        farm_id: selectedFarmId,
      });
      setIsWorkerModalOpen(false);
      setSuccessMsg(`Worker ${workerForm.first_name} registered successfully.`);
      setWorkerForm({
        first_name: "",
        last_name: "",
        role: "field_worker",
        employment_type: "permanent",
        daily_rate: 65.0,
        phone: "",
        id_national_number: "",
        emergency_contact: "",
        notes: "",
      });
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to register worker.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Link App Account
  const handleLinkAccount = async (e) => {
    e.preventDefault();
    if (!selectedWorkerForLink || !linkForm.email) return;

    try {
      setSubmitting(true);
      await labourService.linkUserAccount(selectedWorkerForLink.id, {
        email: linkForm.email.trim(),
        password: linkForm.password,
      });
      setIsLinkModalOpen(false);
      setSelectedWorkerForLink(null);
      setLinkForm({ email: "", password: "" });
      setSuccessMsg("Digital login credentials created and linked successfully!");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to link account.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Save Bulk Attendance (Muster Roll)
  const handleSaveBulkAttendance = async () => {
    try {
      setSubmitting(true);
      const records = Object.values(bulkAttendanceState);
      await labourService.saveBulkAttendance({
        farm_id: selectedFarmId,
        work_date: attendanceDate,
        records,
      });
      setSuccessMsg("Daily muster-roll attendance saved and approved.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to save muster roll.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAllPresent = () => {
    setBulkAttendanceState((prev) => {
      const next = { ...prev };
      workers.forEach((w) => {
        next[w.id] = {
          worker_id: w.id,
          status: "present",
          hours_worked: 8.0,
          overtime_hours: 0.0,
          is_verified: 1,
          notes: "",
        };
      });
      return next;
    });
  };

  // Handler: Verify Individual Attendance
  const handleVerifyAttendance = async (attendanceId) => {
    try {
      await labourService.verifyAttendance(attendanceId);
      setSuccessMsg("Worker shift verified.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to verify attendance.");
    }
  };

  // Handler: Assign Task
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setSubmitting(true);
      await labourService.createTask({
        ...taskForm,
        farm_id: selectedFarmId,
        worker_id: taskForm.worker_id ? Number(taskForm.worker_id) : null,
      });
      setIsTaskModalOpen(false);
      setTaskForm({
        worker_id: "",
        title: "",
        description: "",
        due_date: new Date().toISOString().split("T")[0],
        priority: "medium",
      });
      setSuccessMsg("Task assigned to workforce queue.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to dispatch task.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Verify Task
  const handleVerifyTask = async (taskId) => {
    try {
      await labourService.verifyTask(taskId);
      setSuccessMsg("Task completion reviewed and approved.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to verify task.");
    }
  };

  // Handler: Generate Payroll Run
  const handleGeneratePayroll = async () => {
    try {
      setSubmitting(true);
      await labourService.generatePayroll({
        farm_id: selectedFarmId,
        start_date: payrollStart,
        end_date: payrollEnd,
      });
      setSuccessMsg("Payroll calculation complete for period.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to generate payroll calculation.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Settle Payout
  const handleSettlePayout = async (e) => {
    e.preventDefault();
    if (!selectedPayrollRecord) return;

    try {
      setSubmitting(true);
      await labourService.updatePayrollPayment(selectedPayrollRecord.id, {
        payment_status: "paid",
        payment_method: payoutForm.payment_method,
        payment_date: payoutForm.payment_date,
        notes: payoutForm.notes,
      });
      setIsPayoutModalOpen(false);
      setSelectedPayrollRecord(null);
      setSuccessMsg("Wage payout recorded.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to record payout.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Resolve Incident
  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      setSubmitting(true);
      await labourService.resolveIncident(selectedIncident.id, {
        status: "resolved",
        resolution_notes: resolveForm.resolution_notes,
      });
      setIsResolveModalOpen(false);
      setSelectedIncident(null);
      setResolveForm({ resolution_notes: "" });
      setSuccessMsg("Incident resolved and archived.");
      await fetchLabourData();
    } catch (err) {
      alert(err.message || "Failed to resolve incident.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager"].includes(role);

  return (
    <div className="page-wrapper">
      {/* Top Header & Farm Switcher */}
      <div className="page-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.75rem", color: "var(--color-forest)" }}>
            Workforce & Labour Operations
          </h1>
          <p style={{ margin: 0, color: "var(--color-charcoal-60)", fontSize: "0.95rem" }}>
            Comprehensive workforce HR directory, daily muster-roll attendance, field task execution, and automated payroll runs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {farms.length > 1 && (
            <select
              value={selectedFarmId || ""}
              onChange={(e) => setSelectedFarmId(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                fontWeight: 600,
              }}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}

          {canManage && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsTaskModalOpen(true)}
              >
                + Assign Task
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsWorkerModalOpen(true)}
              >
                + Add Worker
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "16px" }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "12px 16px", backgroundColor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", marginBottom: "16px" }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Overview Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div className="content-card" style={{ padding: "14px", borderLeft: "4px solid var(--color-forest)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)", textTransform: "uppercase", fontWeight: 700 }}>Total Crew</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-forest)", marginTop: "4px" }}>
            {stats.activeCrew} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>workers</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#2E7D32" }}>{stats.digitalUsers} app accounts</span>
        </div>

        <div className="content-card" style={{ padding: "14px", borderLeft: "4px solid #2E7D32" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)", textTransform: "uppercase", fontWeight: 700 }}>On Shift Today</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#2E7D32", marginTop: "4px" }}>
            {stats.todayPresent} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>present</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Date: {attendanceDate}</span>
        </div>

        <div className="content-card" style={{ padding: "14px", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)", textTransform: "uppercase", fontWeight: 700 }}>Field Tasks</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#D97706", marginTop: "4px" }}>
            {stats.pendingTasks} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>active</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>{tasks.length} total tasks</span>
        </div>

        <div className="content-card" style={{ padding: "14px", borderLeft: "4px solid #DC2626" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)", textTransform: "uppercase", fontWeight: 700 }}>Field Hazards</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#DC2626", marginTop: "4px" }}>
            {stats.openIncidents} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>reported</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Worker alerts</span>
        </div>

        <div className="content-card" style={{ padding: "14px", borderLeft: "4px solid var(--color-gold)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)", textTransform: "uppercase", fontWeight: 700 }}>Est. Wage Bill</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-forest)", marginTop: "4px" }}>
            ZMW {stats.totalWageBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-charcoal-60)" }}>Selected pay cycle</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="content-card" style={{ padding: "6px 14px", marginBottom: "20px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: "10px", whiteSpace: "nowrap" }}>
          {[
            { id: "roster", label: `👥 Worker Roster & HR (${workers.length})` },
            { id: "attendance", label: `📋 Daily Muster Roll (${attendance.length})` },
            { id: "tasks", label: `🚜 Task Dispatch & Verification (${tasks.length})` },
            { id: "payroll", label: `💵 Automated Payroll & Payouts (${payroll.length})` },
            { id: "incidents", label: `⚠️ Field Hazards & Alerts (${incidents.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "10px 16px",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "var(--color-forest)" : "var(--color-charcoal-60)",
                borderBottom: activeTab === tab.id ? "3px solid var(--color-forest)" : "3px solid transparent",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading message="Syncing workforce operations..." />
      ) : (
        <>
          {/* ================================================================= */}
          {/* TAB 1: WORKER ROSTER & DIGITAL ACCOUNTS */}
          {/* ================================================================= */}
          {activeTab === "roster" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "16px" }}>
                {workers.length === 0 ? (
                  <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--color-charcoal-60)", fontSize: "1.1rem" }}>
                      No workers registered on this farm yet. Click <strong>+ Add Worker</strong> to build your team.
                    </p>
                  </div>
                ) : (
                  workers.map((w) => {
                    const isDigital = Boolean(w.user_id);
                    return (
                      <div key={w.id} className="content-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div>
                              <h3 style={{ margin: "0 0 4px 0", color: "var(--color-forest)", fontSize: "1.15rem" }}>
                                {w.first_name} {w.last_name}
                              </h3>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4B5563" }}>
                                {w.role?.replace(/_/g, " ").toUpperCase()}
                              </span>
                            </div>
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

                          <div style={{ margin: "10px 0", fontSize: "0.85rem", color: "#374151", display: "grid", gap: "4px" }}>
                            <div>📞 <strong>Phone:</strong> {w.phone || "Not recorded"}</div>
                            <div>🪪 <strong>National ID:</strong> {w.id_national_number || "Not on file"}</div>
                            <div>💰 <strong>Daily Wage:</strong> ZMW {Number(w.daily_rate).toFixed(2)} / day</div>
                            <div>📄 <strong>Contract:</strong> {w.employment_type?.replace(/_/g, " ")}</div>
                          </div>

                          {/* Digital Login Status Pill */}
                          <div style={{ marginTop: "12px", padding: "8px", borderRadius: "6px", backgroundColor: isDigital ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${isDigital ? "#BBF7D0" : "#E5E7EB"}` }}>
                            {isDigital ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#166534" }}>
                                <span>📱 <strong>App Login Active:</strong></span>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{w.account_email || "Linked"}</span>
                              </div>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>Offline Field Hand</span>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWorkerForLink(w);
                                      setLinkForm({ email: `${w.first_name.toLowerCase()}.${w.last_name.toLowerCase()}@farm.local`, password: "" });
                                      setIsLinkModalOpen(true);
                                    }}
                                    style={{
                                      padding: "3px 8px",
                                      fontSize: "0.75rem",
                                      borderRadius: "4px",
                                      border: "1px solid var(--color-forest)",
                                      backgroundColor: "#fff",
                                      color: "var(--color-forest)",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    + Link App Account
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {w.emergency_contact && (
                          <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#6B7280" }}>
                            🚨 Emergency: {w.emergency_contact}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: MUSTER ROLL (DAILY BULK ATTENDANCE) */}
          {/* ================================================================= */}
          {activeTab === "attendance" && (
            <div className="content-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontWeight: 600, color: "var(--color-forest)" }}>Select Shift Date:</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#F3F4F6",
                      border: "1px solid #D1D5DB",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Mark All Present
                  </button>
                </div>

                {canManage && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={submitting}
                    onClick={handleSaveBulkAttendance}
                  >
                    {submitting ? "Saving..." : "✓ Save & Confirm Muster Roll"}
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      <th style={{ padding: "10px" }}>Worker Name</th>
                      <th style={{ padding: "10px" }}>Specialization</th>
                      <th style={{ padding: "10px" }}>Shift Status</th>
                      <th style={{ padding: "10px", width: "100px" }}>Hours</th>
                      <th style={{ padding: "10px", width: "100px" }}>Overtime</th>
                      <th style={{ padding: "10px" }}>Self Clock-In Check</th>
                      <th style={{ padding: "10px" }}>Notes / Job Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => {
                      const entry = bulkAttendanceState[w.id] || {
                        status: "present",
                        hours_worked: 8.0,
                        overtime_hours: 0.0,
                        notes: "",
                      };
                      const existingLog = attendance.find((a) => a.worker_id === w.id);

                      return (
                        <tr key={w.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px", fontWeight: 600, color: "var(--color-forest)" }}>
                            {w.first_name} {w.last_name}
                          </td>
                          <td style={{ padding: "10px", fontSize: "0.8rem", color: "#6B7280" }}>
                            {w.role?.replace(/_/g, " ")}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <select
                              value={entry.status}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkAttendanceState((prev) => ({
                                  ...prev,
                                  [w.id]: {
                                    ...prev[w.id],
                                    status: val,
                                    hours_worked: val === "half_day" ? 4.0 : val === "absent" ? 0 : 8.0,
                                  },
                                }));
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
                            >
                              <option value="present">Present (Full Day)</option>
                              <option value="half_day">Half Day</option>
                              <option value="absent">Absent</option>
                              <option value="sick_leave">Sick Leave</option>
                              <option value="paid_leave">Paid Leave</option>
                              <option value="unpaid_leave">Unpaid Leave</option>
                            </select>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={entry.hours_worked}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBulkAttendanceState((prev) => ({
                                  ...prev,
                                  [w.id]: { ...prev[w.id], hours_worked: val },
                                }));
                              }}
                              style={{ width: "70px", padding: "4px 6px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
                            />
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="12"
                              value={entry.overtime_hours}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBulkAttendanceState((prev) => ({
                                  ...prev,
                                  [w.id]: { ...prev[w.id], overtime_hours: val },
                                }));
                              }}
                              style={{ width: "70px", padding: "4px 6px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
                            />
                          </td>
                          <td style={{ padding: "10px" }}>
                            {existingLog?.clock_in_time ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.8rem", color: "#047857", fontWeight: 600 }}>
                                  In: {existingLog.clock_in_time} {existingLog.clock_out_time ? `Out: ${existingLog.clock_out_time}` : ""}
                                </span>
                                {!existingLog.is_verified && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyAttendance(existingLog.id)}
                                    style={{
                                      padding: "2px 6px",
                                      fontSize: "0.7rem",
                                      backgroundColor: "#DEF7EC",
                                      color: "#03543F",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Verify
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Manual Roster</span>
                            )}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input
                              type="text"
                              placeholder="Notes / field details..."
                              value={entry.notes || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkAttendanceState((prev) => ({
                                  ...prev,
                                  [w.id]: { ...prev[w.id], notes: val },
                                }));
                              }}
                              style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: FIELD TASK DISPATCH & VERIFICATION */}
          {/* ================================================================= */}
          {activeTab === "tasks" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {tasks.length === 0 ? (
                  <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--color-charcoal-60)" }}>No field tasks assigned yet. Click <strong>+ Assign Task</strong> to delegate work.</p>
                  </div>
                ) : (
                  tasks.map((t) => {
                    const isPending = t.status === "pending";
                    const isInProgress = t.status === "in_progress";
                    const isCompleted = t.status === "completed";
                    const isVerified = Boolean(t.verified_at);

                    return (
                      <div
                        key={t.id}
                        className="content-card"
                        style={{
                          borderLeft: `4px solid ${
                            t.priority === "urgent" ? "#DC2626" : t.priority === "high" ? "#EA580C" : "var(--color-forest)"
                          }`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h4 style={{ margin: "0 0 6px 0", color: "var(--color-forest)", fontSize: "1.1rem" }}>
                              {t.title}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "10px",
                                backgroundColor: isCompleted ? "#DEF7EC" : isInProgress ? "#FEF3C7" : "#F3F4F6",
                                color: isCompleted ? "#03543F" : isInProgress ? "#92400E" : "#4B5563",
                                textTransform: "uppercase",
                              }}
                            >
                              {t.status?.replace(/_/g, " ")}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0 10px 0", fontSize: "0.85rem", color: "#4B5563" }}>
                            {t.description || "No specific instructions provided."}
                          </p>

                          <div style={{ fontSize: "0.8rem", color: "#6B7280", display: "grid", gap: "3px" }}>
                            <div>👤 <strong>Assigned To:</strong> {t.worker_first_name ? `${t.worker_first_name} ${t.worker_last_name}` : "Unassigned"}</div>
                            <div>📅 <strong>Due Date:</strong> {t.due_date || "Today"}</div>
                            <div>⚡ <strong>Priority:</strong> <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{t.priority}</span></div>
                          </div>

                          {/* Worker Completion Notes */}
                          {t.completion_notes && (
                            <div style={{ marginTop: "12px", padding: "8px 10px", borderRadius: "6px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534" }}>Worker Report:</span>
                              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#15803D" }}>"{t.completion_notes}"</p>
                              {t.completed_at && (
                                <span style={{ fontSize: "0.7rem", color: "#166534", display: "block", marginTop: "4px" }}>
                                  Finished at {new Date(t.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Owner Review / Verification Action */}
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {isCompleted && !isVerified ? (
                            <button
                              type="button"
                              onClick={() => handleVerifyTask(t.id)}
                              style={{
                                width: "100%",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#059669",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                              }}
                            >
                              ✓ Verify & Approve Completed Work
                            </button>
                          ) : isVerified ? (
                            <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>
                              ✓ Inspected & Verified by {t.verified_by_name || "Manager"}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Pending execution</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: AUTOMATED PAYROLL & PAYOUTS */}
          {/* ================================================================= */}
          {activeTab === "payroll" && (
            <div className="content-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <label style={{ fontWeight: 600, color: "var(--color-forest)" }}>Pay Cycle:</label>
                  <input
                    type="date"
                    value={payrollStart}
                    onChange={(e) => setPayrollStart(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={payrollEnd}
                    onChange={(e) => setPayrollEnd(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePayroll}
                    disabled={submitting}
                    className="btn-primary"
                    style={{ fontSize: "0.85rem", padding: "7px 14px" }}
                  >
                    ⚡ Calculate & Generate Payroll Run
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      <th style={{ padding: "10px" }}>Worker</th>
                      <th style={{ padding: "10px" }}>Role</th>
                      <th style={{ padding: "10px" }}>Daily Rate</th>
                      <th style={{ padding: "10px" }}>Days Worked</th>
                      <th style={{ padding: "10px" }}>Overtime Pay</th>
                      <th style={{ padding: "10px" }}>Net Payable (ZMW)</th>
                      <th style={{ padding: "10px" }}>Payment Status</th>
                      <th style={{ padding: "10px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#6B7280" }}>
                          No payroll records computed for this cycle. Click "Calculate & Generate Payroll Run" above to auto-tally confirmed shifts.
                        </td>
                      </tr>
                    ) : (
                      payroll.map((p) => {
                        const isPaid = p.payment_status === "paid";
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "10px", fontWeight: 600, color: "var(--color-forest)" }}>
                              {p.first_name} {p.last_name}
                            </td>
                            <td style={{ padding: "10px", fontSize: "0.8rem", color: "#6B7280" }}>
                              {p.worker_role?.replace(/_/g, " ")}
                            </td>
                            <td style={{ padding: "10px" }}>ZMW {Number(p.daily_rate).toFixed(2)}</td>
                            <td style={{ padding: "10px", fontWeight: 600 }}>{p.days_worked}</td>
                            <td style={{ padding: "10px" }}>ZMW {Number(p.overtime_amount).toFixed(2)}</td>
                            <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-forest)", fontSize: "1rem" }}>
                              ZMW {Number(p.net_payable).toFixed(2)}
                            </td>
                            <td style={{ padding: "10px" }}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "10px",
                                  backgroundColor: isPaid ? "#DEF7EC" : "#FEF3C7",
                                  color: isPaid ? "#03543F" : "#92400E",
                                  textTransform: "uppercase",
                                }}
                              >
                                {p.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: "10px" }}>
                              {!isPaid && canManage ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayrollRecord(p);
                                    setIsPayoutModalOpen(true);
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "0.8rem",
                                    backgroundColor: "var(--color-forest)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                >
                                  Mark as Paid
                                </button>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                                  Paid via {p.payment_method?.replace(/_/g, " ")} ({p.payment_date})
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: FIELD INCIDENTS & WORKER HAZARDS */}
          {/* ================================================================= */}
          {activeTab === "incidents" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {incidents.length === 0 ? (
                  <div className="content-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "var(--color-charcoal-60)" }}>✓ No field incidents or hazards currently reported by workers.</p>
                  </div>
                ) : (
                  incidents.map((i) => {
                    const isResolved = i.status === "resolved";
                    return (
                      <div
                        key={i.id}
                        className="content-card"
                        style={{
                          borderLeft: `4px solid ${
                            i.severity === "critical" ? "#B91C1C" : i.severity === "high" ? "#DC2626" : "#F59E0B"
                          }`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h4 style={{ margin: "0 0 6px 0", color: "#991B1B", fontSize: "1.05rem" }}>
                              {i.title}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "8px",
                                backgroundColor: isResolved ? "#DEF7EC" : "#FEE2E2",
                                color: isResolved ? "#03543F" : "#991B1B",
                                textTransform: "uppercase",
                              }}
                            >
                              {i.status}
                            </span>
                          </div>

                          <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#374151" }}>
                            {i.description}
                          </p>

                          <div style={{ fontSize: "0.8rem", color: "#6B7280", display: "grid", gap: "2px" }}>
                            <div>⚠️ <strong>Type:</strong> {i.type?.replace(/_/g, " ")} ({i.severity})</div>
                            <div>👤 <strong>Reported By:</strong> {i.worker_first_name ? `${i.worker_first_name} ${i.worker_last_name}` : i.reported_by_name}</div>
                            <div>🕒 <strong>Time:</strong> {new Date(i.created_at).toLocaleString()}</div>
                          </div>

                          {i.resolution_notes && (
                            <div style={{ marginTop: "10px", padding: "6px 8px", backgroundColor: "#F0FDF4", borderRadius: "4px", fontSize: "0.8rem", color: "#166534" }}>
                              <strong>Resolution:</strong> {i.resolution_notes}
                            </div>
                          )}
                        </div>

                        {!isResolved && canManage && (
                          <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #F3F4F6" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIncident(i);
                                setIsResolveModalOpen(true);
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "var(--color-forest)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                              }}
                            >
                              Resolve Incident
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD WORKER */}
      {/* =================================================================== */}
      {isWorkerModalOpen && (
        <Modal title="Register Farm Employee" onClose={() => setIsWorkerModalOpen(false)}>
          <form onSubmit={handleSaveWorker} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>First Name *</label>
                <input
                  type="text"
                  required
                  value={workerForm.first_name}
                  onChange={(e) => setWorkerForm({ ...workerForm, first_name: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Last Name *</label>
                <input
                  type="text"
                  required
                  value={workerForm.last_name}
                  onChange={(e) => setWorkerForm({ ...workerForm, last_name: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Specialization / Role</label>
                <select
                  value={workerForm.role}
                  onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  {WORKER_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Employment Type</label>
                <select
                  value={workerForm.employment_type}
                  onChange={(e) => setWorkerForm({ ...workerForm, employment_type: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  {EMPLOYMENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Daily Rate (ZMW) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={workerForm.daily_rate}
                  onChange={(e) => setWorkerForm({ ...workerForm, daily_rate: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+260 97..."
                  value={workerForm.phone}
                  onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>National Registration Card (NRC)</label>
                <input
                  type="text"
                  placeholder="e.g. 123456/78/1"
                  value={workerForm.id_national_number}
                  onChange={(e) => setWorkerForm({ ...workerForm, id_national_number: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Emergency Next of Kin</label>
                <input
                  type="text"
                  placeholder="Name & Contact"
                  value={workerForm.emergency_contact}
                  onChange={(e) => setWorkerForm({ ...workerForm, emergency_contact: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setIsWorkerModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Saving..." : "Register Employee"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* MODAL: LINK APP ACCOUNT */}
      {/* =================================================================== */}
      {isLinkModalOpen && selectedWorkerForLink && (
        <Modal title={`Create App Account for ${selectedWorkerForLink.first_name}`} onClose={() => setIsLinkModalOpen(false)}>
          <form onSubmit={handleLinkAccount} style={{ display: "grid", gap: "12px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-charcoal-60)", margin: 0 }}>
              Create digital credentials for <strong>{selectedWorkerForLink.first_name} {selectedWorkerForLink.last_name}</strong> so they can log into the <strong>Worker Portal (`/my-work`)</strong> on their phone to clock in and track tasks.
            </p>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Worker Login Email *</label>
              <input
                type="email"
                required
                value={linkForm.email}
                onChange={(e) => setLinkForm({ ...linkForm, email: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Temporary Password (min 8 chars) *</label>
              <input
                type="password"
                required
                minLength="8"
                placeholder="Assign secure password"
                value={linkForm.password}
                onChange={(e) => setLinkForm({ ...linkForm, password: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setIsLinkModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Creating..." : "Create Login & Link"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* MODAL: ASSIGN TASK */}
      {/* =================================================================== */}
      {isTaskModalOpen && (
        <Modal title="Dispatch Field Task" onClose={() => setIsTaskModalOpen(false)}>
          <form onSubmit={handleSaveTask} style={{ display: "grid", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Inspect Drip Line in Sector 4"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Assign To Worker</label>
                <select
                  value={taskForm.worker_id}
                  onChange={(e) => setTaskForm({ ...taskForm, worker_id: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">-- Unassigned / General Queue --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.first_name} {w.last_name} ({w.role?.replace(/_/g, " ")})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Target Due Date</label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Instructions & Location</label>
              <textarea
                rows="3"
                placeholder="Specific instructions, tool requirements, safety protocols..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Assigning..." : "Dispatch Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* MODAL: SETTLE PAYOUT */}
      {/* =================================================================== */}
      {isPayoutModalOpen && selectedPayrollRecord && (
        <Modal title={`Settle Wage Payout: ${selectedPayrollRecord.first_name}`} onClose={() => setIsPayoutModalOpen(false)}>
          <form onSubmit={handleSettlePayout} style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "10px", backgroundColor: "#F9FAFB", borderRadius: "6px", fontSize: "0.9rem" }}>
              <div><strong>Worker:</strong> {selectedPayrollRecord.first_name} {selectedPayrollRecord.last_name}</div>
              <div><strong>Period:</strong> {selectedPayrollRecord.period_start} to {selectedPayrollRecord.period_end}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-forest)", marginTop: "4px" }}>
                Amount to Disburse: ZMW {Number(selectedPayrollRecord.net_payable).toFixed(2)}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Payment Channel</label>
              <select
                value={payoutForm.payment_method}
                onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="mobile_money">Mobile Money (Airtel / MTN Money)</option>
                <option value="cash">Cash in Hand</option>
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Disbursement Date</label>
              <input
                type="date"
                value={payoutForm.payment_date}
                onChange={(e) => setPayoutForm({ ...payoutForm, payment_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Reference / Voucher / Notes</label>
              <input
                type="text"
                placeholder="e.g. MTN Ref: 489348923 or Cash voucher #12"
                value={payoutForm.notes}
                onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Confirming..." : "Confirm Payout"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* MODAL: RESOLVE INCIDENT */}
      {/* =================================================================== */}
      {isResolveModalOpen && selectedIncident && (
        <Modal title="Resolve Hazard / Incident" onClose={() => setIsResolveModalOpen(false)}>
          <form onSubmit={handleResolveIncident} style={{ display: "grid", gap: "12px" }}>
            <p style={{ fontSize: "0.85rem", color: "#991B1B", margin: 0 }}>
              Resolving: <strong>{selectedIncident.title}</strong>
            </p>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Resolution Notes & Corrective Actions</label>
              <textarea
                rows="4"
                required
                placeholder="Explain how the issue was fixed (e.g. Replaced drip valve, isolated animal, repaired belt)..."
                value={resolveForm.resolution_notes}
                onChange={(e) => setResolveForm({ ...resolveForm, resolution_notes: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setIsResolveModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Resolving..." : "Mark as Resolved"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Labour;