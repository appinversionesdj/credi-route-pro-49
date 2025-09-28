import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { 
  NuevoCreditoData, 
  CalculosPrestamo, 
  Ruta, 
  ClienteExistente 
} from '@/types/nuevoCredito'
import { useToast } from '@/hooks/use-toast'

export function useNuevoCredito() {
  const [loading, setLoading] = useState(false)
  const [rutas, setRutas] = useState<Ruta[]>([])
  const { toast } = useToast()

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

  // Calcular valores del préstamo
  const calcularPrestamo = (prestamoData: any): CalculosPrestamo => {
    const montoPrincipal = Number(prestamoData.monto_principal)
    const tasaInteres = Number(prestamoData.tasa_interes) / 100
    const valorSeguro = Number(prestamoData.valor_seguro || 0)
    const numeroCuotas = Number(prestamoData.numero_cuotas)
    
    // Calcular interés total (sobre el monto principal)
    const interesTotal = montoPrincipal * tasaInteres
    
    // Calcular monto total a cobrar (principal + interés, SIN sumar el seguro)
    const montoTotal = montoPrincipal + interesTotal
    
    // Calcular valor de cuota
    const valorCuota = montoTotal / numeroCuotas
    
    // Calcular fecha de primer pago según periodicidad
    const fechaDesembolso = new Date(prestamoData.fecha_desembolso)
    let fechaPrimerPago = new Date(fechaDesembolso)
    
    switch (prestamoData.periodicidad) {
      case 'diario':
        fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 1)
        break
      case 'semanal':
        fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7)
        break
      case 'quincenal':
        fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 15)
        break
      case 'mensual':
        fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1)
        break
    }

    return {
      numero_prestamo: '', // Se generará en la base de datos
      monto_total: montoTotal,
      valor_cuota: valorCuota,
      fecha_primer_pago: fechaPrimerPago.toISOString().split('T')[0],
      interes_total: interesTotal
    }
  }

  // Crear préstamo
  const crearPrestamo = async (prestamoData: any, deudorId: string): Promise<string> => {
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
          ruta_id: prestamoData.ruta_id,
          deudor_id: deudorId,
          numero_prestamo: numeroData, // Usar el número generado
          monto_principal: prestamoData.monto_principal,
          tasa_interes: prestamoData.tasa_interes / 100, // Convertir porcentaje a decimal
          valor_seguro: prestamoData.valor_seguro || 0,
          periodicidad: prestamoData.periodicidad,
          numero_cuotas: prestamoData.numero_cuotas,
          valor_cuota: calculos.valor_cuota,
          monto_total: calculos.monto_total,
          fecha_desembolso: prestamoData.fecha_desembolso,
          fecha_primer_pago: calculos.fecha_primer_pago,
          estado: 'activo',
          observaciones: prestamoData.observaciones,
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

  // Método privado para generar cronograma de pagos
  const generarCronogramaPagos = async (
    prestamo_id: string,
    config: {
      fecha_primer_pago: Date;
      periodicidad: string;
      numero_cuotas: number;
      valor_cuota: number;
      monto_principal: number;
      tasa_interes: number;
    }
  ) => {
    const cronograma = [];
    let fecha_actual = new Date(config.fecha_primer_pago);
    
    // Calcular valores constantes por cuota
    const valor_capital_constante = config.monto_principal / config.numero_cuotas;
    const valor_interes_constante = (config.monto_principal * config.tasa_interes) / config.numero_cuotas;
    let saldo_pendiente = config.monto_principal;

    for (let i = 1; i <= config.numero_cuotas; i++) {
      // Actualizar saldo pendiente
      saldo_pendiente -= valor_capital_constante;

      cronograma.push({
        prestamo_id,
        numero_cuota: i,
        fecha_vencimiento: fecha_actual.toISOString().split('T')[0],
        valor_cuota: config.valor_cuota,
        valor_capital: valor_capital_constante,
        valor_interes: valor_interes_constante,
        saldo_pendiente: Math.max(0, saldo_pendiente),
        estado: 'pendiente',
        valor_pagado: 0,
        fecha_creacion: new Date().toISOString()
      });

      // Incrementar fecha según periodicidad
      switch (config.periodicidad) {
        case 'diario':
          fecha_actual.setDate(fecha_actual.getDate() + 1);
          break;
        case 'semanal':
          fecha_actual.setDate(fecha_actual.getDate() + 7);
          break;
        case 'quincenal':
          fecha_actual.setDate(fecha_actual.getDate() + 15);
          break;
        case 'mensual':
          fecha_actual.setMonth(fecha_actual.getMonth() + 1);
          break;
      }
    }

    // Insertar directamente en la base de datos
    const { error } = await supabase
      .from('cronograma_pagos')
      .insert(cronograma);

    if (error) throw error;
  }

  // Función pública que prepara los datos y llama al método privado
  const generarCronograma = async (prestamoId: string, prestamoData: any) => {
    try {
      const calculos = calcularPrestamo(prestamoData)
      
      await generarCronogramaPagos(prestamoId, {
        fecha_primer_pago: new Date(calculos.fecha_primer_pago),
        periodicidad: prestamoData.periodicidad,
        numero_cuotas: prestamoData.numero_cuotas,
        valor_cuota: calculos.valor_cuota,
        monto_principal: prestamoData.monto_principal,
        tasa_interes: prestamoData.tasa_interes / 100 // Convertir porcentaje a decimal
      })
    } catch (error) {
      console.error('Error generando cronograma:', error)
      throw error
    }
  }

  // Proceso completo de creación de crédito
  const crearCreditoCompleto = async (creditoData: NuevoCreditoData) => {
    try {
      setLoading(true)

      // 1. Crear o actualizar cliente
      const deudorId = await crearOActualizarCliente(creditoData.cliente)

      // 2. Crear préstamo
      const prestamoId = await crearPrestamo(creditoData.prestamo, deudorId)

      // 3. Generar cronograma
      await generarCronograma(prestamoId, creditoData.prestamo)

      toast({
        title: "¡Éxito!",
        description: "El crédito se ha creado correctamente",
      })

      return { success: true, prestamoId }
    } catch (error) {
      console.error('Error creando crédito completo:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el crédito. Inténtalo de nuevo.",
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
    cargarRutas,
    buscarCliente,
    calcularPrestamo,
    crearCreditoCompleto
  }
}
