function Sales() {
  return (
    <div className="page-wrapper">
      <h1>Sales</h1>
      <p>Manage farm sales and transactions.</p>
      
      <div className="page-content-section">
        <h2>Sales Records</h2>
        <div className="content-grid">
          {/* Sales items will be rendered here */}
          <div className="content-card">
            <h4>Sale Transaction</h4>
            <p>Add your sales data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sales;