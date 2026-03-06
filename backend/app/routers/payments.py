import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import List

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Stripe is optional — only initialized if STRIPE_SECRET_KEY is set
_stripe = None


def get_stripe():
    global _stripe
    if _stripe is None:
        import stripe as _stripe_module
        key = os.getenv("STRIPE_SECRET_KEY")
        if not key:
            raise HTTPException(
                status_code=503,
                detail="Stripe no está configurado. Agrega STRIPE_SECRET_KEY al entorno.",
            )
        _stripe_module.api_key = key
        _stripe = _stripe_module
    return _stripe


class CheckoutItem(BaseModel):
    name: str
    price: float  # price in COP (whole number)
    quantity: int


class CreateCheckoutSessionRequest(BaseModel):
    items: List[CheckoutItem]
    customer_name: str
    customer_email: str
    success_url: str
    cancel_url: str


@router.post("/create-checkout-session")
def create_checkout_session(body: CreateCheckoutSessionRequest):
    stripe = get_stripe()

    line_items = [
        {
            "price_data": {
                "currency": "cop",
                "product_data": {"name": item.name},
                # Stripe expects amount in the smallest currency unit.
                # COP has no subunits so 1 COP = 1 unit.
                "unit_amount": int(item.price),
            },
            "quantity": item.quantity,
        }
        for item in body.items
    ]

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            customer_email=body.customer_email,
            metadata={"customer_name": body.customer_name},
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": session.url, "session_id": session.id}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (optional — for order status updates)."""
    stripe = get_stripe()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        import json
        event = json.loads(payload)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # TODO: create order in DB using session metadata
        print(f"[Stripe] Payment completed for session {session['id']}")

    return {"received": True}
