import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ClienteInsert, ClienteExtendido } from "@/types/cliente"
import { Loader2 } from "lucide-react"

interface FormularioClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cliente: ClienteInsert) => Promise<boolean>
  cliente?: ClienteExtendido | null
  loading?: boolean
}

export default function FormularioCliente({ 
  open, 
  onOpenChange, 
  onSubmit, 
  cliente = null,
  loading = false 
}: FormularioClienteProps) {
  const [formData, setFormData] = useState<ClienteInsert>({
    nombre: cliente?.nombre || "",
    apellido: cliente?.apellido || "",
    cedula: cliente?.cedula || 0,
    telefono: cliente?.telefono || "",
    direccion: cliente?.direccion || "",
    ocupacion: cliente?.ocupacion || "",
    estado: cliente?.estado || "activo",
    fecha_nacimiento: cliente?.fecha_nacimiento || "",
    referencias: cliente?.referencias || null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre?.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.apellido?.trim()) {
      newErrors.apellido = "El apellido es requerido"
    }

    if (!formData.cedula || formData.cedula <= 0) {
      newErrors.cedula = "La cédula es requerida y debe ser válida"
    }

    if (formData.telefono && !/^[0-9\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono debe contener solo números y caracteres válidos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const success = await onSubmit(formData)
    if (success) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      nombre: "",
      apellido: "",
      cedula: 0,
      telefono: "",
      direccion: "",
      ocupacion: "",
      estado: "activo",
      fecha_nacimiento: "",
      referencias: null
    })
    setErrors({})
    onOpenChange(false)
  }

  const handleInputChange = (field: keyof ClienteInsert, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ingresa el nombre"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre}</p>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange("apellido", e.target.value)}
                placeholder="Ingresa el apellido"
                className={errors.apellido ? "border-red-500" : ""}
              />
              {errors.apellido && (
                <p className="text-sm text-red-500">{errors.apellido}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cédula */}
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input
                id="cedula"
                type="number"
                value={formData.cedula || ""}
                onChange={(e) => handleInputChange("cedula", parseInt(e.target.value) || 0)}
                placeholder="Número de cédula"
                className={errors.cedula ? "border-red-500" : ""}
              />
              {errors.cedula && (
                <p className="text-sm text-red-500">{errors.cedula}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono || ""}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="Número de teléfono"
                className={errors.telefono ? "border-red-500" : ""}
              />
              {errors.telefono && (
                <p className="text-sm text-red-500">{errors.telefono}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado || "activo"}
                onValueChange={(value) => handleInputChange("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="moroso">Moroso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ocupación */}
            <div className="space-y-2">
              <Label htmlFor="ocupacion">Ocupación</Label>
              <Input
                id="ocupacion"
                value={formData.ocupacion || ""}
                onChange={(e) => handleInputChange("ocupacion", e.target.value)}
                placeholder="Ocupación del cliente"
              />
            </div>
          </div>

          {/* Fecha de Nacimiento */}
          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              value={formData.fecha_nacimiento || ""}
              onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion || ""}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              placeholder="Dirección completa del cliente"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {cliente ? "Actualizar" : "Crear"} Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
