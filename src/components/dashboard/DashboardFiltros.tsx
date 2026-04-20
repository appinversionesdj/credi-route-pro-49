import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { Check, ChevronDown, CalendarDays, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { DashboardFiltros, RutaSimple } from '@/hooks/useDashboard'

interface Props {
  rutas: RutaSimple[]
  filtros: DashboardFiltros
  onChange: (filtros: DashboardFiltros) => void
}

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function labelRango(fechaInicio: string, fechaFin: string): string {
  try {
    const desde = new Date(fechaInicio + 'T12:00:00')
    const hasta = new Date(fechaFin + 'T12:00:00')
    const mismoanio = desde.getFullYear() === hasta.getFullYear()
    const mismomes = mismoanio && desde.getMonth() === hasta.getMonth()

    if (mismomes && desde.getDate() === 1) {
      // Mes completo
      const lastDay = new Date(hasta.getFullYear(), hasta.getMonth() + 1, 0).getDate()
      if (hasta.getDate() === lastDay) {
        return format(desde, 'MMMM yyyy', { locale: es })
      }
    }
    const fmtDesde = mismoanio
      ? format(desde, "d 'de' MMM", { locale: es })
      : format(desde, "d MMM yyyy", { locale: es })
    const fmtHasta = format(hasta, "d 'de' MMM yyyy", { locale: es })
    return `${fmtDesde} – ${fmtHasta}`
  } catch {
    return `${fechaInicio} – ${fechaFin}`
  }
}

export function DashboardFiltros({ rutas, filtros, onChange }: Props) {
  const [openCal, setOpenCal] = useState(false)
  const [openRutas, setOpenRutas] = useState(false)

  const rangoLocal: DateRange = {
    from: new Date(filtros.fechaInicio + 'T12:00:00'),
    to: new Date(filtros.fechaFin + 'T12:00:00'),
  }

  const handleRangoChange = (range: DateRange | undefined) => {
    if (!range?.from) return
    const desde = toDateStr(range.from)
    const hasta = range.to ? toDateStr(range.to) : desde
    onChange({ ...filtros, fechaInicio: desde, fechaFin: hasta })
    if (range.from && range.to) setOpenCal(false)
  }

  const toggleRuta = (id: string) => {
    const next = filtros.rutaIds.includes(id)
      ? filtros.rutaIds.filter((r) => r !== id)
      : [...filtros.rutaIds, id]
    onChange({ ...filtros, rutaIds: next })
  }

  const clearRutas = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ ...filtros, rutaIds: [] })
  }

  const rutasSeleccionadas = filtros.rutaIds.length

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ── Date Range Picker ─────────────────────────────────────────────── */}
      <Popover open={openCal} onOpenChange={setOpenCal}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-sm font-normal justify-start"
          >
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {labelRango(filtros.fechaInicio, filtros.fechaFin)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 shadow-xl"
          align="start"
          sideOffset={6}
        >
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Selecciona el rango de fechas
            </p>
          </div>

          <Calendar
            mode="range"
            selected={rangoLocal}
            onSelect={handleRangoChange}
            numberOfMonths={2}
            locale={es}
            defaultMonth={rangoLocal.from}
          />

          {/* Accesos rápidos */}
          <div className="border-t border-border p-3 flex flex-wrap gap-2">
            {[
              {
                label: 'Este mes',
                fn: () => {
                  const hoy = new Date()
                  const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
                  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
                  onChange({ ...filtros, fechaInicio: toDateStr(ini), fechaFin: toDateStr(fin) })
                  setOpenCal(false)
                },
              },
              {
                label: 'Mes anterior',
                fn: () => {
                  const hoy = new Date()
                  const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
                  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
                  onChange({ ...filtros, fechaInicio: toDateStr(ini), fechaFin: toDateStr(fin) })
                  setOpenCal(false)
                },
              },
              {
                label: 'Últimos 7 días',
                fn: () => {
                  const hoy = new Date()
                  const ini = new Date(hoy)
                  ini.setDate(hoy.getDate() - 6)
                  onChange({ ...filtros, fechaInicio: toDateStr(ini), fechaFin: toDateStr(hoy) })
                  setOpenCal(false)
                },
              },
              {
                label: 'Últimos 30 días',
                fn: () => {
                  const hoy = new Date()
                  const ini = new Date(hoy)
                  ini.setDate(hoy.getDate() - 29)
                  onChange({ ...filtros, fechaInicio: toDateStr(ini), fechaFin: toDateStr(hoy) })
                  setOpenCal(false)
                },
              },
              {
                label: 'Este año',
                fn: () => {
                  const hoy = new Date()
                  const ini = new Date(hoy.getFullYear(), 0, 1)
                  const fin = new Date(hoy.getFullYear(), 11, 31)
                  onChange({ ...filtros, fechaInicio: toDateStr(ini), fechaFin: toDateStr(fin) })
                  setOpenCal(false)
                },
              },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={preset.fn}
                className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border" />

      {/* ── Multi-select Rutas ────────────────────────────────────────────── */}
      <Popover open={openRutas} onOpenChange={setOpenRutas}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-sm font-normal"
          >
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            {rutasSeleccionadas === 0 ? (
              <span className="text-muted-foreground">Todas las rutas</span>
            ) : (
              <span>
                {rutasSeleccionadas} ruta{rutasSeleccionadas > 1 ? 's' : ''}
              </span>
            )}
            {rutasSeleccionadas > 0 ? (
              <span
                role="button"
                onClick={clearRutas}
                className="ml-1 rounded-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive p-0.5"
              >
                <X className="w-3 h-3" />
              </span>
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar ruta..." className="h-8" />
            <CommandList>
              <CommandEmpty>No se encontraron rutas.</CommandEmpty>
              <CommandGroup>
                {rutas.map((ruta) => {
                  const selected = filtros.rutaIds.includes(ruta.id)
                  return (
                    <CommandItem
                      key={ruta.id}
                      onSelect={() => toggleRuta(ruta.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded border',
                          selected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="truncate">{ruta.nombre_ruta}</span>
                      {ruta.estado === 'inactiva' && (
                        <Badge variant="outline" className="ml-auto text-[10px] py-0">
                          inactiva
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Tags de rutas seleccionadas */}
      {rutasSeleccionadas > 0 && rutasSeleccionadas <= 3 && (
        <div className="flex gap-1.5 flex-wrap">
          {filtros.rutaIds.map((id) => {
            const ruta = rutas.find((r) => r.id === id)
            return ruta ? (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => toggleRuta(id)}
              >
                {ruta.nombre_ruta}
                <X className="w-2.5 h-2.5" />
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
