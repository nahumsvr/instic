import { useState } from "react";
import {
    Box,
    Paper,
    Text,
    Title,
    Button,
    Stack,
    TextInput,
    Badge,
    Group,
    Divider,
    ActionIcon,
    Modal,
    Textarea,
    Avatar,
} from "@mantine/core";
import {
    Bars,
    Person,
    Barcode,
    Magnifier,
    Clock,
    CircleCheck,
    ChevronDown,
    Truck,
    Box as BoxIcon,
    ArrowLeft,
    Xmark,
    Keyboard,
    ListUl,
    Bell,
    Pencil,
    Gear,
    CheckDouble,
    IdBadge
} from "@gravity-ui/icons";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import data from "./datos_almacen.json";

/* ─── Tokens del design system (Heredados del Login) ────────── */
const ds = {
    bg: "var(--ds-bg)",
    surface: "var(--ds-surface)",
    border: "var(--ds-border)",
    text: "var(--ds-text)",
    muted: "var(--ds-muted)",
    subtle: "var(--ds-subtle)",
    accent: "var(--ds-accent)",
    accentHover: "var(--ds-accent-hover)",
    accentFg: "var(--ds-accent-fg)",
    dangerBg: "var(--ds-danger-bg)",
    dangerBorder: "var(--ds-danger-border)",
    dangerText: "var(--ds-danger-text)",
    // Colores extra para el almacén
    successBg: "rgba(43, 122, 51, 0.1)",
    successText: "#2B7A33",
    success: "#2B7A33",
};

