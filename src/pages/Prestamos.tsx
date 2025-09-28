import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter,
  Loader2
} from "lucide-react"
import { usePrestamos } from "@/hooks/usePrestamos"
import { PrestamoFiltros } from "@/types/prestamo"
import PrestamoCard from "@/components/prestamos/PrestamoCard"
import PrestamoEstadisticas from "@/components/prestamos/PrestamoEstadisticas"
import FormularioNuevoCredito from "@/components/prestamos/FormularioNuevoCredito"
import { usePagination } from "@/hooks/usePagination"
import Pagination from "@/components/ui/pagination"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function Prestamos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtros, setFiltros] = useState<PrestamoFiltros>({})
  const [estadisticas, setEstadisticas] = useState(null)
  const [showFormulario, setShowFormulario] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [prestamoToInactivar, setPrestamoToInactivar] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // Hook para manejar préstamos con Supabase
  const { prestamos, loading, error, obtenerEstadisticas, crearPrestamo, inactivarPrestamo } = usePrestamos(filtros)
  
  // Paginación
  const { paginatedData: prestamosPaginados, pagination, controls } = usePagination(prestamos, 10)

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const cargarEstadisticas = async () => {
      const stats = await obtenerEstadisticas()
      setEstadisticas(stats)
    }
    cargarEstadisticas()
  }, [prestamos]) // Recargar cuando cambien los préstamos

  // Actualizar filtros cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltros(prev => ({
        ...prev,
        busqueda: searchTerm || undefined
      }))
    }, 200) // Debounce de 200ms para búsqueda más responsiva

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handlePrestamoView = (prestamo: any) => {
    navigate(`/prestamos/${prestamo.id}`)
  }


  const handlePrestamoInactivar = (id: string) => {
    setPrestamoToInactivar(id)
    setShowConfirmDialog(true)
  }

  const handleConfirmInactivar = async () => {
    if (prestamoToInactivar) {
      await inactivarPrestamo(prestamoToInactivar)
      setPrestamoToInactivar(null)
    }
  }

  const handleCancelInactivar = () => {
    setPrestamoToInactivar(null)
    setShowConfirmDialog(false)
  }

  const handleNuevoPrestamo = () => {
    setShowFormulario(true)
  }

  const handleSuccess = () => {
    // Recargar estadísticas y datos
    const cargarEstadisticas = async () => {
      const stats = await obtenerEstadisticas()
      setEstadisticas(stats)
    }
    cargarEstadisticas()
  }

  const handleViewPrestamo = (prestamo: any) => {
    navigate(`/prestamos/${prestamo.id}`)
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
        
        <Button onClick={handleNuevoPrestamo}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Préstamo
        </Button>
      </div>

      {/* Estadísticas */}
      <PrestamoEstadisticas 
        estadisticas={estadisticas} 
        loading={loading}
      />

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
          <span className="ml-2 text-muted-foreground">Cargando préstamos...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && prestamos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No se encontraron préstamos</p>
              <p className="text-sm">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda" 
                  : "Comienza agregando tu primer préstamo"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Préstamos List */}
      {!loading && !error && prestamos.length > 0 && (
        <Card>
          <CardContent className="p-0">
            {/* Encabezados de la tabla */}
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-muted-foreground bg-gray-50 px-6 py-3 border-b">
              <div className="col-span-3 pl-2">Cliente</div>
              <div className="col-span-1 text-right pr-2">Monto Total</div>
              <div className="col-span-1 text-right pr-2">Saldo</div>
              <div className="col-span-1 text-right pr-2">Cuota</div>
              <div className="col-span-2 text-center">Progreso</div>
              <div className="col-span-1 text-center">Ruta</div>
              <div className="col-span-1 text-center">Próxima</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-1 text-center">Acciones</div>
            </div>
            
            {/* Filas de préstamos paginados */}
            <div>
              {prestamosPaginados.map((prestamo) => (
                <PrestamoCard
                  key={prestamo.id}
                  prestamo={prestamo}
                  onView={handlePrestamoView}
                  onInactivar={handlePrestamoInactivar}
                />
              ))}
            </div>
            
            {/* Paginación */}
            <Pagination 
              pagination={pagination}
              controls={controls}
              showItemsPerPage={true}
              itemsPerPageOptions={[5, 10, 20, 50]}
            />
          </CardContent>
        </Card>
      )}

      {/* Formulario de Nuevo Crédito */}
      <FormularioNuevoCredito
        open={showFormulario}
        onOpenChange={setShowFormulario}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de Confirmación para Inactivar */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelInactivar}
        onConfirm={handleConfirmInactivar}
        title="Inactivar Préstamo"
        description="¿Estás seguro de que quieres inactivar este préstamo? Esta acción no se puede deshacer y el préstamo ya no aparecerá en la lista principal."
        confirmText="Inactivar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}