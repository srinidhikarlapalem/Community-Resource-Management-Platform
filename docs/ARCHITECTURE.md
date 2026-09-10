# Architecture

## Request flow

1. The React client sends an HTTP request to FastAPI
2. FastAPI validates the request with Pydantic
3. Protected routes verify the signed access token
4. The service layer applies reservation rules
5. SQLAlchemy executes the database transaction
6. PostgreSQL stores the resource reservation and audit event
7. FastAPI returns a typed JSON response

## Reservation safety

The service checks for an existing idempotency key before changing inventory. It then selects the resource with a row level lock. The transaction reduces availability and inserts the reservation. A unique database constraint provides a second layer of duplicate protection.

## Production improvements

* Alembic database migrations
* Redis caching
* SQS background notifications
* OpenTelemetry traces
* CloudWatch alarms
* Terraform infrastructure
* Geographic search with PostGIS
* Rate limiting
* Refresh token rotation
* Accessibility testing with Playwright
