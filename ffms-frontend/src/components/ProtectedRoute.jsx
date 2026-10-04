import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "./Loading";

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Loading message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="page-wrapper" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <h2>Access Restricted</h2>
        <p>Your current role (<strong>{role}</strong>) does not have permission to view this section.</p>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
