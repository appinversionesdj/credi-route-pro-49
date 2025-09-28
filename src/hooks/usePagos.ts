import { useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useToast } from './use-toast'

export interface PagoData {
  prestamo_id: string
  monto: number
  fecha_pago: string
  metodo_pago: 'efectivo' | 'transferencia' | 'cheque' | 'otro'
  observaciones?: string
  recibo_numero?: string
}

export interface PagoCompleto {
  id: string
  prestamo_id: string
  monto: number
  fecha_pago: string
  metodo_pago: string
  observaciones?: string
  recibo_numero?: string
  fecha_creacion: string
  creado_por?: string
}

export const usePagos = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const registrarPago = async (pagoData: PagoData): Promise<boolean> => {
    try {
      setLoading(true)

      // Obtener el usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener el empresa_id del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, empresa_id')
        .eq('user_id', user.id)
        .single()

      if (usuarioError || !usuarioData) {
        throw new Error('No se pudo obtener la empresa del usuario')
      }

      // Obtener todas las cuotas del préstamo ordenadas por número de cuota (más antiguas primero)
      const { data: cuotas, error: cuotasError } = await supabase
        .from('cronograma_pagos')
        .select('*')
        .eq('prestamo_id', pagoData.prestamo_id)
        .order('numero_cuota', { ascending: true })

      if (cuotasError) throw cuotasError

      // Filtrar solo las cuotas pendientes, abonadas o vencidas
      const cuotasPendientes = cuotas.filter(cuota => 
        cuota.estado === 'pendiente' || cuota.estado === 'abonado' || cuota.estado === 'vencido'
      )

      // Aplicar la lógica de distribución de pagos
      let montoRestante = pagoData.monto
      const fechaHoy = new Date().toISOString().split('T')[0]
      const actualizaciones = []
      const pagosRegistrados = []

      for (const cuota of cuotasPendientes) {
        if (montoRestante <= 0) break

        // Calcular cuánto falta por pagar en esta cuota
        const saldoPendiente = cuota.valor_cuota - (cuota.valor_pagado || 0)
        
        if (saldoPendiente > 0) {
          // Aplicar el menor entre: dinero disponible o saldo pendiente
          const valorAplicado = Math.min(montoRestante, saldoPendiente)
          
          // Calcular nuevo valor pagado total
          const nuevoValorPagado = (cuota.valor_pagado || 0) + valorAplicado
          
          // Determinar si la cuota queda completa
          const quedaCompleta = nuevoValorPagado >= cuota.valor_cuota

          // Determinar el estado según el valor pagado
          let estado = 'pendiente'
          if (quedaCompleta) {
            estado = 'pagado'
          } else if (nuevoValorPagado > 0) {
            estado = 'abonado'
          }

          // Estado adicional por fecha
          if (cuota.fecha_vencimiento < fechaHoy && estado !== 'pagado') {
            estado = 'vencido'
          }

          actualizaciones.push({
            id: cuota.id,
            valor_pagado: nuevoValorPagado,
            estado: estado,
            fecha_pago: valorAplicado > 0 ? pagoData.fecha_pago : cuota.fecha_pago,
            observaciones_pago: pagoData.observaciones,
            fecha_actualizacion: new Date().toISOString(),
          })

           // Registrar el pago individual para esta cuota
           if (valorAplicado > 0) {
             // Mapear método de pago a tipo_pago permitido
             let tipoPago = 'cuota_normal'
             if (nuevoValorPagado >= cuota.valor_cuota) {
               tipoPago = 'pago_total'
             } else if (nuevoValorPagado > 0) {
               tipoPago = 'abono_parcial'
             }

             pagosRegistrados.push({
               cronograma_pago_id: cuota.id,
               monto_pagado: valorAplicado,
               fecha_pago: pagoData.fecha_pago,
               tipo_pago: tipoPago,
               observaciones: pagoData.observaciones,
               foto_comprobante_url: pagoData.recibo_numero,
               registrado_por: usuarioData.id
             })
           }

          // Reducir el monto restante
          montoRestante -= valorAplicado
        }
      }

      // Actualizar todas las cuotas afectadas
      for (const actualizacion of actualizaciones) {
        const { error: updateError } = await supabase
          .from('cronograma_pagos')
          .update({
            valor_pagado: actualizacion.valor_pagado,
            estado: actualizacion.estado,
            fecha_pago: actualizacion.fecha_pago,
            observaciones_pago: actualizacion.observaciones_pago,
            fecha_actualizacion: actualizacion.fecha_actualizacion,
          })
          .eq('id', actualizacion.id)

        if (updateError) throw updateError
      }

       // Registrar los pagos individuales en la tabla de pagos_recibidos
       if (pagosRegistrados.length > 0) {
         const { error: insertError } = await supabase
           .from('pagos_recibidos')
           .insert(pagosRegistrados)

         if (insertError) throw insertError
       }

      // Recalcular saldos pendientes
      await recalcularSaldosPendientes(pagoData.prestamo_id)

      toast({
        title: '¡Pago registrado!',
        description: `Se ha registrado un pago de ${pagoData.monto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} que se asignó automáticamente a las cuotas más antiguas.`,
      })
      return true
    } catch (error) {
      console.error('Error registrando pago:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago.',
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const recalcularSaldosPendientes = async (prestamoId: string) => {
    try {
      // Obtener todas las cuotas del préstamo ordenadas por número
      const { data: cuotas, error: cuotasError } = await supabase
        .from('cronograma_pagos')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .order('numero_cuota')

      if (cuotasError) throw cuotasError

      // Obtener el monto principal del préstamo
      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .select('monto_principal')
        .eq('id', prestamoId)
        .single()

      if (prestamoError) throw prestamoError

      let saldoPendiente = prestamo.monto_principal

      // Recalcular saldos para cada cuota
      for (const cuota of cuotas) {
        if (cuota.estado === 'pagado') {
          saldoPendiente -= cuota.valor_capital
        } else {
          saldoPendiente -= cuota.valor_capital
        }

        // Actualizar el saldo pendiente de la cuota
        await supabase
          .from('cronograma_pagos')
          .update({ saldo_pendiente: Math.max(0, saldoPendiente) })
          .eq('id', cuota.id)
      }
    } catch (error) {
      console.error('Error recalculando saldos:', error)
    }
  }

  const obtenerPagosPrestamo = async (prestamoId: string): Promise<PagoCompleto[]> => {
    try {
      const { data, error } = await supabase
        .from('pagos_recibidos')
        .select(`
          *,
          cronograma_pagos!inner(prestamo_id)
        `)
        .eq('cronograma_pagos.prestamo_id', prestamoId)
        .order('fecha_pago', { ascending: false })

      if (error) throw error
      return (data || []).map(item => ({
        id: item.id,
        prestamo_id: item.cronograma_pagos.prestamo_id,
        monto: item.monto_pagado,
        fecha_pago: item.fecha_pago,
        metodo_pago: item.tipo_pago,
        observaciones: item.observaciones,
        recibo_numero: item.foto_comprobante_url,
        fecha_creacion: item.fecha_pago,
        creado_por: null
      }))
    } catch (error) {
      console.error('Error obteniendo pagos:', error)
      return []
    }
  }

  const eliminarPago = async (cuotaId: string): Promise<boolean> => {
    try {
      setLoading(true)

      // Obtener el usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener el empresa_id del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, empresa_id')
        .eq('user_id', user.id)
        .single()

      if (usuarioError || !usuarioData) {
        throw new Error('No se pudo obtener la empresa del usuario')
      }

      // Obtener información de la cuota
      const { data: cuota, error: cuotaError } = await supabase
        .from('cronograma_pagos')
        .select('*')
        .eq('id', cuotaId)
        .single()

      if (cuotaError || !cuota) {
        throw new Error('No se pudo obtener la información de la cuota')
      }

      // Eliminar todos los pagos asociados a esta cuota
      const { error: deletePagosError } = await supabase
        .from('pagos_recibidos')
        .delete()
        .eq('cronograma_pago_id', cuotaId)

      if (deletePagosError) throw deletePagosError

      // Resetear la cuota a estado pendiente
      const { error: updateCuotaError } = await supabase
        .from('cronograma_pagos')
        .update({
          valor_pagado: 0,
          estado: 'pendiente',
          fecha_pago: null,
          observaciones_pago: null,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', cuotaId)

      if (updateCuotaError) throw updateCuotaError

      // Recalcular saldos pendientes
      await recalcularSaldosPendientes(cuota.prestamo_id)

      toast({
        title: '¡Pago eliminado!',
        description: 'El pago ha sido eliminado y la cuota ha vuelto a estado pendiente.',
      })
      return true
    } catch (error) {
      console.error('Error eliminando pago:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el pago.',
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    registrarPago,
    obtenerPagosPrestamo,
    recalcularSaldosPendientes,
    eliminarPago
  }
}