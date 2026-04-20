import { useEffect, useState } from "react"
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, format, isToday, isSameDay,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft, ChevronRight, CalendarDays,
  TrendingUp, DollarSign, Clock, CheckCircle2,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresupuesto } from "@/hooks/usePresupuesto"
import { PresupuestoItem, PresupuestoRuta } from "@/types/presupuesto"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function weekStart(ref: Date) {
  return startOfWeek(ref, { weekStartsOn: 1 }) // Monday
}

/* ── Estado badge ─────────────────────────────────────────────────────────── */

const ESTADO_MAP: Record<string, { label: string; className: string }> = {
  pagado:        { label: "Pagado",        className: "bg-green-100 text-green-700 border-green-200" },
  parcial:       { label: "Parcial",       className: "bg-blue-100 text-blue-700 border-blue-200" },
  pendiente:     { label: "Pendiente",     className: "bg-orange-100 text-orange-700 border-orange-200" },
  no_programado: { label: "No programado", className: "bg-gray-100 text-gray-500 border-gray-200" },
}

function EstadoBadge({ estado }: { estado: PresupuestoItem["estado_pago"] }) {
  const cfg = ESTADO_MAP[estado ?? "no_programado"] ?? ESTADO_MAP.no_programado
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cfg.className)}>
      {cfg.label}
    </span>
  )
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */

interface KPIProps {
  label: string
  value: string
  icon: React.ReactNode
  sub?: string
  variant?: "default" | "success" | "warning" | "info"
}

function KPICard({ label, value, icon, sub, variant = "default" }: KPIProps) {
  const iconBg = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-600",
    warning: "bg-orange-100 text-orange-600",
    info:    "bg-blue-100 text-blue-600",
  }[variant]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Route row (accordion) ────────────────────────────────────────────────── */

function RutaCard({ ruta, items }: { ruta: PresupuestoRuta; items: PresupuestoItem[] }) {
  const [open, setOpen] = useState(false)
  const pendiente = ruta.presupuesto_total - ruta.recaudado

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn("transition-colors", open && "border-primary/40")}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-sm font-semibold truncate">{ruta.nombre_ruta}</CardTitle>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {ruta.cantidad_cuotas} cuota{ruta.cantidad_cuotas !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <Progress value={Math.min(ruta.porcentaje, 100)} className="h-1.5 mb-2" />

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="text-green-600 font-medium">✓ {formatCOP(ruta.recaudado)}</span>
                  <span>/ {formatCOP(ruta.presupuesto_total)}</span>
                  {pendiente > 0 && (
                    <span className="text-orange-500">Pendiente: {formatCOP(pendiente)}</span>
                  )}
                  <span className="ml-auto font-semibold text-foreground">{ruta.porcentaje.toFixed(1)}%</span>
                </div>
              </div>

              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0 pb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t bg-muted/30 text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Deudor</th>
                    <th className="text-right px-4 py-2 font-medium">Cuota</th>
                    <th className="text-right px-4 py-2 font-medium">Esperado</th>
                    <th className="text-right px-4 py-2 font-medium">Pagado</th>
                    <th className="text-center px-4 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted-foreground px-4">
                        Sin cuotas programadas para este día
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{item.deudor}</td>
                        <td className="px-4 py-2.5 text-right">{formatCOP(item.valor_cuota)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCOP(item.monto_esperado)}</td>
                        <td className={cn(
                          "px-4 py-2.5 text-right font-medium",
                          item.monto_pagado > 0 ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {formatCOP(item.monto_pagado)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <EstadoBadge estado={item.estado_pago} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

/* ── Skeletons ────────────────────────────────────────────────────────────── */

function KPISkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */

export default function Presupuesto() {
  const [weekRef, setWeekRef] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const { data, loading, error, fetchDia } = usePresupuesto()

  const weekDays = eachDayOfInterval({
    start: weekStart(weekRef),
    end:   endOfWeek(weekRef, { weekStartsOn: 1 }),
  })

  useEffect(() => {
    fetchDia(selectedDay)
  }, [selectedDay, fetchDia])

  const handlePrevWeek = () => {
    const prev = subWeeks(weekRef, 1)
    setWeekRef(prev)
    setSelectedDay(weekStart(prev))
  }

  const handleNextWeek = () => {
    const next = addWeeks(weekRef, 1)
    setWeekRef(next)
    setSelectedDay(weekStart(next))
  }

  const handleToday = () => {
    const today = new Date()
    setWeekRef(today)
    setSelectedDay(today)
  }

  const pendiente = data ? data.presupuesto_total - data.recaudado : 0

  /* Group items by ruta */
  const itemsByRuta: Record<string, PresupuestoItem[]> = {}
  if (data?.items) {
    for (const item of data.items) {
      if (!itemsByRuta[item.ruta_id]) itemsByRuta[item.ruta_id] = []
      itemsByRuta[item.ruta_id].push(item)
    }
  }

  const weekLabel = `${format(weekStart(weekRef), "d MMM", { locale: es })} – ${format(
    endOfWeek(weekRef, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es }
  )}`

  return (
    <div className="p-4 xl:p-6 space-y-4 xl:space-y-5 min-h-full bg-gradient-to-br from-background via-background to-muted/20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Presupuesto de Cobro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control de recaudo diario por ruta</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday} className="gap-1.5 self-start sm:self-auto">
          <CalendarDays className="w-4 h-4" />
          Hoy
        </Button>
      </div>

      {/* Week navigation */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium capitalize">{weekLabel}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const active = isSameDay(day, selectedDay)
              const todayMark = isToday(day)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className="uppercase font-medium" style={{ fontSize: "10px" }}>
                    {format(day, "EEE", { locale: es }).slice(0, 3)}
                  </span>
                  <span className={cn("text-base font-bold mt-0.5", todayMark && !active && "text-primary")}>
                    {format(day, "d")}
                  </span>
                  {todayMark && !active && (
                    <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day label */}
      <p className="text-sm font-medium text-muted-foreground capitalize">
        {format(selectedDay, "EEEE d 'de' MMMM yyyy", { locale: es })}
      </p>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <KPICard
              label="Presupuesto Total"
              value={data ? formatCOP(data.presupuesto_total) : "$0"}
              icon={<DollarSign className="w-5 h-5" />}
              sub={`${data?.rutas?.length ?? 0} rutas`}
            />
            <KPICard
              label="Recaudado"
              value={data ? formatCOP(data.recaudado) : "$0"}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              label="Pendiente"
              value={data ? formatCOP(Math.max(pendiente, 0)) : "$0"}
              icon={<Clock className="w-5 h-5" />}
              variant="warning"
            />
            <KPICard
              label="% Cumplimiento"
              value={data ? `${data.porcentaje.toFixed(1)}%` : "0%"}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="info"
              sub={data ? (data.porcentaje >= 100 ? "¡Meta alcanzada!" : "En progreso") : undefined}
            />
          </>
        )}
      </div>

      {/* Routes */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-56" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.rutas.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay cobros programados para este día</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.rutas.map((ruta) => (
            <RutaCard
              key={ruta.ruta_id}
              ruta={ruta}
              items={itemsByRuta[ruta.ruta_id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
