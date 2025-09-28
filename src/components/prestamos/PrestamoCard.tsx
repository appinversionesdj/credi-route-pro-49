import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Archive
} from "lucide-react"
import { PrestamoExtendido } from "@/types/prestamo"

interface PrestamoCardProps {
  prestamo: PrestamoExtendido
  onInactivar?: (id: string) => void
  onView?: (prestamo: PrestamoExtendido) => void
}

function getEstadoBadge(estado: string | null) {
  switch (estado) {
    case "activo":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    case "vencido":
      return <Badge variant="destructive">Vencido</Badge>
    case "pagado":
      return <Badge className="bg-gray-100 text-gray-600">Pagado</Badge>
    case "cancelado":
      return <Badge variant="outline" className="bg-red-100 text-red-600">Cancelado</Badge>
    default:
      return <Badge variant="outline">{estado || "Sin estado"}</Badge>
  }
}

export default function PrestamoCard({ prestamo, onInactivar, onView }: PrestamoCardProps) {
  const handleCardClick = () => {
    if (onView) {
      onView(prestamo)
    }
  }

  const calcularProgreso = (pagadas: number, totales: number) => {
    return totales > 0 ? (pagadas / totales) * 100 : 0
  }

  const progreso = calcularProgreso(prestamo.cuotasPagadas || 0, prestamo.cuotasTotales || 0)

  return (
    <div className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-200 py-3 px-6" onClick={handleCardClick}>
      <div className="grid grid-cols-12 gap-4 items-center text-sm">
        {/* Cliente */}
        <div className="col-span-3 pl-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {prestamo.cliente ? 
                  `${prestamo.cliente.nombre} ${prestamo.cliente.apellido}` : 
                  'Cliente no encontrado'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {prestamo.numero_prestamo} • CC: {prestamo.cliente?.cedula?.toLocaleString('es-CO') || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Monto Total */}
        <div className="col-span-1 text-right pr-2">
          <div className="font-medium">
            ${(prestamo.monto_total || 0).toLocaleString('es-CO')}
          </div>
        </div>

        {/* Saldo */}
        <div className="col-span-1 text-right pr-2">
          <div className="font-semibold text-destructive">
            ${(prestamo.saldoPendiente || 0).toLocaleString('es-CO')}
          </div>
        </div>

        {/* Cuota */}
        <div className="col-span-1 text-right pr-2">
          <div className="font-medium">
            ${(prestamo.valor_cuota || 0).toLocaleString('es-CO')}
          </div>
        </div>

        {/* Progreso Cuotas */}
        <div className="col-span-2 text-center">
          <div className="text-sm">
            <span className="font-medium">
              {prestamo.cuotasPagadas || 0}/{prestamo.cuotasTotales || 0}
            </span>
            <span className="text-muted-foreground ml-1">cuotas</span>
          </div>
          <div className="text-xs text-destructive font-medium">
            {(prestamo.cuotasTotales || 0) - (prestamo.cuotasPagadas || 0)} restantes
          </div>
        </div>

        {/* Ruta */}
        <div className="col-span-1 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{prestamo.ruta?.nombre_ruta || 'N/A'}</span>
          </div>
        </div>

        {/* Próxima Fecha */}
        <div className="col-span-1 text-center">
          <div className="text-xs text-muted-foreground">
            {prestamo.proximaFecha ? 
              new Date(prestamo.proximaFecha).toLocaleDateString('es-CO') : 
              'N/A'
            }
          </div>
        </div>

        {/* Estado */}
        <div className="col-span-1 text-center">
          {getEstadoBadge(prestamo.estado)}
        </div>

        {/* Acciones */}
        <div className="col-span-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                if (onView) {
                  onView(prestamo)
                }
              }}
              title="Ver detalles"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                  title="Más opciones"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onInactivar && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onInactivar(prestamo.id)
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Archive className="mr-2 h-3 w-3" />
                    Inactivar Préstamo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
