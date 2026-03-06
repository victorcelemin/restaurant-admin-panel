from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, products, orders, inventory, reports, invoices, payments
from app.routers import settings as settings_router

app_settings = get_settings()

app = FastAPI(
    title="RestaurantOS API",
    version="1.0.0",
    description="API backend para el panel administrativo de RestaurantOS",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_credentials=True,
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
app.include_router(payments.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
