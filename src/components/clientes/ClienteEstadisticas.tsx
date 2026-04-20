import { Users, UserCheck, UserX, DollarSign, CreditCard } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ClienteEstadisticasSP } from "@/types/cliente"
import { formatCOP } from "@/lib/contabilidad-utils"
import { cn } from "@/lib/utils"

interface Props {
  estadisticas: ClienteEstadisticasSP | null
  loading: boolean
}

const stats = (e: ClienteEstadisticasSP) => [
  {
    label: "Total Clientes",
    value: e.total_clientes.toString(),
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Activos",
    value: e.clientes_activos.toString(),
    icon: UserCheck,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Morosos",
    value: e.clientes_morosos.toString(),
    icon: UserX,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    label: "Préstamos Activos",
    value: e.prestamos_activos.toString(),
    icon: CreditCard,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    label: "Deuda Total",
    value: formatCOP(e.deuda_total),
    icon: DollarSign,
    color: "text-warning",
    bg: "bg-warning/10",
  },
]

export default function ClienteEstadisticas({ estadisticas, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!estadisticas) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {stats(estadisticas).map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
            <s.icon className={cn("w-5 h-5", s.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{s.label}</p>
            <p className={cn("text-lg font-bold truncate", s.color)}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
