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
      <MantineProvider defaultColorScheme="dark">
        <AuthProvider>
          <App />
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                borderRadius: "6px",
                border: "1px solid #E0E0E0",
                background: "#FFFFFF",
                color: "#111111",
              },
            }}
          />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
);
