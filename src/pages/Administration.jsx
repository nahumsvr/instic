import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router";
import {
  Container,
  Title,
  Text,
  Table,
  Button,
  Loader,
  Alert,
  Modal,
  TextInput,
  PasswordInput,
  Select,
  NumberInput,
  Group,
  Switch,
  Badge,
} from "@mantine/core";
import { Plus, Pencil, TrashBin, Person, MapPin, TriangleExclamation } from "@gravity-ui/icons";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { getLocationIdAndName } from "../utils/warehouseLocation";
import SectionNav from "../components/SectionNav";

const ADMIN_SECTIONS = [
  { id: "users", label: "Usuarios", icon: Person },
  { id: "locations", label: "Ubicaciones", icon: MapPin },
];

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "EMPLOYEE", label: "Empleado" },
];

const LOCATION_TYPE_OPTIONS = [
  { value: "TIENDA", label: "Tienda" },
  { value: "ALMACEN", label: "Almacén" },
];

const inputStyles = {
  label: { color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 500 },
  input: {
    backgroundColor: "var(--ds-bg)",
    borderColor: "var(--ds-border)",
    color: "var(--ds-text)",
  },
};

const modalStyles = {
  content: {
    backgroundColor: "var(--ds-surface)",
    borderRadius: "10px",
    border: "1px solid var(--ds-border)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
  },
  header: {
    backgroundColor: "var(--ds-surface)",
    borderBottom: "1px solid var(--ds-border)",
    marginBottom: "16px",
  },
  close: { color: "var(--ds-text)" },
};

function isAdmin(user) {
  const rol = user?.rol ?? user?.role ?? "";
  return rol === "ADMIN" || rol === "admin";
}

function getUserId(user) {
  return user.id_usuario ?? user.id;
}

async function parseApiError(res) {
  const body = await res.json().catch(() => ({}));
  const msg = body?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string") return msg;
  return `Error ${res.status}: ${res.statusText}`;
}

function roleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function locationTypeLabel(type) {
  return LOCATION_TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

/** Genera un código aleatorio para nueva ubicación, ej: UBI-8492 */
function generateLocationCode() {
  return `UBI-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Pantalla de administración: usuarios y ubicaciones (solo ADMIN). */
export default function Administration() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "EMPLOYEE",
    baseLocationId: "",
    isActive: true,
  });

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationForm, setLocationForm] = useState({
    codigo_ubicacion: "",
    nombre: "",
    tipo_ubicacion: "TIENDA",
    costo_almacenamiento_mensual: 0,
  });

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err.message);
      toast.error("Error al cargar usuarios: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocationsError(err.message);
      toast.error("Error al cargar ubicaciones: " + err.message);
    } finally {
      setLocationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !isAdmin(user)) return;
    fetchLocations();
    if (activeTab === "users") fetchUsers();
  }, [activeTab, token, user, fetchUsers, fetchLocations]);

  const openNewUser = () => {
    setEditingUserId(null);
    setUserForm({
      username: "",
      password: "",
      role: "EMPLOYEE",
      baseLocationId: "",
      isActive: true,
    });
    setUserModalOpen(true);
  };

  const openEditUser = (u) => {
    setEditingUserId(getUserId(u));
    setUserForm({
      username: u.username ?? "",
      password: "",
      role: u.role ?? u.rol ?? "EMPLOYEE",
      baseLocationId: u.baseLocationId ? String(u.baseLocationId) : "",
      isActive: u.isActive !== false,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      toast.error("El usuario es obligatorio");
      return;
    }
    if (!editingUserId && (!userForm.password || userForm.password.length < 6)) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (editingUserId && userForm.password && userForm.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setUserSaving(true);
    try {
      const payload = {
        username: userForm.username.trim(),
        role: userForm.role,
      };
      if (userForm.baseLocationId) {
        payload.baseLocationId = Number(userForm.baseLocationId);
      }
      if (userForm.password) payload.password = userForm.password;
      if (editingUserId) payload.isActive = userForm.isActive;

      const url = editingUserId
        ? `${API_BASE_URL}/users/${editingUserId}`
        : `${API_BASE_URL}/users`;
      const method = editingUserId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseApiError(res));

      toast.success(editingUserId ? "Usuario actualizado" : "Usuario creado");
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openNewLocation = () => {
    setEditingLocationId(null);
    setLocationForm({
      codigo_ubicacion: generateLocationCode(),
      nombre: "",
      tipo_ubicacion: "TIENDA",
      costo_almacenamiento_mensual: 0,
    });
    setLocationModalOpen(true);
  };

  const openEditLocation = (loc) => {
    const id = loc.id_ubicacion ?? loc.id;
    setEditingLocationId(id);
    setLocationForm({
      codigo_ubicacion: loc.codigo_ubicacion ?? loc.code ?? "",
      nombre: loc.nombre ?? loc.name ?? "",
      tipo_ubicacion: loc.tipo_ubicacion ?? loc.type ?? "TIENDA",
      costo_almacenamiento_mensual: loc.costo_almacenamiento_mensual ?? loc.storageCost ?? 0,
    });
    setLocationModalOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!locationForm.codigo_ubicacion.trim() || !locationForm.nombre.trim()) {
      toast.error("Código y nombre son obligatorios");
      return;
    }
    if (locationForm.costo_almacenamiento_mensual < 0) {
      toast.error("El costo de almacenamiento no puede ser negativo");
      return;
    }

    setLocationSaving(true);
    try {
      if (editingLocationId) {
        const res = await fetch(
          `${API_BASE_URL}/locations/${editingLocationId}/storage-cost`,
          {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
              costo_almacenamiento_mensual: Number(locationForm.costo_almacenamiento_mensual),
            }),
          }
        );
        if (!res.ok) throw new Error(await parseApiError(res));
        toast.success("Costo de almacenamiento actualizado");
      } else {
        const res = await fetch(`${API_BASE_URL}/locations`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            codigo_ubicacion: locationForm.codigo_ubicacion.trim(),
            nombre: locationForm.nombre.trim(),
            tipo_ubicacion: locationForm.tipo_ubicacion,
            costo_almacenamiento_mensual: Number(locationForm.costo_almacenamiento_mensual),
          }),
        });
        if (!res.ok) throw new Error(await parseApiError(res));
        toast.success("Ubicación creada");
      }
      setLocationModalOpen(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationSaving(false);
    }
  };

  const locationOptions = locations.map((loc) => {
    const { id, name } = getLocationIdAndName(loc);
    return { value: id, label: name };
  });

  if (!isAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container size="lg" py="2xl" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-8">
        <Title order={1} style={{ fontWeight: 700, color: "var(--ds-text)" }}>
          Administración
        </Title>
        <Text size="sm" mt={4} style={{ color: "var(--ds-muted)" }}>
          Gestión de usuarios y ubicaciones del sistema.
        </Text>
      </div>

      <SectionNav
        sections={ADMIN_SECTIONS}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Apartados de administración"
      />

      {activeTab === "users" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <Text size="sm" style={{ color: "var(--ds-muted)" }}>
              {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
            </Text>
            <Button
              leftSection={<Plus width={16} height={16} />}
              onClick={openNewUser}
              style={{ backgroundColor: "var(--ds-accent)", color: "var(--ds-accent-fg)" }}
            >
              Nuevo usuario
            </Button>
          </div>

          {usersError && (
            <Alert
              color="red"
              title="Error"
              icon={<TriangleExclamation width={16} height={16} />}
              mb="md"
            >
              {usersError}
            </Alert>
          )}

          <div
            className="rounded-lg overflow-x-auto border"
            style={{ backgroundColor: "var(--ds-surface)", borderColor: "var(--ds-border)" }}
          >
            {usersLoading && users.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader color="gray" />
              </div>
            ) : (
              <Table verticalSpacing="md" horizontalSpacing="lg" className="min-w-[600px]">
                <Table.Thead style={{ backgroundColor: "var(--ds-bg)" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Usuario
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Rol
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Ubicación base
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Estado
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
                      Acciones
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.length > 0 ? (
                    users.map((u) => {
                      const id = getUserId(u);
                      const baseLoc = locations.find(
                        (l) => String(l.id_ubicacion ?? l.id) === String(u.baseLocationId)
                      );
                      const baseName = baseLoc
                        ? getLocationIdAndName(baseLoc).name
                        : u.baseLocationId
                          ? String(u.baseLocationId)
                          : "—";
                      return (
                        <Table.Tr
                          key={id}
                          style={{ borderTop: "1px solid var(--ds-border)" }}
                          className="hover:bg-[var(--ds-bg)] transition-colors"
                        >
                          <Table.Td className="font-mono text-sm" style={{ color: "var(--ds-text)" }}>
                            {u.username}
                          </Table.Td>
                          <Table.Td style={{ color: "var(--ds-text)" }}>{roleLabel(u.role ?? u.rol)}</Table.Td>
                          <Table.Td style={{ color: "var(--ds-text)" }}>{baseName}</Table.Td>
                          <Table.Td>
                            <Badge
                              variant="outline"
                              size="sm"
                              styles={{
                                root: {
                                  backgroundColor: u.isActive !== false ? "var(--ds-success-bg)" : "var(--ds-bg)",
                                  borderColor: u.isActive !== false ? "var(--ds-success-border)" : "var(--ds-border)",
                                  color: u.isActive !== false ? "var(--ds-success-text)" : "var(--ds-muted)",
                                },
                              }}
                            >
                              {u.isActive !== false ? "Activo" : "Inactivo"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <Button
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={() => openEditUser(u)}
                                aria-label="Editar usuario"
                              >
                                <Pencil width={16} height={16} />
                              </Button>
                              <Button
                                variant="subtle"
                                color="red"
                                size="xs"
                                onClick={() => handleDeleteUser(id)}
                                aria-label="Eliminar usuario"
                              >
                                <TrashBin width={16} height={16} />
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--ds-muted)" }}>
                        No hay usuarios registrados
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </div>
        </>
      )}

      {activeTab === "locations" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <Text size="sm" style={{ color: "var(--ds-muted)" }}>
              {locations.length} ubicación{locations.length !== 1 ? "es" : ""}
            </Text>
            <Button
              leftSection={<Plus width={16} height={16} />}
              onClick={openNewLocation}
              style={{ backgroundColor: "var(--ds-accent)", color: "var(--ds-accent-fg)" }}
            >
              Nueva ubicación
            </Button>
          </div>

          {locationsError && (
            <Alert
              color="red"
              title="Error"
              icon={<TriangleExclamation width={16} height={16} />}
              mb="md"
            >
              {locationsError}
            </Alert>
          )}

          <div
            className="rounded-lg overflow-x-auto border"
            style={{ backgroundColor: "var(--ds-surface)", borderColor: "var(--ds-border)" }}
          >
            {locationsLoading && locations.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader color="gray" />
              </div>
            ) : (
              <Table verticalSpacing="md" horizontalSpacing="lg" className="min-w-[700px]">
                <Table.Thead style={{ backgroundColor: "var(--ds-bg)" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Código
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Nombre
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Tipo
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Costo mensual
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Estado
                    </Table.Th>
                    <Table.Th style={{ color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
                      Acciones
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {locations.length > 0 ? (
                    locations.map((loc) => {
                      const id = loc.id_ubicacion ?? loc.id;
                      return (
                        <Table.Tr
                          key={id}
                          style={{ borderTop: "1px solid var(--ds-border)" }}
                          className="hover:bg-[var(--ds-bg)] transition-colors"
                        >
                          <Table.Td className="font-mono text-sm" style={{ color: "var(--ds-text)" }}>
                            {loc.codigo_ubicacion ?? loc.code}
                          </Table.Td>
                          <Table.Td style={{ color: "var(--ds-text)" }}>{loc.nombre ?? loc.name}</Table.Td>
                          <Table.Td style={{ color: "var(--ds-text)" }}>
                            {locationTypeLabel(loc.tipo_ubicacion ?? loc.type)}
                          </Table.Td>
                          <Table.Td className="font-mono text-sm" style={{ color: "var(--ds-text)" }}>
                            ${Number(loc.costo_almacenamiento_mensual ?? loc.storageCost ?? 0).toFixed(2)}
                          </Table.Td>
                          <Table.Td style={{ color: "var(--ds-muted)", fontSize: "0.8125rem" }}>
                            {loc.estado ?? "—"}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            <Button
                              variant="subtle"
                              color="gray"
                              size="xs"
                              onClick={() => openEditLocation(loc)}
                              aria-label="Editar ubicación"
                            >
                              <Pencil width={16} height={16} />
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--ds-muted)" }}>
                        No hay ubicaciones registradas
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </div>
          <Text size="xs" mt="sm" style={{ color: "var(--ds-subtle)" }}>
            La edición de ubicaciones solo permite actualizar el costo mensual de almacenamiento.
          </Text>
        </>
      )}

      <Modal
        opened={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={
          <span style={{ fontWeight: 600, color: "var(--ds-text)" }}>
            {editingUserId ? "Editar usuario" : "Nuevo usuario"}
          </span>
        }
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        styles={modalStyles}
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Usuario"
            placeholder="nombre.usuario"
            required
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.currentTarget.value })}
            styles={inputStyles}
          />
          <PasswordInput
            label={editingUserId ? "Nueva contraseña (opcional)" : "Contraseña"}
            placeholder="Mínimo 6 caracteres"
            required={!editingUserId}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.currentTarget.value })}
            styles={inputStyles}
          />
          <Select
            label="Rol"
            required
            data={ROLE_OPTIONS}
            value={userForm.role}
            onChange={(val) => setUserForm({ ...userForm, role: val ?? "EMPLOYEE" })}
            styles={inputStyles}
          />
          <Select
            label="Ubicación base"
            placeholder="Sin ubicación asignada"
            clearable
            searchable
            data={locationOptions}
            value={userForm.baseLocationId || null}
            onChange={(val) => setUserForm({ ...userForm, baseLocationId: val ?? "" })}
            nothingFoundMessage="No hay ubicaciones"
            styles={inputStyles}
          />
          {editingUserId && (
            <Switch
              label="Usuario activo"
              checked={userForm.isActive}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.currentTarget.checked })}
              styles={{ label: { color: "var(--ds-text)" } }}
            />
          )}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setUserModalOpen(false)}
              disabled={userSaving}
              styles={{ root: { borderColor: "var(--ds-border)", color: "var(--ds-text)" } }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              loading={userSaving}
              style={{ backgroundColor: "var(--ds-accent)", color: "var(--ds-accent-fg)" }}
            >
              {editingUserId ? "Actualizar" : "Crear"}
            </Button>
          </Group>
        </div>
      </Modal>

      <Modal
        opened={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title={
          <span style={{ fontWeight: 600, color: "var(--ds-text)" }}>
            {editingLocationId ? "Editar costo de almacenamiento" : "Nueva ubicación"}
          </span>
        }
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        styles={modalStyles}
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Código"
            placeholder="Ej. T001"
            required
            disabled={!!editingLocationId}
            value={locationForm.codigo_ubicacion}
            onChange={(e) =>
              setLocationForm({ ...locationForm, codigo_ubicacion: e.currentTarget.value })
            }
            styles={inputStyles}
          />
          <TextInput
            label="Nombre"
            placeholder="Ej. Tienda Centro"
            required
            disabled={!!editingLocationId}
            value={locationForm.nombre}
            onChange={(e) => setLocationForm({ ...locationForm, nombre: e.currentTarget.value })}
            styles={inputStyles}
          />
          <Select
            label="Tipo"
            required
            disabled={!!editingLocationId}
            data={LOCATION_TYPE_OPTIONS}
            value={locationForm.tipo_ubicacion}
            onChange={(val) =>
              setLocationForm({ ...locationForm, tipo_ubicacion: val ?? "TIENDA" })
            }
            styles={inputStyles}
          />
          <NumberInput
            label="Costo mensual de almacenamiento"
            prefix="$"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            required
            value={locationForm.costo_almacenamiento_mensual}
            onChange={(val) =>
              setLocationForm({ ...locationForm, costo_almacenamiento_mensual: val ?? 0 })
            }
            styles={inputStyles}
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setLocationModalOpen(false)}
              disabled={locationSaving}
              styles={{ root: { borderColor: "var(--ds-border)", color: "var(--ds-text)" } }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveLocation}
              loading={locationSaving}
              style={{ backgroundColor: "var(--ds-accent)", color: "var(--ds-accent-fg)" }}
            >
              {editingLocationId ? "Actualizar" : "Crear"}
            </Button>
          </Group>
        </div>
      </Modal>
    </Container>
  );
}
