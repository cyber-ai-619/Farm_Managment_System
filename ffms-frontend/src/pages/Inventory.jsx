import { useState, useEffect, useCallback } from "react";
import inventoryService from "../services/inventoryService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Inventory() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementType, setMovementType] = useState("in"); // 'in' | 'out'

  // Forms
  const [itemForm, setItemForm] = useState({
    farm_id: "",
    name: "",
    category: "Fertilizer",
    quantity: 100,
    unit: "kg",
    reorder_threshold: 20,
    unit_cost: 15.0,
  });

  const [movementForm, setMovementForm] = useState({
    quantity: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
        setItemForm((prev) => ({ ...prev, farm_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  const fetchInventory = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError("");
      const [allData, lowData] = await Promise.all([
        inventoryService.getItems(farmId),
        inventoryService.getLowStock(farmId).catch(() => []),
      ]);
      setItems(allData);
      setLowStockItems(lowData);
    } catch (err) {
      setError(err.message || "Failed to load inventory items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      fetchInventory(selectedFarmId);
    }
  }, [selectedFarmId, fetchInventory]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !selectedFarmId) return;

    try {
      setSubmitting(true);
      await inventoryService.createItem({
        ...itemForm,
        farm_id: selectedFarmId,
      });
      setIsItemModalOpen(false);
      await fetchInventory(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to create item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    if (!selectedItem || !movementForm.quantity) return;

    try {
      setSubmitting(true);
      if (movementType === "in") {
        await inventoryService.stockIn(selectedItem.id, movementForm);
      } else {
        await inventoryService.stockOut(selectedItem.id, movementForm);
      }
      setIsMovementModalOpen(false);
      await fetchInventory(selectedFarmId);
    } catch (err) {
      alert(err.message || "Stock movement failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const openMovementModal = (item, type) => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementForm({ quantity: "", notes: "" });
    setIsMovementModalOpen(true);
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "accountant"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Farm Inventory & Stock Control</h1>
          <p>Track fertilizers, seeds, pesticides, livestock feeds, tools, and spare parts.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsItemModalOpen(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--color-forest, #1E4632)",
              color: "#FFF",
              border: "1px solid var(--color-gold, #D4A54A)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Stock Item
          </button>
        )}
      </div>

      {/* Farm Selector Bar */}
      <div className="content-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", marginBottom: "20px" }}>
        <label style={{ fontWeight: 700, color: "var(--color-forest)" }}>Select Farm Estate:</label>
        <select
          value={selectedFarmId}
          onChange={(e) => {
            setSelectedFarmId(e.target.value);
            setItemForm((prev) => ({ ...prev, farm_id: e.target.value }));
          }}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)", minWidth: "220px" }}
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ padding: "14px 20px", backgroundColor: "#FFF3E0", color: "#E65100", border: "1px solid #FFE0B2", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ <strong>Low Stock Alert:</strong> {lowStockItems.length} item(s) are below their reorder threshold!
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Loading message="Loading warehouse stock..." />
      ) : items.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "40px" }}>
          <h4>No Inventory Recorded for this Farm</h4>
          <p>Click "+ Add Stock Item" to register seeds, fertilizers, or tools.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {items.map((item) => {
            const isLow = Number(item.quantity || 0) <= Number(item.reorder_threshold || 10);
            return (
              <div key={item.id} className="content-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: 0, color: "var(--color-forest)" }}>{item.name}</h4>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: isLow ? "#FFEBEE" : "#E8F5E9",
                        color: isLow ? "#C62828" : "#2E7D32",
                        fontWeight: 700,
                      }}
                    >
                      {isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--color-charcoal-60)" }}>
                    Category: <strong>{item.category || "General"}</strong>
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-forest)" }}>
                    {item.quantity} {item.unit || "units"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>
                    Reorder Threshold: {item.reorder_threshold} {item.unit} | Unit Cost: ${item.unit_cost || "0.00"}
                  </p>
                </div>

                {canManage && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(30,70,50,0.1)" }}>
                    <button
                      type="button"
                      onClick={() => openMovementModal(item, "in")}
                      style={{ flex: 1, padding: "6px 0", backgroundColor: "#2C5A3F", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      + Stock In
                    </button>
                    <button
                      type="button"
                      onClick={() => openMovementModal(item, "out")}
                      style={{ flex: 1, padding: "6px 0", backgroundColor: "#7A4A52", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      - Stock Out
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Item */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSaveItem} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Item Name *</label>
            <input
              type="text"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              placeholder="e.g. Urea 46% Fertilizer / Certified Hybrid Seeds"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Category</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)" }}
              >
                <option value="Fertilizer">Fertilizer</option>
                <option value="Seed">Seed</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Feed">Livestock Feed</option>
                <option value="Equipment Part">Equipment Part</option>
                <option value="Tool">Tool</option>
              </select>
            </div>
            <div className="form-field">
              <label>Unit of Measure</label>
              <input
                type="text"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                placeholder="kg, bags, liters, units"
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div className="form-field">
              <label>Initial Stock</label>
              <input
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Reorder Limit</label>
              <input
                type="number"
                value={itemForm.reorder_threshold}
                onChange={(e) => setItemForm({ ...itemForm, reorder_threshold: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.unit_cost}
                onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Add Inventory Item"}
          </button>
        </form>
      </Modal>

      {/* Modal: Movement */}
      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title={`${movementType === "in" ? "Stock In (Receive)" : "Stock Out (Issue)"}: ${selectedItem?.name}`}>
        <form onSubmit={handleSaveMovement} style={{ display: "grid", gap: "14px" }}>
          <div className="form-field">
            <label>Quantity to {movementType === "in" ? "Receive" : "Issue"} ({selectedItem?.unit || "units"}) *</label>
            <input
              type="number"
              required
              min="1"
              value={movementForm.quantity}
              onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Notes / Purpose</label>
            <input
              type="text"
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              placeholder={movementType === "in" ? "Supplier delivery #440" : "Field A maize top-dressing"}
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Recording..." : `Confirm Stock ${movementType === "in" ? "In" : "Out"}`}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Inventory;