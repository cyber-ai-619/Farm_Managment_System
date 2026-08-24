function Dashboard() {
  return (
    <div className="dashboard-page">
      <h1>Farm Management Dashboard</h1>

      <p>
        Welcome to the Farm Management System. Here you can manage your
        farms, crops, livestock, inventory, equipment, and other farm
        activities.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Farms</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Total Crops</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Livestock</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Inventory Items</h3>
          <p>0</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;