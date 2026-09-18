import { useState, useEffect, useCallback } from "react";
import supplierService from "../services/supplierService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Suppliers() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("directory"); // "directory" | "orders" | "quotes"

  // Data states
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedSupplierQuotes, setSelectedSupplierQuotes] = useState([]);
  const [activeSupplierId, setActiveSupplierId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    farm_id: "",
    name: "",
    category: "Fertilizer & Chemicals",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const [poForm, setPOForm] = useState({
    farm_id: "",
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [{ item_name: "NPK 15-15-15 Fertilizer (50kg bag)", quantity: 20, unit_price: 32.5 }],
  });

  const [quoteForm, setQuoteForm] = useState({
    supplier_id: "",
    item_description: "Drip Irrigation Pipe 16mm (100m roll)",
    quoted_price: 45.0,
    unit: "roll",
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    terms: "Net 30 days, free delivery to farm",
  });

  const [submitting, setSubmitting] = useState(false);

  // Load farms
  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
        setSupplierForm((prev) => ({ ...prev, farm_id: data[0].id }));
        setPOForm((prev) => ({ ...prev, farm_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  // Load procurement data
  const loadProcurementData = useCallback(async (farmId) => {
    if (!farmId) return;
    setLoading(true);
    setError("");
    try {
      const [supList, poList] = await Promise.all([
        supplierService.getSuppliers(farmId).catch(() => []),
        supplierService.getPurchaseOrders(farmId).catch(() => []),
      ]);
      setSuppliers(supList);
      setPurchaseOrders(poList);
      if (supList.length > 0) {
        setPOForm((prev) => ({ ...prev, supplier_id: prev.supplier_id || supList[0].id }));
        setQuoteForm((prev) => ({ ...prev, supplier_id: prev.supplier_id || supList[0].id }));
        if (!activeSupplierId) {
          setActiveSupplierId(supList[0].id);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load suppliers & procurement.");
    } finally {
      setLoading(false);
    }
  }, [activeSupplierId]);

  // Load quotations for selected supplier
  const loadQuotes = useCallback(async (supplierId) => {
    if (!supplierId) return;
    try {
      const quotes = await supplierService.getQuotations(supplierId);
      setSelectedSupplierQuotes(quotes);
    } catch (err) {
      console.error("Failed to load quotations:", err);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      loadProcurementData(selectedFarmId);
    }
  }, [selectedFarmId, loadProcurementData]);

  useEffect(() => {
    if (activeSupplierId) {
      loadQuotes(activeSupplierId);
    }
  }, [activeSupplierId, loadQuotes]);

  // PO Line Items
  const addPOItem = () => {
    setPOForm((prev) => ({
      ...prev,
      items: [...prev.items, { item_name: "", quantity: 1, unit_price: 10.0 }],
    }));
  };

  const removePOItem = (index) => {
    setPOForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updatePOItem = (index, field, value) => {
    setPOForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  // Handlers
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      setSubmitting(true);
      await supplierService.createSupplier({ ...supplierForm, farm_id: selectedFarmId });
      setIsSupplierModalOpen(false);
      await loadProcurementData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to create supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplier_id) {
      alert("Please select a supplier.");
      return;
    }
    try {
      setSubmitting(true);
      await supplierService.createPurchaseOrder({ ...poForm, farm_id: selectedFarmId });
      setIsPOModalOpen(false);
      await loadProcurementData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await supplierService.updatePurchaseOrderStatus(poId, newStatus);
      await loadProcurementData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to update purchase order status.");
    }
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await supplierService.createQuotation(quoteForm.supplier_id, quoteForm);
      setIsQuoteModalOpen(false);
      await loadQuotes(quoteForm.supplier_id);
    } catch (err) {
      alert(err.message || "Failed to record quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "accountant"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Suppliers & Procurement Operations</h1>
          <p>Vendor database, price quotation tracking, purchase orders, and goods receiving.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
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
              + Add Supplier
            </button>
            <button
              type="button"
              onClick={() => setIsPOModalOpen(true)}
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
              + Create Purchase Order
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E0E0E0", marginBottom: "20px" }}>
        {[
          { id: "directory", label: `Suppliers Directory (${suppliers.length})` },
          { id: "orders", label: `Purchase Orders (${purchaseOrders.length})` },
          { id: "quotes", label: "Supplier Quotations" },
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
        <Loading message="Loading procurement data..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: SUPPLIER DIRECTORY */}
          {activeTab === "directory" && (
            <div className="page-content-section">
              {suppliers.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No agricultural suppliers enrolled yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {suppliers.map((s) => (
                    <div key={s.id} className="content-card" style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h4 style={{ margin: 0, color: "#1E4632" }}>{s.name}</h4>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: "#E8F5E9",
                            color: "#1E4632",
                          }}
                        >
                          {s.category || "General"}
                        </span>
                      </div>
                      <div style={{ marginTop: "12px", fontSize: "13px", color: "#555", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div>
                          <strong>Contact:</strong> {s.contact_person || "—"}
                        </div>
                        <div>
                          <strong>Phone:</strong> {s.phone || "—"}
                        </div>
                        <div>
                          <strong>Email:</strong> {s.email || "—"}
                        </div>
                        <div>
                          <strong>Address:</strong> {s.address || "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PURCHASE ORDERS */}
          {activeTab === "orders" && (
            <div className="page-content-section">
              {purchaseOrders.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No purchase orders logged yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>PO #</th>
                        <th style={{ padding: "12px 16px" }}>Supplier</th>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Total Amount</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map((po) => (
                        <tr key={po.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                            PO-{String(po.id).padStart(4, "0")}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{po.supplier_name || "Supplier #" + po.supplier_id}</td>
                          <td style={{ padding: "12px 16px" }}>{po.order_date || po.created_at?.split(" ")[0]}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1E4632" }}>
                            ${Number(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor:
                                  po.status === "received" || po.status === "approved"
                                    ? "#E8F5E9"
                                    : po.status === "cancelled"
                                    ? "#FFEBEE"
                                    : "#FFF8E1",
                                color:
                                  po.status === "received" || po.status === "approved"
                                    ? "#2E7D32"
                                    : po.status === "cancelled"
                                    ? "#C62828"
                                    : "#F57F17",
                              }}
                            >
                              {po.status || "draft"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {canManage && (
                              <select
                                value={po.status || "draft"}
                                onChange={(e) => handleStatusChange(po.id, e.target.value)}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #CCC",
                                  fontSize: "12px",
                                }}
                              >
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUOTATIONS */}
          {activeTab === "quotes" && (
            <div className="page-content-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontWeight: 600 }}>Filter by Supplier:</label>
                  <select
                    value={activeSupplierId || ""}
                    onChange={(e) => setActiveSupplierId(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CCC" }}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(true)}
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
                    + Add Price Quote
                  </button>
                )}
              </div>

              {selectedSupplierQuotes.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No price quotes on record for this supplier.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Item Description</th>
                        <th style={{ padding: "12px 16px" }}>Quoted Price</th>
                        <th style={{ padding: "12px 16px" }}>Valid Until</th>
                        <th style={{ padding: "12px 16px" }}>Commercial Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupplierQuotes.map((q) => (
                        <tr key={q.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{q.item_description}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2E7D32" }}>
                            ${Number(q.quoted_price).toFixed(2)} {q.unit ? `/ ${q.unit}` : ""}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{q.valid_until || "Ongoing"}</td>
                          <td style={{ padding: "12px 16px", color: "#666" }}>{q.terms || "—"}</td>
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

      {/* Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Register Supplier">
        <form onSubmit={handleCreateSupplier} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Supplier Company *</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Category</label>
              <select
                value={supplierForm.category}
                onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Fertilizer & Chemicals">Fertilizer & Chemicals</option>
                <option value="Seeds & Seedlings">Seeds & Seedlings</option>
                <option value="Machinery & Tools">Machinery & Tools</option>
                <option value="Irrigation Systems">Irrigation Systems</option>
                <option value="Packaging Supplies">Packaging Supplies</option>
                <option value="Animal Feed & Vet">Animal Feed & Vet</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Contact Person</label>
              <input
                type="text"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Phone</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Email</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Address</label>
            <textarea
              rows="2"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </form>
      </Modal>

      {/* PO Modal */}
      <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title="Issue Purchase Order">
        <form onSubmit={handleCreatePO} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Supplier *</label>
            <select
              required
              value={poForm.supplier_id}
              onChange={(e) => setPOForm({ ...poForm, supplier_id: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Line Items</label>
              <button
                type="button"
                onClick={addPOItem}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: "#E8F5E9",
                  color: "#1E4632",
                  border: "1px solid #1E4632",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                + Add Item
              </button>
            </div>

            {poForm.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "8px",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.item_name}
                  onChange={(e) => updatePOItem(index, "item_name", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                />

                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updatePOItem(index, "quantity", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ($)"
                  value={item.unit_price}
                  onChange={(e) => updatePOItem(index, "unit_price", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                />

                {poForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePOItem(index)}
                    style={{
                      padding: "6px 8px",
                      color: "red",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Notes / Instructions</label>
            <input
              type="text"
              placeholder="Delivery destination, urgency..."
              value={poForm.notes}
              onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsPOModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Submitting..." : "Issue Purchase Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quote Modal */}
      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Record Price Quotation">
        <form onSubmit={handleCreateQuote} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Supplier *</label>
            <select
              value={quoteForm.supplier_id}
              onChange={(e) => setQuoteForm({ ...quoteForm, supplier_id: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Item Description *</label>
            <input
              type="text"
              required
              value={quoteForm.item_description}
              onChange={(e) => setQuoteForm({ ...quoteForm, item_description: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={quoteForm.quoted_price}
                onChange={(e) => setQuoteForm({ ...quoteForm, quoted_price: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Valid Until</label>
              <input
                type="date"
                value={quoteForm.valid_until}
                onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Terms</label>
            <input
              type="text"
              value={quoteForm.terms}
              onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Quotation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Suppliers;