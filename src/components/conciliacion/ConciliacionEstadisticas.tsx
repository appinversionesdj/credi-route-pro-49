import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadisticasConciliacion } from '@/types/conciliacion'
import { 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  BarChart3
} from 'lucide-react'

interface ConciliacionEstadisticasProps {
  estadisticas: EstadisticasConciliacion
}

export function ConciliacionEstadisticas({ estadisticas }: ConciliacionEstadisticasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const stats = [
    {
      title: 'Total Conciliaciones',
      value: estadisticas.total_conciliaciones,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Cuadradas',
      value: estadisticas.total_cuadradas,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Sobrantes',
      value: estadisticas.total_sobrantes,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Faltantes',
      value: estadisticas.total_faltantes,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Pendientes',
      value: estadisticas.total_pendientes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Estadísticas en cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-full`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen financiero */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Diferencia Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              estadisticas.total_diferencia === 0 ? 'text-green-600' :
              estadisticas.total_diferencia > 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {formatCurrency(estadisticas.total_diferencia)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Suma de todas las diferencias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Promedio Diferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              estadisticas.promedio_diferencia === 0 ? 'text-green-600' :
              estadisticas.promedio_diferencia > 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {formatCurrency(estadisticas.promedio_diferencia)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por conciliación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Mayor Sobrante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(estadisticas.mayor_sobrante)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Máximo positivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Mayor Faltante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.abs(estadisticas.mayor_faltante))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Máximo negativo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

