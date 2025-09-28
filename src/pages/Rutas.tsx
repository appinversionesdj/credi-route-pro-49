import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RutaKPICard } from "@/components/rutas/RutaKPICard"
import { RutaEstadisticas } from "@/components/rutas/RutaEstadisticas"
import { FormularioRuta } from "@/components/rutas/FormularioRuta"
import { useRutas } from "@/hooks/useRutas"
import { RutaExtendida, RutaInsert, RutaUpdate, RutaFiltros } from "@/types/ruta"

interface EstadisticasGenerales {
  totalRutas: number
  rutasActivas: number
  rutasInactivas: number
  rutasSuspendidas: number
  carteraTotal: number
  saldoPendiente: number
  rentabilidadPromedio: number
  eficienciaPromedio: number
  clientesActivos: number
  clientesMorosos: number
  caja: number
  segurosRecogidos: number
}
import { 
  Plus, 
  MapPin, 
  Loader2
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Rutas() {
  const navigate = useNavigate()
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [showFormulario, setShowFormulario] = useState(false)
  const [rutaEditando, setRutaEditando] = useState<RutaExtendida | null>(null)

  const { 
    rutas, 
    loading, 
    error, 
    crearRuta, 
    actualizarRuta, 
    refetch 
  } = useRutas({})

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const cargarEstadisticas = async () => {
      // Calcular estadísticas generales
      const stats = {
        totalRutas: rutas.length,
        rutasActivas: rutas.filter(r => r.estado === 'activa').length,
        rutasInactivas: rutas.filter(r => r.estado === 'inactiva').length,
        rutasSuspendidas: rutas.filter(r => r.estado === 'suspendida').length,
        carteraTotal: rutas.reduce((sum, r) => sum + r.estadisticas.carteraTotal, 0),
        saldoPendiente: rutas.reduce((sum, r) => sum + r.estadisticas.saldoPendiente, 0),
        rentabilidadPromedio: rutas.length > 0 ? rutas.reduce((sum, r) => sum + r.estadisticas.rentabilidad, 0) / rutas.length : 0,
        eficienciaPromedio: rutas.length > 0 ? rutas.reduce((sum, r) => sum + r.estadisticas.eficienciaCobro, 0) / rutas.length : 0,
        clientesActivos: rutas.reduce((sum, r) => sum + r.estadisticas.clientesActivos, 0),
        clientesMorosos: rutas.reduce((sum, r) => sum + r.estadisticas.clientesMorosos, 0),
        caja: rutas.reduce((sum, r) => sum + (r.estadisticas.caja || 0), 0),
        segurosRecogidos: rutas.reduce((sum, r) => sum + (r.estadisticas.segurosRecogidos || 0), 0)
      }
      setEstadisticas(stats)
    }
    cargarEstadisticas()
  }, [rutas]) // Recargar cuando cambien las rutas


  const handleRutaView = (ruta: RutaExtendida) => {
    navigate(`/rutas/${ruta.id}`)
  }

  const handleRutaEdit = (ruta: RutaExtendida) => {
    setRutaEditando(ruta)
  }

  const handleNuevaRuta = () => {
    setShowFormulario(true)
  }

  const handleSubmitRuta = async (rutaData: RutaInsert | RutaUpdate) => {
    if (rutaEditando) {
      const success = await actualizarRuta(rutaEditando.id, rutaData as RutaUpdate)
      if (success) {
        setRutaEditando(null)
      }
      return success
    } else {
      const success = await crearRuta(rutaData as RutaInsert)
      if (success) {
        setShowFormulario(false)
      }
      return success
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Rutas</h1>
          <p className="text-muted-foreground">
            Administra las rutas de cobro y su rendimiento
          </p>
        </div>
        
        <Button onClick={handleNuevaRuta}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ruta
        </Button>
      </div>


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
          <span className="ml-2 text-muted-foreground">Cargando rutas...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && rutas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No se encontraron rutas</p>
              <p className="text-sm">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda" 
                  : "Comienza agregando tu primera ruta"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary - Primero */}
      <RutaEstadisticas 
        estadisticas={estadisticas} 
        loading={loading}
        isGeneral={true}
      />

      {/* Rutas Grid */}
      {!loading && !error && rutas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rutas.map((ruta) => (
            <RutaKPICard
              key={ruta.id}
              ruta={ruta}
              onView={handleRutaView}
              onEdit={handleRutaEdit}
            />
          ))}
        </div>
      )}

      {/* Formulario de Ruta */}
      <FormularioRuta
        ruta={rutaEditando || undefined}
        isOpen={showFormulario || !!rutaEditando}
        onClose={() => {
          setShowFormulario(false)
          setRutaEditando(null)
        }}
        onSave={handleSubmitRuta}
      />
    </div>
  )
}
