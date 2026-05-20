import { useState, useEffect } from "react";
import { Select, NumberInput, Loader, Group, Modal, Tooltip, TextInput } from "@mantine/core";
import { toast } from "sonner";
import QRCodeModule from "react-qr-code";
const QRCode = QRCodeModule.default || QRCodeModule;
import QrScanner from "../components/QrScanner";
import { Plus, Clock, FilePlus, QrCode, Printer, ArrowDownToSquare } from "@gravity-ui/icons";
import SectionNav from "../components/SectionNav";

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
  let style;
  let dot = false;

  if (status === 'COMPLETED') {
    style = {
      border: "1px solid rgba(14, 165, 233, 0.4)",
      background: "linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 100%), var(--ds-surface)",
      color: "var(--ds-info-text)",
    };
  } else if (status === 'PENDING') {
    style = {
      border: "1px solid rgba(245, 158, 11, 0.4)",
      background: "linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 100%), var(--ds-surface)",
      color: "var(--ds-warning-text)",
    };
    dot = true;
  } else if (status === 'CANCELLED') {
    style = {
      border: "1px solid rgba(244, 63, 94, 0.4)",
      background: "linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 100%), var(--ds-surface)",
      color: "var(--ds-danger-text)",
    };
  } else if (status === 'APPROVED' || status === 'IN_PROGRESS') {
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

export default function Movimientos() {
  const [activeTab, setActiveTab] = useState("historial");

  return (
    <div className="bg-[var(--ds-bg)] text-[var(--ds-text)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[2rem] font-bold text-[var(--ds-text)] mb-6 font-inter tracking-tight">
          Gestión de Movimientos
        </h1>

        <SectionNav
          sections={SECTIONS}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Apartados de movimientos"
        />


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
        const errJson = await res.json().catch(() => ({}));
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
  const [generatedOrder, setGeneratedOrder] = useState(null); // respuesta completa de la orden creada
  const [scannerOpened, setScannerOpened] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedOrder, setScannedOrder] = useState(null);

  const [formData, setFormData] = useState({ articleId: '', quantity: 1, originId: '', destinationId: '' });
  const [articles, setArticles] = useState([]);
  const [locations, setLocations] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${getToken()}` } });
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
      const qrCode = json.qrUrl?.split('/').pop() || json.qrCode || "ORD-UNKNOWN";
      setGeneratedQr(qrCode);
      // Enriquecer la orden con los datos del formulario para mostrar en el modal
      const article = articles.find(a => (a.id_articulo || a.id)?.toString() === formData.articleId);
      const origin = locations.find(l => (l.id_ubicacion || l.id)?.toString() === formData.originId);
      const destination = locations.find(l => (l.id_ubicacion || l.id)?.toString() === formData.destinationId);
      setGeneratedOrder({
        ...json,
        qrCode,
        articleName: article?.nombre || article?.name || formData.articleId,
        quantity: formData.quantity,
        originName: origin?.nombre || origin?.name || formData.originId,
        destinationName: destination?.nombre || destination?.name || formData.destinationId,
        createdAt: new Date().toLocaleString('es-MX'),
      });
      setModalOpened(false);
      setQrModalOpened(true);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const processScannedCode = async (code) => {
    if (!code?.trim()) return;
    setScannerOpened(false);
    try {
      const cleanCode = code.trim().split('/').pop();
      const res = await fetch(`${API_URL}/orders/${cleanCode}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Orden no encontrada o inválida");
      setScannedOrder(await res.json());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAdvanceState = async (id, currentStatus) => {
    let nextStatus;
    let payload;
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

  /**
   * Abre una ventana de impresión con el QR y los datos de la orden.
   * Genera el HTML de la ventana con el SVG del QR incrustado directamente.
   */
  const handlePrintOrder = (order) => {
    const svgEl = document.querySelector('#qr-print-area svg');
    if (!svgEl) {
      toast.error('No se pudo encontrar el código QR para imprimir.');
      return;
    }
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const printWindow = window.open('', '_blank', 'width=480,height=700');
    if (!printWindow) {
      toast.error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Orden ${order.qrCode}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 1.25rem; font-weight: 700; }
          .header span { font-size: 0.75rem; color: #6b6b6b; }
          .qr-block { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 24px; }
          .qr-block svg { display: block; }
          .qr-code-label { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #6b6b6b; letter-spacing: 0.05em; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
          .info-item label { display: block; font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b6b6b; margin-bottom: 2px; }
          .info-item p { font-size: 0.875rem; font-weight: 500; color: #111; }
          .info-item.full { grid-column: span 2; }
          .footer { margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 12px; text-align: center; font-size: 0.625rem; color: #aaaaaa; }
          @media print {
            body { padding: 16px; }
            @page { size: A6; margin: 8mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Orden de Reabastecimiento</h1>
          <span>INSTIC</span>
        </div>
        <div class="qr-block">
          ${svgString}
          <span class="qr-code-label">${order.qrCode}</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Artículo</label>
            <p>${order.articleName}</p>
          </div>
          <div class="info-item">
            <label>Cantidad</label>
            <p>${order.quantity}</p>
          </div>
          <div class="info-item">
            <label>Origen</label>
            <p>${order.originName}</p>
          </div>
          <div class="info-item">
            <label>Destino</label>
            <p>${order.destinationName}</p>
          </div>
          <div class="info-item full">
            <label>Fecha de creación</label>
            <p>${order.createdAt}</p>
          </div>
        </div>
        <div class="footer">Generado por Instic · ${order.createdAt}</div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  /**
   * Descarga el QR como imagen PNG (128×128) con los datos de la orden
   * usando un canvas HTML para convertir el SVG.
   */
  const handleDownloadQR = (order) => {
    const svgEl = document.querySelector('#qr-print-area svg');
    if (!svgEl) {
      toast.error('No se pudo encontrar el código QR para descargar.');
      return;
    }
    const SIZE = 256;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const link = document.createElement('a');
      link.download = `qr-orden-${order.qrCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR descargado correctamente.');
    };
    img.onerror = () => toast.error('Error al generar la imagen PNG del QR.');
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <ButtonSecondary onClick={() => { setScannerOpened(true); setManualCode(""); }}>
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
                <td className="px-4 py-3 font-mono text-[var(--ds-subtle)] w-50">{item.qr_code?.split('/').pop() || '-'}</td>
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
            onChange={(v) => setFormData({ ...formData, articleId: v })}
            required
            searchable
          />
          <NumberInput
            label="Cantidad"
            value={formData.quantity}
            onChange={(v) => setFormData({ ...formData, quantity: v })}
            min={1} required
          />
          <Select
            label="Origen (Proveedor / Almacén)"
            data={locations.map(l => ({ value: (l.id_ubicacion || l.id || '').toString(), label: l.nombre || l.name }))}
            value={formData.originId}
            onChange={(v) => setFormData({ ...formData, originId: v })}
            required
          />
          <Select
            label="Destino (Tienda)"
            data={locations.map(l => ({ value: (l.id_ubicacion || l.id || '').toString(), label: l.nombre || l.name }))}
            value={formData.destinationId}
            onChange={(v) => setFormData({ ...formData, destinationId: v })}
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

      <Modal
        opened={qrModalOpened}
        onClose={() => setQrModalOpened(false)}
        title="Orden Generada Exitosamente"
        shadow="0 8px 40px rgba(0,0,0,0.12)"
        size="md"
      >
        {generatedOrder && (
          <div className="flex flex-col gap-5 p-2">
            {/* QR Code centrado */}
            <div className="flex justify-center">
              <div
                id="qr-print-area"
                className="bg-white p-4 rounded-lg border border-[var(--ds-border)] flex flex-col items-center gap-3"
              >
                <QRCode value={generatedQr} size={180} />
                <p className="font-mono text-xs text-[#111111] mt-1">{generatedQr}</p>
              </div>
            </div>

            {/* Información del pedido */}
            <div className="bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-lg p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[var(--ds-muted)] uppercase tracking-wider mb-1">Detalle de la Orden</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-[var(--ds-muted)] text-xs mb-0.5">Artículo</p>
                  <p className="font-medium text-[var(--ds-text)]">{generatedOrder.articleName}</p>
                </div>
                <div>
                  <p className="text-[var(--ds-muted)] text-xs mb-0.5">Cantidad</p>
                  <p className="font-mono font-medium text-[var(--ds-text)]">{generatedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-[var(--ds-muted)] text-xs mb-0.5">Origen</p>
                  <p className="font-medium text-[var(--ds-text)]">{generatedOrder.originName}</p>
                </div>
                <div>
                  <p className="text-[var(--ds-muted)] text-xs mb-0.5">Destino</p>
                  <p className="font-medium text-[var(--ds-text)]">{generatedOrder.destinationName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[var(--ds-muted)] text-xs mb-0.5">Fecha de creación</p>
                  <p className="font-mono text-xs text-[var(--ds-text)]">{generatedOrder.createdAt}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Tooltip label="Descargar QR como imagen PNG" withArrow>
                <ButtonSecondary
                  className="flex-1"
                  onClick={() => handleDownloadQR(generatedOrder)}
                >
                  <ArrowDownToSquare width={16} height={16} />
                  Descargar
                </ButtonSecondary>
              </Tooltip>
              <Tooltip label="Imprimir orden con QR" withArrow>
                <ButtonSecondary
                  className="flex-1"
                  onClick={() => handlePrintOrder(generatedOrder)}
                >
                  <Printer width={16} height={16} />
                  Imprimir
                </ButtonSecondary>
              </Tooltip>
              <ButtonPrimary className="flex-1" onClick={() => setQrModalOpened(false)}>
                Cerrar
              </ButtonPrimary>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        opened={scannerOpened}
        onClose={() => setScannerOpened(false)}
        title="Escanear QR de Orden"
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
            {scannerOpened && (
              <QrScanner
                onScan={processScannedCode}
                onError={() => toast.error("Error al acceder a la cámara. Verifica los permisos del navegador.")}
                width="100%"
                height="100%"
              />
            )}
          </div>

          <div className="text-[var(--ds-muted)] text-sm text-center">
            O ingresa el código manualmente:
          </div>

          <div className="flex gap-2">
            <TextInput
              placeholder="Ej. ORD-123456"
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
            <ButtonPrimary
              onClick={() => processScannedCode(manualCode)}
            >
              Validar
            </ButtonPrimary>
          </div>
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