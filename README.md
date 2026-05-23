# Musfi Hijab Shop — Business Management System

Full-stack web app for managing stock, sales, deliveries, and reports for Musfi Hijab Shop — importing from Malaysia, Dubai, and Bangalore.

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI + Python 3.11 + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 15 |
| Auth | Custom JWT (access + refresh tokens) |
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v3 + Framer Motion |
| State | Zustand + TanStack Query v5 |
| i18n | i18next (English + Tamil) |
| Charts | Recharts |

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### With Docker Compose

```bash
# Copy env
cp .env.example .env
# Edit .env with your LLM API key and a strong SECRET_KEY

# Start everything
docker-compose up --build

# Seed demo data (run once after startup)
curl -X POST http://localhost:8000/api/v1/admin/seed \
  -H "Authorization: Bearer <admin_token>"
```

Access:
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/api/docs
- Default admin: `admin@musfishop.com` / `Admin@123`

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL to point to local postgres

alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
```

## Features

| Feature | Details |
|---|---|
| Auth | JWT access (30min) + refresh tokens (7d), httpOnly cookie |
| RBAC | admin / sales / stock_manager — fine-grained per endpoint |
| Stock | CRUD, restock, movement audit log, low-stock alerts, CSV export |
| Sales | Multi-item cart, auto invoice `MSF-YYYY-NNNN`, profit tracking |
| Deliveries | Kanban-style status board (Pending → Delivered) |
| Reports | Revenue/profit charts, top items, country breakdown |
| AI Advisor | SSE-streamed chat with live shop context, Tamil support |
| i18n | Full English + Tamil translations |
| 404 | Animated hijab SVG, staggered 404 letters (Framer Motion) |

## API Docs

Available at `http://localhost:8000/api/docs` (Swagger UI) and `/api/redoc`.

## Production Deploy

```bash
cp .env.example .env
# Set strong SECRET_KEY, real DB password, LLM key, FRONTEND_URL

docker-compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
musfi-shop/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── models/   # SQLAlchemy ORM
│   │   ├── schemas/  # Pydantic v2
│   │   ├── routers/  # API endpoints
│   │   └── services/ # Business logic
│   └── alembic/      # DB migrations
└── frontend/         # React + TypeScript
    └── src/
        ├── pages/    # Route pages
        ├── components/
        ├── api/      # Axios + TanStack Query
        └── stores/   # Zustand
```
