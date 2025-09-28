import { MoreVertical, Edit, MapPin, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { RutaExtendida } from '../../types/ruta'

interface RutaCardProps {
  ruta: RutaExtendida
  onEdit?: (ruta: RutaExtendida) => void
  onViewDetails?: (ruta: RutaExtendida) => void
}

export function RutaCard({ ruta, onEdit, onViewDetails }: RutaCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activa</Badge>
      case 'inactiva':
        return <Badge variant="secondary">Inactiva</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getTasaColor = (tasa: number) => {
    if (tasa >= 90) return 'text-green-600'
    if (tasa >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {ruta.nombre_ruta}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {ruta.zona_geografica || 'Sin zona definida'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getEstadoBadge(ruta.estado)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(ruta)}>
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(ruta)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {ruta.descripcion && (
          <p className="text-sm text-muted-foreground mt-2">
            {ruta.descripcion}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cartera Total</span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(ruta.estadisticas?.montoTotal || 0)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Préstamos</span>
            </div>
            <p className="text-lg font-semibold">
              {ruta.estadisticas?.totalPrestamos || 0}
            </p>
          </div>
        </div>

        {/* Indicadores de rendimiento */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Recuperación</span>
            </div>
            <p className={`text-sm font-semibold ${getTasaColor(ruta.estadisticas?.tasaRecuperacion || 0)}`}>
              {(ruta.estadisticas?.tasaRecuperacion || 0).toFixed(1)}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Vencida</span>
            </div>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(ruta.estadisticas?.carteraVencida || 0)}
            </p>
          </div>
        </div>

        {/* Saldo pendiente */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
            <span className="text-sm font-semibold">
              {formatCurrency(ruta.estadisticas?.saldoPendiente || 0)}
            </span>
          </div>
        </div>

        {/* Cobradores asignados */}
        {ruta.cobradores && ruta.cobradores.length > 0 && (
          <div className="pt-2 border-t">
            <span className="text-xs text-muted-foreground">Cobradores:</span>
            <div className="mt-1 space-y-1">
              {ruta.cobradores.slice(0, 2).map((cobrador) => (
                <p key={cobrador.id} className="text-sm">
                  {cobrador.nombre} {cobrador.apellido}
                </p>
              ))}
              {ruta.cobradores.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{ruta.cobradores.length - 2} más
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}