import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CajaDesgloseProps {
  inversion: number
  prestado: number
  seguros: number
  cobrados: number
  cartera: number
}

export function CajaDesglose({ inversion, prestado, seguros, cobrados, cartera }: CajaDesgloseProps) {
  const caja = inversion - prestado + seguros + cobrados
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const items = [
    { 
      label: 'Inversión', 
      value: inversion, 
      type: 'base',
      icon: null
    },
    { 
      label: 'Prestado', 
      value: prestado, 
      type: 'negative',
      icon: <Minus className="w-3 h-3" />
    },
    { 
      label: 'Seguros', 
      value: seguros, 
      type: 'positive',
      icon: <Plus className="w-3 h-3" />
    },
    { 
      label: 'Cobrados', 
      value: cobrados, 
      type: 'positive',
      icon: <Plus className="w-3 h-3" />
    },
  ]

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-primary/20">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          Flujo de Caja
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center justify-between py-2 border-b last:border-b-0",
              index === 0 && "pb-3 border-b-2"
            )}
          >
            <div className="flex items-center gap-2">
              {item.icon && (
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center",
                  item.type === 'positive' && "bg-green-100 text-green-600",
                  item.type === 'negative' && "bg-red-100 text-red-600"
                )}>
                  {item.icon}
                </div>
              )}
              <span className={cn(
                "text-sm",
                index === 0 ? "font-semibold" : "font-medium text-muted-foreground"
              )}>
                {item.label}
              </span>
            </div>
            <span className={cn(
              "font-bold tabular-nums",
              item.type === 'base' && "text-base",
              item.type === 'positive' && "text-green-600 text-sm",
              item.type === 'negative' && "text-red-600 text-sm"
            )}>
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
        
        {/* Caja Final */}
        <div className="pt-3 mt-3 border-t-2 border-primary/20">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
            <span className="font-bold text-base">Caja</span>
            <span className={cn(
              "font-bold text-lg tabular-nums",
              caja >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(caja)}
            </span>
          </div>
        </div>

        {/* Cartera */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <Plus className="w-3 h-3 text-blue-600" />
            <span className="font-medium text-sm text-blue-900">Cartera</span>
          </div>
          <span className="font-bold text-blue-600 tabular-nums">
            {formatCurrency(cartera)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

