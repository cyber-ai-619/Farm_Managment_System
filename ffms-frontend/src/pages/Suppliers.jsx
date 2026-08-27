function Suppliers() {
  return (
    <div className="page-wrapper">
      <h1>Suppliers</h1>
      <p>Manage farm suppliers and supplier information.</p>
      
      <div className="page-content-section">
        <h2>Supplier List</h2>
        <div className="content-grid">
          {/* Supplier items will be rendered here */}
          <div className="content-card">
            <h4>Supplier Record</h4>
            <p>Add your supplier data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;