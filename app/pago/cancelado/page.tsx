"use client"

import Link from "next/link"
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PagoCanceladoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Pago cancelado
        </h1>
        <p className="mb-8 text-muted-foreground">
          No se realizó ningún cargo. Puedes volver al menu y realizar tu pedido cuando quieras.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/menu">
            <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Volver al menu
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Reintentar pago
          </button>
        </div>
      </div>
    </div>
  )
}
