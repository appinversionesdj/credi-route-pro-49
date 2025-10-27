import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useRutas } from '@/hooks/useRutas'
import { 
  Calendar,
  Search,
  Filter,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Info,
  User
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MovimientoDiario {
  fecha: string
  cobrador_id: string
  cobrador_nombre: string
  ruta_id: string
  ruta_nombre: string
  base_entregada: number
  total_prestado: number
  total_cobrado: number
  total_seguros: number
  total_gastos: number
  dinero_teorico: number
  diferencia: number
  estado: 'pendiente' | 'conciliado'
  conciliacion_id?: string
}

export default function BaseDiaria() {
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cobradorFiltro, setCobradorFiltro] = useState('')
  const [rutaFiltro, setRutaFiltro] = useState('')
  const [cobradores, setCobradores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([])
  const [dialogConciliar, setDialogConciliar] = useState(false)
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoDiario | null>(null)
  const [dineroDevuelto, setDineroDevuelto] = useState('')
  const [personaEntrega, setPersonaEntrega] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nombre: string; apellido: string }>>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 3
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [prestamosDetalle, setPrestamosDetalle] = useState<any[]>([])
  const [cobrosDetalle, setCobrosDetalle] = useState<any[]>([])
  const [gastosDetalle, setGastosDetalle] = useState<any[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [paginaPrestamos, setPaginaPrestamos] = useState(1)
  const [paginaCobros, setPaginaCobros] = useState(1)
  const [paginaGastos, setPaginaGastos] = useState(1)
  const itemsPorPaginaDetalle = 5

  const { rutas } = useRutas()

  // Establecer últimos 30 días por defecto
  useEffect(() => {
    const hoy = new Date()
    const hace30dias = new Date()
    hace30dias.setDate(hoy.getDate() - 30)
    
    setFechaDesde(hace30dias.toISOString().split('T')[0])
    setFechaHasta(hoy.toISOString().split('T')[0])
  }, [])

  // Cargar cobradores
  useEffect(() => {
    async function cargarCobradores() {
      const { data } = await supabase
        .from('usuarios')
        .select('user_id, nombre, apellido')
        .eq('rol', 'cobrador')
        .eq('estado', 'activo')
        .order('nombre')

      if (data) {
        setCobradores(data.map(c => ({ id: c.user_id, nombre: c.nombre, apellido: c.apellido })))
      }
    }
    cargarCobradores()
  }, [])

  // Cargar usuarios para selector de persona que entrega
  useEffect(() => {
    async function cargarUsuarios() {
      const { data } = await supabase
        .from('usuarios')
        .select('user_id, nombre, apellido')
        .eq('estado', 'activo')
        .order('nombre')

      if (data) {
        setUsuarios(data.map(u => ({ id: u.user_id, nombre: u.nombre, apellido: u.apellido })))
      }
    }
    cargarUsuarios()
  }, [])

  // Cargar movimientos diarios
  const cargarMovimientos = async () => {
    if (!fechaDesde || !fechaHasta) return

    setLoading(true)
    try {
      // 1. Obtener todos los préstamos del rango - Solo fecha, monto y seguro
      const { data: prestamos } = await supabase
        .from('prestamos')
        .select('fecha_desembolso, monto_principal, valor_seguro')
        .gte('fecha_desembolso', fechaDesde)
        .lte('fecha_desembolso', fechaHasta)

      // 2. Obtener todos los cobros del rango - Solo fecha y monto
      const { data: cobros } = await supabase
        .from('pagos_recibidos')
        .select('fecha_pago, monto_pagado')
        .gte('fecha_pago', fechaDesde)
        .lte('fecha_pago', fechaHasta)
        .eq('estado', 'activo')

      // 3. Obtener todos los gastos del rango - Solo fecha y monto
      const { data: gastos } = await supabase
        .from('gastos_diarios')
        .select('fecha_gasto, monto')
        .gte('fecha_gasto', fechaDesde)
        .lte('fecha_gasto', fechaHasta)

      // 4. Agrupar por fecha únicamente
      const movimientosPorFecha = new Map<string, any>()

      // Procesar préstamos
      prestamos?.forEach((prestamo) => {
        const fecha = prestamo.fecha_desembolso
        
        if (!movimientosPorFecha.has(fecha)) {
          movimientosPorFecha.set(fecha, {
            fecha: fecha,
            total_prestado: 0,
            total_cobrado: 0,
            total_gastos: 0,
            total_seguros: 0
          })
        }

        const mov = movimientosPorFecha.get(fecha)
        mov.total_prestado += Number(prestamo.monto_principal)
        mov.total_seguros += Number(prestamo.valor_seguro || 0)
      })

      // Procesar cobros
      cobros?.forEach((cobro) => {
        const fecha = cobro.fecha_pago
        
        if (!movimientosPorFecha.has(fecha)) {
          movimientosPorFecha.set(fecha, {
            fecha: fecha,
            total_prestado: 0,
            total_cobrado: 0,
            total_gastos: 0,
            total_seguros: 0
          })
        }

        const mov = movimientosPorFecha.get(fecha)
        mov.total_cobrado += Number(cobro.monto_pagado)
      })

      // Procesar gastos
      gastos?.forEach((gasto) => {
        const fecha = gasto.fecha_gasto
        
        if (!movimientosPorFecha.has(fecha)) {
          movimientosPorFecha.set(fecha, {
            fecha: fecha,
            total_prestado: 0,
            total_cobrado: 0,
            total_gastos: 0,
            total_seguros: 0
          })
        }

        const mov = movimientosPorFecha.get(fecha)
        mov.total_gastos += Number(gasto.monto)
      })

      // 5. Convertir a array y agregar datos de conciliación
      const movimientosArray = Array.from(movimientosPorFecha.values())
      
      const movimientosConConciliacion = await Promise.all(
        movimientosArray.map(async (mov) => {
          // Buscar si existe conciliación para esta fecha
          const { data: conciliaciones } = await supabase
            .from('conciliacion_diaria')
            .select(`
              id,
              dinero_efectivamente_devuelto,
              diferencia,
              monto_base_entregado,
              base_diaria:base_diaria_cobradores!inner(fecha)
            `)
            .eq('base_diaria.fecha', mov.fecha)

          // Si hay conciliaciones, obtener base y dinero devuelto
          const baseEntregada = conciliaciones?.reduce((sum, c) => sum + Number(c.monto_base_entregado || 0), 0) || 0
          const dineroDevuelto = conciliaciones?.reduce((sum, c) => sum + Number(c.dinero_efectivamente_devuelto || 0), 0) || 0
          const totalDiferencia = conciliaciones?.reduce((sum, c) => sum + Number(c.diferencia || 0), 0) || 0

          const dineroTeorico = baseEntregada + mov.total_cobrado + mov.total_seguros - mov.total_prestado - mov.total_gastos
          const hayConciliacion = conciliaciones && conciliaciones.length > 0

          return {
            fecha: mov.fecha,
            cobrador_id: '',
            cobrador_nombre: 'Todos',
            ruta_id: '',
            ruta_nombre: 'Todas',
            base_entregada: baseEntregada,
            total_prestado: mov.total_prestado,
            total_cobrado: mov.total_cobrado,
            total_seguros: mov.total_seguros,
            total_gastos: mov.total_gastos,
            dinero_teorico: dineroTeorico,
            diferencia: totalDiferencia,
            estado: (hayConciliacion ? 'conciliado' : 'pendiente') as 'conciliado' | 'pendiente',
            conciliacion_id: conciliaciones?.[0]?.id
          }
        })
      )

      // Ordenar por fecha descendente
      movimientosConConciliacion.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      setMovimientos(movimientosConConciliacion)
      
      // Cargar detalle del primer día automáticamente
      if (movimientosConConciliacion.length > 0 && !fechaSeleccionada) {
        cargarDetalleMovimientos(movimientosConConciliacion[0].fecha)
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarMovimientos()
    }
  }, [fechaDesde, fechaHasta, cobradorFiltro, rutaFiltro])

  const handleConciliar = (movimiento: MovimientoDiario) => {
    setMovimientoSeleccionado(movimiento)
    setDineroDevuelto('')
    setPersonaEntrega('')
    setObservaciones('')
    setDialogConciliar(true)
  }

  const guardarConciliacion = async () => {
    if (!movimientoSeleccionado || !dineroDevuelto) {
      toast({
        title: 'Error',
        description: 'Debe ingresar el dinero devuelto',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const montoDevuelto = parseFloat(dineroDevuelto)
      
      // Recalcular dinero teórico considerando la base ingresada
      const baseEntregada = movimientoSeleccionado.base_entregada > 0 
        ? movimientoSeleccionado.base_entregada 
        : montoDevuelto - movimientoSeleccionado.total_cobrado - movimientoSeleccionado.total_seguros + movimientoSeleccionado.total_prestado + movimientoSeleccionado.total_gastos
      
      const dineroTeorico = baseEntregada + movimientoSeleccionado.total_cobrado + movimientoSeleccionado.total_seguros - movimientoSeleccionado.total_prestado - movimientoSeleccionado.total_gastos
      const diferencia = montoDevuelto - dineroTeorico

      let estadoConciliacion: 'cuadrado' | 'sobrante' | 'faltante' | 'auditoria' = 'cuadrado'
      if (diferencia > 0) {
        estadoConciliacion = 'sobrante'
      } else if (diferencia < 0) {
        estadoConciliacion = 'faltante'
      }

      if (Math.abs(diferencia) > 50000) {
        estadoConciliacion = 'auditoria'
      }

      const personaEntregaData = usuarios.find(u => u.id === personaEntrega)

      // Buscar o crear base_diaria_cobradores
      let { data: baseDiaria } = await supabase
        .from('base_diaria_cobradores')
        .select('id')
        .eq('fecha', movimientoSeleccionado.fecha)
        .eq('cobrador_id', movimientoSeleccionado.cobrador_id)
        .eq('ruta_id', movimientoSeleccionado.ruta_id)
        .maybeSingle()

      let baseDiariaId: string

      if (!baseDiaria) {
        // Crear base diaria si no existe
        const { data: nuevaBase, error: errorBase } = await supabase
          .from('base_diaria_cobradores')
          .insert({
            fecha: movimientoSeleccionado.fecha,
            cobrador_id: movimientoSeleccionado.cobrador_id,
            ruta_id: movimientoSeleccionado.ruta_id,
            monto_base_entregado: baseEntregada,
            monto_devuelto: montoDevuelto,
            estado: 'conciliado'
          })
          .select('id')
          .single()

        if (errorBase) throw errorBase
        baseDiariaId = nuevaBase.id
      } else {
        // Actualizar base diaria existente
        await supabase
          .from('base_diaria_cobradores')
          .update({ 
            monto_base_entregado: baseEntregada,
            monto_devuelto: montoDevuelto,
            estado: 'conciliado'
          })
          .eq('id', baseDiaria.id)
        
        baseDiariaId = baseDiaria.id
      }

      // Guardar conciliación
      const { error } = await supabase
        .from('conciliacion_diaria')
        .insert({
          base_diaria_id: baseDiariaId,
          monto_base_entregado: baseEntregada,
          total_cobros_realizados: movimientoSeleccionado.total_cobrado,
          total_prestamos_nuevos: movimientoSeleccionado.total_prestado,
          total_gastos_aprobados: movimientoSeleccionado.total_gastos,
          total_seguros: movimientoSeleccionado.total_seguros,
          dinero_efectivamente_devuelto: montoDevuelto,
          dinero_teorico_devolver: dineroTeorico,
          diferencia: diferencia,
          estado_conciliacion: estadoConciliacion,
          observaciones_cierre: observaciones,
          persona_entrega_base: personaEntrega || null,
          nombre_persona_entrega: personaEntregaData ? `${personaEntregaData.nombre} ${personaEntregaData.apellido}` : null,
          conciliado_por: user.id
        })

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'Conciliación guardada correctamente'
      })

      setDialogConciliar(false)
      cargarMovimientos()
    } catch (error) {
      console.error('Error al guardar conciliación:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la conciliación',
        variant: 'destructive'
      })
    }
  }

  // Cargar detalle de movimientos por fecha
  const cargarDetalleMovimientos = async (fecha: string) => {
    setLoadingDetalle(true)
    setFechaSeleccionada(fecha)
    
    try {
      // Cargar préstamos del día
      const { data: prestamos } = await supabase
        .from('prestamos')
        .select(`
          *,
          deudores!prestamos_deudor_id_fkey(
            id,
            nombre,
            apellido,
            cedula,
            telefono
          ),
          cobrador:usuarios!prestamos_creado_por_fkey1(nombre, apellido),
          ruta:rutas(nombre_ruta)
        `)
        .eq('fecha_desembolso', fecha)
        .order('fecha_desembolso', { ascending: false })

      setPrestamosDetalle(prestamos || [])

      // Cargar cobros del día con todos los joins en una sola consulta
      const { data: cobros, error: cobrosError } = await supabase
        .from('pagos_recibidos')
        .select(`
          *,
          prestamo:prestamos!pagos_recibidos_prestamo_id_fkey(
            numero_prestamo,
            deudores!prestamos_deudor_id_fkey(
              nombre,
              apellido
            ),
            ruta:rutas(nombre_ruta)
          ),
          cobrador:usuarios!pagos_recibidos_registrado_por_fkey(
            nombre,
            apellido
          )
        `)
        .eq('fecha_pago', fecha)
        .eq('estado', 'activo')
        .order('fecha_pago', { ascending: false })

      if (cobrosError) {
        console.error('Error al cargar cobros:', cobrosError)
      }

      setCobrosDetalle(cobros || [])

      // Cargar gastos del día
      const { data: gastos } = await supabase
        .from('gastos_diarios')
        .select(`
          *,
          cobrador:usuarios!gastos_diarios_user_id_fkey(nombre, apellido),
          ruta:rutas(nombre_ruta),
          tipo_gasto:tipos_gastos!gastos_diarios_tipo_gasto_id_fkey(nombre)
        `)
        .eq('fecha_gasto', fecha)
        .order('fecha_gasto', { ascending: false })

      setGastosDetalle(gastos || [])
    } catch (error) {
      console.error('Error al cargar detalle:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle de movimientos',
        variant: 'destructive'
      })
    } finally {
      setLoadingDetalle(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    // Asegurarse de que la fecha se interprete como fecha local, no UTC
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoBadge = (estado: string, diferencia: number) => {
    if (estado === 'pendiente') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendiente</Badge>
    }

    if (diferencia === 0) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Cuadrado</Badge>
    } else if (diferencia > 0) {
      return <Badge className="bg-blue-100 text-blue-800"><TrendingUp className="w-3 h-3 mr-1" />Sobrante</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800"><TrendingDown className="w-3 h-3 mr-1" />Faltante</Badge>
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(movimientos.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const movimientosPaginados = movimientos.slice(indexInicio, indexFin)

  const totales = movimientos.reduce((acc, mov) => ({
    base: acc.base + mov.base_entregada,
    prestado: acc.prestado + mov.total_prestado,
    cobrado: acc.cobrado + mov.total_cobrado,
    seguros: acc.seguros + mov.total_seguros,
    gastos: acc.gastos + mov.total_gastos,
    teorico: acc.teorico + mov.dinero_teorico,
    diferencia: acc.diferencia + mov.diferencia
  }), { base: 0, prestado: 0, cobrado: 0, seguros: 0, gastos: 0, teorico: 0, diferencia: 0 })

  // Resetear a página 1 cuando cambian los datos
  useEffect(() => {
    setPaginaActual(1)
  }, [movimientos.length])

  // Paginación de préstamos
  const totalPaginasPrestamos = Math.ceil(prestamosDetalle.length / itemsPorPaginaDetalle)
  const indexInicioPrestamos = (paginaPrestamos - 1) * itemsPorPaginaDetalle
  const indexFinPrestamos = indexInicioPrestamos + itemsPorPaginaDetalle
  const prestamosPaginados = prestamosDetalle.slice(indexInicioPrestamos, indexFinPrestamos)

  // Paginación de cobros
  const totalPaginasCobros = Math.ceil(cobrosDetalle.length / itemsPorPaginaDetalle)
  const indexInicioCobros = (paginaCobros - 1) * itemsPorPaginaDetalle
  const indexFinCobros = indexInicioCobros + itemsPorPaginaDetalle
  const cobrosPaginados = cobrosDetalle.slice(indexInicioCobros, indexFinCobros)

  // Paginación de gastos
  const totalPaginasGastos = Math.ceil(gastosDetalle.length / itemsPorPaginaDetalle)
  const indexInicioGastos = (paginaGastos - 1) * itemsPorPaginaDetalle
  const indexFinGastos = indexInicioGastos + itemsPorPaginaDetalle
  const gastosPaginados = gastosDetalle.slice(indexInicioGastos, indexFinGastos)

  // Totales de préstamos
  const totalesPrestamos = prestamosDetalle.reduce((acc, prestamo) => ({
    totalPrestado: acc.totalPrestado + Number(prestamo.monto_principal || 0),
    totalSeguros: acc.totalSeguros + Number(prestamo.valor_seguro || 0)
  }), { totalPrestado: 0, totalSeguros: 0 })

  // Resetear páginas cuando se carga nuevo detalle
  useEffect(() => {
    setPaginaPrestamos(1)
    setPaginaCobros(1)
    setPaginaGastos(1)
  }, [fechaSeleccionada])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Base Diaria y Conciliación</h2>
        <p className="text-muted-foreground">
          Gestiona los movimientos diarios por cobrador: préstamos, cobros, seguros y gastos
        </p>
      </div>

      {/* Tabla de movimientos */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
              <p className="text-muted-foreground">
                No se encontraron movimientos para el rango de fechas seleccionado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Fecha</TableHead>
                     <TableHead className="text-right">Prestado</TableHead>
                     <TableHead className="text-right">Cobrado</TableHead>
                     <TableHead className="text-right">Seguros</TableHead>
                     <TableHead className="text-right">Gastos</TableHead>
                     <TableHead className="text-right">Base</TableHead>
                     <TableHead className="text-right">Teórico</TableHead>
                     <TableHead className="text-center">Estado</TableHead>
                     <TableHead className="text-right">Diferencia</TableHead>
                     <TableHead className="text-center">Acción</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {movimientosPaginados.map((mov, index) => (
                     <TableRow 
                       key={index}
                       className={`cursor-pointer hover:bg-muted/50 ${fechaSeleccionada === mov.fecha ? 'bg-blue-50' : ''}`}
                       onClick={() => cargarDetalleMovimientos(mov.fecha)}
                     >
                       <TableCell className="font-medium">{formatDate(mov.fecha)}</TableCell>
                       <TableCell className="text-right text-red-600">-{formatCurrency(mov.total_prestado)}</TableCell>
                       <TableCell className="text-right text-green-600">+{formatCurrency(mov.total_cobrado)}</TableCell>
                       <TableCell className="text-right text-green-600">+{formatCurrency(mov.total_seguros)}</TableCell>
                       <TableCell className="text-right text-red-600">-{formatCurrency(mov.total_gastos)}</TableCell>
                       <TableCell className="text-right">{formatCurrency(mov.base_entregada)}</TableCell>
                       <TableCell className="text-right font-semibold">{formatCurrency(mov.dinero_teorico)}</TableCell>
                       <TableCell className="text-center">{getEstadoBadge(mov.estado, mov.diferencia)}</TableCell>
                       <TableCell className={`text-right font-bold ${
                         mov.diferencia === 0 ? 'text-green-600' :
                         mov.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                       }`}>
                         {mov.estado === 'conciliado' ? (
                           <>
                             {mov.diferencia > 0 && '+'}
                             {formatCurrency(mov.diferencia)}
                           </>
                         ) : '-'}
                       </TableCell>
                       <TableCell className="text-center">
                         {mov.estado === 'pendiente' ? (
                           <Button
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation()
                               handleConciliar(mov)
                             }}
                           >
                             Conciliar
                           </Button>
                         ) : (
                           <Badge variant="outline" className="bg-green-50">
                             <CheckCircle2 className="w-3 h-3 mr-1" />
                             Conciliado
                           </Badge>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>

              {/* Controles de paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {indexInicio + 1} a {Math.min(indexFin, movimientos.length)} de {movimientos.length} días
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const maxPaginasVisibles = 3
                        let inicio = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2))
                        let fin = Math.min(totalPaginas, inicio + maxPaginasVisibles - 1)
                        
                        // Ajustar inicio si estamos cerca del final
                        if (fin - inicio + 1 < maxPaginasVisibles) {
                          inicio = Math.max(1, fin - maxPaginasVisibles + 1)
                        }
                        
                        return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i).map((pagina) => (
                          <Button
                            key={pagina}
                            variant={pagina === paginaActual ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPaginaActual(pagina)}
                            className="w-8 h-8 p-0"
                          >
                            {pagina}
                          </Button>
                        ))
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle de movimientos por tabs */}
      {fechaSeleccionada && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="prestamos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prestamos">
                  Préstamos & Seguros ({prestamosDetalle.length})
                </TabsTrigger>
                <TabsTrigger value="cobros">
                  Cobros ({cobrosDetalle.length})
                </TabsTrigger>
                <TabsTrigger value="gastos">
                  Gastos ({gastosDetalle.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab de Préstamos y Seguros */}
              <TabsContent value="prestamos">
                {loadingDetalle ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : prestamosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay préstamos registrados para esta fecha
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Encabezados de la tabla */}
                    <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-muted-foreground bg-gray-50 px-6 py-3 border-b">
                      <div className="col-span-2 pl-2">No. Préstamo</div>
                      <div className="col-span-2">Cliente</div>
                      <div className="col-span-2">Cobrador</div>
                      <div className="col-span-1">Ruta</div>
                      <div className="col-span-1 text-right pr-2">Prestado</div>
                      <div className="col-span-1 text-right pr-2">Seguro</div>
                      <div className="col-span-1 text-center">Cuotas</div>
                      <div className="col-span-2 text-center">Fecha Desembolso</div>
                    </div>
                    
                    {/* Filas de préstamos */}
                    <div>
                      {prestamosPaginados.map((prestamo) => (
                        <div key={prestamo.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b hover:bg-gray-50">
                          <div className="col-span-2 pl-2">
                            <div className="text-sm font-mono text-blue-600">
                              {prestamo.numero_prestamo || 'N/A'}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="font-medium text-sm">
                              {prestamo.deudores?.nombre} {prestamo.deudores?.apellido}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {prestamo.deudores?.cedula}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm">
                              {prestamo.cobrador?.nombre} {prestamo.cobrador?.apellido}
                            </div>
                          </div>
                          <div className="col-span-1 text-sm">
                            {prestamo.ruta?.nombre_ruta}
                          </div>
                          <div className="col-span-1 text-right pr-2 text-sm font-semibold">
                            {formatCurrency(prestamo.monto_principal)}
                          </div>
                          <div className="col-span-1 text-right pr-2 text-sm text-blue-600 font-medium">
                            {formatCurrency(prestamo.valor_seguro || 0)}
                          </div>
                          <div className="col-span-1 text-center text-sm">
                            {prestamo.numero_cuotas}
                          </div>
                          <div className="col-span-2 text-center text-sm">
                            {formatDate(prestamo.fecha_desembolso)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Controles de paginación */}
                    {totalPaginasPrestamos > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {indexInicioPrestamos + 1} a {Math.min(indexFinPrestamos, prestamosDetalle.length)} de {prestamosDetalle.length} préstamos
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaPrestamos(p => Math.max(1, p - 1))}
                            disabled={paginaPrestamos === 1}
                          >
                            Anterior
                          </Button>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const maxPaginasVisibles = 3
                              let inicio = Math.max(1, paginaPrestamos - Math.floor(maxPaginasVisibles / 2))
                              let fin = Math.min(totalPaginasPrestamos, inicio + maxPaginasVisibles - 1)
                              
                              if (fin - inicio + 1 < maxPaginasVisibles) {
                                inicio = Math.max(1, fin - maxPaginasVisibles + 1)
                              }
                              
                              return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i).map((pagina) => (
                                <Button
                                  key={pagina}
                                  variant={pagina === paginaPrestamos ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPaginaPrestamos(pagina)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pagina}
                                </Button>
                              ))
                            })()}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaPrestamos(p => Math.min(totalPaginasPrestamos, p + 1))}
                            disabled={paginaPrestamos === totalPaginasPrestamos}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab de Cobros */}
              <TabsContent value="cobros">
                {loadingDetalle ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : cobrosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay cobros registrados para esta fecha
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Encabezados de la tabla */}
                    <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-muted-foreground bg-gray-50 px-6 py-3 border-b">
                      <div className="col-span-2 pl-2">No. Préstamo</div>
                      <div className="col-span-2">Cliente</div>
                      <div className="col-span-2">Cobrador</div>
                      <div className="col-span-2 text-right pr-2">Valor Cobrado</div>
                      <div className="col-span-2 text-center">Fecha Cobro</div>
                      <div className="col-span-2 text-center">Hora Cobro</div>
                    </div>
                    
                    {/* Filas de cobros */}
                    <div>
                      {cobrosPaginados.map((cobro) => (
                        <div key={cobro.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b hover:bg-gray-50">
                          <div className="col-span-2 pl-2">
                            <div className="text-sm font-mono text-blue-600">
                              {cobro.prestamo?.numero_prestamo || 'N/A'}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="font-medium text-sm">
                              {cobro.prestamo?.deudores?.nombre} {cobro.prestamo?.deudores?.apellido}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm">
                              {cobro.cobrador?.nombre} {cobro.cobrador?.apellido}
                            </div>
                          </div>
                          <div className="col-span-2 text-right pr-2 text-sm text-green-600 font-semibold">
                            {formatCurrency(cobro.monto_pagado)}
                          </div>
                          <div className="col-span-2 text-center text-sm">
                            {formatDate(cobro.fecha_pago)}
                          </div>
                          <div className="col-span-2 text-center text-sm text-muted-foreground">
                            {cobro.hora_pago || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Controles de paginación */}
                    {totalPaginasCobros > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {indexInicioCobros + 1} a {Math.min(indexFinCobros, cobrosDetalle.length)} de {cobrosDetalle.length} cobros
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaCobros(p => Math.max(1, p - 1))}
                            disabled={paginaCobros === 1}
                          >
                            Anterior
                          </Button>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const maxPaginasVisibles = 3
                              let inicio = Math.max(1, paginaCobros - Math.floor(maxPaginasVisibles / 2))
                              let fin = Math.min(totalPaginasCobros, inicio + maxPaginasVisibles - 1)
                              
                              if (fin - inicio + 1 < maxPaginasVisibles) {
                                inicio = Math.max(1, fin - maxPaginasVisibles + 1)
                              }
                              
                              return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i).map((pagina) => (
                                <Button
                                  key={pagina}
                                  variant={pagina === paginaCobros ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPaginaCobros(pagina)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pagina}
                                </Button>
                              ))
                            })()}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaCobros(p => Math.min(totalPaginasCobros, p + 1))}
                            disabled={paginaCobros === totalPaginasCobros}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab de Gastos */}
              <TabsContent value="gastos">
                {loadingDetalle ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : gastosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay gastos registrados para esta fecha
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cobrador</TableHead>
                          <TableHead>Ruta</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gastosDetalle.map((gasto) => (
                          <TableRow key={gasto.id}>
                            <TableCell className="font-medium">
                              {gasto.cobrador?.nombre} {gasto.cobrador?.apellido}
                            </TableCell>
                            <TableCell>{gasto.ruta?.nombre_ruta}</TableCell>
                            <TableCell>{gasto.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{gasto.tipo_gasto?.nombre || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {formatCurrency(gasto.monto)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                gasto.estado_aprobacion === 'aprobado' ? 'default' :
                                gasto.estado_aprobacion === 'rechazado' ? 'destructive' : 'secondary'
                              }>
                                {gasto.estado_aprobacion}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {gasto.hora_gasto || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Dialog de conciliación */}
      <Dialog open={dialogConciliar} onOpenChange={setDialogConciliar}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Conciliar Base Diaria
            </DialogTitle>
            <DialogDescription>
              {movimientoSeleccionado && (
                <>
                  {formatDate(movimientoSeleccionado.fecha)} - {movimientoSeleccionado.cobrador_nombre} - {movimientoSeleccionado.ruta_nombre}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {movimientoSeleccionado && (
            <div className="space-y-4">
              {/* Resumen de movimientos */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumen del Día</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Entregada:</span>
                    <span className="font-semibold">{formatCurrency(movimientoSeleccionado.base_entregada)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Cobros:</span>
                    <span className="font-semibold">{formatCurrency(movimientoSeleccionado.total_cobrado)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Seguros:</span>
                    <span className="font-semibold">{formatCurrency(movimientoSeleccionado.total_seguros)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>- Préstamos:</span>
                    <span className="font-semibold">{formatCurrency(movimientoSeleccionado.total_prestado)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>- Gastos:</span>
                    <span className="font-semibold">{formatCurrency(movimientoSeleccionado.total_gastos)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base">
                    <span className="font-bold">Teórico a Devolver:</span>
                    <span className="font-bold text-blue-700">{formatCurrency(movimientoSeleccionado.dinero_teorico)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Formulario */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dinero-devuelto">Dinero Efectivamente Devuelto *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dinero-devuelto"
                      type="number"
                      step="0.01"
                      value={dineroDevuelto}
                      onChange={(e) => setDineroDevuelto(e.target.value)}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona-entrega">Persona que Entrega la Base</Label>
                  <Select value={personaEntrega} onValueChange={setPersonaEntrega}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.nombre} {usuario.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Input
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones sobre la conciliación..."
                  />
                </div>

                {/* Resultado */}
                {dineroDevuelto && (
                  <Alert className={
                    parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico === 0
                      ? 'bg-green-50 border-green-200'
                      : parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico > 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Diferencia: </strong>
                      <span className="font-bold">
                        {parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico > 0 && '+'}
                        {formatCurrency(parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico)}
                      </span>
                      {parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico === 0 && ' - ¡Conciliación cuadrada!'}
                      {parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico > 0 && ' - Hay sobrante'}
                      {parseFloat(dineroDevuelto) - movimientoSeleccionado.dinero_teorico < 0 && ' - Falta dinero'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogConciliar(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarConciliacion} disabled={!dineroDevuelto}>
                  Guardar Conciliación
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
