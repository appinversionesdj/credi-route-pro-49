# 🎨 Guía de Colores - CrediRoute Pro

Esta guía explica cómo funciona el sistema de colores de la aplicación y cómo cambiarlos de forma centralizada.

## 📍 Archivos Principales

Para cambiar los colores de toda la aplicación, debes editar estos **3 archivos**:

### 1. 📄 `src/index.css` (Variables CSS)
**Ubicación**: `src/index.css`

Este archivo contiene las variables CSS en formato HSL que usa toda la aplicación a través de Tailwind CSS.

```css
/* COLORES PRINCIPALES - Edita estos valores */

/* Primary: #2D3748 (Azul grisáceo oscuro) */
--primary: 211 20% 24%;

/* Secondary: #4A5568 (Gris azulado) */
--secondary: 214 13% 35%;

/* Accent: #4FD1C5 (Verde-Azul Turquesa) */
--accent: 174 62% 57%;
```

**✏️ Para cambiar:** Reemplaza los valores HSL manteniendo el formato: `H S% L%`

### 2. 📄 `tailwind.config.ts` (Configuración de Tailwind)
**Ubicación**: `tailwind.config.ts`

Contiene los colores en formato HEX para uso directo en clases de Tailwind.

```typescript
colors: {
  brand: {
    primary: "#2D3748",      // Azul grisáceo oscuro
    secondary: "#4A5568",    // Variante más clara
    accent: "#4FD1C5",       // Verde-Azul Turquesa
  },
}
```

**✏️ Para cambiar:** Reemplaza los valores hexadecimales (`#RRGGBB`)

### 3. 📄 `src/lib/colors.ts` (Constantes TypeScript)
**Ubicación**: `src/lib/colors.ts`

Constantes de colores para uso en JavaScript/TypeScript.

```typescript
export const BRAND_COLORS = {
  primary: '#2D3748',
  secondary: '#4A5568',
  accent: '#4FD1C5',
} as const
```

**✏️ Para cambiar:** Reemplaza los valores hexadecimales

---

## 🎨 Paleta de Colores Actual

### Colores de Marca

