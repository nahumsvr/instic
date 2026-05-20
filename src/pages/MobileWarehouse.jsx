import { useState, useEffect } from "react";
import {
  Container, Card, Text, Button, Badge, Drawer,
  TextInput, Stack, Group, Title, Loader, Alert, Box
} from "@mantine/core";
import { ReactZxingScanner } from "react-zxing-scanner";
import { toast } from "sonner";
import { Camera, TriangleExclamation, MapPin, Box as BoxIcon, Check, ArrowRotateLeft } from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  getInitialWarehouseLocation,
  getLocationIdAndName,
  setSessionLocation,
  clearSessionLocation,
} from "../utils/warehouseLocation";

/** Estados activos que un almacén puede recibir */
const ACTIVE_STATES = ["PENDING", "APPROVED", "IN_PROGRESS"];

export default function MobileWarehouse() {
  const { token } = useAuth();

  // --- Estado de ubicación seleccionada (sesión o por defecto desde Configuración) ---
  const [location, setLocation] = useState(getInitialWarehouseLocation);
  const { id: locationId, name: locationName } = location;

  // --- Ubicaciones disponibles ---
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [errorLocations, setErrorLocations] = useState(null);

  // --- Pedidos del almacén seleccionado ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState(null);

  // --- Scanner ---
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  // --- Detalle y confirmación ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!locationId) {
      fetchLocations();
    } else {
      fetchOrders();
    }
  }, [locationId]); // eslint-disable-line

  // ─── Fetch: Ubicaciones ──────────────────────────────────────────────────
  const fetchLocations = async () => {
    setLoadingLocations(true);
    setErrorLocations(null);
    try {
      const res = await fetch(`${API_BASE_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setErrorLocations(err.message);
      toast.error("Error al cargar ubicaciones: " + err.message);
    } finally {
      setLoadingLocations(false);
    }
  };

  // ─── Fetch: Pedidos ──────────────────────────────────────────────────────
  // La API retorna todas las órdenes; filtramos en el cliente por destinationId
  // y por estado activo. El campo de estado real es `estado` (no `status`).
  const fetchOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();

      // Normalizar el campo de estado (puede venir como `estado` o `status`)
      const filtered = data.filter((o) => {
        const estado = o.estado ?? o.status ?? "";
        const destId = o.destinationId ?? o.id_destino ?? o.destination?.id_ubicacion ?? o.destination?.id;
        const isActiveState = ACTIVE_STATES.includes(estado.toUpperCase());
        const isMyLocation = String(destId) === String(locationId);
        return isActiveState && isMyLocation;
      });

      setOrders(filtered);
    } catch (err) {
      setErrorOrders(err.message);
      toast.error("Error al cargar pedidos: " + err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  // ─── Seleccionar ubicación ───────────────────────────────────────────────
  const handleSelectLocation = (loc) => {
    const { id, name } = getLocationIdAndName(loc);
    setSessionLocation(id, name);
    setLocation({ id, name });
  };

  const handleChangeLocation = () => {
    clearSessionLocation();
    setLocation({ id: "", name: "" });
    setOrders([]);
  };

  // ─── Scanner ─────────────────────────────────────────────────────────────
  const openOrderScanner = (order) => {
    setPendingOrder(order);
    setScannerOpen(true);
    setManualCode("");
  };

  const processScannedCode = async (code) => {
    if (!code?.trim()) return;
    setScannerOpen(false);

    const orderId = pendingOrder?.id_orden ?? pendingOrder?.id;

    // Si hay una orden pre-seleccionada, verificar que el código coincida
    if (pendingOrder && String(orderId) !== String(code.trim())) {
      toast.error(
        `El código escaneado (${code.trim()}) no coincide con el pedido seleccionado (${orderId})`
      );
      return;
    }

    await fetchOrderDetail(orderId ?? code.trim());
  };

  // ─── Detalle de la orden ─────────────────────────────────────────────────
  const fetchOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: Pedido no encontrado`);
      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      toast.error("Error: " + err.message);
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ─── Confirmar recepción ─────────────────────────────────────────────────
  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    setConfirming(true);

    // El ID real de la orden
    const orderId = selectedOrder.id_orden ?? selectedOrder.id;

    try {
      // 1. PATCH /orders/:id/state → avanzar a COMPLETED
      const resOrder = await fetch(`${API_BASE_URL}/orders/${orderId}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!resOrder.ok) {
        const body = await resOrder.json().catch(() => ({}));
        throw new Error(body?.message || `Error actualizando orden: ${resOrder.statusText}`);
      }

      // 2. POST /movements/input por cada artículo de la orden
      const items = selectedOrder.items ?? selectedOrder.detalles ?? [];
      for (const item of items) {
        const articleId = item.id_articulo ?? item.articleId;
        const quantity = item.cantidad ?? item.quantity;
        const resMov = await fetch(`${API_BASE_URL}/movements/input`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            articleId,
            quantity,
            destinationId: Number(locationId),
          }),
        });
        if (!resMov.ok) {
          const body = await resMov.json().catch(() => ({}));
          throw new Error(body?.message || `Error registrando entrada para artículo ${articleId}`);
        }
      }

      toast.success("¡Pedido recibido con éxito!");
      setDetailOpen(false);
      setSelectedOrder(null);
      setPendingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error("Error al confirmar entrega: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // UI: Selección de Almacén
  // ════════════════════════════════════════════════════════════════════════════
  if (!locationId) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg" align="center" mt="xl">
          <MapPin width={48} height={48} style={{ color: "var(--ds-muted)" }} />
          <Title order={2} style={{ color: "var(--ds-text)" }}>
            Selecciona tu Almacén
          </Title>
          <Text c="dimmed" ta="center">
            Debes seleccionar en qué ubicación estás trabajando para recibir pedidos.
          </Text>

          {loadingLocations ? (
            <Loader color="var(--ds-accent)" />
          ) : errorLocations ? (
            <Alert
              color="red"
              title="Error al cargar ubicaciones"
              icon={<TriangleExclamation width={16} height={16} />}
              w="100%"
            >
              {errorLocations}
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                mt="sm"
                leftSection={<ArrowRotateLeft width={14} height={14} />}
                onClick={fetchLocations}
              >
                Reintentar
              </Button>
            </Alert>
          ) : locations.length === 0 ? (
            <Text c="dimmed" size="sm">
              No hay ubicaciones disponibles.
            </Text>
          ) : (
            <Stack w="100%">
              {locations.map((loc) => {
                const id = loc.id_ubicacion ?? loc.id;
                const name = loc.nombre ?? loc.name ?? String(id);
                return (
                  <Card
                    key={id}
                    withBorder
                    shadow="sm"
                    radius="md"
                    onClick={() => handleSelectLocation(loc)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "var(--ds-surface)",
                      borderColor: "var(--ds-border)",
                      transition: "background-color 150ms ease-in-out",
                    }}
                  >
                    <Group justify="space-between">
                      <Text fw={500} style={{ color: "var(--ds-text)" }}>
                        {name}
                      </Text>
                      <BoxIcon
                        width={18}
                        height={18}
                        style={{ color: "var(--ds-muted)" }}
                      />
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // UI: Lista de Pedidos
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <Box bg="var(--ds-bg)">
      <Container size="sm" p="md">
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <div>
            <h2 className="text-[1.25rem] font-semibold text-[var(--ds-text)] font-inter tracking-tight">
              Tareas Pendientes
            </h2>
            <Text size="sm" c="dimmed">
              <span style={{ color: "var(--ds-text)", fontWeight: 500 }}>
                {locationName || locationId}
              </span>
              {" · "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={handleChangeLocation}
              >
                Cambiar almacén
              </span>
            </Text>
          </div>
          <Group gap="xs">
            <Badge size="lg" color="blue" variant="light">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              px="xs"
              loading={loadingOrders}
              onClick={fetchOrders}
              title="Actualizar pedidos"
            >
              <ArrowRotateLeft width={16} height={16} />
            </Button>
          </Group>
        </Group>

        {/* Contenido */}
        {loadingOrders ? (
          <Group justify="center" mt="xl">
            <Loader color="var(--ds-accent)" />
          </Group>
        ) : errorOrders ? (
          <Alert
            color="red"
            title="Error al cargar pedidos"
            icon={<TriangleExclamation width={16} height={16} />}
          >
            {errorOrders}
          </Alert>
        ) : orders.length === 0 ? (
          <Stack align="center" mt="xl" py="xl">
            <Check
              width={48}
              height={48}
              style={{ color: "var(--ds-success-text, #15803D)" }}
            />
            <Text fw={500} size="lg" style={{ color: "var(--ds-text)" }}>
              Todo al día
            </Text>
            <Text c="dimmed">No hay pedidos pendientes por recibir.</Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {orders.map((order) => {
              const orderId = order.id_orden ?? order.id;
              const estado = order.estado ?? order.status ?? "";
              // Los items pueden venir como `items`, `detalles`, o directamente
              // como un solo artículo en la orden (estructura plana)
              const itemCount =
                order.items?.length ??
                order.detalles?.length ??
                (order.id_articulo ? 1 : 0);
              const articleName =
                order.article?.nombre ??
                order.article?.name ??
                order.nombre ??
                null;

              return (
                <Card
                  key={orderId}
                  withBorder
                  radius="md"
                  p="lg"
                  shadow="sm"
                  style={{
                    backgroundColor: "var(--ds-surface)",
                    borderColor: "var(--ds-border)",
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text
                      fw={700}
                      ff="mono"
                      size="lg"
                      style={{ color: "var(--ds-text)" }}
                    >
                      #{orderId}
                    </Text>
                    <Badge
                      color={
                        estado.toUpperCase() === "PENDING"
                          ? "orange"
                          : estado.toUpperCase() === "APPROVED"
                          ? "blue"
                          : "cyan"
                      }
                    >
                      {estado}
                    </Badge>
                  </Group>

                  {articleName && (
                    <Text size="sm" c="dimmed" mb={4}>
                      {articleName}
                    </Text>
                  )}

                  <Text size="sm" mb="md" c="dimmed">
                    {itemCount > 0
                      ? `${itemCount} artículo${itemCount !== 1 ? "s" : ""}`
                      : order.cantidad
                      ? `${order.cantidad} unidades`
                      : "—"}
                  </Text>

                  <Button
                    fullWidth
                    size="md"
                    leftSection={<Camera width={18} height={18} />}
                    style={{
                      backgroundColor: "var(--ds-accent)",
                      color: "var(--ds-accent-fg)",
                    }}
                    onClick={() => openOrderScanner(order)}
                  >
                    Recibir Pedido
                  </Button>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* ── Scanner Drawer ─────────────────────────────────────────────── */}
      <Drawer
        opened={scannerOpen}
        onClose={() => setScannerOpen(false)}
        position="bottom"
        size="90%"
        title={
          <Text fw={600} style={{ color: "var(--ds-text)" }}>
            Escanear Pedido #
            {pendingOrder?.id_orden ?? pendingOrder?.id}
          </Text>
        }
        styles={{
          content: { backgroundColor: "var(--ds-surface)" },
          header: { backgroundColor: "var(--ds-surface)" },
        }}
      >
        <Stack gap="lg" align="center">
          <Box
            w="100%"
            h={280}
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
              border: "1px solid var(--ds-border)",
              backgroundColor: "var(--ds-bg)",
            }}
          >
            {scannerOpen && (
              <ReactZxingScanner
                onUpdate={(result) => {
                  if (result) {
                    const text =
                      typeof result.getText === "function"
                        ? result.getText()
                        : String(result);
                    if (text) processScannedCode(text);
                  }
                }}
                onError={() => toast.error("Error al acceder a la cámara")}
                width="100%"
                height="100%"
              />
            )}
          </Box>

          <Text c="dimmed" size="sm">
            O ingresa el código manualmente:
          </Text>

          <Group w="100%">
            <TextInput
              placeholder={`Ej. ${pendingOrder?.id_orden ?? pendingOrder?.id ?? "123"}`}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && processScannedCode(manualCode)
              }
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: "var(--ds-bg)",
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text)",
                },
              }}
            />
            <Button
              style={{
                backgroundColor: "var(--ds-accent)",
                color: "var(--ds-accent-fg)",
              }}
              onClick={() => processScannedCode(manualCode)}
            >
              Validar
            </Button>
          </Group>
        </Stack>
      </Drawer>

      {/* ── Detalle y Confirmar Drawer ─────────────────────────────────── */}
      <Drawer
        opened={detailOpen}
        onClose={() => setDetailOpen(false)}
        position="bottom"
        size="auto"
        title={
          <Text fw={700} size="xl" style={{ color: "var(--ds-text)" }}>
            Detalle de Recepción
          </Text>
        }
        styles={{
          content: { backgroundColor: "var(--ds-surface)" },
          header: { backgroundColor: "var(--ds-surface)" },
        }}
      >
        {loadingDetail ? (
          <Group justify="center" p="xl">
            <Loader color="var(--ds-accent)" />
          </Group>
        ) : (
          selectedOrder && (
            <Stack gap="md" pb="xl">
              <Group justify="space-between">
                <Text c="dimmed">ID Pedido:</Text>
                <Text fw={600} ff="mono" style={{ color: "var(--ds-text)" }}>
                  #{selectedOrder.id_orden ?? selectedOrder.id}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Estado:</Text>
                <Badge>
                  {selectedOrder.estado ?? selectedOrder.status}
                </Badge>
              </Group>
              {(selectedOrder.origin ?? selectedOrder.origen) && (
                <Group justify="space-between">
                  <Text c="dimmed">Origen:</Text>
                  <Text fw={500} style={{ color: "var(--ds-text)" }}>
                    {(selectedOrder.origin ?? selectedOrder.origen)?.nombre ??
                      (selectedOrder.origin ?? selectedOrder.origen)?.name}
                  </Text>
                </Group>
              )}

              {/* Lista de artículos */}
              <Card
                withBorder
                radius="md"
                p="sm"
                style={{
                  backgroundColor: "var(--ds-bg)",
                  borderColor: "var(--ds-border)",
                }}
              >
                <Text fw={600} mb="xs" style={{ color: "var(--ds-text)" }}>
                  Artículos a recibir:
                </Text>

                {/* Orden con lista de items */}
                {(selectedOrder.items ?? selectedOrder.detalles ?? []).map(
                  (item, idx) => {
                    const name =
                      item.nombre ??
                      item.name ??
                      item.article?.nombre ??
                      item.article?.name ??
                      `Artículo #${item.id_articulo ?? item.articleId}`;
                    const qty = item.cantidad ?? item.quantity;
                    return (
                      <Group justify="space-between" key={idx} mb={4}>
                        <Text size="sm" style={{ color: "var(--ds-text)" }}>
                          {name}
                        </Text>
                        <Text
                          size="sm"
                          fw={600}
                          ff="mono"
                          style={{ color: "var(--ds-text)" }}
                        >
                          ×{qty}
                        </Text>
                      </Group>
                    );
                  }
                )}

                {/* Orden plana (un solo artículo directo en la orden) */}
                {!(selectedOrder.items ?? selectedOrder.detalles) &&
                  selectedOrder.id_articulo && (
                    <Group justify="space-between">
                      <Text size="sm" style={{ color: "var(--ds-text)" }}>
                        {selectedOrder.article?.nombre ??
                          selectedOrder.article?.name ??
                          `Artículo #${selectedOrder.id_articulo}`}
                      </Text>
                      <Text
                        size="sm"
                        fw={600}
                        ff="mono"
                        style={{ color: "var(--ds-text)" }}
                      >
                        ×{selectedOrder.cantidad ?? selectedOrder.quantity}
                      </Text>
                    </Group>
                  )}
              </Card>

              <Button
                size="xl"
                fullWidth
                mt="md"
                loading={confirming}
                leftSection={<Check width={24} height={24} />}
                onClick={handleConfirmDelivery}
                style={{
                  backgroundColor: "var(--ds-accent)",
                  color: "var(--ds-accent-fg)",
                }}
              >
                Confirmar Entrega
              </Button>
            </Stack>
          )
        )}
      </Drawer>
    </Box>
  );
}
