"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { users as usersApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"
import { useAuth } from "@/lib/auth-context"

export function ActiveEmployees() {
  const { isAdmin } = useAuth()
  const { data: usersList, loading } = useApi(() => {
    if (isAdmin) return usersApi.list()
    return Promise.resolve([])
  }, [isAdmin])

  if (!isAdmin) return null

  const activeUsers = (usersList ?? []).filter((u) => u.active)
  const total = (usersList ?? []).length

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="h-4 w-4 text-primary" />
          Trabajadores Activos
          <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary text-xs">
            {activeUsers.length}/{total}
          </Badge>
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
        {!loading && activeUsers.map((emp) => (
          <div
            key={emp.id}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {emp.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{emp.name}</span>
              <span className="text-xs text-muted-foreground">
                {emp.role} - {emp.shift}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-success">Activo</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
