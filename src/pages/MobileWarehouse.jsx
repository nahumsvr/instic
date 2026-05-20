import { useState, useEffect } from "react";
import {
  Container, Card, Text, Button, Drawer, Modal,
  TextInput, Stack, Group, Title, Loader, Alert, Box, NumberInput
} from "@mantine/core";
import QrScanner from "../components/QrScanner";
import { toast } from "sonner";
import {
  Camera, TriangleExclamation, MapPin, Box as BoxIcon, Check,
  ArrowRotateLeft, Clock, Xmark
} from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  getInitialWarehouseLocation,
  getLocationIdAndName,
  setSessionLocation,
  clearSessionLocation,
} from "../utils/warehouseLocation";
import SectionNav from "../components/SectionNav";

const BadgeStatus = ({ status }) => {
  let style;
  let dot = false;
  const s = String(status || '').toUpperCase();

  if (s === 'COMPLETED') {
    style = {
      border: "1px solid rgba(16, 185, 129, 0.4)",
      background: "linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 100%), var(--ds-surface)",
      color: "var(--ds-success-text)",
    };
  } else if (s === 'PENDING') {
    style = {
      border: "1px solid rgba(245, 158, 11, 0.4)",
      background: "linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 100%), var(--ds-surface)",
      color: "var(--ds-warning-text)",
    };
    dot = true;
  } else if (s === 'CANCELLED') {
    style = {
      border: "1px solid rgba(244, 63, 94, 0.4)",
      background: "linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 100%), var(--ds-surface)",
      color: "var(--ds-danger-text)",
    };
  } else if (s === 'APPROVED' || s === 'IN_PROGRESS') {
    style = {
      border: "1px solid rgba(99, 102, 241, 0.4)",
      background: "linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 100%), var(--ds-surface)",
      color: "var(--ds-info-text)",
    };
    dot = true;
  } else {
    style = {
      border: "1px solid var(--ds-border)",
      background: "var(--ds-surface)",
      color: "var(--ds-muted)",
    };
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={style}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
      {status}
    </span>
  );
};

