import { useComputedColorScheme } from "@mantine/core";
import { Toaster } from "sonner";

/** Toaster global sincronizado con el esquema de color activo de Mantine. */
export default function AppToaster() {
  const colorScheme = useComputedColorScheme("dark");

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={colorScheme}
      toastOptions={{
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: "0.875rem",
          borderRadius: "6px",
          border: "1px solid var(--ds-border)",
          background: "var(--ds-surface)",
          color: "var(--ds-text)",
        },
      }}
    />
  );
}
