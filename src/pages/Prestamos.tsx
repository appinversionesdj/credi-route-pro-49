import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  TrendingUp
} from "lucide-react"

const mockPrestamos = [
  {
    id: "P001",
    cliente: "María González",
    cedula: "1-1234-5678",
    monto: 100000,
    plazo: 12,
    cuotasPagadas: 8,
    cuotasTotales: 12,
    proximaFecha: "2024-02-01",
    valorCuota: 9500,
    saldoPendiente: 38000,
    estado: "activo",
    ruta: "Norte",
    fechaDesembolso: "2023-02-01"
  },
  {
    id: "P002",
    cliente: "Carlos Rodríguez",
    cedula: "2-2345-6789",
    monto: 75000,
    plazo: 10,
    cuotasPagadas: 6,
    cuotasTotales: 10,
    proximaFecha: "2024-01-25",
    valorCuota: 8250,
    saldoPendiente: 33000,
    estado: "vencido",
    ruta: "Sur",
    fechaDesembolso: "2023-04-01"
  },
  {
    id: "P003",
    cliente: "Ana Vargas",
    cedula: "1-3456-7890",
    monto: 150000,
    plazo: 18,
    cuotasPagadas: 12,
    cuotasTotales: 18,
    proximaFecha: "2024-02-05",
    valorCuota: 9800,
    saldoPendiente: 58800,
    estado: "activo",
    ruta: "Centro",
    fechaDesembolso: "2022-08-01"
  }
]

export default function Prestamos() {
  const [searchTerm, setSearchTerm] = useState("")

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-success text-success-foreground">Activo</Badge>
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>
      case "pagado":
        return <Badge className="bg-muted text-muted-foreground">Pagado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const calcularProgreso = (pagadas: number, totales: number) => {
    return (pagadas / totales) * 100
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Préstamos</h1>
          <p className="text-muted-foreground">
            Administra el portafolio de créditos activos
          </p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Préstamo
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cartera Total</p>
                <p className="text-xl font-bold">₡325,000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-xl font-bold">₡27,550</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por número, cliente o cédula..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Préstamos List */}
      <div className="space-y-4">
        {mockPrestamos.map((prestamo) => (
          <Card key={prestamo.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cliente Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{prestamo.cliente}</h3>
                      <p className="text-sm text-muted-foreground">{prestamo.id}</p>
                      <p className="text-xs text-muted-foreground">{prestamo.cedula}</p>
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="lg:col-span-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monto Original</span>
                      <span className="font-medium">₡{prestamo.monto.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
                      <span className="font-bold text-destructive">₡{prestamo.saldoPendiente.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Cuota</span>
                      <span className="font-medium">₡{prestamo.valorCuota.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="lg:col-span-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cuotas Pagadas</span>
                      <span>{prestamo.cuotasPagadas}/{prestamo.cuotasTotales}</span>
                    </div>
                    <Progress 
                      value={calcularProgreso(prestamo.cuotasPagadas, prestamo.cuotasTotales)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {calcularProgreso(prestamo.cuotasPagadas, prestamo.cuotasTotales).toFixed(1)}% completado
                    </p>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="lg:col-span-2">
                  <div className="space-y-3">
                    {getEstadoBadge(prestamo.estado)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{prestamo.ruta}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Próx: {new Date(prestamo.proximaFecha).toLocaleDateString('es-CR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}