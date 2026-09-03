import { useState } from "react";

const moduleConfigs = {
  farms: {
    title: "Farms",
    description: "Manage your farms and farm information here.",
    sectionTitle: "Your Farms",
    fields: [
      { name: "name", label: "Farm Name", type: "text", placeholder: "e.g. Green Valley Farm" },
      { name: "location", label: "Location", type: "text", placeholder: "e.g. Lusaka" },
      { name: "size", label: "Farm Size", type: "text", placeholder: "e.g. 50 hectares" },
    ],
  },
  crops: {
    title: "Crops",
    description: "Manage crops on your farm.",
    sectionTitle: "Your Crops",
    fields: [
      { name: "name", label: "Crop Name", type: "text", placeholder: "e.g. Maize" },
      { name: "field", label: "Field", type: "text", placeholder: "e.g. Field A" },
      { name: "plantingDate", label: "Planting Date", type: "date" },
      { name: "expectedHarvest", label: "Expected Harvest", type: "date" },
    ],
  },
  livestock: {
    title: "Livestock",
    description: "Track and manage your livestock.",
    sectionTitle: "Your Livestock",
    fields: [
      { name: "type", label: "Animal Type", type: "text", placeholder: "e.g. Cattle" },
      { name: "count", label: "Number of Animals", type: "number", min: "1" },
      { name: "identifier", label: "Identifier", type: "text", placeholder: "e.g. Herd 01" },
      { name: "healthStatus", label: "Health Status", type: "select", options: ["Healthy", "Needs attention", "Under treatment"] },
    ],
  },
  irrigation: {
    title: "Irrigation",
    description: "Monitor irrigation systems and schedules.",
    sectionTitle: "Irrigation Records",
    fields: [
      { name: "system", label: "System Name", type: "text", placeholder: "e.g. Drip irrigation" },
      { name: "field", label: "Field", type: "text", placeholder: "e.g. Field A" },
      { name: "schedule", label: "Schedule", type: "text", placeholder: "e.g. Every morning" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Needs maintenance", "Inactive"] },
    ],
  },
  inventory: {
    title: "Inventory",
    description: "Keep track of farm supplies and stock.",
    sectionTitle: "Inventory Items",
    fields: [
      { name: "item", label: "Item Name", type: "text", placeholder: "e.g. Fertilizer" },
      { name: "category", label: "Category", type: "text", placeholder: "e.g. Inputs" },
      { name: "quantity", label: "Quantity", type: "number", min: "0" },
      { name: "unit", label: "Unit", type: "text", placeholder: "e.g. bags" },
    ],
  },
  tools: {
    title: "Equipment",
    description: "Manage equipment and machinery records.",
    sectionTitle: "Equipment Records",
    fields: [
      { name: "name", label: "Equipment Name", type: "text", placeholder: "e.g. Tractor" },
      { name: "condition", label: "Condition", type: "select", options: ["Good", "Needs service", "Out of service"] },
      { name: "purchaseDate", label: "Purchase Date", type: "date" },
    ],
  },
  labour: {
    title: "Labour",
    description: "Manage workers and farm tasks.",
    sectionTitle: "Labour Records",
    fields: [
      { name: "worker", label: "Worker Name", type: "text", placeholder: "Enter worker name" },
      { name: "role", label: "Role", type: "text", placeholder: "e.g. Field supervisor" },
      { name: "date", label: "Date", type: "date" },
      { name: "task", label: "Task", type: "text", placeholder: "e.g. Planting" },
    ],
  },
  pestDisease: {
    title: "Pest & Disease",
    description: "Record and monitor pest and disease incidents.",
    sectionTitle: "Incident Records",
    fields: [
      { name: "crop", label: "Crop", type: "text", placeholder: "e.g. Tomatoes" },
      { name: "issue", label: "Pest or Disease", type: "text", placeholder: "Enter the issue" },
      { name: "date", label: "Date", type: "date" },
      { name: "treatment", label: "Treatment", type: "text", placeholder: "Enter treatment" },
      { name: "status", label: "Status", type: "select", options: ["Open", "Monitoring", "Resolved"] },
    ],
  },
  weather: {
    title: "Weather",
    description: "Record weather conditions affecting your farm.",
    sectionTitle: "Weather Reports",
    fields: [
      { name: "date", label: "Date", type: "date" },
      { name: "temperature", label: "Temperature", type: "text", placeholder: "e.g. 24 C" },
      { name: "rainfall", label: "Rainfall", type: "text", placeholder: "e.g. 12 mm" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Add weather notes" },
    ],
  },
  harvest: {
    title: "Harvest",
    description: "Track harvested crops and quantities.",
    sectionTitle: "Harvest Records",
    fields: [
      { name: "crop", label: "Crop", type: "text", placeholder: "e.g. Maize" },
      { name: "date", label: "Date", type: "date" },
      { name: "quantity", label: "Quantity", type: "number", min: "0" },
      { name: "unit", label: "Unit", type: "text", placeholder: "e.g. tonnes" },
      { name: "quality", label: "Quality", type: "select", options: ["Excellent", "Good", "Needs grading"] },
    ],
  },
  sales: {
    title: "Sales",
    description: "Record products sold and market transactions.",
    sectionTitle: "Sales Records",
    fields: [
      { name: "product", label: "Product", type: "text", placeholder: "e.g. Tomatoes" },
      { name: "quantity", label: "Quantity", type: "number", min: "0" },
      { name: "buyer", label: "Buyer", type: "text", placeholder: "Enter buyer name" },
      { name: "price", label: "Price", type: "number", min: "0", step: "0.01" },
      { name: "date", label: "Date", type: "date" },
    ],
  },
  money: {
    title: "Finance",
    description: "Track farm financial activities and expenses.",
    sectionTitle: "Financial Records",
    fields: [
      { name: "type", label: "Transaction Type", type: "select", options: ["Income", "Expense"] },
      { name: "category", label: "Category", type: "text", placeholder: "e.g. Seeds" },
      { name: "amount", label: "Amount", type: "number", min: "0", step: "0.01" },
      { name: "date", label: "Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Add transaction details" },
    ],
  },
  suppliers: {
    title: "Suppliers",
    description: "Manage supplier and procurement information.",
    sectionTitle: "Supplier Records",
    fields: [
      { name: "name", label: "Supplier Name", type: "text", placeholder: "Enter supplier name" },
      { name: "contact", label: "Contact", type: "text", placeholder: "Phone or email" },
      { name: "item", label: "Supplied Item", type: "text", placeholder: "e.g. Seed" },
    ],
  },
  storage: {
    title: "Storage",
    description: "Track stored produce, inputs, and facilities.",
    sectionTitle: "Storage Records",
    fields: [
      { name: "facility", label: "Facility", type: "text", placeholder: "e.g. Main warehouse" },
      { name: "item", label: "Stored Item", type: "text", placeholder: "e.g. Maize" },
      { name: "quantity", label: "Quantity", type: "number", min: "0" },
      { name: "date", label: "Date", type: "date" },
      { name: "condition", label: "Condition", type: "select", options: ["Good", "Needs checking", "Damaged"] },
    ],
  },
  reports: {
    title: "Reports",
    description: "Create a record of reports needed for farm decisions.",
    sectionTitle: "Report Records",
    fields: [
      { name: "type", label: "Report Type", type: "text", placeholder: "e.g. Monthly farm report" },
      { name: "dateRange", label: "Date Range", type: "text", placeholder: "e.g. January - March" },
      { name: "status", label: "Status", type: "select", options: ["Requested", "In progress", "Complete"] },
    ],
  },
  alerts: {
    title: "Notifications",
    description: "Record important alerts and reminders for your farm.",
    sectionTitle: "Your Alerts",
    fields: [
      { name: "title", label: "Alert Title", type: "text", placeholder: "Enter alert title" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Enter alert details" },
      { name: "severity", label: "Severity", type: "select", options: ["Low", "Medium", "High"] },
      { name: "date", label: "Date", type: "date" },
    ],
  },
};

function ModulePage({ module }) {
  const config = moduleConfigs[module];
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");
  const storageKey = `ffms_records_${session?.email || "guest"}_${module}`;
  const [records, setRecords] = useState(() => JSON.parse(localStorage.getItem(storageKey) || "[]"));
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newRecord = { ...form, id: Date.now() };
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
    setForm({});
    setMessage("Record added successfully.");
  };

  const handleDelete = (id) => {
    const updatedRecords = records.filter((record) => record.id !== id);
    setRecords(updatedRecords);
    localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
  };

  return (
    <div className="page-wrapper module-page">
      <h1>{config.title}</h1>
      <p>{config.description}</p>

      <div className="module-entry-layout">
        <section className="page-content-section module-form-section" aria-labelledby={`${module}-form-heading`}>
          <h2 id={`${module}-form-heading`}>Add information</h2>
          {message && <p className="module-message" role="status">{message}</p>}
          <form className="module-form" onSubmit={handleSubmit}>
            {config.fields.map((field) => (
              <div className="form-field" key={field.name}>
                <label htmlFor={`${module}-${field.name}`}>{field.label}</label>
                {field.type === "select" ? (
                  <select id={`${module}-${field.name}`} value={form[field.name] || ""} onChange={(event) => handleChange(field.name, event.target.value)} required>
                    <option value="" disabled>Select {field.label.toLowerCase()}</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea id={`${module}-${field.name}`} value={form[field.name] || ""} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} required rows="3" />
                ) : (
                  <input id={`${module}-${field.name}`} type={field.type} value={form[field.name] || ""} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} min={field.min} step={field.step} required />
                )}
              </div>
            ))}
            <button className="module-submit-button" type="submit">Add record</button>
          </form>
        </section>

        <section className="page-content-section module-records-section" aria-labelledby={`${module}-records-heading`}>
          <h2 id={`${module}-records-heading`}>{config.sectionTitle}</h2>
          {records.length === 0 ? (
            <p className="empty-module-state">No records yet. Add your first record using the form.</p>
          ) : (
            <div className="content-grid">
              {records.map((record) => (
                <article className="content-card module-record-card" key={record.id}>
                  <div className="module-record-header">
                    <h4>{record[config.fields[0].name]}</h4>
                    <button type="button" className="module-delete-button" onClick={() => handleDelete(record.id)}>Delete</button>
                  </div>
                  {config.fields.slice(1).map((field) => (
                    <p key={field.name}><span>{field.label}</span><strong>{record[field.name]}</strong></p>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ModulePage;
