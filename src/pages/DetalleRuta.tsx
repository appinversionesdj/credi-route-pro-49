import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRuta } from "@/hooks/useRutas"
import { KPICard } from "@/components/dashboard/KPICard"
import { CajaDesglose } from "@/components/rutas/CajaDesglose"
import { PrestamosRutaTable } from "@/components/rutas/PrestamosRutaTable"
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  DollarSign,
  Target,
  TrendingUp,
  CreditCard,
  AlertTriangle,
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
  Legend
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

  const formatDateRange = (fechaInicio: string, fechaFin: string) => {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    const diaInicio = inicio.getDate()
    const diaFin = fin.getDate()
    const mesInicio = inicio.toLocaleDateString('es-CO', { month: 'short' })
    const mesFin = fin.toLocaleDateString('es-CO', { month: 'short' })
    
    if (mesInicio === mesFin) {
      return `${diaInicio} - ${diaFin} ${mesInicio}`
    } else {
      return `${diaInicio} ${mesInicio} - ${diaFin} ${mesFin}`
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateRange(data.fechaInicio, data.fechaFin)}
          </p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium">{entry.name}:</span>
              </div>
              <span className="text-xs font-bold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
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

  // Datos de comparación por semana
  const datosComparacion = ruta.estadisticas.datosPorSemana || []

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
            gastos={ruta.estadisticas.totalGastos}
          />
        </div>

        {/* Gráfico de Distribución - Ocupa 2 columnas */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribución Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={datosComparacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="semana" 
                  tick={{ fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                />
                <Bar dataKey="prestado" fill="#EF4444" name="Prestado" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cobrado" fill="#22C55E" name="Cobrado" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gastos" fill="#F59E0B" name="Gastos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Préstamos de la Ruta */}
      <PrestamosRutaTable rutaId={id || ""} />

    </div>
  )
}
