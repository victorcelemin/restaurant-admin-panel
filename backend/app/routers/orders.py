import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, timedelta

from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderOut, OrderCreate, OrderStatusUpdate
from app.security import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _next_order_number(db: Session) -> str:
    last = db.query(Order).order_by(Order.id.desc()).first()
    num = 1 if not last else int(last.order_number.split("-")[1]) + 1
    return f"ORD-{num:03d}"


@router.get("/", response_model=list[OrderOut])
def list_orders(
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    date_filter: date | None = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Order).options(joinedload(Order.items))
    if status_filter:
        q = q.filter(Order.status == status_filter)
    if search:
        q = q.filter(
            (Order.client_name.ilike(f"%{search}%")) | (Order.order_number.ilike(f"%{search}%"))
        )
    if date_filter:
        q = q.filter(func.date(Order.created_at) == date_filter)
    return [OrderOut.model_validate(o) for o in q.order_by(Order.created_at.desc()).all()]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return OrderOut.model_validate(order)


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrador", "cajero", "mesero")),
):
    total = 0.0
    order_items = []
    stock_changes: list[tuple[Product, int]] = []

    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id, Product.active == True).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto ID {item_data.product_id} no encontrado o inactivo")
        if product.stock < item_data.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{product.name}' (disponible: {product.stock})")

        line_total = product.price * item_data.quantity
        total += line_total

        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item_data.quantity,
            unit_price=product.price,
            notes=item_data.notes,
        ))
        stock_changes.append((product, item_data.quantity))

    for product, qty in stock_changes:
        product.stock -= qty

    order = Order(
        order_number=_next_order_number(db),
        client_name=data.client_name,
        payment_method=data.payment_method,
        notes=data.notes,
        total=total,
        status="pendiente",
        created_by=current_user.id,
        items=order_items,
    )
    db.add(order)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar el pedido. Intente de nuevo.")
    db.refresh(order)
    return OrderOut.model_validate(order)


def _next_invoice_number(db: Session) -> str:
    last = db.query(Invoice).order_by(Invoice.id.desc()).first()
    num = 1 if not last else int(last.invoice_number.split("-")[1]) + 1
    return f"FAC-{num:04d}"


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    valid_transitions = {
        "pendiente": ["en_preparacion", "cancelado"],
        "en_preparacion": ["completado", "cancelado"],
        "completado": [],
        "cancelado": [],
    }

    if data.status not in valid_transitions.get(order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Transicion de estado invalida: {order.status} -> {data.status}",
        )

    if data.status == "cancelado" and order.status != "completado":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    order.status = data.status
    if data.status == "completado":
        existing_invoice = db.query(Invoice).filter(Invoice.order_id == order.id).first()
        if not existing_invoice:
            db.add(Invoice(
                invoice_number=_next_invoice_number(db),
                order_id=order.id,
                client_name=order.client_name,
                total=order.total,
                status="emitida",
                dian_ref=f"DIAN-{secrets.token_hex(4).upper()}",
            ))
    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order)
