// ALWAYS use the local Next.js proxy route — never call Railway directly from the browser.
// This avoids all CORS issues. The proxy at /api/proxy/[...path] forwards to Railway server-side.
// Works in both local dev (Next.js dev server proxies) and production (Vercel serverless).
//
// PATH CONVENTION: paths here do NOT include /api/ prefix.
// The proxy route handler already prepends /api/ when forwarding to Railway.
// e.g. request("/auth/login") → fetch("/api/proxy/auth/login") → Railway /api/auth/login
const API_BASE = "/api/proxy"

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Solo redirigir a login si no estamos en rutas públicas
      const publicPaths = ["/menu", "/pago", "/login"]
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p))
      if (!isPublic) {
        window.location.href = "/login"
      }
    }
    throw new ApiError("No autorizado", 401)
  }

  if (!res.ok) {
    let errorDetail = `Error ${res.status}`
    let responseBody = ''
    try {
      const text = await res.text()
      responseBody = text
      try {
        const body = JSON.parse(text)
        errorDetail = body.detail || errorDetail
      } catch {
        // not JSON
        if (text) errorDetail = text.substring(0, 200)
      }
    } catch {
      // ignore
    }
    console.error(`API Error ${res.status}:`, responseBody)
    throw new ApiError(errorDetail, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// --- Auth ---
export interface User {
  id: number
  username: string
  name: string
  role: string
  active: boolean
  shift: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const auth = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>("/auth/me"),
  register: (data: { username: string; name: string; password: string; role: string; shift: string }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// --- Products ---
export interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  unit: string
  min_stock: number
  active: boolean
  created_at: string
}

// Public menu products — goes through a Next.js route handler that handles auth internally
export async function fetchMenuProducts(params?: { active_only?: boolean; category?: string; search?: string }): Promise<Product[]> {
  const qs = new URLSearchParams()
  if (params?.active_only !== undefined) qs.set("active_only", String(params.active_only))
  if (params?.category) qs.set("category", params.category)
  if (params?.search) qs.set("search", params.search)
  const res = await fetch(`/api/menu/products?${qs}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export const products = {
  list: (params?: { active_only?: boolean; category?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.active_only !== undefined) qs.set("active_only", String(params.active_only))
    if (params?.category) qs.set("category", params.category)
    if (params?.search) qs.set("search", params.search)
    return request<Product[]>(`/products?${qs}`)
  },
  get: (id: number) => request<Product>(`/products/${id}`),
  create: (data: { name: string; category: string; price: number; stock: number; unit: string; min_stock: number }) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; category: string; price: number; stock: number; unit: string; min_stock: number; active: boolean }>) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/products/${id}`, { method: "DELETE" }),
  categories: () => request<string[]>("/products/categories"),
}

// --- Orders ---
export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  notes: string
}

export interface Order {
  id: number
  order_number: string
  client_name: string
  payment_method: string
  notes: string
  total: number
  status: string
  created_by: number
  created_at: string
  items: OrderItem[]
}

export const orders = {
  list: (params?: { status?: string; search?: string; date?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set("status", params.status)
    if (params?.search) qs.set("search", params.search)
    if (params?.date) qs.set("date", params.date)
    return request<Order[]>(`/orders?${qs}`)
  },
  get: (id: number) => request<Order>(`/orders/${id}`),
  create: (data: { client_name: string; payment_method: string; notes: string; items: { product_id: number; quantity: number; notes: string }[] }) =>
    request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
}

// --- Inventory ---
export interface StockMovement {
  id: number
  product_id: number
  product_name: string
  type: string
  quantity: number
  notes: string
  created_by: number
  created_at: string
}

export const inventory = {
  movements: (params?: { product_id?: number; type?: string }) => {
    const qs = new URLSearchParams()
    if (params?.product_id) qs.set("product_id", String(params.product_id))
    if (params?.type) qs.set("type", params.type)
    return request<StockMovement[]>(`/inventory/movements?${qs}`)
  },
  createMovement: (data: { product_id: number; type: string; quantity: number; notes: string }) =>
    request<StockMovement>("/inventory/movements", { method: "POST", body: JSON.stringify(data) }),
}

// --- Reports ---
export interface DailyReport {
  date: string
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  total_sales: number
  average_ticket: number
}

export interface WeeklySales {
  day: string
  orders: number
  sales: number
}

export interface DailyCloseData {
  id: number
  date: string
  total_orders: number
  total_sales: number
  closed_by: number
  closed_at: string
}

export const reports = {
  daily: () => request<DailyReport>("/reports/daily"),
  weekly: () => request<WeeklySales[]>("/reports/weekly"),
  closeDay: () => request<DailyCloseData>("/reports/close-day", { method: "POST" }),
  closes: () => request<DailyCloseData[]>("/reports/closes"),
}

// --- Invoices ---
export interface Invoice {
  id: number
  invoice_number: string
  order_id: number
  client_name: string
  total: number
  status: string
  dian_ref: string
  created_at: string
}

export const invoices = {
  list: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set("status", params.status)
    if (params?.search) qs.set("search", params.search)
    return request<Invoice[]>(`/invoices?${qs}`)
  },
}

// --- Users ---
export const users = {
  list: () => request<User[]>("/users"),
  get: (id: number) => request<User>(`/users/${id}`),
  update: (id: number, data: Partial<{ name: string; role: string; shift: string; active: boolean; password: string }>) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),
}

// --- Settings ---
export const settings = {
  get: () => request<Record<string, string>>("/settings"),
  update: (key: string, value: string) =>
    request<{ key: string; value: string }>("/settings", { method: "PUT", body: JSON.stringify({ key, value }) }),
}

export { ApiError }
