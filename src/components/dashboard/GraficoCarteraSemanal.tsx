import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DatosSemanaChart } from '@/lib/contabilidad-utils'
import { formatCOP } from '@/lib/contabilidad-utils'

interface Props {
  datos: DatosSemanaChart[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-card border border-border rounded-lg shadow-xl p-3 text-sm min-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 text-xs mb-1">
          <span style={{ color: entry.stroke || entry.fill }}>{entry.name}</span>
          <span className="font-medium text-foreground">{formatCOP(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function GraficoCarteraSemanal({ datos }: Props) {
  const hayDatos = datos.some(
    (d) => d.cobros > 0 || d.prestados > 0 || d.gastos > 0 || d.cartera > 0
  )

  return (
    <Card className="border-border/60 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Comportamiento de la Cartera
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" />
              Saldo Vivo
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[450px] p-0 pb-4">
        {!hayDatos ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sin datos en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCartera" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCOP(v)}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cartera"
                name="Saldo Vivo"
                stroke="hsl(var(--warning))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCartera)"
                dot={{ fill: 'hsl(var(--warning))', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
