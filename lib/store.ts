// Helper functions for the restaurant admin panel
// All data now comes from the API - this file only contains utility functions

export function getStockLevel(product: { stock: number; min_stock: number }): "ok" | "low" | "critical" | "out" {
  if (product.stock === 0) return "out"
  if (product.stock <= product.min_stock * 0.3) return "critical"
  if (product.stock <= product.min_stock) return "low"
  return "ok"
}

export function getStockBgColor(level: "ok" | "low" | "critical" | "out") {
  switch (level) {
    case "ok": return "bg-success/15 text-success"
    case "low": return "bg-warning/15 text-warning"
    case "critical": return "bg-destructive/15 text-destructive"
    case "out": return "bg-foreground/10 text-foreground"
  }
}

export function getStockLabel(level: "ok" | "low" | "critical" | "out") {
  switch (level) {
    case "ok": return "Normal"
    case "low": return "Bajo"
    case "critical": return "Critico"
    case "out": return "Sin Stock"
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "pendiente": return "bg-warning/15 text-warning"
    case "en_preparacion": return "bg-chart-3/15 text-chart-3"
    case "completado": return "bg-success/15 text-success"
    case "cancelado": return "bg-destructive/15 text-destructive"
    default: return ""
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "pendiente": return "Pendiente"
    case "en_preparacion": return "En Preparacion"
    case "completado": return "Completado"
    case "cancelado": return "Cancelado"
    default: return status
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}
