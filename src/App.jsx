import { Routes, Route, Navigate } from "react-router";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/MasterInventory";

/**
 * Enrutador principal de la aplicación.
 * Rutas actuales:
 *  /        → redirige a /login
 *  /login   → pantalla de inicio de sesión
 *
 * Próximas rutas (agregar aquí):
 *  /dashboard  → panel del administrador
 *  /scan       → pantalla de escaneo del empleado
 */
function App() {
  return (
    <Routes>
      {/* Ruta raíz: redirige al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Pantalla de login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pantalla de Inventario Maestro*/}
      <Route path="/inventory" element={<InventoryPage />} />

      {/* Rutas futuras — descomentar al implementar */}
      {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
      {/* <Route path="/scan" element={<ScanPage />} /> */}
    </Routes>
  );
}

export default App;
