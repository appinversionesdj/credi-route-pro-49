import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrestamoEstadisticas as EstadisticasType } from "@/types/prestamo"
import { DollarSign, TrendingUp, AlertCircle, Percent } from "lucide-react"

interface PrestamoEstadisticasProps {
  estadisticas: EstadisticasType | null
  loading?: boolean
}

export default function PrestamoEstadisticas({ estadisticas, loading }: PrestamoEstadisticasProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const estadisticasItems = [
    {
      titulo: "Cartera Total",
      valor: `$${estadisticas.carteraTotal.toLocaleString('es-CO')}`,
      icono: DollarSign,
      color: "bg-blue-100 text-blue-800",
      iconColor: "text-blue-600",
      descripcion: "Saldo pendiente"
    },
    {
      titulo: "Activos",
      valor: estadisticas.prestamosActivos,
      icono: TrendingUp,
      color: "bg-green-100 text-green-800",
      iconColor: "text-green-600",
      descripcion: "Préstamos vigentes"
    },
    {
      titulo: "Con Mora",
      valor: estadisticas.prestamosVencidos,
      icono: AlertCircle,
      color: "bg-red-100 text-red-800",
      iconColor: "text-red-600",
      descripcion: "Préstamos vencidos"
    },
    {
      titulo: "Tasa de Morosidad",
      valor: `${estadisticas.tasaMorosidad.toFixed(1)}%`,
      icono: Percent,
      color: estadisticas.tasaMorosidad > 15 
        ? "bg-red-100 text-red-800" 
        : estadisticas.tasaMorosidad > 8
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-100 text-green-800",
      iconColor: estadisticas.tasaMorosidad > 15 
        ? "text-red-600" 
        : estadisticas.tasaMorosidad > 8
        ? "text-yellow-600"
        : "text-green-600",
      descripcion: estadisticas.tasaMorosidad > 15 
        ? "Nivel crítico" 
        : estadisticas.tasaMorosidad > 8
        ? "Nivel moderado"
        : "Nivel saludable"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {estadisticasItems.map((item, index) => {
          const IconComponent = item.icono
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                    <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.titulo}</p>
                    <p className="text-xl font-bold">{item.valor}</p>
                    <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
