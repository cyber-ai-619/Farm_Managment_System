function Inventory() {
  return (
    <div className="page-wrapper">
      <h1>Inventory</h1>
      <p>Manage farm inventory and supplies.</p>
      
      <div className="page-content-section">
        <h2>Inventory Items</h2>
        <div className="content-grid">
          {/* Inventory items will be rendered here */}
          <div className="content-card">
            <h4>Example Item</h4>
            <p>Add your inventory data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventory;