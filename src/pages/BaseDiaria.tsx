import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { DataTableRow, DataTableCell } from '@/components/ui/data-table-row'
import { supabase } from '@/integrations/supabase/client'
import { useRutas } from '@/hooks/useRutas'
import { usePagination, type PaginationState } from '@/hooks/usePagination'
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
  User,
  Pencil,
  Check
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MovimientoDiario {
  id: string
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
  const navigate = useNavigate()
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cobradorFiltro, setCobradorFiltro] = useState('')
  const [rutaFiltro, setRutaFiltro] = useState('')
  const [cobradores, setCobradores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [prestamosDetalle, setPrestamosDetalle] = useState<any[]>([])
  const [cobrosDetalle, setCobrosDetalle] = useState<any[]>([])
  const [gastosDetalle, setGastosDetalle] = useState<any[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [paginaPrestamos, setPaginaPrestamos] = useState(1)
  const [paginaCobros, setPaginaCobros] = useState(1)
  const [paginaGastos, setPaginaGastos] = useState(1)
  const itemsPorPaginaDetalle = 5
  const [fechaResaltada, setFechaResaltada] = useState<string | null>(null)
  const scrollPositionRef = useRef<number>(0)

  const { rutas } = useRutas()
  
  // Paginación con hook personalizado
  const { paginatedData: movimientosPaginados, pagination, controls } = usePagination(movimientos, 5)

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
          // Buscar si existe conciliación para esta fecha directamente
          const { data: conciliaciones } = await supabase
            .from('conciliacion_diaria')
            .select('id, dinero_efectivamente_devuelto, diferencia, monto_base_entregado')
            .eq('fecha', mov.fecha)

          // Si hay conciliaciones, obtener base y dinero devuelto
          const baseEntregada = conciliaciones?.reduce((sum, c) => sum + Number(c.monto_base_entregado || 0), 0) || 0
          const dineroDevuelto = conciliaciones?.reduce((sum, c) => sum + Number(c.dinero_efectivamente_devuelto || 0), 0) || 0

          const dineroTeorico = baseEntregada + mov.total_cobrado + mov.total_seguros - mov.total_prestado - mov.total_gastos
          const hayConciliacion = conciliaciones && conciliaciones.length > 0

          // Calcular diferencia: Base + Cobros + Seguros - Prestado - Gastos - Devuelto
          const diferenciaCalculada = baseEntregada + mov.total_cobrado + mov.total_seguros - mov.total_prestado - mov.total_gastos - dineroDevuelto

          // El estado depende de la diferencia calculada
          let estado: 'conciliado' | 'pendiente' = 'pendiente'
          if (hayConciliacion) {
            estado = 'conciliado'
          }

          return {
            id: mov.fecha, // Usar la fecha como ID único
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
            diferencia: diferenciaCalculada,
            estado: estado,
            conciliacion_id: conciliaciones?.[0]?.id
          }
        })
      )

      // Ordenar por fecha descendente
      movimientosConConciliacion.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      setMovimientos(movimientosConConciliacion)
      
      // Cargar detalle del primer día automáticamente
      if (movimientosConConciliacion.length > 0 && !fechaSeleccionada) {
        const primeraFecha = movimientosConConciliacion[0].fecha
        cargarDetalleMovimientos(primeraFecha)
        setFechaResaltada(primeraFecha)
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

  // Manejar selección de fecha
  const handleSeleccionarFecha = (fecha: string) => {
    // Guardar la posición actual del scroll
    scrollPositionRef.current = window.scrollY
    setFechaResaltada(fecha)
    cargarDetalleMovimientos(fecha)
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
      // Restaurar la posición del scroll después de un breve delay
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant'
        })
      }, 0)
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

  // Componente Skeleton para tabla de préstamos
  const SkeletonPrestamos = () => (
    <div className="space-y-0 min-h-[400px] border rounded-md overflow-hidden">
      {/* Encabezados */}
      <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-900 bg-gray-100 px-6 py-3 border-b-2 border-gray-300">
        <div className="col-span-2 pl-2">No. Préstamo</div>
        <div className="col-span-2">Cliente</div>
        <div className="col-span-2">Cobrador</div>
        <div className="col-span-1">Ruta</div>
        <div className="col-span-1 text-right pr-2">Prestado</div>
        <div className="col-span-1 text-right pr-2">Seguro</div>
        <div className="col-span-1 text-center">Cuotas</div>
        <div className="col-span-2 text-center">Fecha Desembolso</div>
      </div>
      
      {/* Filas skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b">
          <div className="col-span-2 pl-2"><Skeleton className="h-5 w-24" /></div>
          <div className="col-span-2 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="col-span-2"><Skeleton className="h-4 w-28" /></div>
          <div className="col-span-1"><Skeleton className="h-4 w-16" /></div>
          <div className="col-span-1 flex justify-end pr-2"><Skeleton className="h-4 w-20" /></div>
          <div className="col-span-1 flex justify-end pr-2"><Skeleton className="h-4 w-16" /></div>
          <div className="col-span-1 flex justify-center"><Skeleton className="h-4 w-8" /></div>
          <div className="col-span-2 flex justify-center"><Skeleton className="h-4 w-24" /></div>
        </div>
      ))}
    </div>
  )

  // Componente Skeleton para tabla de cobros
  const SkeletonCobros = () => (
    <div className="space-y-0 min-h-[400px] border rounded-md overflow-hidden">
      {/* Encabezados */}
      <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-900 bg-gray-100 px-6 py-3 border-b-2 border-gray-300">
        <div className="col-span-2 pl-2">No. Préstamo</div>
        <div className="col-span-2">Cliente</div>
        <div className="col-span-2">Cobrador</div>
        <div className="col-span-2 text-right pr-2">Valor Cobrado</div>
        <div className="col-span-2 text-center">Fecha Cobro</div>
        <div className="col-span-2 text-center">Hora Cobro</div>
      </div>
      
      {/* Filas skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b">
          <div className="col-span-2 pl-2"><Skeleton className="h-5 w-24" /></div>
          <div className="col-span-2"><Skeleton className="h-4 w-32" /></div>
          <div className="col-span-2"><Skeleton className="h-4 w-28" /></div>
          <div className="col-span-2 flex justify-end pr-2"><Skeleton className="h-4 w-20" /></div>
          <div className="col-span-2 flex justify-center"><Skeleton className="h-4 w-24" /></div>
          <div className="col-span-2 flex justify-center"><Skeleton className="h-4 w-16" /></div>
        </div>
      ))}
    </div>
  )

  // Componente Skeleton para tabla de gastos
  const SkeletonGastos = () => (
    <div className="overflow-x-auto min-h-[400px]">
      <Table className="border">
        <TableHeader>
          <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
            <TableHead className="font-bold text-gray-900">Cobrador</TableHead>
            <TableHead className="font-bold text-gray-900">Ruta</TableHead>
            <TableHead className="font-bold text-gray-900">Descripción</TableHead>
            <TableHead className="font-bold text-gray-900">Categoría</TableHead>
            <TableHead className="text-right font-bold text-gray-900">Monto</TableHead>
            <TableHead className="font-bold text-gray-900">Estado</TableHead>
            <TableHead className="font-bold text-gray-900">Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const totales = movimientos.reduce((acc, mov) => ({
    base: acc.base + mov.base_entregada,
    prestado: acc.prestado + mov.total_prestado,
    cobrado: acc.cobrado + mov.total_cobrado,
    seguros: acc.seguros + mov.total_seguros,
    gastos: acc.gastos + mov.total_gastos,
    teorico: acc.teorico + mov.dinero_teorico,
    diferencia: acc.diferencia + mov.diferencia
  }), { base: 0, prestado: 0, cobrado: 0, seguros: 0, gastos: 0, teorico: 0, diferencia: 0 })

  // Definir columnas para la tabla
  const columnasMovimientos: DataTableColumn<MovimientoDiario>[] = [
    { key: 'fecha', header: 'Fecha', className: 'font-bold text-gray-900' },
    { key: 'prestado', header: 'Prestado', className: 'text-right font-bold text-gray-900' },
    { key: 'cobrado', header: 'Cobrado', className: 'text-right font-bold text-gray-900' },
    { key: 'seguros', header: 'Seguros', className: 'text-right font-bold text-gray-900' },
    { key: 'gastos', header: 'Gastos', className: 'text-right font-bold text-gray-900' },
    { key: 'base', header: 'Base', className: 'text-right font-bold text-gray-900' },
    { key: 'diferencia', header: 'Diferencia', className: 'text-right font-bold text-gray-900' },
    { key: 'estado', header: 'Estado', className: 'text-center font-bold text-gray-900' },
  ]

  // Renderizar cada fila de movimiento
  const renderMovimientoRow = (mov: MovimientoDiario) => (
    <DataTableRow
      gridCols="grid-cols-8"
      className={`cursor-pointer transition-all ${
        fechaResaltada === mov.fecha 
          ? 'bg-blue-50 hover:bg-blue-100'
          : ''
      }`}
      onClick={() => handleSeleccionarFecha(mov.fecha)}
    >
      <DataTableCell 
        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline"
      >
        <div onClick={(e) => {
          e.stopPropagation()
          navigate(`/base-diaria/${mov.fecha}`)
        }}>
          {formatDate(mov.fecha)}
        </div>
      </DataTableCell>
      
      <DataTableCell className="text-right text-sm text-red-600">
        -{formatCurrency(mov.total_prestado)}
      </DataTableCell>
      
      <DataTableCell className="text-right text-sm text-green-600">
        +{formatCurrency(mov.total_cobrado)}
      </DataTableCell>
      
      <DataTableCell className="text-right text-sm text-green-600">
        +{formatCurrency(mov.total_seguros)}
      </DataTableCell>
      
      <DataTableCell className="text-right text-sm text-red-600">
        -{formatCurrency(mov.total_gastos)}
      </DataTableCell>
      
      <DataTableCell className="text-right text-sm">
        {formatCurrency(mov.base_entregada)}
      </DataTableCell>
      
      <DataTableCell className={`text-right text-sm font-bold ${
        mov.diferencia === 0 ? 'text-green-600' :
        mov.diferencia > 0 ? 'text-blue-600' :
        'text-red-600'
      }`}>
        {formatCurrency(mov.diferencia)}
      </DataTableCell>
      
      <DataTableCell className="text-center text-sm">
        {getEstadoBadge(mov.estado, mov.diferencia)}
      </DataTableCell>
    </DataTableRow>
  )

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

      {/* Tabla de movimientos con componente genérico */}
      <DataTable
        columns={columnasMovimientos}
        data={movimientosPaginados}
        loading={loading}
        error={null}
        emptyMessage="No hay movimientos"
        emptyDescription="No se encontraron movimientos para el rango de fechas seleccionado"
        renderRow={renderMovimientoRow}
        pagination={pagination}
        paginationControls={controls}
        showPagination={true}
        itemsPerPageOptions={[5, 10, 20, 30]}
        gridCols="grid-cols-8"
        showHeader={true}
      />

      {/* Detalle de movimientos por tabs */}
      {fechaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Detalle de Movimientos - {formatDate(fechaSeleccionada)}
            </CardTitle>
            <CardDescription>
              Préstamos, cobros y gastos registrados en esta fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 min-h-[500px]">
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
                  <SkeletonPrestamos />
                ) : prestamosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground min-h-[400px]">
                    No hay préstamos registrados para esta fecha
                  </div>
                ) : (
                  <div className="space-y-0 min-h-[400px] border rounded-md overflow-hidden">
                    {/* Encabezados de la tabla */}
                    <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-900 bg-gray-100 px-6 py-3 border-b-2 border-gray-300">
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
                    <div className="bg-white">
                      {prestamosPaginados.map((prestamo) => (
                        <div key={prestamo.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b hover:bg-gray-50 transition-colors">
                          <div className="col-span-2 pl-2">
                            <div 
                              className="text-sm font-mono text-blue-600 hover:underline cursor-pointer"
                              onClick={() => navigate(`/prestamos/${prestamo.id}`)}
                            >
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
                  <SkeletonCobros />
                ) : cobrosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground min-h-[400px]">
                    No hay cobros registrados para esta fecha
                  </div>
                ) : (
                  <div className="space-y-0 min-h-[400px] border rounded-md overflow-hidden">
                    {/* Encabezados de la tabla */}
                    <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-900 bg-gray-100 px-6 py-3 border-b-2 border-gray-300">
                      <div className="col-span-2 pl-2">No. Préstamo</div>
                      <div className="col-span-2">Cliente</div>
                      <div className="col-span-2">Cobrador</div>
                      <div className="col-span-2 text-right pr-2">Valor Cobrado</div>
                      <div className="col-span-2 text-center">Fecha Cobro</div>
                      <div className="col-span-2 text-center">Hora Cobro</div>
                    </div>
                    
                    {/* Filas de cobros */}
                    <div className="bg-white">
                      {cobrosPaginados.map((cobro) => (
                        <div key={cobro.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b hover:bg-gray-50 transition-colors">
                          <div className="col-span-2 pl-2">
                            <div 
                              className="text-sm font-mono text-blue-600 hover:underline cursor-pointer"
                              onClick={() => cobro.prestamo_id && navigate(`/prestamos/${cobro.prestamo_id}`)}
                            >
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
                  <SkeletonGastos />
                ) : gastosDetalle.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground min-h-[400px]">
                    No hay gastos registrados para esta fecha
                  </div>
                ) : (
                  <div className="overflow-x-auto min-h-[400px]">
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                          <TableHead className="font-bold text-gray-900">Cobrador</TableHead>
                          <TableHead className="font-bold text-gray-900">Ruta</TableHead>
                          <TableHead className="font-bold text-gray-900">Descripción</TableHead>
                          <TableHead className="font-bold text-gray-900">Categoría</TableHead>
                          <TableHead className="text-right font-bold text-gray-900">Monto</TableHead>
                          <TableHead className="font-bold text-gray-900">Estado</TableHead>
                          <TableHead className="font-bold text-gray-900">Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gastosDetalle.map((gasto) => (
                          <TableRow key={gasto.id} className="hover:bg-gray-50 transition-colors">
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
    </div>
  )
}
