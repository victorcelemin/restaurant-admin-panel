import { AdminShell } from "@/components/admin-shell"
import { InventoryManager } from "@/components/inventory/inventory-manager"

export default function InventarioPage() {
  return (
    <AdminShell>
      <InventoryManager />
    </AdminShell>
  )
}
