import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

/** Layout con menú lateral para pantallas autenticadas. */
export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ background: "var(--ds-bg)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
