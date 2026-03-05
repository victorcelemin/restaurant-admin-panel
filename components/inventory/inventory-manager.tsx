"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Search,
  PackagePlus,
  PackageMinus,
  BarChart3,
  Package,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  getStockLevel,
  getStockBgColor,
  getStockLabel,
  formatCurrency,
} from "@/lib/store"
import { products as productsApi, inventory as inventoryApi, type Product } from "@/lib/api"
import { useApi } from "@/hooks/use-api"
import { useAuth } from "@/lib/auth-context"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function InventoryManager() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")

  // Entry/Merma state
  const [entryProduct, setEntryProduct] = useState("")
  const [entryQty, setEntryQty] = useState("")
  const [entryNotes, setEntryNotes] = useState("")
  const [mermaProduct, setMermaProduct] = useState("")
  const [mermaQty, setMermaQty] = useState("")
  const [mermaNotes, setMermaNotes] = useState("")

  // Product CRUD state
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", stock: "", unit: "unidades", min_stock: "10" })

  const { data: productsList, refetch } = useApi(() => productsApi.list({ active_only: true }), [])

  const filtered = (productsList ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

  const chartData = filtered.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    stock: p.stock,
    min: p.min_stock,
    level: getStockLevel(p),
  }))

  function getBarColor(level: string) {
    switch (level) {
      case "ok": return "oklch(0.65 0.18 160)"
      case "low": return "oklch(0.80 0.18 85)"
      case "critical": return "oklch(0.55 0.22 27)"
      case "out": return "oklch(0.4 0 0)"
      default: return "oklch(0.65 0.18 160)"
    }
  }

  async function handleEntry() {
    if (!entryProduct || !entryQty || parseInt(entryQty) <= 0) {
      toast.error("Selecciona un producto y cantidad valida")
      return
    }
    try {
      await inventoryApi.createMovement({
        product_id: parseInt(entryProduct),
        type: "entrada",
        quantity: parseInt(entryQty),
        notes: entryNotes,
      })
      toast.success(`Entrada registrada: +${entryQty} unidades`)
      setEntryProduct("")
      setEntryQty("")
      setEntryNotes("")
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Error al registrar entrada")
    }
  }

  async function handleMerma() {
    if (!mermaProduct || !mermaQty || parseInt(mermaQty) <= 0) {
      toast.error("Selecciona un producto y cantidad valida")
      return
    }
    try {
      await inventoryApi.createMovement({
        product_id: parseInt(mermaProduct),
        type: "merma",
        quantity: parseInt(mermaQty),
        notes: mermaNotes,
      })
      toast.success(`Merma registrada: -${mermaQty} unidades`)
      setMermaProduct("")
      setMermaQty("")
      setMermaNotes("")
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Error al registrar merma")
    }
  }

  async function handleAddProduct() {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast.error("Completa nombre, categoria y precio")
      return
    }
    try {
      await productsApi.create({
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        unit: newProduct.unit,
        min_stock: parseInt(newProduct.min_stock) || 10,
      })
      toast.success(`Producto "${newProduct.name}" agregado`)
      setNewProduct({ name: "", category: "", price: "", stock: "", unit: "unidades", min_stock: "10" })
      setShowAddProduct(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Error al crear producto")
    }
  }

  async function handleEditProduct() {
    if (!editingProduct) return
    try {
      await productsApi.update(editingProduct.id, {
        name: editingProduct.name,
        category: editingProduct.category,
        price: editingProduct.price,
        unit: editingProduct.unit,
        min_stock: editingProduct.min_stock,
      })
      toast.success(`Producto "${editingProduct.name}" actualizado`)
      setEditingProduct(null)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar producto")
    }
  }

  async function handleDeleteProduct(product: Product) {
    try {
      await productsApi.delete(product.id)
      toast.success(`Producto "${product.name}" eliminado`)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar producto")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            {(productsList ?? []).length} productos registrados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Add Product button */}
          {isAdmin && (
            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Agregar Nuevo Producto</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Nombre</Label>
                    <Input
                      placeholder="Nombre del producto"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="bg-secondary text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Categoria</Label>
                      <Input
                        placeholder="Ej: Plato Principal"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="bg-secondary text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Precio (COP)</Label>
                      <Input
                        type="number"
                        placeholder="25000"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="bg-secondary text-foreground"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Stock Inicial</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="bg-secondary text-foreground"
                        min="0"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Unidad</Label>
                      <Input
                        placeholder="unidades"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                        className="bg-secondary text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Stock Min.</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={newProduct.min_stock}
                        onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
                        className="bg-secondary text-foreground"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary" className="bg-secondary text-secondary-foreground">Cancelar</Button>
                  </DialogClose>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={handleAddProduct}
                  >
                    Agregar Producto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Entry dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <PackagePlus className="mr-2 h-4 w-4" />
                Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Entrada de Mercancia</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Producto</Label>
                  <Select value={entryProduct} onValueChange={setEntryProduct}>
                    <SelectTrigger className="bg-secondary text-foreground">
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(productsList ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="Cantidad entrante"
                    value={entryQty}
                    onChange={(e) => setEntryQty(e.target.value)}
                    className="bg-secondary text-foreground"
                    min="1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Notas</Label>
                  <Textarea
                    placeholder="Ej: Proveedor semanal..."
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    className="bg-secondary text-foreground"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary" className="bg-secondary text-secondary-foreground">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={handleEntry}
                  >
                    Registrar Entrada
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Merma dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                <PackageMinus className="mr-2 h-4 w-4" />
                Merma
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Merma</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Producto</Label>
                  <Select value={mermaProduct} onValueChange={setMermaProduct}>
                    <SelectTrigger className="bg-secondary text-foreground">
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(productsList ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="Cantidad perdida"
                    value={mermaQty}
                    onChange={(e) => setMermaQty(e.target.value)}
                    className="bg-secondary text-foreground"
                    min="1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Motivo</Label>
                  <Textarea
                    placeholder="Ej: Se danaron por temperatura..."
                    value={mermaNotes}
                    onChange={(e) => setMermaNotes(e.target.value)}
                    className="bg-secondary text-foreground"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary" className="bg-secondary text-secondary-foreground">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleMerma}
                  >
                    Registrar Merma
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            className="bg-secondary text-secondary-foreground"
            onClick={() => setViewMode(viewMode === "list" ? "chart" : "list")}
          >
            {viewMode === "list" ? (
              <><BarChart3 className="mr-2 h-4 w-4" />Ver Grafico</>
            ) : (
              <><Package className="mr-2 h-4 w-4" />Ver Lista</>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar en inventario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary pl-9 text-foreground"
        />
      </div>

      {viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {filtered.map((product) => {
            const level = getStockLevel(product)
            return (
              <Card key={product.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.category} - {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{product.stock}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{product.unit}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${getStockBgColor(level)}`}
                    >
                      {getStockLabel(level)}
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingProduct({ ...product })}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card text-foreground">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se desactivara &quot;{product.name}&quot; del inventario. Esta accion se puede revertir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary text-secondary-foreground">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDeleteProduct(product)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron productos
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Stock por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="oklch(0.6 0 0)" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={120} stroke="oklch(0.6 0 0)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.005 250)",
                      border: "1px solid oklch(0.28 0.005 250)",
                      borderRadius: "8px",
                      color: "oklch(0.97 0 0)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.level)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Producto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Nombre</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="bg-secondary text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Categoria</Label>
                  <Input
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Precio (COP)</Label>
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="bg-secondary text-foreground"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Unidad</Label>
                  <Input
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Stock Minimo</Label>
                  <Input
                    type="number"
                    value={editingProduct.min_stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_stock: parseInt(e.target.value) || 0 })}
                    className="bg-secondary text-foreground"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEditProduct}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
