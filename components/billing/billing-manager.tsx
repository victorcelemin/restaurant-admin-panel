"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { invoices as invoicesApi } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

function getInvoiceStatusIcon(status: string) {
  switch (status) {
    case "emitida": return <CheckCircle2 className="h-4 w-4 text-success" />
    case "pendiente": return <Clock className="h-4 w-4 text-warning" />
    case "anulada": return <AlertCircle className="h-4 w-4 text-destructive" />
    default: return null
  }
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case "emitida": return "bg-success/15 text-success"
    case "pendiente": return "bg-warning/15 text-warning"
    case "anulada": return "bg-destructive/15 text-destructive"
    default: return ""
  }
}

export function BillingManager() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: invoicesList, loading } = useApi(() => invoicesApi.list(), [])

  const filtered = (invoicesList ?? []).filter((inv) => {
    const matchesSearch =
      inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalEmitidas = (invoicesList ?? [])
    .filter((i) => i.status === "emitida")
    .reduce((sum, i) => sum + i.total, 0)
  const totalPendientes = (invoicesList ?? []).filter((i) => i.status === "pendiente").length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturacion</h1>
        <p className="text-sm text-muted-foreground">
          Gestion de facturas y documentos DIAN
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Facturado</div>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalEmitidas)}</p>
            <p className="text-xs text-muted-foreground">
              {(invoicesList ?? []).filter((i) => i.status === "emitida").length} facturas emitidas
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Facturas Pendientes</div>
            <p className="mt-1 text-2xl font-bold text-warning">{totalPendientes}</p>
            <p className="text-xs text-muted-foreground">por emitir ante DIAN</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Estado DIAN</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-sm font-medium text-success">Conectado</span>
            </div>
            <p className="text-xs text-muted-foreground">Resolucion vigente</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar factura o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-9 text-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-secondary text-foreground sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="emitida">Emitidas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="anulada">Anuladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      <div className="flex flex-col gap-2">
        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        )}
        {!loading && filtered.map((invoice) => (
          <Card key={invoice.id} className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {invoice.invoice_number}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getInvoiceStatusColor(invoice.status)}`}
                    >
                      {getInvoiceStatusIcon(invoice.status)}
                      <span className="ml-1 capitalize">{invoice.status}</span>
                    </Badge>
                  </div>
                  <span className="text-sm text-foreground">{invoice.client_name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(invoice.created_at).toLocaleDateString("es-CO")}
                    </span>
                    {invoice.dian_ref && (
                      <span className="font-mono text-xs text-muted-foreground">
                        Ref: {invoice.dian_ref}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(invoice.total)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Printer className="h-4 w-4" />
                  <span className="sr-only">Imprimir</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Descargar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron facturas
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
