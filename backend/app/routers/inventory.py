from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.stock_movement import StockMovement
from app.models.product import Product
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate, StockMovementOut
from app.security import get_current_user, require_role

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/movements", response_model=list[StockMovementOut])
def list_movements(
    product_id: int | None = Query(None),
    type: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(StockMovement).options(joinedload(StockMovement.product))
    if product_id:
        q = q.filter(StockMovement.product_id == product_id)
    if type:
        q = q.filter(StockMovement.type == type)
    movements = q.order_by(StockMovement.created_at.desc()).limit(limit).all()
    return [StockMovementOut.from_model(m) for m in movements]


@router.post("/movements", response_model=StockMovementOut, status_code=status.HTTP_201_CREATED)
def create_movement(
    data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrador", "cocinero")),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if data.type == "entrada":
        product.stock += data.quantity
    elif data.type == "merma":
        if product.stock < data.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para registrar merma (disponible: {product.stock})")
        product.stock -= data.quantity

    movement = StockMovement(
        product_id=data.product_id,
        type=data.type,
        quantity=data.quantity,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return StockMovementOut.from_model(movement)
