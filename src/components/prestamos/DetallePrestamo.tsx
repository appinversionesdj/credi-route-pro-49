import { useState } from 'react'
import { ArrowLeft, User, MapPin, Calendar, DollarSign, CreditCard, FileText, AlertCircle, Map, Trash2, Edit, Phone, Mail, Home, Clock, TrendingUp, Percent, CalendarCheck, Receipt } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useDetallePrestamo, DetallePrestamo as DetallePrestamoType } from '../../hooks/useDetallePrestamo'
import { usePagos } from '../../hooks/usePagos'
import { HistorialPagos } from './HistorialPagos'
import { ModalPago } from './ModalPago'

interface DetallePrestamoProps {
  prestamoId: string
  onBack: () => void
}

export function DetallePrestamo({ prestamoId, onBack }: DetallePrestamoProps) {
  const { detalle, loading, error, refetch } = useDetallePrestamo(prestamoId)
  const { eliminarPagoRegistrado } = usePagos()
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

  const handlePagoExitoso = () => {
    refetch() // Recargar los datos del préstamo
  }

  const handleEliminarPago = async (pagoId: string) => {
    const success = await eliminarPagoRegistrado(pagoId)
    if (success) {
      refetch() // Recargar los datos del préstamo
    }
  }

  const handleVerMapa = () => {
    // TODO: Implementar funcionalidad de mapa
    console.log('Ver mapa del cliente:', detalle?.cliente)
  }

  const handlePagarPrestamo = () => {
    // Abrir modal de pago
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
  
  // Obtener iniciales del cliente
  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'vencido':
        return 'bg-red-100 text-red-800'
      case 'pagado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Botón Volver */}
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver
      </Button>

      {/* Header tipo Perfil */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar y Info Principal */}
            <div className="flex items-start gap-4 flex-1">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getInitials(detalle.cliente.nombre, detalle.cliente.apellido)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">
                      {detalle.cliente.nombre} {detalle.cliente.apellido}
                    </h1>
                    <Badge className={getEstadoColor(detalle.estado)}>
                      {detalle.estado === 'activo' ? 'Activo' : 
                       detalle.estado === 'vencido' ? 'Vencido' : 
                       detalle.estado === 'pagado' ? 'Pagado' : detalle.estado}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Préstamo #{detalle.numero_prestamo}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cédula</p>
                      <p className="font-medium">{detalle.cliente.cedula.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                  
                  {detalle.cliente.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{detalle.cliente.telefono}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ruta</p>
                      <p className="font-medium">{detalle.ruta.nombre_ruta}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handlePagarPrestamo}
                size="sm"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerMapa}
              >
                <Map className="w-4 h-4 mr-2" />
                Ver Mapa
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleEliminarPrestamo}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Información Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monto Principal</p>
                <p className="text-lg font-bold">{formatCurrency(detalle.monto_principal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuota</p>
                <p className="text-lg font-bold">{formatCurrency(detalle.valor_cuota)}</p>
                <p className="text-xs text-muted-foreground capitalize">{detalle.periodicidad}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progreso</p>
                <p className="text-lg font-bold">
                  {detalle.estadisticas.cuotas_pagadas}/{detalle.estadisticas.cuotas_totales}
                </p>
                <p className="text-xs text-muted-foreground">{progreso.toFixed(0)}% completado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={detalle.estadisticas.cuotas_vencidas > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                detalle.estadisticas.cuotas_vencidas > 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <AlertCircle className={`w-5 h-5 ${
                  detalle.estadisticas.cuotas_vencidas > 0 ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                <p className="text-lg font-bold">{formatCurrency(detalle.estadisticas.saldo_pendiente)}</p>
                {detalle.estadisticas.cuotas_vencidas > 0 && (
                  <p className="text-xs font-medium text-red-600">
                    {detalle.estadisticas.cuotas_vencidas} en mora
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Información */}
      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion">
            <FileText className="w-4 h-4 mr-2" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="pagos">
            <Receipt className="w-4 h-4 mr-2" />
            Historial de Pagos
          </TabsTrigger>
          <TabsTrigger value="estadisticas">
            <TrendingUp className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="informacion" className="space-y-4 mt-4">
          {/* Detalles del Préstamo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monto Principal</p>
                  <p className="text-lg font-bold">{formatCurrency(detalle.monto_principal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                  <p className="text-lg font-bold">{formatPercentage(detalle.tasa_interes)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor Seguro</p>
                  <p className="text-lg font-bold">{formatCurrency(detalle.valor_seguro)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monto Total</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(detalle.monto_total)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor Cuota</p>
                  <p className="text-lg font-bold">{formatCurrency(detalle.valor_cuota)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Periodicidad</p>
                  <p className="text-lg font-bold capitalize">{detalle.periodicidad}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="text-base font-medium">{detalle.cliente.nombre} {detalle.cliente.apellido}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="text-base font-medium">{detalle.cliente.cedula.toLocaleString('es-CO')}</p>
                </div>
                {detalle.cliente.telefono && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="text-base font-medium">{detalle.cliente.telefono}</p>
                  </div>
                )}
                {detalle.cliente.direccion && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-base font-medium">{detalle.cliente.direccion}</p>
                  </div>
                )}
                {detalle.cliente.ocupacion && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ocupación</p>
                    <p className="text-base font-medium">{detalle.cliente.ocupacion}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Desembolso</p>
                  <p className="text-base font-medium">{formatDate(detalle.fecha_desembolso)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Primera Cuota</p>
                  <p className="text-base font-medium">{formatDate(detalle.fecha_primer_pago)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ruta Asignada</p>
                  <p className="text-base font-medium">{detalle.ruta.nombre_ruta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial de Pagos */}
        <TabsContent value="pagos" className="mt-4">
          <HistorialPagos 
            pagos={detalle.pagos} 
            onEliminarPago={handleEliminarPago}
          />
        </TabsContent>

        {/* Tab: Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resumen de Pagos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Resumen de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-muted-foreground">Monto Total del Préstamo</span>
                  <span className="text-lg font-bold">{formatCurrency(detalle.monto_total)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-green-600">Total Pagado</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(detalle.estadisticas.monto_pagado)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Saldo Pendiente</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(detalle.estadisticas.saldo_pendiente)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Progreso del Préstamo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Progreso del Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Progreso General</span>
                    <span className="text-sm font-medium">{progreso.toFixed(1)}%</span>
                  </div>
                  <Progress value={progreso} className="h-3" />
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {detalle.estadisticas.cuotas_pagadas}
                    </p>
                    <p className="text-xs text-muted-foreground">Pagadas</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {detalle.estadisticas.cuotas_pendientes}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {detalle.estadisticas.cuotas_vencidas}
                    </p>
                    <p className="text-xs text-muted-foreground">Vencidas</p>
                  </div>
                </div>

                {detalle.estadisticas.cuotas_vencidas > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Este préstamo tiene {detalle.estadisticas.cuotas_vencidas} cuota(s) en mora
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Pago */}
      <ModalPago
        isOpen={showModalPago}
        onClose={() => setShowModalPago(false)}
        cuota={null}
        prestamoId={prestamoId}
        onPagoExitoso={handlePagoExitoso}
      />
    </div>
  )
}
