import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrestamoEstadisticas as EstadisticasType } from "@/types/prestamo"
import { DollarSign, TrendingUp, Clock, Calendar } from "lucide-react"

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
      descripcion: "Capital prestado"
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
      titulo: "Vencidos",
      valor: estadisticas.prestamosVencidos,
      icono: Clock,
      color: "bg-red-100 text-red-800",
      iconColor: "text-red-600",
      descripcion: "Cuotas vencidas"
    },
    {
      titulo: "Por Vencer",
      valor: `$${estadisticas.montoPorVencer.toLocaleString('es-CO')}`,
      icono: Calendar,
      color: "bg-yellow-100 text-yellow-800",
      iconColor: "text-yellow-600",
      descripcion: "Próximos 30 días"
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
