import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CreditCard, 
  User, 
  Eye, 
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { usePrestamos } from "@/hooks/usePrestamos"
import { PrestamoExtendido } from "@/types/prestamo"
import { PrestamoDetalleModal } from "@/components/prestamos/PrestamoDetalleModal"

interface PrestamosRutaTableProps {
  rutaId: string
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
  const { prestamos, loading, error } = usePrestamos({ ruta_id: rutaId })
  const [sortColumn, setSortColumn] = useState<SortColumn>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedPrestamoId, setSelectedPrestamoId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

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

  // Ordenar préstamos
  const prestamosOrdenados = useMemo(() => {
    return [...prestamos].sort((a, b) => {
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
  }, [prestamos, sortColumn, sortDirection])

  // Calcular totales
  const totales = prestamos.reduce(
    (acc, prestamo) => ({
      prestamo: acc.prestamo + (prestamo.monto_principal || 0),
      seguro: acc.seguro + (prestamo.valor_seguro || 0),
      total: acc.total + (prestamo.monto_total || 0),
      saldo: acc.saldo + (prestamo.saldoPendiente || 0),
    }),
    { prestamo: 0, seguro: 0, total: 0, saldo: 0 }
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

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Préstamos</span>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {prestamos.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {prestamos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No hay préstamos en esta ruta</p>
          </div>
        ) : (
          <>
            {/* Encabezados */}
            <div className="grid grid-cols-[180px_75px_1fr_1fr_1fr_1fr_70px_70px_36px] gap-3 items-center text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2.5 border-b">
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

            {/* Filas */}
            <div className="max-h-[400px] overflow-y-auto">
              {prestamosOrdenados.map((prestamo) => {
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

            {/* Fila de Totales */}
            <div className="grid grid-cols-[180px_75px_1fr_1fr_1fr_1fr_70px_70px_36px] gap-3 items-center text-sm px-4 py-3 bg-muted/70 border-t-2 border-primary/20">
              <div className="font-semibold text-foreground">
                Totales ({prestamos.length})
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
          </>
        )}
      </CardContent>

      {/* Modal de Detalle del Préstamo */}
      <PrestamoDetalleModal
        prestamoId={selectedPrestamoId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Card>
  )
}
