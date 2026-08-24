import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm" element={<Farm />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/livestock" element={<Livestock />} />
          <Route path="/irrigation" element={<Irrigation />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/labour" element={<Labour />} />
          <Route path="/pest-disease" element={<PestDisease />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/harvest" element={<Harvest />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/money" element={<Money />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;