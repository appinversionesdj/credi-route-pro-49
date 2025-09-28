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
  ConciliacionDiaria
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

  // Función para obtener estadísticas de una ruta específica
  const obtenerEstadisticasRuta = async (rutaId: string): Promise<RutaEstadisticas> => {
    try {
      // Obtener información de la ruta incluyendo inversión
      const { data: rutaData } = await supabase
        .from("rutas")
        .select("inversion_ruta")
        .eq("id", rutaId)
        .single() as { data: { inversion_ruta: number } | null }

      // Obtener préstamos de la ruta
      const { data: prestamosData } = await supabase
        .from("prestamos")
        .select(`
          estado,
          monto_principal,
          monto_total,
          valor_cuota,
          valor_seguro,
          cronograma_pagos!cronograma_pagos_prestamo_id_fkey (
            saldo_pendiente,
            fecha_vencimiento,
            valor_pagado
          )
        `)
        .eq("ruta_id", rutaId)
        .neq("estado", "E") // Excluir préstamos eliminados

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
          segurosRecogidos: 0
        }
      }

      const totalPrestamos = prestamosData.length
      const prestamosActivos = prestamosData.filter(p => p.estado === "activo").length
      const prestamosVencidos = prestamosData.filter(p => p.estado === "vencido").length
      const prestamosPagados = prestamosData.filter(p => p.estado === "pagado").length
      
      let carteraTotal = 0
      let saldoPendiente = 0
      let montoPorVencer = 0
      let totalCuotas = 0
      let cuotasConValor = 0
      let totalCobrosRealizados = 0
      let totalCobrosProgramados = 0
      
      // Variables para cálculo de caja
      let totalPrestamosRealizados = 0 // Suma de monto_principal
      let totalSeguros = 0 // Suma de valor_seguro
      let totalPagosRecibidos = 0 // Suma de valor_pagado del cronograma
      let segurosRecogidos = 0 // Total de seguros recogidos (valor_seguro de todos los préstamos)

      prestamosData.forEach((prestamo: any) => {
        const cronograma = prestamo.cronograma_pagos || []
        // Calcular saldo pendiente del préstamo: monto_total - valor_pagado acumulado
        const valorPagadoTotal = cronograma.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0)
        const saldoPrestamo = (prestamo.monto_total || 0) - valorPagadoTotal
        
        carteraTotal += saldoPrestamo
        saldoPendiente += saldoPrestamo
        totalCobrosRealizados += valorPagadoTotal
        totalCobrosProgramados += prestamo.monto_total || 0
        
        // Acumular para cálculo de caja
        totalPrestamosRealizados += prestamo.monto_principal || 0
        totalSeguros += prestamo.valor_seguro || 0
        totalPagosRecibidos += valorPagadoTotal
        segurosRecogidos += prestamo.valor_seguro || 0
        
        cronograma.forEach((cuota: any) => {
          // Calcular monto por vencer (próximos 30 días) - cuotas pendientes
          const fechaVencimiento = new Date(cuota.fecha_vencimiento)
          const hoy = new Date()
          const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diasDiferencia <= 30 && diasDiferencia >= 0 && cuota.estado !== 'pagado') {
            montoPorVencer += (cuota.valor_cuota || 0) - (cuota.valor_pagado || 0)
          }
          
          if (prestamo.valor_cuota) {
            totalCuotas += prestamo.valor_cuota
            cuotasConValor++
          }
        })
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

      // Calcular caja según la fórmula: +inversion_ruta - prestamos_realizados + seguros + pagos_recibidos
      const inversionRuta = rutaData?.inversion_ruta || 0
      const caja = inversionRuta - totalPrestamosRealizados + totalSeguros + totalPagosRecibidos

      return {
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos,
        prestamosPagados,
        carteraTotal,
        saldoPendiente,
        montoPorVencer,
        promedioCuota,
        rentabilidad,
        eficienciaCobro,
        clientesActivos,
        clientesMorosos,
        caja,
        segurosRecogidos
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
      .select(`
        estado,
        monto_principal,
        monto_total,
        valor_cuota,
        valor_seguro,
        cronograma_pagos!cronograma_pagos_prestamo_id_fkey (
          saldo_pendiente,
          fecha_vencimiento,
          valor_pagado
        )
      `)
      .eq("ruta_id", rutaId)
      .neq("estado", "E")

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
        segurosRecogidos: 0
      }
    }

    const totalPrestamos = prestamosData.length
    const prestamosActivos = prestamosData.filter(p => p.estado === "activo").length
    const prestamosVencidos = prestamosData.filter(p => p.estado === "vencido").length
    const prestamosPagados = prestamosData.filter(p => p.estado === "pagado").length
    
    let carteraTotal = 0
    let saldoPendiente = 0
    let montoPorVencer = 0
    let totalCuotas = 0
    let cuotasConValor = 0
    let totalCobrosRealizados = 0
    let totalCobrosProgramados = 0
    
    // Variables para cálculo de caja
    let totalPrestamosRealizados = 0 // Suma de monto_principal
    let totalSeguros = 0 // Suma de valor_seguro
    let totalPagosRecibidos = 0 // Suma de valor_pagado del cronograma
    let segurosRecogidos = 0 // Total de seguros recogidos (valor_seguro de todos los préstamos)

    prestamosData.forEach((prestamo: any) => {
      const cronograma = prestamo.cronograma_pagos || []
      const valorPagadoTotal = cronograma.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0)
      const saldoPrestamo = (prestamo.monto_total || 0) - valorPagadoTotal
      
      carteraTotal += saldoPrestamo
      saldoPendiente += saldoPrestamo
      totalCobrosRealizados += valorPagadoTotal
      totalCobrosProgramados += prestamo.monto_total || 0
      
      // Acumular para cálculo de caja
      totalPrestamosRealizados += prestamo.monto_principal || 0
      totalSeguros += prestamo.valor_seguro || 0
      totalPagosRecibidos += valorPagadoTotal
      segurosRecogidos += prestamo.valor_seguro || 0
      
      cronograma.forEach((cuota: any) => {
        const fechaVencimiento = new Date(cuota.fecha_vencimiento)
        const hoy = new Date()
        const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diasDiferencia <= 30 && diasDiferencia >= 0 && cuota.estado !== 'pagado') {
          montoPorVencer += (cuota.valor_cuota || 0) - (cuota.valor_pagado || 0)
        }
        
        if (prestamo.valor_cuota) {
          totalCuotas += prestamo.valor_cuota
          cuotasConValor++
        }
      })
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

    // Calcular caja según la fórmula: +inversion_ruta - prestamos_realizados + seguros + pagos_recibidos
    const inversionRuta = rutaData?.inversion_ruta || 0
    const caja = inversionRuta - totalPrestamosRealizados + totalSeguros + totalPagosRecibidos

    return {
      totalPrestamos,
      prestamosActivos,
      prestamosVencidos,
      prestamosPagados,
      carteraTotal,
      saldoPendiente,
      montoPorVencer,
      promedioCuota,
      rentabilidad,
      eficienciaCobro,
      clientesActivos,
      clientesMorosos,
      caja,
      segurosRecogidos
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
