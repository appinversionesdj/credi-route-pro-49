import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRuta } from "@/hooks/useRutas"
import { KPICard } from "@/components/dashboard/KPICard"
import { CajaDesglose } from "@/components/rutas/CajaDesglose"
import { PrestamosRutaTable } from "@/components/rutas/PrestamosRutaTable"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  ArrowLeft,
  MapPin,
  User,
  DollarSign,
  Target,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Wallet,
  PlusCircle,
  Trash2,
  List,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

interface InversionRow {
  id: string
  ruta_id: string
  monto: number
  concepto: string | null
  fecha_inversion: string
  observaciones: string | null
  fecha_creacion: string
}

export default function DetalleRuta() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ruta, loading, error, refetch } = useRuta(id || "")
  const { toast } = useToast()
  const [openInversion, setOpenInversion] = useState(false)
  const [inversionForm, setInversionForm] = useState({
    monto: "",
    concepto: "",
    fecha_inversion: new Date().toISOString().split("T")[0],
    observaciones: "",
  })
  const [savingInversion, setSavingInversion] = useState(false)
  const [openListadoInversiones, setOpenListadoInversiones] = useState(false)
  const [inversiones, setInversiones] = useState<InversionRow[]>([])
  const [loadingInversiones, setLoadingInversiones] = useState(false)
  const [inversionAEliminar, setInversionAEliminar] = useState<InversionRow | null>(null)
  const [eliminandoInversion, setEliminandoInversion] = useState(false)

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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatDateRange = (fechaInicio: string, fechaFin: string) => {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    const diaInicio = inicio.getDate()
    const diaFin = fin.getDate()
    const mesInicio = inicio.toLocaleDateString('es-CO', { month: 'short' })
    const mesFin = fin.toLocaleDateString('es-CO', { month: 'short' })
    
    if (mesInicio === mesFin) {
      return `${diaInicio} - ${diaFin} ${mesInicio}`
    } else {
      return `${diaInicio} ${mesInicio} - ${diaFin} ${mesFin}`
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateRange(data.fechaInicio, data.fechaFin)}
          </p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium">{entry.name}:</span>
              </div>
              <span className="text-xs font-bold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case "activa":
        return "bg-green-100 text-green-800"
      case "inactiva":
        return "bg-gray-100 text-gray-800"
      case "suspendida":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const fetchInversiones = async () => {
    if (!id) return
    setLoadingInversiones(true)
    try {
      const { data, error } = await (supabase as any)
        .from("inversiones_ruta")
        .select("id, ruta_id, monto, concepto, fecha_inversion, observaciones, fecha_creacion")
        .eq("ruta_id", id)
        .order("fecha_inversion", { ascending: false })
      if (error) throw error
      setInversiones((data as InversionRow[]) || [])
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron cargar las inversiones.",
        variant: "destructive",
      })
    } finally {
      setLoadingInversiones(false)
    }
  }

  const handleOpenListadoInversiones = () => {
    setOpenListadoInversiones(true)
    fetchInversiones()
  }

  const handleEliminarInversion = async () => {
    if (!inversionAEliminar) return
    setEliminandoInversion(true)
    const idAEliminar = inversionAEliminar.id
    try {
      const { data, error } = await (supabase as any)
        .from("inversiones_ruta")
        .delete()
        .eq("id", idAEliminar)
        .select("id")
      if (error) throw error
      const seElimino = Array.isArray(data) && data.length > 0
      if (!seElimino) {
        toast({
          title: "No se pudo eliminar",
          description: "Solo un administrador puede eliminar inversiones.",
          variant: "destructive",
        })
        return
      }
      toast({ title: "Eliminado", description: "La inversión se eliminó correctamente." })
      setInversionAEliminar(null)
      setInversiones((prev) => prev.filter((i) => i.id !== idAEliminar))
      refetch()
    } catch (err: unknown) {
      console.error("Error al eliminar inversión:", err)
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : ""
      const esPermiso = /policy|row-level security|permiso|permission|denied|PGRST301/i.test(msg)
      const description = esPermiso
        ? "Solo un administrador puede eliminar inversiones."
        : (msg && msg.trim() ? msg : "No se pudo eliminar la inversión. Vuelve a intentar.")
      toast({
        title: "No se pudo eliminar",
        description,
        variant: "destructive",
      })
    } finally {
      setEliminandoInversion(false)
    }
  }

  const handleRegistrarInversion = async (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = Number(inversionForm.monto.replace(/\D/g, ""))
    if (!id || !montoNum || montoNum <= 0) {
      toast({
        title: "Datos incompletos",
        description: "Ingresa un monto válido.",
        variant: "destructive",
      })
      return
    }
    setSavingInversion(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Sesión",
          description: "Inicia sesión para registrar la inversión.",
          variant: "destructive",
        })
        return
      }
      // Tabla inversiones_ruta creada por migración; tipos aún no regenerados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("inversiones_ruta")
        .insert({
          ruta_id: id,
          monto: montoNum,
          concepto: inversionForm.concepto || null,
          fecha_inversion: inversionForm.fecha_inversion,
          observaciones: inversionForm.observaciones || null,
          creado_por: user.id,
        })
      if (insertError) throw insertError
      toast({
        title: "Inversión registrada",
        description: "El monto se guardó correctamente.",
      })
      setOpenInversion(false)
      setInversionForm({
        monto: "",
        concepto: "",
        fecha_inversion: new Date().toISOString().split("T")[0],
        observaciones: "",
      })
      refetch()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo registrar la inversión.",
        variant: "destructive",
      })
    } finally {
      setSavingInversion(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalle de ruta...</p>
        </div>
      </div>
    )
  }

  if (error || !ruta) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Error al cargar la ruta</p>
        <p className="text-muted-foreground mb-4">No se pudo obtener la información de la ruta</p>
        <Button onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>
      </div>
    )
  }

  // Datos de comparación por semana
  const datosComparacion = ruta.estadisticas.datosPorSemana || []

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/30 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{ruta.nombre_ruta}</h1>
              <Badge className={getEstadoColor(ruta.estado)}>
                {ruta.estado}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <p>{ruta.zona_geografica || 'Sin zona asignada'}</p>
              <span className="mx-2">•</span>
              <p className="text-sm">Creada el {formatDate(ruta.fecha_creacion || '')}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpenInversion(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar inversión
          </Button>
          <Button>
            <User className="w-4 h-4 mr-2" />
            Gestionar Cobrador
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cartera Total"
          value={formatCurrency(ruta.estadisticas.carteraTotal)}
          icon={DollarSign}
          description="Saldo pendiente"
          variant="success"
        />
        
        <KPICard
          title="Caja Actual"
          value={formatCurrency(ruta.estadisticas.caja || 0)}
          icon={Wallet}
          description={`Inversión: ${formatCurrency(ruta.inversion_ruta || 0)}`}
          variant={ruta.estadisticas.caja >= 0 ? "default" : "destructive"}
        />
        
        <KPICard
          title="Préstamos Activos"
          value={ruta.estadisticas.prestamosActivos}
          icon={CreditCard}
          description={`Total: ${ruta.estadisticas.totalPrestamos}`}
        />
        
        <KPICard
          title="Eficiencia de Cobro"
          value={formatPercent(ruta.estadisticas.eficienciaCobro)}
          icon={TrendingUp}
          description="Tasa de recaudo"
          variant="success"
        />
      </div>

      {/* Sección Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose de Caja - Ocupa 1 columna */}
        <div className="lg:col-span-1">
          <CajaDesglose
            inversion={ruta.inversion_ruta || 0}
            prestado={ruta.estadisticas.totalPrestado}
            seguros={ruta.estadisticas.segurosRecogidos}
            cobrados={ruta.estadisticas.totalCobrado}
            cartera={ruta.estadisticas.carteraTotal}
            gastos={ruta.estadisticas.totalGastos}
            onInversionClick={handleOpenListadoInversiones}
          />
        </div>

        {/* Gráfico de Distribución - Ocupa 2 columnas */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribución Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={datosComparacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="semana" 
                  tick={{ fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                />
                <Bar dataKey="invertido" fill="#3B82F6" name="Invertido" radius={[8, 8, 0, 0]} />
                <Bar dataKey="prestado" fill="#EF4444" name="Prestado" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cobrado" fill="#22C55E" name="Cobrado" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gastos" fill="#F59E0B" name="Gastos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Préstamos de la Ruta */}
      <PrestamosRutaTable rutaId={id || ""} />

      {/* Modal Listado de inversiones */}
      <Dialog open={openListadoInversiones} onOpenChange={setOpenListadoInversiones}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Inversiones registradas
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Solo los administradores pueden eliminar inversiones.
            </p>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0">
            {loadingInversiones ? (
              <div className="py-8 text-center text-muted-foreground">Cargando…</div>
            ) : inversiones.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No hay inversiones registradas.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inversiones.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{formatDate(inv.fecha_inversion)}</TableCell>
                      <TableCell>{inv.concepto || "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(inv.monto)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setInversionAEliminar(inv)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar inversión */}
      <AlertDialog open={!!inversionAEliminar} onOpenChange={(open) => !open && setInversionAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar inversión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar esta inversión de {inversionAEliminar ? formatCurrency(inversionAEliminar.monto) : ""}
              {inversionAEliminar?.concepto ? ` (${inversionAEliminar.concepto})` : ""}? El total de inversión de la ruta se actualizará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminandoInversion}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                await handleEliminarInversion()
              }}
              disabled={eliminandoInversion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminandoInversion ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Registrar inversión */}
      <Dialog open={openInversion} onOpenChange={setOpenInversion}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Registrar inversión
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegistrarInversion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto (COP) *</Label>
              <Input
                id="monto"
                placeholder="Ej: 500000"
                value={inversionForm.monto}
                onChange={(e) =>
                  setInversionForm((prev) => ({ ...prev, monto: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                placeholder="Ej: Inversión inicial, Refuerzo..."
                value={inversionForm.concepto}
                onChange={(e) =>
                  setInversionForm((prev) => ({ ...prev, concepto: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_inversion">Fecha</Label>
              <Input
                id="fecha_inversion"
                type="date"
                value={inversionForm.fecha_inversion}
                onChange={(e) =>
                  setInversionForm((prev) => ({
                    ...prev,
                    fecha_inversion: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Opcional"
                rows={2}
                value={inversionForm.observaciones}
                onChange={(e) =>
                  setInversionForm((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenInversion(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingInversion}>
                {savingInversion ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
