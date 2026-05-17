# Design System — Instic

Sistema de diseño de referencia para todos los componentes de la interfaz.
Toda decisión visual debe basarse en este documento antes de escribir código.

---

## Filosofía de Diseño

> **Minimalismo con propósito.** La interfaz es invisible; los datos son protagonistas.

- **Base monocromática:** casi todo en blanco y negro.
- **Acentos selectivos:** el color aparece _solo_ donde hay una acción primaria o un estado semántico (alerta, éxito, advertencia). Si todo tiene color, nada tiene color.
- **Densidad cómoda:** suficiente espacio para respirar, sin desperdiciar pantalla.
- **Sin decoración:** sin gradientes arbitrarios, sin sombras pesadas, sin bordes innecesarios. Cada elemento visual tiene una razón de existir.

---

## 1. Paleta de Colores

Todos los colores de la aplicación **deben** consumirse mediante variables CSS (ej. `var(--ds-bg)`). **Está estrictamente prohibido usar valores hexadecimales hardcodeados en los archivos `.jsx`**. Las variables reaccionan automáticamente al esquema de color activo (light/dark) gracias a `[data-mantine-color-scheme]`.

### Base (90 % de la UI)

| Token            | Light     | Dark      | Uso                                      |
| ---------------- | --------- | --------- | ---------------------------------------- |
| `--ds-bg`        | `#F5F5F5` | `#111111` | Fondo general de la aplicación           |
| `--ds-surface`   | `#FFFFFF` | `#1A1A1A` | Fondo secundario (cards, inputs)         |
| `--ds-border`    | `#E0E0E0` | `#333333` | Líneas divisoras, bordes de inputs       |
| `--ds-text`      | `#111111` | `#FFFFFF` | Texto principal                          |
| `--ds-muted`     | `#6B6B6B` | `#A3A3A3` | Labels, placeholders, texto secundario   |
| `--ds-subtle`    | `#AAAAAA` | `#666666` | Texto deshabilitado, metadatos           |

### Acento (el único color que "llama la atención")

| Token               | Light     | Dark      | Uso                                              |
| ------------------- | --------- | --------- | ------------------------------------------------ |
| `--ds-accent`       | `#111111` | `#FFFFFF` | Botón primario, focus ring, links activos        |
| `--ds-accent-hover` | `#333333` | `#E5E5E5` | Estado hover del botón primario               |
| `--ds-accent-fg`    | `#FFFFFF` | `#000000` | Texto/ícono encima del acento                    |

> El acento es simplemente el contraste máximo. El contraste es el protagonista.

### Colores Semánticos (para alertas y estados)

Estos colores **solo** se usan en alertas, badges de estado e indicadores. No en botones generales ni fondos.

| Tipo        | Token                | Fondo (L/D)           | Borde (L/D)           | Texto (L/D)           |
| ----------- | -------------------- | --------------------- | --------------------- | --------------------- |
| **Info**    | `--ds-info-*`        | `#EFF6FF` / `#1E3A8A` | `#BFDBFE` / `#1E40AF` | `#1D4ED8` / `#93C5FD` |
| **Éxito**   | `--ds-success-*`     | `#F0FDF4` / `#052E16` | `#BBF7D0` / `#166534` | `#15803D` / `#86EFAC` |
| **Advertencia** | `--ds-warning-*` | `#FFFBEB` / `#451A03` | `#FDE68A` / `#78350F` | `#B45309` / `#FDE047` |
| **Error**   | `--ds-danger-*`      | `#FEF2F2` / `#450A0A` | `#FECACA` / `#7F1D1D` | `#B91C1C` / `#FCA5A5` |

---

## 2. Tipografía

**Fuente principal:** `Inter` (Google Fonts)
**Fuente mono:** `JetBrains Mono` (para códigos, IDs, cantidades)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Escala tipográfica

| Nombre     | Tamaño  | Peso | Uso                                      |
| ---------- | ------- | ---- | ---------------------------------------- |
| `display`  | 2rem    | 700  | Títulos de página (h1)                   |
| `heading`  | 1.25rem | 600  | Encabezados de sección (h2, h3)          |
| `body`     | 0.875rem| 400  | Texto de cuerpo, labels, contenido       |
| `small`    | 0.75rem | 400  | Metadatos, timestamps, texto auxiliar    |
| `mono`     | 0.8125rem| 500 | IDs, cantidades, códigos QR              |

### Reglas

- **Nunca** usar más de 2 tamaños distintos en la misma sección.
- Peso 700 solo para el `<h1>` de la página.
- El texto muted (`--color-muted`) para todo lo que sea secundario.

---

## 3. Espaciado

Sistema de espaciado de base 4px.

