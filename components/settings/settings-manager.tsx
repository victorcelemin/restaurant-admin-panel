"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Percent,
  UserPlus,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"
import { users as usersApi, auth as authApi, settings as settingsApi, type User } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function SettingsManager() {
  const [ivaEnabled, setIvaEnabled] = useState(false)
  const [ivaRate, setIvaRate] = useState("19")
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // User management state
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editShift, setEditShift] = useState("")

  // New user dialog state
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("")
  const [newShift, setNewShift] = useState("")
  const [savingUser, setSavingUser] = useState(false)

  const { data: usersList, refetch: refetchUsers } = useApi(() => usersApi.list(), [])
  const { data: settingsData } = useApi(() => settingsApi.get(), [])

  // Sync settings from API data (only on first load)
  if (settingsData && !settingsLoaded) {
    setIvaEnabled(settingsData.iva_enabled === "true")
    if (settingsData.iva_rate) setIvaRate(settingsData.iva_rate)
    setSettingsLoaded(true)
  }

  function resetNewUserForm() {
    setNewUsername("")
    setNewName("")
    setNewPassword("")
    setNewRole("")
    setNewShift("")
  }

  async function handleCreateUser() {
    if (!newUsername || !newName || !newPassword || !newRole) {
      toast.error("Completa todos los campos obligatorios")
      return
    }
    setSavingUser(true)
    try {
      await authApi.register({
        username: newUsername,
        name: newName,
        password: newPassword,
        role: newRole,
        shift: newShift,
      })
      toast.success(`Usuario "${newName}" creado exitosamente`)
      resetNewUserForm()
      setNewUserDialogOpen(false)
      refetchUsers()
    } catch (err: any) {
      toast.error(err.message || "Error al crear usuario")
    } finally {
      setSavingUser(false)
    }
  }

  function startEditUser(user: User) {
    setEditingUser(user.id)
    setEditName(user.name)
    setEditRole(user.role)
    setEditShift(user.shift)
  }

  async function saveEditUser() {
    if (!editingUser) return
    try {
      await usersApi.update(editingUser, {
        name: editName,
        role: editRole,
        shift: editShift,
      })
      toast.success(`Usuario "${editName}" actualizado`)
      setEditingUser(null)
      refetchUsers()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar usuario")
    }
  }

  async function toggleUserActive(user: User) {
    try {
      await usersApi.update(user.id, { active: !user.active })
      toast.success(`Usuario "${user.name}" ${user.active ? "desactivado" : "activado"}`)
      refetchUsers()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar usuario")
    }
  }

  async function handleSaveIva() {
    try {
      await settingsApi.update("iva_enabled", String(ivaEnabled))
      await settingsApi.update("iva_rate", ivaRate)
      toast.success(`IVA configurado al ${ivaRate}%`)
    } catch (err: any) {
      toast.error(err.message || "Error al guardar configuracion")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuracion</h1>
        <p className="text-sm text-muted-foreground">
          Administra usuarios, seguridad y ajustes del sistema
        </p>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="impuestos">IVA</TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="usuarios" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Gestion de Usuarios
            </h2>
            <Dialog open={newUserDialogOpen} onOpenChange={(open) => { setNewUserDialogOpen(open); if (!open) resetNewUserForm() }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setNewUserDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Agregar Usuario</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Nombre de Usuario <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="ej: juan.perez"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-secondary text-foreground"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Nombre Completo <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Nombre completo"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-secondary text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Contrasena <span className="text-destructive">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Minimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-secondary text-foreground"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Rol <span className="text-destructive">*</span></Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="bg-secondary text-foreground">
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="cocinero">Cocinero</SelectItem>
                        <SelectItem value="mesero">Mesero</SelectItem>
                        <SelectItem value="cajero">Cajero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Turno</Label>
                    <Input
                      placeholder="Ej: 08:00 - 18:00"
                      value={newShift}
                      onChange={(e) => setNewShift(e.target.value)}
                      className="bg-secondary text-foreground"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground"
                    onClick={() => { setNewUserDialogOpen(false); resetNewUserForm() }}
                    disabled={savingUser}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={handleCreateUser}
                    disabled={savingUser}
                  >
                    {savingUser ? "Guardando..." : "Agregar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-2">
            {(usersList ?? []).map((emp) => (
              <Card key={emp.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-4">
                  {editingUser === emp.id ? (
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-secondary text-foreground sm:w-36"
                        placeholder="Nombre"
                      />
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger className="bg-secondary text-foreground sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="cocinero">Cocinero</SelectItem>
                          <SelectItem value="mesero">Mesero</SelectItem>
                          <SelectItem value="cajero">Cajero</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={editShift}
                        onChange={(e) => setEditShift(e.target.value)}
                        className="bg-secondary text-foreground sm:w-36"
                        placeholder="Turno"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-primary text-primary-foreground" onClick={saveEditUser}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingUser(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{emp.name}</span>
                          <span className="text-xs text-muted-foreground">
                            @{emp.username} - {emp.role} - {emp.shift}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`cursor-pointer text-xs ${emp.active ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
                          onClick={() => toggleUserActive(emp)}
                        >
                          {emp.active ? "Activo" : "Inactivo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => startEditUser(emp)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* IVA tab */}
        <TabsContent value="impuestos" className="flex flex-col gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Percent className="h-4 w-4 text-primary" />
                Configuracion de IVA
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Aplicar IVA</span>
                  <span className="text-xs text-muted-foreground">Incluir impuesto en facturas</span>
                </div>
                <Switch checked={ivaEnabled} onCheckedChange={setIvaEnabled} />
              </div>
              {ivaEnabled && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Tasa de IVA (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={ivaRate}
                        onChange={(e) => setIvaRate(e.target.value)}
                        className="w-24 bg-secondary text-foreground"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      La tasa estandar en Colombia es del 19%
                    </p>
                  </div>
                </>
              )}
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveIva}
              >
                Guardar Configuracion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
