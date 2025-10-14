import { useState, useEffect } from "react"
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client"
import { 
  Ruta, 
  RutaExtendida, 
  RutaInsert, 
  RutaUpdate, 
  RutaFiltros,
  RutaEstadisticas,
  BaseDiaria,
  ConciliacionDiaria,
  DatosSemana
} from "@/types/ruta"
import { useToast } from "@/hooks/use-toast"

export function useRutas(filtros?: RutaFiltros) {
  const [rutas, setRutas] = useState<RutaExtendida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para obtener rutas con información extendida
  const fetchRutas = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primero, probar la conexión básica
      console.log("🔍 Probando conexión a Supabase...")
      const connectionTest = await testSupabaseConnection()
      if (!connectionTest) {
        throw new Error("No se pudo conectar a Supabase")
      }

      // Consulta para obtener rutas
      console.log("📊 Obteniendo rutas...")
      let query = supabase
        .from("rutas")
        .select("*")

      // Aplicar filtros
      if (filtros?.estado) {
        query = query.eq("estado", filtros.estado)
      }

      if (filtros?.zona_geografica) {
        query = query.eq("zona_geografica", filtros.zona_geografica)
      }

      const { data, error: fetchError } = await query.order("fecha_creacion", { ascending: false })

      if (fetchError) {
        console.error("❌ Error de Supabase:", fetchError)
        throw fetchError
      }

      console.log("✅ Rutas obtenidas:", data?.length || 0)

      // Obtener información adicional para cada ruta
      const rutasExtendidas: RutaExtendida[] = await Promise.all(
        (data || []).map(async (ruta: Ruta) => {
          // Obtener cobrador asignado
          const { data: cobradorData } = await supabase
            .from("cobrador_ruta")
            .select(`
              usuarios!cobrador_ruta_cobrador_id_fkey (
                id,
                nombre,
                apellido,
                telefono
              )
            `)
            .eq("ruta_id", ruta.id)
            .eq("estado", "activo")
            .maybeSingle()

          // Obtener estadísticas de la ruta
          const estadisticas = await obtenerEstadisticasRuta(ruta.id)

          // Obtener base diaria más reciente
          const { data: baseDiariaData } = await supabase
            .from("base_diaria_cobradores")
            .select("*")
            .eq("ruta_id", ruta.id)
            .order("fecha", { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...ruta,
            cobrador: cobradorData?.usuarios ? {
              id: cobradorData.usuarios.id,
              nombre: cobradorData.usuarios.nombre,
              apellido: cobradorData.usuarios.apellido,
              telefono: cobradorData.usuarios.telefono
            } : undefined,
            estadisticas,
            baseDiaria: baseDiariaData ? {
              id: baseDiariaData.id,
              fecha: baseDiariaData.fecha,
              monto_base_entregado: baseDiariaData.monto_base_entregado,
              monto_devuelto: baseDiariaData.monto_devuelto,
              estado: baseDiariaData.estado
            } : undefined
          }
        })
      )

      // Aplicar filtro de búsqueda si existe
      let rutasFiltradas = rutasExtendidas
      if (filtros?.busqueda) {
        const terminoBusqueda = filtros.busqueda.toLowerCase().trim()
        if (terminoBusqueda !== '') {
          rutasFiltradas = rutasExtendidas.filter((ruta) => {
            return ruta.nombre_ruta.toLowerCase().includes(terminoBusqueda) ||
                   ruta.zona_geografica?.toLowerCase().includes(terminoBusqueda) ||
                   ruta.descripcion?.toLowerCase().includes(terminoBusqueda)
          })
        }
      }

      setRutas(rutasFiltradas)
    } catch (err) {
      console.error("❌ Error completo:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar rutas"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Función auxiliar para calcular datos por semana
  const calcularDatosPorSemana = async (rutaId: string): Promise<DatosSemana[]> => {
    try {
      // Obtener datos de las últimas 6 semanas
      const fechaHoy = new Date()
      const fechaInicio = new Date(fechaHoy)
      fechaInicio.setDate(fechaInicio.getDate() - 42) // 6 semanas atrás

      // Obtener préstamos por fecha_desembolso
      const { data: prestamosData } = await supabase
        .from("prestamos")
        .select("monto_principal, fecha_desembolso")
        .eq("ruta_id", rutaId)
        .gte("fecha_desembolso", fechaInicio.toISOString().split('T')[0])
        .neq("estado", "E")

      // Obtener pagos por fecha_pago
      const { data: pagosData } = await supabase
        .from("pagos_recibidos")
        .select("monto_pagado, fecha_pago, prestamo_id")
        .gte("fecha_pago", fechaInicio.toISOString().split('T')[0])
        .in("prestamo_id", 
          prestamosData?.map(p => p.id) || []
        )

      // Obtener solo los pagos de préstamos de esta ruta
      const prestamosIdsRuta = prestamosData?.map(p => (p as any).id) || []
      const { data: todosPagosData } = await supabase
        .from("pagos_recibidos")
        .select("monto_pagado, fecha_pago, prestamo:prestamos!inner(ruta_id)")
        .eq("prestamo.ruta_id", rutaId)
        .gte("fecha_pago", fechaInicio.toISOString().split('T')[0])

      // Obtener gastos por fecha_gasto
      const { data: gastosData } = await supabase
        .from("gastos_diarios")
        .select("monto, fecha_gasto")
        .eq("ruta_id", rutaId)
        .gte("fecha_gasto", fechaInicio.toISOString().split('T')[0])

      // Función para obtener número de semana
      const obtenerNumeroSemana = (fecha: Date) => {
        const inicioAnio = new Date(fecha.getFullYear(), 0, 1)
        const diasPasados = Math.floor((fecha.getTime() - inicioAnio.getTime()) / (24 * 60 * 60 * 1000))
        return Math.ceil((diasPasados + inicioAnio.getDay() + 1) / 7)
      }

      // Función para obtener label de semana
      const obtenerLabelSemana = (fecha: Date) => {
        const numSemana = obtenerNumeroSemana(fecha)
        const mesCorto = fecha.toLocaleDateString('es-CO', { month: 'short' })
        return `S${numSemana} ${mesCorto}`
      }

      // Agrupar datos por semana
      const semanas = new Map<string, { prestado: number, cobrado: number, gastos: number, fechaInicio: Date, fechaFin: Date }>()

      // Inicializar últimas 6 semanas
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(fechaHoy)
        fecha.setDate(fecha.getDate() - (i * 7))
        
        // Calcular inicio y fin de la semana (lunes a domingo)
        const diaSemana = fecha.getDay()
        const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
        const fechaInicio = new Date(fecha.setDate(diff))
        const fechaFin = new Date(fechaInicio)
        fechaFin.setDate(fechaInicio.getDate() + 6)
        
        const label = obtenerLabelSemana(new Date(fecha))
        semanas.set(label, { 
          prestado: 0, 
          cobrado: 0, 
          gastos: 0,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin)
        })
      }

      // Agrupar préstamos
      prestamosData?.forEach((prestamo: any) => {
        const fecha = new Date(prestamo.fecha_desembolso)
        const label = obtenerLabelSemana(fecha)
        const semanaData = semanas.get(label)
        if (semanaData) {
          semanaData.prestado += Number(prestamo.monto_principal) || 0
        }
      })

      // Agrupar pagos
      todosPagosData?.forEach((pago: any) => {
        if (pago.fecha_pago) {
          const fecha = new Date(pago.fecha_pago)
          const label = obtenerLabelSemana(fecha)
          const semanaData = semanas.get(label)
          if (semanaData) {
            semanaData.cobrado += Number(pago.monto_pagado) || 0
          }
        }
      })

      // Agrupar gastos
      gastosData?.forEach((gasto: any) => {
        if (gasto.fecha_gasto) {
          const fecha = new Date(gasto.fecha_gasto)
          const label = obtenerLabelSemana(fecha)
          const semanaData = semanas.get(label)
          if (semanaData) {
            semanaData.gastos += Number(gasto.monto) || 0
          }
        }
      })

      // Convertir a array
      return Array.from(semanas.entries()).map(([semana, datos]) => ({
        semana,
        prestado: datos.prestado,
        cobrado: datos.cobrado,
        gastos: datos.gastos,
        fechaInicio: datos.fechaInicio.toISOString().split('T')[0],
        fechaFin: datos.fechaFin.toISOString().split('T')[0]
      }))
    } catch (error) {
      console.error("Error al calcular datos por semana:", error)
      return []
    }
  }

  // Función para obtener estadísticas de una ruta específica
  const obtenerEstadisticasRuta = async (rutaId: string): Promise<RutaEstadisticas> => {
    try {
      // Obtener información de la ruta incluyendo inversión
      const { data: rutaData } = await supabase
        .from("rutas")
        .select("inversion_ruta")
        .eq("id", rutaId)
        .single() as { data: { inversion_ruta: number } | null }

      // Obtener préstamos de la ruta con campos necesarios
      const { data: prestamosData } = await supabase
        .from("prestamos")
        .select("estado, monto_principal, monto_total, valor_cuota, valor_seguro, saldo_pendiente, cuotas_pagadas, numero_cuotas")
        .eq("ruta_id", rutaId)
        .neq("estado", "E") as any // Excluir préstamos eliminados

      if (!prestamosData) {
        return {
          totalPrestamos: 0,
          prestamosActivos: 0,
          prestamosVencidos: 0,
          prestamosPagados: 0,
          carteraTotal: 0,
          saldoPendiente: 0,
          montoPorVencer: 0,
          promedioCuota: 0,
          rentabilidad: 0,
          eficienciaCobro: 0,
          clientesActivos: 0,
          clientesMorosos: 0,
          caja: rutaData?.inversion_ruta || 0,
          segurosRecogidos: 0,
          totalPrestado: 0,
          totalCobrado: 0,
          totalGastos: 0,
          datosPorSemana: []
        }
      }

      const totalPrestamos = prestamosData.length
      const prestamosActivos = prestamosData.filter((p: any) => p.estado === "activo").length
      const prestamosVencidos = prestamosData.filter((p: any) => p.estado === "vencido").length
      const prestamosPagados = prestamosData.filter((p: any) => p.estado === "pagado").length
      
      let carteraTotal = 0
      let saldoPendiente = 0
      let totalCuotas = 0
      let cuotasConValor = 0
      let totalCobrosRealizados = 0
      let totalCobrosProgramados = 0
      
      // Variables para cálculo de caja
      let totalPrestamosRealizados = 0 // Suma de monto_principal
      let totalSeguros = 0 // Suma de valor_seguro
      let segurosRecogidos = 0 // Total de seguros recogidos

      prestamosData.forEach((prestamo: any) => {
        // Usar campos directos de la tabla prestamos
        const saldoPrestamo = prestamo.saldo_pendiente || 0
        const pagosRealizados = (prestamo.monto_total || 0) - saldoPrestamo
        
        carteraTotal += saldoPrestamo
        saldoPendiente += saldoPrestamo
        totalCobrosRealizados += pagosRealizados
        totalCobrosProgramados += prestamo.monto_total || 0
        
        // Acumular para cálculo de caja
        totalPrestamosRealizados += prestamo.monto_principal || 0
        totalSeguros += prestamo.valor_seguro || 0
        segurosRecogidos += prestamo.valor_seguro || 0
        
        // Promedio de cuota
        if (prestamo.valor_cuota) {
          totalCuotas += prestamo.valor_cuota
          cuotasConValor++
        }
      })

      const promedioCuota = cuotasConValor > 0 ? totalCuotas / cuotasConValor : 0
      const eficienciaCobro = totalCobrosProgramados > 0 ? (totalCobrosRealizados / totalCobrosProgramados) * 100 : 0
      const rentabilidad = carteraTotal > 0 ? ((totalCobrosRealizados / carteraTotal) * 100) : 0

      // Obtener clientes únicos de la ruta
      const { data: clientesData } = await supabase
        .from("prestamos")
        .select("deudor_id, estado")
        .eq("ruta_id", rutaId)
        .neq("estado", "E")

      const clientesUnicos = new Set(clientesData?.map(p => p.deudor_id) || [])
      const clientesActivos = clientesData?.filter(p => p.estado === "activo").length || 0
      const clientesMorosos = clientesData?.filter(p => p.estado === "vencido").length || 0

      // Obtener gastos diarios de la ruta
      const { data: gastosData } = await supabase
        .from("gastos_diarios")
        .select("monto, fecha_gasto")
        .eq("ruta_id", rutaId)

      const totalGastos = gastosData?.reduce((sum, gasto) => sum + (Number(gasto.monto) || 0), 0) || 0

      // Calcular caja según la fórmula: inversion_ruta - monto_principal + seguros + pagosRealizados - gastos
      const inversionRuta = rutaData?.inversion_ruta || 0
      const caja = inversionRuta - totalPrestamosRealizados + totalSeguros + totalCobrosRealizados - totalGastos

      // Obtener datos por semana
      const datosPorSemana = await calcularDatosPorSemana(rutaId)

      return {
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos,
        prestamosPagados,
        carteraTotal,
        saldoPendiente,
        montoPorVencer: 0, // Ya no se calcula
        promedioCuota,
        rentabilidad,
        eficienciaCobro,
        clientesActivos,
        clientesMorosos,
        caja,
        segurosRecogidos,
        totalPrestado: totalPrestamosRealizados,
        totalCobrado: totalCobrosRealizados,
        totalGastos,
        datosPorSemana
      }
    } catch (err) {
      console.error("Error al obtener estadísticas de ruta:", err)
      return {
        totalPrestamos: 0,
        prestamosActivos: 0,
        prestamosVencidos: 0,
        prestamosPagados: 0,
        carteraTotal: 0,
        saldoPendiente: 0,
        montoPorVencer: 0,
        promedioCuota: 0,
        rentabilidad: 0,
        eficienciaCobro: 0,
        clientesActivos: 0,
        clientesMorosos: 0,
        caja: 0,
        segurosRecogidos: 0
      }
    }
  }

  // Crear nueva ruta
  const crearRuta = async (rutaData: RutaInsert): Promise<Ruta | null> => {
    try {
      setLoading(true)
      
      // Obtener empresa_id del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("user_id", user.id)
        .single()

      if (!usuarioData) throw new Error("Usuario no encontrado")

      const { data, error: insertError } = await supabase
        .from("rutas")
        .insert([{
          ...rutaData,
          empresa_id: usuarioData.empresa_id
        }])
        .select()
        .single()

      if (insertError) throw insertError

      toast({
        title: "Ruta creada",
        description: "La ruta ha sido creada exitosamente"
      })

      // Recargar la lista
      await fetchRutas()
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear ruta"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  // Actualizar ruta
  const actualizarRuta = async (id: string, rutaData: RutaUpdate): Promise<boolean> => {
    try {
      setLoading(true)
      
      const { error: updateError } = await supabase
        .from("rutas")
        .update({
          ...rutaData,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Ruta actualizada",
        description: "Los datos de la ruta han sido actualizados"
      })

      // Recargar la lista
      await fetchRutas()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar ruta"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Obtener base diaria de una ruta
  const obtenerBaseDiaria = async (rutaId: string, fecha?: string): Promise<BaseDiaria | null> => {
    try {
      let query = supabase
        .from("base_diaria_cobradores")
        .select("*")
        .eq("ruta_id", rutaId)
        .order("fecha", { ascending: false })

      if (fecha) {
        query = query.eq("fecha", fecha)
      }

      const { data, error } = await query.limit(1).single()

      if (error) {
        if (error.code === 'PGRST116') return null // No encontrado
        throw error
      }

      return data
    } catch (err) {
      console.error("Error al obtener base diaria:", err)
      return null
    }
  }

  // Obtener conciliación diaria
  const obtenerConciliacionDiaria = async (baseDiariaId: string): Promise<ConciliacionDiaria | null> => {
    try {
      const { data, error } = await supabase
        .from("conciliacion_diaria")
        .select("*")
        .eq("base_diaria_id", baseDiariaId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No encontrado
        throw error
      }

      return data
    } catch (err) {
      console.error("Error al obtener conciliación diaria:", err)
      return null
    }
  }

  // Cargar datos al montar el componente o cambiar filtros
  useEffect(() => {
    fetchRutas()
  }, [filtros?.busqueda, filtros?.estado, filtros?.zona_geografica])

  return {
    rutas,
    loading,
    error,
    crearRuta,
    actualizarRuta,
    obtenerBaseDiaria,
    obtenerConciliacionDiaria,
    refetch: fetchRutas
  }
}

// Hook para obtener una ruta específica
export function useRuta(id: string) {
  const [ruta, setRuta] = useState<RutaExtendida | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("rutas")
          .select("*")
          .eq("id", id)
          .single()

        if (fetchError) throw fetchError

        // Obtener cobrador asignado
        const { data: cobradorData } = await supabase
          .from("cobrador_ruta")
          .select(`
            usuarios!cobrador_ruta_cobrador_id_fkey (
              id,
              nombre,
              apellido,
              telefono
            )
          `)
          .eq("ruta_id", id)
          .eq("estado", "activo")
          .maybeSingle()

        // Obtener estadísticas
        const estadisticas = await obtenerEstadisticasRuta(id)

        // Obtener base diaria más reciente
        const { data: baseDiariaData } = await supabase
          .from("base_diaria_cobradores")
          .select("*")
          .eq("ruta_id", id)
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle()

        const rutaExtendida: RutaExtendida = {
          ...data,
          cobrador: cobradorData?.usuarios ? {
            id: cobradorData.usuarios.id,
            nombre: cobradorData.usuarios.nombre,
            apellido: cobradorData.usuarios.apellido,
            telefono: cobradorData.usuarios.telefono
          } : undefined,
          estadisticas,
          baseDiaria: baseDiariaData ? {
            id: baseDiariaData.id,
            fecha: baseDiariaData.fecha,
            monto_base_entregado: baseDiariaData.monto_base_entregado,
            monto_devuelto: baseDiariaData.monto_devuelto,
            estado: baseDiariaData.estado
          } : undefined
        }

        setRuta(rutaExtendida)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar ruta"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRuta()
    }
  }, [id])

  return { ruta, loading, error }
}

// Función auxiliar para calcular datos por semana (reutilizada)
async function calcularDatosPorSemana(rutaId: string): Promise<DatosSemana[]> {
  try {
    // Obtener datos de las últimas 6 semanas
    const fechaHoy = new Date()
    const fechaInicio = new Date(fechaHoy)
    fechaInicio.setDate(fechaInicio.getDate() - 42) // 6 semanas atrás

    // Obtener préstamos por fecha_desembolso
    const { data: prestamosData } = await supabase
      .from("prestamos")
      .select("monto_principal, fecha_desembolso")
      .eq("ruta_id", rutaId)
      .gte("fecha_desembolso", fechaInicio.toISOString().split('T')[0])
      .neq("estado", "E")

    // Obtener solo los pagos de préstamos de esta ruta
    const { data: todosPagosData } = await supabase
      .from("pagos_recibidos")
      .select("monto_pagado, fecha_pago, prestamo:prestamos!inner(ruta_id)")
      .eq("prestamo.ruta_id", rutaId)
      .gte("fecha_pago", fechaInicio.toISOString().split('T')[0])

    // Obtener gastos por fecha_gasto
    const { data: gastosData } = await supabase
      .from("gastos_diarios")
      .select("monto, fecha_gasto")
      .eq("ruta_id", rutaId)
      .gte("fecha_gasto", fechaInicio.toISOString().split('T')[0])

    // Función para obtener número de semana
    const obtenerNumeroSemana = (fecha: Date) => {
      const inicioAnio = new Date(fecha.getFullYear(), 0, 1)
      const diasPasados = Math.floor((fecha.getTime() - inicioAnio.getTime()) / (24 * 60 * 60 * 1000))
      return Math.ceil((diasPasados + inicioAnio.getDay() + 1) / 7)
    }

    // Función para obtener label de semana
    const obtenerLabelSemana = (fecha: Date) => {
      const numSemana = obtenerNumeroSemana(fecha)
      const mesCorto = fecha.toLocaleDateString('es-CO', { month: 'short' })
      return `S${numSemana} ${mesCorto}`
    }

    // Agrupar datos por semana
    const semanas = new Map<string, { prestado: number, cobrado: number, gastos: number, fechaInicio: Date, fechaFin: Date }>()

    // Inicializar últimas 6 semanas
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaHoy)
      fecha.setDate(fecha.getDate() - (i * 7))
      
      // Calcular inicio y fin de la semana (lunes a domingo)
      const diaSemana = fecha.getDay()
      const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
      const fechaInicio = new Date(fecha.setDate(diff))
      const fechaFin = new Date(fechaInicio)
      fechaFin.setDate(fechaInicio.getDate() + 6)
      
      const label = obtenerLabelSemana(new Date(fecha))
      semanas.set(label, { 
        prestado: 0, 
        cobrado: 0, 
        gastos: 0,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin)
      })
    }

    // Agrupar préstamos
    prestamosData?.forEach((prestamo: any) => {
      const fecha = new Date(prestamo.fecha_desembolso)
      const label = obtenerLabelSemana(fecha)
      const semanaData = semanas.get(label)
      if (semanaData) {
        semanaData.prestado += Number(prestamo.monto_principal) || 0
      }
    })

    // Agrupar pagos
    todosPagosData?.forEach((pago: any) => {
      if (pago.fecha_pago) {
        const fecha = new Date(pago.fecha_pago)
        const label = obtenerLabelSemana(fecha)
        const semanaData = semanas.get(label)
        if (semanaData) {
          semanaData.cobrado += Number(pago.monto_pagado) || 0
        }
      }
    })

    // Agrupar gastos
    gastosData?.forEach((gasto: any) => {
      if (gasto.fecha_gasto) {
        const fecha = new Date(gasto.fecha_gasto)
        const label = obtenerLabelSemana(fecha)
        const semanaData = semanas.get(label)
        if (semanaData) {
          semanaData.gastos += Number(gasto.monto) || 0
        }
      }
    })

    // Convertir a array
    return Array.from(semanas.entries()).map(([semana, datos]) => ({
      semana,
      prestado: datos.prestado,
      cobrado: datos.cobrado,
      gastos: datos.gastos,
      fechaInicio: datos.fechaInicio.toISOString().split('T')[0],
      fechaFin: datos.fechaFin.toISOString().split('T')[0]
    }))
  } catch (error) {
    console.error("Error al calcular datos por semana:", error)
    return []
  }
}

