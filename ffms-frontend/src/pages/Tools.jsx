function Tools() {
  return (
    <div className="page-wrapper">
      <h1>Equipment & Tools</h1>
      <p>Manage farm equipment and tools.</p>
      
      <div className="page-content-section">
        <h2>Equipment Inventory</h2>
        <div className="content-grid">
          {/* Equipment items will be rendered here */}
          <div className="content-card">
            <h4>Equipment Record</h4>
            <p>Add your equipment data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tools;