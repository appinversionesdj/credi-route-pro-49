import { Calendar, CheckCircle, Clock, AlertCircle, MoreVertical, Trash2, CreditCard } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { CronogramaPago } from '../../hooks/useDetallePrestamo'

interface CronogramaPagosProps {
  cronograma: CronogramaPago[]
  onPagarCuota?: (cuota: CronogramaPago) => void
  onEliminarPago?: (cuota: CronogramaPago) => void
}

export function CronogramaPagos({ cronograma, onPagarCuota, onEliminarPago }: CronogramaPagosProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateWithTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calcularValorRestante = (valorCuota: number, valorPagado: number) => {
    return Math.max(0, valorCuota - valorPagado)
  }

  const tienePagos = (cuota: CronogramaPago) => {
    return (cuota.valor_pagado || 0) > 0
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'abonado':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'vencido':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pagado</Badge>
      case 'abonado':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Abonado</Badge>
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="secondary">Pendiente</Badge>
    }
  }

  const isVencida = (fechaVencimiento: string) => {
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    return vencimiento < hoy
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Cronograma</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-1">Cuota</th>
              <th className="text-left py-2 px-1">Vencimiento</th>
              <th className="text-right py-2 px-1">Valor Cuota</th>
              <th className="text-right py-2 px-1">Valor Pagado</th>
              <th className="text-right py-2 px-1">Valor Restante</th>
              <th className="text-left py-2 px-1">Fecha Pago</th>
              <th className="text-right py-2 px-1">Capital</th>
              <th className="text-right py-2 px-1">Interés</th>
              <th className="text-right py-2 px-1">Saldo</th>
              <th className="text-center py-2 px-1">Estado</th>
              <th className="text-center py-2 px-1">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cronograma.map((cuota) => {
              const valorRestante = calcularValorRestante(cuota.valor_cuota, cuota.valor_pagado || 0)
              
              return (
                <tr
                  key={cuota.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${
                    cuota.estado === 'pagado' 
                      ? 'bg-green-50' 
                      : cuota.estado === 'vencido'
                      ? 'bg-red-50'
                      : ''
                  }`}
                >
                  <td className="py-2 px-1 font-medium">
                    #{cuota.numero_cuota}
                  </td>
                  <td className="py-2 px-1 text-muted-foreground">
                    {formatDate(cuota.fecha_vencimiento)}
                  </td>
                  <td className="py-2 px-1 text-right font-semibold">
                    {formatCurrency(cuota.valor_cuota)}
                  </td>
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatCurrency(cuota.valor_pagado || 0)}
                  </td>
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatCurrency(valorRestante)}
                  </td>
                  <td className="py-2 px-1 text-muted-foreground">
                    {cuota.fecha_pago ? formatDateWithTime(cuota.fecha_pago) : '-'}
                  </td>
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatCurrency(cuota.valor_capital)}
                  </td>
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatCurrency(cuota.valor_interes)}
                  </td>
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatCurrency(cuota.saldo_pendiente)}
                  </td>
                  <td className="py-2 px-1 text-center">
                    <div className="flex items-center justify-center">
                      {getEstadoBadge(cuota.estado)}
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {(cuota.estado === 'pendiente' || cuota.estado === 'vencido') && onPagarCuota && (
                          <DropdownMenuItem onClick={() => onPagarCuota(cuota)} className="text-xs">
                            <CreditCard className="mr-2 h-3 w-3" />
                            Pagar Cuota
                          </DropdownMenuItem>
                        )}
                        {tienePagos(cuota) && onEliminarPago && (
                          <DropdownMenuItem 
                            onClick={() => onEliminarPago(cuota)} 
                            className="text-xs text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Eliminar Pago
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
