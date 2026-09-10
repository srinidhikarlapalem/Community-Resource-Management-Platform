from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import AuditEvent, Reservation, ReservationStatus, Resource, User


def reserve_resource(db: Session, user: User, resource_id: int, idempotency_key: str) -> Reservation:
    existing = db.scalar(select(Reservation).where(Reservation.user_id == user.id, Reservation.idempotency_key == idempotency_key))
    if existing:
        return existing

    resource = db.scalar(select(Resource).where(Resource.id == resource_id).with_for_update())
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    if resource.quantity_available < 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Resource is no longer available")

    resource.quantity_available -= 1
    reservation = Reservation(user_id=user.id, resource_id=resource.id, idempotency_key=idempotency_key, status=ReservationStatus.confirmed)
    db.add(reservation)
    try:
        db.flush()
        db.add(AuditEvent(actor_id=user.id, action="reservation_created", entity_type="resource", entity_id=resource.id, detail="Availability reduced by one"))
        db.commit()
    except IntegrityError:
        db.rollback()
        replay = db.scalar(select(Reservation).where(Reservation.user_id == user.id, Reservation.idempotency_key == idempotency_key))
        if replay:
            return replay
        raise
    db.refresh(reservation)
    return reservation
