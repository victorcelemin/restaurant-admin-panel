"""Seed the database with initial data for development/first deploy."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.product import Product
from app.models.settings import AppSettings
from app.security import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        # --- Users ---
        users = [
            User(username="admin", name="Juan Pablo", password_hash=hash_password("admin123"), role="administrador", shift="08:00 - 18:00", active=True),
            User(username="ana.garcia", name="Ana Garcia", password_hash=hash_password("cocina123"), role="cocinero", shift="09:00 - 17:00", active=True),
            User(username="luis.torres", name="Luis Torres", password_hash=hash_password("mesero123"), role="mesero", shift="10:00 - 20:00", active=True),
            User(username="sofia.ramirez", name="Sofia Ramirez", password_hash=hash_password("cajero123"), role="cajero", shift="14:00 - 22:00", active=True),
            User(username="diego.hdz", name="Diego Hernandez", password_hash=hash_password("cocina456"), role="cocinero", shift="14:00 - 22:00", active=False),
        ]
        db.add_all(users)
        db.flush()

        # --- Products ---
        products = [
            Product(name="Alitas Fritas (12 pz)", category="Plato Principal", price=25000, stock=95, unit="porciones", min_stock=20),
            Product(name="Alitas Fritas (6 pz)", category="Plato Principal", price=15000, stock=60, unit="porciones", min_stock=15),
            Product(name="Salsa BBQ", category="Salsa", price=2000, stock=40, unit="porciones", min_stock=10),
            Product(name="Salsa Picante", category="Salsa", price=2000, stock=5, unit="porciones", min_stock=10),
            Product(name="Salsa Miel-Mostaza", category="Salsa", price=2000, stock=35, unit="porciones", min_stock=10),
            Product(name="Papas Fritas", category="Acompanamiento", price=8000, stock=45, unit="porciones", min_stock=15),
            Product(name="Aros de Cebolla", category="Acompanamiento", price=9000, stock=0, unit="porciones", min_stock=10),
            Product(name="Cerveza Nacional", category="Bebida", price=5000, stock=120, unit="unidades", min_stock=30),
            Product(name="Gaseosa 350ml", category="Bebida", price=3000, stock=80, unit="unidades", min_stock=20),
            Product(name="Agua", category="Bebida", price=2000, stock=60, unit="unidades", min_stock=15),
            Product(name="Limonada Natural", category="Bebida", price=4000, stock=3, unit="vasos", min_stock=10),
            Product(name="Combo Familiar (24 pz + 2 Acomp.)", category="Combo", price=55000, stock=30, unit="combos", min_stock=8),
        ]
        db.add_all(products)
        db.flush()

        # --- App Settings ---
        settings = [
            AppSettings(key="iva_enabled", value="false"),
            AppSettings(key="iva_rate", value="19"),
        ]
        db.add_all(settings)

        db.commit()
        print("Database seeded successfully!")
        print("\nDefault admin credentials:")
        print("  Username: admin")
        print("  Password: admin123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
