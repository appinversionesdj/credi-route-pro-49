import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConciliacionExtendida } from '@/types/conciliacion'
import { 
  Calendar, 
  User, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Check,
  AlertTriangle,
  Eye
} from 'lucide-react'

interface ConciliacionCardProps {
  conciliacion: ConciliacionExtendida
  onView?: (id: string) => void
}

export function ConciliacionCard({ conciliacion, onView }: ConciliacionCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEstadoBadge = () => {
    const estados = {
      cuadrado: { color: 'bg-green-100 text-green-800', label: 'Cuadrado', icon: Check },
      sobrante: { color: 'bg-blue-100 text-blue-800', label: 'Sobrante', icon: TrendingUp },
      faltante: { color: 'bg-red-100 text-red-800', label: 'Faltante', icon: TrendingDown },
      auditoria: { color: 'bg-yellow-100 text-yellow-800', label: 'Auditoría', icon: AlertTriangle },
      pendiente: { color: 'bg-gray-100 text-gray-800', label: 'Pendiente', icon: AlertTriangle }
    }

    const estado = estados[conciliacion.estado_conciliacion as keyof typeof estados] || estados.pendiente
    const Icon = estado.icon

    return (
      <Badge className={`${estado.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {estado.label}
      </Badge>
    )
  }

  const getDiferenciaColor = () => {
    if (conciliacion.diferencia === 0) return 'text-green-600'
    if (conciliacion.diferencia > 0) return 'text-blue-600'
    return 'text-red-600'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {conciliacion.cobrador?.nombre} {conciliacion.cobrador?.apellido}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{conciliacion.ruta?.nombre_ruta}</span>
            </div>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fecha */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">
            {conciliacion.base_diaria?.fecha && formatDate(conciliacion.base_diaria.fecha)}
          </span>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Base Entregada</p>
            <p className="text-sm font-semibold">
              {formatCurrency(conciliacion.monto_base_entregado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Devuelto</p>
            <p className="text-sm font-semibold">
              {formatCurrency(conciliacion.dinero_efectivamente_devuelto)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cobros</p>
            <p className="text-sm font-semibold text-green-600">
              +{formatCurrency(conciliacion.total_cobros_realizados)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seguros</p>
            <p className="text-sm font-semibold text-green-600">
              +{formatCurrency(conciliacion.total_seguros)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Préstamos</p>
            <p className="text-sm font-semibold text-red-600">
              -{formatCurrency(conciliacion.total_prestamos_nuevos)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-sm font-semibold text-red-600">
              -{formatCurrency(conciliacion.total_gastos_aprobados)}
            </p>
          </div>
        </div>

        {/* Diferencia */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Diferencia:</span>
            <span className={`text-lg font-bold ${getDiferenciaColor()}`}>
              {conciliacion.diferencia > 0 && '+'}
              {formatCurrency(conciliacion.diferencia)}
            </span>
          </div>
        </div>

        {/* Persona que entrega */}
        {conciliacion.nombre_persona_entrega && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Entregado por: {conciliacion.nombre_persona_entrega}</span>
          </div>
        )}

        {/* Botón de acción */}
        {onView && (
          <Button
            onClick={() => onView(conciliacion.id)}
            variant="outline"
            className="w-full mt-2"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

