import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRuta } from "@/hooks/useRutas"
import { KPICard } from "@/components/dashboard/KPICard"
import { CajaDesglose } from "@/components/rutas/CajaDesglose"
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  DollarSign,
  Target,
  Users,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Percent,
  Wallet
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

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

  const getEstadoColor = (estado: string | null) => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalle de ruta...</p>
        </div>
      </div>
    )
  }

  if (error || !ruta) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Error al cargar la ruta</p>
        <p className="text-muted-foreground mb-4">No se pudo obtener la información de la ruta</p>
        <Button onClick={() => navigate("/rutas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Rutas
        </Button>
      </div>
    )
  }

  // Datos para gráficos
  const estadoPrestamos = [
    { name: 'Activos', value: ruta.estadisticas.prestamosActivos, color: '#22C55E' },
    { name: 'Vencidos', value: ruta.estadisticas.prestamosVencidos, color: '#EF4444' },
    { name: 'Pagados', value: ruta.estadisticas.prestamosPagados, color: '#3B82F6' },
  ].filter(item => item.value > 0)

  const datosComparacion = [
    { 
      nombre: 'Prestado', 
      valor: ruta.estadisticas.totalPrestado,
      color: 'hsl(var(--primary))'
    },
    { 
      nombre: 'Cobrado', 
      valor: ruta.estadisticas.totalCobrado,
      color: 'hsl(var(--chart-2))'
    },
    { 
      nombre: 'Cartera', 
      valor: ruta.estadisticas.carteraTotal,
      color: 'hsl(var(--chart-3))'
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/30 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/rutas")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{ruta.nombre_ruta}</h1>
              <Badge className={getEstadoColor(ruta.estado)}>
                {ruta.estado}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <p>{ruta.zona_geografica || 'Sin zona asignada'}</p>
              <span className="mx-2">•</span>
              <p className="text-sm">Creada el {formatDate(ruta.fecha_creacion || '')}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            Ver Préstamos
          </Button>
          <Button>
            <User className="w-4 h-4 mr-2" />
            Gestionar Cobrador
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cartera Total"
          value={formatCurrency(ruta.estadisticas.carteraTotal)}
          icon={DollarSign}
          description="Saldo pendiente"
          variant="success"
        />
        
        <KPICard
          title="Caja Actual"
          value={formatCurrency(ruta.estadisticas.caja || 0)}
          icon={Wallet}
          description={`Inversión: ${formatCurrency(ruta.inversion_ruta || 0)}`}
          variant={ruta.estadisticas.caja >= 0 ? "default" : "destructive"}
        />
        
        <KPICard
          title="Préstamos Activos"
          value={ruta.estadisticas.prestamosActivos}
          icon={CreditCard}
          description={`Total: ${ruta.estadisticas.totalPrestamos}`}
        />
        
        <KPICard
          title="Eficiencia de Cobro"
          value={formatPercent(ruta.estadisticas.eficienciaCobro)}
          icon={TrendingUp}
          description="Tasa de recaudo"
          variant="success"
        />
      </div>

      {/* Sección Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose de Caja - Ocupa 1 columna */}
        <div className="lg:col-span-1">
          <CajaDesglose
            inversion={ruta.inversion_ruta || 0}
            prestado={ruta.estadisticas.totalPrestado}
            seguros={ruta.estadisticas.segurosRecogidos}
            cobrados={ruta.estadisticas.totalCobrado}
            cartera={ruta.estadisticas.carteraTotal}
          />
        </div>

        {/* Gráfico de Distribución - Ocupa 2 columnas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribución Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosComparacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), ""]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Préstamos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Estado de Préstamos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estadoPrestamos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {estadoPrestamos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {ruta.estadisticas.prestamosActivos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Vencidos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {ruta.estadisticas.prestamosVencidos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Pagados</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {ruta.estadisticas.prestamosPagados}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Rendimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Métricas de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Eficiencia de Cobro */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  Eficiencia de Cobro
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatPercent(ruta.estadisticas.eficienciaCobro)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{ width: `${Math.min(ruta.estadisticas.eficienciaCobro, 100)}%` }}
                />
              </div>
            </div>

            {/* Rentabilidad */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Rentabilidad
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPercent(ruta.estadisticas.rentabilidad)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${Math.min(ruta.estadisticas.rentabilidad, 100)}%` }}
                />
              </div>
            </div>

            {/* Datos adicionales */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-orange-50">
                <Shield className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Seguros</p>
                <p className="text-sm font-bold text-orange-600">
                  {formatCurrency(ruta.estadisticas.segurosRecogidos || 0)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50">
                <Wallet className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Cuota Promedio</p>
                <p className="text-sm font-bold text-purple-600">
                  {formatCurrency(ruta.estadisticas.promedioCuota)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del Cobrador y Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cobrador Asignado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Cobrador Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ruta.cobrador ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {ruta.cobrador.nombre} {ruta.cobrador.apellido}
                  </h3>
                  {ruta.cobrador.telefono && (
                    <p className="text-sm text-muted-foreground">
                      📞 {ruta.cobrador.telefono}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      Ver Historial
                    </Button>
                    <Button size="sm" variant="outline">
                      Contactar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No hay cobrador asignado a esta ruta</p>
                <Button size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Asignar Cobrador
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Resumen de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Activos</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {ruta.estadisticas.clientesActivos}
                </p>
                <p className="text-xs text-green-700 mt-1">Clientes al día</p>
              </div>

              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Morosos</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {ruta.estadisticas.clientesMorosos}
                </p>
                <p className="text-xs text-red-700 mt-1">Con pagos pendientes</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total de Clientes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ruta.estadisticas.clientesActivos + ruta.estadisticas.clientesMorosos}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Ver Listado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descripción */}
      {ruta.descripcion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Información Adicional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{ruta.descripcion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
