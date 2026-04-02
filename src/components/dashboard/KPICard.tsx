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
  variant?: "default" | "success" | "warning" | "destructive" | "premium-cartera" | "premium-caja" | "transparent-white"
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
      case "premium-cartera":
        return "border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background shadow-primary/5 shadow-xl"
      case "premium-caja":
        return "border-warning/30 bg-gradient-to-br from-warning/10 via-background to-background shadow-warning/5 shadow-xl"
      case "transparent-white":
        return "bg-transparent border-white/10 hover:bg-white/5"
      default:
        return "border-border shadow-sm"
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
      case "premium-cartera":
        return "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
      case "premium-caja":
        return "bg-warning text-warning-foreground shadow-lg shadow-warning/30"
      case "transparent-white":
        return "bg-white/20 text-white"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const getTextColorStyles = () => {
    if (variant === "transparent-white") return "text-white"
    return ""
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer group",
      getVariantStyles(),
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn("text-sm font-medium text-muted-foreground", getTextColorStyles() && "text-white/80")}>{title}</p>
            <p className={cn("text-2xl font-bold text-foreground", getTextColorStyles())}>{value}</p>
            {description && (
              <p className={cn("text-xs text-muted-foreground", getTextColorStyles() && "text-white/70")}>{description}</p>
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
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
            getIconStyles()
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Decorative background element for premium variants */}
        {(variant === "premium-cartera" || variant === "premium-caja") && (
          <div className={cn(
            "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500",
            variant === "premium-cartera" ? "bg-primary" : "bg-warning"
          )} />
        )}
      </CardContent>
    </Card>
  )
}