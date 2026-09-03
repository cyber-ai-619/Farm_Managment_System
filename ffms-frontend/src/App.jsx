import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ModulePage from "./components/ModulePage";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm" element={<ModulePage module="farms" />} />
          <Route path="/crops" element={<ModulePage module="crops" />} />
          <Route path="/livestock" element={<ModulePage module="livestock" />} />
          <Route path="/irrigation" element={<ModulePage module="irrigation" />} />
          <Route path="/inventory" element={<ModulePage module="inventory" />} />
          <Route path="/tools" element={<ModulePage module="tools" />} />
          <Route path="/labour" element={<ModulePage module="labour" />} />
          <Route path="/pest-disease" element={<ModulePage module="pestDisease" />} />
          <Route path="/weather" element={<ModulePage module="weather" />} />
          <Route path="/harvest" element={<ModulePage module="harvest" />} />
          <Route path="/sales" element={<ModulePage module="sales" />} />
          <Route path="/money" element={<ModulePage module="money" />} />
          <Route path="/suppliers" element={<ModulePage module="suppliers" />} />
          <Route path="/storage" element={<ModulePage module="storage" />} />
          <Route path="/reports" element={<ModulePage module="reports" />} />
          <Route path="/alerts" element={<ModulePage module="alerts" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;