| Token   | Valor  | Uso típico                          |
| ------- | ------ | ----------------------------------- |
| `4px`   | `xs`   | Gap entre ícono y label             |
| `8px`   | `sm`   | Padding interno de badges           |
| `12px`  | `md`   | Gap entre inputs en un formulario   |
| `16px`  | `lg`   | Padding de un card                  |
| `24px`  | `xl`   | Separación entre secciones          |
| `32px`  | `2xl`  | Margen de página                    |
| `48px`  | `3xl`  | Separación entre bloques mayores    |

---

## 4. Componentes

### 4.1 Botones

#### Primario
- Fondo: `#111111` · Texto: `#FFFFFF`
- Hover: `#333333`
- Sin borde visible · Border-radius: `6px`
- Tamaño mínimo: `height: 38px · padding: 0 16px`
- Estado `loading`: spinner blanco, texto oculto.

#### Secundario
- Fondo: `transparent` · Texto: `#111111`
- Borde: `1px solid #E0E0E0`
- Hover: fondo `#F5F5F5`

#### Peligro (solo para destructivas)
- Fondo: `transparent` · Texto: `#B91C1C`
- Borde: `1px solid #FECACA`
- Hover: fondo `#FEF2F2`

#### Reglas
- Un solo botón primario por sección/formulario.
- No usar color de acento en botones secundarios.
- Labels en **infinitivo**: `Guardar`, `Eliminar`, `Confirmar`. No `Guardar cambios ✅`.

---

### 4.2 Inputs y Formularios

```
┌─────────────────────────────────┐
│ Label                           │
│ ┌─────────────────────────────┐ │
│ │  [ícono]  placeholder       │ │
│ └─────────────────────────────┘ │
│  Mensaje de error (si aplica)   │
└─────────────────────────────────┘
```

- Fondo: `#F5F5F5` · Borde: `1px solid #E0E0E0`
- Focus: borde `#111111` (sin glow de color)
- Error: borde `#B91C1C` + texto de error en `#B91C1C` debajo del input
- Label: `0.75rem / 500 / #6B6B6B`, siempre encima del input
- Placeholder: `#AAAAAA`
- Border-radius: `6px`

---

### 4.3 Cards

```
┌──────────────────────────────────────┐
│  Título de sección          [acción] │
│  ─────────────────────────────────── │
│  Contenido                           │
└──────────────────────────────────────┘
```

- Fondo: `#FFFFFF`
- Borde: `1px solid #E0E0E0`
- Border-radius: `8px`
- Padding: `24px`
- **Sin sombra** — el borde es suficiente separador visual.
- Sombra solo en modales (`box-shadow: 0 4px 24px rgba(0,0,0,0.08)`).

---

### 4.4 Tablas

- Header: fondo `#F5F5F5` · texto `#111111 / 600`
- Filas: alternadas `#FFFFFF` / `#FAFAFA`
- Borde: `1px solid #E0E0E0` solo horizontal (entre filas)
- Hover de fila: `#F5F5F5`
- Tipografía mono para IDs y cantidades numéricas.

---

### 4.5 Badges / Etiquetas de Estado

Pequeñas píldoras de estado. Usan los colores semánticos de la sección 1.

```
 ● Activo        → fondo #F0FDF4 · texto #15803D · borde #BBF7D0
 ● Pendiente     → fondo #FFFBEB · texto #B45309 · borde #FDE68A
 ● Completado    → fondo #EFF6FF · texto #1D4ED8 · borde #BFDBFE
 ● Cancelado     → fondo #F5F5F5 · texto #6B6B6B · borde #E0E0E0
 ● Error         → fondo #FEF2F2 · texto #B91C1C · borde #FECACA
```

- Font-size: `0.6875rem` · Font-weight: `500`
- Border-radius: `999px` (píldora)
- Padding: `2px 8px`
- El punto `●` es opcional; úsalo solo si el estado es "vivo" (activo/pendiente).

---

### 4.6 Alertas y Notificaciones

Existen dos tipos de retroalimentación según su contexto:

#### A) Alertas inline — `<Alert>` de Mantine

Usar cuando el error está directamente ligado a un formulario o sección visible en pantalla (e.g. error de validación de campos).

```
┌─────────────────────────────────────────────────────┐
│  [ícono]  Título breve                        [✕]  │
│           Descripción o mensaje de apoyo.           │
└─────────────────────────────────────────────────────┘
```

| Tipo       | Fondo     | Borde     | Texto     |
| ---------- | --------- | --------- | --------- |
| `info`     | `#EFF6FF` | `#BFDBFE` | `#1D4ED8` |
| `success`  | `#F0FDF4` | `#BBF7D0` | `#15803D` |
| `warning`  | `#FFFBEB` | `#FDE68A` | `#B45309` |
| `error`    | `#FEF2F2` | `#FECACA` | `#B91C1C` |

- Border-radius: `6px` · Padding: `12px 16px`
- Siempre incluir ícono de Gravity UI Icons.
- El botón de cierre `[✕]` es obligatorio en alertas no críticas.

