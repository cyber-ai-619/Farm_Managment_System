function Money() {
  return (
    <div className="page-wrapper">
      <h1>Finance</h1>
      <p>Track farm financial activities and expenses.</p>
      
      <div className="page-content-section">
        <h2>Financial Overview</h2>
        <div className="content-grid">
          {/* Finance items will be rendered here */}
          <div className="content-card">
            <h4>Transaction</h4>
            <p>Add your financial data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Money;