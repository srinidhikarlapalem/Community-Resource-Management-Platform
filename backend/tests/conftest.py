import os

os.environ["DATABASE_URL"] = "sqlite:///./test_resources.db"
os.environ["SECRET_KEY"] = "test-secret"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def token(client):
    client.post("/auth/register", json={"email": "user@example.com", "password": "strong-password", "full_name": "Test User"})
    response = client.post("/auth/login", data={"username": "user@example.com", "password": "strong-password"})
    return response.json()["access_token"]
