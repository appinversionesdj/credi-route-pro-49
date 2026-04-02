import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  calcularInteresPeriodo,
  construirPyG,
  DatosRutaDashboard,
  DatosSemanaChart,
  ResultadoPyG,
  NOMBRES_MOVIMIENTOS_CAPITAL,
  NOMBRE_NOMINA,
} from '@/lib/contabilidad-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardFiltros {
  fechaInicio: string  // YYYY-MM-DD
  fechaFin: string     // YYYY-MM-DD
  rutaIds: string[]    // [] = todas las rutas
}

export interface RutaSimple {
  id: string
  nombre_ruta: string
  estado: string | null
}

export interface DashboardConsolidado {
  prestamosRealizados: number
  montoPrestado: number
  cartera: number
  cobros: number
  caja: number
  cajaActual: number
  seguros: number
  intereses: number
  gastosVariables: number
  gastosNomina: number
  gastosAdministrativos: number
  movimientosCapital: number
  totalGastos: number
  utilidadBruta: number
  utilidadOperativa: number
  utilidadNeta: number
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

export interface DashboardData {
  consolidado: DashboardConsolidado
  porRuta: DatosRutaDashboard[]
  datosSemana: DatosSemanaChart[]
  pyg: ResultadoPyG
}

interface TipoGastoMap {
  [id: string]: { nombre: string }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useDashboard() {
  const [rutas, setRutas] = useState<RutaSimple[]>([])
  const [tiposGasto, setTiposGasto] = useState<TipoGastoMap>({})
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingRutas, setLoadingRutas] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carga inicial: rutas y tipos de gasto
  useEffect(() => {
    const cargarDatosBase = async () => {
      try {
        const [{ data: rutasData }, { data: tiposData }] = await Promise.all([
          supabase
            .from('rutas')
            .select('id, nombre_ruta, estado')
            .neq('estado', 'inactiva')
            .order('nombre_ruta'),
          supabase.from('tipos_gastos').select('id, nombre'),
        ])

        setRutas(rutasData || [])

        const mapaTypes: TipoGastoMap = {}
        for (const t of tiposData || []) {
          mapaTypes[t.id] = { nombre: t.nombre }
        }
        setTiposGasto(mapaTypes)
      } catch (e) {
        console.error('Error cargando datos base del dashboard:', e)
      } finally {
        setLoadingRutas(false)
      }
    }

    cargarDatosBase()
  }, [])

