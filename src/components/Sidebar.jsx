import { NavLink, useNavigate } from "react-router";
import { Divider } from "@mantine/core";
import {
  ChartLine,
  Boxes3,
  ArrowRightArrowLeft,
  MapPin,
  ArrowRightFromSquare,
} from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: ChartLine, end: true },
  { label: "Artículos", to: "/inventory", icon: Boxes3 },
  { label: "Movimientos", to: "/movements", icon: ArrowRightArrowLeft },
  { label: "Almacén móvil", to: "/mobile-warehouse", icon: MapPin },
];

/** Item de navegación del sidebar con estado activo según la ruta actual. */
function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium",
          "transition-[background-color,border-color] duration-150 ease-in-out",
          "border-l-2",
          isActive
            ? "bg-[var(--ds-bg)] text-[var(--ds-text)] border-l-[var(--ds-accent)]"
            : "text-[var(--ds-muted)] border-l-transparent hover:bg-[var(--ds-bg)]",
        ].join(" ")
      }
    >
      <Icon width={16} height={16} />
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * Menú lateral de navegación entre pantallas autenticadas.
 * Visible en desktop (md+); oculto en móvil para no interferir con vistas móviles.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 w-[220px] h-full overflow-hidden py-4 px-3"
      style={{
        background: "var(--ds-sidebar)",
        borderRight: "1px solid var(--ds-border)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        className="px-3 mb-6"
        style={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "var(--ds-text)",
        }}
      >
        INSTIC
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <Divider my="sm" color="var(--ds-border)" />

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium w-full text-left border-l-2 border-l-transparent text-[var(--ds-muted)] hover:bg-[var(--ds-bg)] transition-[background-color] duration-150 ease-in-out cursor-pointer bg-transparent border-none"
      >
        <ArrowRightFromSquare width={16} height={16} />
        <span>Salir</span>
      </button>
    </aside>
  );
}
