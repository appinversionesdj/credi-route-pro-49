import { useState, useEffect } from "react"
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client"
import { 
  Prestamo, 
  PrestamoExtendido, 
  PrestamoInsert, 
  PrestamoUpdate, 
  PrestamoFiltros,
  PrestamoEstadisticas 
} from "@/types/prestamo"
import { useToast } from "@/hooks/use-toast"

export function usePrestamos(filtros?: PrestamoFiltros) {
  const [prestamos, setPrestamos] = useState<PrestamoExtendido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para obtener préstamos con información extendida
  const fetchPrestamos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primero, probar la conexión básica
      console.log("🔍 Probando conexión a Supabase...")
      const connectionTest = await testSupabaseConnection()
      if (!connectionTest) {
        throw new Error("No se pudo conectar a Supabase")
      }

      // Consulta simplificada para evitar problemas con RLS en joins
      console.log("📊 Obteniendo préstamos...")
      let query = supabase
        .from("prestamos")
        .select("*")
        .neq("estado", "E") // Excluir préstamos eliminados (inactivados)

      // Aplicar filtros básicos

      if (filtros?.estado) {
        query = query.eq("estado", filtros.estado)
      }

      if (filtros?.ruta_id) {
        query = query.eq("ruta_id", filtros.ruta_id)
      }

      if (filtros?.fecha_desde) {
        query = query.gte("fecha_desembolso", filtros.fecha_desde)
      }

      if (filtros?.fecha_hasta) {
        query = query.lte("fecha_desembolso", filtros.fecha_hasta)
      }

      const { data, error: fetchError } = await query.order("fecha_creacion", { ascending: false })

      if (fetchError) {
        console.error("❌ Error de Supabase:", fetchError)
        throw fetchError
      }

      console.log("✅ Préstamos obtenidos:", data?.length || 0)

      // Obtener información de clientes y rutas por separado
      const prestamoIds = (data || []).map((p: any) => p.id)
      const deudorIds = [...new Set((data || []).map((p: any) => p.deudor_id))]
      const rutaIds = [...new Set((data || []).map((p: any) => p.ruta_id))]

      // Obtener clientes
      const { data: clientesData } = await supabase
        .from("deudores")
        .select("id, nombre, apellido, cedula, telefono, direccion")
        .in("id", deudorIds)

      // Obtener rutas
      const { data: rutasData } = await supabase
        .from("rutas")
        .select("id, nombre_ruta")
        .in("id", rutaIds)

      // Obtener cronograma de pagos
      const { data: cronogramaData } = await supabase
        .from("cronograma_pagos")
        .select("*")
        .in("prestamo_id", prestamoIds)

      // Crear mapas para acceso rápido
      const clientesMap = new Map(clientesData?.map(c => [c.id, c]) || [])
      const rutasMap = new Map(rutasData?.map(r => [r.id, r]) || [])
      const cronogramaMap = new Map()
      
      cronogramaData?.forEach(c => {
        if (!cronogramaMap.has(c.prestamo_id)) {
          cronogramaMap.set(c.prestamo_id, [])
        }
        cronogramaMap.get(c.prestamo_id).push(c)
      })

      // Procesar datos para agregar información calculada
      let prestamosExtendidos: PrestamoExtendido[] = (data || []).map((prestamo: any) => {
        const cronograma = cronogramaMap.get(prestamo.id) || []
        const cuotasPagadas = cronograma.filter((c: any) => c.estado === "pagado" || c.valor_pagado > 0).length
        const cuotasTotales = prestamo.numero_cuotas
        // Calcular saldo pendiente: monto_total - valor_pagado acumulado
        const valorPagadoTotal = cronograma.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0)
        const saldoPendiente = (prestamo.monto_total || 0) - valorPagadoTotal
        
        // Calcular próxima fecha de pago
        const proximaCuota = cronograma
          .filter((c: any) => !c.fecha_pago && new Date(c.fecha_vencimiento) >= new Date())
          .sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0]
        
        const proximaFecha = proximaCuota?.fecha_vencimiento || null
        const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0

        return {
          ...prestamo,
          cliente: clientesMap.get(prestamo.deudor_id),
          ruta: rutasMap.get(prestamo.ruta_id),
          cuotasPagadas,
          cuotasTotales,
          saldoPendiente,
          proximaFecha,
          progreso
        }
      })

      // Aplicar filtro de búsqueda por cliente si existe
      if (filtros?.busqueda) {
        const terminoBusqueda = filtros.busqueda.toLowerCase().trim()
        
        // Si el término de búsqueda está vacío, mostrar todos
        if (terminoBusqueda !== '') {
          prestamosExtendidos = prestamosExtendidos.filter((prestamo) => {
            // Buscar en número de préstamo
            if (prestamo.numero_prestamo?.toLowerCase().includes(terminoBusqueda)) {
              return true
            }
            
            // Buscar en datos del cliente
            if (prestamo.cliente) {
              const nombre = prestamo.cliente.nombre?.toLowerCase() || ''
              const apellido = prestamo.cliente.apellido?.toLowerCase() || ''
              const nombreCompleto = `${nombre} ${apellido}`.trim()
              const cedula = prestamo.cliente.cedula?.toString() || ''
              
              // Buscar coincidencias
              if (nombre.includes(terminoBusqueda) || 
                  apellido.includes(terminoBusqueda) ||
                  nombreCompleto.includes(terminoBusqueda) || 
                  cedula.includes(terminoBusqueda)) {
                return true
              }
            }
            
            return false
          })
        }
      }

      setPrestamos(prestamosExtendidos)
    } catch (err) {
      console.error("❌ Error completo:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar préstamos"
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

  // Crear nuevo préstamo
  const crearPrestamo = async (prestamoData: PrestamoInsert): Promise<Prestamo | null> => {
    try {
      setLoading(true)
      
      const { data, error: insertError } = await supabase
        .from("prestamos")
        .insert([prestamoData])
        .select()
        .single()

      if (insertError) throw insertError

      toast({
        title: "Préstamo creado",
        description: "El préstamo ha sido creado exitosamente"
      })

      // Recargar la lista
      await fetchPrestamos()
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear préstamo"
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

  // Actualizar préstamo
  const actualizarPrestamo = async (id: string, prestamoData: PrestamoUpdate): Promise<boolean> => {
    try {
      setLoading(true)
      
      const { error: updateError } = await supabase
        .from("prestamos")
        .update({
          ...prestamoData,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Préstamo actualizado",
        description: "Los datos del préstamo han sido actualizados"
      })

      // Recargar la lista
      await fetchPrestamos()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar préstamo"
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

  // Eliminar préstamo
  const eliminarPrestamo = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Verificar si tiene pagos registrados
      const { data: pagos } = await supabase
        .from("cronograma_pagos")
        .select("id")
        .eq("prestamo_id", id)
        .not("valor_pagado", "is", null)

      if (pagos && pagos.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "El préstamo tiene pagos registrados",
          variant: "destructive"
        })
        return false
      }

      const { error: deleteError } = await supabase
        .from("prestamos")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      toast({
        title: "Préstamo eliminado",
        description: "El préstamo ha sido eliminado exitosamente"
      })

      // Recargar la lista
      await fetchPrestamos()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar préstamo"
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

  // Inactivar préstamo (eliminación virtual)
  const inactivarPrestamo = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      const { error: updateError } = await supabase
        .from("prestamos")
        .update({ estado: "E" })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Préstamo inactivado",
        description: "El préstamo ha sido inactivado exitosamente"
      })

      // Recargar la lista
      await fetchPrestamos()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al inactivar préstamo"
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

  // Obtener estadísticas
  const obtenerEstadisticas = async (): Promise<PrestamoEstadisticas | null> => {
    try {
      const { data: prestamosData } = await supabase
        .from("prestamos")
        .select(`
          estado,
          monto_principal,
          monto_total,
          valor_cuota,
          cronograma_pagos!cronograma_pagos_prestamo_id_fkey (
            saldo_pendiente,
            fecha_vencimiento,
            valor_pagado
          )
        `)
        .neq("estado", "E") // Excluir préstamos inactivados

      if (!prestamosData) return null

      const totalPrestamos = prestamosData.length
      const prestamosActivos = prestamosData.filter(p => p.estado === "activo").length
      const prestamosVencidos = prestamosData.filter(p => p.estado === "vencido").length
      const prestamosPagados = prestamosData.filter(p => p.estado === "pagado").length
      
      let carteraTotal = 0
      let saldoPendiente = 0
      let montoPorVencer = 0
      let totalCuotas = 0
      let cuotasConValor = 0

      prestamosData.forEach((prestamo: any) => {
        const cronograma = prestamo.cronograma_pagos || []
        // Calcular saldo pendiente del préstamo: monto_total - valor_pagado acumulado
        const valorPagadoTotal = cronograma.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0)
        const saldoPrestamo = (prestamo.monto_total || 0) - valorPagadoTotal
        
        // La cartera total es la suma de los saldos pendientes
        carteraTotal += saldoPrestamo
        saldoPendiente += saldoPrestamo
        
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

      return {
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos,
        prestamosPagados,
        carteraTotal,
        saldoPendiente,
        montoPorVencer,
        promedioCuota
      }
    } catch (err) {
      console.error("Error al obtener estadísticas:", err)
      return null
    }
  }

  // Cargar datos al montar el componente o cambiar filtros
  useEffect(() => {
    fetchPrestamos()
  }, [filtros?.busqueda, filtros?.estado, filtros?.ruta_id, filtros?.fecha_desde, filtros?.fecha_hasta])

  return {
    prestamos,
    loading,
    error,
    crearPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    inactivarPrestamo,
    obtenerEstadisticas,
    refetch: fetchPrestamos
  }
}

// Hook para obtener un préstamo específico
export function usePrestamo(id: string) {
  const [prestamo, setPrestamo] = useState<PrestamoExtendido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrestamo = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("prestamos")
          .select(`
            *,
            deudores!prestamos_deudor_id_fkey (
              id,
              nombre,
              apellido,
              cedula,
              telefono,
              direccion
            ),
            rutas!prestamos_ruta_id_fkey (
              id,
              nombre_ruta
            ),
            cronograma_pagos!cronograma_pagos_prestamo_id_fkey (
              *
            )
          `)
          .eq("id", id)
          .single()

        if (fetchError) throw fetchError

        // Procesar datos
        const cronograma = data.cronograma_pagos || []
        const cuotasPagadas = cronograma.filter((c: any) => c.estado === "pagado" || c.valor_pagado > 0).length
        const cuotasTotales = data.numero_cuotas
        // Calcular saldo pendiente: monto_total - valor_pagado acumulado
        const valorPagadoTotal = cronograma.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0)
        const saldoPendiente = (prestamo.monto_total || 0) - valorPagadoTotal
        
        const proximaCuota = cronograma
          .filter((c: any) => !c.fecha_pago && new Date(c.fecha_vencimiento) >= new Date())
          .sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0]
        
        const proximaFecha = proximaCuota?.fecha_vencimiento || null
        const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0

        const prestamoExtendido: PrestamoExtendido = {
          ...data,
          cuotasPagadas,
          cuotasTotales,
          saldoPendiente,
          proximaFecha,
          progreso
        }

        setPrestamo(prestamoExtendido)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar préstamo"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPrestamo()
    }
  }, [id])

  return { prestamo, loading, error }
}
