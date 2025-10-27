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
  estado: 'en_ruta' | 'finalizado' | 'conciliado' | 'auditoria'
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
  total_seguros: number
  dinero_efectivamente_devuelto: number
  dinero_teorico_devolver: number
  diferencia: number
  estado_conciliacion: 'pendiente' | 'cuadrado' | 'sobrante' | 'faltante' | 'auditoria'
  observaciones_cierre?: string
  justificacion_diferencia?: string
  fecha_conciliacion: string
  conciliado_por?: string
  persona_entrega_base?: string
  nombre_persona_entrega?: string
}

export interface ConciliacionExtendida extends ConciliacionDiaria {
  base_diaria?: BaseDiaria
  cobrador?: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
  }
  ruta?: {
    id: string
    nombre_ruta: string
    zona_geografica?: string
  }
  persona_entrega?: {
    id: string
    nombre: string
    apellido: string
  }
  conciliado_por_usuario?: {
    id: string
    nombre: string
    apellido: string
  }
}

export interface FormularioConciliacion {
  base_diaria_id: string
  monto_base_entregado: number
  total_seguros: number
  dinero_efectivamente_devuelto: number
  observaciones_cierre?: string
  justificacion_diferencia?: string
  persona_entrega_base?: string
  nombre_persona_entrega?: string
}

export interface ConciliacionFiltros {
  fecha_desde?: string
  fecha_hasta?: string
  cobrador_id?: string
  ruta_id?: string
  estado_conciliacion?: string
  busqueda?: string
}

export interface EstadisticasConciliacion {
  total_conciliaciones: number
  total_cuadradas: number
  total_sobrantes: number
  total_faltantes: number
  total_pendientes: number
  total_diferencia: number
  promedio_diferencia: number
  mayor_sobrante: number
  mayor_faltante: number
}