// Función auxiliar para obtener estadísticas (reutilizada)
async function obtenerEstadisticasRuta(rutaId: string): Promise<RutaEstadisticas> {
  try {
    // Obtener información de la ruta incluyendo inversión
    const { data: rutaData } = await supabase
      .from("rutas")
      .select("inversion_ruta")
      .eq("id", rutaId)
      .single() as { data: { inversion_ruta: number } | null }

    const { data: prestamosData } = await supabase
      .from("prestamos")
      .select("estado, monto_principal, monto_total, valor_cuota, valor_seguro, saldo_pendiente, cuotas_pagadas, numero_cuotas")
      .eq("ruta_id", rutaId)
      .neq("estado", "E") as any

    if (!prestamosData) {
      return {
        totalPrestamos: 0,
        prestamosActivos: 0,
        prestamosVencidos: 0,
        prestamosPagados: 0,
        carteraTotal: 0,
        saldoPendiente: 0,
        montoPorVencer: 0,
        promedioCuota: 0,
        rentabilidad: 0,
        eficienciaCobro: 0,
        clientesActivos: 0,
        clientesMorosos: 0,
        caja: rutaData?.inversion_ruta || 0,
        segurosRecogidos: 0,
        totalPrestado: 0,
        totalCobrado: 0,
        totalGastos: 0,
        datosPorSemana: []
      }
    }

    const totalPrestamos = prestamosData.length
    const prestamosActivos = prestamosData.filter((p: any) => p.estado === "activo").length
    const prestamosVencidos = prestamosData.filter((p: any) => p.estado === "vencido").length
    const prestamosPagados = prestamosData.filter((p: any) => p.estado === "pagado").length
    
    let carteraTotal = 0
    let saldoPendiente = 0
    let totalCuotas = 0
    let cuotasConValor = 0
    let totalCobrosRealizados = 0
    let totalCobrosProgramados = 0
    
    // Variables para cálculo de caja
    let totalPrestamosRealizados = 0 // Suma de monto_principal
    let totalSeguros = 0 // Suma de valor_seguro
    let segurosRecogidos = 0 // Total de seguros recogidos

    prestamosData.forEach((prestamo: any) => {
      // Usar campos directos de la tabla prestamos
      const saldoPrestamo = prestamo.saldo_pendiente || 0
      const pagosRealizados = (prestamo.monto_total || 0) - saldoPrestamo
      
      carteraTotal += saldoPrestamo
      saldoPendiente += saldoPrestamo
      totalCobrosRealizados += pagosRealizados
      totalCobrosProgramados += prestamo.monto_total || 0
      
      // Acumular para cálculo de caja
      totalPrestamosRealizados += prestamo.monto_principal || 0
      totalSeguros += prestamo.valor_seguro || 0
      segurosRecogidos += prestamo.valor_seguro || 0
      
      // Promedio de cuota
      if (prestamo.valor_cuota) {
        totalCuotas += prestamo.valor_cuota
        cuotasConValor++
      }
    })

    const promedioCuota = cuotasConValor > 0 ? totalCuotas / cuotasConValor : 0
    const eficienciaCobro = totalCobrosProgramados > 0 ? (totalCobrosRealizados / totalCobrosProgramados) * 100 : 0
    const rentabilidad = carteraTotal > 0 ? ((totalCobrosRealizados / carteraTotal) * 100) : 0

    const { data: clientesData } = await supabase
      .from("prestamos")
      .select("deudor_id, estado")
      .eq("ruta_id", rutaId)
      .neq("estado", "E")

    const clientesActivos = clientesData?.filter(p => p.estado === "activo").length || 0
    const clientesMorosos = clientesData?.filter(p => p.estado === "vencido").length || 0

    // Obtener gastos diarios de la ruta
    const { data: gastosData } = await supabase
      .from("gastos_diarios")
      .select("monto")
      .eq("ruta_id", rutaId)

    const totalGastos = gastosData?.reduce((sum, gasto) => sum + (Number(gasto.monto) || 0), 0) || 0

    // Calcular caja según la fórmula: inversion_ruta - monto_principal + seguros + pagosRealizados - gastos
    const inversionRuta = rutaData?.inversion_ruta || 0
    const caja = inversionRuta - totalPrestamosRealizados + totalSeguros + totalCobrosRealizados - totalGastos

    // Obtener datos por semana
    const datosPorSemana = await calcularDatosPorSemana(rutaId)

    return {
      totalPrestamos,
      prestamosActivos,
      prestamosVencidos,
      prestamosPagados,
      carteraTotal,
      saldoPendiente,
      montoPorVencer: 0, // Ya no se calcula
      promedioCuota,
      rentabilidad,
      eficienciaCobro,
      clientesActivos,
      clientesMorosos,
      caja,
      segurosRecogidos,
      totalPrestado: totalPrestamosRealizados,
      totalCobrado: totalCobrosRealizados,
      totalGastos,
      datosPorSemana
    }
    } catch (err) {
      console.error("Error al obtener estadísticas de ruta:", err)
      return {
        totalPrestamos: 0,
        prestamosActivos: 0,
        prestamosVencidos: 0,
        prestamosPagados: 0,
        carteraTotal: 0,
        saldoPendiente: 0,
        montoPorVencer: 0,
        promedioCuota: 0,
        rentabilidad: 0,
        eficienciaCobro: 0,
        clientesActivos: 0,
        clientesMorosos: 0,
        caja: 0,
        segurosRecogidos: 0,
        totalPrestado: 0,
        totalCobrado: 0,
        totalGastos: 0,
        datosPorSemana: []
      }
    }
  }
