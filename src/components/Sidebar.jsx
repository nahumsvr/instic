import { NavLink, useNavigate } from "react-router";
import { Divider } from "@mantine/core";
import {
  ChartLine,
  Boxes3,
  ArrowRightArrowLeft,
  MapPin,
  Gear,
  Shield,
  ArrowRightFromSquare,
} from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: ChartLine, end: true },
  { label: "Artículos", to: "/inventory", icon: Boxes3 },
  { label: "Movimientos", to: "/movements", icon: ArrowRightArrowLeft },
  { label: "Almacén móvil", to: "/mobile-warehouse", icon: MapPin },
  { label: "Configuración", to: "/settings", icon: Gear },
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

/** Badge de rol del usuario. Sigue los colores semánticos del design system. */
const ROLE_LABELS = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  EMPLOYEE: "Empleado",
};

const ROLE_STYLES = {
  ADMIN: {
    border: "1px solid rgba(99, 102, 241, 0.4)",
    background: "linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 100%), var(--ds-surface)",
    color: "var(--ds-info-text)",
  },
  MANAGER: {
    border: "1px solid rgba(245, 158, 11, 0.4)",
    background: "linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 100%), var(--ds-surface)",
    color: "var(--ds-warning-text)",
  },
  EMPLOYEE: {
    border: "1px solid rgba(16, 185, 129, 0.4)",
    background: "linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 100%), var(--ds-surface)",
    color: "var(--ds-success-text)",
  },
};

const DEFAULT_ROLE_STYLE = {
  border: "1px solid var(--ds-border)",
  background: "var(--ds-surface)",
  color: "var(--ds-muted)",
};

function RoleBadge({ rol }) {
  const key = (rol ?? "").toUpperCase();
  const style = ROLE_STYLES[key] ?? DEFAULT_ROLE_STYLE;
  const label = ROLE_LABELS[key] ?? rol ?? "—";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.6875rem",
        fontWeight: 600,
        borderRadius: "999px",
        padding: "3px 8px",
        background: style.background,
        border: style.border,
        color: style.color,
        alignSelf: "flex-start",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {label}
    </span>
  );
}

function isAdmin(user) {
  const rol = user?.rol ?? user?.role ?? "";
  return rol === "ADMIN" || rol === "admin";
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    ...NAV_ITEMS,
    ...(isAdmin(user) ? [{ label: "Administración", to: "/admin", icon: Shield }] : []),
  ];

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
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <Divider my="sm" color="var(--ds-border)" />

      {/* Información del usuario autenticado */}
      {user && (
        <div className="px-3 mb-2 flex flex-col gap-1">
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--ds-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={user.email}
          >
            {user.email}
          </span>
          <RoleBadge rol={user.rol ?? user.role} />
        </div>
      )}

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
