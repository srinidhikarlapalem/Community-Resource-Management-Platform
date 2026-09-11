# Community Resource Management Platform

I built this application to make Greater Boston community services easier to find and understand. It connects people with official food housing healthcare transportation legal and family support resources while preserving a complete demonstration backend for account and inventory workflows.

The main engineering challenge is protecting limited availability when requests arrive at the same time. The reservation service uses a database transaction and row level lock. An idempotency key prevents a repeated request from creating a duplicate reservation.

## What the application includes

* Search across Boston Cambridge Somerville Chelsea and Greater Boston
* Verified provider directory with official organization links
* Filters for service type location and access format
* Detailed service views with eligibility location contact options and next steps
* Saved resources and shareable listings
* Emergency guidance for 911 988 and Massachusetts 211
* Account registration and secure password hashing
* Token based authentication
* Seeker organization administrator and platform administrator roles
* Transaction protected reservations
* Confirmation references plus reservation history and cancellation
* Waitlists for unavailable resources
* Visible waitlist history
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
