import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { 
  NuevoCreditoData, 
  CalculosPrestamo, 
  Ruta, 
  ClienteExistente 
} from '@/types/nuevoCredito'
import { useToast } from '@/hooks/use-toast'
import { 
  FechaUtils, 
  PrestamoCalculadora, 
  PrestamoValidador,
  type Periodicidad,
  type DiaSemana
} from '@/lib/prestamo-utils'

export function useNuevoCredito() {
  const [loading, setLoading] = useState(false)
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [clientes, setClientes] = useState<ClienteExistente[]>([])
  const { toast } = useToast()

  // Cargar todos los clientes disponibles
  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('deudores')
        .select('id, nombre, apellido, cedula, telefono, direccion, ocupacion, referencias')
        .eq('estado', 'activo')
        .order('nombre')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      })
    }
  }

  // Buscar cliente por cédula
  const buscarCliente = async (cedula: string): Promise<ClienteExistente | null> => {
    try {
      const { data, error } = await supabase
        .from('deudores')
        .select('*')
        .eq('cedula', Number(cedula))
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as ClienteExistente
    } catch (error) {
      console.error('Error buscando cliente:', error)
      return null
    }
  }

  // Obtener cliente por ID
  const obtenerClientePorId = async (id: string): Promise<ClienteExistente | null> => {
    try {
      const { data, error } = await supabase
        .from('deudores')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ClienteExistente
    } catch (error) {
      console.error('Error obteniendo cliente:', error)
      return null
    }
  }

  // Cargar rutas disponibles
  const cargarRutas = async () => {
    try {
      const { data, error } = await supabase
        .from('rutas')
        .select('id, nombre_ruta, descripcion, zona_geografica')
        .eq('estado', 'activa')
        .order('nombre_ruta')

      if (error) throw error
      setRutas(data || [])
    } catch (error) {
      console.error('Error cargando rutas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutas",
        variant: "destructive"
      })
    }
  }

  // Crear o actualizar cliente
  const crearOActualizarCliente = async (clienteData: any): Promise<string> => {
    try {
      // Obtener el usuario autenticado y su empresa_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener el empresa_id del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (usuarioError || !usuarioData) {
        throw new Error('No se pudo obtener la empresa del usuario')
      }

      // Buscar si el cliente ya existe
      const clienteExistente = await buscarCliente(clienteData.cedula)
      
      if (clienteExistente) {
        // Actualizar cliente existente
        const { data, error } = await supabase
          .from('deudores')
          .update({
            nombre: clienteData.nombre,
            apellido: clienteData.apellido,
            telefono: clienteData.telefono,
            direccion: clienteData.direccion,
            fecha_nacimiento: clienteData.fecha_nacimiento,
            ocupacion: clienteData.ocupacion,
            referencias: clienteData.referencias,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', clienteExistente.id)
          .select('id')
          .single()

        if (error) throw error
        return data.id
      } else {
        // Crear nuevo cliente
        const { data, error } = await supabase
          .from('deudores')
          .insert({
            ...clienteData,
            estado: 'activo',
            fecha_creacion: new Date().toISOString(),
            empresa_id: usuarioData.empresa_id
          })
          .select('id')
          .single()

        if (error) throw error
        return data.id
      }
    } catch (error) {
      console.error('Error creando/actualizando cliente:', error)
      throw error
    }
  }

  // Calcular valores del préstamo usando la nueva lógica
  const calcularPrestamo = (prestamoData: any): CalculosPrestamo => {
    const montoPrincipal = Number(prestamoData.monto_principal)
    const tasaInteres = Number(prestamoData.tasa_interes)
    const valorSeguro = Number(prestamoData.valor_seguro || 0)
    const numeroCuotas = Number(prestamoData.numero_cuotas)
    const periodicidad = prestamoData.periodicidad as Periodicidad
    const fechaDesembolso = prestamoData.fecha_desembolso
    const diaPagoSemanal = prestamoData.dia_pago_semanal as DiaSemana | undefined
    
    // Usar PrestamoCalculadora para calcular valores financieros
    const calculos = PrestamoCalculadora.calcular(
      montoPrincipal,
      tasaInteres,
      numeroCuotas,
      valorSeguro
    )
    
    // Calcular fecha del primer pago
    const fechaPrimerPago = PrestamoCalculadora.calcularFechaPrimerPago(
      fechaDesembolso,
      periodicidad,
      diaPagoSemanal
    )

    return {
      numero_prestamo: '', // Se generará en la base de datos
      monto_total: calculos.montoTotal,
      valor_cuota: calculos.valorCuota,
      fecha_primer_pago: fechaPrimerPago,
      interes_total: calculos.valorInteres
    }
  }

  // Crear préstamo con la nueva lógica (SIN cronograma_pagos)
  const crearPrestamo = async (prestamoData: any, deudorId: string): Promise<string> => {
    try {
      // Validar datos del préstamo
      const validacion = PrestamoValidador.validarPrestamo(
        prestamoData.monto_principal,
        prestamoData.tasa_interes,
        prestamoData.numero_cuotas,
        prestamoData.periodicidad,
        prestamoData.fecha_desembolso,
        prestamoData.valor_seguro || 0,
        prestamoData.dia_pago_semanal
      )

      if (!validacion.isValid) {
        throw new Error(validacion.errors.join(', '))
      }

      // Obtener el usuario autenticado y su empresa_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener el empresa_id del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (usuarioError || !usuarioData) {
        throw new Error('No se pudo obtener la empresa del usuario')
      }

      // Generar número de préstamo usando la función de la base de datos
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_loan_number', {
          empresa_id_param: usuarioData.empresa_id
        })

      if (numeroError) {
        console.error('Error generando número de préstamo:', numeroError)
        throw new Error('No se pudo generar el número de préstamo')
      }

      const calculos = calcularPrestamo(prestamoData)
      
      const { data, error } = await supabase
        .from('prestamos')
        .insert({
          // IDs y relaciones
          ruta_id: prestamoData.ruta_id,
          deudor_id: deudorId,
          creado_por: user.id,
          
          // Información del préstamo
          numero_prestamo: numeroData,
          monto_principal: prestamoData.monto_principal,
          tasa_interes: prestamoData.tasa_interes / 100, // Convertir a decimal (20% → 0.20)
          periodicidad: prestamoData.periodicidad,
          numero_cuotas: prestamoData.numero_cuotas,
          
          // Valores calculados
          valor_cuota: calculos.valor_cuota,
          monto_total: calculos.monto_total,
          saldo_pendiente: calculos.monto_total, // Iniciar con el monto total
          
          // Fechas
          fecha_desembolso: prestamoData.fecha_desembolso,
          fecha_primer_pago: calculos.fecha_primer_pago,
          
          // Opcionales
          valor_seguro: prestamoData.valor_seguro || 0,
          observaciones: prestamoData.observaciones || null,
          dia_pago_semanal: prestamoData.dia_pago_semanal || null,
          
          // Estado inicial
          estado: 'activo',
          cuotas_pagadas: 0,
          fecha_ultimo_pago: null,
          fecha_creacion: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error creando préstamo:', error)
      throw error
    }
  }

  // Proceso completo de creación de crédito (SIN cronograma_pagos)
  const crearCreditoCompleto = async (creditoData: NuevoCreditoData) => {
    try {
      setLoading(true)

      // 1. Crear o actualizar cliente
      const deudorId = await crearOActualizarCliente(creditoData.cliente)

      // 2. Crear préstamo (ya no genera cronograma)
      const prestamoId = await crearPrestamo(creditoData.prestamo, deudorId)

      toast({
        title: "¡Éxito!",
        description: "El crédito se ha creado correctamente",
      })

      return { success: true, prestamoId }
    } catch (error: any) {
      console.error('Error creando crédito completo:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el crédito. Inténtalo de nuevo.",
        variant: "destructive"
      })
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    rutas,
    clientes,
    cargarRutas,
    cargarClientes,
    buscarCliente,
    obtenerClientePorId,
    calcularPrestamo,
    crearCreditoCompleto
  }
}
