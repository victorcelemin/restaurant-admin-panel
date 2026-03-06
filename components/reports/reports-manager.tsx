"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import {
  Power,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { reports as reportsApi, orders as ordersApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

// Mock monthly data (financial) — would come from a real endpoint in production
const monthlyData = [
  { month: "Sep", ventas: 4200000, gastos: 2100000 },
  { month: "Oct", ventas: 5100000, gastos: 2400000 },
  { month: "Nov", ventas: 4800000, gastos: 2300000 },
  { month: "Dic", ventas: 6500000, gastos: 2800000 },
  { month: "Ene", ventas: 5800000, gastos: 2600000 },
  { month: "Feb", ventas: 3200000, gastos: 1900000 },
]

const dailyData = [
  { dia: "Lun", pedidos: 18, ventas: 540000 },
  { dia: "Mar", pedidos: 22, ventas: 660000 },
  { dia: "Mie", pedidos: 15, ventas: 450000 },
  { dia: "Jue", pedidos: 25, ventas: 750000 },
  { dia: "Vie", pedidos: 32, ventas: 960000 },
  { dia: "Sab", pedidos: 40, ventas: 1200000 },
  { dia: "Dom", pedidos: 12, ventas: 360000 },
]

export function ReportsManager() {
  const [dayClosed, setDayClosed] = useState(false)

  const { data: dailyReport } = useApi(() => reportsApi.daily(), [])
  const { data: ordersList } = useApi(() => ordersApi.list(), [])

  const todaySales = dailyReport?.total_sales ?? 0
  const todayOrders = dailyReport?.total_orders ?? 0
  const completedOrders = dailyReport?.completed_orders ?? 0

  const currentMonth = monthlyData[monthlyData.length - 1]
  const prevMonth = monthlyData[monthlyData.length - 2]
  const salesChange = prevMonth
    ? ((currentMonth.ventas - prevMonth.ventas) / prevMonth.ventas) * 100
    : 0

  async function handleCloseDay() {
    try {
      await reportsApi.closeDay()
      setDayClosed(true)
      toast.success("Dia cerrado exitosamente. Reporte generado.")
    } catch (err: any) {
      toast.error(err.message || "Error al cerrar el dia")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Analisis financiero y cierre diario
          </p>
        </div>

        {dayClosed ? (
          <Badge className="bg-success/15 text-success gap-1 px-4 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Dia Cerrado
          </Badge>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Power className="mr-2 h-4 w-4" />
                Cerrar Dia
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Confirmar Cierre de Dia</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion cerrara el turno actual y generara el reporte del dia.
                  Una vez cerrado, no se podran agregar mas pedidos hasta el proximo turno.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-2 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pedidos del dia</span>
                    <span className="font-medium text-foreground">{todayOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completados</span>
                    <span className="font-medium text-foreground">{completedOrders}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ventas totales</span>
                    <span className="font-bold text-primary">{formatCurrency(todaySales)}</span>
                  </div>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary text-secondary-foreground">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={handleCloseDay}
                >
                  Confirmar Cierre
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="diario" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="diario">Reporte Diario</TabsTrigger>
          <TabsTrigger value="financiero">Reporte Financiero</TabsTrigger>
        </TabsList>

        {/* Daily report */}
        <TabsContent value="diario" className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                  Pedidos Hoy
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">{todayOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Ventas Netas
                </div>
                <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(todaySales)}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Completados
                </div>
                <p className="mt-1 text-2xl font-bold text-success">{completedOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Fecha
                </div>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {new Date().toLocaleDateString("es-CO")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Pedidos por Dia - Semana Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 250)" />
                    <XAxis dataKey="dia" stroke="oklch(0.6 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.005 250)",
                        border: "1px solid oklch(0.28 0.005 250)",
                        borderRadius: "8px",
                        color: "oklch(0.97 0 0)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="pedidos" fill="oklch(0.72 0.19 50)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent orders summary */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Pedidos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(ordersList ?? []).slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary">{order.order_number}</span>
                    <span className="text-foreground">{order.client_name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                </div>
              ))}
              {(ordersList ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No hay pedidos registrados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial report */}
        <TabsContent value="financiero" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Ventas del Mes</div>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {formatCurrency(currentMonth.ventas)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {salesChange >= 0 ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-success" />
                  )}
                  <span className={salesChange >= 0 ? "text-destructive" : "text-success"}>
                    {Math.abs(salesChange).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Gastos del Mes</div>
                <p className="mt-1 text-2xl font-bold text-destructive">
                  {formatCurrency(currentMonth.gastos)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Utilidad Neta</div>
                <p className="mt-1 text-2xl font-bold text-success">
                  {formatCurrency(currentMonth.ventas - currentMonth.gastos)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Ventas vs Gastos - Ultimos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 250)" />
                    <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.005 250)",
                        border: "1px solid oklch(0.28 0.005 250)",
                        borderRadius: "8px",
                        color: "oklch(0.97 0 0)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="oklch(0.72 0.19 50)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.72 0.19 50)", r: 4 }}
                      name="Ventas"
                    />
                    <Line
                      type="monotone"
                      dataKey="gastos"
                      stroke="oklch(0.55 0.22 27)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.55 0.22 27)", r: 4 }}
                      name="Gastos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Detalle Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                  <span>Mes</span>
                  <span className="text-right">Ventas</span>
                  <span className="text-right">Gastos</span>
                  <span className="text-right">Utilidad</span>
                </div>
                {monthlyData.map((m) => (
                  <div key={m.month} className="grid grid-cols-4 gap-2 text-sm py-1.5 border-b border-border/50">
                    <span className="font-medium text-foreground">{m.month}</span>
                    <span className="text-right text-foreground">{formatCurrency(m.ventas)}</span>
                    <span className="text-right text-destructive">{formatCurrency(m.gastos)}</span>
                    <span className="text-right text-success font-medium">
                      {formatCurrency(m.ventas - m.gastos)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
