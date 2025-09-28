import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRuta } from "@/hooks/useRutas"
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Wallet,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DetalleRuta() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ruta, loading, error } = useRuta(id || "")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando ruta...</p>
        </div>
      </div>
    )
  }

  if (error || !ruta) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4 text-sm">Error al cargar la ruta</p>
        <Button onClick={() => navigate("/rutas")} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Rutas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/rutas")} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{ruta.nombre_ruta}</h1>
            <p className="text-sm text-muted-foreground">
              {ruta.zona_geografica || 'Sin zona asignada'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getEstadoColor(ruta.estado)}>
            {ruta.estado}
          </Badge>
        </div>
      </div>

      {/* Información de la Ruta */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Información de la Ruta</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{ruta.nombre_ruta}</p>
          </div>
          {ruta.zona_geografica && (
            <div>
              <p className="text-muted-foreground">Zona</p>
              <p className="font-medium">{ruta.zona_geografica}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Estado</p>
            <p className="font-medium">{ruta.estado}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Creada</p>
            <p className="font-medium">{formatDate(ruta.fecha_creacion)}</p>
          </div>
        </div>
      </Card>

      {/* Cobrador Asignado */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Cobrador Asignado</h3>
        </div>
        {ruta.cobrador ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Nombre</p>
              <p className="font-medium">
                {ruta.cobrador.nombre} {ruta.cobrador.apellido}
              </p>
            </div>
            {ruta.cobrador.telefono && (
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{ruta.cobrador.telefono}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">No hay cobrador asignado</p>
          </div>
        )}
      </Card>

      {/* Información Financiera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Financiero</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Cartera Total</p>
              <p className="font-semibold text-sm text-green-600">{formatCurrency(ruta.estadisticas.carteraTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Caja</p>
              <p className={cn(
                "font-semibold text-sm",
                ruta.estadisticas.caja >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(ruta.estadisticas.caja || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Seguros</p>
              <p className="font-semibold text-sm text-orange-600">{formatCurrency(ruta.estadisticas.segurosRecogidos || 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Por Vencer</p>
              <p className="font-semibold text-sm">{formatCurrency(ruta.estadisticas.montoPorVencer)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Rendimiento</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Eficiencia</span>
              <span className="font-medium">{formatPercent(ruta.estadisticas.eficienciaCobro)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-green-500"
                style={{ width: `${Math.min(ruta.estadisticas.eficienciaCobro, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Rentabilidad</span>
              <span className="font-medium">{formatPercent(ruta.estadisticas.rentabilidad)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${Math.min(ruta.estadisticas.rentabilidad, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Resumen de Préstamos */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Resumen de Préstamos</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {ruta.estadisticas.prestamosActivos}
            </div>
            <div className="text-muted-foreground">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {ruta.estadisticas.prestamosVencidos}
            </div>
            <div className="text-muted-foreground">Vencidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {ruta.estadisticas.prestamosPagados}
            </div>
            <div className="text-muted-foreground">Pagados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {ruta.estadisticas.totalPrestamos}
            </div>
            <div className="text-muted-foreground">Total</div>
          </div>
        </div>
      </Card>

      {/* Clientes */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Clientes</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {ruta.estadisticas.clientesActivos}
            </div>
            <div className="text-muted-foreground">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {ruta.estadisticas.clientesMorosos}
            </div>
            <div className="text-muted-foreground">Morosos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(ruta.estadisticas.promedioCuota)}
            </div>
            <div className="text-muted-foreground">Cuota Promedio</div>
          </div>
        </div>
      </Card>

      {/* Descripción */}
      {ruta.descripcion && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Descripción</h3>
          </div>
          <p className="text-sm text-muted-foreground">{ruta.descripcion}</p>
        </Card>
      )}
    </div>
  )
}