const OrderStepper = ({ status }) => {
  const steps = [
    { key: "PENDING", label: "Pendiente" },
    { key: "APPROVED", label: "Aprobado" },
    { key: "IN_PROGRESS", label: "En Tránsito" },
    { key: "COMPLETED", label: "Completado" },
  ];

  const currentIdx = steps.findIndex(s => s.key === status.toUpperCase());

  return (
    <div className="flex items-center justify-between w-full my-4 relative">
      {/* Línea conectora de fondo */}
      <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-[var(--ds-border)] z-0" />
      
      {/* Línea conectora activa */}
      {currentIdx > 0 && (
        <div 
          className="absolute top-[14px] left-0 h-[2px] bg-[var(--ds-accent)] z-0 transition-all duration-300"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
        />
      )}

      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;

        let dotStyle = {
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          fontFamily: "var(--ds-font-mono)",
          fontSize: "0.75rem",
          fontWeight: 600,
          transition: "all 150ms ease-in-out",
        };

        if (isActive) {
          if (step.key === "PENDING") {
            dotStyle = {
              ...dotStyle,
              border: "2px solid rgba(245, 158, 11, 0.6)",
              backgroundColor: "var(--ds-surface)",
              color: "rgba(245, 158, 11, 1)",
              boxShadow: "0 0 8px rgba(245, 158, 11, 0.2)",
            };
          } else if (step.key === "APPROVED" || step.key === "IN_PROGRESS") {
            dotStyle = {
              ...dotStyle,
              border: "2px solid rgba(99, 102, 241, 0.6)",
              backgroundColor: "var(--ds-surface)",
              color: "rgba(99, 102, 241, 1)",
              boxShadow: "0 0 8px rgba(99, 102, 241, 0.2)",
            };
          } else {
            dotStyle = {
              ...dotStyle,
              border: "2px solid rgba(16, 185, 129, 0.6)",
              backgroundColor: "var(--ds-surface)",
              color: "rgba(16, 185, 129, 1)",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.2)",
            };
          }
        } else if (isCompleted) {
          dotStyle = {
            ...dotStyle,
            border: "2px solid var(--ds-accent)",
            backgroundColor: "var(--ds-accent)",
            color: "var(--ds-accent-fg)",
          };
        } else {
          dotStyle = {
            ...dotStyle,
            border: "2px solid var(--ds-border)",
            backgroundColor: "var(--ds-surface)",
            color: "var(--ds-muted)",
          };
        }

        return (
          <div key={step.key} className="flex flex-col items-center gap-1 flex-1 z-10">
            <div style={dotStyle}>
              {isCompleted ? <Check width={14} height={14} /> : idx + 1}
            </div>
            <span 
              className={`text-[0.6875rem] font-medium mt-1 ${isActive ? "text-[var(--ds-text)] font-semibold" : "text-[var(--ds-muted)]"}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function MobileWarehouse() {
  const { token } = useAuth();

  // --- Estado de ubicación seleccionada ---
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

  // --- Filtro por pestaña (Activos, Completados, Cancelados) ---
  const [activeSection, setActiveSection] = useState("active");

  // --- Scanner ---
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  // --- Detalle y confirmación de recepción ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // --- Modal de ETA ---
  const [etaModalOpen, setEtaModalOpen] = useState(false);
  const [etaDays, setEtaDays] = useState(3);
  const [orderToApprove, setOrderToApprove] = useState(null);

  // --- Modal de Cancelación ---
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

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
  const fetchOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();

      // Filtrar únicamente por ubicación del almacén seleccionado
      const filtered = data.filter((o) => {
        const destId = o.destinationId ?? o.id_destino ?? o.destination?.id_ubicacion ?? o.destination?.id;
        return String(destId) === String(locationId);
      });

      setOrders(filtered);
    } catch (err) {
      setErrorOrders(err.message);
      toast.error("Error al cargar pedidos: " + err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!locationId) {
      fetchLocations();
    } else {
      fetchOrders();
    }
  }, [locationId]); // eslint-disable-line

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

  // ─── Cambios de Estado Generales ─────────────────────────────────────────
  const handleUpdateOrderState = async (orderId, nextStatus, payloadExtra = {}) => {
    setLoadingOrders(true);
    try {
      const payload = { status: nextStatus, ...payloadExtra };
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Error: ${res.statusText}`);
      }

      toast.success(`Pedido #${orderId} actualizado a ${nextStatus}`);
      await fetchOrders();
    } catch (err) {
      toast.error(`Error al actualizar estado: ${err.message}`);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleApproveClick = (order) => {
    setOrderToApprove(order);
    setEtaDays(3);
    setEtaModalOpen(true);
  };

  const handleStartTransit = (order) => {
    const orderId = order.id_orden ?? order.id;
    handleUpdateOrderState(orderId, "IN_PROGRESS");
  };

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
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

    const orderId = pendingOrder?.qr_code ?? pendingOrder?.qr_code;

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

  // ─── Confirmar recepción e ingresos de stock ─────────────────────────────
  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    setConfirming(true);

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

  // ─── Clasificación y Filtrado de Pedidos ─────────────────────────────────
  const activeCount = orders.filter((o) => {
    const status = (o.estado ?? o.status ?? "").toUpperCase();
    return ["PENDING", "APPROVED", "IN_PROGRESS"].includes(status);
  }).length;

  const completedCount = orders.filter((o) => {
    const status = (o.estado ?? o.status ?? "").toUpperCase();
    return status === "COMPLETED";
  }).length;

  const cancelledCount = orders.filter((o) => {
    const status = (o.estado ?? o.status ?? "").toUpperCase();
    return status === "CANCELLED";
  }).length;

  const SECTIONS = [
    { id: "active", label: `Activos (${activeCount})`, icon: Clock },
    { id: "completed", label: `Completados (${completedCount})`, icon: Check },
    { id: "cancelled", label: `Cancelados (${cancelledCount})`, icon: Xmark },
  ];

  const filteredOrders = orders.filter((o) => {
    const status = (o.estado ?? o.status ?? "").toUpperCase();
    if (activeSection === "active") {
      return ["PENDING", "APPROVED", "IN_PROGRESS"].includes(status);
    } else if (activeSection === "completed") {
      return status === "COMPLETED";
    } else if (activeSection === "cancelled") {
      return status === "CANCELLED";
    }
    return false;
  });

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
    <Box bg="var(--ds-bg)" style={{ minHeight: "100vh" }}>
      <Container size="sm" p="md">
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <div>
            <h2 className="text-[1.25rem] font-semibold text-[var(--ds-text)] font-inter tracking-tight">
              Tareas de Almacén
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

        {/* Selector de Pestañas SectionNav */}
        <SectionNav
          sections={SECTIONS}
          activeTab={activeSection}
          onChange={setActiveSection}
          ariaLabel="Filtrar pedidos de almacén móvil"
        />

        {/* Contenido */}
        {loadingOrders && orders.length === 0 ? (
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
        ) : filteredOrders.length === 0 ? (
          <Stack align="center" mt="xl" py="xl">
            <Check
              width={48}
              height={48}
              style={{ color: "var(--ds-success-text, #15803D)" }}
            />
            <Text fw={500} size="lg" style={{ color: "var(--ds-text)" }}>
              {activeSection === "active" ? "Todo al día" : "Sin registros"}
            </Text>
            <Text c="dimmed">
              {activeSection === "active" 
                ? "No tienes pedidos pendientes de gestionar." 
                : "No se encontraron pedidos en esta categoría."}
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {filteredOrders.map((order) => {
              const orderId = order.id_orden ?? order.id;
              const estado = (order.estado ?? order.status ?? "").toUpperCase();
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
                  {/* ID de Pedido y Badge */}
                  <Group justify="space-between" mb="xs">
                    <Text
                      fw={700}
                      ff="mono"
                      size="lg"
                      style={{ color: "var(--ds-text)" }}
                    >
                      #{orderId}
                    </Text>
                    <BadgeStatus status={estado} />
                  </Group>

                  {/* Nombre de Artículo y Cantidad */}
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

                  {/* Línea de tiempo visual (Stepper) */}
                  {estado !== "CANCELLED" ? (
                    <OrderStepper status={estado} />
                  ) : (
                    <Alert
                      color="red"
                      title="Pedido Cancelado"
                      icon={<TriangleExclamation width={16} height={16} />}
                      mb="sm"
                      styles={{
                        root: {
                          border: "1px solid rgba(244, 63, 94, 0.4)",
                          background: "linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 100%), var(--ds-surface)",
                          padding: "8px 12px",
                        },
                        title: { color: "var(--ds-danger-text)", fontSize: "0.8125rem", fontWeight: 600 },
                        message: { color: "var(--ds-danger-text)", fontSize: "0.75rem" }
                      }}
                    >
                      Este reabastecimiento ha sido cancelado.
                    </Alert>
                  )}

                  {/* Botones de acción adaptativos según estado */}
                  {estado === "PENDING" && (
                    <Group gap="sm" grow mt="md">
                      <Button
                        variant="light"
                        color="red"
                        leftSection={<Xmark width={16} height={16} />}
                        onClick={() => handleCancelClick(order)}
                        styles={{
                          root: {
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            background: "transparent",
                            color: "var(--ds-danger-text)",
                            height: "38px",
                            "&:hover": {
                              background: "rgba(244, 63, 94, 0.08)",
                            }
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        style={{
                          border: "1px solid rgba(245, 158, 11, 0.5)",
                          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%), var(--ds-surface)",
                          color: "rgba(245, 158, 11, 1)",
                          boxShadow: "0 0 0 1px rgba(245, 158, 11, 0.08), 0 2px 8px rgba(245, 158, 11, 0.15)",
                          height: "38px",
                        }}
                        onClick={() => handleApproveClick(order)}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 100%), var(--ds-surface)";
                          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(245, 158, 11, 0.15), 0 4px 16px rgba(245, 158, 11, 0.25)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%), var(--ds-surface)";
                          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(245, 158, 11, 0.08), 0 2px 8px rgba(245, 158, 11, 0.15)";
                        }}
                      >
                        Aprobar
                      </Button>
                    </Group>
                  )}

                  {estado === "APPROVED" && (
                    <Group gap="sm" grow mt="md">
                      <Button
                        variant="light"
                        color="red"
                        leftSection={<Xmark width={16} height={16} />}
                        onClick={() => handleCancelClick(order)}
                        styles={{
                          root: {
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            background: "transparent",
                            color: "var(--ds-danger-text)",
                            height: "38px",
                            "&:hover": {
                              background: "rgba(244, 63, 94, 0.08)",
                            }
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        style={{
                          border: "1px solid rgba(99, 102, 241, 0.5)",
                          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.04) 100%), var(--ds-surface)",
                          color: "rgba(99, 102, 241, 1)",
                          boxShadow: "0 0 0 1px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(99, 102, 241, 0.15)",
                          height: "38px",
                        }}
                        onClick={() => handleStartTransit(order)}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.08) 100%), var(--ds-surface)";
                          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(99, 102, 241, 0.25)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.04) 100%), var(--ds-surface)";
                          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(99, 102, 241, 0.15)";
                        }}
                      >
                        Iniciar Tránsito
                      </Button>
                    </Group>
                  )}

                  {estado === "IN_PROGRESS" && (
                    <Group gap="sm" grow mt="md">
                      <Button
                        variant="light"
                        color="red"
                        leftSection={<Xmark width={16} height={16} />}
                        onClick={() => handleCancelClick(order)}
                        styles={{
                          root: {
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            background: "transparent",
                            color: "var(--ds-danger-text)",
                            height: "38px",
                            "&:hover": {
                              background: "rgba(244, 63, 94, 0.08)",
                            }
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        style={{
                          backgroundColor: "var(--ds-accent)",
                          color: "var(--ds-accent-fg)",
                          height: "38px",
                        }}
                        leftSection={<Camera width={18} height={18} />}
                        onClick={() => openOrderScanner(order)}
                      >
                        Recibir Pedido
                      </Button>
                    </Group>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* ── Modal de ETA (Aprobación) ─────────────────────────────────── */}
      <Modal
        opened={etaModalOpen}
        onClose={() => setEtaModalOpen(false)}
        title={
          <Text fw={600} style={{ color: "var(--ds-text)" }}>
            Aprobar Pedido #{orderToApprove?.id_orden ?? orderToApprove?.id}
          </Text>
        }
        size="sm"
        centered
        styles={{
          content: { backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" },
          header: { backgroundColor: "var(--ds-surface)" },
        }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Ingresa el tiempo estimado de llegada (ETA) en días para este pedido:
          </Text>
          <NumberInput
            label="ETA (Días)"
            min={1}
            max={30}
            value={etaDays}
            onChange={(val) => setEtaDays(Number(val) || 3)}
            required
            styles={{
              label: { color: "var(--ds-muted)", fontSize: "0.75rem", fontWeight: 500, marginBottom: "4px" },
              input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)", color: "var(--ds-text)" }
            }}
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setEtaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              style={{
                backgroundColor: "var(--ds-accent)",
                color: "var(--ds-accent-fg)",
              }}
              onClick={async () => {
                const orderId = orderToApprove?.id_orden ?? orderToApprove?.id;
                setEtaModalOpen(false);
                await handleUpdateOrderState(orderId, "APPROVED", { etaDays });
              }}
            >
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal de Cancelación (Confirmación) ─────────────────────────── */}
      <Modal
        opened={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={
          <Text fw={600} style={{ color: "var(--ds-text)" }}>
            Cancelar Pedido #{orderToCancel?.id_orden ?? orderToCancel?.id}
          </Text>
        }
        size="sm"
        centered
        styles={{
          content: { backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" },
          header: { backgroundColor: "var(--ds-surface)" },
        }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            ¿Estás seguro de que deseas cancelar este pedido de reabastecimiento? Esta acción es definitiva y no se puede deshacer.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setCancelModalOpen(false)}
            >
              No, conservar
            </Button>
            <Button
              color="red"
              styles={{
                root: {
                  backgroundColor: "var(--ds-danger-bg, #FEF2F2)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  color: "var(--ds-danger-text, #B91C1C)",
                  "&:hover": {
                    backgroundColor: "rgba(244, 63, 94, 0.12)",
                  }
                }
              }}
              onClick={async () => {
                const orderId = orderToCancel?.id_orden ?? orderToCancel?.id;
                setCancelModalOpen(false);
                await handleUpdateOrderState(orderId, "CANCELLED");
              }}
            >
              Sí, cancelar pedido
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Scanner Drawer/Modal ───────────────────────────────────────── */}
      <Modal
        opened={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title={
          <Text fw={600} style={{ color: "var(--ds-text)" }}>
            Escanear Pedido #{pendingOrder?.id_orden ?? pendingOrder?.id}
          </Text>
        }
        size="md"
        styles={{
          content: { backgroundColor: "var(--ds-surface)" },
          header: { backgroundColor: "var(--ds-surface)" },
        }}
      >
        <div className="flex flex-col gap-4">
          <div
            className="w-full h-[280px] rounded-lg overflow-hidden relative border border-[var(--ds-border)] bg-[var(--ds-bg)]"
          >
            {scannerOpen && (
              <QrScanner
                onScan={(text) => processScannedCode(text)}
                onError={() => toast.error("Error al acceder a la cámara. Verifica los permisos del navegador.")}
                width="100%"
                height="100%"
              />
            )}
          </div>

          <Text c="dimmed" size="sm" ta="center">
            O ingresa el código manualmente:
          </Text>

          <div className="flex gap-2">
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
          </div>
        </div>
      </Modal>

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
                <BadgeStatus status={selectedOrder.estado ?? selectedOrder.status} />
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
                {console.log(selectedOrder)}
                <Group justify="space-between" mb={4}>
                  <Text size="sm" style={{ color: "var(--ds-text)" }}>
                    {selectedOrder?.article?.nombre}
                  </Text>
                  <Text
                    size="sm"
                    fw={600}
                    ff="mono"
                    style={{ color: "var(--ds-text)" }}
                  >
                    ×{selectedOrder.cantidad}
                  </Text>
                </Group>

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
