"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orders as ordersApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

export function TopProducts() {
  const { data: ordersList, loading } = useApi(() => ordersApi.list(), [])

  const topProducts = (() => {
    if (!ordersList) return []
    const productMap = new Map<number, { name: string; quantity: number; revenue: number }>()
    for (const order of ordersList.filter((o) => o.status !== "cancelado")) {
      for (const item of order.items) {
        const existing = productMap.get(item.product_id) || { name: item.product_name, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.quantity * item.unit_price
        productMap.set(item.product_id, existing)
      }
    }
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  })()

  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Top 5 Productos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
              </div>
            ))}
          </div>
        )}
        {!loading && topProducts.map((product, index) => {
          const percentage = Math.round((product.revenue / maxRevenue) * 100)
          return (
            <div key={product.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-primary-foreground bg-primary/80">
                    {index + 1}
                  </span>
                  <span className="truncate">{product.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {product.quantity} uds - {formatCurrency(product.revenue)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
        {!loading && topProducts.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay ventas registradas hoy
          </p>
        )}
      </CardContent>
    </Card>
  )
}
