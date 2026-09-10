from app.database import SessionLocal
from app.models import Organization, Resource


def test_health(client):
    assert client.get("/health").json() == {"status": "healthy", "database": "connected"}


def test_register_login_and_me(client, token):
    response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_reservation_is_idempotent_and_reduces_inventory_once(client, token):
    with SessionLocal() as db:
        organization = Organization(name="Test Center", description="Test", city="Boston", state="MA", verified=True)
        db.add(organization)
        db.flush()
        resource = Resource(organization_id=organization.id, name="Food box", category="Food", description="One box", city="Boston", state="MA", quantity_available=1)
        db.add(resource)
        db.commit()
        resource_id = resource.id
    request = {"resource_id": resource_id, "idempotency_key": "same-request-123"}
    first = client.post("/reservations", json=request, headers={"Authorization": f"Bearer {token}"})
    second = client.post("/reservations", json=request, headers={"Authorization": f"Bearer {token}"})
    assert first.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    with SessionLocal() as db:
        assert db.get(Resource, resource_id).quantity_available == 0


def test_unavailable_resource_returns_conflict(client, token):
    with SessionLocal() as db:
        organization = Organization(name="Center", description="Test", city="Boston", state="MA", verified=True)
        db.add(organization)
        db.flush()
        resource = Resource(organization_id=organization.id, name="Ride", category="Transportation", description="Ride", city="Boston", state="MA", quantity_available=0)
        db.add(resource)
        db.commit()
        resource_id = resource.id
    response = client.post("/reservations", json={"resource_id": resource_id, "idempotency_key": "unique-request-456"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 409
