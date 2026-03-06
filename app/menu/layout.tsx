import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menú | RestaurantOS",
  description: "Explora nuestro menú y realiza tu pedido en línea",
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
