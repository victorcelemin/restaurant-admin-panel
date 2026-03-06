import { redirect } from "next/navigation"

// Root redirects to the public restaurant menu
export default function RootPage() {
  redirect("/menu")
}
