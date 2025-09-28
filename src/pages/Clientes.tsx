import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter,
  Loader2
} from "lucide-react"
import { useClientes } from "@/hooks/useClientes"
import { ClienteFiltros } from "@/types/cliente"
import ClienteCard from "@/components/clientes/ClienteCard"
import ClienteEstadisticas from "@/components/clientes/ClienteEstadisticas"
import FormularioCliente from "@/components/clientes/FormularioCliente"

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtros, setFiltros] = useState<ClienteFiltros>({})
  const [estadisticas, setEstadisticas] = useState(null)
  const [showFormulario, setShowFormulario] = useState(false)
  
  // Hook para manejar clientes con Supabase
  const { clientes, loading, error, obtenerEstadisticas, crearCliente } = useClientes(filtros)

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const cargarEstadisticas = async () => {
      const stats = await obtenerEstadisticas()
      setEstadisticas(stats)
    }
    cargarEstadisticas()
  }, [clientes]) // Recargar cuando cambien los clientes

  // Actualizar filtros cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltros(prev => ({
        ...prev,
        busqueda: searchTerm || undefined
      }))
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleClienteView = (cliente: any) => {
    // TODO: Implementar vista de detalle del cliente
    console.log("Ver cliente:", cliente)
  }

  const handleClienteEdit = (cliente: any) => {
    // TODO: Implementar edición del cliente
    console.log("Editar cliente:", cliente)
  }

  const handleClienteDelete = (id: string) => {
    // TODO: Implementar eliminación del cliente
    console.log("Eliminar cliente:", id)
  }

  const handleNuevoCliente = () => {
    setShowFormulario(true)
  }

  const handleSubmitCliente = async (clienteData: any) => {
    const cliente = await crearCliente(clienteData)
    return !!cliente
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
        
        <Button onClick={handleNuevoCliente}>
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
                disabled={loading}
              />
            </div>
            <Button variant="outline" disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && clientes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No se encontraron clientes</p>
              <p className="text-sm">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda" 
                  : "Comienza agregando tu primer cliente"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clientes Grid */}
      {!loading && !error && clientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onView={handleClienteView}
              onEdit={handleClienteEdit}
              onDelete={handleClienteDelete}
            />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <ClienteEstadisticas 
        estadisticas={estadisticas} 
        loading={loading}
      />

      {/* Formulario de Cliente */}
      <FormularioCliente
        open={showFormulario}
        onOpenChange={setShowFormulario}
        onSubmit={handleSubmitCliente}
        loading={loading}
      />
    </div>
  )
}