import { useState, useEffect, useCallback } from "react";
import financeService from "../services/financeService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Money() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "income" | "expenses" | "budgets" | "loans"

  // Data states
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [incomeList, setIncomeList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [budgetsList, setBudgetsList] = useState([]);
  const [loansList, setLoansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  // Forms
  const [incomeForm, setIncomeForm] = useState({
    farm_id: "",
    category: "Crop Sales",
    amount: 1500,
    payment_method: "Bank Transfer",
    reference_number: "",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    farm_id: "",
    category: "Fertilizer & Seeds",
    amount: 450,
    payment_method: "Cash",
    vendor_name: "Agritech Supplies",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [budgetForm, setBudgetForm] = useState({
    farm_id: "",
    category: "Fertilizer & Chemicals",
    fiscal_year: new Date().getFullYear(),
    budgeted_amount: 10000,
    notes: "",
  });

  const [loanForm, setLoanForm] = useState({
    farm_id: "",
    lender_name: "Agricultural Development Bank",
    principal_amount: 25000,
    interest_rate: 6.5,
    tenor_months: 24,
    start_date: new Date().toISOString().split("T")[0],
    purpose: "Irrigation equipment financing",
  });

  const [submitting, setSubmitting] = useState(false);

  // Load farms
  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
        setIncomeForm((prev) => ({ ...prev, farm_id: data[0].id }));
        setExpenseForm((prev) => ({ ...prev, farm_id: data[0].id }));
        setBudgetForm((prev) => ({ ...prev, farm_id: data[0].id }));
        setLoanForm((prev) => ({ ...prev, farm_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  // Load Finance Data
  const loadFinanceData = useCallback(async (farmId) => {
    if (!farmId) return;
    setLoading(true);
    setError("");
    try {
      const [incRes, expRes, plRes, bgtRes, loanRes] = await Promise.all([
        financeService.getIncome(farmId).catch(() => []),
        financeService.getExpenses(farmId).catch(() => []),
        financeService.getProfitLoss(farmId).catch(() => null),
        financeService.getBudgets(farmId).catch(() => []),
        financeService.getLoans(farmId).catch(() => []),
      ]);
      setIncomeList(incRes);
      setExpensesList(expRes);
      setProfitLoss(plRes);
      setBudgetsList(bgtRes);
      setLoansList(loanRes);
    } catch (err) {
      setError(err.message || "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      loadFinanceData(selectedFarmId);
    }
  }, [selectedFarmId, loadFinanceData]);

  // Submit Handlers
  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeService.createIncome({ ...incomeForm, farm_id: selectedFarmId });
      setIsIncomeModalOpen(false);
      await loadFinanceData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to log income.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeService.createExpense({ ...expenseForm, farm_id: selectedFarmId });
      setIsExpenseModalOpen(false);
      await loadFinanceData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to log expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeService.createBudget({ ...budgetForm, farm_id: selectedFarmId });
      setIsBudgetModalOpen(false);
      await loadFinanceData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to save budget.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeService.createLoan({ ...loanForm, farm_id: selectedFarmId });
      setIsLoanModalOpen(false);
      await loadFinanceData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to record loan.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "accountant"].includes(role);

  // Totals calculation
  const totalIncome = incomeList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const marginPercent = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Financial Management & Accounting</h1>
          <p>Real-time cashflow, income/expense ledgers, profit & loss, operating budgets, and loans.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#C0392B",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              - Record Expense
            </button>
            <button
              type="button"
              onClick={() => setIsIncomeModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2E7D32",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Record Income
            </button>
          </div>
        )}
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
                {f.name} ({f.location || "Primary"})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Financial KPIs Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #2E7D32" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Gross Income
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2E7D32", marginTop: "4px" }}>
            ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{incomeList.length} transactions recorded</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #C0392B" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Total Expenses
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#C0392B", marginTop: "4px" }}>
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{expensesList.length} expense items</div>
        </div>

        <div
          className="content-card"
          style={{ padding: "16px", borderLeft: `4px solid ${netProfit >= 0 ? "var(--color-forest, #1E4632)" : "#C0392B"}` }}
        >
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Net Profit / (Loss)
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: netProfit >= 0 ? "var(--color-forest, #1E4632)" : "#C0392B",
              marginTop: "4px",
            }}
          >
            ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{marginPercent}% net margin</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Active Liabilities / Loans
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#B8860B", marginTop: "4px" }}>
            ${loansList.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{loansList.length} credit facilities</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E0E0E0", marginBottom: "20px" }}>
        {[
          { id: "overview", label: "Profit & Loss Summary" },
          { id: "income", label: `Income Ledger (${incomeList.length})` },
          { id: "expenses", label: `Expenses Ledger (${expensesList.length})` },
          { id: "budgets", label: `Operating Budgets (${budgetsList.length})` },
          { id: "loans", label: `Loans & Liabilities (${loansList.length})` },
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
        <Loading message="Loading financial records..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: P&L SUMMARY */}
          {activeTab === "overview" && (
            <div className="page-content-section">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="content-card" style={{ padding: "24px" }}>
                  <h3 style={{ color: "#1E4632", marginBottom: "16px" }}>Statement of Profit & Loss</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #EEE", paddingBottom: "8px" }}>
                      <span>Total Operating Revenue:</span>
                      <strong style={{ color: "#2E7D32" }}>
                        +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #EEE", paddingBottom: "8px" }}>
                      <span>Total Operating Expenses:</span>
                      <strong style={{ color: "#C0392B" }}>
                        -${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "8px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        borderTop: "2px solid #1E4632",
                      }}
                    >
                      <span>Net Farm Income:</span>
                      <span style={{ color: netProfit >= 0 ? "#2E7D32" : "#C0392B" }}>
                        ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="content-card" style={{ padding: "24px" }}>
                  <h3 style={{ color: "#1E4632", marginBottom: "16px" }}>Expense Breakdown by Category</h3>
                  {expensesList.length === 0 ? (
                    <p style={{ color: "#888" }}>No expense data to display breakdown.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {Object.entries(
                        expensesList.reduce((acc, exp) => {
                          acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount || 0);
                          return acc;
                        }, {})
                      ).map(([cat, amt]) => {
                        const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : 0;
                        return (
                          <div key={cat}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                              <span>{cat}</span>
                              <strong>${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pct}%)</strong>
                            </div>
                            <div style={{ width: "100%", height: "6px", backgroundColor: "#EEE", borderRadius: "3px" }}>
                              <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-gold, #D4A54A)", borderRadius: "3px" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME LEDGER */}
          {activeTab === "income" && (
            <div className="page-content-section">
              {incomeList.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No income transactions logged yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Category</th>
                        <th style={{ padding: "12px 16px" }}>Amount</th>
                        <th style={{ padding: "12px 16px" }}>Method</th>
                        <th style={{ padding: "12px 16px" }}>Reference</th>
                        <th style={{ padding: "12px 16px" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeList.map((inc) => (
                        <tr key={inc.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{inc.transaction_date}</td>
                          <td style={{ padding: "12px 16px" }}>{inc.category}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2E7D32" }}>
                            +${Number(inc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{inc.payment_method}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#666" }}>
                            {inc.reference_number || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{inc.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPENSES LEDGER */}
          {activeTab === "expenses" && (
            <div className="page-content-section">
              {expensesList.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No expense transactions logged yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Category</th>
                        <th style={{ padding: "12px 16px" }}>Amount</th>
                        <th style={{ padding: "12px 16px" }}>Method</th>
                        <th style={{ padding: "12px 16px" }}>Vendor</th>
                        <th style={{ padding: "12px 16px" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesList.map((exp) => (
                        <tr key={exp.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{exp.transaction_date}</td>
                          <td style={{ padding: "12px 16px" }}>{exp.category}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#C0392B" }}>
                            -${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{exp.payment_method}</td>
                          <td style={{ padding: "12px 16px" }}>{exp.vendor_name || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>{exp.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OPERATING BUDGETS */}
          {activeTab === "budgets" && (
            <div className="page-content-section">
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsBudgetModalOpen(true)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "var(--color-forest, #1E4632)",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Budget Allocation
                  </button>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {budgetsList.map((b) => (
                  <div key={b.id} className="content-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "#1E4632" }}>{b.category}</h4>
                      <span style={{ fontSize: "12px", color: "#666" }}>FY {b.fiscal_year}</span>
                    </div>
                    <div style={{ marginTop: "14px", fontSize: "22px", fontWeight: "bold", color: "#1E4632" }}>
                      ${Number(b.budgeted_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {b.notes && <p style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>{b.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LOANS */}
          {activeTab === "loans" && (
            <div className="page-content-section">
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsLoanModalOpen(true)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "var(--color-forest, #1E4632)",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Register Loan Facility
                  </button>
                )}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "12px 16px" }}>Lender</th>
                      <th style={{ padding: "12px 16px" }}>Principal</th>
                      <th style={{ padding: "12px 16px" }}>Interest Rate</th>
                      <th style={{ padding: "12px 16px" }}>Tenor</th>
                      <th style={{ padding: "12px 16px" }}>Purpose</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loansList.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{loan.lender_name}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E4632" }}>
                          ${Number(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{loan.interest_rate}% p.a.</td>
                        <td style={{ padding: "12px 16px" }}>{loan.tenor_months} months</td>
                        <td style={{ padding: "12px 16px" }}>{loan.purpose || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: loan.status === "active" ? "#E8F5E9" : "#FFF8E1",
                              color: loan.status === "active" ? "#2E7D32" : "#F57F17",
                            }}
                          >
                            {loan.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Income Modal */}
      <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Log Income Entry">
        <form onSubmit={handleCreateIncome} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Category *</label>
              <select
                value={incomeForm.category}
                onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Crop Sales">Crop Sales</option>
                <option value="Livestock Sales">Livestock Sales</option>
                <option value="Agri-Tourism">Agri-Tourism</option>
                <option value="Consultancy & Services">Consultancy & Services</option>
                <option value="Government Subsidies">Government Subsidies</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Payment Method</label>
              <select
                value={incomeForm.payment_method}
                onChange={(e) => setIncomeForm({ ...incomeForm, payment_method: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Date *</label>
              <input
                type="date"
                required
                value={incomeForm.transaction_date}
                onChange={(e) => setIncomeForm({ ...incomeForm, transaction_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Reference #</label>
            <input
              type="text"
              placeholder="e.g. REC-89211"
              value={incomeForm.reference_number}
              onChange={(e) => setIncomeForm({ ...incomeForm, reference_number: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Description</label>
            <textarea
              rows="2"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsIncomeModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "#2E7D32", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Income"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Farm Expense">
        <form onSubmit={handleCreateExpense} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Fertilizer & Seeds">Fertilizer & Seeds</option>
                <option value="Fuel & Energy">Fuel & Energy</option>
                <option value="Equipment Maintenance">Equipment Maintenance</option>
                <option value="Labour & Payroll">Labour & Payroll</option>
                <option value="Pesticides & Chemicals">Pesticides & Chemicals</option>
                <option value="Packaging & Logistics">Packaging & Logistics</option>
                <option value="Utilities & Rent">Utilities & Rent</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Vendor / Supplier</label>
              <input
                type="text"
                value={expenseForm.vendor_name}
                onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Date *</label>
              <input
                type="date"
                required
                value={expenseForm.transaction_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, transaction_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Description</label>
            <textarea
              rows="2"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "#C0392B", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Add Budget Allocation">
        <form onSubmit={handleCreateBudget} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Category *</label>
            <input
              type="text"
              required
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Fiscal Year</label>
              <input
                type="number"
                value={budgetForm.fiscal_year}
                onChange={(e) => setBudgetForm({ ...budgetForm, fiscal_year: Number(e.target.value) })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Budget ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={budgetForm.budgeted_amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, budgeted_amount: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Notes</label>
            <input
              type="text"
              value={budgetForm.notes}
              onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Loan Modal */}
      <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Register Loan / Debt Facility">
        <form onSubmit={handleCreateLoan} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Lender Name *</label>
            <input
              type="text"
              required
              value={loanForm.lender_name}
              onChange={(e) => setLoanForm({ ...loanForm, lender_name: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Principal ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={loanForm.principal_amount}
                onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={loanForm.interest_rate}
                onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Tenor (Months)</label>
              <input
                type="number"
                value={loanForm.tenor_months}
                onChange={(e) => setLoanForm({ ...loanForm, tenor_months: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Start Date</label>
              <input
                type="date"
                value={loanForm.start_date}
                onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Purpose</label>
            <input
              type="text"
              value={loanForm.purpose}
              onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsLoanModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Loan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Money;