import { useState, useEffect } from 'react'
import { Calendar, DollarSign, Users, TrendingUp, Clock, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { RutaExtendida, BaseDiaria } from '../../types/ruta'
import { useRutas } from '../../hooks/useRutas'

interface DetalleRutaProps {
  ruta: RutaExtendida
}

export function DetalleRuta({ ruta }: DetalleRutaProps) {
  const [basesDiarias, setBasesDiarias] = useState<BaseDiaria[]>([])
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [loadingBases, setLoadingBases] = useState(false)
  const { obtenerBasesDiarias } = useRutas()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    return timeString.slice(0, 5) // HH:MM
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'en_ruta':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En Ruta</Badge>
      case 'finalizada':
        return <Badge variant="default" className="bg-green-100 text-green-800">Finalizada</Badge>
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const cargarBasesDiarias = async () => {
    setLoadingBases(true)
    try {
      const bases = await obtenerBasesDiarias(ruta.id, fechaFiltro)
      setBasesDiarias(bases)
    } catch (error) {
      console.error('Error cargando bases diarias:', error)
    } finally {
      setLoadingBases(false)
    }
  }

  useEffect(() => {
    cargarBasesDiarias()
  }, [ruta.id, fechaFiltro])

  const getTasaColor = (tasa: number) => {
    if (tasa >= 90) return 'text-green-600'
    if (tasa >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Información general de la ruta */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{ruta.nombre_ruta}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{ruta.zona_geografica || 'Sin zona definida'}</span>
              </div>
              {ruta.descripcion && (
                <p className="text-sm text-muted-foreground">{ruta.descripcion}</p>
              )}
            </div>
            <Badge variant={ruta.estado === 'activa' ? 'default' : 'secondary'}>
              {ruta.estado === 'activa' ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas de la ruta */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartera Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(ruta.estadisticas?.montoTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {ruta.estadisticas?.totalPrestamos || 0} préstamos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(ruta.estadisticas?.saldoPendiente || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Recuperación</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTasaColor(ruta.estadisticas?.tasaRecuperacion || 0)}`}>
              {(ruta.estadisticas?.tasaRecuperacion || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Rendimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobradores</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {ruta.estadisticas?.cobradores || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Asignados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cobradores asignados */}
      {ruta.cobradores && ruta.cobradores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cobradores Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ruta.cobradores.map((cobrador) => (
                <div key={cobrador.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{cobrador.nombre} {cobrador.apellido}</p>
                  <p className="text-sm text-muted-foreground">CC: {cobrador.cedula}</p>
                  {cobrador.telefono && (
                    <p className="text-sm text-muted-foreground">{cobrador.telefono}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bases diarias */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Bases Diarias</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <Input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBases ? (
            <p className="text-center py-4">Cargando bases diarias...</p>
          ) : basesDiarias.length > 0 ? (
            <div className="space-y-4">
              {basesDiarias.map((base) => (
                <div key={base.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {base.cobrador?.nombre} {base.cobrador?.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(base.fecha)}
                      </p>
                    </div>
                    {getEstadoBadge(base.estado)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Base Entregada</p>
                      <p className="font-semibold">{formatCurrency(base.monto_base_entregado)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monto Devuelto</p>
                      <p className="font-semibold">{formatCurrency(base.monto_devuelto)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hora Inicio</p>
                      <p className="font-semibold">{formatTime(base.hora_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hora Fin</p>
                      <p className="font-semibold">{formatTime(base.hora_fin)}</p>
                    </div>
                  </div>
                  
                  {base.observaciones && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Observaciones:</p>
                      <p className="text-sm">{base.observaciones}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No hay bases diarias registradas para esta fecha
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}