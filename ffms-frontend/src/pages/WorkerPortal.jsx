import { useState, useEffect, useCallback } from "react";
import labourService from "../services/labourService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function WorkerPortal() {
  const { user } = useAuth();
  const [workerInfo, setWorkerInfo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [paySlips, setPaySlips] = useState([]);
  const [farms, setFarms] = useState([]);

  const [activeTab, setActiveTab] = useState("tasks"); // 'tasks' | 'incident' | 'timesheet' | 'payslips'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Shift Status
  const [shiftActive, setShiftActive] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);

  // Modals
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");

  // Incident Form
  const [incidentForm, setIncidentForm] = useState({
    farm_id: "",
    title: "",
    type: "hazard",
    severity: "medium",
    description: "",
  });

  const fetchWorkerData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [taskRes, attendRes, payRes, farmList] = await Promise.all([
        labourService.getMyTasks().catch(() => ({ data: [] })),
        labourService.getMyAttendance().catch(() => []),
        labourService.getMyPayroll().catch(() => []),
        farmService.getFarms().catch(() => []),
      ]);

      if (taskRes.worker) {
        setWorkerInfo(taskRes.worker);
      }
      setTasks(taskRes.data || []);
      setAttendanceLogs(attendRes);
      setPaySlips(payRes);
      setFarms(farmList);

      if (farmList.length > 0 && !incidentForm.farm_id) {
        setIncidentForm((prev) => ({ ...prev, farm_id: farmList[0].id }));
      }

      // Check if already clocked in today
      const todayStr = new Date().toISOString().split("T")[0];
      const todayLog = attendRes.find((a) => a.work_date === todayStr);
      if (todayLog && todayLog.clock_in_time && !todayLog.clock_out_time) {
        setShiftActive(true);
        setClockInTime(todayLog.clock_in_time);
      } else {
        setShiftActive(false);
        setClockInTime(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load worker workspace.");
    } finally {
      setLoading(false);
    }
  }, [incidentForm.farm_id]);

  useEffect(() => {
    fetchWorkerData();
  }, [fetchWorkerData]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Clock In
  const handleClockIn = async () => {
    try {
      setSubmitting(true);
      await labourService.clockIn();
      setShiftActive(true);
      setClockInTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSuccessMsg("Shift started! Have a productive and safe day.");
      await fetchWorkerData();
    } catch (err) {
      alert(err.message || "Failed to clock in.");
    } finally {
      setSubmitting(false);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    if (!window.confirm("Are you sure you want to clock out and end your shift for today?")) return;
    try {
      setSubmitting(true);
      await labourService.clockOut();
      setShiftActive(false);
      setClockInTime(null);
      setSuccessMsg("Shift ended. Thank you for your hard work!");
      await fetchWorkerData();
    } catch (err) {
      alert(err.message || "Failed to clock out.");
    } finally {
      setSubmitting(false);
    }
  };

  // Start Task
  const handleStartTask = async (taskId) => {
    try {
      await labourService.updateMyTask(taskId, "in_progress");
      setSuccessMsg("Task status updated: In Progress.");
      await fetchWorkerData();
    } catch (err) {
      alert(err.message || "Failed to start task.");
    }
  };

  // Complete Task
  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTaskForComplete) return;

    try {
      setSubmitting(true);
      await labourService.updateMyTask(
        selectedTaskForComplete.id,
        "completed",
        completionNotes.trim()
      );
      setIsCompleteModalOpen(false);
      setSelectedTaskForComplete(null);
      setCompletionNotes("");
      setSuccessMsg("Task submitted for manager review!");
      await fetchWorkerData();
    } catch (err) {
      alert(err.message || "Failed to submit task completion.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Incident
  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.title.trim()) return;

    try {
      setSubmitting(true);
      await labourService.reportIncident(incidentForm);
      setIncidentForm({
        farm_id: farms[0]?.id || 1,
        title: "",
        type: "hazard",
        severity: "medium",
        description: "",
      });
      setSuccessMsg("Field alert sent to farm owner and management.");
      setActiveTab("tasks");
    } catch (err) {
      alert(err.message || "Failed to report incident.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="page-wrapper" style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
      {/* Worker Shift & Identity Banner */}
      <div
        className="content-card"
        style={{
          background: "linear-gradient(135deg, var(--color-forest) 0%, #2D6A4F 100%)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-gold)", fontWeight: 700 }}>
              Field Crew Self-Service Portal
            </span>
            <h1 style={{ margin: "6px 0 2px 0", fontSize: "1.7rem", color: "#fff" }}>
              {workerInfo ? `${workerInfo.first_name} ${workerInfo.last_name}` : user?.name || "Field Worker"}
            </h1>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#E5E7EB" }}>
              Role: <strong>{workerInfo?.role?.replace(/_/g, " ").toUpperCase() || "FIELD OPERATOR"}</strong>
            </p>
          </div>

          {/* Quick Clock-In / Out Hero Control */}
          <div style={{ textAlign: "right" }}>
            {shiftActive ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#DEF7EC", color: "#03543F", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#059669" }}></span>
                  On Shift Since {clockInTime}
                </span>
                <button
                  type="button"
                  onClick={handleClockOut}
                  disabled={submitting}
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(220,38,38,0.3)",
                  }}
                >
                  ⏹ Clock Out Shift
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={submitting}
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#1F2937",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(245,158,11,0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ▶ Clock In (Start Shift)
              </button>
            )}
          </div>
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

      {/* Mobile-Friendly Navigation Tabs */}
      <div className="content-card" style={{ padding: "6px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
          {[
            { id: "tasks", label: "My Tasks", badge: activeTasks.length },
            { id: "incident", label: "Report Hazard" },
            { id: "timesheet", label: "Timesheets" },
            { id: "payslips", label: "Pay Slips" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 4px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: activeTab === tab.id ? "var(--color-forest)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "var(--color-charcoal-60)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    marginLeft: "6px",
                    backgroundColor: activeTab === tab.id ? "var(--color-gold)" : "#E5E7EB",
                    color: activeTab === tab.id ? "#1F2937" : "#4B5563",
                    fontSize: "0.7rem",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading message="Loading worker workspace..." />
      ) : (
        <>
          {/* ================================================================= */}
          {/* TAB 1: MY FIELD TASKS */}
          {/* ================================================================= */}
          {activeTab === "tasks" && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "var(--color-forest)", fontSize: "1.2rem" }}>
                  Active Work Assignments ({activeTasks.length})
                </h3>

                {activeTasks.length === 0 ? (
                  <div className="content-card" style={{ textAlign: "center", padding: "30px" }}>
                    <p style={{ color: "#6B7280", margin: 0 }}>🎉 No pending tasks assigned right now. You are all caught up!</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {activeTasks.map((t) => {
                      const isInProgress = t.status === "in_progress";
                      return (
                        <div
                          key={t.id}
                          className="content-card"
                          style={{
                            borderLeft: `5px solid ${t.priority === "urgent" ? "#DC2626" : t.priority === "high" ? "#EA580C" : "var(--color-forest)"}`,
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-forest)" }}>
                              {t.title}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "8px",
                                backgroundColor: isInProgress ? "#FEF3C7" : "#F3F4F6",
                                color: isInProgress ? "#92400E" : "#4B5563",
                                textTransform: "uppercase",
                              }}
                            >
                              {isInProgress ? "In Progress" : "Pending"}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0 10px 0", fontSize: "0.9rem", color: "#374151" }}>
                            {t.description || "Follow standard field operating instructions."}
                          </p>

                          <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "#6B7280", marginBottom: "12px", flexWrap: "wrap" }}>
                            {t.field_name && <div>📍 <strong>Field:</strong> {t.field_name}</div>}
                            <div>📅 <strong>Due:</strong> {t.due_date || "Today"}</div>
                            <div>⚡ <strong>Priority:</strong> {t.priority?.toUpperCase()}</div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            {!isInProgress ? (
                              <button
                                type="button"
                                onClick={() => handleStartTask(t.id)}
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "var(--color-forest)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                ▶ Start Task
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskForComplete(t);
                                  setIsCompleteModalOpen(true);
                                }}
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#059669",
                                  color: "#fff",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                ✓ Submit as Completed
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIncidentForm((prev) => ({
                                  ...prev,
                                  title: `Issue on task: ${t.title}`,
                                  type: "hazard",
                                }));
                                setActiveTab("incident");
                              }}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #D1D5DB",
                                backgroundColor: "#fff",
                                color: "#DC2626",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                              }}
                            >
                              ⚠️ Report Issue
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Completed Tasks Accordion */}
              {completedTasks.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#6B7280", fontSize: "1rem" }}>
                    Completed Work ({completedTasks.length})
                  </h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {completedTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="content-card" style={{ padding: "12px", opacity: 0.9 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: "#374151" }}>{t.title}</span>
                          <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>✓ COMPLETED</span>
                        </div>
                        {t.completion_notes && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#6B7280", fontStyle: "italic" }}>
                            "{t.completion_notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: REPORT FIELD HAZARD / ISSUE */}
          {/* ================================================================= */}
          {activeTab === "incident" && (
            <div className="content-card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 6px 0", color: "#DC2626", fontSize: "1.2rem" }}>
                ⚠️ Report Field Hazard or Equipment Obstacle
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#6B7280" }}>
                Alert farm management immediately about irrigation leaks, equipment breakdowns, pest sightings, or safety hazards.
              </p>

              <form onSubmit={handleSubmitIncident} style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Incident Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Major pipe burst near Sector 3 drip filter"
                    value={incidentForm.title}
                    onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Category</label>
                    <select
                      value={incidentForm.type}
                      onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                    >
                      <option value="irrigation_leak">Irrigation Pipe / Valve Leak</option>
                      <option value="equipment_breakdown">Tractor / Implement Breakdown</option>
                      <option value="pest_outbreak">Pest / Disease Sighting</option>
                      <option value="livestock_injury">Sick / Injured Animal</option>
                      <option value="hazard">Safety / Boundary Hazard</option>
                      <option value="other">Other Issue</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Urgency Level</label>
                    <select
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                    >
                      <option value="low">Low (Notice)</option>
                      <option value="medium">Medium (Needs attention)</option>
                      <option value="high">High (Urgent)</option>
                      <option value="critical">Critical (Immediate action)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Description & Location Details</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Exact location, symptoms, animal tag number, or what happened..."
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  {submitting ? "Sending Alert..." : "🚨 Transmit Alert to Management"}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: TIMESHEETS & SHIFT HISTORY */}
          {/* ================================================================= */}
          {activeTab === "timesheet" && (
            <div className="content-card" style={{ padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "var(--color-forest)", fontSize: "1.15rem" }}>
                My Shift Attendance History
              </h3>

              {attendanceLogs.length === 0 ? (
                <p style={{ color: "#6B7280" }}>No shift history logged yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  {attendanceLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-forest)" }}>{log.work_date}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "2px" }}>
                          Clock In: {log.clock_in_time || "08:00"} {log.clock_out_time ? `• Out: ${log.clock_out_time}` : ""}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "#1F2937", fontSize: "0.95rem" }}>
                          {log.hours_worked} hrs
                        </span>
                        {log.overtime_hours > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "#F59E0B", fontWeight: 600 }}>
                            +{log.overtime_hours} OT
                          </div>
                        )}
                        <span style={{ display: "block", fontSize: "0.7rem", color: log.is_verified ? "#059669" : "#6B7280" }}>
                          {log.is_verified ? "✓ Verified" : "Pending Approval"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: PAY SLIPS & EARNINGS */}
          {/* ================================================================= */}
          {activeTab === "payslips" && (
            <div className="content-card" style={{ padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "var(--color-forest)", fontSize: "1.15rem" }}>
                My Pay Slips & Disbursements
              </h3>

              {paySlips.length === 0 ? (
                <p style={{ color: "#6B7280" }}>No pay slips generated for your profile yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {paySlips.map((p) => {
                    const isPaid = p.payment_status === "paid";
                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: "16px",
                          borderRadius: "8px",
                          border: `1px solid ${isPaid ? "#BBF7D0" : "#FDE68A"}`,
                          backgroundColor: isPaid ? "#F0FDF4" : "#FEFCE8",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={{ fontSize: "0.8rem", color: "#4B5563" }}>Period:</span>
                            <div style={{ fontWeight: 700, color: "var(--color-forest)" }}>
                              {p.period_start} to {p.period_end}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#374151", marginTop: "4px" }}>
                              Days Worked: <strong>{p.days_worked}</strong> | Overtime: <strong>ZMW {Number(p.overtime_amount).toFixed(2)}</strong>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-forest)" }}>
                              ZMW {Number(p.net_payable).toFixed(2)}
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "8px",
                                backgroundColor: isPaid ? "#DEF7EC" : "#FEF3C7",
                                color: isPaid ? "#03543F" : "#92400E",
                                textTransform: "uppercase",
                              }}
                            >
                              {p.payment_status}
                            </span>
                          </div>
                        </div>

                        {isPaid && (
                          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #D1D5DB", fontSize: "0.8rem", color: "#4B5563" }}>
                            Disbursed via <strong>{p.payment_method?.replace(/_/g, " ")}</strong> on {p.payment_date}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: SUBMIT TASK COMPLETION */}
      {isCompleteModalOpen && selectedTaskForComplete && (
        <Modal title="Complete Field Task" onClose={() => setIsCompleteModalOpen(false)}>
          <form onSubmit={handleCompleteTask} style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-forest)", fontWeight: 600 }}>
              {selectedTaskForComplete.title}
            </p>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Field Report / Completion Notes
              </label>
              <textarea
                rows="4"
                required
                placeholder="Describe work performed, rows covered, materials applied, or any observations..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Submitting..." : "Submit Completed Work"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default WorkerPortal;
