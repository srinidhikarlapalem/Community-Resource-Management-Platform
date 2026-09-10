from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import AuditEvent, Reservation, ReservationStatus, Resource, User, WaitlistEntry, WaitlistStatus


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


def cancel_reservation(db: Session, user: User, reservation_id: int) -> Reservation:
    reservation = db.scalar(select(Reservation).where(Reservation.id == reservation_id, Reservation.user_id == user.id).with_for_update())
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status == ReservationStatus.cancelled:
        return reservation
    resource = db.scalar(select(Resource).where(Resource.id == reservation.resource_id).with_for_update())
    reservation.status = ReservationStatus.cancelled
    resource.quantity_available += 1
    db.add(AuditEvent(actor_id=user.id, action="reservation_cancelled", entity_type="reservation", entity_id=reservation.id, detail="Availability returned"))
    db.commit()
    db.refresh(reservation)
    return reservation


def join_waitlist(db: Session, user: User, resource_id: int) -> WaitlistEntry:
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.quantity_available > 0:
        raise HTTPException(status_code=409, detail="Resource is available for reservation")
    existing = db.scalar(select(WaitlistEntry).where(WaitlistEntry.user_id == user.id, WaitlistEntry.resource_id == resource_id))
    if existing:
        return existing
    entry = WaitlistEntry(user_id=user.id, resource_id=resource_id, status=WaitlistStatus.waiting)
    db.add(entry)
    db.flush()
    db.add(AuditEvent(actor_id=user.id, action="waitlist_joined", entity_type="resource", entity_id=resource_id, detail="User joined the waitlist"))
    db.commit()
    db.refresh(entry)
    return entry
