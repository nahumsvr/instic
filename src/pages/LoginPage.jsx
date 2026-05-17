import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Text,
  Title,
  Stack,
  Paper,
  Center,
  Box,
} from "@mantine/core";
import { Person, Lock } from "@gravity-ui/icons";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

/**
 * Pantalla de inicio de sesión.
 * POST /auth/login → recibe accessToken → decodifica rol → redirige según rol.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setError(null);

    // Validación básica en cliente
    if (!username.trim()) {
      setError("El correo electrónico es requerido.");
      return;
    }
    if (!password) {
      setError("La contraseña es requerida.");
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

      // Redirige según el rol
      if (rol === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/scan");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Center style={{ width: "100%", padding: "1.5rem" }}>
        <Paper
          shadow="xl"
          radius="xl"
          p="xl"
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Encabezado */}
          <Stack align="center" gap="xs" mb="xl">
            <Box
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(102, 126, 234, 0.45)",
              }}
            >
              <Person width={28} height={28} style={{ color: "#fff" }} />
            </Box>
            <Title
              order={1}
              style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 700 }}
            >
              Instic
            </Title>
            <Text size="sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Inicia sesión para continuar
            </Text>
          </Stack>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              {error && (
                <Alert
                  id="login-error-alert"
                  color="red"
                  variant="light"
                  radius="md"
                  title="Error de acceso"
                  styles={{
                    root: {
                      background: "rgba(255,80,80,0.12)",
                      border: "1px solid rgba(255,80,80,0.3)",
                    },
                    title: { color: "#ff6b6b" },
                    message: { color: "rgba(255,255,255,0.8)" },
                  }}
                >
                  {error}
                </Alert>
              )}

              <TextInput
                id="login-email"
                label="Correo electrónico"
                placeholder="usuario123"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                leftSection={<Person width={16} height={16} />}
                disabled={loading}
                styles={{
                  label: { color: "rgba(255,255,255,0.75)", marginBottom: 6 },
                  input: {
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    "::placeholder": { color: "rgba(255,255,255,0.35)" },
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
                leftSection={<Lock width={16} height={16} />}
                disabled={loading}
                styles={{
                  label: { color: "rgba(255,255,255,0.75)", marginBottom: 6 },
                  input: {
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                  },
                  innerInput: { color: "#fff" },
                }}
              />

              <Button
                id="login-submit-btn"
                type="submit"
                fullWidth
                size="md"
                radius="md"
                loading={loading}
                mt="xs"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  border: "none",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                styles={{
                  root: {
                    "&:hover:not(:disabled)": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 28px rgba(102,126,234,0.55)",
                    },
                  },
                }}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>
      </Center>
    </Box>
  );
}
