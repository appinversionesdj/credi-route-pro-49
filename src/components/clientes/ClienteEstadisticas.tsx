import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClienteEstadisticas as EstadisticasType } from "@/types/cliente"
import { Users, UserCheck, UserX, DollarSign } from "lucide-react"

interface ClienteEstadisticasProps {
  estadisticas: EstadisticasType | null
  loading?: boolean
}

export default function ClienteEstadisticas({ estadisticas, loading }: ClienteEstadisticasProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-100 rounded-lg animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!estadisticas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
        </CardContent>
      </Card>
    )
  }

  const estadisticasItems = [
    {
      titulo: "Total Clientes",
      valor: estadisticas.totalClientes,
      icono: Users,
      color: "bg-blue-100 text-blue-800",
      iconColor: "text-blue-600"
    },
    {
      titulo: "Clientes Activos",
      valor: estadisticas.clientesActivos,
      icono: UserCheck,
      color: "bg-green-100 text-green-800",
      iconColor: "text-green-600"
    },
    {
      titulo: "Clientes Morosos",
      valor: estadisticas.clientesMorosos,
      icono: UserX,
      color: "bg-red-100 text-red-800",
      iconColor: "text-red-600"
    },
    {
      titulo: "Deuda Total",
      valor: `$${estadisticas.deudaTotal.toLocaleString('es-CO')}`,
      icono: DollarSign,
      color: "bg-yellow-100 text-yellow-800",
      iconColor: "text-yellow-600"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Resumen de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {estadisticasItems.map((item, index) => {
            const IconComponent = item.icono
            return (
              <div key={index} className={`text-center p-4 rounded-lg ${item.color}`}>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className="text-2xl font-bold">{item.valor}</p>
                <p className="text-sm opacity-80">{item.titulo}</p>
              </div>
            )
          })}
        </div>
        
        {estadisticas.prestamosActivos > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Préstamos Activos:</span>
              <span className="font-semibold">{estadisticas.prestamosActivos}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
