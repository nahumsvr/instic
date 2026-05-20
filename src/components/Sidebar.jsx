import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { Divider } from "@mantine/core";
import {
  ChartLine,
  Boxes3,
  ArrowRightArrowLeft,
  MapPin,
  Gear,
  Shield,
  ArrowRightFromSquare,
  Bars,
  Xmark,
} from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";

// Colores Aurora por página: [r, g, b]
const NAV_ITEMS = [
  { label: "Dashboard",     to: "/dashboard",       icon: ChartLine,           end: true,  accent: [99,  102, 241] }, // Indigo
  { label: "Artículos",     to: "/inventory",        icon: Boxes3,                          accent: [14,  165, 233] }, // Sky
  { label: "Movimientos",   to: "/movements",        icon: ArrowRightArrowLeft,             accent: [16,  185, 129] }, // Emerald
  { label: "Almacén móvil", to: "/mobile-warehouse", icon: MapPin,                          accent: [245, 158, 11]  }, // Amber
  { label: "Configuración", to: "/settings",         icon: Gear,                            accent: [156, 163, 175] }, // Gray
];

/** Item de navegación del sidebar con Aurora effect en estado activo. */
function NavItem({ to, icon: Icon, label, end = false, accent = [99, 102, 241], onClick }) {
  const [r, g, b] = accent;
  const activeStyle = {
    background: `linear-gradient(90deg, rgba(${r},${g},${b},0.12) 0%, rgba(${r},${g},${b},0) 100%)`,
    borderLeft: `2px solid rgba(${r},${g},${b},0.9)`,
    color: `rgb(${r},${g},${b})`,
  };
  const inactiveStyle = {
    borderLeft: "2px solid transparent",
  };

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className="flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium transition-[background-color,border-color,color] duration-150 ease-in-out"
      style={({ isActive }) => isActive ? activeStyle : inactiveStyle}
    >
      {({ isActive }) => (
        <>
          <Icon
            width={16}
            height={16}
            style={isActive ? { color: `rgb(${r},${g},${b})` } : { color: "var(--ds-muted)" }}
          />
          <span style={isActive ? {} : { color: "var(--ds-muted)" }}>{label}</span>
        </>
      )}
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

/** Contenido del sidebar reutilizable tanto en desktop como en el drawer móvil. */
function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    ...NAV_ITEMS,
    ...(isAdmin(user) ? [{ label: "Administración", to: "/admin", icon: Shield, accent: [244, 63, 94] }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <>
      {/* Logo */}
      <div
        className="px-3 mb-6"
        style={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "var(--ds-text)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        INSTIC
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onNavigate} />
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
              fontFamily: "Inter, sans-serif",
            }}
            title={user.email}
          >
            {user.email}
          </span>
          <RoleBadge rol={user.rol ?? user.role} />
        </div>
      )}

      {/* Botón salir */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium w-full text-left border-l-2 border-l-transparent text-[var(--ds-muted)] hover:bg-[var(--ds-bg)] transition-[background-color] duration-150 ease-in-out cursor-pointer bg-transparent border-none"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <ArrowRightFromSquare width={16} height={16} />
        <span>Salir</span>
      </button>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cierra el drawer al cambiar de ruta (navegar)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Bloquea scroll del body mientras el drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── DESKTOP: sidebar fijo a la izquierda ── */}
      <aside
        className="hidden md:flex flex-col shrink-0 w-[220px] h-full overflow-hidden py-4 px-3"
        style={{
          background: "var(--ds-sidebar)",
          borderRight: "1px solid var(--ds-border)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── MÓVIL: botón hamburguesa fijo ── */}
      <button
        type="button"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-9 h-9 rounded-md transition-[background-color,box-shadow] duration-150 ease-in-out cursor-pointer"
        style={{
          background: "var(--ds-surface)",
          border: "1px solid var(--ds-border)",
          color: "var(--ds-text)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {mobileOpen ? <Xmark width={18} height={18} /> : <Bars width={18} height={18} />}
      </button>

      {/* ── MÓVIL: overlay oscuro ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MÓVIL: drawer deslizante ── */}
      <aside
        className="md:hidden fixed top-0 left-0 z-50 h-full flex flex-col py-4 px-3 overflow-hidden"
        style={{
          width: "260px",
          background: "var(--ds-sidebar, var(--ds-surface))",
          borderRight: "1px solid var(--ds-border)",
          fontFamily: "Inter, sans-serif",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 250ms ease-in-out",
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
        }}
        aria-hidden={!mobileOpen}
      >
        {/* Botón cerrar dentro del drawer */}
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-[background-color] duration-150 ease-in-out"
          style={{
            background: "transparent",
            border: "1px solid var(--ds-border)",
            color: "var(--ds-muted)",
          }}
        >
          <Xmark width={16} height={16} />
        </button>

        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
