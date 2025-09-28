import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { RutaCard } from '../components/rutas/RutaCard'
import { RutaEstadisticas } from '../components/rutas/RutaEstadisticas'
import { FormularioRuta } from '../components/rutas/FormularioRuta'
import { DetalleRuta } from '../components/rutas/DetalleRuta'
import { useRutas } from '../hooks/useRutas'
import { RutaExtendida, RutaFiltros, RutaEstadisticas as EstadisticasType } from '../types/ruta'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'

export default function Rutas() {
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [zonaFiltro, setZonaFiltro] = useState<string>('')
  const [modalRutaAbierto, setModalRutaAbierto] = useState(false)
  const [rutaEditando, setRutaEditando] = useState<string | undefined>()
  const [rutaDetalle, setRutaDetalle] = useState<RutaExtendida | null>(null)
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasType | null>(null)
  
  const { rutas, loading, refetch, obtenerEstadisticasGenerales } = useRutas()

  const filtros: RutaFiltros = {
    busqueda: busqueda || undefined,
    estado: estadoFiltro || undefined,
    zona_geografica: zonaFiltro || undefined,
  }

  const rutasFiltradas = rutas.filter(ruta => {
    if (filtros.busqueda && !ruta.nombre_ruta.toLowerCase().includes(filtros.busqueda.toLowerCase())) {
      return false
    }
    if (filtros.estado && ruta.estado !== filtros.estado) {
      return false
    }
    if (filtros.zona_geografica && ruta.zona_geografica !== filtros.zona_geografica) {
      return false
    }
    return true
  })

  const zonasUnicas = Array.from(new Set(rutas.map(r => r.zona_geografica).filter(Boolean)))

  const handleEditarRuta = (ruta: RutaExtendida) => {
    setRutaEditando(ruta.id)
    setModalRutaAbierto(true)
  }

  const handleVerDetalles = (ruta: RutaExtendida) => {
    setRutaDetalle(ruta)
  }

  const handleNuevaRuta = () => {
    setRutaEditando(undefined)
    setModalRutaAbierto(true)
  }

  const handleSuccessRuta = () => {
    refetch()
    cargarEstadisticasGenerales()
  }

  const cargarEstadisticasGenerales = async () => {
    const estadisticas = await obtenerEstadisticasGenerales()
    setEstadisticasGenerales(estadisticas)
  }

  useEffect(() => {
    cargarEstadisticasGenerales()
  }, [rutas])

  if (rutaDetalle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Detalle de Ruta</h1>
          <Button variant="outline" onClick={() => setRutaDetalle(null)}>
            Volver a Rutas
          </Button>
        </div>
        <DetalleRuta ruta={rutaDetalle} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
        <Button onClick={handleNuevaRuta}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ruta
        </Button>
      </div>

      {/* Estadísticas generales */}
      {estadisticasGenerales && (
        <RutaEstadisticas estadisticas={estadisticasGenerales} />
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zonaFiltro} onValueChange={setZonaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Zona geográfica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las zonas</SelectItem>
                {zonasUnicas.map((zona) => (
                  <SelectItem key={zona} value={zona}>
                    {zona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusqueda('')
                setEstadoFiltro('')
                setZonaFiltro('')
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de rutas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Rutas ({rutasFiltradas.length})
          </h2>
          <div className="flex gap-2">
            <Badge variant="outline">
              {rutas.filter(r => r.estado === 'activa').length} Activas
            </Badge>
            <Badge variant="secondary">
              {rutas.filter(r => r.estado === 'inactiva').length} Inactivas
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rutasFiltradas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rutasFiltradas.map((ruta) => (
              <RutaCard
                key={ruta.id}
                ruta={ruta}
                onEdit={handleEditarRuta}
                onViewDetails={handleVerDetalles}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="text-6xl text-muted-foreground">📍</div>
                <h3 className="text-lg font-medium">No hay rutas</h3>
                <p className="text-muted-foreground">
                  {busqueda || estadoFiltro || zonaFiltro
                    ? 'No se encontraron rutas con los filtros aplicados'
                    : 'Comienza creando tu primera ruta'}
                </p>
                {(!busqueda && !estadoFiltro && !zonaFiltro) && (
                  <Button onClick={handleNuevaRuta}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Ruta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de formulario */}
      <FormularioRuta
        open={modalRutaAbierto}
        onOpenChange={setModalRutaAbierto}
        rutaId={rutaEditando}
        onSuccess={handleSuccessRuta}
      />
    </div>
  )
}