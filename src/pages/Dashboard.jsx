import { useState, useEffect } from "react";
import { Container, Title, Card, Text, Group, Badge, Button, Loader, Alert, Stack, Grid } from "@mantine/core";
import {Box, CircleDollar, ShoppingCart} from '@gravity-ui/icons';
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

const API_URL = "http://localhost:3000";

const MovementStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState({
    articles: [],
    orders: [],
    alerts: [],
    movements: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resArticles, resOrders, resAlerts, resMovements] = await Promise.all([
        fetch(`${API_URL}/articles`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
        fetch(`${API_URL}/alerts`, { headers }),
        fetch(`${API_URL}/movements`, { headers })
      ]);

      if (!resArticles.ok) throw new Error(`Error ${resArticles.status} en /articles`);
      if (!resOrders.ok) throw new Error(`Error ${resOrders.status} en /orders`);
      if (!resAlerts.ok) throw new Error(`Error ${resAlerts.status} en /alerts`);
      if (!resMovements.ok) throw new Error(`Error ${resMovements.status} en /movements`);

      const [articles, orders, alerts, movements] = await Promise.all([
        resArticles.json(),
        resOrders.json(),
        resAlerts.json(),
        resMovements.json()
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

  const handlePedir = async (alert) => {
    try {
      // Create manual order
      const payload = {
        articleId: alert.article?.id || alert.articleId,
        destinationId: alert.location?.id || alert.locationId,
        quantity: alert.deficit || 1,
        type: 'MANUAL'
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Error al crear orden: ${res.statusText}`);
      }

      toast.success(`Orden creada para ${alert.article?.name || "artículo"}`);
      fetchData(); // Reload data to update UI
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="3xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader color="var(--ds-accent)" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="3xl">
        <Alert color="red" title="Error de conexión" icon={<CircleInfo width={20} height={20} />}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Calculate KPIs
  const totalStock = data.articles.reduce((acc, a) => acc + (Number(a.stock) || 0), 0);
  const valorInventario = data.articles.reduce((acc, a) => acc + ((Number(a.stock) || 0) * (Number(a.costo_unitario) || 0)), 0);
  const ordenesPendientes = data.orders.filter(o => 
    o.status === MovementStatus.PENDING || 
    o.status === MovementStatus.APPROVED || 
    o.status === MovementStatus.IN_PROGRESS
  ).length;

  // Process chart data (last 7 days, Entradas vs Salidas)
  // Assuming movements have `createdAt` and `type` ('INPUT' or 'OUTPUT')
  const chartDataMap = {};
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    chartDataMap[dateStr] = { name: dateStr, entradas: 0, salidas: 0 };
  }

  data.movements.forEach(m => {
    if (!m.createdAt) return;
    const mDate = new Date(m.createdAt).toISOString().split('T')[0];
    if (chartDataMap[mDate]) {
      if (m.type === 'INPUT') chartDataMap[mDate].entradas += 1;
      if (m.type === 'OUTPUT') chartDataMap[mDate].salidas += 1;
    }
  });

  const chartData = Object.values(chartDataMap).map(item => {
    // Format name to short day, e.g., 'Lun', 'Mar'
    const dateObj = new Date(item.name + 'T12:00:00Z');
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dateObj);
    return { ...item, name: dayName };
  });

  return (
    <Container size="xl" py="2xl">
      <Title order={1} mb="xl" style={{ fontWeight: 700, fontSize: 'var(--mantine-h1-font-size)' }}>
        Dashboard
      </Title>

      {/* KPI Cards */}
      <Grid mb="3xl">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder radius="md" p="lg" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)' }}>
            <Group justify="space-between" mb="xs">
              <Text c="var(--ds-muted)" size="sm" fw={500}>Total Stock</Text>
              <Box width={20} height={20} style={{ color: 'var(--ds-muted)' }} />
            </Group>
            <Text size="xl" fw={700} style={{ color: 'var(--ds-text)', fontSize: '2rem' }}>
              {totalStock.toLocaleString()}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder radius="md" p="lg" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)' }}>
            <Group justify="space-between" mb="xs">
              <Text c="var(--ds-muted)" size="sm" fw={500}>Valor Inventario (MXN)</Text>
              <CircleDollar width={20} height={20} style={{ color: 'var(--ds-muted)' }} />
            </Group>
            <Text size="xl" fw={700} style={{ color: 'var(--ds-text)', fontSize: '2rem' }}>
              ${valorInventario.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder radius="md" p="lg" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)' }}>
            <Group justify="space-between" mb="xs">
              <Text c="var(--ds-muted)" size="sm" fw={500}>Órdenes Pendientes</Text>
              <ShoppingCart width={20} height={20} style={{ color: 'var(--ds-muted)' }} />
            </Group>
            <Text size="xl" fw={700} style={{ color: 'var(--ds-text)', fontSize: '2rem' }}>
              {ordenesPendientes}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        {/* Gráfico de Movimientos */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="lg" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)', height: '100%' }}>
            <Title order={3} size="h4" mb="xl" style={{ color: 'var(--ds-text)' }}>
              Entradas vs Salidas (Últimos 7 días)
            </Title>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ds-border)" />
                  <XAxis dataKey="name" stroke="var(--ds-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ds-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--ds-text)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--ds-muted)' }} />
                  <Bar dataKey="entradas" name="Entradas" fill="var(--ds-text)" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="salidas" name="Salidas" fill="var(--ds-muted)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid.Col>

        {/* Lista de Alertas */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" p="lg" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Title order={3} size="h4" mb="md" style={{ color: 'var(--ds-text)' }}>
              Alertas Recientes
            </Title>
            <Box style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <Stack gap="sm">
                {data.alerts.length === 0 ? (
                  <Text c="var(--ds-muted)" size="sm" ta="center" py="xl">
                    No hay alertas activas
                  </Text>
                ) : (
                  data.alerts.map(alert => {
                    const articleId = alert.article?.id || alert.articleId;
                    
                    // Check if there is an active order for this article
                    const hasActiveOrder = data.orders.some(o => 
                      (o.article?.id === articleId || o.articleId === articleId) &&
                      [MovementStatus.PENDING, MovementStatus.APPROVED, MovementStatus.IN_PROGRESS].includes(o.status)
                    );

                    let borderColor = 'var(--ds-border)';
                    let isBlue = false;
                    let isRed = false;
                    let isYellow = false;

                    if (alert.stockActual === 0 || alert.severidad === 'CRITICO') {
                      if (hasActiveOrder) {
                        isBlue = true;
                        borderColor = '#3B82F6'; // Tailwind blue-500
                      } else {
                        isRed = true;
                        borderColor = '#EF4444'; // Tailwind red-500
                      }
                    } else if (alert.severidad === 'ALTO' || alert.severidad === 'MEDIO') {
                      isYellow = true;
                      borderColor = '#F59E0B'; // Tailwind amber-500
                    }

                    return (
                      <Card 
                        key={alert.id || Math.random()} 
                        withBorder 
                        radius="md" 
                        p="sm" 
                        style={{ 
                          borderLeft: `4px solid ${borderColor}`,
                          backgroundColor: 'var(--ds-bg)'
                        }}
                      >
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <div>
                            <Text size="sm" fw={600} style={{ color: 'var(--ds-text)' }}>
                              {alert.article?.name || `Artículo ${articleId}`}
                            </Text>
                            <Text size="xs" c="var(--ds-muted)" mt={2}>
                              Ubicación: {alert.location?.name || 'General'}
                            </Text>
                            <Text size="xs" c="var(--ds-muted)" mt={2}>
                              Stock Actual: <Text component="span" fw={600} c={isRed ? 'red' : 'inherit'}>{alert.stockActual}</Text>
                            </Text>
                          </div>
                          
                          {isRed && (
                            <Button 
                              size="xs" 
                              variant="filled" 
                              onClick={() => handlePedir(alert)}
                              style={{ backgroundColor: 'var(--ds-accent)', color: 'var(--ds-accent-fg)' }}
                            >
                              Pedir
                            </Button>
                          )}
                          {isBlue && (
                            <Badge color="blue" variant="light" size="xs">
                              En camino
                            </Badge>
                          )}
                          {isYellow && (
                            <Badge color="yellow" variant="light" size="xs">
                              Stock Bajo
                            </Badge>
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
    </Container>
  );
}
