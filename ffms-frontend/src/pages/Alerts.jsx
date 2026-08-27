function Alerts() {
  return (
    <div className="page-wrapper">
      <h1>Notifications</h1>
      <p>Farm notifications will appear here.</p>
      
      <div className="page-content-section">
        <h2>Active Alerts</h2>
        <div className="content-grid">
          {/* Alert items will be rendered here */}
          <div className="content-card">
            <h4>Alert Notification</h4>
            <p>Add your alert data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;