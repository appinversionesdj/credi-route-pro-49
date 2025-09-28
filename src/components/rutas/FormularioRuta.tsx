import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Ruta, RutaInsert, RutaUpdate } from "@/types/ruta"
import { MapPin, FileText, Building } from "lucide-react"

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
    estado: "activa" as "activa" | "inactiva" | "suspendida"
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ruta) {
      setFormData({
        nombre_ruta: ruta.nombre_ruta,
        descripcion: ruta.descripcion || "",
        zona_geografica: ruta.zona_geografica || "",
        estado: ruta.estado
      })
    } else {
      setFormData({
        nombre_ruta: "",
        descripcion: "",
        zona_geografica: "",
        estado: "activa"
      })
    }
  }, [ruta, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre_ruta.trim()) {
      return
    }

    setLoading(true)
    try {
      const success = await onSave(formData)
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
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
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zona_geografica" className="text-sm font-medium">
              Zona Geográfica
            </Label>
            <Input
              id="zona_geografica"
              value={formData.zona_geografica}
              onChange={(e) => handleInputChange("zona_geografica", e.target.value)}
              placeholder="Ej: Centro, Norte, Sur, etc."
              className="h-11"
            />
          </div>

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
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Activa
                  </div>
                </SelectItem>
                <SelectItem value="inactiva">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                    Inactiva
                  </div>
                </SelectItem>
                <SelectItem value="suspendida">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Suspendida
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción adicional de la ruta..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
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