export default function VistaAlmacen() {
    const navigate = useNavigate();

    const [currentView, setCurrentView] = useState("list");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [manualId, setManualId] = useState("");

    const [stats, setStats] = useState(data.stats);
    const pedidoInicial = data.pedidos.find((p) => p.isActive) || data.pedidos[0];
    const pedidosSecundarios = data.pedidos.filter((p) => !p.isActive);

    const [mainOrder, setMainOrder] = useState(pedidoInicial);
    const [otherOrders, setOtherOrders] = useState(pedidosSecundarios);

    const handleManualSearch = () => {
        if (!manualId.trim()) {
            toast.error("Ingresa un ID válido");
            return;
        }
        setIsScannerOpen(false);
        toast.success(`Pedido ${manualId} encontrado`);
        setTimeout(() => {
            setCurrentView("detail");
            window.scrollTo(0, 0);
        }, 300);
    };

    const confirmarEntrega = (e) => {
        if (e) e.stopPropagation();

        setMainOrder((prev) => ({ ...prev, status: "Entregado" }));
        setStats((prev) => ({
            ...prev,
            completados: prev.completados + 1,
            pendientes: Math.max(0, prev.pendientes - 1),
        }));

        toast.success("Entrega confirmada exitosamente");

        setTimeout(() => {
            setCurrentView("list");
            window.scrollTo(0, 0);
        }, 800);
    };

    if (currentView === "list") {
        return (
            <Box style={{ background: ds.bg, minHeight: "100vh", paddingBottom: 80, fontFamily: "Inter, sans-serif" }}>
                <Paper style={{ background: ds.surface, borderBottom: `1px solid ${ds.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, borderRadius: 0 }}>
                    <ActionIcon variant="subtle" color="gray"><Bars width={20} /></ActionIcon>
                    <Title order={3} style={{ color: ds.text, fontSize: "1.1rem", fontWeight: 600 }}>Vista Almacén</Title>
                    <ActionIcon variant="subtle" color="gray"><Person width={20} /></ActionIcon>
                </Paper>

                <Stack p={20} gap={24}>
                    <Paper withBorder p={20} radius="md" style={{ background: ds.surface, borderColor: ds.border }}>
                        <Text size="xs" fw={700} color={ds.muted} mb={16} style={{ letterSpacing: 0.5 }}>ACCIÓN RÁPIDA</Text>
                        <Button fullWidth style={{ background: ds.accent, color: ds.accentFg, height: 90, flexDirection: "column", gap: 8, borderRadius: 8 }} onClick={() => setIsScannerOpen(true)}>
                            <Barcode width={32} height={32} />
                            <Text fw={600} size="md">[Recibir Pedido]</Text>
                        </Button>

                        <TextInput mt={16} placeholder="Ingreso manual de ID" value={manualId} onChange={(e) => setManualId(e.currentTarget.value)} leftSection={<Magnifier width={16} style={{ color: ds.subtle }} />} rightSection={<Button size="xs" variant="subtle" onClick={handleManualSearch}>Ir</Button>} styles={{ input: { background: ds.bg, borderColor: ds.border, color: ds.text, fontFamily: "Inter, sans-serif" } }} />
                    </Paper>

                    <Box>
                        <Group justify="space-between" mb={16}>
                            <Title order={2} style={{ fontSize: "1.25rem", color: ds.text, fontWeight: 700 }}>Pendientes</Title>
                            <Badge style={{ background: "rgba(10, 116, 218, 0.1)", color: ds.accent, fontWeight: 600 }}>{stats.pendientes} pedidos</Badge>
                        </Group>

                        <Stack gap={16}>
                            <Paper withBorder p={16} radius="md" style={{ background: ds.surface, borderColor: ds.border, borderLeft: `4px solid ${mainOrder.status === "Entregado" ? ds.success : ds.accent}`, cursor: "pointer" }} onClick={(e) => { if (!e.target.closest("button")) setCurrentView("detail"); }}>
                                <Group justify="space-between" align="flex-start" mb={16}>
                                    <Box>
                                        <Text size="xs" fw={600} color={ds.muted} style={{ letterSpacing: 0.5 }}>PEDIDO ID</Text>
                                        <Text size="xl" fw={700} color={ds.text}>{mainOrder.id}</Text>
                                    </Box>
                                    <Box style={{ textAlign: "right" }}>
                                        <Text size="xs" fw={600} color={ds.muted} style={{ letterSpacing: 0.5 }}>ESTADO</Text>
                                        <Group gap={4} align="center">
                                            {mainOrder.status === "Entregado" ? (
                                                <>
                                                    <CircleCheck width={14} color={ds.success} />
                                                    <Text size="sm" fw={600} style={{ color: ds.success }}>Entregado</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock width={14} color={ds.accent} />
                                                    <Text size="sm" fw={600} style={{ color: ds.accent }}>En Espera</Text>
                                                </>
                                            )}
                                        </Group>
                                    </Box>
                                </Group>

                                <Group gap={32} p={12} style={{ background: ds.bg, borderRadius: 6 }} mb={mainOrder.status !== "Entregado" ? 16 : 0}>
                                    <Box><Text size="xs" fw={600} color={ds.text}>Origen</Text><Text size="sm" color={ds.muted}>{mainOrder.origen}</Text></Box>
                                    <Box><Text size="xs" fw={600} color={ds.text}>Items</Text><Text size="sm" color={ds.muted}>{mainOrder.items}</Text></Box>
                                </Group>

                                {mainOrder.status !== "Entregado" && (
                                    <Button fullWidth style={{ background: ds.success, color: "#fff", height: 44, fontWeight: 600 }} onClick={confirmarEntrega} leftSection={<CircleCheck width={18} />}>
                                        [CONFIRMAR ENTREGA]
                                    </Button>
                                )}
                            </Paper>

                            {otherOrders.map((order, idx) => (
                                <Paper key={idx} withBorder p={16} radius="md" style={{ background: ds.surface, borderColor: ds.border }}>
                                    <Group justify="space-between" mb={12}>
                                        <Text fw={600} color={ds.text}>{order.id}</Text>
                                        <ChevronDown width={18} color={ds.subtle} />
                                    </Group>
                                    <Stack gap={8}>
                                        <Group gap={8}><Truck width={16} color={ds.subtle} /><Text size="sm" color={ds.muted}>{order.origen}</Text></Group>
                                        <Group gap={8}><BoxIcon width={16} color={ds.subtle} /><Text size="sm" color={ds.muted}>{order.items}</Text></Group>
                                    </Stack>
                                    <Divider my={12} color={ds.border} />
                                    <Group justify="space-between"><Text size="xs" fw={600} color={ds.text}>{order.time}</Text><Text size="xs" fw={600} color={ds.muted}>{order.status}</Text></Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>

                    <Group grow gap={12}>
                        <Paper p={20} radius="md" style={{ background: "#C06100", color: "#fff", textAlign: "center" }}><Title order={1} style={{ fontSize: "2rem", lineHeight: 1 }}>{stats.eficiencia}%</Title><Text size="xs" fw={500} mt={4}>Eficiencia Hoy</Text></Paper>
                        <Paper p={20} radius="md" style={{ background: "#DFE5ED", color: "#374151", textAlign: "center" }}><Title order={1} style={{ fontSize: "2rem", lineHeight: 1 }}>{stats.completados}</Title><Text size="xs" fw={500} mt={4}>Completados</Text></Paper>
                    </Group>
                </Stack>

                <Paper style={{ position: "fixed", bottom: 0, left: 0, right: 0, borderTop: `1px solid ${ds.border}`, background: ds.surface, display: "flex", justifyContent: "space-around", padding: "10px 0", zIndex: 10 }}>
                    <Stack align="center" gap={4} style={{ color: ds.text, background: "var(--ds-border, #E4E9F1)", padding: "6px 16px", borderRadius: 8 }}><ListUl width={20} /><Text size="xs" fw={600}>Tareas</Text></Stack>
                    <Stack align="center" gap={4} style={{ color: ds.muted }}><Bell width={20} /><Text size="xs" fw={500}>Avisos</Text></Stack>
                    <Stack align="center" gap={4} style={{ color: ds.muted }}><Pencil width={20} /><Text size="xs" fw={500}>Inventario</Text></Stack>
                    <Stack align="center" gap={4} style={{ color: ds.muted }}><Gear width={20} /><Text size="xs" fw={500}>Ajustes</Text></Stack>
                </Paper>

                <Modal opened={isScannerOpen} onClose={() => setIsScannerOpen(false)} fullScreen withCloseButton={false} styles={{ content: { background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column" }, body: { flex: 1, display: "flex", flexDirection: "column", padding: 0 } }}>
                    <Box p={20} pt={40} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><ActionIcon onClick={() => setIsScannerOpen(false)} variant="transparent" color="white"><Xmark width={24} /></ActionIcon><Text color="white" fw={600}>Escaneando...</Text><Box w={24} /></Box>
                    <Box style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}><Box style={{ width: 250, height: 250, border: "2px solid rgba(255,255,255,0.3)", position: "relative" }}><Box style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: ds.success, boxShadow: `0 0 10px ${ds.success}` }} /></Box></Box>
                    <Stack p={20} pb={40} gap={20} align="center"><Text color="white" size="sm">Apunta la cámara al código QR/Barras</Text><Paper style={{ background: "white", padding: 8, borderRadius: 8, display: "flex", width: "100%" }}><TextInput placeholder="Ingreso manual" variant="unstyled" style={{ flex: 1, paddingLeft: 8 }} value={manualId} onChange={(e) => setManualId(e.currentTarget.value)} leftSection={<Keyboard width={16} />} /><Button style={{ background: ds.accent, color: ds.accentFg }} onClick={handleManualSearch}>Buscar</Button></Paper></Stack>
                </Modal>
            </Box>
        );
    }

    return (
        <Box style={{ background: ds.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "Inter, sans-serif" }}>
            <Paper style={{ background: ds.surface, borderBottom: `1px solid ${ds.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, borderRadius: 0 }}>
                <ActionIcon variant="subtle" color="gray" onClick={() => setCurrentView("list")}><ArrowLeft width={20} /></ActionIcon>
                <Title order={3} style={{ color: ds.accent, fontSize: "1.1rem", fontWeight: 600 }}>Instic Showcase</Title>
                <ActionIcon variant="subtle" color="gray"><Person width={20} /></ActionIcon>
            </Paper>

            <Stack p={20} gap={24}>
                <Paper withBorder p={20} radius="md" style={{ background: ds.surface, borderColor: ds.border }}>
                    <Group justify="space-between" align="flex-start" mb={24}>
                        <Box><Text size="xs" fw={600} color={ds.muted} style={{ letterSpacing: 0.5 }}>ORDEN ID</Text><Text style={{ fontSize: "1.75rem", fontWeight: 700, color: ds.accent, lineHeight: 1.1, marginTop: 4 }}>{mainOrder.fullId}</Text></Box>
                        <Badge size="lg" style={{ background: mainOrder.status === "Entregado" ? ds.success : ds.successBg, color: mainOrder.status === "Entregado" ? "white" : ds.successText, height: "auto", padding: "8px 12px", textTransform: "none" }}><Stack gap={0} align="flex-start"><Text size="xs" fw={500}>Estado:</Text><Text size="sm" fw={700}>{mainOrder.status === "Entregado" ? "Entregado" : "Pendiente"}</Text></Stack></Badge>
                    </Group>
                    <Group p={16} style={{ background: ds.bg, borderLeft: `3px solid ${ds.accent}`, borderRadius: 6 }} gap={16}><BoxIcon width={32} height={32} color={ds.accent} /><Box><Text size="xs" fw={600} color={ds.muted}>Total Unidades</Text><Text size="lg" fw={700} color={ds.text}>{mainOrder.totalUnidades}</Text></Box></Group>
                </Paper>

                <Paper withBorder radius="md" style={{ background: ds.surface, borderColor: ds.border, overflow: "hidden" }}>
                    <Box p="12px 16px" style={{ background: "var(--ds-border, #F1F5F9)", borderBottom: `1px solid ${ds.border}` }}><Text size="xs" fw={700} color={ds.muted} style={{ letterSpacing: 0.5 }}>DETALLES DEL CARGAMENTO</Text></Box>
                    {mainOrder.products.map((prod, idx) => (
                        <Box key={idx}>
                            <Group justify="space-between" p={16}><Box><Text size="xs" fw={600} color={ds.muted}>Producto</Text><Text size="sm" fw={600} color={ds.text}>{prod.name}</Text></Box><Text size="xl" fw={700} color={ds.accent}>{prod.qty}</Text></Group>
                            {idx < mainOrder.products.length - 1 && <Divider color={ds.border} />}
                        </Box>
                    ))}
                </Paper>

                <Box><Text size="sm" fw={600} color={ds.muted} mb={8}>Observaciones de Entrega</Text><Textarea placeholder="Añadir comentarios sobre el estado del stock..." minRows={3} styles={{ input: { background: ds.surface, borderColor: ds.border, color: ds.text } }} /></Box>
                <Group p={16} radius="md" style={{ background: "var(--ds-bg, #F8FAFC)", border: `1px solid ${ds.border}` }}><Avatar radius="md" color="gray"><IdBadge /></Avatar><Box><Text size="xs" fw={600} color={ds.muted}>Responsable</Text><Text size="sm" fw={600} color={ds.text}>{mainOrder.responsable}</Text></Box></Group>
            </Stack>

            <Box style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 20, background: ds.bg, zIndex: 10, borderTop: `1px solid ${ds.border}` }}>
                <Button fullWidth size="xl" style={{ background: mainOrder.status === "Entregado" ? ds.muted : ds.success, color: "white", height: 60, borderRadius: 8 }} disabled={mainOrder.status === "Entregado"} onClick={confirmarEntrega} leftSection={mainOrder.status === "Entregado" ? <CheckDouble width={24} /> : <CircleCheck width={24} />}><Text fw={600} size="md">{mainOrder.status === "Entregado" ? "[Entrega Confirmada]" : "[Confirmar Entrega]"}</Text></Button>
            </Box>
        </Box>
    );
}
