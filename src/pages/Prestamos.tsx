import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter,
  Loader2,
  X,
  AlertCircle
} from "lucide-react"
import { usePrestamos } from "@/hooks/usePrestamos"
import { useRutas } from "@/hooks/useRutas"
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
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string>("")
  const [soloVencidos, setSoloVencidos] = useState(false)
  const navigate = useNavigate()
  
  // Hook para manejar préstamos con Supabase
  const { prestamos, loading, error, obtenerEstadisticas, crearPrestamo, inactivarPrestamo } = usePrestamos(filtros)
  
  // Hook para obtener rutas
  const { rutas, loading: loadingRutas } = useRutas()
  
  // Filtrar préstamos vencidos en el frontend
  const prestamosFiltrados = soloVencidos 
    ? prestamos.filter(p => (p.cuotasVencidas || 0) > 0)
    : prestamos
  
  // Paginación con préstamos filtrados
  const { paginatedData: prestamosPaginados, pagination, controls } = usePagination(prestamosFiltrados, 10)

  // Cargar estadísticas al montar el componente y cuando cambien los filtros
  useEffect(() => {
    const cargarEstadisticas = async () => {
      const stats = await obtenerEstadisticas(filtros)
      setEstadisticas(stats)
    }
    cargarEstadisticas()
  }, [filtros, prestamos]) // Recargar cuando cambien los filtros o los préstamos

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

  // Actualizar filtros cuando cambie la ruta seleccionada
  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      ruta_id: rutaSeleccionada && rutaSeleccionada !== "todas" ? rutaSeleccionada : undefined
    }))
  }, [rutaSeleccionada])

  const handleLimpiarFiltros = () => {
    setSearchTerm("")
    setRutaSeleccionada("")
    setSoloVencidos(false)
    setFiltros({})
  }

  const contarVencidos = () => {
    return prestamos.filter(p => (p.cuotasVencidas || 0) > 0).length
  }

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
    // Recargar estadísticas y datos con los filtros actuales
    const cargarEstadisticas = async () => {
      const stats = await obtenerEstadisticas(filtros)
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
          <div className="flex flex-col gap-4">
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
              
              <Select
                value={rutaSeleccionada}
                onValueChange={setRutaSeleccionada}
                disabled={loading || loadingRutas}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Filtrar por ruta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las rutas</SelectItem>
                  {rutas.map((ruta) => (
                    <SelectItem key={ruta.id} value={ruta.id}>
                      {ruta.nombre_ruta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant={soloVencidos ? "destructive" : "outline"}
                onClick={() => setSoloVencidos(!soloVencidos)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Vencidos
                {!loading && contarVencidos() > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                    {contarVencidos()}
                  </span>
                )}
              </Button>

              {(searchTerm || rutaSeleccionada || soloVencidos) && (
                <Button 
                  variant="outline" 
                  onClick={handleLimpiarFiltros}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm">
              {rutaSeleccionada && rutaSeleccionada !== "todas" && (
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Ruta:</span>{" "}
                  {rutas.find(r => r.id === rutaSeleccionada)?.nombre_ruta}
                </div>
              )}
              {soloVencidos && (
                <div className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Mostrando solo préstamos con cuotas vencidas</span>
                </div>
              )}
            </div>
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
      {!loading && !error && prestamosFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No se encontraron préstamos</p>
              <p className="text-sm">
                {searchTerm || rutaSeleccionada || soloVencidos
                  ? "Intenta ajustar los filtros de búsqueda" 
                  : "Comienza agregando tu primer préstamo"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Préstamos List */}
      {!loading && !error && prestamosFiltrados.length > 0 && (
        <Card>
          <CardContent className="p-0">
            {/* Encabezados de la tabla */}
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-muted-foreground bg-gray-50 px-6 py-3 border-b">
              <div className="col-span-3 pl-2">Cliente</div>
              <div className="col-span-1 text-right pr-2">Monto Total</div>
              <div className="col-span-1 text-right pr-2">Saldo</div>
              <div className="col-span-1 text-right pr-2">Cuota</div>
              <div className="col-span-2 text-center">Progreso</div>
              <div className="col-span-2 text-center">Próxima</div>
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