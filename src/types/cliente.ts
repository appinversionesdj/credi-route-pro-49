import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"

export type Cliente = Tables<"deudores">
export type ClienteInsert = TablesInsert<"deudores">
export type ClienteUpdate = TablesUpdate<"deudores">

// Resultado del SP get_clientes_tabla
export interface ClienteTablaRow {
  id: string
  nombre: string
  apellido: string
  cedula: number
  telefono: string | null
  direccion: string | null
  ocupacion: string | null
  estado: string | null
  fecha_nacimiento: string | null
  foto_url: string | null
  foto_cedula_url: string | null
  foto_residencia_url: string | null
  fecha_creacion: string | null
  prestamos_activos: number
  total_deuda: number
  ultimo_pago: string | null
  nombre_ruta: string | null
}

// Resultado del SP get_clientes_estadisticas
export interface ClienteEstadisticasSP {
  total_clientes: number
  clientes_activos: number
  clientes_morosos: number
  clientes_inactivos: number
  prestamos_activos: number
  deuda_total: number
}

// Legado — mantener para compatibilidad con FormularioCliente
export interface ClienteExtendido extends Cliente {
  prestamosActivos?: number
  totalDeuda?: number
  ultimoPago?: string | null
  ruta?: string
}

export interface ClienteFiltros {
  busqueda?: string
  estado?: string
}

export interface ClienteEstadisticas {
  totalClientes: number
  clientesActivos: number
  clientesMorosos: number
  deudaTotal: number
  prestamosActivos: number
}
