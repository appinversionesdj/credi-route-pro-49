import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Calendar,
  DollarSign,
  CreditCard,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Receipt,
  TrendingUp,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface PrestamoDetalleModalProps {
  prestamoId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DetallePrestamo {
  id: string
  numero_prestamo: string
  monto_principal: number
  tasa_interes: number
  valor_seguro: number
  periodicidad: string
  numero_cuotas: number
  valor_cuota: number
  monto_total: number
  fecha_desembolso: string
  fecha_primer_pago: string
  estado: string
  observaciones?: string
  cuotas_pagadas: number
  saldo_pendiente: number
  cliente: {
    nombre: string
    apellido: string
    cedula: number
    telefono?: string
    direccion?: string
  }
  ruta: {
    nombre_ruta: string
    zona_geografica?: string
  }
}

interface PagoRegistrado {
  id: string
  monto_pagado: number
  fecha_pago: string
  hora_pago?: string
  tipo_pago: string
  observaciones?: string
  cobrador?: {
    nombre: string
    apellido: string
  }
}

export function PrestamoDetalleModal({ prestamoId, open, onOpenChange }: PrestamoDetalleModalProps) {
  const [activeTab, setActiveTab] = useState("credito")
  const [detalle, setDetalle] = useState<DetallePrestamo | null>(null)
  const [pagos, setPagos] = useState<PagoRegistrado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para edición del seguro
  const [editandoSeguro, setEditandoSeguro] = useState(false)
  const [valorSeguroTemp, setValorSeguroTemp] = useState<string>("")
  const [guardandoSeguro, setGuardandoSeguro] = useState(false)
  const { toast } = useToast()

  const fetchDetalle = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Obtener préstamo con cliente y ruta
      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .select(`
          *,
          deudores!inner(nombre, apellido, cedula, telefono, direccion),
          rutas!inner(nombre_ruta, zona_geografica)
        `)
        .eq('id', id)
        .single()

      if (prestamoError) throw prestamoError

      setDetalle({
        id: prestamo.id,
        numero_prestamo: prestamo.numero_prestamo,
        monto_principal: prestamo.monto_principal,
        tasa_interes: prestamo.tasa_interes,
        valor_seguro: prestamo.valor_seguro || 0,
        periodicidad: prestamo.periodicidad,
        numero_cuotas: prestamo.numero_cuotas,
        valor_cuota: prestamo.valor_cuota,
        monto_total: prestamo.monto_total,
        fecha_desembolso: prestamo.fecha_desembolso,
        fecha_primer_pago: prestamo.fecha_primer_pago,
        estado: prestamo.estado,
        observaciones: prestamo.observaciones,
        cuotas_pagadas: prestamo.cuotas_pagadas || 0,
        saldo_pendiente: prestamo.saldo_pendiente || 0,
        cliente: prestamo.deudores,
        ruta: prestamo.rutas
      })

      // Obtener pagos del cronograma
      const { data: pagosData } = await supabase
        .from('pagos_recibidos')
        .select(`
          id,
          monto_pagado,
          fecha_pago,
          tipo_pago,
          observaciones,
          usuarios!pagos_recibidos_registrado_por_fkey(nombre, apellido)
        `)
        .eq('prestamo_id', id)
        .order('fecha_pago', { ascending: false })

      setPagos(pagosData?.map(p => ({
        id: p.id,
        monto_pagado: p.monto_pagado,
        fecha_pago: p.fecha_pago,
        tipo_pago: p.tipo_pago,
        observaciones: p.observaciones,
        cobrador: p.usuarios
      })) || [])

    } catch (err) {
      console.error('Error cargando detalle:', err)
      setError('Error al cargar los detalles del préstamo')
    } finally {
      setLoading(false)
    }
  }, [])

  // Solo cargar cuando el modal se abre con un ID válido
  useEffect(() => {
    if (open && prestamoId) {
      setActiveTab("credito")
      fetchDetalle(prestamoId)
    } else if (!open) {
      // Limpiar estado cuando se cierra
      setDetalle(null)
      setPagos([])
      setError(null)
    }
  }, [open, prestamoId, fetchDetalle])

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
      month: 'short',
      year: 'numeric'
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Activo</Badge>
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>
      case "pagado":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pagado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getPeriodicidadLabel = (periodicidad: string) => {
    const labels: Record<string, string> = {
      diario: "Diario",
      semanal: "Semanal",
      quincenal: "Quincenal",
      mensual: "Mensual"
    }
    return labels[periodicidad] || periodicidad
  }

  const getTipoPagoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      cuota_normal: "Cuota",
      pago_total: "Pago Total",
      abono_parcial: "Abono",
      adelanto: "Adelanto"
    }
    return labels[tipo] || tipo
  }

  // Funciones para editar seguro
  const iniciarEdicionSeguro = () => {
    if (detalle) {
      setValorSeguroTemp(detalle.valor_seguro.toString())
      setEditandoSeguro(true)
    }
  }

  const cancelarEdicionSeguro = () => {
    setEditandoSeguro(false)
    setValorSeguroTemp("")
  }

  const guardarSeguro = async () => {
    if (!detalle || !prestamoId) return

    const nuevoValor = parseFloat(valorSeguroTemp) || 0
    if (nuevoValor < 0) {
      toast({
        title: "Error",
        description: "El valor del seguro no puede ser negativo",
        variant: "destructive"
      })
      return
    }

    setGuardandoSeguro(true)
    try {
      const { error: updateError } = await supabase
        .from('prestamos')
        .update({ valor_seguro: nuevoValor })
        .eq('id', prestamoId)

      if (updateError) throw updateError

      // Actualizar estado local
      setDetalle({ ...detalle, valor_seguro: nuevoValor })
      setEditandoSeguro(false)
      toast({
        title: "Seguro actualizado",
        description: `El valor del seguro se actualizó a ${formatCurrency(nuevoValor)}`
      })
    } catch (err) {
      console.error('Error actualizando seguro:', err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor del seguro",
        variant: "destructive"
      })
    } finally {
      setGuardandoSeguro(false)
    }
  }

  // Calcular estadísticas
  const montoPagado = detalle ? detalle.monto_total - detalle.saldo_pendiente : 0
  const progreso = detalle ? (detalle.cuotas_pagadas / detalle.numero_cuotas) * 100 : 0

  // Calcular cuotas vencidas
  const calcularCuotasVencidas = useCallback(() => {
    if (!detalle) return 0
    if (!detalle.fecha_primer_pago || detalle.cuotas_pagadas >= detalle.numero_cuotas) return 0

    const fechaHoy = new Date()
    const fechaInicio = new Date(detalle.fecha_primer_pago)
    
    let diasEntreCuotas = 7
    switch (detalle.periodicidad) {
      case 'diario': diasEntreCuotas = 1; break
      case 'semanal': diasEntreCuotas = 7; break
      case 'quincenal': diasEntreCuotas = 15; break
      case 'mensual': diasEntreCuotas = 30; break
    }

    const diasTranscurridos = Math.floor((fechaHoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
    if (diasTranscurridos < 0) return 0

    const cuotasQueDeberianEstarPagadas = Math.floor(diasTranscurridos / diasEntreCuotas) + 1
    const cuotasPendientes = detalle.numero_cuotas - detalle.cuotas_pagadas
    const cuotasVencidas = Math.max(0, cuotasQueDeberianEstarPagadas - detalle.cuotas_pagadas)
    
    return Math.min(cuotasVencidas, cuotasPendientes)
  }, [detalle])

  const cuotasVencidas = calcularCuotasVencidas()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando...</span>
          </div>
        ) : error || !detalle ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Error al cargar el préstamo</p>
            <p className="text-sm text-muted-foreground mt-1">{error || 'No se encontró el préstamo'}</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <DialogTitle className="text-xl font-semibold">
                      {detalle.numero_prestamo}
                    </DialogTitle>
                    {getEstadoBadge(detalle.estado)}
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {detalle.ruta.nombre_ruta}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <User className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {detalle.cliente.nombre} {detalle.cliente.apellido}
                    </span>
                    <span>•</span>
                    <span>CC: {detalle.cliente.cedula.toLocaleString('es-CO')}</span>
                    {cuotasVencidas > 0 && (
                      <>
                        <span>•</span>
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          {cuotasVencidas} cuota{cuotasVencidas > 1 ? 's' : ''} vencida{cuotasVencidas > 1 ? 's' : ''}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso de pago</span>
                  <span className="font-medium">
                    {detalle.cuotas_pagadas} de {detalle.numero_cuotas} cuotas
                  </span>
                </div>
                <Progress value={progreso} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pagado: {formatCurrency(montoPagado)}</span>
                  <span>Saldo: {formatCurrency(detalle.saldo_pendiente)}</span>
                </div>
              </div>
            </DialogHeader>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-6">
                <TabsTrigger 
                  value="credito" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Información del Crédito
                </TabsTrigger>
                <TabsTrigger 
                  value="pagos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Historial de Pagos
                  {pagos.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {pagos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab: Información del Crédito */}
              <TabsContent value="credito" className="m-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-6 space-y-6">
                    {/* Resumen financiero */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary/5 rounded-lg p-4 text-center">
                        <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <p className="text-xs text-muted-foreground">Préstamo</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(detalle.monto_principal)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Interés</p>
                        <p className="text-lg font-bold">{(detalle.tasa_interes * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Banknote className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Total a Pagar</p>
                        <p className="text-lg font-bold">{formatCurrency(detalle.monto_total)}</p>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-4 text-center">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2 text-destructive" />
                        <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                        <p className="text-lg font-bold text-destructive">
                          {formatCurrency(detalle.saldo_pendiente)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Detalles del crédito */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Detalles del Crédito
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Valor Cuota</span>
                          <span className="font-medium">{formatCurrency(detalle.valor_cuota)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Valor Seguro</span>
                          {editandoSeguro ? (
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  value={valorSeguroTemp}
                                  onChange={(e) => setValorSeguroTemp(e.target.value)}
                                  className="w-28 h-7 text-sm pl-5 pr-2"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') guardarSeguro()
                                    if (e.key === 'Escape') cancelarEdicionSeguro()
                                  }}
                                />
                              </div>
                              <button
                                onClick={guardarSeguro}
                                disabled={guardandoSeguro}
                                className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
                                title="Guardar"
                              >
                                {guardandoSeguro ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelarEdicionSeguro}
                                disabled={guardandoSeguro}
                                className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors disabled:opacity-50"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="font-medium">{formatCurrency(detalle.valor_seguro)}</span>
                              <button
                                onClick={iniciarEdicionSeguro}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                title="Editar seguro"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Periodicidad</span>
                          <span className="font-medium">{getPeriodicidadLabel(detalle.periodicidad)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Número de Cuotas</span>
                          <span className="font-medium">{detalle.numero_cuotas}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Fecha Desembolso</span>
                          <span className="font-medium">{formatDate(detalle.fecha_desembolso)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-dashed">
                          <span className="text-muted-foreground">Primer Pago</span>
                          <span className="font-medium">{formatDate(detalle.fecha_primer_pago)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {detalle.observaciones && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Observaciones
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                          {detalle.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab: Historial de Pagos */}
              <TabsContent value="pagos" className="m-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-6">
                    {pagos.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No hay pagos registrados</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Los pagos aparecerán aquí cuando se registren
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Resumen de pagos */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span className="font-medium text-emerald-700">Total Pagado</span>
                            </div>
                            <span className="text-xl font-bold text-emerald-600">
                              {formatCurrency(montoPagado)}
                            </span>
                          </div>
                        </div>

                        {/* Tabla de pagos */}
                        <div className="border rounded-lg overflow-hidden">
                          {/* Header de la tabla */}
                          <div className="grid grid-cols-[40px_1fr_100px_80px_1fr] gap-2 items-center text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-2 border-b">
                            <div className="text-center">#</div>
                            <div>Fecha</div>
                            <div className="text-right">Monto</div>
                            <div className="text-center">Tipo</div>
                            <div>Observaciones</div>
                          </div>

                          {/* Filas de pagos */}
                          {pagos.map((pago, index) => (
                            <div 
                              key={pago.id} 
                              className="grid grid-cols-[40px_1fr_100px_80px_1fr] gap-2 items-center text-sm px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                            >
                              <div className="text-center text-xs text-muted-foreground font-medium">
                                {pagos.length - index}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{formatDate(pago.fecha_pago)}</span>
                              </div>
                              <div className="text-right font-semibold text-emerald-600">
                                {formatCurrency(pago.monto_pagado)}
                              </div>
                              <div className="text-center">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {getTipoPagoLabel(pago.tipo_pago)}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground truncate" title={pago.observaciones || '-'}>
                                {pago.observaciones || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/20 flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