| Nombre | Hex | Vista Previa | Uso |
|--------|-----|--------------|-----|
| **Primary** | `#2D3748` | ![#2D3748](https://via.placeholder.com/100x30/2D3748/FFFFFF?text=Primary) | Encabezados, sidebar, textos principales |
| **Secondary** | `#4A5568` | ![#4A5568](https://via.placeholder.com/100x30/4A5568/FFFFFF?text=Secondary) | Subtítulos, elementos secundarios |
| **Accent** | `#4FD1C5` | ![#4FD1C5](https://via.placeholder.com/100x30/4FD1C5/000000?text=Accent) | Botones, enlaces, highlights |

### Colores de Estado

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Success** | `#48BB78` | Confirmaciones, cobros, éxito |
| **Warning** | `#ED8936` | Advertencias, alertas |
| **Error** | `#F56565` | Errores, préstamos, gastos |
| **Info** | `#4299E1` | Información general |

---

## 🛠️ Cómo Usar los Colores

### 1️⃣ En Componentes con Tailwind CSS

#### Usando colores de marca (brand):
```tsx
// Primary
<div className="bg-brand-primary text-white">
  Fondo Primary
</div>

// Secondary
<h2 className="text-brand-secondary">
  Título Secondary
</h2>

// Accent
<button className="bg-brand-accent hover:bg-brand-accent/90">
  Botón Accent
</button>
```

#### Usando colores del sistema:
```tsx
// Primary (desde CSS variables)
<div className="bg-primary text-primary-foreground">
  Elemento principal
</div>

// Accent
<div className="bg-accent text-accent-foreground">
  Elemento de acento
</div>

// Success
<Badge className="bg-success text-success-foreground">
  Éxito
</Badge>
```

### 2️⃣ En JavaScript/TypeScript

```typescript
import { COLORS } from '@/lib/colors'

// Acceder a colores
const primaryColor = COLORS.brand.primary  // '#2D3748'
const accentColor = COLORS.brand.accent    // '#4FD1C5'
const successColor = COLORS.state.success  // '#48BB78'

// Usar en estilos inline
<div style={{ backgroundColor: COLORS.brand.primary }}>
  Elemento con color primary
</div>

// Con opacidad
import { withOpacity } from '@/lib/colors'

const colorWithAlpha = withOpacity(COLORS.brand.accent, 50) // 50% opacidad
```

### 3️⃣ En Recharts (Gráficos)

```typescript
import { CHART_COLORS } from '@/lib/colors'

<BarChart>
  <Bar dataKey="cobros" fill={CHART_COLORS.success} />
  <Bar dataKey="prestamos" fill={CHART_COLORS.danger} />
  <Bar dataKey="total" fill={CHART_COLORS.primary} />
</BarChart>
```

---

## 🔄 Proceso para Cambiar Colores

### Ejemplo: Cambiar el color Accent de Turquesa a Morado

#### **Paso 1:** Elige tu nuevo color
Nuevo color: `#9F7AEA` (Morado)

#### **Paso 2:** Convierte a HSL
Usa una herramienta como [https://www.cssportal.com/css-hex-to-hsl/](https://www.cssportal.com/css-hex-to-hsl/)
- Resultado: `HSL(256, 68%, 70%)`

#### **Paso 3:** Actualiza `src/index.css`
```css
/* Accent: #9F7AEA (Morado) */
--accent: 256 68% 70%;
--accent-foreground: 211 20% 24%;

/* También actualiza el ring y sidebar si usan accent */
--ring: 256 68% 70%;
--sidebar-primary: 256 68% 70%;
--sidebar-ring: 256 68% 70%;
```

#### **Paso 4:** Actualiza `tailwind.config.ts`
```typescript
colors: {
  brand: {
    primary: "#2D3748",
    secondary: "#4A5568",
    accent: "#9F7AEA",  // ← Nuevo color
  },
}
```

#### **Paso 5:** Actualiza `src/lib/colors.ts`
```typescript
export const BRAND_COLORS = {
  primary: '#2D3748',
  secondary: '#4A5568',
  accent: '#9F7AEA',  // ← Nuevo color
} as const
```

#### **Paso 6:** Reinicia el servidor de desarrollo
```bash
npm run dev
```

✅ ¡Listo! Todos los elementos que usan el color accent ahora serán morados.

---

## 🎯 Componentes Afectados por Cada Color

### Primary (`#2D3748`)
- ✅ Sidebar (fondo)
- ✅ Encabezados principales (h1, h2)
- ✅ Textos principales
- ✅ Bordes importantes

### Secondary (`#4A5568`)
- ✅ Sidebar (elementos de acento)
- ✅ Subtítulos
- ✅ Textos secundarios
- ✅ Hover states

### Accent (`#4FD1C5`)
- ✅ Botones principales
- ✅ Enlaces
- ✅ Sidebar (elementos activos)
- ✅ Focus rings
- ✅ Highlights
- ✅ Badges importantes
- ✅ Elementos interactivos

---

## 📚 Herramientas Útiles

### Conversión de Colores
- **HEX → HSL**: [CSS Portal](https://www.cssportal.com/css-hex-to-hsl/)
- **Generador de Paletas**: [Coolors](https://coolors.co/)
- **Contraste**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Inspiración de Colores
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Adobe Color](https://color.adobe.com/)
- [Material Design Colors](https://material.io/design/color/)

---

## ⚠️ Consideraciones Importantes

### ✅ Buenas Prácticas

1. **Mantén la consistencia**: Actualiza los 3 archivos al mismo tiempo
2. **Prueba el contraste**: Asegúrate de que el texto sea legible sobre fondos
3. **Usa variables CSS**: Usa `bg-primary` en lugar de `bg-[#2D3748]`
4. **Modo oscuro**: No olvides actualizar también los colores del modo oscuro en `index.css`

### ❌ Evita

1. ❌ Hardcodear colores directamente: `className="bg-[#2D3748]"`
2. ❌ Usar colores inline sin usar las constantes
3. ❌ Mezclar diferentes tonos del mismo color sin definirlos en la paleta
4. ❌ Usar colores que no cumplan con WCAG AA (mínimo 4.5:1 de contraste)

---

## 🎨 Ejemplos de Paletas Alternativas

### Paleta Azul Corporativa
```typescript
Primary:   #1E3A8A  // Azul marino
Secondary: #3B82F6  // Azul brillante
Accent:    #10B981  // Verde esmeralda
```

### Paleta Moderna Oscura
```typescript
Primary:   #18181B  // Gris muy oscuro
Secondary: #27272A  // Gris oscuro
Accent:    #A855F7  // Morado vibrante
```

### Paleta Cálida
```typescript
Primary:   #7C2D12  // Marrón oscuro
Secondary: #EA580C  // Naranja
Accent:    #FCD34D  // Amarillo dorado
```

---

## 📞 Soporte

Si tienes dudas sobre cómo cambiar los colores, revisa:
1. Este archivo (`COLORS_GUIDE.md`)
2. El archivo de colores: `src/lib/colors.ts`
3. Las variables CSS: `src/index.css`

---

**Última actualización:** 2025
**Versión de la guía:** 1.0

