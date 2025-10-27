// ============================================================================
// UTILIDADES PARA CREACIÓN DE PRÉSTAMOS
// ============================================================================

export const PERIODICIDADES = {
  diario: { dias: 1, label: 'Diario' },
  semanal: { dias: 7, label: 'Semanal' },
  quincenal: { dias: 15, label: 'Quincenal' },
  mensual: { dias: 30, label: 'Mensual' },
}

export const DIAS_SEMANA = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6
}

export type DiaSemana = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado'
export type Periodicidad = 'diario' | 'semanal' | 'quincenal' | 'mensual'

export interface CalculosPrestamo {
  valorCuota: number
  montoTotal: number
  montoEntregado: number
  valorInteres: number
}

// ============================================================================
// UTILIDADES DE FECHAS (ZONA HORARIA COLOMBIA UTC-5)
// ============================================================================

export class FechaUtils {
  /**
   * Obtiene fecha actual en Colombia (UTC-5)
   */
  static obtenerFechaHoyColombia(): string {
    const opciones: Intl.DateTimeFormatOptions = { timeZone: 'America/Bogota' }
    const fecha = new Date().toLocaleString('en-US', opciones)
    const fechaObj = new Date(fecha)
    
    const año = fechaObj.getFullYear()
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0')
    const dia = String(fechaObj.getDate()).padStart(2, '0')
    
    return `${año}-${mes}-${dia}`
  }

  /**
   * Convierte string YYYY-MM-DD a Date
   */
  static stringAFecha(fechaString: string): Date {
    const [year, month, day] = fechaString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  /**
   * Convierte Date a string YYYY-MM-DD
   */
  static fechaAString(fecha: Date): string {
    const año = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${año}-${mes}-${dia}`
  }

  /**
   * Agrega días a una fecha
   */
  static agregarDias(fechaString: string, dias: number): string {
    const fecha = this.stringAFecha(fechaString)
    fecha.setDate(fecha.getDate() + dias)
    return this.fechaAString(fecha)
  }

  /**
   * Calcula el próximo día de la semana especificado desde la PRÓXIMA SEMANA
   * Importante: Siempre retorna el día de la próxima semana, NO de la actual
   */
  static obtenerProximoDiaSemanaDesdeProximaSemana(
    fechaBase: string,
    diaNombre: DiaSemana
  ): string {
    const fecha = this.stringAFecha(fechaBase)
    const diaActual = fecha.getDay() // 0=domingo, 1=lunes, ..., 6=sábado
    const diaObjetivo = DIAS_SEMANA[diaNombre]

    // Calcular días hasta ese día en la semana actual
    let diasEnEstaSemana = (diaObjetivo - diaActual + 7) % 7
    
    let diasASumar: number
    
    if (diasEnEstaSemana === 0) {
      // Es el mismo día (hoy), ir al próximo (7 días)
      diasASumar = 7
    } else if (diaObjetivo > diaActual) {
      // El día NO ha pasado esta semana, ir a ese día de la PRÓXIMA semana
      diasASumar = diasEnEstaSemana + 7
    } else {
      // El día YA pasó esta semana, ir a ese día de la PRÓXIMA semana
      diasASumar = diasEnEstaSemana
    }

    fecha.setDate(fecha.getDate() + diasASumar)
    return this.fechaAString(fecha)
  }

  /**
   * Verifica si una fecha es anterior a hoy
   */
  static esAnteriorAHoy(fechaString: string): boolean {
    const fecha = this.stringAFecha(fechaString)
    const hoy = this.stringAFecha(this.obtenerFechaHoyColombia())
    return fecha.getTime() < hoy.getTime()
  }
}

// ============================================================================
// CALCULADORA DE PRÉSTAMOS
// ============================================================================

export class PrestamoCalculadora {
  /**
   * Calcula todos los valores del préstamo
   * 
   * Fórmula:
   * - Interés = Monto Principal × (Tasa / 100)
   * - Monto Total = Monto Principal + Interés
   * - Valor Cuota = Monto Total / Número de Cuotas
   * - Monto Entregado = Monto Principal - Valor Seguro
   */
  static calcular(
    montoPrincipal: number,
    tasaInteres: number,
    numeroCuotas: number,
    valorSeguro: number = 0
  ): CalculosPrestamo {
    if (montoPrincipal <= 0 || numeroCuotas <= 0 || tasaInteres < 0) {
      return {
        valorCuota: 0,
        montoTotal: 0,
        montoEntregado: 0,
        valorInteres: 0,
      }
    }

    // El interés se calcula SOLO sobre el monto principal
    const valorInteres = montoPrincipal * (tasaInteres / 100)
    const montoTotal = montoPrincipal + valorInteres
    const valorCuota = montoTotal / numeroCuotas
    
    // Monto entregado al cliente (descontando seguro)
    const montoEntregado = montoPrincipal - valorSeguro

    return {
      valorCuota: Math.round(valorCuota),
      montoTotal: Math.round(montoTotal),
      montoEntregado: Math.round(montoEntregado),
      valorInteres: Math.round(valorInteres),
    }
  }

  /**
   * Calcula la fecha del primer pago
   * 
   * Lógica:
   * - Diario: Mañana (fecha_desembolso + 1 día)
   * - Semanal: Día seleccionado de la PRÓXIMA semana
   * - Quincenal: Día seleccionado de la PRÓXIMA semana
   * - Mensual: Dentro de 30 días
   */
  static calcularFechaPrimerPago(
    fechaDesembolso: string,
    periodicidad: Periodicidad,
    diaPagoSemanal?: DiaSemana
  ): string {
    // Si es semanal o quincenal y tiene día de pago especificado
    if ((periodicidad === 'semanal' || periodicidad === 'quincenal') && diaPagoSemanal) {
      return FechaUtils.obtenerProximoDiaSemanaDesdeProximaSemana(fechaDesembolso, diaPagoSemanal)
    }
    
    // Para diario y mensual, sumar días según periodicidad
    const diasSumar = PERIODICIDADES[periodicidad].dias
    return FechaUtils.agregarDias(fechaDesembolso, diasSumar)
  }
}

// ============================================================================
// VALIDACIONES
// ============================================================================

export class PrestamoValidador {
  /**
   * Valida datos del préstamo
   */
  static validarPrestamo(
    montoPrincipal: number,
    tasaInteres: number,
    numeroCuotas: number,
    periodicidad: Periodicidad,
    fechaDesembolso: string,
    valorSeguro: number = 0,
    diaPagoSemanal?: DiaSemana
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar monto principal
    if (!montoPrincipal || montoPrincipal <= 0) {
      errors.push('El monto principal debe ser mayor a 0')
    } else if (montoPrincipal > 100000000) {
      errors.push('El monto principal es demasiado alto (máx 100 millones)')
    }

    // Validar tasa de interés
    if (tasaInteres < 0) {
      errors.push('La tasa de interés no puede ser negativa')
    } else if (tasaInteres > 100) {
      errors.push('La tasa de interés no puede ser mayor al 100%')
    }

    // Validar número de cuotas
    if (!numeroCuotas || numeroCuotas < 1 || numeroCuotas > 100) {
      errors.push('El número de cuotas debe estar entre 1 y 100')
    } else if (!Number.isInteger(numeroCuotas)) {
      errors.push('El número de cuotas debe ser un número entero')
    }

    // Validar fecha de desembolso
    if (!fechaDesembolso?.trim()) {
      errors.push('La fecha de desembolso es requerida')
    } else if (FechaUtils.esAnteriorAHoy(fechaDesembolso)) {
      errors.push('La fecha de desembolso no puede ser anterior a hoy')
    }

    // Validar valor del seguro
    if (valorSeguro && valorSeguro < 0) {
      errors.push('El valor del seguro no puede ser negativo')
    } else if (valorSeguro && valorSeguro >= montoPrincipal) {
      errors.push('El valor del seguro no puede ser mayor o igual al monto principal')
    }

    // Validar día de pago (obligatorio si es semanal o quincenal)
    if ((periodicidad === 'semanal' || periodicidad === 'quincenal') && !diaPagoSemanal) {
      errors.push('Debe seleccionar un día de la semana para el pago')
    }

    return { isValid: errors.length === 0, errors }
  }
}



