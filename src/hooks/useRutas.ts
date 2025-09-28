import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useToast } from './use-toast'
import { RutaExtendida, RutaFiltros, RutaEstadisticas, BaseDiaria } from '../types/ruta'

export const useRutas = () => {
  const [rutas, setRutas] = useState<RutaExtendida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRutas = async (filtros?: RutaFiltros) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('rutas')
        .select(`
          *,
          usuarios!rutas_usuario_id_fkey(
            id,
            nombre,
            apellido,
            cedula,
            telefono
          )
        `)
        .order('fecha_creacion', { ascending: false })

      if (filtros?.busqueda) {
        query = query.ilike('nombre_ruta', `%${filtros.busqueda}%`)
      }
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado)
      }
      if (filtros?.zona_geografica) {
        query = query.eq('zona_geografica', filtros.zona_geografica)
      }

      const { data, error } = await query

      if (error) throw error

      // Obtener estadísticas para cada ruta
      const rutasConEstadisticas = await Promise.all(
        (data || []).map(async (ruta) => {
          const estadisticas = await obtenerEstadisticasRuta(ruta.id)
          const cobradores = await obtenerCobradoresRuta(ruta.id)
          
          return {
            ...ruta,
            estadisticas,
            cobradores
          }
        })
      )

      setRutas(rutasConEstadisticas)
    } catch (error) {
      console.error('Error obteniendo rutas:', error)
      setError('Error al cargar las rutas')
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const obtenerEstadisticasRuta = async (rutaId: string) => {
    try {
      // Obtener préstamos de la ruta
      const { data: prestamos, error: prestamosError } = await supabase
        .from('prestamos')
        .select('*')
        .eq('ruta_id', rutaId)

      if (prestamosError) throw prestamosError

      const totalPrestamos = prestamos?.length || 0
      const prestamosActivos = prestamos?.filter(p => p.estado === 'activo').length || 0
      const montoTotal = prestamos?.reduce((sum, p) => sum + p.monto_total, 0) || 0
      
      // Obtener cronograma para calcular saldo pendiente
      const { data: cronograma, error: cronogramaError } = await supabase
        .from('cronograma_pagos')
        .select('*')
        .in('prestamo_id', prestamos?.map(p => p.id) || [])

      if (cronogramaError) throw cronogramaError

      const saldoPendiente = cronograma?.reduce((sum, c) => 
        c.estado === 'pendiente' ? sum + (c.valor_cuota - (c.valor_pagado || 0)) : sum, 0
      ) || 0

      const carteraVencida = cronograma?.filter(c => {
        if (c.estado !== 'pendiente') return false
        const fechaVencimiento = new Date(c.fecha_vencimiento)
        const hoy = new Date()
        return fechaVencimiento < hoy
      }).reduce((sum, c) => sum + (c.valor_cuota - (c.valor_pagado || 0)), 0) || 0

      const tasaRecuperacion = montoTotal > 0 ? ((montoTotal - saldoPendiente) / montoTotal) * 100 : 0

      // Obtener cobradores asignados
      const { data: cobradoresData, error: cobradoresError } = await supabase
        .from('cobrador_ruta')
        .select('cobrador_id')
        .eq('ruta_id', rutaId)
        .eq('estado', 'activo')

      const cobradores = cobradoresData?.length || 0

      return {
        totalPrestamos,
        prestamosActivos,
        montoTotal,
        saldoPendiente,
        carteraVencida,
        tasaRecuperacion,
        cobradores
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas de ruta:', error)
      return {
        totalPrestamos: 0,
        prestamosActivos: 0,
        montoTotal: 0,
        saldoPendiente: 0,
        carteraVencida: 0,
        tasaRecuperacion: 0,
        cobradores: 0
      }
    }
  }

  const obtenerCobradoresRuta = async (rutaId: string) => {
    try {
      const { data, error } = await supabase
        .from('cobrador_ruta')
        .select(`
          cobrador_id,
          usuarios!cobrador_ruta_cobrador_id_fkey(
            id,
            nombre,
            apellido,
            cedula,
            telefono
          )
        `)
        .eq('ruta_id', rutaId)
        .eq('estado', 'activo')

      if (error) throw error

      return data?.map(item => item.usuarios).filter(Boolean) || []
    } catch (error) {
      console.error('Error obteniendo cobradores de ruta:', error)
      return []
    }
  }

  const obtenerEstadisticasGenerales = async (): Promise<RutaEstadisticas> => {
    try {
      const { data: rutas, error: rutasError } = await supabase
        .from('rutas')
        .select('*')

      if (rutasError) throw rutasError

      const totalRutas = rutas?.length || 0
      const rutasActivas = rutas?.filter(r => r.estado === 'activa').length || 0
      const rutasInactivas = totalRutas - rutasActivas

      // Obtener todas las estadísticas de rutas
      const estadisticasDetalladas = await Promise.all(
        (rutas || []).map(ruta => obtenerEstadisticasRuta(ruta.id))
      )

      const totalCartera = estadisticasDetalladas.reduce((sum, est) => sum + est.montoTotal, 0)
      const saldoPendiente = estadisticasDetalladas.reduce((sum, est) => sum + est.saldoPendiente, 0)
      const carteraVencida = estadisticasDetalladas.reduce((sum, est) => sum + est.carteraVencida, 0)
      const tasaRecuperacionPromedio = estadisticasDetalladas.length > 0 
        ? estadisticasDetalladas.reduce((sum, est) => sum + est.tasaRecuperacion, 0) / estadisticasDetalladas.length
        : 0
      const cobradores = estadisticasDetalladas.reduce((sum, est) => sum + est.cobradores, 0)

      return {
        totalRutas,
        rutasActivas,
        rutasInactivas,
        totalCartera,
        saldoPendiente,
        carteraVencida,
        tasaRecuperacionPromedio,
        cobradores
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error)
      return {
        totalRutas: 0,
        rutasActivas: 0,
        rutasInactivas: 0,
        totalCartera: 0,
        saldoPendiente: 0,
        carteraVencida: 0,
        tasaRecuperacionPromedio: 0,
        cobradores: 0
      }
    }
  }

  const obtenerBasesDiarias = async (rutaId: string, fecha?: string): Promise<BaseDiaria[]> => {
    try {
      let query = supabase
        .from('base_diaria_cobradores')
        .select(`
          *,
          usuarios!base_diaria_cobradores_cobrador_id_fkey(
            nombre,
            apellido
          )
        `)
        .eq('ruta_id', rutaId)
        .order('fecha', { ascending: false })

      if (fecha) {
        query = query.eq('fecha', fecha)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(item => ({
        ...item,
        cobrador: item.usuarios
      }))
    } catch (error) {
      console.error('Error obteniendo bases diarias:', error)
      return []
    }
  }

  useEffect(() => {
    fetchRutas()
  }, [])

  return {
    rutas,
    loading,
    error,
    refetch: fetchRutas,
    obtenerEstadisticasGenerales,
    obtenerBasesDiarias
  }
}