#### B) Toasts — `sonner`

Usar para **retroalimentación global no bloqueante**: errores de API, confirmaciones de acciones, avisos de red. El toast aparece y desaparece solo; el usuario no necesita interactuar con él.

```jsx
import { toast } from "sonner";

tost.error("Credenciales incorrectas.");   // error de API
toast.success("Guardado correctamente.");  // confirmación
toast.warning("Stock bajo en artículo X."); // advertencia
toast("Operación completada.");             // neutral / info
```

**Configuración del `<Toaster>` en `main.jsx`:**

```jsx
import { Toaster } from "sonner";

// Dentro del árbol de render, una sola vez:
<Toaster
  position="bottom-right"
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
```

**Cuándo usar cada uno:**

| Situación                             | Componente        |
| ------------------------------------- | ----------------- |
| Error de validación de campo          | Inline (debajo del input) |
| Error de respuesta de API             | `toast.error()`   |
| Acción destructiva confirmada         | `toast.success()` |
| Advertencia de negocio (stock, etc.)  | `toast.warning()` |
| Notificación neutral / info           | `toast()`         |

---

### 4.7 Navegación / Sidebar

```
┌────────────────┐
│  INSTIC        │   ← Logotipo / nombre en 700
│                │
│  ○ Dashboard   │   ← Item activo: fondo #F5F5F5 · texto #111111 · borde-left 2px #111111
│  ○ Artículos   │   ← Item normal: texto #6B6B6B
│  ○ Movimientos │
│  ○ Órdenes     │
│                │
│  ─────────     │
│  ○ Salir       │   ← Separado del grupo principal
└────────────────┘
```

- Ancho: `220px` fijo en desktop.
- Fondo sidebar: `#FAFAFA` · Borde derecho: `1px solid #E0E0E0`
- Items: `height: 36px · padding: 0 12px · border-radius: 6px`
- Íconos: `16px × 16px` de Gravity UI Icons, alineados a la izquierda del label.

---

### 4.8 Modales

- Overlay: `rgba(0, 0, 0, 0.4)` con `backdrop-filter: blur(2px)`
- Card: `#FFFFFF · border-radius: 10px · padding: 32px · max-width: 480px`
- Sombra: `0 8px 40px rgba(0,0,0,0.12)`
- Header: `Título (heading) + botón cierre [✕] alineado a la derecha`
- Footer: botones alineados a la derecha — primero el secundario, luego el primario.

---

## 5. Estados de Interacción

| Estado       | Regla visual                                              |
| ------------ | --------------------------------------------------------- |
| `default`    | Tal como se describe en cada componente                   |
| `hover`      | Cambio de fondo o borde, sin animaciones de escala        |
| `focus`      | Borde `#111111` de `2px`, sin glow de color              |
| `disabled`   | Opacidad `0.4`, cursor `not-allowed`, no interactivo      |
| `loading`    | Spinner monocromático (blanco sobre oscuro, negro sobre claro) |
| `empty`      | Texto centrado en `#AAAAAA` + ícono sutil de Gravity UI   |
| `error`      | Borde rojo en input + texto de error debajo              |

---

## 6. Animaciones y Transiciones

- **Duración:** `150ms` para micro-interacciones (hover, focus).
- **Easing:** `ease-in-out` por defecto.
- **Regla de oro:** si la animación dura más de `300ms`, es demasiado larga.
- **Qué animar:** `background-color`, `border-color`, `opacity`, `transform` (solo `translateY` de máx `2px`).
- **Qué NO animar:** `width`, `height`, `font-size`, gradientes complejos.

```css
/* Transición estándar para todos los componentes interactivos */
transition: background-color 150ms ease-in-out,
            border-color 150ms ease-in-out,
            opacity 150ms ease-in-out;
```

---

## 7. Iconografía

- **Librería exclusiva:** Gravity UI Icons (`@gravity-ui/icons`).
- Tamaños permitidos: `14px`, `16px`, `20px`, `24px`.
- Color: heredar del texto circundante (`currentColor`), salvo dentro de badges semánticos.
- **No usar** emojis como íconos de interfaz.

---

## 8. Reglas de Aplicación

1. **El color llama la atención** — si usas color, el usuario asumirá que hay algo importante ahí. No colorees por estética.
2. **Jerarquía por peso tipográfico**, no por color.
3. **Un botón primario por vista** — el resto son secundarios o ghost.
4. **Los errores siempre en rojo semántico** (`#B91C1C`), nunca en el color de acento.
5. **No agregar sombras adicionales** a las definidas aquí.
6. **Soporte Dinámico de Temas** — la interfaz debe soportar modo oscuro y claro de forma automática utilizando las variables CSS `--ds-*`. No se admiten colores hexadecimales fijos.
7. **Consistencia ante creatividad** — preferir lo establecido aquí sobre soluciones ad-hoc.
