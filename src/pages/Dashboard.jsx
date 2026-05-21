import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { Box, Container, Title, Card, Text, Group, Badge, Button, Loader, Alert, Stack, Grid, Modal, NumberInput, Select } from "@mantine/core";
import { CircleDollar, ShoppingCart, Boxes3, CircleInfo } from '@gravity-ui/icons';
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API_URL = await import.meta.env.VITE_API_BASE_URL;
console.log(API_URL);

/** Estados activos de una orden que "pausa" visualmente una alerta roja → borde azul */
const ACTIVE_ORDER_STATUSES = ["PENDING", "APPROVED", "IN_PROGRESS"];

export default function Dashboard() {
  const { token, user } = useAuth();

  const [data, setData] = useState({
    articles: [],
    orders: [],
    alerts: [],
    movements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── Carga de datos ────────────────────────────────────────────────── */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resArticles, resOrders, resAlerts, resMovements] = await Promise.all([
        fetch(`${API_URL}/articles`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
        fetch(`${API_URL}/alerts`, { headers }),
        fetch(`${API_URL}/movements`, { headers }),
      ]);

      if (!resArticles.ok) throw new Error(`Error ${resArticles.status} en /articles`);
      if (!resOrders.ok) throw new Error(`Error ${resOrders.status} en /orders`);
      if (!resAlerts.ok) throw new Error(`Error ${resAlerts.status} en /alerts`);
      if (!resMovements.ok) throw new Error(`Error ${resMovements.status} en /movements`);

      const [articles, orders, alerts, movements] = await Promise.all([
        resArticles.json(),
        resOrders.json(),
        resAlerts.json(),
        resMovements.json(),
      ]);

      setData({ articles, orders, alerts, movements });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userRole = (user?.rol ?? user?.role ?? "").toUpperCase();
    const isEmployee = userRole === "EMPLOYEE" || userRole === "EMPLEADO";
    if (isEmployee) return;

    fetchData();
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Acción "Pedir" (inteligente) ───────────────────────────────────── */
  const [pedirLoading, setPedirLoading] = useState({});

  // Modal inteligente: null | { alerta, locationsWithStock, mode: 'order'|'input' }
  const [smartModal, setSmartModal] = useState(null);
  const [smartForm, setSmartForm] = useState({ originId: '', quantity: 1 });
  const [smartSaving, setSmartSaving] = useState(false);

  const userRole = (user?.rol ?? user?.role ?? "").toUpperCase();
  const isEmployee = userRole === "EMPLOYEE" || userRole === "EMPLEADO";
  if (isEmployee) {
    return <Navigate to="/mobile-warehouse" replace />;
  }

  /**
   * Consulta el inventario del artículo y decide si crear una Orden
   * (hay stock en otra ubicación) o registrar una Entrada directa.
   */
  const handlePedir = async (alerta) => {
    const articleId = alerta.article?.id;
    const destinationId = alerta.location?.id;

    setPedirLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      const res = await fetch(`${API_URL}/inventory?articleId=${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status} al consultar inventario`);
      }

      const inventoryData = await res.json();

      // Ubicaciones con stock disponible distintas al destino de la alerta
      const locationsWithStock = (inventoryData.locations ?? []).filter(
        (loc) => loc.stockActual > 0 && loc.location?.id !== destinationId
      );

      const mode = locationsWithStock.length > 0 ? 'order' : 'input';
      setSmartForm({ originId: '', quantity: alerta.deficit ?? 1 });
      setSmartModal({ alerta, locationsWithStock, mode });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPedirLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const handleCloseSmartModal = () => {
    setSmartModal(null);
    setSmartForm({ originId: '', quantity: 1 });
  };

  /** Crear Orden de Reabastecimiento (hay stock en otro lugar) */
  const handleConfirmOrder = async () => {
    if (!smartModal) return;
    const { alerta } = smartModal;
    const articleId = alerta.article?.id;
    const destinationId = alerta.location?.id;

    if (!smartForm.originId) {
      toast.error('Selecciona la ubicación de origen');
      return;
    }

    setSmartSaving(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          articleId,
          originId: Number(smartForm.originId),
          destinationId,
          quantity: Number(smartForm.quantity),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status} al crear orden`);
      }
      toast.success(`✅ Orden creada para "${alerta.article?.name}"`);
      handleCloseSmartModal();
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSmartSaving(false);
    }
  };

  /** Registrar Entrada desde proveedor externo (no hay stock en otra ubicación) */
  const handleConfirmInput = async () => {
    if (!smartModal) return;
    const { alerta } = smartModal;
    const articleId = alerta.article?.id;
    const destinationId = alerta.location?.id;

    setSmartSaving(true);
    try {
      const res = await fetch(`${API_URL}/movements/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          articleId,
          destinationId,
          quantity: Number(smartForm.quantity),
          status: 'COMPLETED',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status} al registrar entrada`);
      }
      toast.success(`✅ Entrada registrada para "${alerta.article?.name}"`);
      handleCloseSmartModal();
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSmartSaving(false);
    }
  };

  /* ── Estados de carga / error ──────────────────────────────────────── */
  if (loading) {
    return (
      <Container
        size="xl"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}
      >
        <Loader color="var(--ds-accent)" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="2xl">
        <Alert
          color="red"
          title="Error de conexión"
          icon={<CircleInfo width={16} height={16} />}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  /* ── Cálculo de KPIs ───────────────────────────────────────────────── */
  const totalStock = data.articles.reduce((acc, a) => acc + (Number(a.stock) || 0), 0);

  const valorInventario = data.articles.reduce(
    (acc, a) => acc + (Number(a.stock) || 0) * (Number(a.costo_unitario) || 0),
    0
  );

  const ordenesPendientes = data.orders.filter((o) =>
    ACTIVE_ORDER_STATUSES.includes(o.status ?? o.estado)
  ).length;

  /* ── Procesamiento del gráfico (últimos 7 días) ────────────────────── */
  const chartDataMap = {};
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    chartDataMap[key] = { name: key, entradas: 0, salidas: 0 };
  }

  data.movements.forEach((m) => {
    if (!m.fecha_movimiento) return;
    const mDate = new Date(m.fecha_movimiento).toISOString().split("T")[0];
    if (chartDataMap[mDate]) {
      if (m.tipo === "INPUT") chartDataMap[mDate].entradas += 1;
      if (m.tipo === "OUTPUT") chartDataMap[mDate].salidas += 1;
    }
  });

  const chartData = Object.values(chartDataMap).map((item) => {
    const dateObj = new Date(`${item.name}T12:00:00Z`);
    const dayName = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(dateObj);
    return { ...item, name: dayName };
  });

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <Container size="xl" py="2xl">
      <h1 className="text-[2rem] font-bold text-[var(--ds-text)] mb-6 font-inter tracking-tight">
        Dashboard
      </h1>

      <div className="flex flex-col gap-4">
        {/* ── KPI Cards ── */}
        <Grid mb="3xl">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)" }}
            >
              <Group justify="space-between" mb="xs">
                <Text c="var(--ds-muted)" size="sm" fw={500}>
                  Total Stock
                </Text>
                <Boxes3 width={20} height={20} style={{ color: "var(--ds-muted)" }} />
              </Group>
              <Text fw={700} style={{ color: "var(--ds-text)", fontSize: "2rem" }}>
                {totalStock.toLocaleString()}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)" }}
            >
              <Group justify="space-between" mb="xs">
                <Text c="var(--ds-muted)" size="sm" fw={500}>
                  Valor Inventario (MXN)
                </Text>
                <CircleDollar width={20} height={20} style={{ color: "var(--ds-muted)" }} />
              </Group>
              <Text fw={700} style={{ color: "var(--ds-text)", fontSize: "2rem" }}>
                ${valorInventario.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)" }}
            >
              <Group justify="space-between" mb="xs">
                <Text c="var(--ds-muted)" size="sm" fw={500}>
                  Órdenes Pendientes
                </Text>
                <ShoppingCart width={20} height={20} style={{ color: "var(--ds-muted)" }} />
              </Group>
              <Text fw={700} style={{ color: "var(--ds-text)", fontSize: "2rem" }}>
                {ordenesPendientes}
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* ── Gráfico + Alertas ── */}
        <Grid>
          {/* Gráfico de Movimientos */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)", height: "100%" }}
            >
              <Title order={3} size="h4" mb="xl" style={{ color: "var(--ds-text)" }}>
                Entradas vs Salidas (Últimos 7 días)
              </Title>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="entradasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ds-chart-entradas)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--ds-chart-entradas)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="salidasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ds-chart-salidas)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--ds-chart-salidas)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ds-border)" />
                    <XAxis
                      dataKey="name"
                      stroke="var(--ds-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="var(--ds-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      dx={-8}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--ds-surface)",
                        borderColor: "var(--ds-border)",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        fontFamily: "var(--font-sans, Inter, sans-serif)",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{
                        fontWeight: 600,
                        color: "var(--ds-text)",
                        marginBottom: "4px",
                      }}
                      itemStyle={{
                        padding: "2px 0",
                      }}
                      cursor={{ fill: "var(--ds-border)", opacity: 0.15 }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        color: "var(--ds-muted)",
                        paddingTop: "12px"
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="entradas"
                      name="Entradas"
                      fill="url(#entradasGrad)"
                      stroke="var(--ds-chart-entradas)"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                    />
                    <Bar
                      dataKey="salidas"
                      name="Salidas"
                      fill="url(#salidasGrad)"
                      stroke="var(--ds-chart-salidas)"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Grid.Col>

          {/* Lista de Alertas */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-surface)",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Title order={3} size="h4" mb="md" style={{ color: "var(--ds-text)" }}>
                Alertas Recientes
              </Title>

              {/* Usamos Box de Mantine como contenedor scrolleable */}
              <Box style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                <Stack gap="sm">
                  {data.alerts.length === 0 ? (
                    <Text c="var(--ds-muted)" size="sm" ta="center" py="xl">
                      No hay alertas activas
                    </Text>
                  ) : (
                    data.alerts.map((alerta) => {
                      const articleId =
                        alerta.article?.id ??
                        alerta.articleId ??
                        alerta.article_id;

                      // Cruzar con órdenes activas para determinar si ya está "en camino"
                      const hasActiveOrder = data.orders.some(
                        (o) => {
                          const ordArticleId =
                            o.article?.id ??
                            o.articleId ??
                            o.article_id;
                          return (
                            ordArticleId === articleId &&
                            ACTIVE_ORDER_STATUSES.includes(o.status ?? o.estado)
                          );
                        }
                      );

                      // Determinar variante visual de la alerta
                      let borderColor = "var(--ds-border)";
                      let isBlue = false;
                      let isRed = false;
                      let isYellow = false;

                      // Normalizar nombres de campo que el backend puede devolver en inglés o español
                      const stockActual =
                        alerta.stockActual ??
                        alerta.currentStock ??
                        alerta.stock ??
                        0;
                      const severidad =
                        alerta.severidad ??
                        alerta.severity ??
                        "";

                      const esCritico =
                        stockActual === 0 || severidad === "CRITICO" || severidad === "CRITICAL";

                      if (esCritico) {
                        if (hasActiveOrder) {
                          isBlue = true;
                          borderColor = "#3B82F6";
                        } else {
                          isRed = true;
                          borderColor = "#EF4444";
                        }
                      } else if (
                        severidad === "ALTO" || severidad === "HIGH" ||
                        severidad === "MEDIO" || severidad === "MEDIUM"
                      ) {
                        isYellow = true;
                        borderColor = "var(--ds-warning-text)";
                      }

                      return (
                        <Card
                          key={alerta.id ?? articleId}
                          withBorder
                          radius="md"
                          p="sm"
                          style={{
                            borderLeft: `4px solid ${borderColor}`,
                            backgroundColor: isYellow
                              ? "var(--ds-warning-bg)"
                              : "var(--ds-bg)",
                            borderColor: isYellow
                              ? "var(--ds-warning-border)"
                              : undefined,
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <div>
                              <Text size="sm" fw={600} style={{ color: "var(--ds-text)" }}>
                                {alerta.article?.name ||
                                  alerta.articleName ||
                                  `Artículo ${articleId}`}
                              </Text>
                              <Text size="xs" c="var(--ds-muted)" mt={2}>
                                Ubicación:{" "}
                                {alerta.location?.name ||
                                  alerta.locationName ||
                                  "General"}
                              </Text>
                              <Text size="xs" c="var(--ds-muted)" mt={2}>
                                Stock actual:{" "}
                                <Text
                                  component="span"
                                  fw={600}
                                  style={{ color: isRed ? "#EF4444" : "var(--ds-text)" }}
                                >
                                  {stockActual}
                                </Text>
                              </Text>
                              {(alerta.deficit ?? alerta.deficitQuantity) != null && (
                                <Text size="xs" c="var(--ds-muted)" mt={2}>
                                  Déficit:{" "}
                                  <Text component="span" fw={600} style={{ color: isRed ? "#EF4444" : "var(--ds-text)" }}>
                                    {alerta.deficit ?? alerta.deficitQuantity}
                                  </Text>
                                </Text>
                              )}
                            </div>

                            {/* Botón Pedir — solo alerta roja (crítico sin orden activa) */}
                            {isRed && (
                              <Button
                                size="xs"
                                variant="filled"
                                loading={!!pedirLoading[articleId]}
                                disabled={!!pedirLoading[articleId]}
                                onClick={() => handlePedir(alerta)}
                                style={{
                                  backgroundColor: "var(--ds-accent)",
                                  color: "var(--ds-accent-fg)",
                                  flexShrink: 0,
                                }}
                              >
                                Pedir
                              </Button>
                            )}

                            {/* Badge "En camino" — alerta azul (orden ya creada) */}
                            {isBlue && (
                              <Badge color="blue" variant="light" size="xs">
                                En camino
                              </Badge>
                            )}

                            {/* Badge "Stock Bajo" — alerta de advertencia */}
                            {isYellow && (
                              <span
                                className="inline-flex items-center shrink-0 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium border"
                                style={{
                                  backgroundColor: "var(--ds-surface)",
                                  color: "var(--ds-warning-text)",
                                  borderColor: "var(--ds-warning-border)",
                                }}
                              >
                                {severidad === "ALTO" || severidad === "HIGH"
                                  ? "Stock Bajo"
                                  : "Stock Medio"}
                              </span>
                            )}
                          </Group>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              </Box>
            </Card>
          </Grid.Col>
        </Grid>
      </div>

      {/* ── Modal inteligente: Orden o Entrada ───────────────────────────── */}
      <Modal
        opened={!!smartModal}
        onClose={handleCloseSmartModal}
        title={
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg" style={{ color: "var(--ds-text)" }}>
              {smartModal?.mode === 'order' ? 'Orden de Reabastecimiento' : 'Entrada desde Proveedor'}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={smartModal?.mode === 'order'
                ? { border: "1px solid rgba(14, 165, 233, 0.4)", background: "linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 100%), var(--ds-surface)", color: "rgba(14, 165, 233, 1)" }
                : { border: "1px solid rgba(16, 185, 129, 0.4)", background: "linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 100%), var(--ds-surface)", color: "var(--ds-success-text)" }
              }
            >
              {smartModal?.mode === 'order' ? 'Transferencia' : 'Compra'}
            </span>
          </div>
        }
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        styles={{
          content: { backgroundColor: "var(--ds-surface)", borderRadius: "10px", border: "1px solid var(--ds-border)", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" },
          header: { backgroundColor: "var(--ds-surface)", borderBottom: "1px solid var(--ds-border)", paddingBottom: "12px" },
          body: { paddingTop: "16px" },
          close: { color: "var(--ds-text)" },
        }}
      >
        {smartModal && (
          <div className="flex flex-col gap-4">

            {/* Info: artículo y destino */}
            <div
              className="rounded-lg p-3 flex flex-col gap-1"
              style={{ background: "var(--ds-bg)", border: "1px solid var(--ds-border)" }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Artículo</span>
                <span className="text-sm font-semibold font-mono" style={{ color: "var(--ds-text)" }}>
                  {smartModal.alerta.article?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Destino</span>
                <span className="text-sm font-medium" style={{ color: "var(--ds-text)" }}>
                  {smartModal.alerta.location?.name ?? 'General'}
                </span>
              </div>
            </div>

            {/* Modo: Orden → selector de origen */}
            {smartModal.mode === 'order' && (
              <Select
                label="Origen (ubicación con stock)"
                placeholder="Selecciona una ubicación"
                required
                data={smartModal.locationsWithStock.map((loc) => ({
                  value: String(loc.location.id),
                  label: `${loc.location.name} — ${loc.stockActual} uds disponibles`,
                }))}
                value={smartForm.originId}
                onChange={(val) => setSmartForm((f) => ({ ...f, originId: val ?? '' }))}
                styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)", color: "var(--ds-text)" } }}
              />
            )}

            {/* Modo: Entrada → aviso informativo */}
            {smartModal.mode === 'input' && (
              <div
                className="rounded-lg p-3 flex items-start gap-2 text-sm"
                style={{ background: "var(--ds-success-bg)", border: "1px solid var(--ds-success-border)", color: "var(--ds-success-text)" }}
              >
                <span className="mt-0.5">●</span>
                <span>No hay stock disponible en otras ubicaciones. Se registrará una <strong>entrada desde proveedor externo</strong> que actualizará el inventario inmediatamente.</span>
              </div>
            )}

            {/* Cantidad */}
            <NumberInput
              label="Cantidad"
              min={1}
              step={1}
              allowDecimal={false}
              value={smartForm.quantity}
              onChange={(val) => setSmartForm((f) => ({ ...f, quantity: val ?? 1 }))}
              styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)", color: "var(--ds-text)" } }}
            />

            {/* Botones */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={handleCloseSmartModal}
                disabled={smartSaving}
                className="px-4 h-[38px] rounded-md text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--ds-border)", background: "transparent", color: "var(--ds-text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={smartModal.mode === 'order' ? handleConfirmOrder : handleConfirmInput}
                disabled={smartSaving || (smartModal.mode === 'order' && !smartForm.originId)}
                className="px-4 h-[38px] rounded-md text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={smartModal.mode === 'order'
                  ? { border: "1px solid rgba(14, 165, 233, 0.5)", background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.04) 100%), var(--ds-surface)", color: "rgba(14, 165, 233, 1)", boxShadow: "0 0 0 1px rgba(14, 165, 233, 0.08), 0 2px 8px rgba(14, 165, 233, 0.15)" }
                  : { border: "1px solid rgba(16, 185, 129, 0.4)", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.04) 100%), var(--ds-surface)", color: "var(--ds-success-text)", boxShadow: "0 0 0 1px rgba(16, 185, 129, 0.08), 0 2px 8px rgba(16, 185, 129, 0.15)" }
                }
              >
                {smartSaving ? <Loader size={14} color={smartModal.mode === 'order' ? 'rgba(14,165,233,1)' : 'var(--ds-success-text)'} /> : null}
                {smartModal.mode === 'order' ? 'Crear Orden' : 'Registrar Entrada'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Container>
  );
}
