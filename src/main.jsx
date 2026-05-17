import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Toaster } from "sonner";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider forceColorScheme="dark">
        <AuthProvider>
          <App />
          <Toaster
            position="bottom-right"
            richColors
            theme="dark"
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
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
);
