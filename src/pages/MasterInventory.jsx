import { useState, useEffect, useCallback } from "react";
import { Table, TextInput, Select, Button, Loader, Alert, Modal, NumberInput, Group } from "@mantine/core";
import { Magnifier, Plus, Pencil } from "@gravity-ui/icons";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { useDebouncedValue } from "@mantine/hooks";

export default function MasterInventory() {
    const { user, token } = useAuth();
    const isEmployee = user?.rol === "empleado" || user?.rol === "employee" || (!user?.rol);

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
    });

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
        setFormData({
            code: "",
            name: "",
            category: "General", // Default value
            size: "N/A", // Default value
            unitCost: 0,
            unitPrice: 0,
        });
        setOpened(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id_articulo);
        setFormData({
            code: item.codigo,
            name: item.nombre,
            category: item.category || "General",
            size: item.size || "N/A",
            unitCost: item.costo_unitario || 0,
            unitPrice: item.precio_unitario || 0,
        });
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

            const payload = { ...formData };
            
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
                    <Button
                        leftSection={<Plus width={16} height={16} />}
                        style={{
                            backgroundColor: "var(--ds-accent)",
                            color: "var(--ds-accent-fg)",
                        }}
                        radius="md"
                        onClick={handleNew}
                        className="transition-transform active:scale-95 shadow-sm hover:shadow-md"
                    >
                        Nuevo Artículo
                    </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div
                        className="p-6 rounded-lg shadow-sm flex flex-col justify-center"
                        style={{ backgroundColor: "var(--ds-accent)", color: "var(--ds-accent-fg)" }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Total Items</p>
                        <p className="text-4xl font-bold">{totalItems}</p>
                    </div>

                    <div
                        className="p-6 rounded-lg shadow-sm border flex flex-col justify-center"
                        style={{ backgroundColor: "var(--ds-surface)", borderColor: "var(--ds-border)", color: "var(--ds-text)" }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">Valor Total Almacén</p>
                        <p className="text-4xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>

                    <div
                        className="p-6 rounded-lg shadow-sm border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex flex-col justify-center"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Bajo Stock</p>
                        <p className="text-4xl font-bold">{lowStockCount}</p>
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
                                    <Table.Td className="font-mono text-[var(--ds-text)] text-center">
                                        {!isEmployee ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${item.stock === 0 ? 'text-red-600' : item.stock <= 10 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                                                    ● Agotado
                                                </span>
                                            ) : item.stock <= 10 ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}>
                                                    ● Stock Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}>
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
                                                    color="gray"
                                                    size="xs"
                                                    onClick={() => handleEdit(item)}
                                                    className="hover:bg-[var(--ds-border)] mx-auto flex"
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
                    },
                    header: {
                        backgroundColor: "var(--ds-surface)",
                        borderBottom: "1px solid var(--ds-border)",
                        marginBottom: "16px",
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
                                    backgroundColor: "var(--ds-accent)",
                                    color: "var(--ds-accent-fg)",
                                }}
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