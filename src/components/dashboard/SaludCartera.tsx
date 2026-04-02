import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HeartPulse, ShieldAlert, Users, CreditCard } from 'lucide-react'
import { DashboardConsolidado } from '@/hooks/useDashboard'
import { formatCOP } from '@/lib/contabilidad-utils'
import { cn } from '@/lib/utils'

interface Props {
  consolidado: DashboardConsolidado
}

function MetricRow({
  label,
  value,
  pct,
  color,
  suffix = '%',
}: {
  label: string
  value: number
  pct: number
  color: string
  suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-semibold tabular-nums', color)}>
          {value}
          {suffix}
        </span>
      </div>
      <Progress
        value={Math.min(100, pct)}
        className="h-2"
        style={
          {
            '--progress-foreground': `hsl(var(${
              pct === 0
                ? '--success'
                : pct <= 20
                ? '--warning'
                : '--destructive'
            }))`,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

export function SaludCartera({ consolidado }: Props) {
  const {
    tasaMorosidad,
    prestamosActivos,
    prestamosVencidos,
    clientesActivos,
    cobros,
    cartera,
  } = consolidado

  const eficienciaCobro =
    cartera > 0 ? Math.round((cobros / (cartera * 0.1)) * 100) : 0 // rough estimate

  const totalPrestamos = prestamosActivos + prestamosVencidos
  const pctActivos = totalPrestamos > 0 ? Math.round((prestamosActivos / totalPrestamos) * 100) : 0
  const pctVencidos = totalPrestamos > 0 ? Math.round((prestamosVencidos / totalPrestamos) * 100) : 0

  return (
    <Card className="border-border/60 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-success" />
          </div>
          Salud de la Cartera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicador principal de morosidad */}
        <div
          className={cn(
            'rounded-xl p-4 border',
            tasaMorosidad === 0
              ? 'bg-success/5 border-success/20'
              : tasaMorosidad <= 15
              ? 'bg-warning/5 border-warning/20'
              : 'bg-destructive/5 border-destructive/20'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={cn(
                  'w-4 h-4',
                  tasaMorosidad === 0
                    ? 'text-success'
                    : tasaMorosidad <= 15
                    ? 'text-warning'
                    : 'text-destructive'
                )}
              />
              <span className="text-sm font-medium">Tasa de Morosidad</span>
            </div>
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                tasaMorosidad === 0
                  ? 'text-success'
                  : tasaMorosidad <= 15
                  ? 'text-warning'
                  : 'text-destructive'
              )}
            >
              {tasaMorosidad}%
            </span>
          </div>
          <Progress
            value={tasaMorosidad}
            className="h-2.5"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {tasaMorosidad === 0
              ? 'Cartera sana — Sin préstamos vencidos'
              : tasaMorosidad <= 15
              ? 'Nivel aceptable — Monitorear cobranza'
              : 'Alerta — Revisión urgente de cartera'}
          </p>
        </div>

        {/* Estado de préstamos */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Estado de Préstamos
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-center">
              <CreditCard className="w-4 h-4 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-success">{prestamosActivos}</p>
              <p className="text-xs text-muted-foreground">Al día</p>
            </div>
            <div
              className={cn(
                'border rounded-lg p-3 text-center',
                prestamosVencidos > 0
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-muted/20 border-border/40'
              )}
            >
              <ShieldAlert
                className={cn(
                  'w-4 h-4 mx-auto mb-1',
                  prestamosVencidos > 0 ? 'text-destructive' : 'text-muted-foreground'
                )}
              />
              <p
                className={cn(
                  'text-2xl font-bold',
                  prestamosVencidos > 0 ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {prestamosVencidos}
              </p>
              <p className="text-xs text-muted-foreground">Vencidos</p>
            </div>
          </div>
        </div>

        {/* Distribución visual */}
        {totalPrestamos > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Distribución
            </p>
            <div className="flex rounded-full overflow-hidden h-3">
              <div
                className="bg-success transition-all"
                style={{ width: `${pctActivos}%` }}
              />
              <div
                className="bg-destructive/70 transition-all"
                style={{ width: `${pctVencidos}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                Al día {pctActivos}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive/70 inline-block" />
                Vencidos {pctVencidos}%
              </span>
            </div>
          </div>
        )}

        {/* Clientes */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/40">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Clientes activos</span>
          </div>
          <span className="text-lg font-bold text-foreground">{clientesActivos}</span>
        </div>

        {/* Devolución de la ruta (Inversión Neta) */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Devolución de la ruta</span>
          </div>
          <span className="text-lg font-bold text-primary">{formatCOP(consolidado.devolucionRuta)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
