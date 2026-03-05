import { AdminShell } from "@/components/admin-shell"
import { BillingManager } from "@/components/billing/billing-manager"

export default function FacturacionPage() {
  return (
    <AdminShell>
      <BillingManager />
    </AdminShell>
  )
}
