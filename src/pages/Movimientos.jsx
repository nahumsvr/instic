import { useState } from "react";
import QRCode from "react-qr-code";

export default function Movimientos() {
  const [tab, setTab] = useState(1);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Gestión de Movimientos
        </h1>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setTab(1)}
          >
            Historial
          </button>

          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 2
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setTab(2)}
          >
            Registrar
          </button>

          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 3
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setTab(3)}
          >
            Órdenes y QR
          </button>
        </div>

        {/* Contenido */}
        <div className="bg-gray-50 p-5 rounded-lg">
          {tab === 1 && <Historial />}
          {tab === 2 && <Registrar />}
          {tab === 3 && <Ordenes />}
        </div>
      </div>
    </div>
  );
}

/* ================= HISTORIAL ================= */
function Historial() {
  const data = [
    { id: 1, nombre: "Producto A" },
    { id: 2, nombre: "Producto B" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Historial de productos
      </h2>

      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b hover:bg-gray-100 transition"
            >
              <td className="p-3 text-gray-800">{item.nombre}</td>
              <td className="p-3 text-right">
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm">
                  Anular
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= REGISTRAR ================= */
function Registrar() {
  const [tipo, setTipo] = useState("");

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Registrar movimiento
      </h2>

      <select
  className="border border-gray-300 p-2 rounded-lg w-full mb-4 text-black bg-white"
  onChange={(e) => setTipo(e.target.value)}
>
        <option value="">Selecciona tipo</option>
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
        <option value="transferencia">Transferencia</option>
      </select>

      {tipo === "transferencia" && (
        <div>
          <p className="text-gray-600 mb-2">Tienda destino:</p>
          <select className="border border-gray-300 p-2 rounded-lg w-full">
            <option>Tienda 1</option>
            <option>Tienda 2</option>
          </select>
        </div>
      )}
    </div>
  );
}

/* ================= ORDENES ================= */
function Ordenes() {
  const [verQR, setVerQR] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Órdenes y QR
      </h2>

      <button
        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
        onClick={() => setVerQR(true)}
      >
        Generar QR
      </button>

      {verQR && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <QRCode value="Orden123" />
          </div>

          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded-lg"
            onClick={() => setVerQR(false)}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}