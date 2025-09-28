import { useState } from 'react'
import { ArrowLeft, User, MapPin, Calendar, DollarSign, CreditCard, FileText, AlertCircle, Map, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { useDetallePrestamo, DetallePrestamo as DetallePrestamoType } from '../../hooks/useDetallePrestamo'
import { usePagos } from '../../hooks/usePagos'
import { CronogramaPagos } from './CronogramaPagos'
import { ModalPago } from './ModalPago'
import { CronogramaPago } from '../../hooks/useDetallePrestamo'

interface DetallePrestamoProps {
  prestamoId: string
  onBack: () => void
}

export function DetallePrestamo({ prestamoId, onBack }: DetallePrestamoProps) {
  const { detalle, loading, error, refetch } = useDetallePrestamo(prestamoId)
  const { eliminarPago } = usePagos()
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<CronogramaPago | null>(null)
  const [showModalPago, setShowModalPago] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const handlePagarCuota = (cuota: CronogramaPago) => {
    setCuotaSeleccionada(cuota)
    setShowModalPago(true)
  }

  const handlePagoExitoso = () => {
    refetch() // Recargar los datos del préstamo
  }

  const handleEliminarPago = async (cuota: CronogramaPago) => {
    const success = await eliminarPago(cuota.id)
    if (success) {
      refetch() // Recargar los datos del préstamo
    }
  }

  const handleVerMapa = () => {
    // TODO: Implementar funcionalidad de mapa
    console.log('Ver mapa del cliente:', detalle?.cliente)
  }

  const handlePagarPrestamo = () => {
    // Abrir modal de pago sin cuota específica
    setCuotaSeleccionada(null)
    setShowModalPago(true)
  }

  const handleEliminarPrestamo = () => {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar préstamo:', detalle?.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando detalles del préstamo...</p>
        </div>
      </div>
    )
  }

  if (error || !detalle) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error al cargar los detalles del préstamo</p>
        <Button onClick={refetch}>Reintentar</Button>
      </div>
    )
  }

  const progreso = (detalle.estadisticas.cuotas_pagadas / detalle.estadisticas.cuotas_totales) * 100

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Préstamo #{detalle.numero_prestamo}</h1>
            <p className="text-sm text-muted-foreground">
              {detalle.cliente.nombre} {detalle.cliente.apellido}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={detalle.estado === 'activo' ? 'default' : 'secondary'} className="text-xs">
            {detalle.estado}
          </Badge>
          
          {/* Botones de Acción */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerMapa}
              className="h-8 px-3 text-xs"
              title="Ver mapa del cliente"
            >
              <Map className="w-3 h-3 mr-1" />
              Mapa
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePagarPrestamo}
              className="h-8 px-3 text-xs"
              title="Registrar pago"
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Pagar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleEliminarPrestamo}
              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Eliminar préstamo"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Cliente</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{detalle.cliente.nombre} {detalle.cliente.apellido}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cédula</p>
            <p className="font-medium">{detalle.cliente.cedula.toLocaleString('es-CO')}</p>
          </div>
          {detalle.cliente.telefono && (
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{detalle.cliente.telefono}</p>
            </div>
          )}
          {detalle.cliente.ocupacion && (
            <div>
              <p className="text-muted-foreground">Ocupación</p>
              <p className="font-medium">{detalle.cliente.ocupacion}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Información Financiera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Financiero</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Principal</p>
              <p className="font-semibold text-sm">{formatCurrency(detalle.monto_principal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Interés</p>
              <p className="font-semibold text-sm">{formatPercentage(detalle.tasa_interes)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Seguro</p>
              <p className="font-semibold text-sm">{formatCurrency(detalle.valor_seguro)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-sm text-green-600">{formatCurrency(detalle.monto_total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cuota</p>
              <p className="font-semibold text-sm">{formatCurrency(detalle.valor_cuota)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Periodicidad</p>
              <p className="font-semibold text-sm capitalize">{detalle.periodicidad}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Progreso</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">
                {detalle.estadisticas.cuotas_pagadas}/{detalle.estadisticas.cuotas_totales} cuotas
              </span>
            </div>
            <Progress value={progreso} className="h-1.5" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Pagadas</p>
                <p className="font-semibold text-sm text-green-600">{detalle.estadisticas.cuotas_pagadas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pendientes</p>
                <p className="font-semibold text-sm">{detalle.estadisticas.cuotas_pendientes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pagado</p>
                <p className="font-semibold text-sm text-green-600">{formatCurrency(detalle.estadisticas.monto_pagado)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo</p>
                <p className="font-semibold text-sm text-red-600">{formatCurrency(detalle.estadisticas.saldo_pendiente)}</p>
              </div>
            </div>

            {detalle.estadisticas.cuotas_vencidas > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                <div className="flex items-center gap-1 text-red-800">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">
                    {detalle.estadisticas.cuotas_vencidas} cuota(s) vencida(s)
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Información de la Ruta */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Ruta</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Ruta</p>
            <p className="font-medium text-sm">{detalle.ruta.nombre_ruta}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Desembolso</p>
            <p className="font-medium text-sm">{formatDate(detalle.fecha_desembolso)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Primera Cuota</p>
            <p className="font-medium text-sm">{formatDate(detalle.fecha_primer_pago)}</p>
          </div>
        </div>
      </Card>

      {/* Cronograma de Pagos */}
      <CronogramaPagos 
        cronograma={detalle.cronograma} 
        onPagarCuota={handlePagarCuota}
        onEliminarPago={handleEliminarPago}
      />

      {/* Modal de Pago */}
      <ModalPago
        isOpen={showModalPago}
        onClose={() => setShowModalPago(false)}
        cuota={cuotaSeleccionada}
        prestamoId={prestamoId}
        onPagoExitoso={handlePagoExitoso}
      />
    </div>
  )
}