  const cargarDashboard = useCallback(
    async (filtros: DashboardFiltros) => {
      if (loadingRutas) return

      setLoading(true)
      setError(null)

      try {
        const fechaInicio = `${filtros.fechaInicio}T00:00:00-05:00`
        const fechaFin = `${filtros.fechaFin}T23:59:59-05:00`

        // IDs de rutas a consultar
        const idsRutas =
          filtros.rutaIds.length > 0
            ? filtros.rutaIds
            : rutas.map((r) => r.id)

        if (idsRutas.length === 0) {
          setData(buildEmpty())
          return
        }

        // ── PASO 1: Préstamos de las rutas seleccionadas ─────────────────────
        const { data: prestamosData, error: errPrestamos } = await supabase
          .from('prestamos')
          .select(
            'id, ruta_id, estado, monto_principal, monto_total, valor_cuota, valor_seguro, saldo_pendiente, fecha_desembolso, deudor_id, fecha_ultimo_pago'
          )
          .in('ruta_id', idsRutas)
          .neq('estado', 'E')

        if (errPrestamos) throw errPrestamos

        const prestamos = prestamosData || []
        const prestamosIds = prestamos.map((p) => p.id)

        // ── PASO 2: Queries paralelas ─────────────────────────────────────────
        const [
          { data: pagosData },
          { data: gastosData },
          { data: inversionesData },
          { data: gastosHistoricosData },
        ] = await Promise.all([
          // Pagos en el período
          prestamosIds.length > 0
            ? supabase
                .from('pagos_recibidos')
                .select('monto_pagado, prestamo_id, fechareal_pago')
                .in('prestamo_id', prestamosIds)
                .gte('fechareal_pago', fechaInicio)
                .lte('fechareal_pago', fechaFin)
                .neq('estado', 'eliminado')
            : Promise.resolve({ data: [] }),

          // Gastos en el período
          supabase
            .from('gastos_diarios')
            .select('monto, ruta_id, tipo_gasto_id, fecha_gasto')
            .in('ruta_id', idsRutas)
            .gte('fecha_gasto', fechaInicio)
            .lte('fecha_gasto', fechaFin),

          // Inversiones (todo el historial, para caja)
          supabase
            .from('inversiones_ruta')
            .select('ruta_id, monto')
            .in('ruta_id', idsRutas),

          // Gastos históricos totales (para caja actual)
          supabase
            .from('gastos_diarios')
            .select('monto, ruta_id, tipo_gasto_id')
            .in('ruta_id', idsRutas)
            .neq('estado_aprobacion', 'rechazado')
            .neq('estado_aprobacion', 'eliminado'),
        ])

        const pagos = pagosData || []
        const gastos = gastosData || []
        const inversiones = inversionesData || []
        const gastosHistoricos = gastosHistoricosData || []

        // ── PASO 3b: Calcular Devolución (Inversión - Saldado) HISTÓRICO ──
        const saldadoTotalHistoricoPorRuta = new Map<string, number>()
        gastosHistoricos.forEach((g: any) => {
          const tipo = tiposGasto[g.tipo_gasto_id]
          if (tipo?.nombre === 'Saldar Ruta') {
            const actual = saldadoTotalHistoricoPorRuta.get(g.ruta_id) || 0
            saldadoTotalHistoricoPorRuta.set(g.ruta_id, actual + Number(g.monto))
          }
        })

        // ── PASO 3: Indexar datos por ruta ────────────────────────────────────
        // Construir mapa de pagos por préstamo
        const pagosPorPrestamo = new Map<string, number>()
        pagos.forEach((p: any) => {
          if (p.prestamo_id) {
            const actual = pagosPorPrestamo.get(p.prestamo_id) || 0
            pagosPorPrestamo.set(p.prestamo_id, actual + Number(p.monto_pagado))
          }
        })

        // Inversiones agrupadas por ruta_id
        const inversionPorRuta = new Map<string, number>()
        for (const inv of inversiones) {
          const prev = inversionPorRuta.get(inv.ruta_id) || 0
          inversionPorRuta.set(inv.ruta_id, prev + Number(inv.monto))
        }

        // Gastos históricos agrupados por ruta_id
        const gastosHistoricosPorRuta = new Map<string, number>()
        for (const gH of gastosHistoricos) {
          const prev = gastosHistoricosPorRuta.get(gH.ruta_id) || 0
          gastosHistoricosPorRuta.set(gH.ruta_id, prev + Number(gH.monto))
        }

        // ── PASO 4: Calcular métricas por ruta ───────────────────────────────
        const rutasMap = new Map<string, RutaSimple>()
        for (const r of rutas) {
          if (idsRutas.includes(r.id)) rutasMap.set(r.id, r)
        }

        const hoy = new Date()
        const DIAS_MORA = 40

        const estaVencido = (p: any): boolean => {
          if (Number(p.saldo_pendiente) <= 0) return false
          const ref = p.fecha_ultimo_pago || p.fecha_desembolso
          if (!ref) return false
          const dias = Math.floor(
            (hoy.getTime() - new Date(ref + 'T12:00:00').getTime()) / 86_400_000
          )
          return dias > DIAS_MORA
        }

        const porRuta: DatosRutaDashboard[] = idsRutas.map((rutaId) => {
          const ruta = rutasMap.get(rutaId)
          const prestamosDeLaRuta = prestamos.filter((p) => p.ruta_id === rutaId)

          // Cartera y préstamos realizados en período
          let cartera = 0
          let montoPrestado = 0
          let prestamosRealizados = 0
          let seguros = 0
          let intereses = 0
          let cobros = 0
          let totalPrestamosRealizadosHistorico = 0
          let totalSegurosHistorico = 0
          let totalCobradoHistorico = 0
          let prestamosActivos = 0
          let prestamosVencidos = 0
          let prestamosPagados = 0
          let montoPagado = 0
          const clientesSet = new Set<string>()

          for (const p of prestamosDeLaRuta) {
            const saldo = Number(p.saldo_pendiente) || 0
            const montoTotal = Number(p.monto_total) || 0
            const montoPrincipal = Number(p.monto_principal) || 0
            const valorCuota = Number(p.valor_cuota) || 0
            const valorSeguro = Number(p.valor_seguro) || 0
            const totalPagadoActual = Math.max(0, montoTotal - saldo)

            // Cartera = todo saldo pendiente (sin importar estado en BD)
            if (saldo > 0) {
              cartera += saldo
            }

            // Nuevos en período (comparar solo la parte de fecha, sin timezone)
            if (
              p.fecha_desembolso >= filtros.fechaInicio &&
              p.fecha_desembolso <= filtros.fechaFin
            ) {
              prestamosRealizados++
              montoPrestado += montoPrincipal
              seguros += valorSeguro
            }

            // Cobros del período para este préstamo
            const cobrosEnPeriodo = pagosPorPrestamo.get(p.id) || 0
            cobros += cobrosEnPeriodo

            // Interés del período (delta del acumulado)
            const interesPeriodo = calcularInteresPeriodo(
              totalPagadoActual,
              cobrosEnPeriodo,
              valorCuota,
              montoPrincipal,
              montoTotal
            )
            intereses += interesPeriodo

            // Para cálculo de caja (histórico)
            totalPrestamosRealizadosHistorico += montoPrincipal
            totalSegurosHistorico += valorSeguro
            totalCobradoHistorico += totalPagadoActual

            // Salud — vencido = más de 40 días sin pagar con saldo > 0
            if (saldo > 0) {
              if (estaVencido(p)) {
                prestamosVencidos++
              } else {
                prestamosActivos++
              }
            }

            // Préstamos pagados (saldo = 0) con fecha_ultimo_pago en el período
            if (
              saldo === 0 &&
              p.fecha_ultimo_pago &&
              p.fecha_ultimo_pago >= filtros.fechaInicio &&
              p.fecha_ultimo_pago <= filtros.fechaFin
            ) {
              prestamosPagados++
              montoPagado += montoPrincipal
            }

            if (p.deudor_id) clientesSet.add(p.deudor_id)
          }

          // Caja total histórica
          const inversion = inversionPorRuta.get(rutaId) || 0
          const gastosTotalesHistoricos = gastosHistoricosPorRuta.get(rutaId) || 0
          const gastosDeRuta = gastos.filter((g) => g.ruta_id === rutaId)

          let gastosVariables = 0
          let gastosNomina = 0
          let gastosAdministrativos = 0
          let movimientosCapital = 0

          for (const g of gastosDeRuta) {
            const tipo = tiposGasto[g.tipo_gasto_id]
            if (!tipo) continue
            const monto = Number(g.monto) || 0

            if (NOMBRES_MOVIMIENTOS_CAPITAL.includes(tipo.nombre)) {
              movimientosCapital += monto
            } else if (tipo.nombre === NOMBRE_NOMINA) {
              gastosNomina += monto
            } else {
              // Los gastos que no son nómina ni movimientos de capital se consideran administrativos/variables
              gastosAdministrativos += monto
            }
          }

          const totalGastosPeriodo =
            gastosVariables + gastosNomina + gastosAdministrativos

          // Caja actual (Real-time liquidity across All history)
          // Caja = Inersion + Cobros_Totales + Seguros_Totales - Prestamos_Totales - Gastos_Totales
          const cajaActual =
            inversion -
            totalPrestamosRealizadosHistorico +
            totalSegurosHistorico +
            totalCobradoHistorico -
            gastosTotalesHistoricos

          // Caja del periodo (aproximación para el Dashboard si se requiere)
          const caja = cajaActual 

          const utilidadBruta = intereses + seguros
          const utilidadOperativa =
            utilidadBruta - gastosVariables - gastosNomina - gastosAdministrativos
          const utilidadNeta = utilidadOperativa 

          const tasaMorosidad =
            prestamosActivos + prestamosVencidos > 0
              ? Math.round((prestamosVencidos / (prestamosActivos + prestamosVencidos)) * 100)
              : 0

          const saldadoRuta = saldadoTotalHistoricoPorRuta.get(rutaId) || 0
          const devolucionRuta = inversion - saldadoRuta

          return {
            rutaId,
            nombreRuta: ruta?.nombre_ruta || rutaId,
            prestamosRealizados,
            montoPrestado,
            cobros,
            seguros,
            cartera,
            caja,
            cajaActual,
            intereses,
            gastosVariables,
            gastosNomina,
            gastosAdministrativos,
            movimientosCapital,
            totalGastos: totalGastosPeriodo,
            utilidadBruta,
            utilidadOperativa,
            utilidadNeta,
            tasaMorosidad,
            prestamosActivos,
            prestamosVencidos,
            prestamosPagados,
            montoPagado,
            clientesActivos: clientesSet.size,
            inversionTotal: inversion,
            valorSaldado: saldadoRuta,
            devolucionRuta,
          }
        })

        // ── PASO 5: Consolidado global ────────────────────────────────────────
        const consolidado = buildConsolidado(porRuta)

        // ── PASO 6: Datos semanales para el gráfico ──────────────────────────
        const datosSemana = calcularDatosSemana(
          pagos,
          gastosData || [],
          prestamos,
          fechaInicio,
          fechaFin,
          consolidado.cartera // Usamos la cartera actual como base final si es mes actual
        )

        // ── PASO 7: PyG ───────────────────────────────────────────────────────
        const pyg = construirPyG(porRuta, gastosData || [], tiposGasto)

        setData({ consolidado, porRuta, datosSemana, pyg })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar dashboard'
        setError(msg)
        console.error('Error en useDashboard:', e)
      } finally {
        setLoading(false)
      }
    },
    [rutas, tiposGasto, loadingRutas]
  )

