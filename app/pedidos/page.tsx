import { AdminShell } from "@/components/admin-shell"
import { OrdersList } from "@/components/orders/orders-list"

export default function PedidosPage() {
  return (
    <AdminShell>
      <OrdersList />
    </AdminShell>
  )
}
