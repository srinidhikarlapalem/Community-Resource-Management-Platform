from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Organization, Reservation, Resource, User, UserRole, WaitlistEntry
from .schemas import HealthView, ReservationCreate, ReservationView, ResourceCreate, ResourceUpdate, ResourceView, Token, UserCreate, UserView, WaitlistCreate, WaitlistView
from .security import create_token, current_user, hash_password, require_roles, verify_password
from .services import cancel_reservation, join_waitlist, reserve_resource

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Community Resource Exchange API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://srinidhikarlapalem.github.io",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.patch("/resources/{resource_id}", response_model=ResourceView)
def update_resource(resource_id: int, payload: ResourceUpdate, user: User = Depends(require_roles(UserRole.organization_admin, UserRole.platform_admin)), db: Session = Depends(get_db)):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if user.role != UserRole.platform_admin and resource.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Resource belongs to another organization")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


@app.get("/organization/resources", response_model=list[ResourceView])
def organization_resources(user: User = Depends(require_roles(UserRole.organization_admin, UserRole.platform_admin)), db: Session = Depends(get_db)):
    statement = select(Resource).where(Resource.organization_id == user.organization_id).order_by(Resource.name)
    return list(db.scalars(statement))


@app.post("/reservations", response_model=ReservationView, status_code=201)
def create_reservation(payload: ReservationCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return reserve_resource(db, user, payload.resource_id, payload.idempotency_key)


@app.get("/reservations/me", response_model=list[ReservationView])
def my_reservations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(Reservation, Resource.name).join(Resource).where(Reservation.user_id == user.id).order_by(Reservation.created_at.desc())).all()
    return [ReservationView.model_validate(item).model_copy(update={"resource_name": name}) for item, name in rows]


@app.post("/reservations/{reservation_id}/cancel", response_model=ReservationView)
def cancel_my_reservation(reservation_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return cancel_reservation(db, user, reservation_id)


@app.post("/waitlist", response_model=WaitlistView, status_code=201)
def create_waitlist_entry(payload: WaitlistCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return join_waitlist(db, user, payload.resource_id)


@app.get("/waitlist/me", response_model=list[WaitlistView])
def my_waitlist(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(WaitlistEntry, Resource.name).join(Resource).where(WaitlistEntry.user_id == user.id).order_by(WaitlistEntry.created_at.desc())).all()
    return [WaitlistView.model_validate(item).model_copy(update={"resource_name": name}) for item, name in rows]
