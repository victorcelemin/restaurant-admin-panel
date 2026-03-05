"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { getStockLevel, getStockBgColor, getStockLabel } from "@/lib/store"
import { products as productsApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function StockAlerts() {
  const { data: productsList, loading } = useApi(() => productsApi.list(), [])

  const alerts = (productsList ?? [])
    .map((p) => ({ ...p, level: getStockLevel(p) }))
    .filter((p) => p.level !== "ok")
    .sort((a, b) => {
      const priority = { out: 0, critical: 1, low: 2, ok: 3 }
      return priority[a.level] - priority[b.level]
    })

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas de Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : (
          <>
            {alerts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.stock} {item.unit} restantes (min: {item.min_stock})
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${getStockBgColor(item.level)}`}
                >
                  {getStockLabel(item.level)}
                </Badge>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Todo el inventario esta en niveles normales
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
