import React, { useState, useEffect } from "react";
import { Select, NumberInput, Loader, Group, Modal } from "@mantine/core";
import { toast } from "sonner";
import QRCodeModule from "react-qr-code";
const QRCode = QRCodeModule.default || QRCodeModule;
import { ReactZxingScanner as BarcodeScanner } from "react-zxing-scanner";
import { Plus, Clock, FilePlus, QrCode } from "@gravity-ui/icons";

const SECTIONS = [
  { id: "historial", label: "Historial", title: "Historial de Operaciones", icon: Clock },
  { id: "registrar", label: "Registrar Movimiento", title: "Nuevo Movimiento", icon: FilePlus },
  { id: "ordenes", label: "Órdenes y QR", title: "Órdenes de Reabastecimiento", icon: QrCode },
];

const API_URL = await import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("instic_token") || "";

// Custom UI Components matching Design System
const Card = ({ children, className = "" }) => (
  <div className={`bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

const ButtonPrimary = ({ children, className = "", ...props }) => (
  <button 
    className={`bg-[var(--ds-accent)] text-[var(--ds-accent-fg)] hover:bg-[var(--ds-accent-hover)] border-none rounded-[6px] px-4 h-[38px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const ButtonSecondary = ({ children, className = "", ...props }) => (
  <button 
    className={`bg-transparent text-[var(--ds-text)] hover:bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[6px] px-4 h-[38px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const ButtonDanger = ({ children, className = "", ...props }) => (
  <button
    className={`bg-[var(--ds-danger-bg)] text-[var(--ds-danger-text)] border border-[var(--ds-danger-border)] hover:opacity-90 rounded-[6px] px-4 h-[38px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const BadgeStatus = ({ status }) => {
  let bg = "bg-[var(--ds-bg)]", text = "text-[var(--ds-muted)]", border = "border-[var(--ds-border)]", dot = false;
  if (status === 'COMPLETED') { bg = 'bg-blue-500/10'; text = 'text-blue-600 dark:text-blue-400'; border = 'border-blue-500/20'; }
  else if (status === 'PENDING') { bg = 'bg-yellow-500/10'; text = 'text-yellow-600 dark:text-yellow-400'; border = 'border-yellow-500/20'; dot = true; }
  else if (status === 'CANCELLED') { bg = 'bg-[var(--ds-bg)]'; text = 'text-[var(--ds-muted)]'; border = 'border-[var(--ds-border)]'; }
  else if (status === 'APPROVED' || status === 'IN_PROGRESS') { bg = 'bg-blue-500/10'; text = 'text-blue-600 dark:text-blue-400'; border = 'border-blue-500/20'; dot = true; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium border ${bg} ${text} ${border}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
      {status}
    </span>
  );
};

function SectionNav({ activeTab, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Apartados de movimientos"
      className="flex flex-col sm:flex-row gap-1 p-1 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] mb-4"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={[
              "flex flex-1 items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-md text-sm font-medium",
              "transition-[background-color,color,border-color] duration-150 ease-in-out",
              "border cursor-pointer",
              isActive
                ? "bg-[var(--ds-accent)] text-[var(--ds-accent-fg)] border-[var(--ds-accent)]"
                : "bg-transparent text-[var(--ds-muted)] border-transparent hover:bg-[var(--ds-bg)] hover:text-[var(--ds-text)]",
            ].join(" ")}
          >
            <Icon width={16} height={16} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Movimientos() {
  const [activeTab, setActiveTab] = useState("historial");

  return (
    <div className="bg-[var(--ds-bg)] text-[var(--ds-text)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[2rem] font-bold text-[var(--ds-text)] mb-6 font-inter tracking-tight">
          Gestión de Movimientos
        </h1>

        <SectionNav activeTab={activeTab} onChange={setActiveTab} />


        {activeTab === "historial" && (
          <Card>
            <Historial />
          </Card>
        )}

        {activeTab === "registrar" && (
          <Card className="max-w-2xl mx-auto">
            <Registrar />
          </Card>
        )}

        {activeTab === "ordenes" && (
          <Card>
            <Ordenes />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ================= HISTORIAL ================= */
function Historial() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/movements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Error al obtener movimientos");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/movements/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Error actualizando estado");
      toast.success("Estado actualizado");
      fetchMovements();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cancelMovement = async (id) => {
    const cancelReason = prompt("Motivo de la anulación:");
    if (!cancelReason) return;
    try {
      const res = await fetch(`${API_URL}/movements/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ cancelReason })
      });
      if (!res.ok) throw new Error("Error anulando movimiento");
      toast.success("Movimiento anulado correctamente");
      fetchMovements();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader color="gray" /></div>;

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[var(--ds-border)]">
      <table className="w-full text-left border-collapse text-[0.875rem]">
        <thead>
          <tr className="bg-[var(--ds-bg)] border-b border-[var(--ds-border)]">
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">ID</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Fecha</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Tipo</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Artículo</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Cantidad</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Estado</th>
            <th className="px-4 py-3 font-semibold text-[var(--ds-muted)] text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id_movimiento} className={`border-b border-[var(--ds-border)] hover:bg-[var(--ds-bg)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--ds-surface)]' : 'bg-[var(--ds-bg)]'}`}>
              <td className="px-4 py-3 font-mono text-[var(--ds-subtle)]">{item.id_movimiento}</td>
              <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{new Date(item.created_at || Date.now()).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-[var(--ds-text)]">{item.tipo}</td>
              <td className="px-4 py-3 text-[var(--ds-text)]">{item.article?.nombre || item.article?.name || item.articleId}</td>
              <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{item.cantidad}</td>
              <td className="px-4 py-3"><BadgeStatus status={item.estado} /></td>
              <td className="px-4 py-3 text-right">
                <Group justify="flex-end" gap="xs">
                  {item.estado === 'PENDING' && (
                    <ButtonPrimary onClick={() => updateStatus(item.id_movimiento, 'COMPLETED')}>
                      Completar
                    </ButtonPrimary>
                  )}
                  {item.estado === 'COMPLETED' && (
                    <ButtonDanger onClick={() => cancelMovement(item.id_movimiento)}>
                      Anular
                    </ButtonDanger>
                  )}
                </Group>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-8 text-[var(--ds-muted)]">
                No hay movimientos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ================= REGISTRAR ================= */
function Registrar() {
  const [type, setType] = useState('input');
  const [articles, setArticles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    articleId: '',
    quantity: 1,
    originId: '',
    destinationId: '',
    status: 'COMPLETED'
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      setLoading(true);
      try {
        const [artsRes, locsRes] = await Promise.all([
          fetch(`${API_URL}/articles`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${API_URL}/locations`, { headers: { Authorization: `Bearer ${getToken()}` } })
        ]);
        if (!artsRes.ok || !locsRes.ok) throw new Error("Error cargando dependencias");
        setArticles(await artsRes.json());
        setLocations(await locsRes.json());
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDependencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        articleId: Number(formData.articleId),
        quantity: Number(formData.quantity),
        status: formData.status
      };
      
      if (type === 'input') {
        payload.destinationId = Number(formData.destinationId);
        if (formData.originId) payload.originId = Number(formData.originId);
      } else if (type === 'output') {
        payload.originId = Number(formData.originId);
        if (formData.destinationId) payload.destinationId = Number(formData.destinationId);
      } else if (type === 'transfer') {
        payload.originId = Number(formData.originId);
        payload.destinationId = Number(formData.destinationId);
      }

      const res = await fetch(`${API_URL}/movements/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(()=>({}));
        throw new Error(errJson.message || `Error ${res.status}`);
      }
      
      toast.success("Movimiento registrado correctamente.");
      setFormData({ ...formData, quantity: 1, articleId: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const articleOptions = articles.map(a => ({ value: (a.id_articulo || a.id || '').toString(), label: `${a.codigo || a.code} - ${a.nombre || a.name}` }));
  const locationOptions = locations.map(l => ({ value: (l.id_ubicacion || l.id || '').toString(), label: l.nombre || l.name }));

  if (loading) return <div className="flex justify-center p-8"><Loader color="gray" /></div>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select 
        label="Tipo de Movimiento" 
        value={type} 
        onChange={(val) => setType(val)}
        data={[
          { value: 'input', label: 'Entrada' },
          { value: 'output', label: 'Salida' },
          { value: 'transfer', label: 'Transferencia' }
        ]}
        required
      />

      <Select
        label="Artículo"
        placeholder="Selecciona un artículo"
        data={articleOptions}
        value={formData.articleId}
        onChange={(val) => setFormData({ ...formData, articleId: val })}
        searchable
        required
      />

      <NumberInput
        label="Cantidad"
        value={formData.quantity}
        onChange={(val) => setFormData({ ...formData, quantity: val })}
        min={1}
        required
      />

      {(type === 'output' || type === 'transfer') && (
        <Select
          label="Ubicación Origen"
          placeholder="Selecciona origen"
          data={locationOptions}
          value={formData.originId}
          onChange={(val) => setFormData({ ...formData, originId: val })}
          required
        />
      )}

      {(type === 'input' || type === 'transfer') && (
        <Select
          label="Ubicación Destino"
          placeholder="Selecciona destino"
          data={locationOptions}
          value={formData.destinationId}
          onChange={(val) => setFormData({ ...formData, destinationId: val })}
          required
        />
      )}

      {type === 'input' && (
        <Select
          label="Ubicación Origen (Opcional - Proveedor externo)"
          placeholder="Selecciona origen si aplica"
          data={locationOptions}
          value={formData.originId}
          onChange={(val) => setFormData({ ...formData, originId: val })}
          clearable
        />
      )}

      {type === 'output' && (
        <Select
          label="Ubicación Destino (Opcional - Venta final)"
          placeholder="Selecciona destino si aplica"
          data={locationOptions}
          value={formData.destinationId}
          onChange={(val) => setFormData({ ...formData, destinationId: val })}
          clearable
        />
      )}

      <Select
        label="Estado Inicial"
        value={formData.status}
        onChange={(val) => setFormData({ ...formData, status: val })}
        data={[
          { value: 'COMPLETED', label: 'Completado (Afecta inventario)' },
          { value: 'PENDING', label: 'Pendiente' }
        ]}
        required
      />

      <div className="flex justify-end mt-4">
        <ButtonPrimary type="submit" disabled={submitting || !formData.articleId}>
          {submitting ? <Loader size="xs" color="white" /> : "Guardar Movimiento"}
        </ButtonPrimary>
      </div>
    </form>
  );
}

/* ================= ORDENES ================= */
function Ordenes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpened, setModalOpened] = useState(false);
  const [qrModalOpened, setQrModalOpened] = useState(false);
  const [generatedQr, setGeneratedQr] = useState("");
  const [scannerOpened, setScannerOpened] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);

  const [formData, setFormData] = useState({ articleId: '', quantity: 1, originId: '', destinationId: '' });
  const [articles, setArticles] = useState([]);
  const [locations, setLocations] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${getToken()}` }});
      if (!res.ok) throw new Error("Error al obtener órdenes");
      setOrders(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [artsRes, locsRes] = await Promise.all([
        fetch(`${API_URL}/articles`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/locations`, { headers: { Authorization: `Bearer ${getToken()}` } })
      ]);
      if (artsRes.ok) setArticles(await artsRes.json());
      if (locsRes.ok) setLocations(await locsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDependencies();
  }, []);

  const handleGenerateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          articleId: Number(formData.articleId),
          quantity: Number(formData.quantity),
          originId: Number(formData.originId),
          destinationId: Number(formData.destinationId)
        })
      });
      if (!res.ok) throw new Error("Error creando orden");
      const json = await res.json();
      toast.success("Orden creada exitosamente");
      setGeneratedQr(json.qrUrl?.split('/').pop() || json.qrCode || "ORD-UNKNOWN"); 
      setModalOpened(false);
      setQrModalOpened(true);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleScan = async (result) => {
    if (!result || !result.text) return;
    setScannerOpened(false);
    try {
      const code = result.text.split('/').pop();
      const res = await fetch(`${API_URL}/orders/${code}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Orden no encontrada o inválida");
      setScannedOrder(await res.json());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAdvanceState = async (id, currentStatus) => {
    let nextStatus = '';
    let payload = {};
    if (currentStatus === 'PENDING') {
      nextStatus = 'APPROVED';
      const eta = prompt("Ingresa el ETA (días estimados):", "3");
      if (!eta) return;
      payload = { status: nextStatus, etaDays: parseInt(eta, 10) };
    } else if (currentStatus === 'APPROVED') {
      nextStatus = 'IN_PROGRESS';
      payload = { status: nextStatus };
    } else if (currentStatus === 'IN_PROGRESS') {
      nextStatus = 'COMPLETED';
      payload = { status: nextStatus };
    } else {
      toast.error("El estado de la orden ya no puede avanzar");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders/${id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al avanzar el estado de la orden");
      toast.success(`Orden actualizada a ${nextStatus}`);
      setScannedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <ButtonSecondary onClick={() => setScannerOpened(true)}>
          Escanear QR
        </ButtonSecondary>
        <ButtonPrimary onClick={() => setModalOpened(true)}>
          <Plus width={16} height={16} /> Nueva Orden
        </ButtonPrimary>
      </Group>

      <div className="overflow-x-auto rounded-[8px] border border-[var(--ds-border)]">
        <table className="w-full text-left border-collapse text-[0.875rem]">
          <thead>
            <tr className="bg-[var(--ds-bg)] border-b border-[var(--ds-border)]">
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">QR Code</th>
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Artículo</th>
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Cantidad</th>
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Origen</th>
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Destino</th>
              <th className="px-4 py-3 font-semibold text-[var(--ds-muted)]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((item, idx) => (
              <tr key={item.id_orden} className={`border-b border-[var(--ds-border)] hover:bg-[var(--ds-bg)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--ds-surface)]' : 'bg-[var(--ds-bg)]'}`}>
                <td className="px-4 py-3 font-mono text-[var(--ds-subtle)]">{item.qr_code?.split('/').pop() || '-'}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.article?.nombre || item.article?.name || item.articleId}</td>
                <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{item.cantidad}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.origin?.nombre || item.origin?.name || item.originId}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.destination?.nombre || item.destination?.name || item.destinationId}</td>
                <td className="px-4 py-3"><BadgeStatus status={item.estado} /></td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-8 text-[var(--ds-muted)]">No hay órdenes registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Generar Orden de Reabastecimiento" shadow="0 8px 40px rgba(0,0,0,0.12)">
        <form onSubmit={handleGenerateOrder} className="flex flex-col gap-4">
          <Select
            label="Artículo"
            data={articles.map(a => ({ value: (a.id_articulo || a.id || '').toString(), label: `${a.codigo || a.code} - ${a.nombre || a.name}` }))}
            value={formData.articleId}
            onChange={(v) => setFormData({...formData, articleId: v})}
            required
            searchable
          />
          <NumberInput
            label="Cantidad"
            value={formData.quantity}
            onChange={(v) => setFormData({...formData, quantity: v})}
            min={1} required
          />
          <Select
            label="Origen (Proveedor / Almacén)"
            data={locations.map(l => ({ value: (l.id_ubicacion || l.id || '').toString(), label: l.nombre || l.name }))}
            value={formData.originId}
            onChange={(v) => setFormData({...formData, originId: v})}
            required
          />
          <Select
            label="Destino (Tienda)"
            data={locations.map(l => ({ value: (l.id_ubicacion || l.id || '').toString(), label: l.nombre || l.name }))}
            value={formData.destinationId}
            onChange={(v) => setFormData({...formData, destinationId: v})}
            required
          />
          <Group justify="flex-end" mt="xl">
            <ButtonSecondary type="button" onClick={() => setModalOpened(false)}>Cancelar</ButtonSecondary>
            <ButtonPrimary type="submit" disabled={!formData.articleId || !formData.originId || !formData.destinationId}>
              Generar
            </ButtonPrimary>
          </Group>
        </form>
      </Modal>

      <Modal opened={qrModalOpened} onClose={() => setQrModalOpened(false)} title="Orden Generada Exitosamente" shadow="0 8px 40px rgba(0,0,0,0.12)">
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="bg-[var(--ds-surface)] p-4 rounded-lg shadow-sm border border-[var(--ds-border)]">
            <QRCode value={generatedQr} size={200} />
          </div>
          <p className="font-mono text-sm text-[var(--ds-text)] bg-[var(--ds-bg)] border border-[var(--ds-border)] px-3 py-1 rounded-md">{generatedQr}</p>
          <ButtonSecondary onClick={() => setQrModalOpened(false)} className="w-full">
            Cerrar
          </ButtonSecondary>
        </div>
      </Modal>

      <Modal opened={scannerOpened} onClose={() => setScannerOpened(false)} title="Escanear QR de Orden" size="lg">
        <div className="overflow-hidden rounded-lg bg-[var(--ds-bg)] flex justify-center p-4">
          <BarcodeScanner onUpdate={handleScan} />
        </div>
      </Modal>

      <Modal opened={!!scannedOrder} onClose={() => setScannedOrder(null)} title="Detalle de la Orden Escaneada">
        {scannedOrder && (
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--ds-bg)] p-4 rounded-lg border border-[var(--ds-border)]">
              <p className="text-sm text-[var(--ds-muted)] mb-1">Artículo</p>
              <p className="font-medium text-[var(--ds-text)] mb-3">{scannedOrder.article?.nombre || scannedOrder.article?.name}</p>
              
              <Group grow>
                <div>
                  <p className="text-sm text-[var(--ds-muted)] mb-1">Cantidad</p>
                  <p className="font-mono text-[var(--ds-text)]">{scannedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ds-muted)] mb-1">Estado Actual</p>
                  <BadgeStatus status={scannedOrder.status} />
                </div>
              </Group>
            </div>

            <Group justify="flex-end" mt="xl">
              <ButtonSecondary onClick={() => setScannedOrder(null)}>Cerrar</ButtonSecondary>
              {scannedOrder.status !== 'COMPLETED' && scannedOrder.status !== 'CANCELLED' && (
                <ButtonPrimary onClick={() => handleAdvanceState(scannedOrder.id, scannedOrder.status)}>
                  Avanzar Estado
                </ButtonPrimary>
              )}
            </Group>
          </div>
        )}
      </Modal>
    </div>
  );
}