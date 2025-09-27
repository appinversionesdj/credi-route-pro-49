import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  User,
  Phone,
  MapPin,
  CreditCard
} from "lucide-react"

const mockClientes = [
  {
    id: 1,
    nombre: "María González",
    cedula: "1-1234-5678",
    telefono: "8888-1234",
    direccion: "San José, Costa Rica",
    prestamosActivos: 2,
    totalDeuda: 125000,
    estado: "activo",
    ultimoPago: "2024-01-15"
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez",
    cedula: "2-2345-6789",
    telefono: "8888-5678",
    direccion: "Cartago, Costa Rica",
    prestamosActivos: 1,
    totalDeuda: 75000,
    estado: "moroso",
    ultimoPago: "2023-12-20"
  },
  {
    id: 3,
    nombre: "Ana Vargas",
    cedula: "1-3456-7890",
    telefono: "8888-9012",
    direccion: "Alajuela, Costa Rica",
    prestamosActivos: 3,
    totalDeuda: 200000,
    estado: "activo",
    ultimoPago: "2024-01-20"
  }
]

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge variant="secondary" className="bg-success-light text-success">Activo</Badge>
      case "moroso":
        return <Badge variant="destructive">Moroso</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Administra la información de tus deudores
          </p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, cédula o teléfono..." 
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

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClientes.map((cliente) => (
          <Card key={cliente.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{cliente.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">{cliente.cedula}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                {getEstadoBadge(cliente.estado)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{cliente.telefono}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{cliente.direccion}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>{cliente.prestamosActivos} préstamo(s) activo(s)</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Deuda Total</span>
                  <span className="font-bold text-lg">
                    ₡{cliente.totalDeuda.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Último pago: {new Date(cliente.ultimoPago).toLocaleDateString('es-CR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success-light/20 rounded-lg">
              <p className="text-2xl font-bold text-success">2</p>
              <p className="text-sm text-muted-foreground">Clientes Activos</p>
            </div>
            <div className="text-center p-4 bg-warning-light/20 rounded-lg">
              <p className="text-2xl font-bold text-warning">1</p>
              <p className="text-sm text-muted-foreground">Clientes Morosos</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">₡400,000</p>
              <p className="text-sm text-muted-foreground">Deuda Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}