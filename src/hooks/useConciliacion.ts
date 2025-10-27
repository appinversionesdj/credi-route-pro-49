import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { 
  ConciliacionDiaria, 
  ConciliacionExtendida, 
  FormularioConciliacion,
  ConciliacionFiltros,
  EstadisticasConciliacion,
  BaseDiaria
} from '@/types/conciliacion'
import { toast } from '@/hooks/use-toast'

export function useConciliaciones(filtros?: ConciliacionFiltros) {
  const [conciliaciones, setConciliaciones] = useState<ConciliacionExtendida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConciliaciones = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir query base
      let query = supabase
        .from('conciliacion_diaria')
        .select(`
          *,
          base_diaria:base_diaria_cobradores!inner (
            id,
            cobrador_id,
            ruta_id,
            fecha,
            monto_base_entregado,
            hora_inicio,
            hora_fin,
            monto_devuelto,
            estado,
            observaciones,
            cobrador:usuarios!base_diaria_cobradores_cobrador_id_fkey (
              id,
              user_id,
              nombre,
              apellido,
              telefono
            ),
            ruta:rutas (
              id,
              nombre_ruta,
              zona_geografica
            )
          ),
          persona_entrega:usuarios!conciliacion_diaria_persona_entrega_base_fkey (
            id,
            user_id,
            nombre,
            apellido
          ),
          conciliado_por_usuario:usuarios!conciliacion_diaria_conciliado_por_fkey (
            id,
            user_id,
            nombre,
            apellido
          )
        `)
        .order('fecha_conciliacion', { ascending: false })

      // Aplicar filtros
      if (filtros?.fecha_desde) {
        query = query.gte('base_diaria.fecha', filtros.fecha_desde)
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('base_diaria.fecha', filtros.fecha_hasta)
      }

      if (filtros?.estado_conciliacion) {
        query = query.eq('estado_conciliacion', filtros.estado_conciliacion)
      }

      if (filtros?.cobrador_id) {
        query = query.eq('base_diaria.cobrador_id', filtros.cobrador_id)
      }

      if (filtros?.ruta_id) {
        query = query.eq('base_diaria.ruta_id', filtros.ruta_id)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Transformar datos
      const conciliacionesExtendidas: ConciliacionExtendida[] = (data || []).map((item: any) => ({
        ...item,
        base_diaria: item.base_diaria ? {
          id: item.base_diaria.id,
          cobrador_id: item.base_diaria.cobrador_id,
          ruta_id: item.base_diaria.ruta_id,
          fecha: item.base_diaria.fecha,
          monto_base_entregado: item.base_diaria.monto_base_entregado,
          hora_inicio: item.base_diaria.hora_inicio,
          hora_fin: item.base_diaria.hora_fin,
          monto_devuelto: item.base_diaria.monto_devuelto,
          estado: item.base_diaria.estado,
          observaciones: item.base_diaria.observaciones,
          fecha_creacion: item.base_diaria.fecha_creacion,
          fecha_actualizacion: item.base_diaria.fecha_actualizacion
        } : undefined,
        cobrador: item.base_diaria?.cobrador ? {
          id: item.base_diaria.cobrador.user_id,
          nombre: item.base_diaria.cobrador.nombre,
          apellido: item.base_diaria.cobrador.apellido,
          telefono: item.base_diaria.cobrador.telefono
        } : undefined,
        ruta: item.base_diaria?.ruta ? {
          id: item.base_diaria.ruta.id,
          nombre_ruta: item.base_diaria.ruta.nombre_ruta,
          zona_geografica: item.base_diaria.ruta.zona_geografica
        } : undefined,
        persona_entrega: item.persona_entrega ? {
          id: item.persona_entrega.user_id,
          nombre: item.persona_entrega.nombre,
          apellido: item.persona_entrega.apellido
        } : undefined,
        conciliado_por_usuario: item.conciliado_por_usuario ? {
          id: item.conciliado_por_usuario.user_id,
          nombre: item.conciliado_por_usuario.nombre,
          apellido: item.conciliado_por_usuario.apellido
        } : undefined
      }))

      // Aplicar filtro de búsqueda si existe
      let conciliacionesFiltradas = conciliacionesExtendidas
      if (filtros?.busqueda) {
        const terminoBusqueda = filtros.busqueda.toLowerCase().trim()
        conciliacionesFiltradas = conciliacionesExtendidas.filter((conciliacion) => {
          const nombreCobrador = `${conciliacion.cobrador?.nombre} ${conciliacion.cobrador?.apellido}`.toLowerCase()
          const nombreRuta = conciliacion.ruta?.nombre_ruta?.toLowerCase() || ''
          const zona = conciliacion.ruta?.zona_geografica?.toLowerCase() || ''
          
          return nombreCobrador.includes(terminoBusqueda) ||
                 nombreRuta.includes(terminoBusqueda) ||
                 zona.includes(terminoBusqueda) ||
                 conciliacion.estado_conciliacion.toLowerCase().includes(terminoBusqueda)
        })
      }

      setConciliaciones(conciliacionesFiltradas)
      setLoading(false)
    } catch (err) {
      console.error('Error al cargar conciliaciones:', err)
      setError(err as Error)
      setLoading(false)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las conciliaciones',
        variant: 'destructive'
      })
    }
  }

  // Crear o actualizar conciliación
  const guardarConciliacion = async (
    datos: FormularioConciliacion,
    conciliacionId?: string
  ): Promise<ConciliacionDiaria | null> => {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener datos de la base diaria para calcular totales
      const { data: baseDiaria, error: baseDiariaError } = await supabase
        .from('base_diaria_cobradores')
        .select('*')
        .eq('id', datos.base_diaria_id)
        .single()

      if (baseDiariaError || !baseDiaria) {
        throw new Error('No se encontró la base diaria')
      }

      // Calcular totales de cobros realizados en el día
      const { data: pagosData } = await supabase
        .from('pagos_recibidos')
        .select(`
          monto_pagado,
          prestamo:prestamos!inner (
            ruta_id
          )
        `)
        .eq('fecha_pago', baseDiaria.fecha)
        .eq('prestamo.ruta_id', baseDiaria.ruta_id)
        .eq('estado', 'activo')

      const totalCobrosRealizados = pagosData?.reduce((sum, pago) => sum + Number(pago.monto_pagado), 0) || 0
      const cantidadCobrosRealizados = pagosData?.length || 0

      // Calcular préstamos nuevos del día
      const { data: prestamosData } = await supabase
        .from('prestamos')
        .select('monto_principal')
        .eq('fecha_desembolso', baseDiaria.fecha)
        .eq('ruta_id', baseDiaria.ruta_id)

      const totalPrestamosNuevos = prestamosData?.reduce((sum, prestamo) => sum + Number(prestamo.monto_principal), 0) || 0
      const cantidadPrestamosNuevos = prestamosData?.length || 0

      // Calcular gastos del día
      const { data: gastosData } = await supabase
        .from('gastos_diarios')
        .select('monto, estado_aprobacion')
        .eq('fecha_gasto', baseDiaria.fecha)
        .eq('ruta_id', baseDiaria.ruta_id)

      const totalGastos = gastosData?.reduce((sum, gasto) => sum + Number(gasto.monto), 0) || 0
      const totalGastosAprobados = gastosData?.filter(g => g.estado_aprobacion === 'aprobado')
        .reduce((sum, gasto) => sum + Number(gasto.monto), 0) || 0
      const totalGastosPendientes = gastosData?.filter(g => g.estado_aprobacion === 'pendiente')
        .reduce((sum, gasto) => sum + Number(gasto.monto), 0) || 0
      const cantidadGastos = gastosData?.length || 0

      // Calcular dinero teórico a devolver: Base + Cobros + Seguros - Préstamos - Gastos
      const dineroTeoricoDevolver = 
        datos.monto_base_entregado + 
        totalCobrosRealizados + 
        datos.total_seguros - 
        totalPrestamosNuevos - 
        totalGastosAprobados

      // Calcular diferencia
      const diferencia = datos.dinero_efectivamente_devuelto - dineroTeoricoDevolver

      // Determinar estado de conciliación
      let estadoConciliacion: 'cuadrado' | 'sobrante' | 'faltante' | 'auditoria' = 'cuadrado'
      if (diferencia > 0) {
        estadoConciliacion = 'sobrante'
      } else if (diferencia < 0) {
        estadoConciliacion = 'faltante'
      }

      // Si la diferencia es muy grande, marcar para auditoría
      if (Math.abs(diferencia) > 50000) {
        estadoConciliacion = 'auditoria'
      }

      const datosGuardar = {
        base_diaria_id: datos.base_diaria_id,
        monto_base_entregado: datos.monto_base_entregado,
        total_cobros_realizados: totalCobrosRealizados,
        cantidad_cobros_realizados: cantidadCobrosRealizados,
        total_prestamos_nuevos: totalPrestamosNuevos,
        cantidad_prestamos_nuevos: cantidadPrestamosNuevos,
        total_gastos: totalGastos,
        total_gastos_aprobados: totalGastosAprobados,
        total_gastos_pendientes: totalGastosPendientes,
        cantidad_gastos: cantidadGastos,
        total_seguros: datos.total_seguros,
        dinero_efectivamente_devuelto: datos.dinero_efectivamente_devuelto,
        dinero_teorico_devolver: dineroTeoricoDevolver,
        diferencia: diferencia,
        estado_conciliacion: estadoConciliacion,
        observaciones_cierre: datos.observaciones_cierre,
        justificacion_diferencia: datos.justificacion_diferencia,
        persona_entrega_base: datos.persona_entrega_base,
        nombre_persona_entrega: datos.nombre_persona_entrega,
        conciliado_por: user.id,
        fecha_conciliacion: new Date().toISOString()
      }

      let result
      if (conciliacionId) {
        // Actualizar conciliación existente
        const { data, error } = await supabase
          .from('conciliacion_diaria')
          .update(datosGuardar)
          .eq('id', conciliacionId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Crear nueva conciliación
        const { data, error } = await supabase
          .from('conciliacion_diaria')
          .insert(datosGuardar)
          .select()
          .single()

        if (error) throw error
        result = data

        // Actualizar estado de la base diaria
        await supabase
          .from('base_diaria_cobradores')
          .update({ 
            estado: 'conciliado',
            monto_devuelto: datos.dinero_efectivamente_devuelto
          })
          .eq('id', datos.base_diaria_id)
      }

      toast({
        title: 'Éxito',
        description: `Conciliación ${conciliacionId ? 'actualizada' : 'creada'} correctamente`,
      })

      await fetchConciliaciones()
      return result
    } catch (err) {
      console.error('Error al guardar conciliación:', err)
      toast({
        title: 'Error',
        description: `No se pudo ${conciliacionId ? 'actualizar' : 'crear'} la conciliación`,
        variant: 'destructive'
      })
      return null
    }
  }

  // Obtener estadísticas de conciliaciones
  const obtenerEstadisticas = async (): Promise<EstadisticasConciliacion> => {
    try {
      const { data, error } = await supabase
        .from('conciliacion_diaria')
        .select('diferencia, estado_conciliacion')

      if (error) throw error

      const estadisticas: EstadisticasConciliacion = {
        total_conciliaciones: data?.length || 0,
        total_cuadradas: data?.filter(c => c.estado_conciliacion === 'cuadrado').length || 0,
        total_sobrantes: data?.filter(c => c.estado_conciliacion === 'sobrante').length || 0,
        total_faltantes: data?.filter(c => c.estado_conciliacion === 'faltante').length || 0,
        total_pendientes: data?.filter(c => c.estado_conciliacion === 'pendiente').length || 0,
        total_diferencia: data?.reduce((sum, c) => sum + Number(c.diferencia || 0), 0) || 0,
        promedio_diferencia: data?.length > 0 
          ? data.reduce((sum, c) => sum + Number(c.diferencia || 0), 0) / data.length 
          : 0,
        mayor_sobrante: Math.max(...(data?.filter(c => c.diferencia > 0).map(c => Number(c.diferencia)) || [0])),
        mayor_faltante: Math.min(...(data?.filter(c => c.diferencia < 0).map(c => Number(c.diferencia)) || [0]))
      }

      return estadisticas
    } catch (err) {
      console.error('Error al obtener estadísticas:', err)
      return {
        total_conciliaciones: 0,
        total_cuadradas: 0,
        total_sobrantes: 0,
        total_faltantes: 0,
        total_pendientes: 0,
        total_diferencia: 0,
        promedio_diferencia: 0,
        mayor_sobrante: 0,
        mayor_faltante: 0
      }
    }
  }

  useEffect(() => {
    fetchConciliaciones()
  }, [
    filtros?.fecha_desde,
    filtros?.fecha_hasta,
    filtros?.cobrador_id,
    filtros?.ruta_id,
    filtros?.estado_conciliacion,
    filtros?.busqueda
  ])

  return {
    conciliaciones,
    loading,
    error,
    guardarConciliacion,
    obtenerEstadisticas,
    refetch: fetchConciliaciones
  }
}

