import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"

// Tipos base de Supabase
export type Ruta = Tables<"rutas">
export type RutaInsert = TablesInsert<"rutas">
export type RutaUpdate = TablesUpdate<"rutas">

// Tipo extendido con información calculada
export interface RutaExtendida extends Ruta {
  estadisticas?: {
    totalPrestamos: number
    prestamosActivos: number
    montoTotal: number
    saldoPendiente: number
    carteraVencida: number
    tasaRecuperacion: number
    cobradores: number
  }
  cobradores?: {
    id: string
    nombre: string
    apellido: string
    cedula: string
    telefono?: string
  }[]
}

// Tipo para filtros de búsqueda
export interface RutaFiltros {
  busqueda?: string
  estado?: string
  empresa_id?: string
  zona_geografica?: string
}

// Tipo para estadísticas de rutas
export interface RutaEstadisticas {
  totalRutas: number
  rutasActivas: number
  rutasInactivas: number
  totalCartera: number
  saldoPendiente: number
  carteraVencida: number
  tasaRecuperacionPromedio: number
  cobradores: number
}

// Tipo para base diaria
export interface BaseDiaria {
  id: string
  ruta_id: string
  cobrador_id: string
  fecha: string
  monto_base_entregado: number
  monto_devuelto: number
  estado: string
  hora_inicio?: string
  hora_fin?: string
  observaciones?: string
  cobrador?: {
    nombre: string
    apellido: string
  }
}