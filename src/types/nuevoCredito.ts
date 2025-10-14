export interface ClienteFormData {
  nombre: string
  apellido: string
  cedula: string
  telefono?: string
  direccion?: string
  ocupacion?: string
  referencias?: {
    nombre: string
    telefono: string
    parentesco: string
  }[]
}

export interface PrestamoFormData {
  ruta_id: string
  monto_principal: number
  tasa_interes: number
  valor_seguro?: number
  periodicidad: 'diario' | 'semanal' | 'quincenal' | 'mensual' | ''
  numero_cuotas: number
  fecha_desembolso: string
  dia_pago_semanal?: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado'
  observaciones?: string
}

export interface NuevoCreditoData {
  cliente: ClienteFormData
  prestamo: PrestamoFormData
}

export interface CalculosPrestamo {
  numero_prestamo: string
  monto_total: number
  valor_cuota: number
  fecha_primer_pago: string
  interes_total: number
}

export interface Ruta {
  id: string
  nombre_ruta: string
  descripcion?: string
  zona_geografica?: string
}

export interface ClienteExistente {
  id: string
  nombre: string
  apellido: string
  cedula: number
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  ocupacion?: string
  referencias?: any[]
}
