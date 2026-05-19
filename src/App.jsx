import { Routes, Route, Navigate } from "react-router";
import Movimientos from "./pages/Movements";
import LoginPage from "./pages/Login";
import InventoryPage from "./pages/MasterInventory";
import MobileWarehouse from "./pages/MobileWarehouse";
import DashboardPage from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";
import AppLayout from "./layouts/AppLayout";

/**
 * Enrutador principal de la aplicación.
 * Rutas públicas: /login
 * Rutas con sidebar (AppLayout): /dashboard, /inventory, /movements, /mobile-warehouse, /settings
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/movements" element={<Movimientos />} />
        <Route path="/mobile-warehouse" element={<MobileWarehouse />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
