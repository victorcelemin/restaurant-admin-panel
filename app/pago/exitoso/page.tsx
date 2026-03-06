"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ChefHat, ArrowRight, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n)
}

function ExitosoContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const total = Number(searchParams.get("total") || "0")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          ¡Pedido confirmado!
        </h1>
        <p className="mb-6 text-muted-foreground">
          Tu pedido está en camino a cocina. Te avisamos cuando esté listo.
        </p>

        {/* Order card */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 text-left">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">RestaurantOS</p>
              <p className="text-xs text-muted-foreground">Confirmación de pedido</p>
            </div>
          </div>

          {orderNumber && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">Número de pedido</span>
              <span className="font-bold text-foreground text-lg tracking-wide">{orderNumber}</span>
            </div>
          )}

          {total > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">Total a pagar en caja</span>
              <span className="font-bold text-foreground">{formatCOP(total)}</span>
            </div>
          )}

          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              Pedido registrado y enviado a cocina
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              El pago se realiza en caja al retirar
            </li>
            <li className="flex items-center gap-2">
              <UtensilsCrossed className="h-3.5 w-3.5 text-green-500 shrink-0" />
              Tiempo estimado: 15–25 minutos
            </li>
          </ul>
        </div>

        <Link href="/menu">
          <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            Hacer otro pedido
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ExitosoContent />
    </Suspense>
  )
}
