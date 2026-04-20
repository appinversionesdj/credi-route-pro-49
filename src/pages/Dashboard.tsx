import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, DollarSign, CreditCard, TrendingUp, Wallet, Receipt, Building2, BarChart3, ShieldCheck, CheckCircle2, ArrowDownRight, Gem, FileDown, Loader2 } from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { DashboardFiltros } from '@/components/dashboard/DashboardFiltros'
import { GraficoCarteraSemanal } from '@/components/dashboard/GraficoCarteraSemanal'
import { TablaPerformanceRutas } from '@/components/dashboard/TablaPerformanceRutas'
import { PyGSection } from '@/components/dashboard/PyGSection'
import { SaludCartera } from '@/components/dashboard/SaludCartera'
import { useDashboard, DashboardFiltros as Filtros } from '@/hooks/useDashboard'
import { formatCOP } from '@/lib/contabilidad-utils'
import { generarReportePDF } from '@/lib/reporte-pdf'

function KPISkeleton() {
  return (
    <div className="space-y-4">
      {/* Skeleton Fila 1 (Premium 4 cards) */}
      <div className="grid grid-cols-1">
        <Skeleton className="h-32 rounded-[22px]" />
      </div>

      {/* Skeleton Fila 2 (Operativa 4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toStr = (d: Date) => d.toISOString().split('T')[0]

  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: toStr(primerDiaMes),
    fechaFin: toStr(ultimoDiaMes),
    rutaIds: [],
  })

  const [exportando, setExportando] = useState(false)
  const { rutas, data, loading, loadingRutas, error, cargarDashboard } = useDashboard()

  // Cargar datos cuando cambian los filtros o cuando las rutas están listas
  useEffect(() => {
    if (!loadingRutas) {
      cargarDashboard(filtros)
    }
  }, [filtros, loadingRutas, cargarDashboard])

  const handleFiltroChange = (nuevosFiltros: Filtros) => {
    setFiltros(nuevosFiltros)
  }

  const handleExportarPDF = async () => {
    if (!data) return
    setExportando(true)
    try {
      const rutasNombres =
        filtros.rutaIds.length > 0
          ? rutas.filter((r) => filtros.rutaIds.includes(r.id)).map((r) => r.nombre_ruta)
          : []
      generarReportePDF(data, filtros, rutasNombres)
    } finally {
      setExportando(false)
    }
  }

  const c = data?.consolidado
  const numRutas =
    filtros.rutaIds.length > 0 ? filtros.rutaIds.length : rutas.length

  return (
    <div className="p-3 sm:p-4 xl:p-6 space-y-4 xl:space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-full overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtros.fechaInicio === filtros.fechaFin
              ? filtros.fechaInicio
              : `${filtros.fechaInicio} – ${filtros.fechaFin}`}
            {filtros.rutaIds.length > 0 && ` · ${filtros.rutaIds.length} ruta${filtros.rutaIds.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardFiltros
            rutas={rutas}
            filtros={filtros}
            onChange={handleFiltroChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={handleExportarPDF}
            disabled={!data || loading || exportando}
          >
            {exportando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {exportando ? 'Generando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      {loading || !c ? (
        <KPISkeleton />
      ) : (
        <>
          {/* Fila 1: Salud del Negocio (Premium) */}
          <div className="grid grid-cols-1 gap-4">
            {/* Grupo de Salud: Cartera, Caja y Préstamos (4 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4 p-1.5 rounded-[22px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10 shadow-2xl relative overflow-hidden group/container">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              <KPICard
                title="Cartera Total"
                value={formatCOP(c.cartera)}
                icon={DollarSign}
                description={`${c.prestamosActivos} préstamos activos`}
                variant="transparent-white"
                className="border-none shadow-none hover:bg-white/5"
              />
              <KPICard
                title="Caja Actual"
                value={formatCOP(c.cajaActual)}
                icon={Wallet}
                description="Liquidez histórica real"
                variant="transparent-white"
                className="border-none shadow-none hover:bg-white/5"
              />
              <KPICard
                title="Préstamos Realizados"
                value={c.prestamosRealizados.toString()}
                icon={CreditCard}
                description={`Valor: ${formatCOP(c.montoPrestado)}`}
                variant="transparent-white"
                className="border-none shadow-none hover:bg-white/5"
              />
              <KPICard
                title="Préstamos Pagados"
                value={c.prestamosPagados.toString()}
                icon={CheckCircle2}
                description={`Valor: ${formatCOP(c.montoPagado)}`}
                variant="transparent-white"
                className="border-none shadow-none hover:bg-white/5"
              />
            </div>
          </div>

          {/* Fila 2: Operativa e Ingresos (4 columnas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
            <KPICard
              title="Ingresos por Intereses"
              value={formatCOP(c.intereses)}
              icon={TrendingUp}
              description="Intereses recaudados"
              variant="default"
            />
            <KPICard
              title="Ingresos por Seguros"
              value={formatCOP(c.seguros)}
              icon={ShieldCheck}
              description="Seguros de préstamos"
              variant="default"
            />
            <KPICard
              title="Gastos Totales"
              value={formatCOP(c.totalGastos)}
              icon={Receipt}
              description="Operativos y admin."
              variant={c.totalGastos > 0 ? 'warning' : 'default'}
            />
            <KPICard
              title="Utilidad Neta"
              value={formatCOP(c.utilidadNeta)}
              icon={Gem}
              description="Antes de pagos a socios"
              variant="success"
            />
          </div>
        </>
      )}

      {/* ── Gráfico + Salud ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {loading || !data ? (
            <Skeleton className="h-[320px] xl:h-[440px] rounded-xl" />
          ) : (
            <GraficoCarteraSemanal datos={data.datosSemana} />
          )}
        </div>
        <div className="flex flex-col">
          {loading || !c ? (
            <Skeleton className="h-[320px] xl:h-[440px] rounded-xl" />
          ) : (
            <SaludCartera consolidado={c} />
          )}
        </div>
      </div>

      {/* ── Tabla de performance por ruta ─────────────────────────────────── */}
      {loading || !data ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <TablaPerformanceRutas datos={data.porRuta} />
      )}

      {/* ── PyG ────────────────────────────────────────────────────────────── */}
      {loading || !data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <PyGSection pyg={data.pyg} numRutas={numRutas} />
      )}
    </div>
  )
}
