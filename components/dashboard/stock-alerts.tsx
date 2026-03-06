"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { products as productsApi, type Product } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

type StockLevel = "ok" | "low" | "critical" | "out"

function getStockLevel(product: Product): StockLevel {
  if (product.stock === 0) return "out"
  if (product.stock <= product.min_stock * 0.3) return "critical"
  if (product.stock <= product.min_stock) return "low"
  return "ok"
}

function getStockBgColor(level: StockLevel) {
  switch (level) {
    case "ok": return "bg-success/15 text-success"
    case "low": return "bg-warning/15 text-warning"
    case "critical": return "bg-destructive/15 text-destructive"
    case "out": return "bg-foreground/10 text-foreground"
  }
}

function getStockLabel(level: StockLevel) {
  switch (level) {
    case "ok": return "Normal"
    case "low": return "Bajo"
    case "critical": return "Critico"
    case "out": return "Sin Stock"
  }
}

export function StockAlerts() {
  const { data: productsList, loading } = useApi(() => productsApi.list(), [])

  const alerts = (productsList ?? [])
    .map((p) => ({ ...p, level: getStockLevel(p) }))
    .filter((p) => p.level !== "ok")
    .sort((a, b) => {
      const priority: Record<StockLevel, number> = { out: 0, critical: 1, low: 2, ok: 3 }
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
        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        )}
        {!loading && alerts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.stock} {item.unit} restantes
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
        {!loading && alerts.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Todo el inventario esta en niveles normales
          </p>
        )}
      </CardContent>
    </Card>
  )
}
