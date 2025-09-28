import { KPICard } from "@/components/dashboard/KPICard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Percent,
  Wallet
} from "lucide-react"

interface RutaEstadisticasProps {
  estadisticas: any
  loading?: boolean
  isGeneral?: boolean // Para distinguir entre estadísticas de ruta individual vs generales
}

export function RutaEstadisticas({ estadisticas, loading, isGeneral = false }: RutaEstadisticasProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    )
  }

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Rutas"
        value={estadisticas.totalRutas}
        icon={MapPin}
        description={`${estadisticas.rutasActivas} activas`}
        variant="default"
      />
      
      <KPICard
        title="Cartera Total"
        value={formatCurrency(estadisticas.carteraTotal)}
        icon={DollarSign}
        description={`Saldo: ${formatCurrency(estadisticas.saldoPendiente)}`}
        variant="success"
      />
      
      <KPICard
        title="Caja Disponible"
        value={formatCurrency(estadisticas.caja || 0)}
        icon={Wallet}
        description="Dinero en efectivo"
        variant={estadisticas.caja >= 0 ? "success" : "destructive"}
      />
      
      <KPICard
        title="Seguros Recogidos"
        value={formatCurrency(estadisticas.segurosRecogidos || 0)}
        icon={DollarSign}
        description="Total recaudado"
        variant="warning"
      />
    </div>
  )
}
