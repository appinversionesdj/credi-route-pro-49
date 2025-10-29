import { ReactNode } from "react"

interface DataTableRowProps {
  children: ReactNode
  gridCols?: string
  className?: string
  onClick?: () => void
}

export function DataTableRow({ 
  children, 
  gridCols = "grid-cols-12", 
  className = "",
  onClick 
}: DataTableRowProps) {
  return (
    <div
      className={`grid ${gridCols} gap-4 items-center px-6 py-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface DataTableCellProps {
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function DataTableCell({ children, className = "", onClick }: DataTableCellProps) {
  return <div className={className} onClick={onClick}>{children}</div>
}

