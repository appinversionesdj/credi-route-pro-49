// ============================================================================
// UTILIDADES CONTABLES — LÓGICA FINANCIERA DEL SISTEMA
// ============================================================================

export const NOMBRES_MOVIMIENTOS_CAPITAL = ['Dividendos', 'Saldar Ruta']
export const NOMBRE_NOMINA = 'Nomina'

export interface DetalleGasto {
  nombre: string
  monto: number
}

export interface ResultadoPyG {
  interesesAcumulados: number
  segurosCobrados: number
  utilidadBruta: number
  gastosVariables: number
  gastosNomina: number
  gastosAdministrativos: number
  totalGastos: number
  utilidadOperativa: number
  movimientosCapital: number
  utilidadNeta: number
  detalleGastos: DetalleGasto[]
  detalleMovimientosCapital: DetalleGasto[]
}

export interface DatosRutaDashboard {
  rutaId: string
  nombreRuta: string
  // Período
  prestamosRealizados: number
  montoPrestado: number
  cobros: number
  seguros: number
  // Totales históricos
  cartera: number
  caja: number
  cajaActual: number
  intereses: number
  // Gastos del período
  gastosVariables: number
  gastosNomina: number
  gastosAdministrativos: number
  movimientosCapital: number
  totalGastos: number
  // PyG
  utilidadBruta: number
  utilidadOperativa: number
  utilidadNeta: number
  // Salud
  tasaMorosidad: number
  prestamosActivos: number
  prestamosVencidos: number
  prestamosPagados: number
  montoPagado: number
  clientesActivos: number
  inversionTotal: number
  valorSaldado: number
  devolucionRuta: number
}

export interface DatosSemanaChart {
  semana: string
  cobros: number
  prestados: number
  gastos: number
  utilidad: number
  cartera: number
}

/**
 * Fórmula de interés acumulado por "buckets".
 * El interés de una cuota solo se cuenta como utilidad cuando el capital
 * de esa cuota ya fue cubierto por el pago del cliente.
 *
 * totalPagado = monto_total - saldo_pendiente (ya disponible en la tabla prestamos)
 */
export function calcularInteresAcumulado(
  totalPagado: number,
  valorCuota: number,
  montoPrincipal: number,
  montoTotal: number
): number {
  if (valorCuota <= 0 || montoTotal <= montoPrincipal || totalPagado <= 0) return 0

  const factorCapital = montoPrincipal / montoTotal
  const cuotaCap = valorCuota * factorCapital
  const cuotaInt = valorCuota - cuotaCap

  const cuotasCompletas = Math.floor(totalPagado / valorCuota)
  const dineroIncompleto = totalPagado % valorCuota

  return Math.round(
    cuotasCompletas * cuotaInt + Math.max(0, dineroIncompleto - cuotaCap)
  )
}

/**
 * Calcula el interés ganado en un período específico para un préstamo.
 * Usa la diferencia del acumulado al inicio vs. fin del período.
 */
export function calcularInteresPeriodo(
  totalPagadoActual: number,     // monto_total - saldo_pendiente (a hoy)
  cobrosEnPeriodo: number,        // pagos recibidos en el período para este préstamo
  valorCuota: number,
  montoPrincipal: number,
  montoTotal: number
): number {
  const totalPagadoAntes = Math.max(0, totalPagadoActual - cobrosEnPeriodo)
  const interesActual = calcularInteresAcumulado(totalPagadoActual, valorCuota, montoPrincipal, montoTotal)
  const interesAntes = calcularInteresAcumulado(totalPagadoAntes, valorCuota, montoPrincipal, montoTotal)
  return Math.max(0, interesActual - interesAntes)
}

/**
 * Consolida el PyG a partir de los datos de rutas y el detalle de gastos.
 */
export function construirPyG(
  datos: DatosRutaDashboard[],
  gastosRelacionados: any[],
  tiposGasto: Record<string, { nombre: string }>
): ResultadoPyG {
  const interesesAcumulados = datos.reduce((s, d) => s + d.intereses, 0)
  const segurosCobrados = datos.reduce((s, d) => s + d.seguros, 0)
  const utilidadBruta = interesesAcumulados + segurosCobrados

  const gastosVariables = datos.reduce((s, d) => s + d.gastosVariables, 0)
  const gastosNomina = datos.reduce((s, d) => s + d.gastosNomina, 0)
  const gastosAdministrativos = datos.reduce((s, d) => s + d.gastosAdministrativos, 0)
  const movimientosCapital = datos.reduce((s, d) => s + d.movimientosCapital, 0)

  // El cargo fijo admin ha sido eliminado por solicitud del usuario
  const totalGastos = gastosVariables + gastosNomina + gastosAdministrativos

  const utilidadOperativa = utilidadBruta - totalGastos
  const utilidadNeta = utilidadOperativa - movimientosCapital

  // Construir el detalle granular de gastos
  const mapaDetalle = new Map<string, number>()

  for (const g of gastosRelacionados) {
    const tipo = tiposGasto[g.tipo_gasto_id]
    if (!tipo) continue

    // Ignorar movimientos de capital en el detalle de gastos operativos (se muestran aparte)
    if (NOMBRES_MOVIMIENTOS_CAPITAL.includes(tipo.nombre)) continue

    const nombre = tipo.nombre
    const monto = Number(g.monto) || 0

    const actual = mapaDetalle.get(nombre) || 0
    mapaDetalle.set(nombre, actual + monto)
  }

  // Construir el detalle de movimientos de capital con nombre de ruta
  const routeNames = new Map(datos.map((d) => [d.rutaId, d.nombreRuta]))
  const mapaMovimientos = new Map<string, number>()

  for (const g of gastosRelacionados) {
    const tipo = tiposGasto[g.tipo_gasto_id]
    if (!tipo) continue

    if (NOMBRES_MOVIMIENTOS_CAPITAL.includes(tipo.nombre)) {
      const rutaNombre = routeNames.get(g.ruta_id) || 'Ruta desconocida'
      const label = `${tipo.nombre} - ${rutaNombre}`
      const monto = Number(g.monto) || 0

      const actual = mapaMovimientos.get(label) || 0
      mapaMovimientos.set(label, actual + monto)
    }
  }

  const detalleGastos: DetalleGasto[] = Array.from(mapaDetalle.entries())
    .map(([nombre, monto]) => ({
      nombre,
      monto,
    }))
    .sort((a, b) => b.monto - a.monto) // Ordenar por monto descendente

  return {
    interesesAcumulados,
    segurosCobrados,
    utilidadBruta,
    gastosVariables,
    gastosNomina,
    gastosAdministrativos,
    totalGastos,
    utilidadOperativa,
    movimientosCapital,
    utilidadNeta,
    detalleGastos,
    detalleMovimientosCapital: Array.from(mapaMovimientos.entries())
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto),
  }
}

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

export function formatCOP(value: number): string {
  return formatCOPFull(value)
}

export function formatCOPFull(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getMesLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
}
