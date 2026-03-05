import { AdminShell } from "@/components/admin-shell"
import { SettingsManager } from "@/components/settings/settings-manager"

export default function ConfiguracionPage() {
  return (
    <AdminShell>
      <SettingsManager />
    </AdminShell>
  )
}
