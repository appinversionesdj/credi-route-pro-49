/**
 * ============================================================
 * PALETA DE COLORES CREDITFLOW - CONSTANTES
 * 
 * Este archivo centraliza todos los colores de la aplicación.
 * Para cambiar los colores, modifica los valores en este archivo
 * y también actualiza los valores correspondientes en:
 * 
 * - src/index.css (variables CSS HSL)
 * - tailwind.config.ts (configuración de Tailwind)
 * ============================================================
 */

/**
 * Colores principales de la marca
 * Estos son los colores base que definen la identidad visual
 */
export const BRAND_COLORS = {
  /** Azul grisáceo oscuro para encabezados - #2D3748 */
  primary: '#2D3748',
  
  /** Variante más clara - #4A5568 */
  secondary: '#4A5568',
  
  /** Verde-Azul Turquesa (color distintivo) - #4FD1C5 */
  accent: '#4FD1C5',
} as const

/**
 * Colores de estado para feedback al usuario
 */
export const STATE_COLORS = {
  /** Verde para éxito y confirmaciones */
  success: '#48BB78',
  
  /** Amarillo para advertencias */
  warning: '#ED8936',
  
  /** Rojo para errores y acciones destructivas */
  error: '#F56565',
  
  /** Azul para información */
  info: '#4299E1',
} as const

/**
 * Colores neutrales para UI
 */
export const NEUTRAL_COLORS = {
  /** Fondo principal */
  background: '#F7F7F7',
  
  /** Blanco puro */
  white: '#FFFFFF',
  
  /** Negro puro */
  black: '#000000',
  
  /** Grises */
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const

/**
 * Colores con opacidad para overlays y sombras
 */
export const ALPHA_COLORS = {
  /** Negro con diferentes opacidades */
  blackAlpha: {
    50: 'rgba(0, 0, 0, 0.04)',
    100: 'rgba(0, 0, 0, 0.06)',
    200: 'rgba(0, 0, 0, 0.08)',
    300: 'rgba(0, 0, 0, 0.16)',
    400: 'rgba(0, 0, 0, 0.24)',
    500: 'rgba(0, 0, 0, 0.36)',
    600: 'rgba(0, 0, 0, 0.48)',
    700: 'rgba(0, 0, 0, 0.64)',
    800: 'rgba(0, 0, 0, 0.80)',
    900: 'rgba(0, 0, 0, 0.92)',
  },
  
  /** Blanco con diferentes opacidades */
  whiteAlpha: {
    50: 'rgba(255, 255, 255, 0.04)',
    100: 'rgba(255, 255, 255, 0.06)',
    200: 'rgba(255, 255, 255, 0.08)',
    300: 'rgba(255, 255, 255, 0.16)',
    400: 'rgba(255, 255, 255, 0.24)',
    500: 'rgba(255, 255, 255, 0.36)',
    600: 'rgba(255, 255, 255, 0.48)',
    700: 'rgba(255, 255, 255, 0.64)',
    800: 'rgba(255, 255, 255, 0.80)',
    900: 'rgba(255, 255, 255, 0.92)',
  },
} as const

/**
 * Colores específicos para componentes financieros
 */
export const FINANCIAL_COLORS = {
  /** Color para montos positivos (ingresos, cobros) */
  positive: STATE_COLORS.success,
  
  /** Color para montos negativos (gastos, préstamos) */
  negative: STATE_COLORS.error,
  
  /** Color para montos neutros o pendientes */
  neutral: NEUTRAL_COLORS.gray[500],
  
  /** Color para resaltar valores importantes */
  highlight: BRAND_COLORS.accent,
} as const

/**
 * Colores para gráficos y visualizaciones
 */
export const CHART_COLORS = {
  primary: BRAND_COLORS.accent,
  secondary: BRAND_COLORS.primary,
  tertiary: BRAND_COLORS.secondary,
  success: STATE_COLORS.success,
  warning: STATE_COLORS.warning,
  danger: STATE_COLORS.error,
  info: STATE_COLORS.info,
} as const

/**
 * Gradientes predefinidos
 */
export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.secondary})`,
  accent: `linear-gradient(135deg, ${BRAND_COLORS.accent}, ${BRAND_COLORS.secondary})`,
  success: `linear-gradient(135deg, ${STATE_COLORS.success}, #38A169)`,
  card: 'linear-gradient(145deg, #FFFFFF, #FEFEFE)',
} as const

/**
 * Función helper para convertir HEX a RGBA
 * @param hex Color en formato hexadecimal
 * @param alpha Valor de opacidad (0-1)
 * @returns String en formato rgba()
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Función helper para obtener color con opacidad
 * @param color Color en formato hexadecimal
 * @param opacity Valor de opacidad (0-100)
 * @returns String en formato rgba()
 */
export function withOpacity(color: string, opacity: number): string {
  return hexToRgba(color, opacity / 100)
}

// Exportar todo en un objeto para fácil acceso
export const COLORS = {
  brand: BRAND_COLORS,
  state: STATE_COLORS,
  neutral: NEUTRAL_COLORS,
  alpha: ALPHA_COLORS,
  financial: FINANCIAL_COLORS,
  chart: CHART_COLORS,
  gradients: GRADIENTS,
} as const

// Tipo para autocompletado
export type ColorPalette = typeof COLORS

