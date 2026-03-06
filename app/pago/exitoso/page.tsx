"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ChefHat, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function ExitosoContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Pago exitoso!
        </h1>
        <p className="mb-1 text-muted-foreground">
          Tu pedido ha sido confirmado y esta en preparacion.
        </p>
        {sessionId && (
          <p className="mb-6 text-xs text-muted-foreground/60">
            Referencia: {sessionId.slice(0, 24)}...
          </p>
        )}
        {!sessionId && <div className="mb-6" />}

        <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">RestaurantOS</p>
              <p className="text-xs text-muted-foreground">Confirmacion de pedido</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
              Pago procesado correctamente
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
              Recibiras un correo de confirmacion
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
              Tu pedido esta en cola de preparacion
            </li>
          </ul>
        </div>

        <Link href="/menu">
          <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            Volver al menu
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