  return { rutas, data, loading, loadingRutas, error, cargarDashboard }
}

// ============================================================================
// HELPERS
// ============================================================================

function buildConsolidado(porRuta: DatosRutaDashboard[]): DashboardConsolidado {
  const sum = <K extends keyof DatosRutaDashboard>(key: K): number =>
    porRuta.reduce((s, r) => s + (Number(r[key]) || 0), 0)

  const prestamosActivos = sum('prestamosActivos')
  const prestamosVencidos = sum('prestamosVencidos')

  return {
    prestamosRealizados: sum('prestamosRealizados'),
    montoPrestado: sum('montoPrestado'),
    cartera: sum('cartera'),
    cobros: sum('cobros'),
    caja: sum('caja'),
    cajaActual: sum('cajaActual'),
    seguros: sum('seguros'),
    intereses: sum('intereses'),
    gastosVariables: sum('gastosVariables'),
    gastosNomina: sum('gastosNomina'),
    gastosAdministrativos: sum('gastosAdministrativos'),
    movimientosCapital: sum('movimientosCapital'),
    totalGastos: sum('totalGastos'),
    utilidadBruta: sum('utilidadBruta'),
    utilidadOperativa: sum('utilidadOperativa'),
    utilidadNeta: sum('utilidadNeta'),
    tasaMorosidad:
      prestamosActivos + prestamosVencidos > 0
        ? Math.round((prestamosVencidos / (prestamosActivos + prestamosVencidos)) * 100)
        : 0,
    prestamosActivos,
    prestamosVencidos,
    prestamosPagados: sum('prestamosPagados'),
    montoPagado: sum('montoPagado'),
    clientesActivos: sum('clientesActivos'),
    inversionTotal: sum('inversionTotal'),
    valorSaldado: sum('valorSaldado'),
    devolucionRuta: sum('devolucionRuta'),
  }
}

function buildEmpty(): DashboardData {
  const empty: DashboardConsolidado = {
    prestamosRealizados: 0,
    montoPrestado: 0,
    cartera: 0,
    cobros: 0,
    caja: 0,
    cajaActual: 0,
    seguros: 0,
    intereses: 0,
    gastosVariables: 0,
    gastosNomina: 0,
    gastosAdministrativos: 0,
    movimientosCapital: 0,
    totalGastos: 0,
    utilidadBruta: 0,
    utilidadOperativa: 0,
    utilidadNeta: 0,
    tasaMorosidad: 0,
    prestamosActivos: 0,
    prestamosVencidos: 0,
    prestamosPagados: 0,
    montoPagado: 0,
    clientesActivos: 0,
    inversionTotal: 0,
    valorSaldado: 0,
    devolucionRuta: 0,
  }
  return {
    consolidado: empty,
    porRuta: [],
    datosSemana: [],
    pyg: {
      interesesAcumulados: 0,
      segurosCobrados: 0,
      utilidadBruta: 0,
      gastosVariables: 0,
      gastosNomina: 0,
      gastosAdministrativos: 0,
      totalGastos: 0,
      utilidadOperativa: 0,
      movimientosCapital: 0,
      utilidadNeta: 0,
      detalleGastos: [],
      detalleMovimientosCapital: [],
    },
  }
}

function calcularDatosSemana(
  pagos: Array<{ monto_pagado: number; prestamo_id: string; fecha_pago: string | null; fechareal_pago: string | null }>,
  gastos: Array<{ monto: number; ruta_id: string | null; fecha_gasto: string | null }>,
  prestamos: any[],
  fechaInicio: string,
  fechaFin: string,
  carteraActual: number
): DatosSemanaChart[] {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)

