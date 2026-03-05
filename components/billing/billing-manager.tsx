"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "sonner"
import { formatCurrency } from "@/lib/store"
import { invoices as invoicesApi, orders as ordersApi, type Invoice, type OrderItem } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function BillingManager() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [printing, setPrinting] = useState<number | null>(null)

  const { data: invoicesList } = useApi(
    () => invoicesApi.list({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    }),
    [statusFilter, search]
  )

  const filtered = invoicesList ?? []

  const totalEmitidas = filtered
    .filter((i) => i.status === "emitida")
    .reduce((sum, i) => sum + i.total, 0)
  const totalPendientes = filtered.filter((i) => i.status === "pendiente").length

  function buildInvoiceHtml(invoice: Invoice, order: { items: OrderItem[] }): string {
    return `<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"/>
      <title>Factura ${invoice.invoice_number}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#111}
        h1{font-size:22px;margin-bottom:4px}
        .meta{font-size:13px;color:#555;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        th,td{text-align:left;padding:8px 4px;border-bottom:1px solid #ddd}
        th{font-size:12px;text-transform:uppercase;color:#555}
        .total-row td{font-weight:bold;border-top:2px solid #111;font-size:16px}
        .footer{font-size:12px;color:#888}
      </style>
    </head><body>
      <h1>RestaurantOS</h1>
      <div class="meta">
        <strong>${invoice.invoice_number}</strong> &mdash;
        ${new Date(invoice.created_at).toLocaleDateString("es-CO")}<br/>
        Cliente: ${invoice.client_name}<br/>
        Ref DIAN: ${invoice.dian_ref}
      </div>
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${order.items.map((item: OrderItem) => `
            <tr>
              <td>${item.product_name}${item.notes ? ` (${item.notes})` : ""}</td>
              <td>${item.quantity}</td>
              <td>$${item.unit_price.toLocaleString("es-CO")}</td>
              <td>$${(item.quantity * item.unit_price).toLocaleString("es-CO")}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot><tr class="total-row"><td colspan="3">Total</td>
          <td>$${invoice.total.toLocaleString("es-CO")}</td></tr></tfoot>
      </table>
      <p class="footer">Generado por RestaurantOS &mdash; ${new Date().toLocaleString("es-CO")}</p>
    </body></html>`
  }

  async function handlePrint(invoice: Invoice) {
    setPrinting(invoice.id)
    try {
      const order = await ordersApi.get(invoice.order_id)
      const html = buildInvoiceHtml(invoice, order)
      const win = window.open("", "_blank", "width=800,height=600")
      if (!win) {
        toast.error("No se pudo abrir la ventana de impresion. Permite ventanas emergentes.")
        return
      }
      win.document.write(html)
      win.document.close()
      win.focus()
      win.print()
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la factura")
    } finally {
      setPrinting(null)
    }
  }

  async function handleDownload(invoice: Invoice) {
    setPrinting(invoice.id)
    try {
      const order = await ordersApi.get(invoice.order_id)
      const html = buildInvoiceHtml(invoice, order)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoice.invoice_number}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Factura ${invoice.invoice_number} descargada`)
    } catch (err: any) {
      toast.error(err.message || "Error al descargar la factura")
    } finally {
      setPrinting(null)
    }
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturacion</h1>
        <p className="text-sm text-muted-foreground">Gestion de facturas y documentos</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Facturado</div>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalEmitidas)}</p>
            <p className="text-xs text-muted-foreground">
              {filtered.filter((i) => i.status === "emitida").length} facturas emitidas
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Facturas Pendientes</div>
            <p className="mt-1 text-2xl font-bold text-warning">{totalPendientes}</p>
            <p className="text-xs text-muted-foreground">por procesar</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Facturas</div>
            <p className="mt-1 text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">registradas en el sistema</p>
          </CardContent>
        </Card>
      </div>

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

      <div className="flex flex-col gap-2">
        {filtered.map((invoice) => (
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
                    <span>{new Date(invoice.created_at).toLocaleDateString("es-CO")}</span>
                    {invoice.dian_ref && (
                      <span className="font-mono">Ref: {invoice.dian_ref}</span>
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
                  onClick={() => handlePrint(invoice)}
                  disabled={printing === invoice.id}
                  title="Imprimir factura"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleDownload(invoice)}
                  disabled={printing === invoice.id}
                  title="Descargar factura"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
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
