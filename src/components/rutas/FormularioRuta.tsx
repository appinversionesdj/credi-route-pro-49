import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../integrations/supabase/client'
import { useToast } from '../../hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Loader2 } from 'lucide-react'

const rutaSchema = z.object({
  nombre_ruta: z.string().min(1, 'El nombre de la ruta es requerido'),
  descripcion: z.string().optional(),
  zona_geografica: z.string().optional(),
  estado: z.enum(['activa', 'inactiva']).default('activa'),
})

type RutaFormData = z.infer<typeof rutaSchema>

interface FormularioRutaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rutaId?: string
  onSuccess?: () => void
}

export function FormularioRuta({ open, onOpenChange, rutaId, onSuccess }: FormularioRutaProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<RutaFormData>({
    resolver: zodResolver(rutaSchema),
    defaultValues: {
      nombre_ruta: '',
      descripcion: '',
      zona_geografica: '',
      estado: 'activa',
    },
  })

  useEffect(() => {
    if (rutaId && open) {
      cargarRuta()
    } else if (!rutaId) {
      form.reset({
        nombre_ruta: '',
        descripcion: '',
        zona_geografica: '',
        estado: 'activa',
      })
    }
  }, [rutaId, open])

  const cargarRuta = async () => {
    try {
      const { data, error } = await supabase
        .from('rutas')
        .select('*')
        .eq('id', rutaId)
        .single()

      if (error) throw error

      form.reset({
        nombre_ruta: data.nombre_ruta,
        descripcion: data.descripcion || '',
        zona_geografica: data.zona_geografica || '',
        estado: data.estado as 'activa' | 'inactiva',
      })
    } catch (error) {
      console.error('Error cargando ruta:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la ruta",
        variant: "destructive"
      })
    }
  }

  const onSubmit = async (values: RutaFormData) => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (usuarioError || !usuarioData) {
        throw new Error('No se pudo obtener la empresa del usuario')
      }

      if (rutaId) {
        // Actualizar ruta existente
        const { error } = await supabase
          .from('rutas')
          .update({
            nombre_ruta: values.nombre_ruta,
            descripcion: values.descripcion,
            zona_geografica: values.zona_geografica,
            estado: values.estado,
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq('id', rutaId)

        if (error) throw error

        toast({
          title: "¡Ruta actualizada!",
          description: "La ruta ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva ruta
        const { error } = await supabase
          .from('rutas')
          .insert({
            nombre_ruta: values.nombre_ruta,
            descripcion: values.descripcion,
            zona_geografica: values.zona_geografica,
            estado: values.estado,
            empresa_id: usuarioData.empresa_id,
          })

        if (error) throw error

        toast({
          title: "¡Ruta creada!",
          description: "La ruta ha sido creada correctamente",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error guardando ruta:', error)
      toast({
        title: "Error",
        description: rutaId ? "No se pudo actualizar la ruta" : "No se pudo crear la ruta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {rutaId ? 'Editar Ruta' : 'Nueva Ruta'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_ruta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Ruta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Ruta Centro" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zona_geografica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona Geográfica</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Centro, Norte, Sur" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la ruta"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activa">Activa</SelectItem>
                      <SelectItem value="inactiva">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rutaId ? 'Actualizar' : 'Crear'} Ruta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}