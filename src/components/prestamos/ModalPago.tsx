import { useState } from 'react'
import { Calendar, DollarSign, CreditCard, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { CronogramaPago } from '../../hooks/useDetallePrestamo'
import { usePagos, PagoData } from '../../hooks/usePagos'

interface ModalPagoProps {
  isOpen: boolean
  onClose: () => void
  cuota: CronogramaPago | null
  prestamoId: string
  onPagoExitoso: () => void
}

export function ModalPago({ isOpen, onClose, cuota, prestamoId, onPagoExitoso }: ModalPagoProps) {
  const [formData, setFormData] = useState({
    valor_pagado: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo' as 'efectivo' | 'transferencia' | 'cheque' | 'otro',
    observaciones: '',
    recibo_numero: ''
  })
  
  const { registrarPago, loading } = usePagos()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'valor_pagado') {
      // Formatear como número
      const numericValue = value.replace(/[^\d]/g, '')
      setFormData(prev => ({ ...prev, [field]: numericValue }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const pagoData: PagoData = {
      prestamo_id: prestamoId,
      monto: Number(formData.valor_pagado),
      fecha_pago: formData.fecha_pago,
      metodo_pago: formData.metodo_pago,
      observaciones: formData.observaciones,
      recibo_numero: formData.recibo_numero
    }

    const success = await registrarPago(pagoData)
    
    if (success) {
      onPagoExitoso()
      onClose()
      // Reset form
      setFormData({
        valor_pagado: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        observaciones: '',
        recibo_numero: ''
      })
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({
      valor_pagado: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      observaciones: '',
      recibo_numero: ''
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información de la cuota (solo si hay cuota específica) */}
          {cuota && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Cuota:</span>
                  <span className="font-medium ml-1">#{cuota.numero_cuota}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium ml-1">{formatCurrency(cuota.valor_cuota)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Vence:</span>
                  <span className="font-medium ml-1">
                    {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Información general del préstamo (si no hay cuota específica) */}
          {!cuota && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Pago General del Préstamo</p>
                <p>El pago se aplicará automáticamente a las cuotas más antiguas primero.</p>
              </div>
            </div>
          )}

          {/* Formulario de pago */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="valor_pagado" className="text-xs">Valor a Pagar *</Label>
              <Input
                id="valor_pagado"
                value={formData.valor_pagado ? Number(formData.valor_pagado).toLocaleString('es-CO') : ''}
                onChange={(e) => handleInputChange('valor_pagado', e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fecha_pago" className="text-xs">Fecha *</Label>
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => handleInputChange('fecha_pago', e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="metodo_pago" className="text-xs">Método *</Label>
                <Select
                  value={formData.metodo_pago}
                  onValueChange={(value) => handleInputChange('metodo_pago', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="recibo_numero" className="text-xs">Número de Recibo</Label>
              <Input
                id="recibo_numero"
                value={formData.recibo_numero}
                onChange={(e) => handleInputChange('recibo_numero', e.target.value)}
                placeholder="Opcional"
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="observaciones" className="text-xs">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={handleClose} size="sm" className="h-8">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.valor_pagado} size="sm" className="h-8">
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
