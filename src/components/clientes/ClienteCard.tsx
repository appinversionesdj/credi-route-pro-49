import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MoreHorizontal,
  User,
  Phone,
  MapPin,
  CreditCard
} from "lucide-react"
import { ClienteExtendido } from "@/types/cliente"

interface ClienteCardProps {
  cliente: ClienteExtendido
  onEdit?: (cliente: ClienteExtendido) => void
  onDelete?: (id: string) => void
  onView?: (cliente: ClienteExtendido) => void
}

function getEstadoBadge(estado: string | null) {
  switch (estado) {
    case "activo":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    case "moroso":
      return <Badge variant="destructive">Moroso</Badge>
    case "inactivo":
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">Inactivo</Badge>
    default:
      return <Badge variant="outline">{estado || "Sin estado"}</Badge>
  }
}

export default function ClienteCard({ cliente, onEdit, onDelete, onView }: ClienteCardProps) {
  const handleCardClick = () => {
    if (onView) {
      onView(cliente)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {cliente.foto_url ? (
                <img 
                  src={cliente.foto_url} 
                  alt={`${cliente.nombre} ${cliente.apellido}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {cliente.nombre} {cliente.apellido}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                CC: {cliente.cedula?.toLocaleString('es-CO') || 'Sin cédula'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              // Aquí se puede agregar un menú contextual
            }}
          >
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
          {cliente.telefono && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{cliente.telefono}</span>
            </div>
          )}
          
          {cliente.direccion && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{cliente.direccion}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span>{cliente.prestamosActivos || 0} préstamo(s) activo(s)</span>
          </div>

          {cliente.ocupacion && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{cliente.ocupacion}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Deuda Total</span>
            <span className="font-bold text-lg">
              ${(cliente.totalDeuda || 0).toLocaleString('es-CO')}
            </span>
          </div>
          {cliente.ultimoPago && (
            <p className="text-xs text-muted-foreground mt-1">
              Último pago: {new Date(cliente.ultimoPago).toLocaleDateString('es-CO')}
            </p>
          )}
          {cliente.ruta && (
            <p className="text-xs text-muted-foreground">
              Ruta: {cliente.ruta}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
