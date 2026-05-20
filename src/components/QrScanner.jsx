import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

/**
 * Componente de escáner QR/barcode que funciona en móvil y desktop.
 *
 * Props:
 *   onScan(text: string)  — se llama cuando se detecta un código
 *   onError(err: Error)   — se llama si no se puede acceder a la cámara
 *   width, height         — dimensiones del video (por defecto "100%")
 */
export default function QrScanner({ onScan, onError, width = "100%", height = "100%" }) {
  const videoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let stream = null;
    let codeReader = null;
    let controls = null;
    let cancelled = false;

    const start = async () => {
      // 1. Verificar contexto seguro (HTTPS o localhost)
      // if (!window.isSecureContext) {
      //   const err = new Error(
      //     "La cámara requiere HTTPS. Abre la app desde una dirección segura (https://)."
      //   );
      //   err.name = "InsecureContextError";
      //   setCameraError(err);
      //   if (onError) onError(err);
      //   return;
      //}

      // 2. Verificar que la API existe
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const err = new Error(
          "Tu navegador no soporta acceso a la cámara. Prueba con Chrome o Safari actualizados."
        );
        err.name = "NotSupportedError";
        setCameraError(err);
        if (onError) onError(err);
        return;
      }

      try {
        // 3. Pedir acceso a la cámara trasera (o la disponible en desktop)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // 4. Asignar el stream al elemento de video
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => { }); // play() puede ser interrumpido, no es crítico

        // 5. Iniciar el lector de códigos sobre el stream
        codeReader = new BrowserMultiFormatReader();
        codeReader.timeBetweenDecodingAttempts = 150;

        // decodeFromStream maneja el video element internamente con nuestro stream
        controls = await codeReader.decodeFromStream(stream, video, (result, err) => {
          if (cancelled) return;
          if (result) {
            const text =
              typeof result.getText === "function"
                ? result.getText()
                : String(result);
            if (text) onScan(text);
          }
          // NotFoundException es normal (ningún código en el frame), se ignora
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[QrScanner] decode warn:", err);
          }
        });

        if (cancelled && controls) {
          try { controls.stop(); } catch (_) { }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[QrScanner] camera error:", err);
        setCameraError(err);
        if (onError) onError(err);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (controls) {
        try { controls.stop(); } catch (_) { }
      }
      // Detener el lector (esto también detiene el stream interno)
      if (codeReader) {
        try { codeReader.reset(); } catch (_) { }
      }
      // Detener las pistas del stream como seguro adicional
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Error state ─────────────────────────────────────────────────────────────
  if (cameraError) {
    let icon = "📵";
    let title = "Sin acceso a la cámara";
    let message = cameraError.message;

    if (cameraError.name === "InsecureContextError") {
      icon = "🔒";
      title = "Se requiere HTTPS";
    } else if (cameraError.name === "NotAllowedError") {
      icon = "🚫";
      title = "Permiso denegado";
      message =
        "Habilita el acceso a la cámara en la configuración de tu navegador e intenta de nuevo.";
    } else if (cameraError.name === "NotFoundError") {
      icon = "📷";
      title = "Cámara no encontrada";
      message = "No se detectó ninguna cámara en este dispositivo.";
    }

    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          background: "var(--ds-bg, #111)",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "36px" }}>{icon}</span>
        <strong style={{ color: "#ef4444", fontSize: "15px" }}>{title}</strong>
        <span
          style={{ color: "var(--ds-muted, #888)", fontSize: "12px", lineHeight: 1.5 }}
        >
          {message}
        </span>
      </div>
    );
  }

  // ── Video ────────────────────────────────────────────────────────────────────
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline /* imprescindible en iOS Safari para reproducción inline */
      style={{
        width,
        height,
        objectFit: "cover",
        display: "block",
        borderRadius: "8px",
        background: "#000",
      }}
    />
  );
}
