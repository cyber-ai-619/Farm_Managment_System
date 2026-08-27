function Labour() {
  return (
    <div className="page-wrapper">
      <h1>Labour</h1>
      <p>Manage farm labour and workers.</p>
      
      <div className="page-content-section">
        <h2>Labour Management</h2>
        <div className="content-grid">
          {/* Labour items will be rendered here */}
          <div className="content-card">
            <h4>Worker Record</h4>
            <p>Add your labour data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Labour;