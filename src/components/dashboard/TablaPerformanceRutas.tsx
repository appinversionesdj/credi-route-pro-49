import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LayoutGrid, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { DatosRutaDashboard } from '@/lib/contabilidad-utils'
import { formatCOP } from '@/lib/contabilidad-utils'
import { cn } from '@/lib/utils'

interface Props {
  datos: DatosRutaDashboard[]
}

type SortConfig = {
  key: keyof DatosRutaDashboard
  direction: 'asc' | 'desc'
}

function MorosidadBadge({ pct }: { pct: number }) {
  const colorClass = pct === 0 
    ? "bg-success/10 text-success border-success/20" 
    : pct <= 15 
    ? "bg-warning/10 text-warning border-warning/20" 
    : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium h-5", colorClass)}>
      {pct}%
    </Badge>
  )
}

function UtilCell({ value, max }: { value: number; max?: number }) {
  const isPos = value > 0
  const isNeg = value < 0
  const pct = max && max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        'font-semibold flex items-center gap-0.5 whitespace-nowrap',
        isPos && 'text-success',
        isNeg && 'text-destructive',
        !isPos && !isNeg && 'text-muted-foreground'
      )}>
        {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {formatCOP(value)}
      </div>
      {max && isPos && (
        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-success/60 transition-all duration-500" 
            style={{ width: `${pct}%` }} 
          />
        </div>
      )}
    </div>
  )
}

const cols = [
  { key: 'nombreRuta' as const, label: 'Ruta', align: 'left' },
  { key: 'cartera' as const, label: 'Cartera Total', align: 'right' },
  { key: 'cajaActual' as const, label: 'Caja Actual', align: 'right' },
  { key: 'inversionTotal' as const, label: 'Inversión Total', align: 'right' },
  { key: 'valorSaldado' as const, label: 'Saldado', align: 'right' },
  { key: 'montoPrestado' as const, label: 'P. Realizados', align: 'right' },
  { key: 'prestamosPagados' as const, label: 'P. Pagados', align: 'right' },
  { key: 'intereses' as const, label: 'Intereses', align: 'right' },
  { key: 'seguros' as const, label: 'Seguros', align: 'right' },
  { key: 'totalGastos' as const, label: 'Gastos', align: 'right' },
  { key: 'utilidadNeta' as const, label: 'Utilidad Neta', align: 'right' },
  { key: 'tasaMorosidad' as const, label: 'Morosidad', align: 'center' },
]

export function TablaPerformanceRutas({ datos }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'utilidadNeta', direction: 'desc' })

  const maxUtilidad = useMemo(() => Math.max(...datos.map(d => d.utilidadNeta), 0), [datos])

  const filteredAndSortedDatos = useMemo(() => {
    let result = [...datos]

    // Filtrar
    if (searchTerm) {
      result = result.filter(r => 
        r.nombreRuta.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenar
    result.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      const numA = Number(aVal) || 0
      const numB = Number(bVal) || 0

      return sortConfig.direction === 'asc' ? numA - numB : numB - numA
    })

    return result
  }, [datos, searchTerm, sortConfig])

  const handleSort = (key: keyof DatosRutaDashboard) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  if (datos.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No hay rutas seleccionadas
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-primary" />
          </div>
          Performance por Ruta
        </CardTitle>
        <div className="relative w-full sm:max-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ruta..."
            className="pl-9 h-9 text-xs bg-muted/30 focus-visible:bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-background shadow-sm">
              <tr className="bg-muted/40 backdrop-blur-md">
                {cols.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase whitespace-nowrap cursor-pointer transition-colors hover:text-foreground group',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.align === 'left' && 'text-left'
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center'
                    )}>
                      {col.label}
                      <span className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDatos.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron rutas con "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredAndSortedDatos.map((ruta, i) => (
                  <tr
                    key={ruta.rutaId}
                    className="border-b border-border/40 transition-colors hover:bg-primary/[0.02] last:border-0"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-background/50 backdrop-blur-sm z-[5]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="font-bold text-foreground text-xs">{ruta.nombreRuta}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground/90 tabular-nums">
                      {formatCOP(ruta.cartera)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={cn(ruta.cajaActual < 0 && "text-destructive")}>
                        {formatCOP(ruta.cajaActual)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-400 font-medium tabular-nums">
                      {formatCOP(ruta.inversionTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-400 font-medium tabular-nums">
                      {formatCOP(ruta.valorSaldado)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-foreground tabular-nums">
                        {formatCOP(ruta.montoPrestado)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">
                        {ruta.prestamosRealizados} <span className="font-normal">pts</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-foreground tabular-nums">
                        {formatCOP(ruta.montoPagado)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">
                        {ruta.prestamosPagados} <span className="font-normal">pts</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-success font-medium tabular-nums">
                      {formatCOP(ruta.intereses)}
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-500 font-medium tabular-nums">
                      {formatCOP(ruta.seguros)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-medium tabular-nums">
                      {formatCOP(ruta.totalGastos)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UtilCell value={ruta.utilidadNeta} max={maxUtilidad} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <MorosidadBadge pct={ruta.tasaMorosidad} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredAndSortedDatos.length > 1 && (
              <tfoot className="sticky bottom-0 z-10 bg-muted/90 backdrop-blur-md border-t-2 border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <tr>
                  <td className="px-4 py-3 font-bold text-foreground text-xs uppercase tracking-wider sticky left-0 z-10 bg-muted/90">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground/90 tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.cartera, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.cajaActual, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-400 tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.inversionTotal, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-400 tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.valorSaldado, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.montoPrestado, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.montoPagado, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-success tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.intereses, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-500 tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.seguros, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-muted-foreground tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.totalGastos, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatCOP(filteredAndSortedDatos.reduce((s, r) => s + r.utilidadNeta, 0))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
