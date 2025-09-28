import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useToast } from './use-toast'

export interface DetallePrestamo {
  id: string
  numero_prestamo: string
  monto_principal: number
  tasa_interes: number
  valor_seguro: number
  periodicidad: string
  numero_cuotas: number
  valor_cuota: number
  monto_total: number
  fecha_desembolso: string
  fecha_primer_pago: string
  estado: string
  observaciones?: string
  fecha_creacion: string
  // Información del cliente
  cliente: {
    id: string
    nombre: string
    apellido: string
    cedula: number
    telefono?: string
    direccion?: string
    ocupacion?: string
  }
  // Información de la ruta
  ruta: {
    id: string
    nombre_ruta: string
    descripcion?: string
    zona_geografica?: string
  }
  // Cronograma de pagos
  cronograma: CronogramaPago[]
  // Estadísticas calculadas
  estadisticas: {
    cuotas_pagadas: number
    cuotas_totales: number
    cuotas_pendientes: number
    saldo_pendiente: number
    monto_pagado: number
    proxima_cuota?: CronogramaPago
    cuotas_vencidas: number
  }
}

export interface CronogramaPago {
  id: string
  prestamo_id: string
  numero_cuota: number
  fecha_vencimiento: string
  valor_cuota: number
  valor_capital: number
  valor_interes: number
  saldo_pendiente: number
  estado: 'pendiente' | 'pagado' | 'vencido'
  valor_pagado: number
  fecha_pago?: string
  fecha_creacion: string
}

export const useDetallePrestamo = (prestamoId: string) => {
  const [detalle, setDetalle] = useState<DetallePrestamo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDetallePrestamo = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información del préstamo
      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .select(`
          *,
          deudores!inner(
            id,
            nombre,
            apellido,
            cedula,
            telefono,
            direccion,
            ocupacion
          ),
          rutas!inner(
            id,
            nombre_ruta,
            descripcion,
            zona_geografica
          )
        `)
        .eq('id', prestamoId)
        .single()

      if (prestamoError) throw prestamoError

      // Obtener cronograma de pagos
      const { data: cronograma, error: cronogramaError } = await supabase
        .from('cronograma_pagos')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .order('numero_cuota')

      if (cronogramaError) throw cronogramaError

      // Calcular estadísticas
      const cuotasPagadas = cronograma.filter(c => c.estado === 'pagado').length
      const cuotasTotales = cronograma.length
      const cuotasPendientes = cuotasTotales - cuotasPagadas
      const saldoPendiente = cronograma.reduce((sum, c) => 
        c.estado === 'pendiente' ? sum + c.saldo_pendiente : sum, 0
      )
      const montoPagado = cronograma.reduce((sum, c) => 
        c.estado === 'pagado' ? sum + c.valor_pagado : sum, 0
      )
      
      const proximaCuota = cronograma.find(c => c.estado === 'pendiente')
      const cuotasVencidas = cronograma.filter(c => {
        if (c.estado !== 'pendiente') return false
        const fechaVencimiento = new Date(c.fecha_vencimiento)
        const hoy = new Date()
        return fechaVencimiento < hoy
      }).length

      const detalleCompleto: DetallePrestamo = {
        id: prestamo.id,
        numero_prestamo: prestamo.numero_prestamo,
        monto_principal: prestamo.monto_principal,
        tasa_interes: prestamo.tasa_interes,
        valor_seguro: prestamo.valor_seguro,
        periodicidad: prestamo.periodicidad,
        numero_cuotas: prestamo.numero_cuotas,
        valor_cuota: prestamo.valor_cuota,
        monto_total: prestamo.monto_total,
        fecha_desembolso: prestamo.fecha_desembolso,
        fecha_primer_pago: prestamo.fecha_primer_pago,
        estado: prestamo.estado,
        observaciones: prestamo.observaciones,
        fecha_creacion: prestamo.fecha_creacion,
        cliente: prestamo.deudores,
        ruta: prestamo.rutas,
        cronograma: (cronograma || []).map(c => ({
          ...c,
          estado: c.estado as 'pendiente' | 'pagado' | 'vencido'
        })),
        estadisticas: {
          cuotas_pagadas: cuotasPagadas,
          cuotas_totales: cuotasTotales,
          cuotas_pendientes: cuotasPendientes,
          saldo_pendiente: saldoPendiente,
          monto_pagado: montoPagado,
          proxima_cuota: proximaCuota ? {
            ...proximaCuota,
            estado: proximaCuota.estado as 'pendiente' | 'pagado' | 'vencido'
          } : undefined,
          cuotas_vencidas: cuotasVencidas
        }
      }

      setDetalle(detalleCompleto)
    } catch (error) {
      console.error('Error obteniendo detalle del préstamo:', error)
      setError('Error al cargar los detalles del préstamo')
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del préstamo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prestamoId) {
      fetchDetallePrestamo()
    }
  }, [prestamoId])

  return {
    detalle,
    loading,
    error,
    refetch: fetchDetallePrestamo
  }
}
