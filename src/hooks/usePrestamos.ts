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

      // Consulta optimizada con JOIN directo a deudores
      console.log("📊 Obteniendo préstamos...")
      let query = supabase
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
          )
        `)
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

      // Procesar datos usando los campos directos de la tabla prestamos
      let prestamosExtendidos: PrestamoExtendido[] = (data || []).map((prestamo: any) => {
        const cuotasPagadas = prestamo.cuotas_pagadas || 0
        const cuotasTotales = prestamo.numero_cuotas
        const saldoPendiente = prestamo.saldo_pendiente || 0
        
        // Calcular próxima fecha de pago basado en la periodicidad y fecha del último pago
        let proximaFecha = null
        if (cuotasPagadas < cuotasTotales) {
          // Si no ha pagado ninguna cuota, la próxima es la primera
          if (cuotasPagadas === 0) {
            proximaFecha = prestamo.fecha_primer_pago
          } else {
            // Calcular la próxima fecha según la periodicidad
            const fechaBase = prestamo.fecha_ultimo_pago || prestamo.fecha_primer_pago
            const fecha = new Date(fechaBase)
            
            // Agregar el período correspondiente
            switch (prestamo.periodicidad) {
              case 'diario':
                fecha.setDate(fecha.getDate() + 1)
                break
              case 'semanal':
                fecha.setDate(fecha.getDate() + 7)
                break
              case 'quincenal':
                fecha.setDate(fecha.getDate() + 15)
                break
              case 'mensual':
                fecha.setMonth(fecha.getMonth() + 1)
                break
            }
            proximaFecha = fecha.toISOString().split('T')[0]
          }
        }
        
        const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0

        return {
          ...prestamo,
          cliente: prestamo.deudores,
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
      
      // Verificar si tiene pagos registrados usando el campo cuotas_pagadas
      const { data: prestamo } = await supabase
        .from("prestamos")
        .select("cuotas_pagadas")
        .eq("id", id)
        .single()

      if (prestamo && (prestamo.cuotas_pagadas || 0) > 0) {
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
        .select("estado, monto_principal, monto_total, valor_cuota, saldo_pendiente, cuotas_pagadas, numero_cuotas")
        .neq("estado", "E") as any // Excluir préstamos inactivados

      if (!prestamosData) return null

      const totalPrestamos = prestamosData.length
      const prestamosActivos = prestamosData.filter((p: any) => p.estado === "activo").length
      const prestamosVencidos = prestamosData.filter((p: any) => p.estado === "vencido").length
      const prestamosPagados = prestamosData.filter((p: any) => p.estado === "pagado").length
      
      let carteraTotal = 0
      let saldoPendiente = 0
      let totalCuotas = 0
      let cuotasConValor = 0

      prestamosData.forEach((prestamo: any) => {
        // Usar el campo saldo_pendiente directo de la tabla
        const saldoPrestamo = prestamo.saldo_pendiente || 0
        
        // La cartera total es la suma de los saldos pendientes
        carteraTotal += saldoPrestamo
        saldoPendiente += saldoPrestamo
        
        // Calcular promedio de cuota
        if (prestamo.valor_cuota) {
          totalCuotas += prestamo.valor_cuota
          cuotasConValor++
        }
      })

      const promedioCuota = cuotasConValor > 0 ? totalCuotas / cuotasConValor : 0

      return {
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos,
        prestamosPagados,
        carteraTotal,
        saldoPendiente,
        montoPorVencer: 0, // Ya no calculamos esto
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
            )
          `)
          .eq("id", id)
          .single()

        if (fetchError) throw fetchError

        // Procesar datos usando campos directos de la tabla
        const prestamoData = data as any
        const cuotasPagadas = prestamoData.cuotas_pagadas || 0
        const cuotasTotales = prestamoData.numero_cuotas
        const saldoPendiente = prestamoData.saldo_pendiente || 0
        
        // Calcular próxima fecha de pago
        let proximaFecha = null
        if (cuotasPagadas < cuotasTotales) {
          if (cuotasPagadas === 0) {
            proximaFecha = prestamoData.fecha_primer_pago
          } else {
            const fechaBase = prestamoData.fecha_ultimo_pago || prestamoData.fecha_primer_pago
            const fecha = new Date(fechaBase)
            
            switch (prestamoData.periodicidad) {
              case 'diario':
                fecha.setDate(fecha.getDate() + 1)
                break
              case 'semanal':
                fecha.setDate(fecha.getDate() + 7)
                break
              case 'quincenal':
                fecha.setDate(fecha.getDate() + 15)
                break
              case 'mensual':
                fecha.setMonth(fecha.getMonth() + 1)
                break
            }
            proximaFecha = fecha.toISOString().split('T')[0]
          }
        }
        
        const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0

        const prestamoExtendido: PrestamoExtendido = {
          ...prestamoData,
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
