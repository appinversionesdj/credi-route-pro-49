import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  User,
  FileImage,
  Home,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { ClienteTablaRow } from "@/types/cliente"
import { buildFotoUrl } from "@/hooks/useClientes"
import { formatCOP } from "@/lib/contabilidad-utils"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

interface Props {
  clientes: ClienteTablaRow[]
  onEdit: (cliente: ClienteTablaRow) => void
  onDelete: (id: string) => void
}

type SortKey = keyof Pick<ClienteTablaRow, "nombre" | "cedula" | "estado" | "prestamos_activos" | "total_deuda">

function EstadoBadge({ estado }: { estado: string | null }) {
  switch (estado) {
    case "activo":
      return <Badge className="bg-success/10 text-success border-success/20" variant="outline">Activo</Badge>
    case "moroso":
      return <Badge variant="destructive">Moroso</Badge>
    case "bloqueado":
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20" variant="outline">Bloqueado</Badge>
    case "inactivo":
      return <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
    default:
      return <Badge variant="outline" className="text-muted-foreground">{estado ?? "—"}</Badge>
  }
}

function Avatar({ url, nombre }: { url: string | null; nombre: string }) {
  const fotoUrl = buildFotoUrl(url)
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <User className="w-4 h-4 text-primary" />
    </div>
  )
}

function FotoDoc({ path, label, icon: Icon }: { path: string | null; label: string; icon: React.ElementType }) {
  const url = buildFotoUrl(path)
  if (!url) {
    return (
      <div className="w-8 h-8 rounded border border-dashed border-border/50 flex items-center justify-center" title={`Sin ${label}`}>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/30" />
      </div>
    )
  }
  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>
        <img
          src={url}
          alt={label}
          className="w-8 h-8 rounded object-cover border border-border cursor-pointer hover:scale-110 hover:shadow-md transition-all"
        />
      </HoverCardTrigger>
      <HoverCardContent side="left" className="p-2 w-auto shadow-xl">
        <img src={url} alt={label} className="max-w-[220px] max-h-[220px] rounded object-contain" />
        <p className="text-[11px] text-center mt-1.5 text-muted-foreground font-medium">{label}</p>
      </HoverCardContent>
    </HoverCard>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
  return dir === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
}

const sortableCols: { key: SortKey; label: string }[] = [
  { key: "nombre",            label: "Cliente"    },
  { key: "cedula",            label: "Cédula"     },
  { key: "estado",            label: "Estado"     },
  { key: "prestamos_activos", label: "Préstamos"  },
  { key: "total_deuda",       label: "Deuda"      },
]

export default function ClienteTabla({ clientes, onEdit, onDelete }: Props) {
  const [search, setSearch]           = useState("")
  const [filtro, setFiltro]           = useState("con_prestamos")
  const [sortKey, setSortKey]         = useState<SortKey>("nombre")
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc")
  const [page, setPage]               = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null)

  const resetPage = () => setPage(1)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
    resetPage()
  }

  const filtered = useMemo(() => {
    let result = [...clientes]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.apellido.toLowerCase().includes(q) ||
          c.cedula?.toString().includes(q) ||
          (c.telefono ?? "").includes(q)
      )
    }

    if (filtro === "con_prestamos") {
      result = result.filter((c) => c.prestamos_activos > 0)
    } else if (filtro !== "todos") {
      result = result.filter((c) => c.estado === filtro)
    }

    result.sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "es")
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [clientes, search, filtro, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const rows       = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleFiltroChange = (val: string) => { setFiltro(val); resetPage() }
  const handleSearch       = (val: string) => { setSearch(val); resetPage() }

  return (
    <>
      <Card className="border-border/60 shadow-sm overflow-hidden">
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="pl-9 h-9 text-sm bg-muted/30 focus-visible:bg-background"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <Select value={filtro} onValueChange={handleFiltroChange}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="bloqueado">Bloqueados</SelectItem>
                <SelectItem value="moroso">Morosos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
                <SelectItem value="con_prestamos">Con préstamos activos</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
              {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>

        {/* ── Tabla ────────────────────────────────────────────────────── */}
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[860px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-2.5 w-12" />
                  {sortableCols.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground tracking-widest uppercase text-left cursor-pointer group whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon active={sortKey === col.key} dir={sortDir} />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground tracking-widest uppercase text-left whitespace-nowrap">Teléfono</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground tracking-widest uppercase text-left whitespace-nowrap">Ruta</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground tracking-widest uppercase text-left whitespace-nowrap">Docs</th>
                  <th className="px-3 py-2.5 w-20" />
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      {search || filtro !== "todos"
                        ? "No se encontraron clientes con ese filtro"
                        : "No hay clientes registrados"}
                    </td>
                  </tr>
                ) : (
                  rows.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0"
                    >
                      {/* Avatar */}
                      <td className="px-3 py-2.5">
                        <Avatar url={cliente.foto_url} nombre={cliente.nombre} />
                      </td>

                      {/* Nombre */}
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-foreground leading-tight">
                          {cliente.nombre} {cliente.apellido}
                        </p>
                        {cliente.ocupacion && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{cliente.ocupacion}</p>
                        )}
                      </td>

                      {/* Cédula */}
                      <td className="px-3 py-2.5 tabular-nums text-muted-foreground text-xs">
                        {cliente.cedula?.toLocaleString("es-CO")}
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-2.5">
                        <EstadoBadge estado={cliente.estado} />
                      </td>

                      {/* Préstamos activos */}
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums",
                          cliente.prestamos_activos > 0
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground"
                        )}>
                          {cliente.prestamos_activos}
                        </span>
                      </td>

                      {/* Deuda */}
                      <td className="px-3 py-2.5 tabular-nums font-semibold text-foreground/90">
                        {formatCOP(cliente.total_deuda)}
                      </td>

                      {/* Teléfono */}
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {cliente.telefono ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefono}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Ruta */}
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {cliente.nombre_ruta ?? "—"}
                      </td>

                      {/* Docs */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <FotoDoc path={cliente.foto_cedula_url}     label="Cédula"     icon={FileImage} />
                          <FotoDoc path={cliente.foto_residencia_url}  label="Residencia" icon={Home} />
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={() => onEdit(cliente)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget({ id: cliente.id, nombre: `${cliente.nombre} ${cliente.apellido}` })}
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ───────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Página {safePage} de {totalPages} · {filtered.length} registros
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={safePage === p ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirmación de eliminación ──────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.nombre}</span>.
              Esta acción no se puede deshacer y solo es posible si no tiene préstamos activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null) } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
