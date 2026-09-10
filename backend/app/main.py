from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Organization, Resource, User, UserRole
from .schemas import HealthView, ReservationCreate, ReservationView, ResourceCreate, ResourceView, Token, UserCreate, UserView
from .security import create_token, current_user, hash_password, require_roles, verify_password
from .services import reserve_resource

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Community Resource Exchange API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health", response_model=HealthView)
def health(db: Session = Depends(get_db)):
    db.scalar(select(1))
    return {"status": "healthy", "database": "connected"}


@app.post("/auth/register", response_model=UserView, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(email=payload.email.lower(), full_name=payload.full_name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return Token(access_token=create_token(user))


@app.get("/me", response_model=UserView)
def me(user: User = Depends(current_user)):
    return user


@app.get("/resources", response_model=list[ResourceView])
def list_resources(category: str | None = None, city: str | None = None, available_only: bool = True, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    statement = select(Resource, Organization.name).join(Organization)
    if category:
        statement = statement.where(func.lower(Resource.category) == category.lower())
    if city:
        statement = statement.where(func.lower(Resource.city) == city.lower())
    if available_only:
        statement = statement.where(Resource.quantity_available > 0)
    rows = db.execute(statement.order_by(Resource.name).limit(limit).offset(offset)).all()
    return [ResourceView.model_validate(resource).model_copy(update={"organization_name": organization_name}) for resource, organization_name in rows]


@app.post("/resources", response_model=ResourceView, status_code=201)
def create_resource(payload: ResourceCreate, user: User = Depends(require_roles(UserRole.organization_admin, UserRole.platform_admin)), db: Session = Depends(get_db)):
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User is not connected to an organization")
    resource = Resource(organization_id=user.organization_id, **payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@app.post("/reservations", response_model=ReservationView, status_code=201)
def create_reservation(payload: ReservationCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return reserve_resource(db, user, payload.resource_id, payload.idempotency_key)
