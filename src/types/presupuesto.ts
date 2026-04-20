export interface PresupuestoRuta {
  ruta_id: string
  nombre_ruta: string
  presupuesto_total: number
  recaudado: number
  cantidad_cuotas: number
  porcentaje: number
}

export interface PresupuestoItem {
  id: string
  deudor: string
  nombreRuta: string
  ruta_id: string
  valor_prestamo: number
  saldo_pendiente: number
  valor_cuota: number
  monto_esperado: number
  monto_pagado: number
  estado_pago: 'pendiente' | 'parcial' | 'pagado' | 'no_programado' | null
}

export interface PresupuestoDia {
  presupuesto_total: number
  recaudado: number
  porcentaje: number
  rutas: PresupuestoRuta[]
  items: PresupuestoItem[]
}
