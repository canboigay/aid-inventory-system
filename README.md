# Aid Inventory & Distribution Tracking System

A full-stack web application for tracking humanitarian aid inventory, in-house production, purchases, and distributions.

## Features

- **Dashboard** with quick-entry forms for:
  - Recording production (in-house products made)
  - Recording purchases (bulk items received)
  - Recording distributions (aid sent out)
- **Real-time inventory tracking** with automatic stock level updates
- **Low-stock alerts** for items below minimum thresholds
- **Role-based access control** (Admin, Warehouse Staff, Production Staff, Distribution Coordinator)
- **Complete audit trail** of all inventory movements
- **Distribution types**: Weekly packages, crisis aid, school deliveries, boarding homes, large aid drops

## Tech Stack

### Backend
- Python 3.11+ with FastAPI
- PostgreSQL database
- SQLAlchemy ORM
- Alembic for migrations
- JWT authentication

### Frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS
- React Router
- Axios for API calls

## Quick Start with Docker

1. Clone the repository and navigate to the project:
```bash
cd aid-inventory-system
```

2. Start the application with Docker Compose:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

4. Create an admin user (Python shell in backend container):
```bash
docker-compose exec backend python
```
```python
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    username="admin",
    email="admin@example.com",
    password_hash=get_password_hash("admin123"),
    role=UserRole.ADMIN,
    full_name="System Administrator"
)
db.add(admin)
db.commit()
exit()
```

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

6. Login with:
   - Username: `admin`
   - Password: `admin123`

## Development Setup (Without Docker)

### Backend

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up PostgreSQL database and update `.env`:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start the backend:
```bash
uvicorn app.main:app --reload
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Usage

### Dashboard Quick Entry

The dashboard provides three quick-entry forms for daily operations:

1. **Record Production**: Track items manufactured in-house (soap, shampoo, soy milk, etc.)
2. **Record Purchase**: Log bulk purchases and incoming supplies
3. **Record Distribution**: Track outgoing aid packages with distribution type

All operations automatically update inventory levels and create audit trail entries.

### Adding New Items

Items must be added through the API or database initially. Use the API documentation at http://localhost:8000/docs to create items with:
- Name, description, category
- Unit of measure (kg, liters, units, bags, etc.)
- Minimum stock level for alerts
- Optional SKU

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/me` - Get current user info

### Items
- `GET /api/items` - List all items
- `POST /api/items` - Create new item
- `GET /api/items/{id}` - Get item details
- `PATCH /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

### Quick Entry
- `POST /api/quick/production` - Record production
- `POST /api/quick/purchase` - Record purchase
- `POST /api/quick/distribution` - Record distribution
- `GET /api/quick/dashboard/stats` - Get dashboard statistics

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS configuration for frontend
- Environment-based configuration

## Deployment

### Production Checklist

1. Update environment variables:
   - Generate secure `SECRET_KEY`
   - Update `DATABASE_URL` for production database
   - Set `DEBUG=False`
   - Configure `ALLOWED_ORIGINS`

2. Use managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)

3. Deploy using:
   - Docker containers on AWS ECS, DigitalOcean App Platform, or Railway
   - Or traditional VPS with nginx reverse proxy

4. Set up SSL/TLS certificates (Let's Encrypt)

5. Configure backups for PostgreSQL database

## License

Proprietary - For humanitarian aid organization use only
