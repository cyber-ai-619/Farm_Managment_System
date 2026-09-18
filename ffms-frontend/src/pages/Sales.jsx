import { useState, useEffect, useCallback } from "react";
import salesService from "../services/salesService";
import farmService from "../services/farmService";
import cropService from "../services/cropService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Sales() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "customers" | "market" | "invoices"

  // Data states
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Forms
  const [orderForm, setOrderForm] = useState({
    farm_id: "",
    customer_id: "",
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    notes: "",
    items: [{ crop_id: "", quantity: 100, unit_price: 2.5 }],
  });

  const [customerForm, setCustomerForm] = useState({
    farm_id: "",
    name: "",
    customer_type: "Wholesale",
    phone: "",
    email: "",
    address: "",
  });

  const [marketForm, setMarketForm] = useState({
    crop_id: "",
    market_name: "Central Commodity Exchange",
    price: 3.5,
    unit: "kg",
    price_date: new Date().toISOString().split("T")[0],
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    amount: "",
    payment_method: "Bank Transfer",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const [submitting, setSubmitting] = useState(false);

  // Load farms & crops
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [farmList, cropList] = await Promise.all([
        farmService.getFarms().catch(() => []),
        cropService.getCrops().catch(() => []),
      ]);
      setFarms(farmList);
      setCrops(cropList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
        setOrderForm((prev) => ({ ...prev, farm_id: farmList[0].id }));
        setCustomerForm((prev) => ({ ...prev, farm_id: farmList[0].id }));
      }
    } catch (err) {
      console.error("Auxiliary load error:", err);
    }
  }, [selectedFarmId]);

  // Load tab-specific data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, custRes, marketRes, invRes] = await Promise.all([
        salesService.getOrders().catch(() => []),
        salesService.getCustomers().catch(() => []),
        salesService.getMarketPrices().catch(() => []),
        salesService.getInvoices().catch(() => []),
      ]);
      setOrders(ordersRes);
      setCustomers(custRes);
      setMarketPrices(marketRes);
      setInvoices(invRes);
      if (custRes.length > 0) {
        setOrderForm((prev) => ({ ...prev, customer_id: prev.customer_id || custRes[0].id }));
      }
      if (crops.length > 0) {
        setMarketForm((prev) => ({ ...prev, crop_id: prev.crop_id || crops[0].id }));
      }
    } catch (err) {
      setError(err.message || "Failed to load sales data.");
    } finally {
      setLoading(false);
    }
  }, [crops]);

  useEffect(() => {
    fetchAuxiliary();
  }, [fetchAuxiliary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Order Items Handlers
  const addOrderItem = () => {
    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { crop_id: crops[0]?.id || "", quantity: 50, unit_price: 2.0 }],
    }));
  };

  const removeOrderItem = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setOrderForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  // Submit Handlers
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    try {
      setSubmitting(true);
      await salesService.createCustomer({
        ...customerForm,
        farm_id: selectedFarmId || 1,
      });
      setIsCustomerModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to create customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customer_id) {
      alert("Please select a customer.");
      return;
    }
    try {
      setSubmitting(true);
      await salesService.createOrder({
        ...orderForm,
        farm_id: selectedFarmId || 1,
      });
      setIsOrderModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to create sales order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await salesService.updateOrderStatus(orderId, newStatus);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    }
  };

  const handleCreateMarketPrice = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await salesService.createMarketPrice(marketForm);
      setIsMarketModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to record market price.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await salesService.createPayment(paymentForm);
      setIsPaymentModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      invoice_id: invoice.id,
      amount: Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0),
      payment_method: "Bank Transfer",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
    });
    setIsPaymentModalOpen(true);
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "accountant"].includes(role);

  // Financial calculations
  const totalSalesRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Sales, Orders & Market Prices</h1>
          <p>Manage customer directory, contract orders, invoices, and real-time commodity pricing.</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
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
              + Add Customer
            </button>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
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
              + Create Sales Order
            </button>
          </div>
        )}
      </div>

      {/* Metrics Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #2E7D32" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Total Sales Value
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2E7D32", marginTop: "4px" }}>
            ${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Across {orders.length} orders</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid var(--color-gold, #D4A54A)" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Active / Pending Orders
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#B8860B", marginTop: "4px" }}>
            {pendingOrdersCount}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Awaiting delivery / fulfillment</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #1E4632" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Customer Base
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E4632", marginTop: "4px" }}>
            {customers.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Commercial & Retail buyers</div>
        </div>

        <div className="content-card" style={{ padding: "16px", borderLeft: "4px solid #3498DB" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>
            Tracked Commodities
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3498DB", marginTop: "4px" }}>
            {marketPrices.length}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Price records in registry</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E0E0E0", marginBottom: "20px" }}>
        {[
          { id: "orders", label: `Sales Orders (${orders.length})` },
          { id: "customers", label: `Customers (${customers.length})` },
          { id: "market", label: `Market Prices (${marketPrices.length})` },
          { id: "invoices", label: `Invoices & Payments (${invoices.length})` },
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

      {/* Tab Contents */}
      {loading ? (
        <Loading message="Loading commerce records..." />
      ) : error ? (
        <div style={{ padding: "20px", color: "red", backgroundColor: "#FEE", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <div>
          {/* TAB 1: SALES ORDERS */}
          {activeTab === "orders" && (
            <div className="page-content-section">
              {orders.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No sales orders created yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Order #</th>
                        <th style={{ padding: "12px 16px" }}>Customer</th>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Total Amount</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                            ORD-{String(o.id).padStart(4, "0")}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{o.customer_name || "Customer #" + o.customer_id}</td>
                          <td style={{ padding: "12px 16px" }}>{o.order_date}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2E7D32" }}>
                            ${Number(o.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor:
                                  o.status === "completed" || o.status === "delivered"
                                    ? "#E8F5E9"
                                    : o.status === "cancelled"
                                    ? "#FFEBEE"
                                    : "#FFF8E1",
                                color:
                                  o.status === "completed" || o.status === "delivered"
                                    ? "#2E7D32"
                                    : o.status === "cancelled"
                                    ? "#C62828"
                                    : "#F57F17",
                              }}
                            >
                              {o.status || "pending"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {canManage && (
                              <select
                                value={o.status || "pending"}
                                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #CCC",
                                  fontSize: "12px",
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
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

          {/* TAB 2: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="page-content-section">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {customers.map((c) => (
                  <div key={c.id} className="content-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ margin: 0, color: "#1E4632" }}>{c.name}</h4>
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
                        {c.customer_type || "Wholesale"}
                      </span>
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#555", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>
                        <strong>Phone:</strong> {c.phone || "—"}
                      </div>
                      <div>
                        <strong>Email:</strong> {c.email || "—"}
                      </div>
                      <div>
                        <strong>Address:</strong> {c.address || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MARKET PRICES */}
          {activeTab === "market" && (
            <div className="page-content-section">
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsMarketModalOpen(true)}
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
                    + Record Commodity Price
                  </button>
                )}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                      <th style={{ padding: "12px 16px" }}>Date</th>
                      <th style={{ padding: "12px 16px" }}>Crop / Commodity</th>
                      <th style={{ padding: "12px 16px" }}>Exchange / Market</th>
                      <th style={{ padding: "12px 16px" }}>Price Per Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketPrices.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #EEE" }}>
                        <td style={{ padding: "12px 16px" }}>{p.price_date}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1E4632" }}>
                          {p.crop_name || "Commodity #" + p.crop_id}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{p.market_name || "Local Market"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2E7D32" }}>
                          ${Number(p.price || 0).toFixed(2)} / {p.unit || "kg"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES & PAYMENTS */}
          {activeTab === "invoices" && (
            <div className="page-content-section">
              {invoices.length === 0 ? (
                <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
                  <p>No billing invoices found.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #E0E0E0", backgroundColor: "#F9FBF9" }}>
                        <th style={{ padding: "12px 16px" }}>Invoice #</th>
                        <th style={{ padding: "12px 16px" }}>Order ID</th>
                        <th style={{ padding: "12px 16px" }}>Total Amount</th>
                        <th style={{ padding: "12px 16px" }}>Paid Amount</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #EEE" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                            {inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`}
                          </td>
                          <td style={{ padding: "12px 16px" }}>ORD-{inv.sales_order_id}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                            ${Number(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 600 }}>
                            ${Number(inv.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: inv.payment_status === "paid" ? "#E8F5E9" : "#FFF8E1",
                                color: inv.payment_status === "paid" ? "#2E7D32" : "#F57F17",
                              }}
                            >
                              {inv.payment_status || "unpaid"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {inv.payment_status !== "paid" && canManage && (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(inv)}
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#2E7D32",
                                  color: "#FFF",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                Record Payment
                              </button>
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
        </div>
      )}

      {/* Create Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add Customer / Client">
        <form onSubmit={handleCreateCustomer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
              Customer / Company Name *
            </label>
            <input
              type="text"
              required
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                Customer Type
              </label>
              <select
                value={customerForm.customer_type}
                onChange={(e) => setCustomerForm({ ...customerForm, customer_type: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Wholesale">Wholesale</option>
                <option value="Retail">Retail</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Food Processor">Food Processor</option>
                <option value="Export">Export</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Phone</label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Email</label>
            <input
              type="email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Address</label>
            <textarea
              rows="2"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create Sales Contract / Order">
        <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Customer *</label>
              <select
                required
                value={orderForm.customer_id}
                onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Order Date *</label>
              <input
                type="date"
                required
                value={orderForm.order_date}
                onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Order Items (Produce)</label>
              <button
                type="button"
                onClick={addOrderItem}
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

            {orderForm.items.map((item, index) => (
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
                <select
                  value={item.crop_id}
                  onChange={(e) => updateOrderItem(index, "crop_id", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                >
                  <option value="">Select Crop</option>
                  {crops.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Qty (kg)"
                  value={item.quantity}
                  onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ($)"
                  value={item.unit_price}
                  onChange={(e) => updateOrderItem(index, "unit_price", e.target.value)}
                  style={{ padding: "6px", borderRadius: "4px", border: "1px solid #CCC" }}
                />

                {orderForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOrderItem(index)}
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
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Notes</label>
            <input
              type="text"
              placeholder="Delivery notes, terms..."
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Creating..." : "Confirm & Create Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Market Price Modal */}
      <Modal isOpen={isMarketModalOpen} onClose={() => setIsMarketModalOpen(false)} title="Record Market Price">
        <form onSubmit={handleCreateMarketPrice} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Crop *</label>
            <select
              value={marketForm.crop_id}
              onChange={(e) => setMarketForm({ ...marketForm, crop_id: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            >
              <option value="">Select Crop</option>
              {crops.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Market / Exchange Name *</label>
            <input
              type="text"
              required
              value={marketForm.market_name}
              onChange={(e) => setMarketForm({ ...marketForm, market_name: e.target.value })}
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
                value={marketForm.price}
                onChange={(e) => setMarketForm({ ...marketForm, price: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Unit</label>
              <input
                type="text"
                value={marketForm.unit}
                onChange={(e) => setMarketForm({ ...marketForm, unit: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsMarketModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "var(--color-forest, #1E4632)", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Saving..." : "Save Price"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Invoice Payment">
        <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>Reference #</label>
              <input
                type="text"
                placeholder="TXN-12345"
                value={paymentForm.reference_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              style={{ padding: "8px 16px", border: "1px solid #CCC", borderRadius: "6px", backgroundColor: "#FFF", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", backgroundColor: "#2E7D32", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Sales;