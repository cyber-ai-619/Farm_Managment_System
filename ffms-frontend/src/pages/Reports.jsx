function Reports() {
  return (
    <div className="page-wrapper">
      <h1>Reports</h1>
      <p>View and generate farm reports.</p>
      
      <div className="page-content-section">
        <h2>Available Reports</h2>
        <div className="content-grid">
          {/* Report items will be rendered here */}
          <div className="content-card">
            <h4>Report Template</h4>
            <p>Add your report data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;