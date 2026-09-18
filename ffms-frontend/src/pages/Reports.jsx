import { useState, useEffect, useCallback } from "react";
import reportService from "../services/reportService";
import farmService from "../services/farmService";
import Loading from "../components/Loading";

function Reports() {
  const currentYear = new Date().getFullYear();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);
  const [activeReport, setActiveReport] = useState("scorecard");

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reportDefinitions = [
    { id: "scorecard", name: "Farm Performance Scorecard", category: "Executive" },
    { id: "financial", name: "Profit & Loss Statement", category: "Financial" },
    { id: "expenses", name: "Detailed Expenses Audit", category: "Financial" },
    { id: "sales", name: "Commercial Sales & Orders", category: "Financial" },
    { id: "profitability", name: "Crop Profitability", category: "Agronomy" },
    { id: "yield", name: "Yield & Loss Efficiency", category: "Agronomy" },
    { id: "crop_production", name: "Crop Plantings & Cycles", category: "Agronomy" },
    { id: "livestock", name: "Livestock Productivity & Health", category: "Livestock" },
    { id: "inventory", name: "Inventory Asset Valuation", category: "Operations" },
    { id: "irrigation", name: "Water & Irrigation Consumption", category: "Operations" },
    { id: "equipment", name: "Equipment Utilization & Fuel", category: "Operations" },
    { id: "labour", name: "Labour Attendance & Tasks", category: "Workforce" },
    { id: "pest_disease", name: "Pest & Pathogen Treatments", category: "Agronomy" },
  ];

  // Load farms
  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  // Load selected report data
  const loadReport = useCallback(async () => {
    if (!selectedFarmId) return;
    setLoading(true);
    setError("");
    setReportData(null);

    try {
      let res;
      switch (activeReport) {
        case "scorecard":
          res = await reportService.getFarmPerformance(selectedFarmId, fromDate, toDate);
          break;
        case "financial":
          res = await reportService.getFinancial(selectedFarmId, fromDate, toDate);
          break;
        case "expenses":
          res = await reportService.getExpenses(selectedFarmId, fromDate, toDate);
          break;
        case "sales":
          res = await reportService.getSales(selectedFarmId, fromDate, toDate);
          break;
        case "profitability":
          res = await reportService.getProfitability(selectedFarmId, fromDate, toDate);
          break;
        case "yield":
          res = await reportService.getYieldReport(selectedFarmId, fromDate, toDate);
          break;
        case "crop_production":
          res = await reportService.getCropProduction(selectedFarmId, fromDate, toDate);
          break;
        case "livestock":
          res = await reportService.getLivestock(selectedFarmId, fromDate, toDate);
          break;
        case "inventory":
          res = await reportService.getInventory(selectedFarmId);
          break;
        case "irrigation":
          res = await reportService.getIrrigation(selectedFarmId, fromDate, toDate);
          break;
        case "equipment":
          res = await reportService.getEquipment(selectedFarmId);
          break;
        case "labour":
          res = await reportService.getLabour(selectedFarmId, fromDate, toDate);
          break;
        case "pest_disease":
          res = await reportService.getPestDisease(selectedFarmId, fromDate, toDate);
          break;
        default:
          res = null;
      }
      setReportData(res);
    } catch (err) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, activeReport, fromDate, toDate]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      loadReport();
    }
  }, [selectedFarmId, activeReport, loadReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const items = reportData.data || reportData.crops || [];
    if (items.length === 0) {
      alert("No data rows available to export for this report.");
      return;
    }

    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(","),
      ...items.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName] !== null && row[fieldName] !== undefined ? row[fieldName] : "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `farm_report_${activeReport}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper">
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Farm Reports & Business Intelligence</h1>
          <p>Multi-dimensional operational analytics, regulatory audit reports, and profitability metrics.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FFF",
              color: "var(--color-forest, #1E4632)",
              border: "1px solid var(--color-forest, #1E4632)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📥 Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
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
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="content-card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: 600, fontSize: "13px" }}>Farm:</label>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #CCC", backgroundColor: "#FFF" }}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: 600, fontSize: "13px" }}>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #CCC" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: 600, fontSize: "13px" }}>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #CCC" }}
          />
        </div>

        <button
          type="button"
          onClick={loadReport}
          style={{
            padding: "6px 14px",
            backgroundColor: "var(--color-forest, #1E4632)",
            color: "#FFF",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Apply Filter
        </button>
      </div>

      {/* 13 Report Tabs Bar */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "8px",
          borderBottom: "2px solid #E0E0E0",
          marginBottom: "20px",
        }}
      >
        {reportDefinitions.map((rep) => (
          <button
            key={rep.id}
            type="button"
            onClick={() => setActiveReport(rep.id)}
            style={{
              padding: "8px 14px",
              whiteSpace: "nowrap",
              fontSize: "13px",
              fontWeight: activeReport === rep.id ? 700 : 500,
              borderRadius: "6px",
              border: activeReport === rep.id ? "1px solid var(--color-forest, #1E4632)" : "1px solid #E0E0E0",
              backgroundColor: activeReport === rep.id ? "var(--color-forest, #1E4632)" : "#FFF",
              color: activeReport === rep.id ? "#FFF" : "#444",
              cursor: "pointer",
            }}
          >
            {rep.name}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {loading ? (
        <Loading message="Generating analytical report..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : !reportData ? (
        <div className="content-card" style={{ padding: "40px", textAlign: "center" }}>
          <p>No report data returned for the selected filter.</p>
        </div>
      ) : (
        <div>
          {/* 1. SCORECARD */}
          {activeReport === "scorecard" && (
            <div className="page-content-section">
              <h2>Holistic Farm Performance Scorecard</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  margin: "16px 0",
                }}
              >
                <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #2E7D32" }}>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>Total Revenue</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2E7D32" }}>
                    ${Number(reportData.financial?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #C0392B" }}>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>Total Expenses</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#C0392B" }}>
                    ${Number(reportData.financial?.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>Net Profit Margin</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#B8860B" }}>
                    {reportData.financial?.margin_pct || 0}%
                  </div>
                </div>
                <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #1E4632" }}>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>Total Harvest Yield</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E4632" }}>
                    {Number(reportData.production?.total_harvest_kg || 0).toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    Loss rate: {reportData.production?.loss_rate_pct || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFIT & LOSS */}
          {activeReport === "financial" && (
            <div className="page-content-section">
              <h2>Profit & Loss Report ({reportData.from} to {reportData.to})</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", margin: "16px 0" }}>
                <div className="content-card" style={{ padding: "20px" }}>
                  <h4 style={{ color: "#2E7D32", marginBottom: "12px" }}>Revenue Streams</h4>
                  {Object.entries(reportData.income || {}).map(([cat, amt]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #EEE" }}>
                      <span>{cat}</span>
                      <strong>+${Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", fontWeight: "bold", color: "#2E7D32" }}>
                    <span>Total Operating Income:</span>
                    <span>+${Number(reportData.total_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="content-card" style={{ padding: "20px" }}>
                  <h4 style={{ color: "#C0392B", marginBottom: "12px" }}>Operating Expenses</h4>
                  {Object.entries(reportData.expenses || {}).map(([cat, amt]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #EEE" }}>
                      <span>{cat}</span>
                      <strong>-${Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", fontWeight: "bold", color: "#C0392B" }}>
                    <span>Total Operating Expenses:</span>
                    <span>-${Number(reportData.total_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="content-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold" }}>Net Farm Operating Profit / (Loss):</span>
                <span style={{ fontSize: "22px", fontWeight: "bold", color: Number(reportData.net_profit) >= 0 ? "#2E7D32" : "#C0392B" }}>
                  ${Number(reportData.net_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({reportData.margin_pct}%)
                </span>
              </div>
            </div>
          )}

          {/* 3. EXPENSES AUDIT */}
          {activeReport === "expenses" && (
            <div className="page-content-section">
              <h2>Itemized Expenses Audit ({reportData.count || 0} records)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Date</th>
                      <th style={{ padding: "10px 14px" }}>Category</th>
                      <th style={{ padding: "10px 14px" }}>Amount</th>
                      <th style={{ padding: "10px 14px" }}>Payment Method</th>
                      <th style={{ padding: "10px 14px" }}>Vendor</th>
                      <th style={{ padding: "10px 14px" }}>Audited By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px" }}>{row.date_incurred}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.category}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#C0392B" }}>
                          -${Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>{row.payment_method}</td>
                        <td style={{ padding: "10px 14px" }}>{row.vendor_name || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#666" }}>{row.recorded_by_name || "Staff"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SALES SUMMARY */}
          {activeReport === "sales" && (
            <div className="page-content-section">
              <h2>Commercial Sales Summary ({reportData.count || 0} orders)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Order ID</th>
                      <th style={{ padding: "10px 14px" }}>Customer</th>
                      <th style={{ padding: "10px 14px" }}>Order Date</th>
                      <th style={{ padding: "10px 14px" }}>Total Amount</th>
                      <th style={{ padding: "10px 14px" }}>Status</th>
                      <th style={{ padding: "10px 14px" }}>Invoice #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>ORD-{row.id}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.customer_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.order_date}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2E7D32" }}>
                          ${Number(row.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>{row.status}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px" }}>{row.invoice_number || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CROP PROFITABILITY */}
          {activeReport === "profitability" && (
            <div className="page-content-section">
              <h2>Crop Profitability & Revenue Generated</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Crop Name</th>
                      <th style={{ padding: "10px 14px" }}>Total Harvested</th>
                      <th style={{ padding: "10px 14px" }}>Sales Revenue ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.crop_id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1E4632" }}>{row.crop_name}</td>
                        <td style={{ padding: "10px 14px" }}>{Number(row.harvested_kg).toLocaleString()} kg</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2E7D32" }}>
                          ${Number(row.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. YIELD & LOSS */}
          {activeReport === "yield" && (
            <div className="page-content-section">
              <h2>Harvest Yield & Loss Efficiency</h2>
              <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
                <div className="content-card" style={{ padding: "12px 18px" }}>
                  <span>Total Harvested:</span> <strong>{reportData.total_yield_kg?.toLocaleString()} kg</strong>
                </div>
                <div className="content-card" style={{ padding: "12px 18px" }}>
                  <span>Total Losses:</span> <strong style={{ color: "#C0392B" }}>{reportData.total_loss_kg?.toLocaleString()} kg</strong>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Date</th>
                      <th style={{ padding: "10px 14px" }}>Crop</th>
                      <th style={{ padding: "10px 14px" }}>Field</th>
                      <th style={{ padding: "10px 14px" }}>Harvest (kg)</th>
                      <th style={{ padding: "10px 14px" }}>Loss (kg)</th>
                      <th style={{ padding: "10px 14px" }}>Yield (kg/ha)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px" }}>{row.harvest_date}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.crop_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.field_name}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2E7D32" }}>
                          {Number(row.quantity_kg).toLocaleString()} kg
                        </td>
                        <td style={{ padding: "10px 14px", color: Number(row.loss_kg) > 0 ? "#C0392B" : "#888" }}>
                          {Number(row.loss_kg || 0).toLocaleString()} kg
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {row.yield_kg_per_ha ? `${Number(row.yield_kg_per_ha).toFixed(1)} kg/ha` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. CROP PRODUCTION */}
          {activeReport === "crop_production" && (
            <div className="page-content-section">
              <h2>Crop Plantings & Cycles ({reportData.count || 0} schedules)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Crop</th>
                      <th style={{ padding: "10px 14px" }}>Variety</th>
                      <th style={{ padding: "10px 14px" }}>Field</th>
                      <th style={{ padding: "10px 14px" }}>Planting Date</th>
                      <th style={{ padding: "10px 14px" }}>Expected Harvest</th>
                      <th style={{ padding: "10px 14px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1E4632" }}>{row.crop_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.variety_name || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.field_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.planting_date}</td>
                        <td style={{ padding: "10px 14px" }}>{row.expected_harvest_date || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. LIVESTOCK */}
          {activeReport === "livestock" && (
            <div className="page-content-section">
              <h2>Livestock Productivity & Medical Audits</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Tag #</th>
                      <th style={{ padding: "10px 14px" }}>Species</th>
                      <th style={{ padding: "10px 14px" }}>Breed</th>
                      <th style={{ padding: "10px 14px" }}>Status</th>
                      <th style={{ padding: "10px 14px" }}>Treatments</th>
                      <th style={{ padding: "10px 14px" }}>Vaccinations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{row.tag_number}</td>
                        <td style={{ padding: "10px 14px" }}>{row.species}</td>
                        <td style={{ padding: "10px 14px" }}>{row.breed_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.status}</td>
                        <td style={{ padding: "10px 14px" }}>{row.treatments_count} in period</td>
                        <td style={{ padding: "10px 14px" }}>{row.vaccinations_count} in period</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. INVENTORY */}
          {activeReport === "inventory" && (
            <div className="page-content-section">
              <h2>Inventory Asset Valuation (Total: ${Number(reportData.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Item Name</th>
                      <th style={{ padding: "10px 14px" }}>Category</th>
                      <th style={{ padding: "10px 14px" }}>Stock On Hand</th>
                      <th style={{ padding: "10px 14px" }}>Unit Cost</th>
                      <th style={{ padding: "10px 14px" }}>Total Asset Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.category}</td>
                        <td style={{ padding: "10px 14px" }}>{Number(row.quantity_on_hand).toLocaleString()} {row.unit}</td>
                        <td style={{ padding: "10px 14px" }}>${Number(row.unit_cost).toFixed(2)}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1E4632" }}>
                          ${Number(row.total_item_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. IRRIGATION */}
          {activeReport === "irrigation" && (
            <div className="page-content-section">
              <h2>Water & Irrigation Consumption (Total: {Number(reportData.total_litres || 0).toLocaleString()} L)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Date</th>
                      <th style={{ padding: "10px 14px" }}>System</th>
                      <th style={{ padding: "10px 14px" }}>Field</th>
                      <th style={{ padding: "10px 14px" }}>Volume (Litres)</th>
                      <th style={{ padding: "10px 14px" }}>Duration (Min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px" }}>{row.logged_date}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.system_name} ({row.system_type})</td>
                        <td style={{ padding: "10px 14px" }}>{row.field_name || "—"}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#3498DB" }}>
                          {Number(row.volume_litres).toLocaleString()} L
                        </td>
                        <td style={{ padding: "10px 14px" }}>{row.duration_minutes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. EQUIPMENT */}
          {activeReport === "equipment" && (
            <div className="page-content-section">
              <h2>Equipment Utilization & Fuel Consumed</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Equipment Name</th>
                      <th style={{ padding: "10px 14px" }}>Type</th>
                      <th style={{ padding: "10px 14px" }}>Status</th>
                      <th style={{ padding: "10px 14px" }}>Total Repair Costs</th>
                      <th style={{ padding: "10px 14px" }}>Total Fuel (Litres)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.type}</td>
                        <td style={{ padding: "10px 14px" }}>{row.status}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#C0392B" }}>
                          ${Number(row.total_repair_costs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                          {Number(row.total_fuel_litres || 0).toLocaleString()} L
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12. LABOUR */}
          {activeReport === "labour" && (
            <div className="page-content-section">
              <h2>Labour Attendance & Performance ({reportData.count || 0} workers)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Worker Name</th>
                      <th style={{ padding: "10px 14px" }}>Role</th>
                      <th style={{ padding: "10px 14px" }}>Days Worked (Period)</th>
                      <th style={{ padding: "10px 14px" }}>Tasks Completed</th>
                      <th style={{ padding: "10px 14px" }}>Daily Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.role}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2E7D32" }}>
                          {row.days_worked} days
                        </td>
                        <td style={{ padding: "10px 14px" }}>{row.tasks_completed} tasks</td>
                        <td style={{ padding: "10px 14px" }}>${Number(row.daily_wage || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 13. PEST & DISEASE */}
          {activeReport === "pest_disease" && (
            <div className="page-content-section">
              <h2>Pest & Disease Field Treatments ({reportData.count || 0} applications)</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "10px 14px" }}>Date</th>
                      <th style={{ padding: "10px 14px" }}>Target Pest</th>
                      <th style={{ padding: "10px 14px" }}>Field</th>
                      <th style={{ padding: "10px 14px" }}>Chemical / Method</th>
                      <th style={{ padding: "10px 14px" }}>Severity Observed</th>
                      <th style={{ padding: "10px 14px" }}>Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "10px 14px" }}>{row.application_date}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#C0392B" }}>{row.pest_name || "General Pest"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.field_name}</td>
                        <td style={{ padding: "10px 14px" }}>{row.treatment_method || row.chemical_name || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.severity || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.effectiveness || "completed"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;