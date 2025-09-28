import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Search, 
  Plus, 
  Calculator, 
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  CreditCard
} from 'lucide-react'
import { useNuevoCredito } from '@/hooks/useNuevoCredito'
import { NuevoCreditoData, ClienteExistente } from '@/types/nuevoCredito'

interface FormularioNuevoCreditoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function FormularioNuevoCredito({ 
  open, 
  onOpenChange, 
  onSuccess 
}: FormularioNuevoCreditoProps) {
  const { 
    loading, 
    rutas, 
    cargarRutas, 
    buscarCliente, 
    calcularPrestamo, 
    crearCreditoCompleto 
  } = useNuevoCredito()

  const [step, setStep] = useState(1)
  const [clienteExistente, setClienteExistente] = useState<ClienteExistente | null>(null)
  const [busquedaCedula, setBusquedaCedula] = useState('')
  const [calculos, setCalculos] = useState<any>(null)

  const [formData, setFormData] = useState<NuevoCreditoData>({
    cliente: {
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      direccion: '',
      ocupacion: '',
      referencias: []
    },
    prestamo: {
      ruta_id: '',
      monto_principal: 0,
      tasa_interes: 20, // 20% por defecto
      valor_seguro: 0,
      periodicidad: '',
      numero_cuotas: 0, // En blanco por defecto
      fecha_desembolso: new Date().toISOString().split('T')[0],
      observaciones: ''
    }
  })

  // Función para formatear números de dinero
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Función para formatear números sin símbolo de moneda
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-CO').format(value)
  }

  // Función para parsear números desde string formateado
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/[^\d]/g, '')) || 0
  }

  // Función para manejar cambios en campos de dinero
  const handleMoneyChange = (field: string, value: string) => {
    const numericValue = parseNumber(value)
    updatePrestamo(field, numericValue)
    
    // Si es monto principal, calcular valor de seguro sugerido (10%)
    if (field === 'monto_principal') {
      updatePrestamo('valor_seguro', Math.round(numericValue * 0.1))
    }
  }

  // Función para obtener el valor formateado para mostrar
  const getFormattedValue = (value: number): string => {
    return value > 0 ? formatNumber(value) : ''
  }

  useEffect(() => {
    if (open) {
      cargarRutas()
      setStep(1)
      setClienteExistente(null)
      setBusquedaCedula('')
      setCalculos(null)
    }
  }, [open])

  const handleBuscarCliente = async () => {
    if (!busquedaCedula.trim()) return

    const cliente = await buscarCliente(busquedaCedula)
    if (cliente) {
      setClienteExistente(cliente)
      setFormData(prev => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          cedula: cliente.cedula.toString(),
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          ocupacion: cliente.ocupacion || '',
          referencias: cliente.referencias || []
        }
      }))
    } else {
      setClienteExistente(null)
      setFormData(prev => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          cedula: busquedaCedula,
          nombre: '',
          apellido: '',
          telefono: '',
          direccion: '',
          ocupacion: '',
          referencias: []
        }
      }))
    }
  }

  const handleCalcularPrestamo = () => {
    const calculosPrestamo = calcularPrestamo(formData.prestamo)
    setCalculos(calculosPrestamo)
  }

  const handleSubmit = async () => {
    const result = await crearCreditoCompleto(formData)
    if (result.success) {
      onSuccess?.()
      onOpenChange(false)
    }
  }

  const updateCliente = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [field]: value
      }
    }))
  }

  const updatePrestamo = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      prestamo: {
        ...prev.prestamo,
        [field]: value
      }
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Búsqueda de Cliente - Compacto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-blue-800">Buscar Cliente Existente</h3>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
             <Input
               placeholder="Cédula del cliente..."
               value={busquedaCedula}
               onChange={(e) => setBusquedaCedula(e.target.value)}
               className="h-9 text-left"
             />
          </div>
          <Button 
            onClick={handleBuscarCliente} 
            disabled={!busquedaCedula.trim()}
            size="sm"
          >
            <Search className="w-4 h-4 mr-1" />
            Buscar
          </Button>
        </div>

        {/* Resultado de búsqueda - Compacto */}
        {clienteExistente && (
          <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <Badge className="bg-green-200 text-green-800 text-xs">Encontrado</Badge>
            </div>
            <p className="text-sm mt-1">
              <strong>{clienteExistente.nombre} {clienteExistente.apellido}</strong> - CC: {clienteExistente.cedula?.toString()}
            </p>
          </div>
        )}

        {!clienteExistente && busquedaCedula && (
          <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-600" />
              <Badge className="bg-orange-200 text-orange-800 text-xs">Nuevo Cliente</Badge>
            </div>
            <p className="text-sm mt-1">Completa los datos para crear uno nuevo</p>
          </div>
        )}
      </div>

      {/* Información del Cliente - Compacto */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">Datos del Cliente</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nombre" className="text-xs">Nombre *</Label>
             <Input
               id="nombre"
               value={formData.cliente.nombre}
               onChange={(e) => updateCliente('nombre', e.target.value)}
               placeholder="Nombre"
               className="h-9 text-left"
             />
          </div>
          <div>
            <Label htmlFor="apellido" className="text-xs">Apellido *</Label>
            <Input
              id="apellido"
              value={formData.cliente.apellido}
              onChange={(e) => updateCliente('apellido', e.target.value)}
              placeholder="Apellido"
              className="h-9 text-left"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="telefono" className="text-xs">Teléfono</Label>
            <Input
              id="telefono"
              value={formData.cliente.telefono}
              onChange={(e) => updateCliente('telefono', e.target.value)}
              placeholder="300 123 4567"
              className="h-9 text-left"
            />
          </div>
          <div>
            <Label htmlFor="ocupacion" className="text-xs">Ocupación</Label>
            <Input
              id="ocupacion"
              value={formData.cliente.ocupacion}
              onChange={(e) => updateCliente('ocupacion', e.target.value)}
              placeholder="Comerciante, Empleado..."
              className="h-9 text-left"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="direccion" className="text-xs">Dirección</Label>
          <Textarea
            id="direccion"
            value={formData.cliente.direccion}
            onChange={(e) => updateCliente('direccion', e.target.value)}
            placeholder="Dirección completa..."
            rows={2}
            className="resize-none text-left"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Información Básica - Compacto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ruta" className="text-xs">Ruta de Cobro *</Label>
          <Select value={formData.prestamo.ruta_id} onValueChange={(value) => updatePrestamo('ruta_id', value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona ruta" />
            </SelectTrigger>
            <SelectContent>
              {rutas.map((ruta) => (
                <SelectItem key={ruta.id} value={ruta.id}>
                  {ruta.nombre_ruta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fecha" className="text-xs">Fecha Desembolso *</Label>
          <Input
            id="fecha"
            type="date"
            value={formData.prestamo.fecha_desembolso}
            onChange={(e) => updatePrestamo('fecha_desembolso', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Montos - Compacto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-blue-800 text-sm">Términos Financieros</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="monto" className="text-xs">Monto Principal *</Label>
           <Input
             id="monto"
             value={getFormattedValue(formData.prestamo.monto_principal)}
             onChange={(e) => handleMoneyChange('monto_principal', e.target.value)}
             placeholder="1.000.000"
             className="h-9 text-left font-mono"
           />
          </div>
          <div>
            <Label htmlFor="tasa" className="text-xs">Tasa Interés (%) *</Label>
            <Input
              id="tasa"
              type="number"
              step="0.01"
              value={formData.prestamo.tasa_interes}
              onChange={(e) => updatePrestamo('tasa_interes', Number(e.target.value))}
              placeholder="20.00"
              className="h-9 text-left font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label htmlFor="seguro" className="text-xs">Valor Seguro</Label>
            <Input
              id="seguro"
              value={getFormattedValue(formData.prestamo.valor_seguro)}
              onChange={(e) => handleMoneyChange('valor_seguro', e.target.value)}
              placeholder="100.000"
              className="h-9 text-left font-mono"
            />
          </div>
          <div>
            <Label htmlFor="cuotas" className="text-xs">Número Cuotas *</Label>
            <Input
              id="cuotas"
              type="number"
              value={formData.prestamo.numero_cuotas || ''}
              onChange={(e) => updatePrestamo('numero_cuotas', Number(e.target.value) || 0)}
              placeholder="12"
              min="1"
              className="h-9 text-left font-mono"
            />
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="periodicidad" className="text-xs">Periodicidad *</Label>
          <Select value={formData.prestamo.periodicidad} onValueChange={(value) => updatePrestamo('periodicidad', value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona periodicidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diario</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="quincenal">Quincenal</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3">
          <Label htmlFor="observaciones" className="text-xs">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.prestamo.observaciones}
            onChange={(e) => updatePrestamo('observaciones', e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={2}
            className="resize-none text-left"
          />
        </div>

      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      {calculos ? (
        <>
          {/* Resumen del Cliente - Compacto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-blue-800 text-sm">Cliente</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">{formData.cliente.nombre} {formData.cliente.apellido}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cédula:</span>
                <p className="font-mono">{formData.cliente.cedula?.toString()}</p>
              </div>
            </div>
          </div>

          {/* Cálculos Financieros - Compacto */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-green-600" />
              <h3 className="font-medium text-green-800 text-sm">Resumen Financiero</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Principal:</span>
                <span className="font-mono font-semibold">{formatCurrency(formData.prestamo.monto_principal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interés ({formData.prestamo.tasa_interes}%):</span>
                <span className="font-mono font-semibold">{formatCurrency(calculos.interes_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seguro (descontado):</span>
                <span className="font-mono font-semibold text-red-600">-{formatCurrency(formData.prestamo.valor_seguro || 0)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between bg-blue-100 rounded px-2 py-1">
                <span className="font-semibold text-blue-800">Entregado al Cliente:</span>
                <span className="font-mono font-bold text-blue-800">{formatCurrency(formData.prestamo.monto_principal - (formData.prestamo.valor_seguro || 0))}</span>
              </div>
              <div className="flex justify-between bg-green-100 rounded px-2 py-1">
                <span className="font-semibold text-green-800">Total a Cobrar:</span>
                <span className="font-mono font-bold text-green-800">{formatCurrency(calculos.monto_total)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Cuota:</span>
                  <span className="font-mono font-semibold">{formatCurrency(calculos.valor_cuota)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuotas:</span>
                  <span className="font-semibold">{formData.prestamo.numero_cuotas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primera Cuota:</span>
                  <span className="font-semibold">{new Date(calculos.fecha_primer_pago).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periodicidad:</span>
                  <span className="font-semibold capitalize">{formData.prestamo.periodicidad}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional - Compacto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Ruta:</span>
                <p className="font-medium">{rutas.find(r => r.id === formData.prestamo.ruta_id)?.nombre_ruta || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Desembolso:</span>
                <p className="font-medium">{new Date(formData.prestamo.fecha_desembolso).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
         <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
           <Calculator className="w-8 h-8 text-orange-600 mx-auto mb-2" />
           <h3 className="font-medium text-orange-800 mb-1">Cálculos Pendientes</h3>
           <p className="text-orange-700 text-sm">Completa el paso anterior para ver los cálculos</p>
         </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Crédito
          </DialogTitle>
          
          {/* Progress Steps - Compacto */}
          <div className="flex items-center justify-center space-x-3 mt-3">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-6 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step Content - Con scroll interno si es necesario */}
        <div className="flex-1 overflow-y-auto px-1">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter className="flex-shrink-0 flex justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} size="sm">
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancelar
            </Button>
             {step < 3 ? (
               <Button 
                 onClick={() => {
                   if (step === 2) {
                     // Calcular automáticamente al pasar del paso 2 al 3
                     const calculosPrestamo = calcularPrestamo(formData.prestamo)
                     setCalculos(calculosPrestamo)
                   }
                   setStep(step + 1)
                 }}
                 disabled={
                   step === 1 ? (!formData.cliente.nombre || !formData.cliente.apellido || !formData.cliente.cedula) :
                   step === 2 ? (!formData.prestamo.ruta_id || !formData.prestamo.monto_principal || !formData.prestamo.numero_cuotas || formData.prestamo.numero_cuotas <= 0) :
                   false
                 }
                 size="sm"
               >
                 Siguiente
               </Button>
             ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading || !calculos}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Crédito'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
