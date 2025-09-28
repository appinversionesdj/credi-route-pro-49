import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { RutaExtendida } from "@/types/ruta"
import { 
  MapPin, 
  User, 
  DollarSign, 
  TrendingUp, 
  MoreVertical,
  Eye,
  Edit,
  Users,
  Calendar,
  Target
} from "lucide-react"

interface RutaCardProps {
  ruta: RutaExtendida
  onView?: (ruta: RutaExtendida) => void
  onEdit?: (ruta: RutaExtendida) => void
}

export function RutaCard({ ruta, onView, onEdit }: RutaCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800'
      case 'inactiva':
        return 'bg-gray-100 text-gray-800'
      case 'suspendida':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoBaseColor = (estado: string) => {
    switch (estado) {
      case 'en_ruta':
        return 'bg-blue-100 text-blue-800'
      case 'finalizado':
        return 'bg-green-100 text-green-800'
      case 'conciliado':
        return 'bg-purple-100 text-purple-800'
      case 'auditoria':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{ruta.nombre_ruta}</CardTitle>
            {ruta.zona_geografica && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {ruta.zona_geografica}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getEstadoColor(ruta.estado)}>
              {ruta.estado}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(ruta)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(ruta)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del Cobrador */}
        {ruta.cobrador && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Cobrador:</span>
            <span className="font-medium">
              {ruta.cobrador.nombre} {ruta.cobrador.apellido}
            </span>
          </div>
        )}

        {/* Base Diaria */}
        {ruta.baseDiaria && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base Diaria:</span>
              <Badge className={getEstadoBaseColor(ruta.baseDiaria.estado)}>
                {ruta.baseDiaria.estado}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Entregado:</span>
                <div className="font-medium">{formatCurrency(ruta.baseDiaria.monto_base_entregado)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Devuelto:</span>
                <div className="font-medium">{formatCurrency(ruta.baseDiaria.monto_devuelto)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              Cartera
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(ruta.estadisticas.carteraTotal)}
            </div>
            <div className="text-xs text-muted-foreground">
              {ruta.estadisticas.prestamosActivos} préstamos activos
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              Rentabilidad
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatPercent(ruta.estadisticas.rentabilidad)}
            </div>
            <div className="text-xs text-muted-foreground">
              Eficiencia: {formatPercent(ruta.estadisticas.eficienciaCobro)}
            </div>
          </div>
        </div>

        {/* Indicadores Adicionales */}
        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Target className="h-3 w-3 mr-1" />
              Total
            </div>
            <div className="font-semibold">{ruta.estadisticas.totalPrestamos}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Users className="h-3 w-3 mr-1" />
              Clientes
            </div>
            <div className="font-semibold">{ruta.estadisticas.clientesActivos}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              Por Vencer
            </div>
            <div className="font-semibold text-orange-600">
              {formatCurrency(ruta.estadisticas.montoPorVencer)}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {ruta.descripcion && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {ruta.descripcion}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
