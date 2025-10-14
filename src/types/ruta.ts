export interface Ruta {
  id: string
  nombre_ruta: string
  descripcion?: string
  zona_geografica?: string
  estado: string
  fecha_creacion: string
  fecha_actualizacion: string
  empresa_id: string
  usuario_id: string
  inversion_ruta?: number
}

export interface RutaExtendida extends Ruta {
  cobrador?: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
  }
  estadisticas: RutaEstadisticas
  baseDiaria?: {
    id: string
    fecha: string
    monto_base_entregado: number
    monto_devuelto: number
    estado: string
  }
}

export interface DatosSemana {
  semana: string
  prestado: number
  cobrado: number
  gastos: number
  fechaInicio: string
  fechaFin: string
}

export interface RutaEstadisticas {
  totalPrestamos: number
  prestamosActivos: number
  prestamosVencidos: number
  prestamosPagados: number
  carteraTotal: number
  saldoPendiente: number
  montoPorVencer: number
  promedioCuota: number
  rentabilidad: number
  eficienciaCobro: number
  clientesActivos: number
  clientesMorosos: number
  caja: number // Dinero disponible en la ruta
  segurosRecogidos: number // Total de seguros recogidos
  totalPrestado: number // Suma de monto_principal
  totalCobrado: number // Suma de (monto_total - saldo_pendiente)
  totalGastos: number // Suma de gastos diarios de la ruta
  datosPorSemana: DatosSemana[] // Datos agrupados por semana
}

export interface RutaInsert {
  nombre_ruta: string
  descripcion?: string
  zona_geografica?: string
  estado?: 'activa' | 'inactiva' | 'suspendida'
  usuario_id?: string
  inversion_ruta?: number
}

export interface RutaUpdate {
  nombre_ruta?: string
  descripcion?: string
  zona_geografica?: string
  estado?: 'activa' | 'inactiva' | 'suspendida'
  inversion_ruta?: number
}

export interface RutaFiltros {
  estado?: string
  zona_geografica?: string
  busqueda?: string
}

export interface BaseDiaria {
  id: string
  cobrador_id: string
  ruta_id: string
  fecha: string
  monto_base_entregado: number
  hora_inicio?: string
  supervisor_entrega?: string
  hora_fin?: string
  monto_devuelto: number
  supervisor_recibe?: string
  estado: string
  observaciones?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ConciliacionDiaria {
  id: string
  base_diaria_id: string
  monto_base_entregado: number
  total_cobros_programados: number
  total_cobros_realizados: number
  cantidad_cobros_realizados: number
  total_prestamos_nuevos: number
  cantidad_prestamos_nuevos: number
  total_gastos: number
  total_gastos_aprobados: number
  total_gastos_pendientes: number
  cantidad_gastos: number
  dinero_efectivamente_devuelto: number
  dinero_teorico_devolver: number
  diferencia: number
  estado_conciliacion: string
  observaciones_cierre?: string
  justificacion_diferencia?: string
  fecha_conciliacion: string
  conciliado_por?: string
}
