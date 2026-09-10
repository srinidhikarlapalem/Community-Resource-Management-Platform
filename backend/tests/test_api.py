from app.database import SessionLocal
from app.models import Organization, Resource, User, UserRole
from app.security import hash_password


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


def test_cancel_reservation_restores_inventory(client, token):
    with SessionLocal() as db:
        organization = Organization(name="Cancel Center", description="Test", city="Boston", state="MA", verified=True)
        db.add(organization)
        db.flush()
        resource = Resource(organization_id=organization.id, name="Meal", category="Food", description="A prepared meal", city="Boston", state="MA", quantity_available=1)
        db.add(resource)
        db.commit()
        resource_id = resource.id
    created = client.post("/reservations", json={"resource_id": resource_id, "idempotency_key": "cancel-request-123"}, headers={"Authorization": f"Bearer {token}"})
    cancelled = client.post(f"/reservations/{created.json()['id']}/cancel", headers={"Authorization": f"Bearer {token}"})
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    with SessionLocal() as db:
        assert db.get(Resource, resource_id).quantity_available == 1


def test_waitlist_is_idempotent(client, token):
    with SessionLocal() as db:
        organization = Organization(name="Waitlist Center", description="Test", city="Boston", state="MA", verified=True)
        db.add(organization)
        db.flush()
        resource = Resource(organization_id=organization.id, name="Housing intake", category="Housing", description="Housing intake session", city="Boston", state="MA", quantity_available=0)
        db.add(resource)
        db.commit()
        resource_id = resource.id
    first = client.post("/waitlist", json={"resource_id": resource_id}, headers={"Authorization": f"Bearer {token}"})
    second = client.post("/waitlist", json={"resource_id": resource_id}, headers={"Authorization": f"Bearer {token}"})
    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert client.get("/waitlist/me", headers={"Authorization": f"Bearer {token}"}).json()[0]["resource_name"] == "Housing intake"


def test_organization_admin_can_manage_only_own_inventory(client):
    with SessionLocal() as db:
        own = Organization(name="Partner", description="Test", city="Boston", state="MA", verified=True)
        other = Organization(name="Other", description="Test", city="Boston", state="MA", verified=True)
        db.add_all([own, other])
        db.flush()
        db.add(User(email="partner@example.com", full_name="Partner User", password_hash=hash_password("partner-password"), role=UserRole.organization_admin, organization_id=own.id))
        outside = Resource(organization_id=other.id, name="Outside", category="Food", description="Outside resource", city="Boston", state="MA", quantity_available=2)
        db.add(outside)
        db.commit()
        outside_id = outside.id
    login = client.post("/auth/login", data={"username": "partner@example.com", "password": "partner-password"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    created = client.post("/resources", json={"name":"New pantry","category":"Food","description":"Weekly pantry pickup","city":"Boston","state":"MA","quantity_available":5,"eligibility":"Open to residents"}, headers=headers)
    assert created.status_code == 201
    assert client.patch(f"/resources/{outside_id}", json={"quantity_available": 10}, headers=headers).status_code == 403
