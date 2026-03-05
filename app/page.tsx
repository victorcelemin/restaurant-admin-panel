import { AdminShell } from "@/components/admin-shell"
import { DailySummary } from "@/components/dashboard/daily-summary"
import { TopProducts } from "@/components/dashboard/top-products"
import { StockAlerts } from "@/components/dashboard/stock-alerts"
import { ActiveEmployees } from "@/components/dashboard/active-employees"

export default function DashboardPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen del dia - {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <DailySummary />

        <div className="grid gap-6 lg:grid-cols-2">
          <TopProducts />
          <StockAlerts />
        </div>

        <ActiveEmployees />
      </div>
    </AdminShell>
  )
}
