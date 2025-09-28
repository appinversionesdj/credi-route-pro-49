import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"

// Tipos base de Supabase
export type Cliente = Tables<"deudores">
export type ClienteInsert = TablesInsert<"deudores">
export type ClienteUpdate = TablesUpdate<"deudores">

// Tipo extendido con información calculada
export interface ClienteExtendido extends Cliente {
  prestamosActivos?: number
  totalDeuda?: number
  ultimoPago?: string | null
  ruta?: string
}

// Tipo para filtros de búsqueda
export interface ClienteFiltros {
  busqueda?: string
  estado?: string
  ruta?: string
  empresa_id?: string
}

// Tipo para estadísticas de clientes
export interface ClienteEstadisticas {
  totalClientes: number
  clientesActivos: number
  clientesMorosos: number
  deudaTotal: number
  prestamosActivos: number
}
