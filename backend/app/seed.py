from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .models import Organization, Resource, User, UserRole
from .security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(Organization.id).limit(1)):
            return
        organizations = [
            Organization(name="Boston Community Network", description="Food and transportation support", city="Boston", state="MA", verified=True),
            Organization(name="Harbor Family Center", description="Housing and legal navigation", city="Cambridge", state="MA", verified=True),
        ]
        db.add_all(organizations)
        db.flush()
        db.add_all([
            Resource(organization_id=organizations[0].id, name="Weekly grocery package", category="Food", description="Fresh groceries for one household", city="Boston", state="MA", quantity_available=18, eligibility="Boston area residents"),
            Resource(organization_id=organizations[0].id, name="Medical appointment ride", category="Transportation", description="Round trip transportation to a medical appointment", city="Boston", state="MA", quantity_available=6, eligibility="Advance reservation required"),
            Resource(organization_id=organizations[1].id, name="Housing navigation session", category="Housing", description="One on one support locating temporary housing", city="Cambridge", state="MA", quantity_available=4, eligibility="Open to Massachusetts residents"),
            Resource(organization_id=organizations[1].id, name="Legal consultation", category="Legal", description="Initial consultation with a volunteer advocate", city="Cambridge", state="MA", quantity_available=3, eligibility="Appointment required"),
        ])
        db.add(User(email="demo@example.com", full_name="Demo User", password_hash=hash_password("demo-password"), role=UserRole.seeker))
        db.commit()


if __name__ == "__main__":
    seed()
