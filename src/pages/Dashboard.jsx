import { useState, useEffect } from "react";
import { Box, Container, Title, Card, Text, Group, Badge, Button, Loader, Alert, Stack, Grid } from "@mantine/core";
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
  const { token } = useAuth();

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
    fetchData();
  }, []);

  /* ── Acción "Pedir" ────────────────────────────────────────────────── */
  const [pedirLoading, setPedirLoading] = useState({});

  const handlePedir = async (alerta) => {
    const articleId =
      alerta.article?.id ?? alerta.articleId ?? alerta.article_id;
    const articleName =
      alerta.article?.name ?? alerta.articleName ?? `Artículo ${articleId}`;

    setPedirLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      const payload = {
        articleId,
        destinationId:
          alerta.location?.id ?? alerta.locationId ?? alerta.location_id,
        quantity: alerta.deficit ?? alerta.deficitQuantity ?? 1,
        type: "MANUAL",
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message ?? `Error ${res.status} al crear orden`
        );
      }

      toast.success(`✅ Orden creada para "${articleName}"`);
      fetchData(); // Recarga → la alerta pasa de rojo a azul
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPedirLoading((prev) => ({ ...prev, [articleId]: false }));
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
      <Title order={1} mb="xl" style={{ fontWeight: 700 }}>
        Dashboard
      </Title>

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
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ds-border)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--ds-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--ds-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--ds-surface)",
                      borderColor: "var(--ds-border)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "var(--ds-text)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "var(--ds-muted)" }} />
                  <Bar dataKey="entradas" name="Entradas" fill="var(--ds-text)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="salidas" name="Salidas" fill="var(--ds-muted)" radius={[4, 4, 0, 0]} barSize={28} />
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
    </Container>
  );
}
