import { DollarSign, MapPin, Users, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { RutaEstadisticas as EstadisticasType } from '../../types/ruta'

interface RutaEstadisticasProps {
  estadisticas: EstadisticasType
}

export function RutaEstadisticas({ estadisticas }: RutaEstadisticasProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const kpis = [
    {
      title: 'Total de Rutas',
      value: estadisticas.totalRutas.toString(),
      icon: MapPin,
      description: `${estadisticas.rutasActivas} activas, ${estadisticas.rutasInactivas} inactivas`,
      color: 'text-blue-600'
    },
    {
      title: 'Cartera Total',
      value: formatCurrency(estadisticas.totalCartera),
      icon: DollarSign,
      description: 'Valor total de préstamos',
      color: 'text-green-600'
    },
    {
      title: 'Saldo Pendiente',
      value: formatCurrency(estadisticas.saldoPendiente),
      icon: Target,
      description: 'Por cobrar',
      color: 'text-yellow-600'
    },
    {
      title: 'Cartera Vencida',
      value: formatCurrency(estadisticas.carteraVencida),
      icon: AlertTriangle,
      description: 'Requiere atención',
      color: 'text-red-600'
    },
    {
      title: 'Tasa de Recuperación',
      value: `${estadisticas.tasaRecuperacionPromedio.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Promedio general',
      color: estadisticas.tasaRecuperacionPromedio >= 90 ? 'text-green-600' : 
             estadisticas.tasaRecuperacionPromedio >= 70 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      title: 'Cobradores',
      value: estadisticas.cobradores.toString(),
      icon: Users,
      description: 'Asignados a rutas',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}