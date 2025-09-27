import { KPICard } from "@/components/dashboard/KPICard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Calendar
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"

// Mock data
const kpiData = {
  carteraTotal: "₡2,450,000",
  cobrosDia: "₡185,400",
  prestamosActivos: 156,
  morosidad: "12.3%"
}

const cobrosDiarios = [
  { dia: "Lun", cobros: 180000, meta: 200000 },
  { dia: "Mar", cobros: 195000, meta: 200000 },
  { dia: "Mié", cobros: 185000, meta: 200000 },
  { dia: "Jue", cobros: 210000, meta: 200000 },
  { dia: "Vie", cobros: 225000, meta: 200000 },
  { dia: "Sáb", cobros: 175000, meta: 200000 },
]

const evolucionCartera = [
  { mes: "Ene", cartera: 2100000 },
  { mes: "Feb", cartera: 2200000 },
  { mes: "Mar", cartera: 2350000 },
  { mes: "Abr", cartera: 2450000 },
]

const distribucionRutas = [
  { ruta: "Norte", valor: 650000, color: "#4CAF50" },
  { ruta: "Sur", valor: 580000, color: "#2196F3" },
  { ruta: "Centro", valor: 720000, color: "#FF9800" },
  { ruta: "Este", valor: 500000, color: "#9C27B0" },
]

const actividadReciente = [
  {
    tipo: "pago",
    descripcion: "María González realizó pago de ₡15,000",
    tiempo: "Hace 5 min",
    monto: "₡15,000"
  },
  {
    tipo: "prestamo",
    descripción: "Nuevo préstamo creado para Carlos Ruiz",
    tiempo: "Hace 15 min",
    monto: "₡50,000"
  },
  {
    tipo: "alerta",
    descripcion: "3 cuotas vencidas en Ruta Norte",
    tiempo: "Hace 30 min",
    monto: null
  }
]

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/30 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de la operación - {new Date().toLocaleDateString('es-CR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Hoy
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Préstamo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cartera Total"
          value={kpiData.carteraTotal}
          icon={DollarSign}
          change={{ value: 8.2, isPositive: true }}
          description="Capital prestado activo"
          variant="success"
        />
        
        <KPICard
          title="Cobros del Día"
          value={kpiData.cobrosDia}
          icon={TrendingUp}
          change={{ value: 5.4, isPositive: true }}
          description="Meta: ₡200,000"
        />
        
        <KPICard
          title="Préstamos Activos"
          value={kpiData.prestamosActivos}
          icon={CreditCard}
          change={{ value: 12, isPositive: true }}
          description="Créditos vigentes"
        />
        
        <KPICard
          title="Morosidad"
          value={kpiData.morosidad}
          icon={AlertTriangle}
          change={{ value: -2.1, isPositive: true }}
          description="Cuotas vencidas"
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cobros vs Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Cobros vs. Meta Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cobrosDiarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₡${value.toLocaleString()}`, ""]}
                />
                <Bar dataKey="cobros" fill="hsl(var(--primary))" radius={4} />
                <Bar dataKey="meta" fill="hsl(var(--muted))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolución Cartera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary" />
              Evolución de Cartera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucionCartera}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₡${value.toLocaleString()}`, "Cartera"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="cartera" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Rutas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Rutas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribucionRutas}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="valor"
                >
                  {distribucionRutas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₡${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {distribucionRutas.map((ruta) => (
                <div key={ruta.ruta} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: ruta.color }}
                    />
                    <span>{ruta.ruta}</span>
                  </div>
                  <span className="font-medium">₡{ruta.valor.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actividad Reciente</CardTitle>
            <Button variant="ghost" size="sm">
              Ver todo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actividadReciente.map((actividad, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    actividad.tipo === "pago" ? "bg-success/20 text-success" :
                    actividad.tipo === "prestamo" ? "bg-primary/20 text-primary" :
                    "bg-warning/20 text-warning"
                  }`}>
                    {actividad.tipo === "pago" && <DollarSign className="w-5 h-5" />}
                    {actividad.tipo === "prestamo" && <CreditCard className="w-5 h-5" />}
                    {actividad.tipo === "alerta" && <AlertTriangle className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{actividad.descripcion}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {actividad.tiempo}
                    </div>
                  </div>
                  
                  {actividad.monto && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">{actividad.monto}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}