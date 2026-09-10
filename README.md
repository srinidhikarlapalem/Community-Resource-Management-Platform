# Community Resource Management Platform

I built this application to make limited community services easier to find and safer to reserve. It connects people seeking support with verified organizations that manage food housing transportation and legal resources.

The main engineering challenge is protecting limited availability when requests arrive at the same time. The reservation service uses a database transaction and row level lock. An idempotency key prevents a repeated request from creating a duplicate reservation.

## What the application includes

* Resource search by category and city
* Availability tracking
* Account registration and secure password hashing
* Token based authentication
* Seeker organization administrator and platform administrator roles
* Transaction protected reservations
* Reservation history and cancellation
* Waitlists for unavailable resources
* Organization inventory management
* Resource creation and quantity updates
* Duplicate request protection
* Audit events
* Responsive React interface
* FastAPI documentation
* PostgreSQL persistence
* Automated backend tests
* Automated GitHub checks
* Docker development environment

## Architecture

The React and TypeScript client requests data from the FastAPI service. FastAPI validates each request and applies authorization rules. SQLAlchemy manages PostgreSQL persistence. Reservation creation locks the selected resource until the transaction completes. Audit events record important changes.

## Run the complete application

Install Docker Desktop. Then run the following command from the project folder.

```bash
docker compose up --build
```

Open the application at http://localhost:3000

Open the API documentation at http://localhost:8000/docs

Load the example organizations and resources with this command.

```bash
docker compose exec backend python -m app.seed
```

Use demo@example.com with demo-password to test the seeker experience.

Use partner@example.com with partner-password to test organization inventory management.

## Run the backend tests

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest
```

## Important design decisions

I use PostgreSQL in the complete environment because reservations require reliable transactions. SQLite remains available for simple local testing. I use PBKDF2 password hashing from the Python standard library. Access tokens expire after eight hours. The demonstration contains only synthetic organizations and resources.

## Project scope

This is a portfolio implementation rather than a production public benefits system. It uses synthetic demonstration data and does not store sensitive client records. Email delivery geospatial distance monitoring and cloud infrastructure are appropriate production extensions.
