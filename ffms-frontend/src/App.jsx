import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Farm from "./pages/Farm";
import Crops from "./pages/Crops";
import Livestock from "./pages/Livestock";
import Irrigation from "./pages/Irrigation";
import Inventory from "./pages/Inventory";
import Tools from "./pages/Tools";
import Labour from "./pages/Labour";
import PestDisease from "./pages/PestDisease";
import Weather from "./pages/Weather";
import Harvest from "./pages/Harvest";
import Sales from "./pages/Sales";
import Money from "./pages/Money";
import Suppliers from "./pages/Suppliers";
import Storage from "./pages/Storage";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import Team from "./pages/Team";
import WorkerPortal from "./pages/WorkerPortal";

const ROLES_ALL = ["admin", "farm_owner", "farm_manager", "agronomist", "accountant", "worker", "veterinarian"];
const ROLES_AGRI = ["admin", "farm_owner", "farm_manager", "agronomist"];
const ROLES_OPS = ["admin", "farm_owner", "farm_manager"];
const ROLES_LIVESTOCK = ["admin", "farm_owner", "farm_manager", "veterinarian"];
const ROLES_FINANCE = ["admin", "farm_owner", "accountant"];
const ROLES_SUPPLY = ["admin", "farm_owner", "farm_manager", "accountant"];
const ROLES_FIELD_CREW = ["admin", "farm_owner", "farm_manager", "agronomist", "worker", "veterinarian"];
const ROLES_EQUIP_CREW = ["admin", "farm_owner", "farm_manager", "worker"];
const ROLES_REPORTS = ["admin", "farm_owner", "farm_manager", "agronomist", "accountant", "veterinarian"];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={ROLES_ALL}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-work" element={<ProtectedRoute allowedRoles={ROLES_FIELD_CREW}><WorkerPortal /></ProtectedRoute>} />
            <Route path="/farm" element={<ProtectedRoute allowedRoles={ROLES_AGRI}><Farm /></ProtectedRoute>} />
            <Route path="/crops" element={<ProtectedRoute allowedRoles={ROLES_AGRI}><Crops /></ProtectedRoute>} />
            <Route path="/livestock" element={<ProtectedRoute allowedRoles={ROLES_LIVESTOCK}><Livestock /></ProtectedRoute>} />
            <Route path="/irrigation" element={<ProtectedRoute allowedRoles={ROLES_FIELD_CREW}><Irrigation /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={ROLES_SUPPLY}><Inventory /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute allowedRoles={ROLES_EQUIP_CREW}><Tools /></ProtectedRoute>} />
            <Route path="/labour" element={<ProtectedRoute allowedRoles={ROLES_OPS}><Labour /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute allowedRoles={["admin", "farm_owner"]}><Team /></ProtectedRoute>} />
            <Route path="/pest-disease" element={<ProtectedRoute allowedRoles={ROLES_AGRI}><PestDisease /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute allowedRoles={ROLES_FIELD_CREW}><Weather /></ProtectedRoute>} />
            <Route path="/harvest" element={<ProtectedRoute allowedRoles={ROLES_AGRI}><Harvest /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute allowedRoles={ROLES_SUPPLY}><Sales /></ProtectedRoute>} />
            <Route path="/money" element={<ProtectedRoute allowedRoles={ROLES_FINANCE}><Money /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute allowedRoles={ROLES_SUPPLY}><Suppliers /></ProtectedRoute>} />
            <Route path="/storage" element={<ProtectedRoute allowedRoles={ROLES_SUPPLY}><Storage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={ROLES_REPORTS}><Reports /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute allowedRoles={ROLES_ALL}><Alerts /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;