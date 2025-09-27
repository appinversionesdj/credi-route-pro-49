import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon: LucideIcon
  description?: string
  variant?: "default" | "success" | "warning" | "destructive"
  className?: string
}

export function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description,
  variant = "default",
  className 
}: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success-light/20"
      case "warning":
        return "border-warning/20 bg-warning-light/20"
      case "destructive":
        return "border-destructive/20 bg-destructive-light/20"
      default:
        return "border-border"
    }
  }

  const getIconStyles = () => {
    switch (variant) {
      case "success":
        return "bg-success text-success-foreground"
      case "warning":
        return "bg-warning text-warning-foreground"
      case "destructive":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer",
      getVariantStyles(),
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {change && (
              <div className={cn(
                "flex items-center text-xs font-medium",
                change.isPositive ? "text-success" : "text-destructive"
              )}>
                <span>
                  {change.isPositive ? "+" : ""}{change.value}%
                </span>
                <span className="ml-1 text-muted-foreground">vs. mes anterior</span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            getIconStyles()
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}