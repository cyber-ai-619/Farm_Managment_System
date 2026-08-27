function Livestock() {
  return (
    <div className="page-wrapper">
      <h1>Livestock</h1>
      <p>Manage livestock and animal records.</p>
      
      <div className="page-content-section">
        <h2>Your Livestock</h2>
        <div className="content-grid">
          {/* Livestock items will be rendered here */}
          <div className="content-card">
            <h4>Example Animal</h4>
            <p>Add your livestock data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Livestock;