  const semanas: Array<{ label: string; desde: Date; hasta: Date }> = []
  const cursor = new Date(inicio)

  while (cursor <= fin) {
    const desdeSem = new Date(cursor)
    const hastaSem = new Date(cursor)
    hastaSem.setDate(hastaSem.getDate() + 6)
    if (hastaSem > fin) hastaSem.setTime(fin.getTime())

    const label = `S${semanas.length + 1} ${desdeSem.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
    semanas.push({ label, desde: desdeSem, hasta: hastaSem })
    cursor.setDate(cursor.getDate() + 7)
  }

  // Para calcular la cartera histórica, necesitamos saber qué parte de los cobros es capital.
  // Como solo tenemos los datos del período, calcularemos la cartera relativa al final del mes.
  // Cartera(T) = Cartera(FinMes) - Prestamos(T a FinMes) + CapitalCobrado(T a FinMes)

  const resultado: DatosSemanaChart[] = semanas.map((sem) => {
    const cobrosSem = pagos
      .filter((p: any) => {
        if (!p.fechareal_pago) return false
        const f = new Date(p.fechareal_pago)
        return f >= sem.desde && f <= sem.hasta
      })
      .reduce((s, p) => s + Number(p.monto_pagado), 0)

    const prestadosSem = prestamos
      .filter((p) => {
        const f = new Date(p.fecha_desembolso)
        return f >= sem.desde && f <= sem.hasta
      })
      .reduce((s, p) => s + Number(p.monto_principal), 0)

    const gastosSem = gastos
      .filter((g) => {
        if (!g.fecha_gasto) return false
        const f = new Date(g.fecha_gasto)
        return f >= sem.desde && f <= sem.hasta
      })
      .reduce((s, g) => s + Number(g.monto), 0)

    return {
      semana: sem.label,
      cobros: cobrosSem,
      prestados: prestadosSem,
      gastos: gastosSem,
      utilidad: cobrosSem - gastosSem,
      cartera: 0, // Se llenará en el segundo pase
    }
  })

  // Segundo pase: Calcular cartera acumulada backwards o forwards
  // Usaremos un enfoque simplificado: Cartera inicial del mes aproximada y aplicamos deltas.
  // Delta = Prestados - CapitalCobrado
  
  let currentCarteraTrend = carteraActual
  // Ir de atrás hacia adelante para ver evolución (aproximada)
  // Pero lo ideal es mostrar cómo terminó cada semana.
  
  // Vamos a calcular el capital cobrado total en el mes
  const pagosPorMes = pagos.map(p => {
    const prestamo = prestamos.find(pr => pr.id === p.prestamo_id)
    if (!prestamo) return { ...p, capital: Number(p.monto_pagado) } // fallback
    
    // Aproximación rápida del capital: monto_principal / monto_total
    const factorCapital = Number(prestamo.monto_principal) / Number(prestamo.monto_total)
    return { ...p, capital: Math.round(Number(p.monto_pagado) * (factorCapital || 0.8)) }
  })

  let acumulado = carteraActual
  // Calculamos de fin a inicio para obtener la foto en cada punto si asumimos que carteraActual es la del fin de mes
  for (let i = resultado.length - 1; i >= 0; i--) {
    resultado[i].cartera = acumulado
    
    const sem = semanas[i]
    const prestadosSem = resultado[i].prestados
    const capitalCobradoSem = pagosPorMes
      .filter(p => {
        if (!p.fechareal_pago) return false
        const f = new Date(p.fechareal_pago)
        return f >= sem.desde && f <= sem.hasta
      })
      .reduce((s, p) => s + p.capital, 0)
    
    acumulado = acumulado - prestadosSem + capitalCobradoSem
  }

  return resultado
}
