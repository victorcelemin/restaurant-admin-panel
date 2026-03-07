from pydantic import BaseModel, Field
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., pattern="^(administrador|cocinero|mesero|cajero)$")
    shift: str = Field(default="", max_length=30)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    role: str | None = Field(None, pattern="^(administrador|cocinero|mesero|cajero)$")
    shift: str | None = Field(None, max_length=30)
    active: bool | None = None
    password: str | None = Field(None, min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    role: str
    active: bool
    shift: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    # Length limits prevent bcrypt CPU-exhaustion DoS (bcrypt truncates at 72 bytes
    # but Python still loads the full string; large inputs waste server time).
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)
