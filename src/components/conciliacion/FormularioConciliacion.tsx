import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormularioConciliacion, BaseDiaria } from '@/types/conciliacion'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const formSchema = z.object({
  base_diaria_id: z.string().min(1, 'Debe seleccionar una base diaria'),
  monto_base_entregado: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  total_seguros: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  dinero_efectivamente_devuelto: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  observaciones_cierre: z.string().optional(),
  justificacion_diferencia: z.string().optional(),
  persona_entrega_base: z.string().optional(),
  nombre_persona_entrega: z.string().optional()
})

interface FormularioConciliacionProps {
  onSubmit: (datos: FormularioConciliacion) => Promise<void>
  baseDiariaSeleccionada?: BaseDiaria
  valoresIniciales?: Partial<FormularioConciliacion>
}

export function FormularioConciliacion({
  onSubmit,
  baseDiariaSeleccionada,
  valoresIniciales
}: FormularioConciliacionProps) {
  const [loading, setLoading] = useState(false)
  const [basesDiarias, setBasesDiarias] = useState<BaseDiaria[]>([])
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nombre: string; apellido: string }>>([])
  const [calculando, setCalculando] = useState(false)
  const [datosCalculados, setDatosCalculados] = useState<{
    cobros: number
    prestamos: number
    gastos: number
    teorico: number
    diferencia: number
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      base_diaria_id: baseDiariaSeleccionada?.id || valoresIniciales?.base_diaria_id || '',
      monto_base_entregado: baseDiariaSeleccionada?.monto_base_entregado || valoresIniciales?.monto_base_entregado || 0,
      total_seguros: valoresIniciales?.total_seguros || 0,
      dinero_efectivamente_devuelto: valoresIniciales?.dinero_efectivamente_devuelto || 0,
      observaciones_cierre: valoresIniciales?.observaciones_cierre || '',
      justificacion_diferencia: valoresIniciales?.justificacion_diferencia || '',
      persona_entrega_base: valoresIniciales?.persona_entrega_base || '',
      nombre_persona_entrega: valoresIniciales?.nombre_persona_entrega || ''
    }
  })

  // Cargar bases diarias disponibles
  useEffect(() => {
    async function cargarBasesDiarias() {
      const { data } = await supabase
        .from('base_diaria_cobradores')
        .select(`
          *,
          cobrador:usuarios!base_diaria_cobradores_cobrador_id_fkey(nombre, apellido),
          ruta:rutas(nombre_ruta),
          conciliacion:conciliacion_diaria!conciliacion_diaria_base_diaria_id_fkey(id)
        `)
        .in('estado', ['finalizado', 'en_ruta'])
        .order('fecha', { ascending: false })

      // Filtrar las que no tienen conciliación
      const basesSinConciliacion = data?.filter(base => !base.conciliacion || base.conciliacion.length === 0) || []
      setBasesDiarias(basesSinConciliacion as any)
    }

    cargarBasesDiarias()
  }, [])

  // Cargar usuarios para el selector de persona que entrega
  useEffect(() => {
    async function cargarUsuarios() {
      const { data } = await supabase
        .from('usuarios')
        .select('user_id, nombre, apellido')
        .eq('estado', 'activo')
        .order('nombre')

      if (data) {
        setUsuarios(data.map(u => ({ id: u.user_id, nombre: u.nombre, apellido: u.apellido })))
      }
    }

    cargarUsuarios()
  }, [])

  // Calcular totales cuando cambia la base diaria seleccionada
  const calcularTotales = async (baseDiariaId: string) => {
    if (!baseDiariaId) return

    setCalculando(true)
    try {
      const { data: baseDiaria } = await supabase
        .from('base_diaria_cobradores')
        .select('*')
        .eq('id', baseDiariaId)
        .single()

      if (!baseDiaria) return

      // Calcular cobros
      const { data: pagosData } = await supabase
        .from('pagos_recibidos')
        .select(`
          monto_pagado,
          prestamo:prestamos!inner(ruta_id)
        `)
        .eq('fecha_pago', baseDiaria.fecha)
        .eq('prestamo.ruta_id', baseDiaria.ruta_id)
        .eq('estado', 'activo')

      const totalCobros = pagosData?.reduce((sum, pago) => sum + Number(pago.monto_pagado), 0) || 0

      // Calcular préstamos nuevos
      const { data: prestamosData } = await supabase
        .from('prestamos')
        .select('monto_principal')
        .eq('fecha_desembolso', baseDiaria.fecha)
        .eq('ruta_id', baseDiaria.ruta_id)

      const totalPrestamos = prestamosData?.reduce((sum, p) => sum + Number(p.monto_principal), 0) || 0

      // Calcular gastos aprobados
      const { data: gastosData } = await supabase
        .from('gastos_diarios')
        .select('monto, estado_aprobacion')
        .eq('fecha_gasto', baseDiaria.fecha)
        .eq('ruta_id', baseDiaria.ruta_id)

      const totalGastos = gastosData?.filter(g => g.estado_aprobacion === 'aprobado')
        .reduce((sum, g) => sum + Number(g.monto), 0) || 0

      // Actualizar monto base en el formulario
      form.setValue('monto_base_entregado', Number(baseDiaria.monto_base_entregado))

      // Calcular teórico
      const seguros = form.getValues('total_seguros')
      const teorico = Number(baseDiaria.monto_base_entregado) + totalCobros + seguros - totalPrestamos - totalGastos
      const devuelto = form.getValues('dinero_efectivamente_devuelto')
      const diferencia = devuelto - teorico

      setDatosCalculados({
        cobros: totalCobros,
        prestamos: totalPrestamos,
        gastos: totalGastos,
        teorico,
        diferencia
      })
    } catch (error) {
      console.error('Error al calcular totales:', error)
    } finally {
      setCalculando(false)
    }
  }

  // Recalcular cuando cambian los valores
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.base_diaria_id) {
        const seguros = values.total_seguros || 0
        const devuelto = values.dinero_efectivamente_devuelto || 0
        const base = values.monto_base_entregado || 0

        if (datosCalculados) {
          const teorico = base + datosCalculados.cobros + seguros - datosCalculados.prestamos - datosCalculados.gastos
          const diferencia = devuelto - teorico

          setDatosCalculados({
            ...datosCalculados,
            teorico,
            diferencia
          })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form, datosCalculados])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      await onSubmit(values as FormularioConciliacion)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Selección de base diaria */}
        <Card>
          <CardHeader>
            <CardTitle>Base Diaria</CardTitle>
            <CardDescription>
              Seleccione la base diaria que desea conciliar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="base_diaria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Diaria *</FormLabel>
                  <Select
                    disabled={!!baseDiariaSeleccionada}
                    onValueChange={(value) => {
                      field.onChange(value)
                      calcularTotales(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una base diaria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {basesDiarias.map((base: any) => (
                        <SelectItem key={base.id} value={base.id}>
                          {new Date(base.fecha).toLocaleDateString('es-CO')} - {base.cobrador?.nombre} {base.cobrador?.apellido} - {base.ruta?.nombre_ruta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Datos de la conciliación */}
        {calculando && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {datosCalculados && !calculando && (
          <>
            {/* Resumen de movimientos */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Movimientos del Día</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Entregada</p>
                    <p className="text-lg font-semibold">{formatCurrency(form.getValues('monto_base_entregado'))}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cobros Realizados</p>
                    <p className="text-lg font-semibold text-green-600">+{formatCurrency(datosCalculados.cobros)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Préstamos Nuevos</p>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(datosCalculados.prestamos)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gastos Aprobados</p>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(datosCalculados.gastos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de conciliación */}
            <Card>
              <CardHeader>
                <CardTitle>Datos de Conciliación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="total_seguros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Seguros Cobrados *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Total de seguros cobrados durante el día
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dinero_efectivamente_devuelto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dinero Efectivamente Devuelto *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Cantidad de dinero que el cobrador devolvió físicamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="persona_entrega_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona que Entrega la Base</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          const usuario = usuarios.find(u => u.id === value)
                          if (usuario) {
                            form.setValue('nombre_persona_entrega', `${usuario.nombre} ${usuario.apellido}`)
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usuarios.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.nombre} {usuario.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Supervisor o persona que entregó la base al cobrador
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Resultado de la conciliación */}
            <Card>
              <CardHeader>
                <CardTitle>Resultado de la Conciliación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Dinero Teórico a Devolver</p>
                    <p className="text-lg font-semibold">{formatCurrency(datosCalculados.teorico)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Diferencia</p>
                    <p className={`text-2xl font-bold ${
                      datosCalculados.diferencia === 0 ? 'text-green-600' :
                      datosCalculados.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {datosCalculados.diferencia > 0 && '+'}
                      {formatCurrency(datosCalculados.diferencia)}
                    </p>
                  </div>
                </div>

                {datosCalculados.diferencia !== 0 && (
                  <Alert variant={datosCalculados.diferencia > 0 ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {datosCalculados.diferencia > 0 ? (
                        <>
                          <TrendingUp className="inline w-4 h-4 mr-1" />
                          Hay un sobrante de {formatCurrency(datosCalculados.diferencia)}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="inline w-4 h-4 mr-1" />
                          Falta dinero por {formatCurrency(Math.abs(datosCalculados.diferencia))}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="justificacion_diferencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificación de la Diferencia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explique el motivo de la diferencia..."
                          className="resize-none"
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
                  name="observaciones_cierre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones de Cierre</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observaciones adicionales sobre la conciliación..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={loading || !datosCalculados}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Conciliación
          </Button>
        </div>
      </form>
    </Form>
  )
}

