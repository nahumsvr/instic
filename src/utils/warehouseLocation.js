const SESSION_ID_KEY = "warehouse_locationId";
const SESSION_NAME_KEY = "warehouse_locationName";
const DEFAULT_ID_KEY = "warehouse_default_locationId";
const DEFAULT_NAME_KEY = "warehouse_default_locationName";

/** @returns {{ id: string, name: string }} */
export function getSessionLocation() {
  return {
    id: localStorage.getItem(SESSION_ID_KEY) ?? "",
    name: localStorage.getItem(SESSION_NAME_KEY) ?? "",
  };
}

/** @returns {{ id: string, name: string }} */
export function getDefaultLocation() {
  return {
    id: localStorage.getItem(DEFAULT_ID_KEY) ?? "",
    name: localStorage.getItem(DEFAULT_NAME_KEY) ?? "",
  };
}

/** @param {string} id @param {string} name */
export function setSessionLocation(id, name) {
  localStorage.setItem(SESSION_ID_KEY, id);
  localStorage.setItem(SESSION_NAME_KEY, name);
}

/** @param {string} id @param {string} name */
export function setDefaultLocation(id, name) {
  localStorage.setItem(DEFAULT_ID_KEY, id);
  localStorage.setItem(DEFAULT_NAME_KEY, name);
}

export function clearSessionLocation() {
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_NAME_KEY);
}

export function clearDefaultLocation() {
  localStorage.removeItem(DEFAULT_ID_KEY);
  localStorage.removeItem(DEFAULT_NAME_KEY);
}

/**
 * Ubicación inicial para Almacén móvil: sesión activa o, si no hay, la por defecto.
 * Al aplicar la por defecto, también se persiste como sesión.
 * @returns {{ id: string, name: string }}
 */
export function getInitialWarehouseLocation() {
  const session = getSessionLocation();
  if (session.id) return session;

  const defaults = getDefaultLocation();
  if (defaults.id) {
    setSessionLocation(defaults.id, defaults.name);
    return defaults;
  }

  return { id: "", name: "" };
}

/** @param {{ id_ubicacion?: number, id?: number, nombre?: string, name?: string }} loc */
export function getLocationIdAndName(loc) {
  const id = String(loc.id_ubicacion ?? loc.id ?? "");
  const name = loc.nombre ?? loc.name ?? id;
  return { id, name };
}
