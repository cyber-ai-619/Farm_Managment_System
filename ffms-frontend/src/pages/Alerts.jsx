import { useState, useEffect, useCallback } from "react";
import alertService from "../services/alertService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Alerts() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({
    farm_id: "",
    title: "",
    message: "",
    severity: "warning",
    category: "general",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load farms
  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
        setAlertForm((prev) => ({ ...prev, farm_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  // Load alerts
  const loadAlerts = useCallback(async (farmId) => {
    if (!farmId) return;
    setLoading(true);
    setError("");
    try {
      const [activeList, histList] = await Promise.all([
        alertService.getActiveAlerts(farmId),
        alertService.getAlertHistory(farmId, 50).catch(() => []),
      ]);
      setActiveAlerts(activeList);
      setAlertHistory(histList);
    } catch (err) {
      setError(err.message || "Failed to load notification alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      loadAlerts(selectedFarmId);
    }
  }, [selectedFarmId, loadAlerts]);

  // Actions
  const handleRunScan = async () => {
    try {
      setScanning(true);
      await alertService.triggerScan(selectedFarmId);
      await loadAlerts(selectedFarmId);
    } catch (err) {
      alert(err.message || "Automated scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      await alertService.dismissAlert(alertId);
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
      // Refresh history in background
      alertService.getAlertHistory(selectedFarmId).then(setAlertHistory).catch(() => {});
    } catch (err) {
      alert(err.message || "Failed to dismiss alert.");
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId);
      setActiveAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: 1 } : a))
      );
    } catch (err) {
      alert(err.message || "Failed to mark alert as read.");
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.message.trim()) return;
    try {
      setSubmitting(true);
      await alertService.createAlert({ ...alertForm, farm_id: selectedFarmId });
      setIsCreateModalOpen(false);
      setAlertForm((prev) => ({ ...prev, title: "", message: "" }));
      await loadAlerts(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to broadcast alert.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager"].includes(role);

  // Stats
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;
  const unreadCount = activeAlerts.filter((a) => !a.is_read || a.is_read === 0).length;

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>System Alerts & Real-Time Monitoring</h1>
          <p>Automated threshold monitors, risk alerts, machine service alerts, and incident broadcasts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            disabled={scanning}
            onClick={handleRunScan}
            style={{
              padding: "8px 16px",
              backgroundColor: scanning ? "#DDD" : "#FFF",
              color: "var(--color-forest, #1E4632)",
              border: "1px solid var(--color-forest, #1E4632)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: scanning ? "not-allowed" : "pointer",
            }}
          >
            {scanning ? "Scanning System..." : "🔍 Run System Scan"}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--color-forest, #1E4632)",
                color: "#FFF",
                border: "1px solid var(--color-gold, #D4A54A)",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Broadcast Alert
            </button>
          )}
        </div>
      </div>

      {/* Farm Selector */}
      {farms.length > 1 && (
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: 600 }}>Active Farm:</label>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CCC", backgroundColor: "#FFF" }}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #C0392B" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Critical Alerts
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#C0392B", marginTop: "4px" }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Requires immediate farm action</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Warnings / Watchlists
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#B8860B", marginTop: "4px" }}>
            {warningCount}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Maintenance, weather & inventory</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #1E4632" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Active Unresolved
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E4632", marginTop: "4px" }}>
            {activeAlerts.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{unreadCount} unread by you</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #3498DB" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Resolved in History
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3498DB", marginTop: "4px" }}>
            {alertHistory.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Archived audit history</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E0E0E0", marginBottom: "20px" }}>
        {[
          { id: "active", label: `Active Alerts (${activeAlerts.length})` },
          { id: "history", label: `Historical Audit Logs (${alertHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--color-forest, #1E4632)" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab.id ? "var(--color-forest, #1E4632)" : "#666",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading message="Scanning farm alerts..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: ACTIVE ALERTS */}
          {activeTab === "active" && (
            <div className="page-content-section">
              {activeAlerts.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
                  <h3>All Systems Operational</h3>
                  <p style={{ color: "#666" }}>
                    No active risks or threshold violations detected across fields, livestock, inventory, or machinery.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {activeAlerts.map((alert) => {
                    const isCrit = alert.severity === "critical";
                    const isWarn = alert.severity === "warning";
                    const borderColor = isCrit ? "#C0392B" : isWarn ? "#D4A54A" : "#3498DB";
                    const bgColor = isCrit ? "#FDF2E9" : isWarn ? "#FEF9E7" : "#EBF5FB";

                    return (
                      <div
                        key={alert.id}
                        className="content-card"
                        style={{
                          padding: "16px 20px",
                          borderLeft: `5px solid ${borderColor}`,
                          backgroundColor: alert.is_read ? "#FFF" : bgColor,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                backgroundColor: borderColor,
                                color: "#FFF",
                              }}
                            >
                              {alert.severity}
                            </span>
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                backgroundColor: "rgba(0,0,0,0.06)",
                                color: "#555",
                                textTransform: "capitalize",
                              }}
                            >
                              {alert.category || "General"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#888" }}>
                              {alert.created_at || "Just now"}
                            </span>
                          </div>

                          <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#1E4632" }}>
                            {alert.title}
                          </h3>
                          <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>{alert.message}</p>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {!alert.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(alert.id)}
                              style={{
                                padding: "6px 10px",
                                backgroundColor: "#FFF",
                                border: "1px solid #CCC",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "var(--color-forest, #1E4632)",
                              color: "#FFF",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT HISTORY */}
          {activeTab === "history" && (
            <div className="page-content-section">
              {alertHistory.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No historical alert logs archived.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Time</th>
                        <th style={{ padding: "12px 16px" }}>Severity</th>
                        <th style={{ padding: "12px 16px" }}>Category</th>
                        <th style={{ padding: "12px 16px" }}>Title</th>
                        <th style={{ padding: "12px 16px" }}>Message</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertHistory.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontSize: "13px" }}>{item.created_at}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                backgroundColor:
                                  item.severity === "critical"
                                    ? "#C0392B"
                                    : item.severity === "warning"
                                    ? "#D4A54A"
                                    : "#3498DB",
                                color: "#FFF",
                              }}
                            >
                              {item.severity}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>{item.category}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: "12px 16px", color: "#555" }}>{item.message}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888" }}>
                            {item.is_dismissed ? "Dismissed" : "Resolved"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Alert Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Broadcast Farm Alert">
        <form onSubmit={handleCreateAlert} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Alert Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Frost Warning for Sector A"
              value={alertForm.title}
              onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Severity</label>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Category</label>
              <select
                value={alertForm.category}
                onChange={(e) => setAlertForm({ ...alertForm, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="general">General</option>
                <option value="weather">Weather</option>
                <option value="irrigation">Irrigation / Water</option>
                <option value="inventory">Inventory / Stock</option>
                <option value="equipment">Equipment / Fleet</option>
                <option value="pest_disease">Pest / Disease</option>
                <option value="livestock">Livestock</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Alert Message / Instructions *</label>
            <textarea
              rows="3"
              required
              placeholder="Describe the incident, precautionary actions, or instructions for field operators..."
              value={alertForm.message}
              onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Broadcasting..." : "Broadcast Alert"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Alerts;