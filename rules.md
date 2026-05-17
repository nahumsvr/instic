# Reglas del Proyecto — instic

Este archivo define las restricciones tecnológicas que **todos los agentes y desarrolladores** deben respetar al trabajar en este proyecto. No se permite usar librerías, patrones o soluciones que contradigan las reglas aquí definidas.

---

## Stack Tecnológico

### Framework

- **React 19** con **Vite** como bundler.
- Usar JSX (`.jsx`) para todos los componentes.

### Estilos

- Usar **Tailwind CSS v4** para los estilos utilitarios.
- El plugin oficial `@tailwindcss/vite` está registrado en `vite.config.js`.
- La directiva `@import "tailwindcss"` está en `src/index.css`; no agregar directivas adicionales.
- Se permite combinar clases de Tailwind con CSS personalizado en `index.css` o módulos CSS, pero Tailwind es la herramienta principal.

---

## 1. Enrutamiento — React Router

- Usar **React Router** (`react-router-dom`) para toda la navegación.
- Definir rutas en un archivo central (p.ej. `src/router.jsx` o dentro de `src/App.jsx`).
- Usar `<BrowserRouter>`, `<Routes>` y `<Route>` como estructura base.
- Para navegación programática usar el hook `useNavigate`.
- Para parámetros de ruta usar el hook `useParams`.
- **No usar** ninguna otra librería de enrutamiento (e.g. Wouter, TanStack Router).

```jsx
// Ejemplo correcto
import { BrowserRouter, Routes, Route } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</BrowserRouter>;
```

---

## 2. Estado y Peticiones HTTP — useState + fetch

- El manejo de estado local se hace **exclusivamente** con el hook `useState` de React.
- Las peticiones HTTP se hacen con la **API nativa `fetch`**, siempre dentro de un `useEffect` o en un manejador de eventos.
- Para estado global ligero se puede usar `useContext` + `useReducer`.
- **No usar** librerías externas de estado (Redux, Zustand, Jotai, etc.).
- **No usar** librerías de fetching (Axios, React Query, SWR, etc.).
- **Toda** petición `fetch` **debe** incluir manejo de errores (ver sección 7).

```jsx
// Ejemplo correcto — con manejo de errores obligatorio
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resource");
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## 3. Lector de QR — @zxing/react-scanner

- Para cualquier funcionalidad de **lectura de códigos QR o de barras**, usar exclusivamente la librería `@zxing/react-scanner`.
- **No usar** alternativas como `html5-qrcode`, `react-qr-reader`, ni implementaciones manuales con la cámara.
  https://github.com/tldkhang/react-zxing-scanner

```jsx
// Ejemplo correcto
import { BarcodeScanner } from "@zxing/react-scanner";

<BarcodeScanner onScan={(result) => console.log(result)} />;
```

---

## 4. Iconos — Gravity UI Icons

- Usar el sistema de iconos de **Gravity UI** para todos los íconos de la interfaz.
- Repositorio e ícono browser: https://gravity-ui.com/es/icons
- Importar cada ícono individualmente para optimizar el bundle.
- **No usar** otras librerías de íconos (FontAwesome, Lucide, HeroIcons, etc.).

```jsx
// Ejemplo correcto
import { Person } from "@gravity-ui/icons";

<Person width={20} height={20} />;
```

---

## 5. Librería de Componentes — Mantine UI

- Usar **Mantine UI** como librería de componentes base para toda la interfaz.
- Referencia de componentes: https://ui.mantine.dev/
- Documentación: https://mantine.dev/
- Envolver la aplicación en `<MantineProvider>` en el punto de entrada (`main.jsx`).
- **No usar** otras librerías de componentes (MUI, Chakra UI, Ant Design, shadcn/ui, etc.).
- Los estilos globales de Mantine deben importarse en el entry point:
  ```jsx
  import "@mantine/core/styles.css";
  ```

```jsx
// Ejemplo correcto
import { Button, TextInput } from '@mantine/core';

<Button variant="filled" color="blue">Guardar</Button>
<TextInput label="Nombre" placeholder="Ingresa tu nombre" />
```

---

## 6. Gráficos — Recharts

- Usar **Recharts** para todos los gráficos y visualizaciones de datos.
- Documentación: https://recharts.org/
- **No usar** otras librerías de gráficos (Chart.js, Victory, ApexCharts, D3 directamente, etc.).

```jsx
// Ejemplo correcto
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

<LineChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>;
```

---

## 7. Manejo de Errores

**Todo el código debe incluir manejo de errores explícito.** No se permite ignorar ni silenciar errores.

### Reglas obligatorias

- Toda petición `fetch` debe estar envuelta en un bloque `try/catch`.
- Verificar siempre `res.ok` antes de procesar la respuesta; si es `false`, lanzar un `Error` con el código de estado.
- Mantener tres estados para operaciones asíncronas: `data`, `loading` y `error`.
- Mostrar al usuario un mensaje claro cuando ocurra un error usando `toast` de **sonner**.
- **Nunca** usar `console.error` como único manejo de errores — debe acompañarse de retroalimentación visual.
- En formularios, manejar errores de validación y mostrarlos usando `toast` de **sonner**.
- Los errores de red (sin conexión, timeout) deben comunicarse al usuario con un mensaje descriptivo.

### Patrón estándar para peticiones HTTP

```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/endpoint");
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    const json = await res.json();
    setData(json);
  } catch (err) {
    setError(err.message); // Mostrar en UI, no solo en consola
  } finally {
    setLoading(false);
  }
};
```

### Ejemplo de retroalimentación visual con Mantine

```jsx
import { Alert, Loader } from "@mantine/core";

if (loading) return <Loader />;
if (error)
  return (
    <Alert color="red" title="Error">
      {error}
    </Alert>
  );
```

---

## Resumen de Dependencias Requeridas

| Propósito           | Librería                    | Instalación                                 |
| ------------------- | --------------------------- | ------------------------------------------- |
| Enrutamiento        | `react-router-dom`          | `npm install react-router-dom`              |
| Estado              | `useState` (React built-in) | —                                           |
| HTTP                | `fetch` (Web API nativa)    | —                                           |
| Lector QR           | `@zxing/react-scanner`      | `npm install @zxing/react-scanner`          |
| Iconos              | `@gravity-ui/icons`         | `npm install @gravity-ui/icons`             |
| Componentes UI      | `@mantine/core`             | `npm install @mantine/core @mantine/hooks`  |
| Gráficos            | `recharts`                  | `npm install recharts`                      |
| Estilos utilitarios | `tailwindcss`               | `npm install tailwindcss @tailwindcss/vite` |
| Notificaciones      | `sonner`                    | `npm install sonner`                        |

---

## Reglas Generales

1. **No instalar** dependencias que no estén listadas en este archivo sin aprobación explícita.
2. **Documentar** cualquier excepción justificada directamente en este archivo.
3. Mantener el código en **español** para comentarios y documentación interna.
4. Todos los componentes deben ser **funcionales** (no usar class components).
5. Usar **ESModules** (`import`/`export`), nunca `require`.
6. **Manejo de errores obligatorio**: todo `fetch`, toda operación asíncrona y todo formulario deben incluir manejo de errores con retroalimentación visual al usuario. No se acepta código que ignore o silencie errores.
   - Para **errores de API, confirmaciones globales y validación de formularios**, usar `toast` de **sonner** (`toast.error()`, `toast.success()`, `toast.warning()`).
   - El componente `<Toaster />` debe estar montado una sola vez en `main.jsx`.
