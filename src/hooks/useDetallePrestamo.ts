import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useToast } from './use-toast'

export interface PagoRegistrado {
  id: string
  prestamo_id: string
  monto_pagado: number
  fecha_pago: string
  hora_pago?: string
  tipo_pago: string
  observaciones?: string
  foto_comprobante_url?: string
  registrado_por?: string
  cobrador?: {
    nombre: string
    apellido: string
  }
}

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
  // Pagos registrados
  pagos: PagoRegistrado[]
  // Estadísticas calculadas
  estadisticas: {
    cuotas_pagadas: number
    cuotas_totales: number
    cuotas_pendientes: number
    saldo_pendiente: number
    monto_pagado: number
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

      // Obtener pagos registrados del préstamo
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos_recibidos')
        .select(`
          *,
          usuarios!pagos_recibidos_registrado_por_fkey (
            nombre,
            apellido
          )
        `)
        .eq('prestamo_id', prestamoId)
        .order('fecha_pago', { ascending: false })

      if (pagosError) throw pagosError

      // Calcular estadísticas desde los campos directos del préstamo
      const cuotasPagadas = prestamo.cuotas_pagadas || 0
      const cuotasTotales = prestamo.numero_cuotas || 0
      const cuotasPendientes = cuotasTotales - cuotasPagadas
      const saldoPendiente = prestamo.saldo_pendiente || 0
      const montoPagado = prestamo.monto_total - saldoPendiente
      
      // Calcular cuotas vencidas usando la lógica existente
      const calcularCuotasVencidas = () => {
        if (!prestamo.fecha_primer_pago || cuotasPagadas >= cuotasTotales) {
          return 0
        }

        const fechaHoy = new Date()
        const fechaInicio = new Date(prestamo.fecha_primer_pago)
        
        let diasEntreCuotas = 0
        switch (prestamo.periodicidad) {
          case 'diario':
            diasEntreCuotas = 1
            break
          case 'semanal':
            diasEntreCuotas = 7
            break
          case 'quincenal':
            diasEntreCuotas = 15
            break
          case 'mensual':
            diasEntreCuotas = 30
            break
          default:
            diasEntreCuotas = 7
        }

        const diasTranscurridos = Math.floor((fechaHoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diasTranscurridos < 0) {
          return 0
        }

        const cuotasQueDeberianEstarPagadas = Math.floor(diasTranscurridos / diasEntreCuotas) + 1
        const cuotasVencidas = Math.max(0, cuotasQueDeberianEstarPagadas - cuotasPagadas)
        
        return Math.min(cuotasVencidas, cuotasPendientes)
      }
      
      const cuotasVencidas = calcularCuotasVencidas()

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
        pagos: pagos?.map(p => ({
          ...p,
          cobrador: p.usuarios
        })) || [],
        estadisticas: {
          cuotas_pagadas: cuotasPagadas,
          cuotas_totales: cuotasTotales,
          cuotas_pendientes: cuotasPendientes,
          saldo_pendiente: saldoPendiente,
          monto_pagado: montoPagado,
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
