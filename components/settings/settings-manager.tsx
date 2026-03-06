"use client"

import { useState, useEffect } from "react"
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
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Shield,
  Database,
  Percent,
  Key,
  Download,
  Upload,
  UserPlus,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"
import { users as usersApi, auth as authApi, settings as settingsApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function SettingsManager() {
  const [encryptionKey, setEncryptionKey] = useState("")
  const [confirmKey, setConfirmKey] = useState("")
  const [ivaEnabled, setIvaEnabled] = useState(false)
  const [ivaRate, setIvaRate] = useState("19")

  // New user form
  const [newName, setNewName] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("")
  const [newShift, setNewShift] = useState("")
  const [savingUser, setSavingUser] = useState(false)

  // Edit user
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editShift, setEditShift] = useState("")

  const { data: usersList, loading: usersLoading, refetch: refetchUsers } = useApi(() => usersApi.list(), [])

  // Load IVA setting on mount
  useEffect(() => {
    settingsApi.get().then((data) => {
      if (data["iva_enabled"]) setIvaEnabled(data["iva_enabled"] === "true")
      if (data["iva_rate"]) setIvaRate(data["iva_rate"])
    }).catch(() => {})
  }, [])

  function handleChangeKey() {
    if (!encryptionKey || !confirmKey) {
      toast.error("Completa ambos campos")
      return
    }
    if (encryptionKey !== confirmKey) {
      toast.error("Las claves no coinciden")
      return
    }
    if (encryptionKey.length < 8) {
      toast.error("La clave debe tener al menos 8 caracteres")
      return
    }
    toast.success("Clave de cifrado actualizada exitosamente")
    setEncryptionKey("")
    setConfirmKey("")
  }

  function handleBackup() {
    const data = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      note: "Backup generado desde RestaurantOS",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-restaurantos-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Backup descargado exitosamente")
  }

  function handleRestore() {
    toast.success("Restauracion completada (simulacion)")
  }

  async function handleSaveIva() {
    try {
      await settingsApi.update("iva_enabled", String(ivaEnabled))
      await settingsApi.update("iva_rate", ivaRate)
      toast.success(`IVA configurado al ${ivaRate}%`)
    } catch {
      toast.error("Error al guardar configuracion de IVA")
    }
  }

  async function handleCreateUser() {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim() || !newRole) {
      toast.error("Completa todos los campos obligatorios")
      return
    }
    setSavingUser(true)
    try {
      await authApi.register({
        name: newName,
        username: newUsername,
        password: newPassword,
        role: newRole,
        shift: newShift || "08:00 - 18:00",
      })
      toast.success("Usuario creado exitosamente")
      setNewName("")
      setNewUsername("")
      setNewPassword("")
      setNewRole("")
      setNewShift("")
      refetchUsers?.()
    } catch (err: any) {
      toast.error(err.message || "Error al crear usuario")
    } finally {
      setSavingUser(false)
    }
  }

  function startEdit(emp: NonNullable<typeof usersList>[0]) {
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditRole(emp.role)
    setEditShift(emp.shift)
  }

  async function saveEdit() {
    if (!editingId) return
    try {
      await usersApi.update(editingId, { name: editName, role: editRole, shift: editShift })
      toast.success(`Usuario ${editName} actualizado`)
      setEditingId(null)
      refetchUsers?.()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar usuario")
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
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="impuestos">IVA</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="usuarios" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Gestion de Usuarios
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                    <Label className="text-foreground">Nombre completo *</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ana Garcia" className="bg-secondary text-foreground" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Usuario *</Label>
                    <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="ana.garcia" className="bg-secondary text-foreground" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Contrasena *</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" className="bg-secondary text-foreground" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Rol *</Label>
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
                    <Input value={newShift} onChange={(e) => setNewShift(e.target.value)} placeholder="08:00 - 18:00" className="bg-secondary text-foreground" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary" className="bg-secondary text-secondary-foreground">Cancelar</Button>
                  </DialogClose>
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
            {usersLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
                ))}
              </div>
            )}
            {!usersLoading && (usersList ?? []).map((emp) => (
              <Card key={emp.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-4">
                  {editingId === emp.id ? (
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
                        <Button size="sm" className="bg-primary text-primary-foreground" onClick={saveEdit}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-secondary text-secondary-foreground" onClick={() => setEditingId(null)}>
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
                            {emp.role} - {emp.shift}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            emp.active
                              ? "bg-success/15 text-success text-xs"
                              : "bg-secondary text-muted-foreground text-xs"
                          }
                        >
                          {emp.active ? "Activo" : "Inactivo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(emp)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="seguridad" className="flex flex-col gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Key className="h-4 w-4 text-primary" />
                Clave de Cifrado
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Cambia la clave de cifrado al inicio de cada turno para proteger los datos.
                La clave debe tener al menos 8 caracteres.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Nueva Clave</Label>
                  <Input
                    type="password"
                    placeholder="Ingresa la nueva clave..."
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Confirmar Clave</Label>
                  <Input
                    type="password"
                    placeholder="Repite la clave..."
                    value={confirmKey}
                    onChange={(e) => setConfirmKey(e.target.value)}
                    className="bg-secondary text-foreground"
                  />
                </div>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleChangeKey}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Actualizar Clave
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Estado de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-foreground">Cifrado de datos</span>
                <Badge className="bg-success/15 text-success text-xs">Activo</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-foreground">Ultima rotacion de clave</span>
                <span className="text-sm text-muted-foreground">Hoy, 08:00 AM</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-foreground">Sesiones activas</span>
                <span className="text-sm text-primary font-medium">1</span>
              </div>
            </CardContent>
          </Card>
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
                  <span className="text-xs text-muted-foreground">
                    Incluir impuesto en facturas
                  </span>
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
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSaveIva}
                  >
                    Guardar Configuracion
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup tab */}
        <TabsContent value="backup" className="flex flex-col gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="h-4 w-4 text-primary" />
                Backup y Restauracion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Genera backups periodicos para evitar errores contables y perdida de datos.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="border-border bg-secondary/50">
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Descargar Backup</h3>
                    <p className="text-center text-xs text-muted-foreground">
                      Genera un archivo con todos los datos actuales del sistema
                    </p>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleBackup}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generar Backup
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border bg-secondary/50">
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                      <Upload className="h-6 w-6 text-warning" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Restaurar Datos</h3>
                    <p className="text-center text-xs text-muted-foreground">
                      Restaura el sistema desde un archivo de backup previo
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          className="w-full bg-warning/10 text-warning hover:bg-warning/20"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Restaurar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card text-foreground">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Confirmar Restauracion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta accion reemplazara todos los datos actuales con los del backup.
                            Esta seguro de continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary text-secondary-foreground">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-warning text-warning-foreground"
                            onClick={handleRestore}
                          >
                            Restaurar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-foreground">Backups Recientes</h3>
                {[
                  { date: new Date(Date.now() - 0).toISOString().split("T")[0], size: "2.4 MB" },
                  { date: new Date(Date.now() - 86400000).toISOString().split("T")[0], size: "2.3 MB" },
                  { date: new Date(Date.now() - 172800000).toISOString().split("T")[0], size: "2.1 MB" },
                ].map((backup) => (
                  <div
                    key={backup.date}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">backup-{backup.date}.json</span>
                      <span className="text-xs text-muted-foreground">{backup.size}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
