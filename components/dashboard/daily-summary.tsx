"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, DollarSign, Clock, TrendingUp } from "lucide-react"
import { reports } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

export function DailySummary() {
  const { data: report, loading } = useApi(() => reports.daily(), [])

  const stats = [
    {
      title: "Pedidos del Dia",
      value: report?.total_orders.toString() ?? "0",
      subtitle: `${report?.total_orders ?? 0 - (report?.cancelled_orders ?? 0)} activos`,
      icon: ShoppingBag,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Ventas Netas",
      value: formatCurrency(report?.total_sales ?? 0),
      subtitle: `${report?.completed_orders ?? 0} completados`,
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(report?.average_ticket ?? 0),
      subtitle: "por pedido",
      icon: TrendingUp,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      title: "En Preparacion",
      value: (report ? report.total_orders - report.completed_orders - report.cancelled_orders : 0).toString(),
      subtitle: "pedidos activos",
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-secondary" />
            ) : (
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
