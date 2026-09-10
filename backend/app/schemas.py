from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import ReservationStatus, UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)


class UserView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=2)
    quantity_available: int = Field(ge=0)
    eligibility: str = "Open to all"


class ResourceView(ResourceCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    organization_id: int
    organization_name: str | None = None


class ReservationCreate(BaseModel):
    resource_id: int
    idempotency_key: str = Field(min_length=8, max_length=80)


class ReservationView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resource_id: int
    status: ReservationStatus
    created_at: datetime


class HealthView(BaseModel):
    status: str
    database: str
