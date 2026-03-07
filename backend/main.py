from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, products, orders, inventory, reports, invoices
from app.routers import settings as settings_router

app_settings = get_settings()

# Rate limiter — uses client IP as the key identifier.
# The `limiter` instance is attached to app.state so routers can import it.
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="RestaurantOS API",
    version="1.0.0",
    description="API backend para el panel administrativo de RestaurantOS",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow all origins — the frontend is a public-facing SPA on Vercel.
# Credentials (cookies) are not used for cross-origin auth; JWT is sent via Bearer header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Auto-seed on startup if DB is empty
try:
    from seed import seed
    seed()
except Exception:
    pass  # Already seeded or seed failed non-critically

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(reports.router)
app.include_router(invoices.router)
app.include_router(settings_router.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
