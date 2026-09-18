import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import farmService from "../services/farmService";
import cropService from "../services/cropService";
import livestockService from "../services/livestockService";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    farms: 0,
    crops: 0,
    livestock: 0,
    fields: 0,
  });
  const [recentFarms, setRecentFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [farmsData, cropsData] = await Promise.all([
          farmService.getFarms().catch(() => []),
          cropService.getCrops().catch(() => []),
        ]);

        let livestockCount = 0;
        let fieldsCount = 0;

        if (farmsData.length > 0) {
          setRecentFarms(farmsData.slice(0, 3));
          // Aggregate livestock & fields across user's farms
          const farmPromises = farmsData.map(async (f) => {
            const [animals, fields] = await Promise.all([
              livestockService.getAnimals(f.id).catch(() => []),
              farmService.getFields(f.id).catch(() => []),
            ]);
            return { animalsCount: animals.length, fieldsCount: fields.length };
          });

          const results = await Promise.all(farmPromises);
          livestockCount = results.reduce((acc, r) => acc + r.animalsCount, 0);
          fieldsCount = results.reduce((acc, r) => acc + r.fieldsCount, 0);
        }

        setStats({
          farms: farmsData.length,
          crops: cropsData.length,
          livestock: livestockCount,
          fields: fieldsCount,
        });
      } catch (err) {
        console.error("Dashboard metrics error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      <p className="dashboard-brand">AgriHud</p>
      <h1>Farm Management Executive Dashboard</h1>
      <p>
        Welcome back, <strong>{user?.name || "Farmer"}</strong>. Here is the operational summary of your farm estates, active plantings, and livestock herds.
      </p>

      {loading ? (
        <Loading message="Compiling executive metrics..." />
      ) : (
        <>
          <div className="dashboard-cards">
            <Link to="/farm" style={{ textDecoration: "none" }}>
              <div className="dashboard-card">
                <h3>Total Farm Estates</h3>
                <p>{stats.farms}</p>
              </div>
            </Link>

            <Link to="/farm" style={{ textDecoration: "none" }}>
              <div className="dashboard-card">
                <h3>Cultivated Fields</h3>
                <p>{stats.fields}</p>
              </div>
            </Link>

            <Link to="/crops" style={{ textDecoration: "none" }}>
              <div className="dashboard-card">
                <h3>Registered Crops</h3>
                <p>{stats.crops}</p>
              </div>
            </Link>

            <Link to="/livestock" style={{ textDecoration: "none" }}>
              <div className="dashboard-card">
                <h3>Active Herd Animals</h3>
                <p>{stats.livestock}</p>
              </div>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px" }}>
            {/* Quick Actions Card */}
            <div className="content-card">
              <h4 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>⚡ Quick Operations</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Link
                  to="/farm"
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 234, 208, 0.5)",
                    border: "1px solid rgba(212, 165, 74, 0.3)",
                    color: "var(--color-forest)",
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  🏡 Manage Farms & Fields
                </Link>
                <Link
                  to="/crops"
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 234, 208, 0.5)",
                    border: "1px solid rgba(212, 165, 74, 0.3)",
                    color: "var(--color-forest)",
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  🌱 Plantings & Varieties
                </Link>
                <Link
                  to="/livestock"
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 234, 208, 0.5)",
                    border: "1px solid rgba(212, 165, 74, 0.3)",
                    color: "var(--color-forest)",
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  🐄 Herd & Health Records
                </Link>
                <Link
                  to="/reports"
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 234, 208, 0.5)",
                    border: "1px solid rgba(212, 165, 74, 0.3)",
                    color: "var(--color-forest)",
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  📊 Executive Reports
                </Link>
              </div>
            </div>

            {/* Farm Overview Card */}
            <div className="content-card">
              <h4 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>🌾 Your Estates</h4>
              {recentFarms.length === 0 ? (
                <p>No farms registered yet. Click "Manage Farms" to create your first estate.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentFarms.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(30, 70, 50, 0.04)",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--color-forest)" }}>{f.name}</span>
                      <span style={{ color: "var(--color-charcoal-60)", fontSize: "0.85rem" }}>
                        {f.total_area_ha ? `${f.total_area_ha} ha` : "Area N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;