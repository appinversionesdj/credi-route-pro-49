import { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { PagoRegistrado } from '../../hooks/useDetallePrestamo'

interface HistorialPagosProps {
  pagos: PagoRegistrado[]
  onEliminarPago?: (pagoId: string) => Promise<void>
}

export function HistorialPagos({ pagos, onEliminarPago }: HistorialPagosProps) {
  const [pagoAEliminar, setPagoAEliminar] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'cuota_normal': 'Cuota',
      'abono_parcial': 'Abono',
      'pago_adelantado': 'Adelanto',
      'pago_total': 'Total'
    }
    return labels[tipo] || tipo
  }

  const handleEliminarClick = (pagoId: string) => {
    setPagoAEliminar(pagoId)
    setShowConfirmDialog(true)
  }

  const handleConfirmEliminar = async () => {
    if (pagoAEliminar && onEliminarPago) {
      await onEliminarPago(pagoAEliminar)
      setPagoAEliminar(null)
      setShowConfirmDialog(false)
    }
  }

  const handleCancelEliminar = () => {
    setPagoAEliminar(null)
    setShowConfirmDialog(false)
  }

  if (!pagos || pagos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hay pagos registrados
        </CardContent>
      </Card>
    )
  }

  const totalPagado = pagos.reduce((sum, pago) => sum + (pago.monto_pagado || 0), 0)

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 bg-muted/50 border-b">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Pagado</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(totalPagado)}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">Monto</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Registrado por</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Observaciones</th>
                {onEliminarPago && (
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, index) => (
                <tr key={pago.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm">{pagos.length - index}</td>
                  <td className="p-3 text-sm">
                    {formatDate(pago.fecha_pago)}
                    {pago.hora_pago && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {pago.hora_pago.substring(0, 5)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-right font-semibold text-green-600">
                    {formatCurrency(pago.monto_pagado)}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {getTipoLabel(pago.tipo_pago)}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">
                    {pago.cobrador ? (
                      `${pago.cobrador.nombre} ${pago.cobrador.apellido}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {pago.observaciones || '-'}
                  </td>
                  {onEliminarPago && (
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarClick(pago.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar pago"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelEliminar}
        onConfirm={handleConfirmEliminar}
        title="Eliminar Pago"
        description="¿Estás seguro de eliminar este pago? El saldo del préstamo aumentará y las cuotas pagadas disminuirán. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  )
}

