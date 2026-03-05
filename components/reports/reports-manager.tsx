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
  CartesianGrid,
} from "recharts"
import {
  Power,
  DollarSign,
  ShoppingBag,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/store"
import { reports as reportsApi, orders as ordersApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function ReportsManager() {
  const [dayClosed, setDayClosed] = useState(false)

  const { data: dailyReport } = useApi(() => reportsApi.daily(), [])
  const { data: weeklyData } = useApi(() => reportsApi.weekly(), [])
  const { data: ordersList } = useApi(() => ordersApi.list(), [])

  const todaySales = dailyReport?.total_sales ?? 0
  const todayOrders = dailyReport?.total_orders ?? 0
  const completedOrders = dailyReport?.completed_orders ?? 0

  const chartData = (weeklyData ?? []).map(w => ({
    dia: w.day,
    pedidos: w.orders,
    ventas: w.sales,
  }))

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
          <p className="text-sm text-muted-foreground">Analisis financiero y cierre diario</p>
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
        </TabsList>

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
                Pedidos - Semana Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Pedidos Recientes</CardTitle>
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
                <p className="py-4 text-center text-sm text-muted-foreground">No hay pedidos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
