import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard, 
  User, 
  Eye, 
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Receipt,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react"
import { usePrestamos } from "@/hooks/usePrestamos"
import { usePagination } from "@/hooks/usePagination"
import { PrestamoExtendido } from "@/types/prestamo"
import { PrestamoDetalleModal } from "@/components/prestamos/PrestamoDetalleModal"
import Pagination from "@/components/ui/pagination"
import { supabase } from "@/integrations/supabase/client"

interface PrestamosRutaTableProps {
  rutaId: string
}

interface GastoRuta {
  id: string
  ruta_id: string
  tipo_gasto_id: string
  monto: number
  fecha_gasto: string | null
  descripcion: string
  estado_aprobacion: string | null
  tipo_gasto: { nombre: string } | null
}

interface TipoGastoOption {
  id: string
  nombre: string
}

interface RutaOption {
  id: string
  nombre_ruta: string
}

type SortColumn = 'cliente' | 'fecha' | 'prestamo' | 'seguro' | 'total' | 'saldo' | 'cuotas' | 'estado'
type SortDirection = 'asc' | 'desc'

function getEstadoBadge(estado: string | null) {
  const baseClass = "text-[10px] px-1.5 py-0 h-4"
  switch (estado) {
    case "activo":
      return <Badge className={`${baseClass} bg-green-100 text-green-800 hover:bg-green-100`}>Activo</Badge>
    case "vencido":
      return <Badge variant="destructive" className={baseClass}>Vencido</Badge>
    case "pagado":
      return <Badge className={`${baseClass} bg-gray-100 text-gray-600`}>Pagado</Badge>
    case "cancelado":
      return <Badge variant="outline" className={`${baseClass} bg-red-100 text-red-600`}>Cancel</Badge>
    default:
      return <Badge variant="outline" className={baseClass}>{estado || "N/A"}</Badge>
  }
}