// Hook para obtener una conciliación específica
export function useConciliacion(id: string) {
  const [conciliacion, setConciliacion] = useState<ConciliacionExtendida | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConciliacion = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('conciliacion_diaria')
        .select(`
          *,
          base_diaria:base_diaria_cobradores (
            *,
            cobrador:usuarios!base_diaria_cobradores_cobrador_id_fkey (
              id,
              user_id,
              nombre,
              apellido,
              telefono
            ),
            ruta:rutas (
              id,
              nombre_ruta,
              zona_geografica
            )
          ),
          persona_entrega:usuarios!conciliacion_diaria_persona_entrega_base_fkey (
            id,
            user_id,
            nombre,
            apellido
          ),
          conciliado_por_usuario:usuarios!conciliacion_diaria_conciliado_por_fkey (
            id,
            user_id,
            nombre,
            apellido
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        const conciliacionExtendida: ConciliacionExtendida = {
          ...data,
          base_diaria: data.base_diaria || undefined,
          cobrador: data.base_diaria?.cobrador ? {
            id: data.base_diaria.cobrador.user_id,
            nombre: data.base_diaria.cobrador.nombre,
            apellido: data.base_diaria.cobrador.apellido,
            telefono: data.base_diaria.cobrador.telefono
          } : undefined,
          ruta: data.base_diaria?.ruta || undefined,
          persona_entrega: data.persona_entrega ? {
            id: data.persona_entrega.user_id,
            nombre: data.persona_entrega.nombre,
            apellido: data.persona_entrega.apellido
          } : undefined,
          conciliado_por_usuario: data.conciliado_por_usuario ? {
            id: data.conciliado_por_usuario.user_id,
            nombre: data.conciliado_por_usuario.nombre,
            apellido: data.conciliado_por_usuario.apellido
          } : undefined
        }
        setConciliacion(conciliacionExtendida)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error al cargar conciliación:', err)
      setError(err as Error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchConciliacion()
    }
  }, [id])

  return {
    conciliacion,
    loading,
    error,
    refetch: fetchConciliacion
  }
}

// Hook para obtener bases diarias pendientes de conciliación
export function useBasesDiariasPendientes() {
  const [basesPendientes, setBasesPendientes] = useState<BaseDiaria[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBasesPendientes = async () => {
    try {
      setLoading(true)

      // Obtener bases diarias que no tienen conciliación
      const { data: basesData, error } = await supabase
        .from('base_diaria_cobradores')
        .select(`
          *,
          conciliacion:conciliacion_diaria!conciliacion_diaria_base_diaria_id_fkey(id)
        `)
        .in('estado', ['finalizado', 'en_ruta'])
        .order('fecha', { ascending: false })

      if (error) throw error

      // Filtrar solo las que no tienen conciliación
      const basesSinConciliacion = basesData?.filter(base => !base.conciliacion || base.conciliacion.length === 0) || []
      
      setBasesPendientes(basesSinConciliacion as any)
      setLoading(false)
    } catch (err) {
      console.error('Error al cargar bases pendientes:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBasesPendientes()
  }, [])

  return {
    basesPendientes,
    loading,
    refetch: fetchBasesPendientes
  }
}

