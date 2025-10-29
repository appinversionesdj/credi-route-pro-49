import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Pagination from "@/components/ui/pagination"

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  emptyDescription?: string
  renderRow: (item: T) => ReactNode
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    from: number
    to: number
  }
  paginationControls?: {
    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    setItemsPerPage: (items: number) => void
  }
  showPagination?: boolean
  itemsPerPageOptions?: number[]
  gridCols?: string
  showHeader?: boolean
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "No se encontraron resultados",
  emptyDescription = "No hay datos para mostrar",
  renderRow,
  pagination,
  paginationControls,
  showPagination = true,
  itemsPerPageOptions = [5, 10, 20, 50],
  gridCols = "grid-cols-12",
  showHeader = true,
}: DataTableProps<T>) {
  // Loading State
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando datos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error State
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-800">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty State
  if (!loading && !error && data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">{emptyMessage}</p>
            <p className="text-sm">{emptyDescription}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Encabezados de la tabla */}
        {showHeader && (
          <div
            className={`grid ${gridCols} gap-4 items-center text-xs font-medium text-muted-foreground bg-gray-50 px-6 py-3 border-b`}
          >
            {columns.map((column) => (
              <div key={column.key} className={column.className || ""}>
                {column.header}
              </div>
            ))}
          </div>
        )}

        {/* Filas de datos */}
        <div>
          {data.map((item) => (
            <div key={item.id}>{renderRow(item)}</div>
          ))}
        </div>

        {/* Paginación */}
        {showPagination && pagination && paginationControls && (
          <Pagination
            pagination={pagination}
            controls={paginationControls}
            showItemsPerPage={true}
            itemsPerPageOptions={itemsPerPageOptions}
          />
        )}
      </CardContent>
    </Card>
  )
}

