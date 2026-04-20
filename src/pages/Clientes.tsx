import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useClientes } from "@/hooks/useClientes"
import { ClienteTablaRow, ClienteInsert, ClienteUpdate } from "@/types/cliente"
import ClienteEstadisticas from "@/components/clientes/ClienteEstadisticas"
import ClienteTabla from "@/components/clientes/ClienteTabla"
import FormularioCliente from "@/components/clientes/FormularioCliente"

export default function Clientes() {
  const { clientes, estadisticas, loading, loadingStats, error, crearCliente, actualizarCliente, eliminarCliente } =
    useClientes()

  const [showFormulario, setShowFormulario] = useState(false)
  const [clienteEditar, setClienteEditar] = useState<ClienteTablaRow | null>(null)

  const handleNuevo = () => {
    setClienteEditar(null)
    setShowFormulario(true)
  }

  const handleEditar = (cliente: ClienteTablaRow) => {
    setClienteEditar(cliente)
    setShowFormulario(true)
  }

  const handleSubmit = async (data: ClienteInsert): Promise<boolean> => {
    if (clienteEditar) {
      return actualizarCliente(clienteEditar.id, data as ClienteUpdate)
    }
    const resultado = await crearCliente(data)
    return !!resultado
  }

  return (
    <div className="p-4 xl:p-6 space-y-4 xl:space-y-5 min-h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de deudores y documentos</p>
        </div>
        <Button onClick={handleNuevo} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Estadísticas */}
      <ClienteEstadisticas estadisticas={estadisticas} loading={loadingStats} />

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading inicial */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Cargando clientes...</span>
        </div>
      ) : (
        <ClienteTabla
          clientes={clientes}
          onEdit={handleEditar}
          onDelete={eliminarCliente}
        />
      )}

      {/* Formulario crear / editar */}
      <FormularioCliente
        open={showFormulario}
        onOpenChange={(open) => { setShowFormulario(open); if (!open) setClienteEditar(null) }}
        onSubmit={handleSubmit}
        cliente={clienteEditar ? {
          ...clienteEditar,
          prestamosActivos: clienteEditar.prestamos_activos,
          totalDeuda: clienteEditar.total_deuda,
        } : null}
        loading={loading}
      />
    </div>
  )
}
