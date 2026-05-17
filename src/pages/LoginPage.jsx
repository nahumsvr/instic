import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Title,
  Stack,
  Paper,
  Box,
  Divider,
} from "@mantine/core";
import { Person, Lock } from "@gravity-ui/icons";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

/* ─── Tokens del design system ─────────────────────────────────────────── */
const ds = {
  bg: "#F5F5F5",
  surface: "#FFFFFF",
  border: "#E0E0E0",
  text: "#111111",
  muted: "#6B6B6B",
  subtle: "#AAAAAA",
  accent: "#111111",
  accentHover: "#333333",
  accentFg: "#FFFFFF",
  // semántico error
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  dangerText: "#B91C1C",
};

/* ─── Estilos compartidos ────────────────────────────────────────────────── */
const inputStyles = {
  label: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: ds.muted,
    marginBottom: 4,
    fontFamily: "Inter, sans-serif",
  },
  input: {
    background: ds.surface,
    border: `1px solid ${ds.border}`,
    borderRadius: 6,
    color: ds.text,
    fontSize: "0.875rem",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 150ms ease-in-out",
  },
};

/**
 * Pantalla de inicio de sesión — design system Instic (blanco/negro).
 * POST /auth/login → recibe accessToken → decodifica rol → redirige según rol.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // `submitted` se activa al intentar enviar para resaltar campos vacíos
  const [submitted, setSubmitted] = useState(false);

  /** Decodifica el payload de un JWT sin verificar firma (solo lectura de datos). */
  function decodeJwtPayload(token) {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    // Validación básica en cliente — errores de campo se muestran usando toast
    if (!username.trim()) {
      toast.error("El usuario es requerido.");
      return;
    }
    if (!password) {
      toast.error("La contraseña es requerida.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status}: ${res.statusText}`);
      }

      const { accessToken } = await res.json();

      // Decodifica el payload para extraer el rol del usuario
      const payload = decodeJwtPayload(accessToken);
      const rol = payload?.rol ?? payload?.role ?? "empleado";
      const userData = { username: username.trim(), rol };

      login(accessToken, userData);
      toast.success("Sesión iniciada correctamente");

      // Redirige según el rol
      if (rol === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/scan");
      }
    } catch (err) {
      // Error de API → toast no bloqueante
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: ds.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Card central */}
      <Paper
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 1.5rem",
          background: ds.surface,
          border: `1px solid ${ds.border}`,
          borderRadius: 8,
          padding: 32,
          boxShadow: "none",
        }}
      >
        {/* Encabezado */}
        <Stack gap={4} mb={28}>
          {/* Logotipo / marca */}
          <Box
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: ds.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Person width={14} height={14} style={{ color: ds.accentFg }} />
            </Box>
            <Text
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: ds.text,
                letterSpacing: "-0.01em",
                fontFamily: "Inter, sans-serif",
              }}
            >
              instic
            </Text>
          </Box>

          <Title
            order={1}
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: ds.text,
              letterSpacing: "-0.02em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Iniciar sesión
          </Title>
          <Text
            style={{
              fontSize: "0.875rem",
              color: ds.muted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Ingresa tus credenciales para continuar.
          </Text>
        </Stack>

        <Divider color={ds.border} mb={24} />

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={16}>
            <TextInput
              id="login-username"
              label="Usuario"
              placeholder="usuario123"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              leftSection={
                <Person width={15} height={15} style={{ color: ds.subtle }} />
              }
              disabled={loading}
              styles={{
                ...inputStyles,
                input: {
                  ...inputStyles.input,
                  borderColor: submitted && !username.trim() ? ds.dangerBorder : ds.border,
                },
              }}
            />

            <PasswordInput
              id="login-password"
              label="Contraseña"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              leftSection={
                <Lock width={15} height={15} style={{ color: ds.subtle }} />
              }
              disabled={loading}
              styles={{
                ...inputStyles,
                input: {
                  ...inputStyles.input,
                  borderColor: submitted && !password ? ds.dangerBorder : ds.border,
                },
                innerInput: {
                  color: ds.text,
                  fontSize: "0.875rem",
                  fontFamily: "Inter, sans-serif",
                },
              }}
            />

            <Button
              id="login-submit-btn"
              type="submit"
              fullWidth
              size="sm"
              loading={loading}
              mt={4}
              style={{
                background: ds.accent,
                color: ds.accentFg,
                border: "none",
                borderRadius: 6,
                height: 38,
                fontWeight: 600,
                fontSize: "0.875rem",
                letterSpacing: "0.01em",
                fontFamily: "Inter, sans-serif",
                transition: "background-color 150ms ease-in-out",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              styles={{
                root: {
                  "&:hover:not([data-disabled])": {
                    background: ds.accentHover,
                  },
                },
              }}
            >
              Entrar
            </Button>
          </Stack>
        </form>

        {/* Pie de card */}
        <Text
          style={{
            marginTop: 20,
            fontSize: "0.75rem",
            color: ds.subtle,
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Acceso restringido al personal autorizado.
        </Text>
      </Paper>
    </Box>
  );
}
