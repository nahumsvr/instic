import React, { useState, useEffect } from "react";
import { Tabs, Select, NumberInput, Loader, Group, Modal } from "@mantine/core";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { ReactZxingScanner as BarcodeScanner } from "react-zxing-scanner";
import { Plus, Xmark, Check, TrashBin } from "@gravity-ui/icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const getToken = () => localStorage.getItem("token") || "";

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
    className={`bg-transparent text-[#B91C1C] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] px-4 h-[38px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const BadgeStatus = ({ status }) => {
  let bg = "bg-[#F5F5F5]", text = "text-[#6B6B6B]", border = "border-[#E0E0E0]", dot = false;
  if (status === 'COMPLETED') { bg = 'bg-[#EFF6FF]'; text = 'text-[#1D4ED8]'; border = 'border-[#BFDBFE]'; }
  else if (status === 'PENDING') { bg = 'bg-[#FFFBEB]'; text = 'text-[#B45309]'; border = 'border-[#FDE68A]'; dot = true; }
  else if (status === 'CANCELLED') { bg = 'bg-[#F5F5F5]'; text = 'text-[#6B6B6B]'; border = 'border-[#E0E0E0]'; }
  else if (status === 'APPROVED' || status === 'IN_PROGRESS') { bg = 'bg-[#EFF6FF]'; text = 'text-[#1D4ED8]'; border = 'border-[#BFDBFE]'; dot = true; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium border ${bg} ${text} ${border}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
      {status}
    </span>
  );
};

export default function Movimientos() {
  const [activeTab, setActiveTab] = useState("historial");

  return (
    <div className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[2rem] font-bold text-[var(--ds-text)] mb-8 font-inter tracking-tight">
          Gestión de Movimientos
        </h1>

        <Tabs value={activeTab} onChange={setActiveTab} color="dark">
          <Tabs.List className="mb-6 border-[var(--ds-border)]">
            <Tabs.Tab value="historial" className="font-medium text-[var(--ds-text)]">Historial</Tabs.Tab>
            <Tabs.Tab value="registrar" className="font-medium text-[var(--ds-text)]">Registrar Movimiento</Tabs.Tab>
            <Tabs.Tab value="ordenes" className="font-medium text-[var(--ds-text)]">Órdenes y QR</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="historial">
            <Card>
              <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--ds-text)]">Historial de Operaciones</h2>
              <Historial />
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="registrar">
            <Card className="max-w-2xl mx-auto">
              <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--ds-text)]">Nuevo Movimiento</h2>
              <Registrar />
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="ordenes">
            <Card>
              <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--ds-text)]">Órdenes de Reabastecimiento</h2>
              <Ordenes />
            </Card>
          </Tabs.Panel>
        </Tabs>
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
            <tr key={item.id} className={`border-b border-[var(--ds-border)] hover:bg-[var(--ds-bg)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--ds-surface)]' : 'bg-[#FAFAFA]'}`}>
              <td className="px-4 py-3 font-mono text-[var(--ds-subtle)]">{item.id}</td>
              <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-[var(--ds-text)]">{item.type}</td>
              <td className="px-4 py-3 text-[var(--ds-text)]">{item.article?.name || item.articleId}</td>
              <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{item.quantity}</td>
              <td className="px-4 py-3"><BadgeStatus status={item.status} /></td>
              <td className="px-4 py-3 text-right">
                <Group justify="flex-end" gap="xs">
                  {item.status === 'PENDING' && (
                    <ButtonPrimary onClick={() => updateStatus(item.id, 'COMPLETED')}>
                      Completar
                    </ButtonPrimary>
                  )}
                  {item.status === 'COMPLETED' && (
                    <ButtonDanger onClick={() => cancelMovement(item.id)}>
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

  const articleOptions = articles.map(a => ({ value: a.id.toString(), label: `${a.code} - ${a.name}` }));
  const locationOptions = locations.map(l => ({ value: l.id.toString(), label: l.name }));

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
              <tr key={item.id} className={`border-b border-[var(--ds-border)] hover:bg-[var(--ds-bg)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--ds-surface)]' : 'bg-[#FAFAFA]'}`}>
                <td className="px-4 py-3 font-mono text-[var(--ds-subtle)]">{item.qrUrl?.split('/').pop() || '-'}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.article?.name || item.articleId}</td>
                <td className="px-4 py-3 font-mono text-[var(--ds-text)]">{item.quantity}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.origin?.name || item.originId}</td>
                <td className="px-4 py-3 text-[var(--ds-text)]">{item.destination?.name || item.destinationId}</td>
                <td className="px-4 py-3"><BadgeStatus status={item.status} /></td>
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
            data={articles.map(a => ({ value: a.id.toString(), label: `${a.code} - ${a.name}` }))}
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
            data={locations.map(l => ({ value: l.id.toString(), label: l.name }))}
            value={formData.originId}
            onChange={(v) => setFormData({...formData, originId: v})}
            required
          />
          <Select
            label="Destino (Tienda)"
            data={locations.map(l => ({ value: l.id.toString(), label: l.name }))}
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
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E0E0E0]">
            <QRCode value={generatedQr} size={200} />
          </div>
          <p className="font-mono text-sm text-[var(--ds-text)] bg-[#F5F5F5] border border-[#E0E0E0] px-3 py-1 rounded-md">{generatedQr}</p>
          <ButtonSecondary onClick={() => setQrModalOpened(false)} className="w-full">
            Cerrar
          </ButtonSecondary>
        </div>
      </Modal>

      <Modal opened={scannerOpened} onClose={() => setScannerOpened(false)} title="Escanear QR de Orden" size="lg">
        <div className="overflow-hidden rounded-lg bg-black/5 flex justify-center p-4">
          <BarcodeScanner onUpdate={handleScan} />
        </div>
      </Modal>

      <Modal opened={!!scannedOrder} onClose={() => setScannedOrder(null)} title="Detalle de la Orden Escaneada">
        {scannedOrder && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E0E0E0]">
              <p className="text-sm text-[var(--ds-muted)] mb-1">Artículo</p>
              <p className="font-medium text-[var(--ds-text)] mb-3">{scannedOrder.article?.name}</p>
              
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