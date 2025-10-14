import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Ruta, RutaInsert, RutaUpdate } from "@/types/ruta"
import { MapPin, DollarSign, Info } from "lucide-react"

interface FormularioRutaProps {
  ruta?: Ruta
  isOpen: boolean
  onClose: () => void
  onSave: (data: RutaInsert | RutaUpdate) => Promise<boolean>
}

export function FormularioRuta({ ruta, isOpen, onClose, onSave }: FormularioRutaProps) {
  const [formData, setFormData] = useState({
    nombre_ruta: "",
    descripcion: "",
    zona_geografica: "",
    estado: "activa" as "activa" | "inactiva" | "suspendida",
    inversion_ruta: ""
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ruta) {
      setFormData({
        nombre_ruta: ruta.nombre_ruta,
        descripcion: ruta.descripcion || "",
        zona_geografica: ruta.zona_geografica || "",
        estado: (ruta.estado as "activa" | "inactiva" | "suspendida") || "activa",
        inversion_ruta: ruta.inversion_ruta ? ruta.inversion_ruta.toString() : ""
      })
    } else {
      setFormData({
        nombre_ruta: "",
        descripcion: "",
        zona_geografica: "",
        estado: "activa",
        inversion_ruta: ""
      })
    }
    setErrors({})
  }, [ruta, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre_ruta.trim()) {
      newErrors.nombre_ruta = "El nombre de la ruta es obligatorio"
    }

    if (formData.inversion_ruta && parseFloat(formData.inversion_ruta) < 0) {
      newErrors.inversion_ruta = "La inversión no puede ser negativa"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const dataToSave: any = {
        nombre_ruta: formData.nombre_ruta.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        zona_geografica: formData.zona_geografica.trim() || undefined,
        estado: formData.estado
      }

      // Incluir inversión solo si se proporcionó un valor
      if (formData.inversion_ruta && formData.inversion_ruta.trim() !== "") {
        dataToSave.inversion_ruta = parseFloat(formData.inversion_ruta)
      }

      const success = await onSave(dataToSave)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error("Error al guardar ruta:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar error del campo cuando el usuario edita
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleInversionChange = (value: string) => {
    // Permitir solo números y punto decimal
    const sanitized = value.replace(/[^\d.]/g, '')
    // Evitar múltiples puntos
    const parts = sanitized.split('.')
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
    
    handleInputChange('inversion_ruta', formatted)
  }

  const formatCurrency = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {ruta ? "Editar Ruta" : "Nueva Ruta"}
          </DialogTitle>
          <DialogDescription>
            {ruta 
              ? "Modifica la información de la ruta seleccionada."
              : "Crea una nueva ruta para organizar los préstamos por zona geográfica."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_ruta" className="text-sm font-medium">
              Nombre de la Ruta *
            </Label>
            <Input
              id="nombre_ruta"
              value={formData.nombre_ruta}
              onChange={(e) => handleInputChange("nombre_ruta", e.target.value)}
              placeholder="Ej: Ruta Centro, Ruta Norte, etc."
              className={`h-11 ${errors.nombre_ruta ? 'border-red-500' : ''}`}
            />
            {errors.nombre_ruta && (
              <p className="text-xs text-red-500">{errors.nombre_ruta}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zona_geografica" className="text-sm font-medium">
              Zona Geográfica
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="zona_geografica"
                value={formData.zona_geografica}
                onChange={(e) => handleInputChange("zona_geografica", e.target.value)}
                placeholder="Ej: Centro, Norte, Sur, Barrio X"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm font-medium">
                Estado
              </Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleInputChange("estado", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Activa
                    </div>
                  </SelectItem>
                  <SelectItem value="inactiva">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      Inactiva
                    </div>
                  </SelectItem>
                  <SelectItem value="suspendida">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      Suspendida
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inversion_ruta" className="text-sm font-medium">
                Inversión de Ruta
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inversion_ruta"
                  value={formData.inversion_ruta}
                  onChange={(e) => handleInversionChange(e.target.value)}
                  placeholder="0"
                  className={`h-11 pl-10 ${errors.inversion_ruta ? 'border-red-500' : ''}`}
                  type="text"
                  inputMode="decimal"
                />
              </div>
              {formData.inversion_ruta && !errors.inversion_ruta && (
                <p className="text-xs text-green-600 font-medium">
                  {formatCurrency(formData.inversion_ruta)}
                </p>
              )}
              {errors.inversion_ruta && (
                <p className="text-xs text-red-500">{errors.inversion_ruta}</p>
              )}
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>Inversión:</strong> Capital inicial de la ruta. Se usa para calcular la caja disponible.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.nombre_ruta.trim()}
              className="min-w-[100px]"
            >
              {loading ? "Guardando..." : ruta ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
