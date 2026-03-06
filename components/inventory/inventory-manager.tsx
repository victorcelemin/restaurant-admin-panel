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
  Search,
  PackagePlus,
  PackageMinus,
  BarChart3,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { products as productsApi, inventory, type Product } from "@/lib/api"
import { useApi } from "@/hooks/use-api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type StockLevel = "ok" | "low" | "critical" | "out"

function getStockLevel(product: Product): StockLevel {
  if (product.stock === 0) return "out"
  if (product.stock <= product.min_stock * 0.3) return "critical"
  if (product.stock <= product.min_stock) return "low"
  return "ok"
}

function getStockBgColor(level: StockLevel) {
  switch (level) {
    case "ok": return "bg-success/15 text-success"
    case "low": return "bg-warning/15 text-warning"
    case "critical": return "bg-destructive/15 text-destructive"
    case "out": return "bg-foreground/10 text-foreground"
  }
}

function getStockLabel(level: StockLevel) {
  switch (level) {
    case "ok": return "Normal"
    case "low": return "Bajo"
    case "critical": return "Critico"
    case "out": return "Sin Stock"
  }
}

function getBarColor(level: string) {
  switch (level) {
    case "ok": return "oklch(0.65 0.18 160)"
    case "low": return "oklch(0.80 0.18 85)"
    case "critical": return "oklch(0.55 0.22 27)"
    case "out": return "oklch(0.4 0 0)"
    default: return "oklch(0.65 0.18 160)"
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

export function InventoryManager() {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")
  const [entryProduct, setEntryProduct] = useState("")
  const [entryQty, setEntryQty] = useState("")
  const [entryNotes, setEntryNotes] = useState("")
  const [mermaProduct, setMermaProduct] = useState("")
  const [mermaQty, setMermaQty] = useState("")
  const [mermaNotes, setMermaNotes] = useState("")

  const { data: productsList, loading } = useApi(() => productsApi.list(), [])

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

  async function handleEntry() {
    if (!entryProduct || !entryQty) {
      toast.error("Selecciona un producto y cantidad")
      return
    }
    try {
      await inventory.createMovement({
        product_id: Number(entryProduct),
        type: "entrada",
        quantity: Number(entryQty),
        notes: entryNotes,
      })
      const name = (productsList ?? []).find((p) => String(p.id) === entryProduct)?.name
      toast.success(`Entrada registrada: +${entryQty} unidades de ${name}`)
      setEntryProduct("")
      setEntryQty("")
      setEntryNotes("")
    } catch (err: any) {
      toast.error(err.message || "Error al registrar entrada")
    }
  }

  async function handleMerma() {
    if (!mermaProduct || !mermaQty) {
      toast.error("Selecciona un producto y cantidad")
      return
    }
    try {
      await inventory.createMovement({
        product_id: Number(mermaProduct),
        type: "merma",
        quantity: Number(mermaQty),
        notes: mermaNotes,
      })
      const name = (productsList ?? []).find((p) => String(p.id) === mermaProduct)?.name
      toast.success(`Merma registrada: -${mermaQty} unidades de ${name}`)
      setMermaProduct("")
      setMermaQty("")
      setMermaNotes("")
    } catch (err: any) {
      toast.error(err.message || "Error al registrar merma")
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
          {/* Entry dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <PackagePlus className="mr-2 h-4 w-4" />
                Registrar Entrada
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
                Registrar Merma
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
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Grafico
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Ver Lista
              </>
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

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      )}

      {!loading && viewMode === "list" && (
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
      )}

      {!loading && viewMode === "chart" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Stock por Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="oklch(0.6 0 0)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    stroke="oklch(0.6 0 0)"
                    fontSize={11}
                  />
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
    </div>
  )
}
