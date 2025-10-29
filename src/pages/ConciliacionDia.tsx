import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { DataTableRow, DataTableCell } from '@/components/ui/data-table-row'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { usePagination } from '@/hooks/usePagination'
import { 
  Loader2,
  DollarSign,
  CheckCircle2,
  Info,
  ArrowLeft,
  Pencil,
  Check
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function ConciliacionDia() {
  const { fecha } = useParams<{ fecha: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [conciliacionPorRuta, setConciliacionPorRuta] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any | null>(null)
  const [grupoFiltroDetalle, setGrupoFiltroDetalle] = useState<any | null>(null)
  const [showConciliarGrupo, setShowConciliarGrupo] = useState(false)
  const [editandoBase, setEditandoBase] = useState(false)
  const [baseEntregadaEdit, setBaseEntregadaEdit] = useState('')
  const [editandoDevuelto, setEditandoDevuelto] = useState(false)
  const [dineroDevueltoEdit, setDineroDevueltoEdit] = useState('')
  
  const [prestamosDetalle, setPrestamosDetalle] = useState<any[]>([])
  const [cobrosDetalle, setCobrosDetalle] = useState<any[]>([])
  const [gastosDetalle, setGastosDetalle] = useState<any[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Cargar datos al montar
  useEffect(() => {
    if (fecha) {
      cargarDetalleMovimientos(fecha)
    }
  }, [fecha])

  const cargarDetalleMovimientos = async (fechaParam: string) => {
    setLoading(true)
    setLoadingDetalle(true)
    
    try {
      // ⚡ OPTIMIZACIÓN: Hacer todas las consultas en paralelo (solo 4 consultas)
      const [
        { data: prestamos },
        { data: cobros },
        { data: gastos },
        { data: basesDiarias }
      ] = await Promise.all([
        // 1. Préstamos completos (una sola consulta)
        supabase
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
          .eq('fecha_desembolso', fechaParam)
          .order('fecha_desembolso', { ascending: false }),

        // 2. Cobros completos (una sola consulta)
        supabase
          .from('pagos_recibidos')
          .select(`
            *,
            prestamo:prestamos!pagos_recibidos_prestamo_id_fkey(
              numero_prestamo,
              ruta_id,
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
          .eq('fecha_pago', fechaParam)
          .eq('estado', 'activo')
          .order('fecha_pago', { ascending: false }),

        // 3. Gastos completos (una sola consulta)
        supabase
          .from('gastos_diarios')
          .select(`
            *,
            cobrador:usuarios!gastos_diarios_user_id_fkey(nombre, apellido),
            ruta:rutas(nombre_ruta),
            tipo_gasto:tipos_gastos!gastos_diarios_tipo_gasto_id_fkey(nombre)
          `)
          .eq('fecha_gasto', fechaParam)
          .order('fecha_gasto', { ascending: false }),

        // 4. Todas las conciliaciones del día (UNA consulta en lugar de N)
        supabase
          .from('conciliacion_diaria')
          .select('id, ruta_id, cobrador_id, estado_conciliacion, monto_base_entregado, dinero_efectivamente_devuelto')
          .eq('fecha', fechaParam)
      ])

      // Guardar detalles para tabs
      setPrestamosDetalle(prestamos || [])
      setCobrosDetalle(cobros || [])
      setGastosDetalle(gastos || [])

      // Crear un mapa para búsqueda rápida de conciliaciones
      const conciliacionesMap = new Map<string, any>()
      basesDiarias?.forEach((conciliacion: any) => {
        const key = `${conciliacion.ruta_id}-${conciliacion.cobrador_id}`
        conciliacionesMap.set(key, conciliacion)
      })

      // Agrupar por ruta y cobrador
      const conciliacionAgrupada = new Map<string, any>()

      // Agrupar préstamos
      prestamos?.forEach((prestamo: any) => {
        const key = `${prestamo.ruta_id}-${prestamo.creado_por || 'sin_cobrador'}`
        if (!conciliacionAgrupada.has(key)) {
          conciliacionAgrupada.set(key, {
            ruta_id: prestamo.ruta_id,
            ruta_nombre: prestamo.ruta?.nombre_ruta || 'Sin ruta',
            cobrador_id: prestamo.creado_por,
            cobrador_nombre: prestamo.cobrador ? `${prestamo.cobrador.nombre} ${prestamo.cobrador.apellido}` : 'Sin cobrador',
            total_prestado: 0,
            total_cobrado: 0,
            total_seguros: 0,
            total_gastos: 0,
            base_entregada: 0,
            dinero_teorico: 0,
            dinero_devuelto: 0
          })
        }
        const grupo = conciliacionAgrupada.get(key)
        grupo.total_prestado += Number(prestamo.monto_principal || 0)
        grupo.total_seguros += Number(prestamo.valor_seguro || 0)
      })

      // Agrupar cobros
      cobros?.forEach((cobro: any) => {
        if (!cobro.prestamo) return
        const key = `${cobro.prestamo.ruta_id}-${cobro.registrado_por || 'sin_cobrador'}`
        if (!conciliacionAgrupada.has(key)) {
          conciliacionAgrupada.set(key, {
            ruta_id: cobro.prestamo.ruta_id,
            ruta_nombre: cobro.prestamo.ruta?.nombre_ruta || 'Sin ruta',
            cobrador_id: cobro.registrado_por,
            cobrador_nombre: cobro.cobrador ? `${cobro.cobrador.nombre} ${cobro.cobrador.apellido}` : 'Sin cobrador',
            total_prestado: 0,
            total_cobrado: 0,
            total_seguros: 0,
            total_gastos: 0,
            base_entregada: 0,
            dinero_teorico: 0,
            dinero_devuelto: 0
          })
        }
        const grupo = conciliacionAgrupada.get(key)
        grupo.total_cobrado += Number(cobro.monto_pagado || 0)
      })

      // Agrupar gastos
      gastos?.forEach((gasto: any) => {
        const key = `${gasto.ruta_id}-${gasto.user_id || 'sin_cobrador'}`
        if (!conciliacionAgrupada.has(key)) {
          conciliacionAgrupada.set(key, {
            ruta_id: gasto.ruta_id,
            ruta_nombre: gasto.ruta?.nombre_ruta || 'Sin ruta',
            cobrador_id: gasto.user_id,
            cobrador_nombre: gasto.cobrador ? `${gasto.cobrador.nombre} ${gasto.cobrador.apellido}` : 'Sin cobrador',
            total_prestado: 0,
            total_cobrado: 0,
            total_seguros: 0,
            total_gastos: 0,
            base_entregada: 0,
            dinero_teorico: 0,
            dinero_devuelto: 0
          })
        }
        const grupo = conciliacionAgrupada.get(key)
        grupo.total_gastos += Number(gasto.monto || 0)
      })

      // Calcular dinero teórico y asignar estado de conciliación
      const conciliacionArray = Array.from(conciliacionAgrupada.values()).map((grupo) => {
        // Buscar en el mapa (O(1) en lugar de hacer consulta)
        const key = `${grupo.ruta_id}-${grupo.cobrador_id}`
        const conciliacion = conciliacionesMap.get(key)
        
        // Si hay conciliación, usar los valores de la tabla
        if (conciliacion) {
          grupo.base_entregada = Number(conciliacion.monto_base_entregado || 0)
          grupo.dinero_devuelto = Number(conciliacion.dinero_efectivamente_devuelto || 0)
        }
        
        grupo.dinero_teorico = grupo.base_entregada + grupo.total_cobrado + grupo.total_seguros - grupo.total_prestado - grupo.total_gastos
        grupo.conciliacion_id = conciliacion?.id
        grupo.estado = conciliacion ? 'conciliado' : 'pendiente'
        
        return grupo
      })

      setConciliacionPorRuta(conciliacionArray)

      // Seleccionar automáticamente el primer grupo
      if (conciliacionArray.length > 0) {
        setGrupoFiltroDetalle(conciliacionArray[0])
      }

    } catch (error) {
      console.error('Error al cargar detalle:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle de movimientos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setLoadingDetalle(false)
    }
  }

  // Manejar selección de grupo para filtrar detalles
  const handleSeleccionarGrupo = (grupo: any) => {
    setGrupoFiltroDetalle(grupo)
    // La paginación se resetea automáticamente con usePagination
  }

  const handleConciliarGrupo = async (grupo: any) => {
    setGrupoSeleccionado(grupo)
    
    // Si ya está conciliado, cargar los datos existentes
    if (grupo.estado === 'conciliado' && grupo.conciliacion_id) {
      try {
        const { data: conciliacion, error } = await supabase
          .from('conciliacion_diaria')
          .select('*')
          .eq('id', grupo.conciliacion_id)
          .single()
        
        if (error) throw error
        
        if (conciliacion) {
          setBaseEntregadaEdit(conciliacion.monto_base_entregado.toString())
          setDineroDevueltoEdit(conciliacion.dinero_efectivamente_devuelto?.toString() || '0')
        }
      } catch (error) {
        console.error('Error al cargar conciliación:', error)
        setBaseEntregadaEdit(grupo.base_entregada.toString())
        setDineroDevueltoEdit('0')
      }
    } else {
      // Si no está conciliado, inicializar valores por defecto
      setBaseEntregadaEdit(grupo.base_entregada.toString())
      setDineroDevueltoEdit('0')
    }
    
    setEditandoBase(false)
    setEditandoDevuelto(false)
    setShowConciliarGrupo(true)
  }

  const guardarConciliacionGrupo = async () => {
    // Si ya está conciliado, no permitir guardar de nuevo
    if (grupoSeleccionado?.estado === 'conciliado') {
      toast({
        title: 'Información',
        description: 'Esta conciliación ya fue guardada. No se puede modificar.',
        variant: 'default'
      })
      setShowConciliarGrupo(false)
      return
    }

    if (!grupoSeleccionado || !user || !fecha || !baseEntregadaEdit || !dineroDevueltoEdit) {
      toast({
        title: 'Error',
        description: 'Debe ingresar el valor de la base y el dinero devuelto',
        variant: 'destructive'
      })
      return
    }

    try {
      // Verificar si ya existe una conciliación para este grupo
      const { data: existente, error: errorCheck } = await supabase
        .from('conciliacion_diaria')
        .select('id')
        .eq('fecha', fecha)
        .eq('cobrador_id', grupoSeleccionado.cobrador_id)
        .eq('ruta_id', grupoSeleccionado.ruta_id)
        .maybeSingle()

      if (errorCheck) throw errorCheck

      if (existente) {
        toast({
          title: 'Error',
          description: 'Ya existe una conciliación para este grupo. Recargue la página.',
          variant: 'destructive'
        })
        return
      }

      const baseEntregada = parseFloat(baseEntregadaEdit)
      const dineroDevuelto = parseFloat(dineroDevueltoEdit)
      
      // Calcular dinero teórico
      const dineroTeorico = baseEntregada + grupoSeleccionado.total_cobrado + grupoSeleccionado.total_seguros - grupoSeleccionado.total_prestado - grupoSeleccionado.total_gastos
      const diferencia = dineroDevuelto - dineroTeorico

      let estadoConciliacion: 'cuadrado' | 'sobrante' | 'faltante' | 'auditoria' = 'cuadrado'
      if (diferencia > 0) {
        estadoConciliacion = 'sobrante'
      } else if (diferencia < 0) {
        estadoConciliacion = 'faltante'
      }

      if (Math.abs(diferencia) > 50000) {
        estadoConciliacion = 'auditoria'
      }

      // Guardar conciliación directamente con fecha, cobrador_id y ruta_id
      const { error } = await supabase
        .from('conciliacion_diaria')
        .insert({
          fecha: fecha,
          cobrador_id: grupoSeleccionado.cobrador_id,
          ruta_id: grupoSeleccionado.ruta_id,
          monto_base_entregado: baseEntregada,
          total_cobros_realizados: grupoSeleccionado.total_cobrado,
          total_prestamos_nuevos: grupoSeleccionado.total_prestado,
          total_gastos_aprobados: grupoSeleccionado.total_gastos,
          total_seguros: grupoSeleccionado.total_seguros,
          dinero_efectivamente_devuelto: dineroDevuelto,
          dinero_teorico_devolver: dineroTeorico,
          diferencia: diferencia,
          estado_conciliacion: estadoConciliacion,
          observaciones_cierre: null,
          persona_entrega_base: null,
          nombre_persona_entrega: null,
          conciliado_por: user.id
        })

      if (error) throw error

      toast({
        title: 'Éxito',
        description: `Conciliación guardada para ${grupoSeleccionado.ruta_nombre} - ${grupoSeleccionado.cobrador_nombre}`
      })

      setShowConciliarGrupo(false)
      
      // Recargar detalles
      if (fecha) {
        await cargarDetalleMovimientos(fecha)
      }
    } catch (error) {
      console.error('Error al guardar conciliación:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la conciliación',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filtrar datos por grupo seleccionado
  const prestamosFiltrados = grupoFiltroDetalle 
    ? prestamosDetalle.filter(p => 
        p.ruta_id === grupoFiltroDetalle.ruta_id && 
        p.creado_por === grupoFiltroDetalle.cobrador_id
      )
    : prestamosDetalle

  const cobrosFiltrados = grupoFiltroDetalle
    ? cobrosDetalle.filter(c => 
        c.prestamo?.ruta_id === grupoFiltroDetalle.ruta_id && 
        c.registrado_por === grupoFiltroDetalle.cobrador_id
      )
    : cobrosDetalle

  const gastosFiltrados = grupoFiltroDetalle
    ? gastosDetalle.filter(g => 
        g.ruta_id === grupoFiltroDetalle.ruta_id && 
        g.user_id === grupoFiltroDetalle.cobrador_id
      )
    : gastosDetalle

  // Hooks de paginación para cada tabla
  const { paginatedData: prestamosPaginados, pagination: paginationPrestamos, controls: controlsPrestamos } = usePagination(prestamosFiltrados, 5)
  const { paginatedData: cobrosPaginados, pagination: paginationCobros, controls: controlsCobros } = usePagination(cobrosFiltrados, 5)
  const { paginatedData: gastosPaginados, pagination: paginationGastos, controls: controlsGastos } = usePagination(gastosFiltrados, 5)

  // Definir columnas para tabla de préstamos
  const columnasPrestamos: DataTableColumn<any>[] = [
    { key: 'numero', header: 'No. Préstamo', className: 'col-span-2' },
    { key: 'cliente', header: 'Cliente', className: 'col-span-2' },
    { key: 'cobrador', header: 'Cobrador', className: 'col-span-2' },
    { key: 'ruta', header: 'Ruta', className: 'col-span-1' },
    { key: 'prestado', header: 'Prestado', className: 'col-span-1 text-right' },
    { key: 'seguro', header: 'Seguro', className: 'col-span-1 text-right' },
    { key: 'cuotas', header: 'Cuotas', className: 'col-span-1 text-center' },
    { key: 'fecha', header: 'Fecha Desembolso', className: 'col-span-2 text-center' },
  ]

  // Renderizar fila de préstamo
  const renderPrestamo = (prestamo: any) => (
    <DataTableRow gridCols="grid-cols-12">
      <DataTableCell className="col-span-2 font-mono text-sm text-blue-600 hover:underline cursor-pointer">
        <div onClick={(e) => {
          e.stopPropagation()
          navigate(`/prestamos/${prestamo.id}`)
        }}>
          {prestamo.numero_prestamo}
        </div>
      </DataTableCell>
      <DataTableCell className="col-span-2 font-medium">
        {prestamo.deudores?.nombre} {prestamo.deudores?.apellido}
      </DataTableCell>
      <DataTableCell className="col-span-2">
        {prestamo.cobrador?.nombre} {prestamo.cobrador?.apellido}
      </DataTableCell>
      <DataTableCell className="col-span-1">{prestamo.ruta?.nombre_ruta}</DataTableCell>
      <DataTableCell className="col-span-1 text-right text-red-600 font-semibold">
        {formatCurrency(prestamo.monto_principal)}
      </DataTableCell>
      <DataTableCell className="col-span-1 text-right text-green-600 font-semibold">
        {formatCurrency(prestamo.valor_seguro || 0)}
      </DataTableCell>
      <DataTableCell className="col-span-1 text-center">{prestamo.numero_cuotas}</DataTableCell>
      <DataTableCell className="col-span-2 text-center text-sm">
        {formatDate(prestamo.fecha_desembolso)}
      </DataTableCell>
    </DataTableRow>
  )

  // Definir columnas para tabla de cobros
  const columnasCobros: DataTableColumn<any>[] = [
    { key: 'numero', header: 'No. Préstamo', className: 'col-span-2 pl-2' },
    { key: 'cliente', header: 'Cliente', className: 'col-span-2' },
    { key: 'cobrador', header: 'Cobrador', className: 'col-span-2' },
    { key: 'valor', header: 'Valor Cobrado', className: 'col-span-2 text-right pr-2' },
    { key: 'fecha', header: 'Fecha Cobro', className: 'col-span-2 text-center' },
    { key: 'hora', header: 'Hora Cobro', className: 'col-span-2 text-center' },
  ]

  // Renderizar fila de cobro
  const renderCobro = (cobro: any) => (
    <DataTableRow gridCols="grid-cols-12">
      <DataTableCell className="col-span-2 pl-2 font-mono text-sm text-blue-600 hover:underline cursor-pointer">
        <div onClick={(e) => {
          e.stopPropagation()
          cobro.prestamo_id && navigate(`/prestamos/${cobro.prestamo_id}`)
        }}>
          {cobro.prestamo?.numero_prestamo || 'N/A'}
        </div>
      </DataTableCell>
      <DataTableCell className="col-span-2 font-medium text-sm">
        {cobro.prestamo?.deudores?.nombre} {cobro.prestamo?.deudores?.apellido}
      </DataTableCell>
      <DataTableCell className="col-span-2 text-sm">
        {cobro.cobrador?.nombre} {cobro.cobrador?.apellido}
      </DataTableCell>
      <DataTableCell className="col-span-2 text-right pr-2 text-sm text-green-600 font-semibold">
        {formatCurrency(cobro.monto_pagado)}
      </DataTableCell>
      <DataTableCell className="col-span-2 text-center text-sm">
        {formatDate(cobro.fecha_pago)}
      </DataTableCell>
      <DataTableCell className="col-span-2 text-center text-sm text-muted-foreground">
        {cobro.hora_pago || 'N/A'}
      </DataTableCell>
    </DataTableRow>
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/base-diaria')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Conciliación del Día - {fecha && formatDate(fecha)}
          </h2>
          <p className="text-muted-foreground">
            Concilia cada ruta y cobrador para cerrar el día
          </p>
        </div>
      </div>

      {/* Conciliación por Ruta y Cobrador */}
      <Card>
        <CardHeader>
          <CardTitle>Conciliación por Ruta y Cobrador</CardTitle>
          <CardDescription>
            Cada ruta y cobrador debe ser conciliado individualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Cobrador</TableHead>
                  <TableHead className="text-right">Prestado</TableHead>
                  <TableHead className="text-right">Cobrado</TableHead>
                  <TableHead className="text-right">Seguros</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Devuelto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conciliacionPorRuta.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No hay movimientos para este día
                    </TableCell>
                  </TableRow>
                ) : (
                  conciliacionPorRuta.map((grupo, index) => (
                    <TableRow 
                      key={index}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        grupoFiltroDetalle?.ruta_id === grupo.ruta_id && 
                        grupoFiltroDetalle?.cobrador_id === grupo.cobrador_id 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : ''
                      }`}
                      onClick={() => handleSeleccionarGrupo(grupo)}
                    >
                      <TableCell className="font-medium">{grupo.ruta_nombre}</TableCell>
                      <TableCell>{grupo.cobrador_nombre}</TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(grupo.total_prestado)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(grupo.total_cobrado)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(grupo.total_seguros)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(grupo.total_gastos)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(grupo.base_entregada)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(grupo.dinero_devuelto)}
                      </TableCell>
                      <TableCell className="text-center">
                        {grupo.estado === 'conciliado' ? (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Conciliado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {grupo.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            onClick={() => handleConciliarGrupo(grupo)}
                          >
                            Conciliar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConciliarGrupo(grupo)}
                          >
                            Ver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de movimientos por tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {grupoFiltroDetalle ? (
              <span>
                Detalle: <span className="text-blue-600">{grupoFiltroDetalle.ruta_nombre}</span> - {grupoFiltroDetalle.cobrador_nombre}
              </span>
            ) : (
              'Selecciona un grupo para ver el detalle'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="prestamos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prestamos">
                Préstamos & Seguros ({prestamosFiltrados.length})
              </TabsTrigger>
              <TabsTrigger value="cobros">
                Cobros ({cobrosFiltrados.length})
              </TabsTrigger>
              <TabsTrigger value="gastos">
                Gastos ({gastosFiltrados.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab de Préstamos y Seguros */}
            <TabsContent value="prestamos">
              <DataTable
                columns={columnasPrestamos}
                data={prestamosPaginados}
                loading={loadingDetalle}
                error={null}
                emptyMessage={grupoFiltroDetalle 
                  ? `No hay préstamos para ${grupoFiltroDetalle.ruta_nombre} - ${grupoFiltroDetalle.cobrador_nombre}`
                    : 'No hay préstamos registrados para esta fecha'
                  }
                emptyDescription="Selecciona un grupo para ver los préstamos"
                renderRow={renderPrestamo}
                pagination={paginationPrestamos}
                paginationControls={controlsPrestamos}
                showPagination={true}
                itemsPerPageOptions={[5, 10, 20]}
                gridCols="grid-cols-12"
                showHeader={true}
              />
            </TabsContent>

            {/* Tab de Cobros */}
            <TabsContent value="cobros">
              <DataTable
                columns={columnasCobros}
                data={cobrosPaginados}
                loading={loadingDetalle}
                error={null}
                emptyMessage={grupoFiltroDetalle 
                  ? `No hay cobros para ${grupoFiltroDetalle.ruta_nombre} - ${grupoFiltroDetalle.cobrador_nombre}`
                    : 'No hay cobros registrados para esta fecha'
                  }
                emptyDescription="Selecciona un grupo para ver los cobros"
                renderRow={renderCobro}
                pagination={paginationCobros}
                paginationControls={controlsCobros}
                showPagination={true}
                itemsPerPageOptions={[5, 10, 20]}
                gridCols="grid-cols-12"
                showHeader={true}
              />
            </TabsContent>

            {/* Tab de Gastos */}
            <TabsContent value="gastos">
              {loadingDetalle ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : gastosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {grupoFiltroDetalle 
                    ? `No hay gastos registrados para ${grupoFiltroDetalle.ruta_nombre} - ${grupoFiltroDetalle.cobrador_nombre}`
                    : 'No hay gastos registrados para esta fecha'
                  }
                </div>
              ) : (
                <div className="space-y-4">
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
                        {gastosPaginados.map((gasto) => (
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

                  {/* Paginación Gastos */}
                  {paginationGastos.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {paginationGastos.from} a {paginationGastos.to} de {gastosFiltrados.length} gastos
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={controlsGastos.prevPage}
                          disabled={paginationGastos.currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(paginationGastos.totalPages, 5) }, (_, i) => i + 1).map((pagina) => (
                            <Button
                              key={pagina}
                              variant={pagina === paginationGastos.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => controlsGastos.goToPage(pagina)}
                              className="w-8 h-8 p-0"
                            >
                              {pagina}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={controlsGastos.nextPage}
                          disabled={paginationGastos.currentPage === paginationGastos.totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para conciliar grupo */}
      <Dialog open={showConciliarGrupo} onOpenChange={setShowConciliarGrupo}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {grupoSeleccionado?.estado === 'conciliado' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Ver Conciliación
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5" />
                  Conciliar Ruta y Cobrador
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {grupoSeleccionado && (
                <>
                  {fecha && formatDate(fecha)} - {grupoSeleccionado.ruta_nombre} - {grupoSeleccionado.cobrador_nombre}
                  {grupoSeleccionado.estado === 'conciliado' && (
                    <span className="ml-2 text-green-600 font-semibold">• Ya conciliado</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {grupoSeleccionado && (
            <div className="space-y-4">
              {/* Resumen de movimientos */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumen del Grupo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Base Entregada:</span>
                    <div className="flex items-center gap-2">
                      {editandoBase && grupoSeleccionado.estado !== 'conciliado' ? (
                        <>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              value={baseEntregadaEdit}
                              onChange={(e) => setBaseEntregadaEdit(e.target.value)}
                              onFocus={(e) => e.target.value === '0' && setBaseEntregadaEdit('')}
                              onBlur={(e) => !e.target.value && setBaseEntregadaEdit('0')}
                              className="h-8 w-32 pl-7 text-sm"
                              autoFocus
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => setEditandoBase(false)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{formatCurrency(parseFloat(baseEntregadaEdit))}</span>
                          {grupoSeleccionado.estado !== 'conciliado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditandoBase(true)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Cobros:</span>
                    <span className="font-semibold">{formatCurrency(grupoSeleccionado.total_cobrado)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Seguros:</span>
                    <span className="font-semibold">{formatCurrency(grupoSeleccionado.total_seguros)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>- Préstamos:</span>
                    <span className="font-semibold">{formatCurrency(grupoSeleccionado.total_prestado)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>- Gastos:</span>
                    <span className="font-semibold">{formatCurrency(grupoSeleccionado.total_gastos)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base">
                    <span className="font-bold">Teórico a Devolver:</span>
                    <span className="font-bold text-blue-700">
                      {formatCurrency(parseFloat(baseEntregadaEdit) + grupoSeleccionado.total_cobrado + grupoSeleccionado.total_seguros - grupoSeleccionado.total_prestado - grupoSeleccionado.total_gastos)}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-base">
                    <span className="font-bold">Dinero Devuelto:</span>
                    <div className="flex items-center gap-2">
                      {editandoDevuelto && grupoSeleccionado.estado !== 'conciliado' ? (
                        <>
                  <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                              value={dineroDevueltoEdit}
                              onChange={(e) => setDineroDevueltoEdit(e.target.value)}
                              onFocus={(e) => e.target.value === '0' && setDineroDevueltoEdit('')}
                              onBlur={(e) => !e.target.value && setDineroDevueltoEdit('0')}
                              className="h-8 w-32 pl-7 text-sm"
                              autoFocus
                    />
                  </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => setEditandoDevuelto(false)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-blue-700">{formatCurrency(parseFloat(dineroDevueltoEdit))}</span>
                          {grupoSeleccionado.estado !== 'conciliado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditandoDevuelto(true)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                </div>
                  </div>
                  {dineroDevueltoEdit && baseEntregadaEdit && (() => {
                    const teorico = parseFloat(baseEntregadaEdit) + grupoSeleccionado.total_cobrado + grupoSeleccionado.total_seguros - grupoSeleccionado.total_prestado - grupoSeleccionado.total_gastos
                    const diferencia = parseFloat(dineroDevueltoEdit) - teorico
                    return (
                      <div className={`border-t mt-3 pt-3 flex justify-between text-lg font-bold px-3 py-2 rounded-lg ${
                        diferencia === 0 ? 'bg-green-100 text-green-800 border-green-300' :
                        diferencia > 0 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        <span className="flex items-center gap-2">
                          {diferencia === 0 ? '✓' : diferencia > 0 ? '↑' : '↓'} Diferencia:
                          </span>
                        <span>
                          {diferencia > 0 && '+'}{formatCurrency(diferencia)}
                          {diferencia === 0 && ' - Cuadrado'}
                          {diferencia > 0 && ' - Sobrante'}
                          {diferencia < 0 && ' - Faltante'}
                        </span>
              </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                {grupoSeleccionado.estado === 'conciliado' ? (
                  <Button onClick={() => setShowConciliarGrupo(false)}>
                    Cerrar
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setShowConciliarGrupo(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarConciliacionGrupo} disabled={!baseEntregadaEdit || !dineroDevueltoEdit}>
                      Conciliar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

