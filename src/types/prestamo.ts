import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"

// Tipos base de Supabase
export type Prestamo = Tables<"prestamos">
export type PrestamoInsert = TablesInsert<"prestamos">
export type PrestamoUpdate = TablesUpdate<"prestamos">

// Tipo extendido con información calculada y del cliente
export interface PrestamoExtendido extends Prestamo {
  cliente?: {
    id: string
    nombre: string
    apellido: string
    cedula: number
    telefono?: string
    direccion?: string
  }
  cuotasPagadas?: number
  cuotasTotales?: number
  saldoPendiente?: number
  proximaFecha?: string
  progreso?: number
}

// Tipo para filtros de búsqueda
export interface PrestamoFiltros {
  busqueda?: string
  estado?: string
  ruta_id?: string
  empresa_id?: string
  fecha_desde?: string
  fecha_hasta?: string
}

// Tipo para estadísticas de préstamos
export interface PrestamoEstadisticas {
  totalPrestamos: number
  prestamosActivos: number
  prestamosVencidos: number
  prestamosPagados: number
  carteraTotal: number
  saldoPendiente: number
  montoPorVencer: number
  promedioCuota: number
}

// Tipo para cronograma de pagos
export interface CronogramaPago {
  id: string
  prestamo_id: string
  numero_cuota: number
  fecha_vencimiento: string
  valor_cuota: number
  valor_capital: number
  valor_interes: number
  valor_pagado?: number
  saldo_pendiente: number
  estado?: string
  fecha_pago?: string
}
