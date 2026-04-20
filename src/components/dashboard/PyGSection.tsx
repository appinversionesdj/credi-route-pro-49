import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookOpen, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { ResultadoPyG } from '@/lib/contabilidad-utils'
import { formatCOPFull } from '@/lib/contabilidad-utils'
import { cn } from '@/lib/utils'

interface Props {
  pyg: ResultadoPyG
  numRutas: number
}

interface FilaPyGProps {
  label: string
  value: number
  tipo: 'ingreso' | 'gasto' | 'subtotal' | 'total' | 'movimiento'
  indent?: boolean
  signo?: '+' | '-'
}

function FilaPyG({ label, value, tipo, indent, signo }: FilaPyGProps) {
  const isPos = value > 0
  const isNeg = value < 0
  const isTotal = tipo === 'total' || tipo === 'subtotal'

  const textValue = (() => {
    if (tipo === 'ingreso') return `+${formatCOPFull(value)}`
    if (tipo === 'gasto' || tipo === 'movimiento') return `-${formatCOPFull(Math.abs(value))}`
    const s = isPos ? '+' : isNeg ? '' : ''
    return `${s}${formatCOPFull(value)}`
  })()

  const colorValue = (() => {
    if (tipo === 'ingreso') return 'text-success'
    if (tipo === 'gasto' || tipo === 'movimiento') return 'text-destructive/80'
    if (tipo === 'total') return isPos ? 'text-success font-bold' : isNeg ? 'text-destructive font-bold' : 'text-muted-foreground font-bold'
    if (tipo === 'subtotal') return isPos ? 'text-primary font-semibold' : isNeg ? 'text-destructive/90 font-semibold' : 'text-muted-foreground font-semibold'
    return 'text-foreground'
  })()

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-1 rounded-md transition-colors',
        indent && 'pl-6',
        isTotal && 'bg-muted/30 px-3 py-2.5 rounded-lg'
      )}
    >
      <div className="flex items-center gap-2">
        {tipo === 'ingreso' && (
          <ArrowUpRight className="w-3.5 h-3.5 text-success flex-shrink-0" />
        )}
        {(tipo === 'gasto' || tipo === 'movimiento') && (
          <ArrowDownRight className="w-3.5 h-3.5 text-destructive/70 flex-shrink-0" />
        )}
        {isTotal && <Minus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
        <span
          className={cn(
            'text-sm',
            isTotal ? 'font-semibold text-foreground' : 'text-muted-foreground',
            indent && 'text-sm'
          )}
        >
          {label}
        </span>
      </div>
      <span className={cn('text-sm tabular-nums', colorValue)}>{textValue}</span>
    </div>
  )
}

export function PyGSection({ pyg, numRutas }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          Estado de Pérdidas y Ganancias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Ingresos y Gastos */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Ingresos
            </p>
            <FilaPyG
              label="Intereses acumulados"
              value={pyg.interesesAcumulados}
              tipo="ingreso"
              indent
            />
            <FilaPyG
              label="Seguros cobrados"
              value={pyg.segurosCobrados}
              tipo="ingreso"
              indent
            />
            <div className="my-2">
              <FilaPyG
                label="Utilidad Bruta"
                value={pyg.utilidadBruta}
                tipo="subtotal"
              />
            </div>

            <Separator className="my-3" />

            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Gastos Operativos
            </p>
            {pyg.detalleGastos.length > 0 ? (
              pyg.detalleGastos.map((g, idx) => (
                <FilaPyG
                  key={`${g.nombre}-${idx}`}
                  label={g.nombre}
                  value={g.monto}
                  tipo="gasto"
                  indent
                />
              ))
            ) : (
              <div className="pl-6 py-2 text-sm text-muted-foreground italic">
                Sin gastos registrados
              </div>
            )}
          </div>

          {/* Columna derecha: Resultados */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Resultados
            </p>

            {/* Tarjeta Utilidad Bruta */}
            <div className="bg-muted/20 border border-border/40 rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Utilidad Bruta</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  pyg.utilidadBruta > 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {formatCOPFull(pyg.utilidadBruta)}
              </p>
            </div>

            <FilaPyG
              label="(−) Total Gastos Operativos"
              value={pyg.totalGastos}
              tipo="gasto"
            />

            {/* Tarjeta Utilidad Operativa */}
            <div className="bg-muted/20 border border-border/40 rounded-xl p-4 my-4">
              <p className="text-xs text-muted-foreground mb-1">Utilidad Operativa</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  pyg.utilidadOperativa > 0 ? 'text-primary' : 'text-destructive'
                )}
              >
                {formatCOPFull(pyg.utilidadOperativa)}
              </p>
            </div>

            {pyg.movimientosCapital > 0 && (
              <>
                <FilaPyG
                  label="(−) Movimientos de capital (dividendos / saldar ruta)"
                  value={pyg.movimientosCapital}
                  tipo="movimiento"
                />
                {pyg.detalleMovimientosCapital.map((m, idx) => (
                  <FilaPyG
                    key={`${m.nombre}-${idx}`}
                    label={m.nombre}
                    value={m.monto}
                    tipo="movimiento"
                    indent
                  />
                ))}
              </>
            )}

            {/* Tarjeta Utilidad Neta */}
            <div
              className={cn(
                'border-2 rounded-xl p-5 mt-4',
                pyg.utilidadNeta > 0
                  ? 'bg-success/5 border-success/30'
                  : 'bg-destructive/5 border-destructive/30'
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Utilidad Neta
              </p>
              <p
                className={cn(
                  'text-3xl font-bold',
                  pyg.utilidadNeta > 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {formatCOPFull(pyg.utilidadNeta)}
              </p>
              {pyg.utilidadBruta > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Margen:{' '}
                  {Math.round((pyg.utilidadNeta / pyg.utilidadBruta) * 100)}% de la utilidad bruta
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
