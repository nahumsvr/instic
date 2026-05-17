import { createContext, useContext, useState, useCallback } from "react";

/**
 * Contexto global de autenticación.
 * Expone: user (con rol), token, login() y logout().
 */
const AuthContext = createContext(null);

const TOKEN_KEY = "instic_token";
const USER_KEY = "instic_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) ?? null;
    } catch {
      return null;
    }
  });

  /**
   * Persiste el token y la info del usuario en localStorage y estado.
   * @param {string} accessToken - JWT recibido del backend.
   * @param {{ email: string, rol: string }} userData - Datos del usuario autenticado.
   */
  const login = useCallback((accessToken, userData) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  /** Limpia sesión del estado y localStorage. */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto de auth desde cualquier componente. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