export function PrestamosRutaTable({ rutaId }: PrestamosRutaTableProps) {
  const { prestamos, loading, error, refetch: refetchPrestamos } = usePrestamos({ ruta_id: rutaId })
  const [sortColumn, setSortColumn] = useState<SortColumn>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [filtroCuotasVencidas, setFiltroCuotasVencidas] = useState(false)
  const [selectedPrestamoId, setSelectedPrestamoId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [gastos, setGastos] = useState<GastoRuta[]>([])
  const [loadingGastos, setLoadingGastos] = useState(false)
  const [tiposGasto, setTiposGasto] = useState<TipoGastoOption[]>([])
  const [rutas, setRutas] = useState<RutaOption[]>([])
  const [gastoEditar, setGastoEditar] = useState<GastoRuta | null>(null)
  const [gastoEliminar, setGastoEliminar] = useState<GastoRuta | null>(null)
  const [guardandoGasto, setGuardandoGasto] = useState(false)
  const [eliminandoGasto, setEliminandoGasto] = useState(false)
  const [editForm, setEditForm] = useState<{ monto: string; descripcion: string; fecha_gasto: string; tipo_gasto_id: string; estado_aprobacion: string; ruta_id: string }>({ monto: "", descripcion: "", fecha_gasto: "", tipo_gasto_id: "", estado_aprobacion: "", ruta_id: "" })
  const { toast } = useToast()

  const abrirEditar = (g: GastoRuta) => {
    setGastoEditar(g)
    setEditForm({
      monto: String(g.monto ?? ""),
      descripcion: g.descripcion ?? "",
      fecha_gasto: g.fecha_gasto ? g.fecha_gasto.slice(0, 10) : "",
      tipo_gasto_id: g.tipo_gasto_id ?? "",
      estado_aprobacion: g.estado_aprobacion ?? "pendiente",
      ruta_id: g.ruta_id ?? "",
    })
  }

  const guardarGasto = async () => {
    if (!gastoEditar) return
    const monto = parseFloat(editForm.monto)
    if (Number.isNaN(monto) || monto <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" })
      return
    }
    setGuardandoGasto(true)
    const payload: Record<string, unknown> = {
      monto,
      descripcion: editForm.descripcion || null,
      fecha_gasto: editForm.fecha_gasto || null,
      tipo_gasto_id: editForm.tipo_gasto_id || null,
      estado_aprobacion: editForm.estado_aprobacion || null,
    }
    if (editForm.ruta_id && editForm.ruta_id !== gastoEditar.ruta_id) {
      payload.ruta_id = editForm.ruta_id
    }
    const { error } = await supabase
      .from("gastos_diarios")
      .update(payload)
      .eq("id", gastoEditar.id)
    setGuardandoGasto(false)
    if (error) {
      toast({ title: "Error al actualizar gasto", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Gasto actualizado" })
    setGastoEditar(null)
    fetchGastos()
  }

  const eliminarGasto = async () => {
    if (!gastoEliminar) return
    setEliminandoGasto(true)
    const { error } = await supabase.from("gastos_diarios").delete().eq("id", gastoEliminar.id)
    setEliminandoGasto(false)
    setGastoEliminar(null)
    if (error) {
      toast({ title: "Error al eliminar gasto", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Gasto eliminado" })
    fetchGastos()
  }

  const fetchGastos = useCallback(() => {
    if (!rutaId) return
    setLoadingGastos(true)
    supabase
      .from("gastos_diarios")
      .select("id, ruta_id, tipo_gasto_id, monto, fecha_gasto, descripcion, estado_aprobacion, tipo_gasto:tipos_gastos!gastos_diarios_tipo_gasto_id_fkey(nombre)")
      .eq("ruta_id", rutaId)
      .order("fecha_gasto", { ascending: false })
      .then(({ data, error: err }) => {
        if (!err) setGastos((data as GastoRuta[]) || [])
        setLoadingGastos(false)
      })
  }, [rutaId])

  useEffect(() => {
    fetchGastos()
  }, [fetchGastos])

  useEffect(() => {
    supabase
      .from("tipos_gastos")
      .select("id, nombre")
      .eq("estado", "activo")
      .then(({ data }) => setTiposGasto((data as TipoGastoOption[]) || []))
  }, [])

  useEffect(() => {
    supabase
      .from("rutas")
      .select("id, nombre_ruta")
      .order("nombre_ruta")
      .then(({ data }) => setRutas((data as RutaOption[]) || []))
  }, [])

  const handleVerPrestamo = (prestamo: PrestamoExtendido) => {
    setSelectedPrestamoId(prestamo.id)
    setModalOpen(true)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />
  }

  // Formatear fecha a DD-MM-YY
  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    return `${day}-${month}-${year}`
  }

  // Filtrar por estado, por cuotas vencidas y ordenar préstamos
  const prestamosFiltrados = useMemo(() => {
    let list = prestamos
    if (filtroEstado) list = list.filter((p) => (p.estado || "") === filtroEstado)
    if (filtroCuotasVencidas) list = list.filter((p) => (p.cuotasVencidas || 0) > 0)
    return list
  }, [prestamos, filtroEstado, filtroCuotasVencidas])

  const prestamosOrdenados = useMemo(() => {
    return [...prestamosFiltrados].sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'cliente': {
          const nombreA = a.cliente ? `${a.cliente.nombre} ${a.cliente.apellido}` : ''
          const nombreB = b.cliente ? `${b.cliente.nombre} ${b.cliente.apellido}` : ''
          comparison = nombreA.localeCompare(nombreB)
          break
        }
        case 'fecha': {
          const fechaA = a.fecha_desembolso ? new Date(a.fecha_desembolso).getTime() : 0
          const fechaB = b.fecha_desembolso ? new Date(b.fecha_desembolso).getTime() : 0
          comparison = fechaA - fechaB
          break
        }
        case 'prestamo':
          comparison = (a.monto_principal || 0) - (b.monto_principal || 0)
          break
        case 'seguro':
          comparison = (a.valor_seguro || 0) - (b.valor_seguro || 0)
          break
        case 'total':
          comparison = (a.monto_total || 0) - (b.monto_total || 0)
          break
        case 'saldo':
          comparison = (a.saldoPendiente || 0) - (b.saldoPendiente || 0)
          break
        case 'cuotas': {
          const progresoA = (a.cuotasPagadas || 0) / (a.cuotasTotales || 1)
          const progresoB = (b.cuotasPagadas || 0) / (b.cuotasTotales || 1)
          comparison = progresoA - progresoB
          break
        }
        case 'estado':
          comparison = (a.estado || '').localeCompare(b.estado || '')
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [prestamosFiltrados, sortColumn, sortDirection])

  // Paginación: 5 por página, totales sobre todos los registros
  const { paginatedData: prestamosPaginados, pagination, controls } = usePagination(
    prestamosOrdenados,
    5
  )

  // Calcular totales sobre los registros filtrados (no solo la página actual)
  const totales = prestamosFiltrados.reduce(
    (acc, prestamo) => ({
      prestamo: acc.prestamo + (prestamo.monto_principal || 0),
      seguro: acc.seguro + (prestamo.valor_seguro || 0),
      total: acc.total + (prestamo.monto_total || 0),
      saldo: acc.saldo + (prestamo.saldoPendiente || 0),
    }),
    { prestamo: 0, seguro: 0, total: 0, saldo: 0 }
  )

  // Paginación gastos: 5 por página, totales sobre todos
  const { paginatedData: gastosPaginados, pagination: paginationGastos, controls: controlsGastos } = usePagination(
    gastos,
    7
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Préstamos</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Préstamos</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">Error al cargar préstamos</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalGastos = gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
  const formatFechaGasto = (fecha: string | null) => {
    if (!fecha) return "-"
    return new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
  }
  const formatAprobacion = (estado: string | null) => {
    if (!estado) return "—"
    const map: Record<string, string> = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" }
    return map[estado] || estado
  }

  return (
    <Card className="min-h-[560px] flex flex-col">
      <CardContent className="p-0 pt-4 flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="prestamos" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto gap-0">
            <TabsTrigger value="prestamos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
              <CreditCard className="w-4 h-4 mr-2" />
              Préstamos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {prestamos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gastos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
              <Receipt className="w-4 h-4 mr-2" />
              Gastos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {gastos.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prestamos" className="mt-0 p-0 flex flex-col flex-1 min-h-[500px] data-[state=inactive]:hidden">
        {prestamos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[420px] text-center text-muted-foreground">
            <div>
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No hay préstamos en esta ruta</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-[500px]">
            {/* Filtros: estado y cuotas vencidas */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-2 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Estado:</span>
                <Select value={filtroEstado || "todos"} onValueChange={(v) => setFiltroEstado(v === "todos" ? "" : v)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filtroCuotasVencidas}
                  onCheckedChange={(checked) => setFiltroCuotasVencidas(!!checked)}
                />
                <span className="text-xs font-medium text-muted-foreground">Solo con cuotas vencidas</span>
              </label>
              {(filtroEstado || filtroCuotasVencidas) && (
                <span className="text-xs text-muted-foreground">
                  ({prestamosFiltrados.length} de {prestamos.length})
                </span>
              )}
            </div>
            {/* Encabezados */}
            <div className="grid grid-cols-[180px_75px_1fr_1fr_1fr_1fr_70px_70px_36px] gap-3 items-center text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2.5 border-b flex-shrink-0">
              <button 
                onClick={() => handleSort('cliente')}
                className="flex items-center hover:text-foreground transition-colors text-left"
              >
                Cliente {getSortIcon('cliente')}
              </button>
              <button 
                onClick={() => handleSort('fecha')}
                className="flex items-center justify-center hover:text-foreground transition-colors"
              >
                Fecha {getSortIcon('fecha')}
              </button>
              <button 
                onClick={() => handleSort('prestamo')}
                className="flex items-center justify-end hover:text-foreground transition-colors"
              >
                Préstamo {getSortIcon('prestamo')}
              </button>
              <button 
                onClick={() => handleSort('seguro')}
                className="flex items-center justify-end hover:text-foreground transition-colors"
              >
                Seguro {getSortIcon('seguro')}
              </button>
              <button 
                onClick={() => handleSort('total')}
                className="flex items-center justify-end hover:text-foreground transition-colors"
              >
                Total {getSortIcon('total')}
              </button>
              <button 
                onClick={() => handleSort('saldo')}
                className="flex items-center justify-end hover:text-foreground transition-colors"
              >
                Saldo {getSortIcon('saldo')}
              </button>
              <button 
                onClick={() => handleSort('cuotas')}
                className="flex items-center justify-center hover:text-foreground transition-colors"
              >
                Cuotas {getSortIcon('cuotas')}
              </button>
              <button 
                onClick={() => handleSort('estado')}
                className="flex items-center justify-center hover:text-foreground transition-colors"
              >
                Estado {getSortIcon('estado')}
              </button>
              <div></div>
            </div>

            {/* Filas (paginated) */}
            <div className="min-h-[320px] max-h-[400px] overflow-y-auto flex-shrink-0">
              {prestamosFiltrados.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  No hay préstamos con el estado seleccionado
                </div>
              ) : prestamosPaginados.map((prestamo) => {
                const cuotasVencidas = prestamo.cuotasVencidas || 0
                const tieneVencimiento = cuotasVencidas > 0

                return (
                  <div
                    key={prestamo.id}
                    className={`grid grid-cols-[180px_75px_1fr_1fr_1fr_1fr_70px_70px_36px] gap-3 items-center text-sm px-4 py-2.5 border-b hover:bg-muted/30 transition-colors cursor-pointer ${
                      tieneVencimiento ? 'bg-red-50/50' : ''
                    }`}
                    onClick={() => handleVerPrestamo(prestamo)}
                  >
                    {/* Cliente */}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tieneVencimiento ? 'bg-red-100' : 'bg-primary/10'
                        }`}>
                          {tieneVencimiento ? (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          ) : (
                            <User className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">
                            {prestamo.cliente 
                              ? `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`
                              : 'Cliente no encontrado'
                            }
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {prestamo.numero_prestamo}
                            </span>
                            {tieneVencimiento && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-3.5">
                                {cuotasVencidas} Vencida{cuotasVencidas > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">
                        {formatFecha(prestamo.fecha_desembolso)}
                      </span>
                    </div>

                    {/* Préstamo (monto_principal) */}
                    <div className="text-right">
                      <span className="font-medium text-primary">
                        ${(prestamo.monto_principal || 0).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {/* Seguro */}
                    <div className="text-right">
                      <span className="text-muted-foreground">
                        ${(prestamo.valor_seguro || 0).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {/* Monto Total */}
                    <div className="text-right">
                      <span className="font-medium">
                        ${(prestamo.monto_total || 0).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {/* Saldo */}
                    <div className="text-right">
                      <span className="font-semibold text-destructive">
                        ${(prestamo.saldoPendiente || 0).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {/* Progreso */}
                    <div className="text-center">
                      <div className="text-xs">
                        <span className="font-medium">
                          {prestamo.cuotasPagadas || 0}/{prestamo.cuotasTotales || 0}
                        </span>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="text-center">
                      {getEstadoBadge(prestamo.estado)}
                    </div>

                    {/* Acción */}
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerPrestamo(prestamo)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Fila de Totales (sobre registros filtrados) - oculta si no hay resultados */}
            {prestamosFiltrados.length > 0 && (
            <div className="grid grid-cols-[180px_75px_1fr_1fr_1fr_1fr_70px_70px_36px] gap-3 items-center text-sm px-4 py-3 bg-muted/70 border-t-2 border-primary/20 flex-shrink-0">
              <div className="font-semibold text-foreground">
                Totales ({prestamosFiltrados.length} registros)
              </div>
              <div></div>
              <div className="text-right">
                <span className="font-bold text-primary">
                  ${totales.prestamo.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-muted-foreground">
                  ${totales.seguro.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold">
                  ${totales.total.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-destructive">
                  ${totales.saldo.toLocaleString('es-CO')}
                </span>
              </div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            )}

            {/* Paginación */}
            {prestamosFiltrados.length > 0 && (
            <Pagination
              pagination={pagination}
              controls={controls}
              showItemsPerPage={false}
            />
            )}
          </div>
        )}
          </TabsContent>

          <TabsContent value="gastos" className="mt-0 p-0 flex flex-col flex-1 min-h-[500px] data-[state=inactive]:hidden">
            {loadingGastos ? (
              <div className="flex-1 flex items-center justify-center min-h-[420px]">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando gastos...</span>
              </div>
            ) : gastos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[420px] text-center text-muted-foreground">
                <div>
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No hay gastos registrados en esta ruta</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col min-h-[500px]">
                <div className="grid grid-cols-[90px_120px_1fr_100px_110px_56px] gap-3 items-center text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2.5 border-b flex-shrink-0">
                  <span>Fecha</span>
                  <span>Tipo</span>
                  <span>Descripción</span>
                  <span className="text-right">Monto</span>
                  <span className="text-center">Estado</span>
                  <span className="text-center">Acciones</span>
                </div>
                <div className="min-h-[320px] max-h-[400px] overflow-y-auto flex-shrink-0">
                  {gastosPaginados.map((g) => (
                    <div
                      key={g.id}
                      className="grid grid-cols-[90px_120px_1fr_100px_110px_56px] gap-3 items-center text-sm px-4 py-2.5 border-b hover:bg-muted/30"
                    >
                      <span className="text-muted-foreground">{formatFechaGasto(g.fecha_gasto)}</span>
                      <span>{g.tipo_gasto?.nombre ?? "—"}</span>
                      <span className="truncate" title={g.descripcion}>{g.descripcion || "—"}</span>
                      <span className="text-right font-medium">
                        ${(Number(g.monto) || 0).toLocaleString("es-CO")}
                      </span>
                      <div className="text-center">
                        <Badge
                          variant={
                            g.estado_aprobacion === "aprobado"
                              ? "default"
                              : g.estado_aprobacion === "rechazado"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {formatAprobacion(g.estado_aprobacion)}
                        </Badge>
                      </div>
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirEditar(g)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setGastoEliminar(g)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[90px_120px_1fr_100px_110px_56px] gap-3 items-center text-sm px-4 py-3 bg-muted/70 border-t-2 border-primary/20 flex-shrink-0">
                  <span className="font-semibold">Totales ({gastos.length} registros)</span>
                  <span></span>
                  <span></span>
                  <span className="text-right font-bold">
                    ${totalGastos.toLocaleString("es-CO")}
                  </span>
                  <span></span>
                  <span></span>
                </div>
                <Pagination
                  pagination={paginationGastos}
                  controls={controlsGastos}
                  showItemsPerPage={false}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal de Detalle del Préstamo */}
      <PrestamoDetalleModal
        prestamoId={selectedPrestamoId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRutaChanged={refetchPrestamos}
      />

      {/* Modal Editar Gasto */}
      <Dialog open={!!gastoEditar} onOpenChange={(open) => !open && setGastoEditar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Ruta</Label>
              <Select value={editForm.ruta_id} onValueChange={(v) => setEditForm((f) => ({ ...f, ruta_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ruta" />
                </SelectTrigger>
                <SelectContent>
                  {rutas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre_ruta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo de gasto</Label>
              <Select value={editForm.tipo_gasto_id} onValueChange={(v) => setEditForm((f) => ({ ...f, tipo_gasto_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposGasto.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={editForm.monto}
                onChange={(e) => setEditForm((f) => ({ ...f, monto: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={editForm.fecha_gasto}
                onChange={(e) => setEditForm((f) => ({ ...f, fecha_gasto: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea
                value={editForm.descripcion}
                onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Estado de aprobación</Label>
              <Select value={editForm.estado_aprobacion} onValueChange={(v) => setEditForm((f) => ({ ...f, estado_aprobacion: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGastoEditar(null)}>Cancelar</Button>
            <Button onClick={guardarGasto} disabled={guardandoGasto}>
              {guardandoGasto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar gasto */}
      <AlertDialog open={!!gastoEliminar} onOpenChange={(open) => !open && setGastoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el gasto de {gastoEliminar?.tipo_gasto?.nombre ?? "—"} por ${gastoEliminar ? Number(gastoEliminar.monto).toLocaleString("es-CO") : ""}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminarGasto} disabled={eliminandoGasto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {eliminandoGasto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
