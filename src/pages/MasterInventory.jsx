import { useState, useEffect, useCallback } from "react";
import { Table, TextInput, Select, Button, Loader, Alert, Modal, NumberInput, Group } from "@mantine/core";
import { Magnifier, Plus, Pencil, Boxes3, CircleDollar, CircleInfo } from "@gravity-ui/icons";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { useDebouncedValue } from "@mantine/hooks";

export default function MasterInventory() {
    const { user, token } = useAuth();
    const isEmployee = user?.rol === "EMPLOYEE" || user?.rol === "EMPLOYEE" || (!user?.rol);

    const [data, setData] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const [storeFilter, setStoreFilter] = useState("");

    // Modal form state
    const [opened, setOpened] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        category: "General",
        size: "N/A",
        unitCost: 0,
        unitPrice: 0,
        stockConfigs: [],
    });

    // Inicializa los stockConfigs con todas las ubicaciones cuando se abre el modal de nuevo artículo
    const buildStockConfigs = (locs) =>
        locs.map((loc) => ({ locationId: loc.id_ubicacion, minStock: 0, maxStock: 0 }));

    const updateStockConfig = (locationId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            stockConfigs: prev.stockConfigs.map((sc) =>
                sc.locationId === locationId ? { ...sc, [field]: value } : sc
            ),
        }));
    };

    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al cargar ubicaciones");
            const locs = await res.json();
            setLocations(locs);
        } catch (err) {
            toast.error(err.message);
        }
    }, [token]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams();
            query.append("status", "active");
            if (debouncedSearch) query.append("search", debouncedSearch);
            if (storeFilter) query.append("locationId", storeFilter);

            const res = await fetch(`${API_BASE_URL}/articles?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
            toast.error("Error al cargar el inventario");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, storeFilter, token]);

    useEffect(() => {
        if (token) fetchLocations();
    }, [fetchLocations, token]);

    useEffect(() => {
        if (token) fetchData();
    }, [fetchData, token]);

    const handleNew = () => {
        setEditingId(null);

        // Generar un código aleatorio, ej: ART-8492
        const randomCode = `ART-${Math.floor(1000 + Math.random() * 9000)}`;

        setFormData({
            code: randomCode,
            name: "",
            category: "General", // Default value
            size: "N/A", // Default value
            unitCost: 0,
            unitPrice: 0,
            stockConfigs: buildStockConfigs(locations),
        });
        setOpened(true);
    };

    const handleEdit = async (item) => {
        setEditingId(item.id_articulo);

        const base = {
            code: item.codigo,
            name: item.nombre,
            category: item.category || "General",
            size: item.size || "N/A",
            unitCost: Number(item.costo_unitario) || 0,
            unitPrice: Number(item.precio_unitario) || 0,
            stockConfigs: [],
        };

        if (storeFilter) {
            const locationId = Number(storeFilter);
            try {
                // GET /articles/:id devuelve todos los inventarios con id_inventario,
                // stock_minimo y stock_maximo reales (sin filtrar por cantidad_actual).
                const res = await fetch(
                    `${API_BASE_URL}/articles/${item.id_articulo}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const articleDetail = await res.json();
                    const inv = (articleDetail.inventarios ?? []).find(
                        (i) => (i.location?.id_ubicacion ?? i.id_ubicacion) === locationId
                    );
                    base.stockConfigs = [{
                        inventarioId: inv?.id_inventario ?? null,
                        locationId,
                        minStock: inv?.stock_minimo ?? 0,
                        maxStock: inv?.stock_maximo ?? 0,
                    }];
                }
            } catch {
                // Si falla el fetch, dejar stockConfigs vacío: el modal se abrirá
                // sin el bloque de stock para no mostrar valores erróneos.
            }
        }

        setFormData(base);
        setOpened(true);
    };

    const handleDelete = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/articles/${editingId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || "Error al eliminar el artículo");
            }
            toast.success("Artículo eliminado correctamente");
            setOpened(false);
            fetchData();
        } catch (err) {
            toast.error(`Error al eliminar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.code || !formData.name) {
            toast.error("El código y la prenda son obligatorios");
            return;
        }

        setSaving(true);
        try {
            const isEdit = !!editingId;
            const url = isEdit ? `${API_BASE_URL}/articles/${editingId}` : `${API_BASE_URL}/articles`;
            const method = isEdit ? "PATCH" : "POST";

            // Payload del artículo (sin stockConfigs en edición, se maneja por separado)
            const payload = {
                code: formData.code,
                name: formData.name,
                category: formData.category,
                size: formData.size,
                unitCost: Number(formData.unitCost) || 0,
                unitPrice: Number(formData.unitPrice) || 0,
                // En creación incluir stockConfigs; en edición se actualiza vía /inventory/:id
                ...(!isEdit && formData.stockConfigs?.length > 0 && { stockConfigs: formData.stockConfigs }),
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || "Error al guardar el artículo");
            }

            // En edición: actualizar stock_minimo y stock_maximo via PATCH /inventory/:id_inventario
            if (isEdit && formData.stockConfigs?.length > 0) {
                const stockErrors = [];
                await Promise.all(
                    formData.stockConfigs.map(async (sc) => {
                        if (!sc.inventarioId) return; // sin id no podemos actualizar
                        const invRes = await fetch(`${API_BASE_URL}/inventory/${sc.inventarioId}`, {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                stock_minimo: Number(sc.minStock),
                                stock_maximo: Number(sc.maxStock),
                            }),
                        });
                        if (!invRes.ok) {
                            const errBody = await invRes.json().catch(() => ({}));
                            stockErrors.push(errBody?.message || `Error actualizando inventario ${sc.inventarioId}`);
                        }
                    })
                );
                if (stockErrors.length > 0) {
                    toast.warning(`Artículo guardado, pero hubo errores en el stock: ${stockErrors.join(', ')}`);
                    setOpened(false);
                    fetchData();
                    return;
                }
            }

            toast.success(isEdit ? "Artículo actualizado correctamente" : "Artículo creado correctamente");
            setOpened(false);
            fetchData();
        } catch (err) {
            toast.error(`Error al guardar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Cálculos para tarjetas de resumen
    const totalItems = data.length;
    const totalValue = data.reduce((acc, item) => acc + (item.stock * (item.costo_unitario || 0)), 0);
    const lowStockCount = data.filter(item => item.stock <= 10).length;

    const getTiendaLabel = () => {
        if (!storeFilter) return "Consolidado";
        const loc = locations.find(l => l.id_ubicacion.toString() === storeFilter);
        return loc ? loc.nombre : "Consolidado";
    };

    const mostrarColumnasFinancieras = data.length > 0 ? data[0].costo_unitario !== undefined : !isEmployee;

    if (loading && data.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader color="gray" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--ds-text)]">Inventario Maestro</h1>
                    <p className="text-[var(--ds-muted)] text-sm mt-1">
                        {isEmployee ? "Consulta de existencias global por tienda y prenda. Vista de solo lectura." : "Gestión centralizada de stock."}
                    </p>
                </div>
                {!isEmployee && (
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-4 min-h-[38px] py-3 rounded-md text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out active:scale-95"
                        style={{
                            border: "1px solid rgba(14, 165, 233, 0.5)",
                            background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.04) 100%), var(--ds-surface)",
                            color: "rgba(14, 165, 233, 1)",
                            boxShadow: "0 0 0 1px rgba(14, 165, 233, 0.08), 0 2px 8px rgba(14, 165, 233, 0.15)",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(14, 165, 233, 0.08) 100%), var(--ds-surface)";
                            e.currentTarget.style.boxShadow = "0 0 0 1px rgba(14, 165, 233, 0.15), 0 4px 16px rgba(14, 165, 233, 0.25)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.04) 100%), var(--ds-surface)";
                            e.currentTarget.style.boxShadow = "0 0 0 1px rgba(14, 165, 233, 0.08), 0 2px 8px rgba(14, 165, 233, 0.15)";
                        }}
                    >
                        <Plus width={16} height={16} />
                        Nuevo Artículo
                    </button>
                )}
            </div>

            {error && (
                <Alert color="red" title="Error" className="mb-6">
                    {error}
                </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 rounded-lg bg-[var(--ds-surface)] border border-[var(--ds-border)] shadow-sm">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--ds-muted)] mb-1">Buscar por código o prenda</label>
                    <TextInput
                        placeholder="Escriba aquí..."
                        leftSection={<Magnifier width={16} height={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        styles={{
                            input: {
                                backgroundColor: "var(--ds-bg)",
                                borderColor: "var(--ds-border)",
                                color: "var(--ds-text)",
                            }
                        }}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <label className="block text-xs font-medium text-[var(--ds-muted)] mb-1">Filtrar por Tienda</label>
                    <Select
                        value={storeFilter}
                        onChange={(val) => setStoreFilter(val || "")}
                        data={[
                            { value: "", label: "Todas las tiendas" },
                            ...locations.map(loc => ({
                                value: loc.id_ubicacion.toString(),
                                label: loc.nombre
                            }))
                        ]}
                        styles={{
                            input: {
                                backgroundColor: "var(--ds-bg)",
                                borderColor: "var(--ds-border)",
                                color: "var(--ds-text)",
                            }
                        }}
                    />
                </div>
            </div>

            {!isEmployee && mostrarColumnasFinancieras && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Items */}
                    <div
                        className="p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden h-[120px]"
                        style={{
                            border: "1px solid rgba(99, 102, 241, 0.4)",
                            background: "linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 100%), var(--ds-surface)",
                        }}
                    >
                        <div className="absolute right-4 bottom-2 opacity-20" style={{ color: "#6366F1" }}>
                            <Boxes3 width={72} height={72} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ds-muted)" }}>Total Items</p>
                            <p className="text-3xl font-bold font-mono" style={{ color: "var(--ds-text)" }}>{totalItems}</p>
                        </div>
                    </div>

                    {/* Valor Total Almacén */}
                    <div
                        className="p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden h-[120px]"
                        style={{
                            border: "1px solid rgba(14, 165, 233, 0.4)",
                            background: "linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 100%), var(--ds-surface)",
                        }}
                    >
                        <div className="absolute right-4 bottom-2 opacity-20" style={{ color: "#0EA5E9" }}>
                            <CircleDollar width={72} height={72} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ds-muted)" }}>Valor Total Almacén</p>
                            <p className="text-3xl font-bold font-mono" style={{ color: "var(--ds-text)" }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Bajo Stock */}
                    <div
                        className="p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden h-[120px]"
                        style={{
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            background: "linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 100%), var(--ds-surface)",
                        }}
                    >
                        <div className="absolute right-4 bottom-2 opacity-20" style={{ color: "#F43F5E" }}>
                            <CircleInfo width={72} height={72} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ds-muted)" }}>Bajo Stock</p>
                            <p className="text-3xl font-bold font-mono" style={{ color: "var(--ds-text)" }}>{lowStockCount}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-lg overflow-x-auto shadow-sm">
                <Table verticalSpacing="md" horizontalSpacing="lg" className="min-w-[700px]">
                    <Table.Thead className="bg-[var(--ds-bg)] border-b border-[var(--ds-border)]">
                        <Table.Tr>
                            <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs">Código</Table.Th>
                            <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs">Prenda</Table.Th>
                            <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs text-center">Stock Actual</Table.Th>
                            <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs">Tienda</Table.Th>

                            {isEmployee && (
                                <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs text-center">Estado</Table.Th>
                            )}

                            {!isEmployee && mostrarColumnasFinancieras && (
                                <>
                                    <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs">Costo</Table.Th>
                                    <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs">Precio</Table.Th>
                                    <Table.Th className="text-[var(--ds-muted)] font-semibold uppercase tracking-wider text-xs text-center">Acciones</Table.Th>
                                </>
                            )}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {loading && data.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={isEmployee ? 5 : 7} className="text-center py-12">
                                    <Loader color="gray" size="sm" className="mx-auto" />
                                </Table.Td>
                            </Table.Tr>
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <Table.Tr key={item.id_articulo} className="border-t border-[var(--ds-border)] hover:bg-[var(--ds-bg)] transition-colors">
                                    <Table.Td className="font-mono text-[var(--ds-text)] text-sm font-medium">{item.codigo}</Table.Td>
                                    <Table.Td className="text-[var(--ds-text)] font-medium">{item.nombre}</Table.Td>
                                    <Table.Td className="font-mono text-center">
                                        {!isEmployee ? (
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${item.stock === 0 ? 'text-[var(--ds-danger-text)]' : item.stock <= 10 ? '' : 'text-blue-600 dark:text-blue-400'}`}
                                                style={item.stock > 0 && item.stock <= 10 ? { color: "var(--ds-warning-text)" } : undefined}
                                            >
                                                {item.stock}
                                            </span>
                                        ) : (
                                            <span className="text-[var(--ds-text)] text-sm font-semibold">{item.stock} unidades</span>
                                        )}
                                    </Table.Td>
                                    <Table.Td className="text-[var(--ds-text)] text-sm">{getTiendaLabel()}</Table.Td>

                                    {isEmployee && (
                                        <Table.Td className="text-center">
                                            {item.stock === 0 ? (
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        border: "1px solid rgba(244, 63, 94, 0.4)",
                                                        background: "linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 100%)",
                                                        color: "var(--ds-danger-text)",
                                                    }}
                                                >
                                                    ● Agotado
                                                </span>
                                            ) : item.stock <= 10 ? (
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        border: "1px solid rgba(245, 158, 11, 0.4)",
                                                        background: "linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 100%)",
                                                        color: "var(--ds-warning-text)",
                                                    }}
                                                >
                                                    ● Stock Bajo
                                                </span>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        border: "1px solid rgba(16, 185, 129, 0.4)",
                                                        background: "linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 100%)",
                                                        color: "var(--ds-success-text)",
                                                    }}
                                                >
                                                    ● En Stock
                                                </span>
                                            )}
                                        </Table.Td>
                                    )}

                                    {!isEmployee && mostrarColumnasFinancieras && (
                                        <>
                                            <Table.Td className="font-mono text-[var(--ds-text)] text-sm">${Number(item.costo_unitario).toFixed(2)}</Table.Td>
                                            <Table.Td className="font-mono text-[var(--ds-text)] text-sm font-semibold">${Number(item.precio_unitario).toFixed(2)}</Table.Td>
                                            <Table.Td className="text-center">
                                                <Button
                                                    variant="subtle"
                                                    size="xs"
                                                    onClick={() => handleEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/30 transition-colors mx-auto flex cursor-pointer"
                                                >
                                                    <Pencil width={16} height={16} />
                                                </Button>
                                            </Table.Td>
                                        </>
                                    )}
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={isEmployee ? 5 : 7} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center text-[var(--ds-muted)]">
                                        <Magnifier width={32} height={32} className="mb-4 opacity-50" />
                                        <p className="text-base font-medium">No se encontraron artículos</p>
                                        <p className="text-sm opacity-70">Intenta ajustar tu búsqueda o crea uno nuevo.</p>
                                    </div>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </div>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={<span className="font-semibold text-lg text-[var(--ds-text)]">{editingId ? "Editar Artículo" : "Nuevo Artículo"}</span>}
                centered
                overlayProps={{
                    backgroundOpacity: 0.4,
                    blur: 2,
                }}
                styles={{
                    content: {
                        backgroundColor: "var(--ds-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--ds-border)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
                        display: "flex",
                        flexDirection: "column",
                    },
                    header: {
                        backgroundColor: "var(--ds-surface)",
                        borderBottom: "1px solid var(--ds-border)",
                        marginBottom: "16px",
                        flexShrink: 0,
                    },
                    body: {
                        overflowY: "auto",
                        maxHeight: "65vh",
                        paddingRight: "8px",
                    },
                    close: {
                        color: "var(--ds-text)",
                    }
                }}
            >
                <div className="flex flex-col gap-4">
                    <TextInput
                        label="Código de Producto"
                        placeholder="Ej. P004"
                        required
                        disabled={!!editingId} // No permitir cambiar ID en modo edición
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
                        styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)", opacity: editingId ? 0.7 : 1 } }}
                    />
                    <TextInput
                        label="Prenda"
                        placeholder="Ej. Camisa Blanca"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                        styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)" } }}
                    />
                    <div className="flex gap-4">
                        <NumberInput
                            label="Costo"
                            prefix="$"
                            min={0}
                            className="flex-1"
                            value={formData.unitCost}
                            onChange={(val) => setFormData({ ...formData, unitCost: val })}
                            styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)" } }}
                        />
                        <NumberInput
                            label="Precio de Venta"
                            prefix="$"
                            min={0}
                            className="flex-1"
                            value={formData.unitPrice}
                            onChange={(val) => setFormData({ ...formData, unitPrice: val })}
                            styles={{ input: { backgroundColor: "var(--ds-bg)", borderColor: "var(--ds-border)" } }}
                        />
                    </div>

                    {/* Sección de stock mínimo y máximo por ubicación */}
                    {/* Al crear: todas las ubicaciones. Al editar con tienda filtrada: solo esa ubicación */}
                    {formData.stockConfigs && formData.stockConfigs.length > 0 && (
                        <div>
                            <p
                                className="text-xs font-semibold uppercase tracking-wider mb-3"
                                style={{ color: "var(--ds-muted)" }}
                            >
                                {editingId ? "Stock de la Ubicación" : "Stock por Ubicación"}
                            </p>
                            <div className="flex flex-col gap-3">
                                {formData.stockConfigs.map((sc) => {
                                    const loc = locations.find((l) => l.id_ubicacion === sc.locationId);
                                    return (
                                        <div
                                            key={sc.locationId}
                                            className="p-3 rounded-lg"
                                            style={{
                                                border: "1px solid var(--ds-border)",
                                                background: "var(--ds-bg)",
                                            }}
                                        >
                                            {/* En modo crear mostramos el nombre de la ubicación encima de cada bloque */}
                                            {!editingId && (
                                                <p
                                                    className="text-xs font-medium mb-2"
                                                    style={{ color: "var(--ds-text)" }}
                                                >
                                                    {loc?.nombre ?? `Ubicación ${sc.locationId}`}
                                                </p>
                                            )}
                                            <div className="flex gap-3">
                                                <NumberInput
                                                    label="Stock mínimo"
                                                    min={0}
                                                    step={1}
                                                    allowDecimal={false}
                                                    className="flex-1"
                                                    value={sc.minStock}
                                                    onChange={(val) => updateStockConfig(sc.locationId, "minStock", val ?? 0)}
                                                    styles={{ input: { backgroundColor: "var(--ds-surface)", borderColor: "var(--ds-border)" } }}
                                                />
                                                <NumberInput
                                                    label="Stock máximo"
                                                    min={0}
                                                    step={1}
                                                    allowDecimal={false}
                                                    className="flex-1"
                                                    value={sc.maxStock}
                                                    onChange={(val) => updateStockConfig(sc.locationId, "maxStock", val ?? 0)}
                                                    styles={{ input: { backgroundColor: "var(--ds-surface)", borderColor: "var(--ds-border)" } }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Group justify="space-between" mt="xl">
                        {editingId ? (
                            <Button
                                variant="outline"
                                color="red"
                                onClick={handleDelete}
                                disabled={saving}
                            >
                                Eliminar
                            </Button>
                        ) : <div />}

                        <Group>
                            <Button
                                variant="outline"
                                color="gray"
                                onClick={() => setOpened(false)}
                                disabled={saving}
                                styles={{ root: { borderColor: "var(--ds-border)", color: "var(--ds-text)" } }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                loading={saving}
                                style={{
                                    background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                                    color: "#FFFFFF",
                                    border: "none",
                                }}
                                radius="md"
                                className="hover:brightness-110 cursor-pointer"
                            >
                                {editingId ? "Actualizar" : "Guardar"}
                            </Button>
                        </Group>
                    </Group>
                </div>
            </Modal>
        </div>
    );
}